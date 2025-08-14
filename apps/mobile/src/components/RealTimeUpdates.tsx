import React from 'react';
import { useRealTimeUpdates } from '../hooks/useRealTimeUpdates';

/**
 * Component that connects WebSocket real-time updates to stores
 * This component doesn't render anything visible, it just handles the connection
 */
export const RealTimeUpdates: React.FC = () => {
  useRealTimeUpdates();
  
  // This component doesn't render anything
  return null;
};
