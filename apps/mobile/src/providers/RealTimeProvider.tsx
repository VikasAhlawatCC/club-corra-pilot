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
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = 1000; // Start with 1 second

  // Socket.IO URL from environment (convert ws:// to http:// for Socket.IO)
  // For Socket.IO, we need to use the base URL without the /api/v1 prefix
  const socketUrl = environment.wsUrl ? 
    environment.wsUrl.replace('/api/v1', '').replace('ws://', 'http://').replace('wss://', 'https://') : 
    null;

  useEffect(() => {
    setupNotifications();
    connectWebSocket();
    
    // Log current configuration for debugging
    console.log('RealTimeProvider initialized with:', {
      socketUrl,
      apiBaseUrl: environment.apiBaseUrl,
      environment: environment.environment,
      debugMode: environment.debugMode
    });
    
    const subscription = AppState.addEventListener('change', handleAppStateChange);
    
    return () => {
      subscription?.remove();
      cleanupWebSocket();
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

  const connectWebSocket = () => {
    // Skip Socket.IO connection if no URL is configured
    if (!socketUrl) {
      console.log('Socket.IO URL not configured - skipping connection');
      setConnectionStatus('disconnected');
      return;
    }

    try {
      setConnectionStatus('connecting');
      console.log('Attempting to connect to Socket.IO at:', socketUrl);
      console.log('Current environment:', {
        apiBaseUrl: environment.apiBaseUrl,
        wsUrl: environment.wsUrl,
        socketUrl: socketUrl
      });
      
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
      });
      socketRef.current = socket;

      socket.on('connect', () => {
        console.log('Socket.IO connected successfully');
        setIsConnected(true);
        setConnectionStatus('connected');
        reconnectAttempts.current = 0;
        
        // Send authentication message if user is logged in
        sendAuthMessage();
      });

      socket.on('disconnect', (reason) => {
        console.log('Socket.IO disconnected:', reason);
        setIsConnected(false);
        setConnectionStatus('disconnected');
        
        // Attempt to reconnect if not a clean disconnect
        if (reason !== 'io client disconnect') {
          scheduleReconnect();
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
        
        // Schedule reconnect on connection error
        scheduleReconnect();
      });

      // Add transport upgrade event listener
      socket.on('upgrade', () => {
        console.log('Socket.IO transport upgraded to WebSocket');
      });

      // Add transport error event listener
      socket.on('upgradeError', (error) => {
        console.error('Socket.IO transport upgrade error:', error);
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

    } catch (error) {
      console.error('Error creating Socket.IO connection:', error);
      setConnectionStatus('error');
      scheduleReconnect();
    }
  };

  const sendAuthMessage = () => {
    // TODO: Get auth token from auth store
    // const token = getAuthToken();
    // if (token) {
    //   sendMessage({
    //     type: 'AUTH',
    //     token: token
    //   });
    // }
  };

  const handleMessage = (message: any) => {
    setLastMessage(message);
    
    switch (message.event) {
      case 'balance_updated':
        handleBalanceUpdate(message.data);
        break;
      case 'transaction_status_changed':
        handleTransactionStatusChange(message.data);
        break;
      case 'notification_received':
        handleNotificationReceived(message.data);
        break;
      default:
        console.log('Unknown message type:', message.event);
    }
  };

  const handleBalanceUpdate = (data: any) => {
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
            body: `Your coin balance has been updated to ${data.newBalance} coins`,
            data: { type: 'balance_update', balance: data.newBalance },
          },
          trigger: null,
        });
      } catch (error) {
        // Ignore notification errors in Expo Go
        console.log('Notification not available (likely running in Expo Go)');
      }
    }
  };

  const handleTransactionStatusChange = (data: any) => {
    // Update transaction in transactions store
    console.log('Transaction status changed:', data);
    
    // Note: We can't directly call store methods here due to React rules
    // The stores will be updated when components re-render and call their update methods
    // Components should listen to WebSocket messages and update their stores accordingly
    
    // Show notification
    if (Notifications) {
      try {
        Notifications.scheduleNotificationAsync({
          content: {
            title: 'Transaction Update',
            body: `Your ${data.type.toLowerCase()} request is now ${data.status.toLowerCase()}`,
            data: { type: 'transaction_update', transactionId: data.transactionId },
        },
        trigger: null,
      });
    } catch (error) {
      // Ignore notification errors in Expo Go
      console.log('Notification not available (likely running in Expo Go)');
    }
    }
  };

  const handleNotificationReceived = (data: any) => {
    // TODO: Add notification to notifications store
    console.log('Notification received:', data);
    
    // Show notification
    if (Notifications) {
      try {
        Notifications.scheduleNotificationAsync({
          content: {
            title: data.title || 'New Notification',
            body: data.body || 'You have a new notification',
            data: { type: 'notification', notificationId: data.id },
          },
          trigger: null,
        });
      } catch (error) {
        // Ignore notification errors in Expo Go
        console.log('Notification not available (likely running in Expo Go)');
      }
    }
  };

  const scheduleReconnect = () => {
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
      connectWebSocket();
    }, delay);
  };

  const cleanupWebSocket = () => {
    if (socketRef.current) {
      socketRef.current.disconnect();
      socketRef.current = null;
    }
    
    if (reconnectTimeoutRef.current) {
      clearTimeout(reconnectTimeoutRef.current);
      reconnectTimeoutRef.current = null;
    }
  };

  const handleAppStateChange = (nextAppState: AppStateStatus) => {
    if (nextAppState === 'active') {
      // App came to foreground, reconnect if needed
      if (!isConnected && connectionStatus !== 'connecting') {
        connectWebSocket();
      }
    } else if (nextAppState === 'background') {
      // App went to background, close connection to save battery
      if (socketRef.current && isConnected) {
        socketRef.current.disconnect();
      }
    }
  };

  const sendMessage = (message: any) => {
    if (socketRef.current && socketRef.current.connected) {
      try {
        socketRef.current.emit('message', message);
      } catch (error) {
        console.error('Error sending Socket.IO message:', error);
      }
    } else {
      console.warn('Socket.IO is not connected, cannot send message');
    }
  };

  const reconnect = () => {
    cleanupWebSocket();
    reconnectAttempts.current = 0;
    connectWebSocket();
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
