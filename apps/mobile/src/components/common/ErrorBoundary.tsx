import React, { Component, ErrorInfo, ReactNode } from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { colors, typography, spacing } from '../../styles/theme';

interface Props {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface State {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

export class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console for debugging
    console.error('ErrorBoundary caught an error:', error, errorInfo);

    // Call custom error handler if provided
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In a real app, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });
  }

  handleRetry = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  handleReportError = () => {
    // In a real app, this would open a feedback form or send error report
    console.log('Error report requested for:', this.state.error);
    
    // For now, just show an alert
    alert('Error report submitted. Thank you for your feedback!');
  };

  render() {
    if (this.state.hasError) {
      // Custom fallback UI
      if (this.props.fallback) {
        return this.props.fallback;
      }

      // Default error UI
      return (
        <View style={styles.container}>
          <View style={styles.errorContainer}>
            <Text style={styles.errorIcon}>⚠️</Text>
            <Text style={styles.errorTitle}>Something went wrong</Text>
            <Text style={styles.errorMessage}>
              We encountered an unexpected error. Please try again or contact support if the problem persists.
            </Text>
            
            {__DEV__ && this.state.error && (
              <View style={styles.debugContainer}>
                <Text style={styles.debugTitle}>Debug Information:</Text>
                <Text style={styles.debugText}>{this.state.error.toString()}</Text>
                {this.state.errorInfo && (
                  <Text style={styles.debugText}>
                    {this.state.errorInfo.componentStack}
                  </Text>
                )}
              </View>
            )}
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity style={styles.retryButton} onPress={this.handleRetry}>
                <Text style={styles.retryButtonText}>Try Again</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.reportButton} onPress={this.handleReportError}>
                <Text style={styles.reportButtonText}>Report Issue</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.background.primary,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing[4],
  },
  errorContainer: {
    backgroundColor: colors.white,
    borderRadius: 12,
    padding: spacing[6],
    alignItems: 'center',
    shadowColor: colors.neutral[900],
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
    maxWidth: 400,
  },
  errorIcon: {
    fontSize: 48,
    marginBottom: spacing[4],
  },
  errorTitle: {
    ...typography.heading,
    fontSize: 24,
    color: colors.error[700],
    marginBottom: spacing[3],
    textAlign: 'center',
  },
  errorMessage: {
    ...typography.body,
    color: colors.text.secondary,
    textAlign: 'center',
    marginBottom: spacing[6],
    lineHeight: 22,
  },
  debugContainer: {
    backgroundColor: colors.neutral[50],
    borderRadius: 8,
    padding: spacing[3],
    marginBottom: spacing[4],
    alignSelf: 'stretch',
  },
  debugTitle: {
    ...typography.caption,
    fontWeight: '600',
    color: colors.neutral[700],
    marginBottom: spacing[2],
  },
  debugText: {
    ...typography.caption,
    color: colors.neutral[600],
    fontFamily: 'monospace',
    fontSize: 10,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: spacing[3],
  },
  retryButton: {
    backgroundColor: colors.primary[500],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
  },
  retryButtonText: {
    ...typography.button,
    color: colors.white,
  },
  reportButton: {
    backgroundColor: colors.neutral[100],
    paddingHorizontal: spacing[4],
    paddingVertical: spacing[3],
    borderRadius: 8,
    minWidth: 120,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.neutral[300],
  },
  reportButtonText: {
    ...typography.button,
    color: colors.text.primary,
  },
});

export default ErrorBoundary;
