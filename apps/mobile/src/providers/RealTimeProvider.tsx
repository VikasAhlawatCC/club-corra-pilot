import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { AppState, AppStateStatus } from 'react-native';
import { io, Socket } from 'socket.io-client';
import { environment } from '../config/environment';
import { useCoinsStore } from '../stores/coins.store';
import { useTransactionsStore } from '../stores/transactions.store';

// Conditionally import notifications to avoid Expo Go warnings
let Notifications: any = null;
try {
  Notifications = require('expo-notifications');
} catch (error) {
  console.log('Notifications not available (likely running in Expo Go)');
}

interface RealTimeContextType {
  isConnected: boolean;
  connectionStatus: 'connecting' | 'connected' | 'disconnected' | 'error';
  lastMessage: any;
  sendMessage: (message: any) => void;
  reconnect: () => void;
}

const RealTimeContext = createContext<RealTimeContextType | undefined>(undefined);

interface RealTimeProviderProps {
  children: React.ReactNode;
}

export function RealTimeProvider({ children }: RealTimeProviderProps) {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'error'>('disconnected');
  const [lastMessage, setLastMessage] = useState<any>(null);
  
  const socketRef = useRef<Socket | null>(null);
  const reconnectTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const healthCheckTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  // Socket.IO URL from environment (convert ws:// to http:// for Socket.IO)
  // For Socket.IO, we need to use the base URL without the /api/v1 prefix
  const socketUrl = environment.wsUrl ? 
    environment.wsUrl.replace('/api/v1', '').replace('ws://', 'http://').replace('wss://', 'https://') : 
    'http://192.168.1.4:3001'; // Fallback to network IP for development

  useEffect(() => {
    setupNotifications();
    
    // Only connect to WebSocket if we're in a proper environment
    if (environment.environment === 'development' || environment.environment === 'production') {
      connectWebSocket();
    } else {
      console.log('Skipping WebSocket connection in current environment:', environment.environment);
    }
    
    // Log current configuration for debugging
    console.log('RealTimeProvider initialized with:', {
      socketUrl,
      apiBaseUrl: environment.apiBaseUrl,
      environment: environment.environment,
      debugMode: environment.debugMode
    });
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      try {
        subscription?.remove();
        cleanupWebSocket();
      } catch (error) {
        console.error('Error during RealTimeProvider cleanup:', error);
      }
    };
  }, []);

  const setupNotifications = async () => {
    // Skip if notifications are not available
    if (!Notifications) {
      console.log('Notifications not available - skipping setup');
      return;
    }

    try {
      const { status: existingStatus } = await Notifications.getPermissionsAsync();
      let finalStatus = existingStatus;
      
      if (existingStatus !== 'granted') {
        const { status } = await Notifications.requestPermissionsAsync();
        finalStatus = status;
      }
      
      if (finalStatus !== 'granted') {
        console.log('Failed to get push token for push notification!');
        return;
      }
    } catch (error) {
      console.error('Error setting up notifications:', error);
    }
  };

  const setupSocketEventListeners = (socket: Socket) => {
    socket.on('connect', () => {
      console.log('Socket.IO connected successfully');
      setIsConnected(true);
      setConnectionStatus('connected');
      reconnectAttempts.current = 0;
      
      // Log connection details
      console.log('Socket.IO connection details:', {
        id: socket.id,
        transport: socket.io.engine.transport.name,
        readyState: socket.io.engine.readyState
      });
      
      // Send authentication message if user is logged in
      sendAuthMessage();
      
      // Start health check after successful connection
      startHealthCheck();
    });

    socket.on('disconnect', (reason) => {
      console.log('Socket.IO disconnected:', reason);
      setIsConnected(false);
      setConnectionStatus('disconnected');
      
      // Log disconnect details with safety checks
      try {
        const transportName = socket.io?.engine?.transport?.name || 'unknown';
        console.log('Socket.IO disconnect details:', {
          reason,
          wasConnected: socket.connected || false,
          transport: transportName
        });
      } catch (error) {
        console.log('Socket.IO disconnect details (error getting transport):', {
          reason,
          wasConnected: false
        });
      }
      
      // Attempt to reconnect if not a clean disconnect
      if (reason !== 'io client disconnect') {
        console.log('Scheduling reconnect due to disconnect reason:', reason);
        scheduleReconnect();
      } else {
        console.log('Clean disconnect - not scheduling reconnect');
      }
    });

    socket.on('connect_error', (error) => {
      console.error('Socket.IO connection error:', error);
      setConnectionStatus('error');
      setIsConnected(false);
      
      // Log more details about the error
      if (error.message) {
        console.error('Connection error message:', error.message);
      }
      // Log additional error details if available
      console.error('Connection error details:', error);
      console.error('Connection error type:', typeof error);
      console.error('Connection error stack:', error.stack);
      
      // Check if it's a network-related error
      if (error.message && (
        error.message.includes('Network Error') ||
        error.message.includes('websocket error') ||
        error.message.includes('Connection refused') ||
        error.message.includes('ECONNREFUSED')
      )) {
        console.log('Network-related error detected - server might not be running');
        // Don't retry immediately for network errors
        setTimeout(() => {
          if (connectionStatus === 'error') {
            scheduleReconnect();
          }
        }, 5000); // Wait 5 seconds before retrying
      } else {
        // For other errors, let Socket.IO handle reconnection
        console.log('Non-network error - letting Socket.IO handle reconnection');
      }
    });

    // Add transport upgrade event listener
    socket.on('upgrade', () => {
      console.log('Socket.IO transport upgraded to WebSocket');
    });

    // Add transport error event listener
    socket.on('upgradeError', (error) => {
      console.error('Socket.IO transport upgrade error:', error);
    });

    // Add connection timeout handler
    socket.on('connect_timeout', () => {
      console.error('Socket.IO connection timeout');
      setConnectionStatus('error');
      setIsConnected(false);
    });

    // Add reconnection attempt handler
    socket.on('reconnect_attempt', (attemptNumber) => {
      console.log(`Socket.IO reconnection attempt ${attemptNumber}`);
      setConnectionStatus('connecting');
    });

    // Add reconnection failed handler
    socket.on('reconnect_failed', () => {
      console.error('Socket.IO reconnection failed after all attempts');
      setConnectionStatus('error');
      setIsConnected(false);
      // Now schedule manual reconnect
      scheduleReconnect();
    });

    // Listen for real-time updates
    socket.on('balance_updated', (data) => {
      handleBalanceUpdate(data);
    });

    socket.on('transaction_status_changed', (data) => {
      handleTransactionStatusChange(data);
    });

    socket.on('notification_received', (data) => {
      handleNotificationReceived(data);
    });

    // Listen for pong response from server
    socket.on('pong', (data) => {
      console.log('Health check response received:', data);
    });
  };

  const connectWebSocket = () => {
    try {
      // Skip Socket.IO connection if no URL is configured
      if (!socketUrl) {
        console.log('Socket.IO URL not configured - skipping connection');
        setConnectionStatus('disconnected');
        return;
      }

      // Validate the URL format
      try {
        new URL(socketUrl);
      } catch (error) {
        console.error('Invalid Socket.IO URL format:', socketUrl);
        setConnectionStatus('error');
        return;
      }

      setConnectionStatus('connecting');
      console.log('Attempting to connect to Socket.IO at:', socketUrl);
      console.log('Current environment:', {
        apiBaseUrl: environment.apiBaseUrl,
        wsUrl: environment.wsUrl,
        socketUrl: socketUrl
      });
      
      // Clean up any existing connection
      if (socketRef.current) {
        try {
          socketRef.current.disconnect();
        } catch (error) {
          console.error('Error disconnecting existing socket:', error);
        }
        socketRef.current = null;
      }
      
      const socket = io(socketUrl, {
        transports: ['websocket', 'polling'], // Allow fallback to polling
        autoConnect: true,
        reconnection: true,
        reconnectionAttempts: maxReconnectAttempts,
        reconnectionDelay: reconnectDelay,
        timeout: 20000, // 20 second timeout
        forceNew: true, // Force new connection
        upgrade: true, // Allow transport upgrade
        rememberUpgrade: true, // Remember transport choice
        // Add CORS and security options
        withCredentials: false, // Disable credentials for mobile
        extraHeaders: {
          'User-Agent': 'ClubCorra-Mobile/1.0.0'
        }
      });
      socketRef.current = socket;

      // Set up event listeners with error handling
      setupSocketEventListeners(socket);
      
    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  const sendAuthMessage = () => {
    try {
      // TODO: Get auth token from auth store
      // const token = getAuthToken();
      // if (token) {
      //   sendMessage({
      //     type: 'AUTH',
      //     token: token
      //   });
      // }
    } catch (error) {
      console.error('Error sending auth message:', error);
    }
  };

  const handleMessage = (message: any) => {
    try {
      setLastMessage(message);
      
      if (!message || !message.event) {
        console.log('Invalid message format:', message);
        return;
      }
      
      switch (message.event) {
        case 'balance_updated':
          handleBalanceUpdate(message.data);
          break;
        case 'real_time_balance_update':
          handleRealTimeBalanceUpdate(message.data);
          break;
        case 'transaction_status_changed':
          handleTransactionStatusChange(message.data);
          break;
        case 'transaction_approval_notification':
          handleTransactionApprovalNotification(message.data);
          break;
        case 'admin_dashboard_update':
          handleAdminDashboardUpdate(message.data);
          break;
        case 'notification_received':
          handleNotificationReceived(message.data);
          break;
        default:
          console.log('Unknown message type:', message.event);
      }
    } catch (error) {
      console.error('Error handling message:', error);
    }
  };

  const handleBalanceUpdate = (data: any) => {
    try {
      // Update balance in coins store
      console.log('Balance updated:', data);
      
      // Note: We can't directly call store methods here due to React rules
      // The stores will be updated when components re-render and call their update methods
      // Components should listen to WebSocket messages and update their stores accordingly
      
      // Show notification if app is in background
      if (AppState.currentState !== 'active' && Notifications) {
        try {
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Balance Updated',
              body: `Your coin balance has been updated to ${data?.newBalance || 'unknown'} coins`,
              data: { type: 'balance_update', balance: data?.newBalance },
            },
            trigger: null,
          });
        } catch (error) {
          // Ignore notification errors in Expo Go
          console.log('Notification not available (likely running in Expo Go)');
        }
      }
    } catch (error) {
      console.error('Error handling balance update:', error);
    }
  };

  const handleRealTimeBalanceUpdate = (data: any) => {
    try {
      // Handle real-time balance updates from transaction approval/rejection
      console.log('Real-time balance update:', data);
      
      // Show notification for real-time updates
      if (Notifications) {
        try {
          const statusText = (data?.status || 'unknown').toLowerCase();
          const typeText = (data?.transactionType || 'transaction').toLowerCase();
          
          Notifications.scheduleNotificationAsync({
            content: {
              title: `${typeText.charAt(0).toUpperCase() + typeText.slice(1)} Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
              body: `Your ${typeText} request has been ${statusText}. New balance: ${data?.balance || 'unknown'} coins`,
              data: { 
                type: 'real_time_balance_update', 
                balance: data?.balance,
                transactionId: data?.transactionId,
                status: data?.status 
              },
            },
            trigger: null,
          });
        } catch (error) {
          // Ignore notification errors in Expo Go
          console.log('Notification not available (likely running in Expo Go)');
        }
      }
    } catch (error) {
      console.error('Error handling real-time balance update:', error);
    }
  };

  const handleTransactionStatusChange = (data: any) => {
    try {
      // Update transaction in transactions store
      console.log('Transaction status changed:', data);
      
      // Note: We can't directly call store methods here due to React rules
      // The stores will be updated when components re-render and call their update methods
      // Components should listen to WebSocket messages and update their stores accordingly
      
      // Show notification
      if (Notifications) {
        try {
          const typeText = (data?.type || 'transaction').toLowerCase();
          const statusText = (data?.status || 'updated').toLowerCase();
          
          Notifications.scheduleNotificationAsync({
            content: {
              title: 'Transaction Update',
              body: `Your ${typeText} request is now ${statusText}`,
              data: { type: 'transaction_update', transactionId: data?.transactionId },
          },
          trigger: null,
        });
      } catch (error) {
        // Ignore notification errors in Expo Go
        console.log('Notification not available (likely running in Expo Go)');
      }
      }
    } catch (error) {
      console.error('Error handling transaction status change:', error);
    }
  };

  const handleTransactionApprovalNotification = (data: any) => {
    try {
      // Handle transaction approval/rejection notifications
      console.log('Transaction approval notification:', data);
      
      // Show notification for approval/rejection
      if (Notifications) {
        try {
          const statusText = (data?.status || 'processed').toLowerCase();
          const typeText = (data?.transactionType || 'transaction').toLowerCase();
          const adminNotes = data?.adminNotes ? `\n\nAdmin Notes: ${data.adminNotes}` : '';
          
          Notifications.scheduleNotificationAsync({
            content: {
              title: `${typeText.charAt(0).toUpperCase() + typeText.slice(1)} Request ${statusText.charAt(0).toUpperCase() + statusText.slice(1)}`,
              body: `Your ${typeText} request has been ${statusText}.${adminNotes}`,
              data: { 
                type: 'transaction_approval_notification', 
                transactionId: data?.transactionId,
                status: data?.status,
                adminNotes: data?.adminNotes 
              },
            },
            trigger: null,
          });
        } catch (error) {
          // Ignore notification errors in Expo Go
          console.log('Notification not available (likely running in Expo Go)');
        }
      }
    } catch (error) {
      console.error('Error handling transaction approval notification:', error);
    }
  };

  const handleAdminDashboardUpdate = (data: any) => {
    try {
      // Handle admin dashboard updates (for admin users)
      console.log('Admin dashboard update:', data);
      
      // This is typically handled by admin components, but we can log it here
      // In a real app, you might want to update admin-specific stores or show admin notifications
    } catch (error) {
      console.error('Error handling admin dashboard update:', error);
    }
  };

  const handleNotificationReceived = (data: any) => {
    try {
      // TODO: Add notification to notifications store
      console.log('Notification received:', data);
      
      // Show notification
      if (Notifications) {
        try {
          Notifications.scheduleNotificationAsync({
            content: {
              title: data?.title || 'New Notification',
              body: data?.body || 'You have a new notification',
              data: { type: 'notification', notificationId: data?.id },
            },
            trigger: null,
          });
        } catch (error) {
          // Ignore notification errors in Expo Go
          console.log('Notification not available (likely running in Expo Go)');
        }
      }
    } catch (error) {
      console.error('Error handling notification received:', error);
    }
  };

  const scheduleReconnect = () => {
    try {
      if (reconnectAttempts.current >= maxReconnectAttempts) {
        console.log('Max reconnection attempts reached');
        return;
      }

      if (reconnectTimeoutRef.current) {
        clearTimeout(reconnectTimeoutRef.current);
      }

      const delay = reconnectDelay * Math.pow(2, reconnectAttempts.current);
      reconnectAttempts.current += 1;

      console.log(`Scheduling reconnect attempt ${reconnectAttempts.current} in ${delay}ms`);
      
      reconnectTimeoutRef.current = setTimeout(() => {
        try {
          connectWebSocket();
        } catch (error) {
          console.error('Error during scheduled reconnection:', error);
        }
      }, delay);
    } catch (error) {
      console.error('Error scheduling reconnection:', error);
    }
  };

  const startHealthCheck = () => {
    if (healthCheckTimeoutRef.current) {
      clearTimeout(healthCheckTimeoutRef.current);
    }

    healthCheckTimeoutRef.current = setTimeout(() => {
      try {
        // Safety check: ensure socket exists and has the connected property
        if (socketRef.current && typeof socketRef.current.connected === 'boolean' && socketRef.current.connected) {
          // Send a ping to check if connection is still alive
          try {
            socketRef.current.emit('ping');
            console.log('Health check: connection is alive');
          } catch (error) {
            console.error('Health check failed:', error);
            // Connection might be stale, force reconnect
            reconnect();
          }
        } else {
          console.log('Health check: socket not available or not connected');
        }
      } catch (error) {
        console.error('Health check error:', error);
        // If there's an error checking the socket, try to reconnect
        reconnect();
      }
      
      // Schedule next health check
      startHealthCheck();
    }, 30000); // Check every 30 seconds
  };

  const cleanupWebSocket = () => {
    try {
      if (socketRef.current) {
        socketRef.current.disconnect();
        socketRef.current = null;
      }
    } catch (error) {
      console.error('Error cleaning up WebSocket:', error);
      // Force cleanup even if there's an error
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }

    if (healthCheckTimeoutRef.current) {
      clearTimeout(healthCheckTimeoutRef.current);
      healthCheckTimeoutRef.current = null;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    try {
      if (nextAppState === 'active') {
        // App came to foreground, reconnect if needed
        if (!isConnected && connectionStatus !== 'connecting') {
          connectWebSocket();
        }
      } else if (nextAppState === 'background') {
        // App went to background, close connection to save battery
        if (socketRef.current && typeof socketRef.current.connected === 'boolean' && socketRef.current.connected) {
          socketRef.current.disconnect();
        }
      }
    } catch (error) {
      console.error('Error handling app state change:', error);
    }
  };

  const sendMessage = (message: any) => {
    try {
      // Safety check: ensure socket exists and has the connected property
      if (socketRef.current && typeof socketRef.current.connected === 'boolean' && socketRef.current.connected) {
        try {
          socketRef.current.emit('message', message);
        } catch (error) {
          console.error('Error sending Socket.IO message:', error);
        }
      } else {
        console.warn('Socket.IO is not connected, cannot send message');
      }
    } catch (error) {
      console.error('Error checking socket connection status:', error);
    }
  };

  const reconnect = () => {
    try {
      cleanupWebSocket();
      reconnectAttempts.current = 0;
      connectWebSocket();
    } catch (error) {
      console.error('Error during reconnection:', error);
      // Try to recover by resetting state
      setIsConnected(false);
      setConnectionStatus('error');
    }
  };

  const contextValue: RealTimeContextType = {
    isConnected,
    connectionStatus,
    lastMessage,
    sendMessage,
    reconnect,
  };

  return (
    <RealTimeContext.Provider value={contextValue}>
      {children}
    </RealTimeContext.Provider>
  );
}

export function useRealTime() {
  const context = useContext(RealTimeContext);
  if (context === undefined) {
    throw new Error('useRealTime must be used within a RealTimeProvider');
  }
  return context;
}
