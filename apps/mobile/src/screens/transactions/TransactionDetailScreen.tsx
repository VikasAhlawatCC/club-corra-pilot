import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTransactionsStore } from '../../stores/transactions.store';
import { colors, typography, spacing } from '../../styles/theme';

export default function TransactionDetailScreen() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id: string }>();
  const [transaction, setTransaction] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const { transactionsService } = useTransactionsStore();

  useEffect(() => {
    if (id) {
      loadTransactionDetails();
    }
  }, [id]);

  const loadTransactionDetails = async () => {
    try {
      setIsLoading(true);
      setError(null);
      
      const response = await transactionsService.getTransactionDetails(id);
      setTransaction(response.transaction);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load transaction details');
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'PENDING':
        return colors.warning[500];
      case 'APPROVED':
        return colors.success[500];
      case 'REJECTED':
        return colors.error[500];
      case 'PROCESSED':
        return colors.primary[500];
      case 'PAID':
        return colors.gold[500];
      default:
        return colors.neutral[500];
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'PENDING':
        return 'time-outline';
      case 'APPROVED':
        return 'checkmark-circle-outline';
      case 'REJECTED':
        return 'close-circle-outline';
      case 'PROCESSED':
        return 'checkmark-done-outline';
      case 'PAID':
        return 'card-outline';
      default:
        return 'help-outline';
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'EARN':
        return 'add-circle-outline';
      case 'REDEEM':
        return 'remove-circle-outline';
      case 'WELCOME_BONUS':
        return 'gift-outline';
      case 'ADJUSTMENT':
        return 'settings-outline';
      default:
        return 'help-outline';
    }
  };

  const getTransactionColor = (type: string) => {
    switch (type) {
      case 'EARN':
        return colors.success[500];
      case 'REDEEM':
        return colors.primary[500];
      case 'WELCOME_BONUS':
        return colors.gold[500];
      case 'ADJUSTMENT':
        return colors.neutral[500];
      default:
        return colors.neutral[500];
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getTransactionTitle = (type: string) => {
    switch (type) {
      case 'EARN':
        return 'Earned Coins';
      case 'REDEEM':
        return 'Redeemed Coins';
      case 'WELCOME_BONUS':
        return 'Welcome Bonus';
      case 'ADJUSTMENT':
        return 'Balance Adjustment';
      default:
        return 'Transaction';
    }
  };

  if (isLoading) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={{ marginTop: spacing[4], color: colors.text.primary }}>
          Loading transaction details...
        </Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: spacing[4] }}>
        <Ionicons name="alert-circle-outline" size={64} color={colors.error[500]} />
        <Text style={{
          fontSize: typography.fontSize.lg,
          fontFamily: typography.fontFamily.medium,
          color: colors.text.primary,
          marginTop: spacing[3],
          textAlign: 'center',
          marginBottom: spacing[2],
        }}>
          Failed to load transaction
        </Text>
        <Text style={{
          fontSize: typography.fontSize.md,
          color: colors.text.secondary,
          textAlign: 'center',
          marginBottom: spacing[4],
        }}>
          {error}
        </Text>
        <TouchableOpacity
          onPress={loadTransactionDetails}
          style={{
            backgroundColor: colors.primary[500],
            paddingHorizontal: spacing[4],
            paddingVertical: spacing[3],
            borderRadius: 8,
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.md,
            color: colors.text.white,
            fontFamily: typography.fontFamily.medium,
          }}>
            Try Again
          </Text>
        </TouchableOpacity>
      </View>
    );
  }

  if (!transaction) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <Text style={{ color: colors.text.primary }}>
          Transaction not found
        </Text>
      </View>
    );
  }

  return (
    <ScrollView 
      style={{ 
        flex: 1, 
        backgroundColor: colors.background.dark[900],
      }}
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{ padding: spacing[4] }}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={{
            flexDirection: 'row',
            alignItems: 'center',
            marginBottom: spacing[4],
          }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.text.primary} />
          <Text style={{
            fontSize: typography.fontSize.md,
            color: colors.text.primary,
            marginLeft: spacing[2],
            fontFamily: typography.fontFamily.medium,
          }}>
            Back to Transactions
          </Text>
        </TouchableOpacity>

        <Text style={{
          fontSize: typography.fontSize['3xl'],
          fontFamily: typography.fontFamily.bold,
          color: colors.text.primary,
          marginBottom: spacing[2],
        }}>
          {getTransactionTitle(transaction.type)}
        </Text>
      </View>

      {/* Transaction Card */}
      <View style={{ padding: spacing[4] }}>
        <View style={{
          backgroundColor: colors.card.primary,
          borderRadius: 16,
          padding: spacing[4],
          borderWidth: 1,
          borderColor: colors.card.border,
        }}>
          {/* Transaction Header */}
          <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[4] }}>
            <View style={{
              backgroundColor: getTransactionColor(transaction.type),
              borderRadius: 24,
              width: 48,
              height: 48,
              justifyContent: 'center',
              alignItems: 'center',
              marginRight: spacing[3],
            }}>
              <Ionicons 
                name={getTransactionIcon(transaction.type)} 
                size={24} 
                color={colors.text.white} 
              />
            </View>
            
            <View style={{ flex: 1 }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamily.semiBold,
                color: colors.text.primary,
                marginBottom: spacing[1],
              }}>
                {getTransactionTitle(transaction.type)}
              </Text>
              
              <View style={{ flexDirection: 'row', alignItems: 'center' }}>
                <Ionicons 
                  name={getStatusIcon(transaction.status)} 
                  size={16} 
                  color={getStatusColor(transaction.status)} 
                />
                <Text style={{
                  fontSize: typography.fontSize.sm,
                  color: getStatusColor(transaction.status),
                  marginLeft: spacing[1],
                  fontFamily: typography.fontFamily.medium,
                }}>
                  {transaction.status}
                </Text>
              </View>
            </View>
            
            <View style={{ alignItems: 'flex-end' }}>
              <Text style={{
                fontSize: typography.fontSize['2xl'],
                fontFamily: typography.fontFamily.bold,
                color: transaction.type === 'EARN' ? colors.success[500] : colors.primary[500],
              }}>
                {transaction.type === 'EARN' ? '+' : '-'}
                {transaction.coinsEarned || transaction.coinsRedeemed || transaction.amount}
              </Text>
              <Text style={{
                fontSize: typography.fontSize.sm,
                color: colors.text.secondary,
              }}>
                coins
              </Text>
            </View>
          </View>

          {/* Transaction Details */}
          <View style={{ marginBottom: spacing[4] }}>
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamily.semiBold,
              color: colors.text.primary,
              marginBottom: spacing[3],
            }}>
              Transaction Details
            </Text>
            
            <View style={{ gap: spacing[3] }}>
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.secondary,
                }}>
                  Transaction ID
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  {transaction.id.slice(0, 8)}...
                </Text>
              </View>
              
              <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.secondary,
                }}>
                  Date
                </Text>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  {formatDate(transaction.createdAt)}
                </Text>
              </View>
              
              {transaction.billAmount && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.secondary,
                  }}>
                    Bill Amount
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.medium,
                  }}>
                    ₹{transaction.billAmount}
                  </Text>
                </View>
              )}
              
              {transaction.billDate && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.secondary,
                  }}>
                    Bill Date
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.medium,
                  }}>
                    {new Date(transaction.billDate).toLocaleDateString()}
                  </Text>
                </View>
              )}
              
              {transaction.processedAt && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.secondary,
                  }}>
                    Processed At
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.medium,
                  }}>
                    {formatDate(transaction.processedAt)}
                  </Text>
                </View>
              )}
              
              {transaction.transactionId && (
                <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.secondary,
                  }}>
                    Payment ID
                  </Text>
                  <Text style={{
                    fontSize: typography.fontSize.md,
                    color: colors.text.primary,
                    fontFamily: typography.fontFamily.medium,
                  }}>
                    {transaction.transactionId}
                  </Text>
                </View>
              )}
            </View>
          </View>

          {/* Brand Information */}
          {transaction.brand && (
            <View style={{ marginBottom: spacing[4] }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamily.semiBold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}>
                Brand Information
              </Text>
              
              <View style={{
                backgroundColor: colors.card.secondary,
                borderRadius: 12,
                padding: spacing[3],
              }}>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.medium,
                }}>
                  {transaction.brand.name}
                </Text>
              </View>
            </View>
          )}

          {/* Notes */}
          {transaction.notes && (
            <View style={{ marginBottom: spacing[4] }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamily.semiBold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}>
                Notes
              </Text>
              
              <View style={{
                backgroundColor: colors.card.secondary,
                borderRadius: 12,
                padding: spacing[3],
              }}>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.regular,
                }}>
                  {transaction.notes}
                </Text>
              </View>
            </View>
          )}

          {/* Admin Notes */}
          {transaction.adminNotes && (
            <View style={{ marginBottom: spacing[4] }}>
              <Text style={{
                fontSize: typography.fontSize.lg,
                fontFamily: typography.fontFamily.semiBold,
                color: colors.text.primary,
                marginBottom: spacing[3],
              }}>
                Admin Notes
              </Text>
              
              <View style={{
                backgroundColor: colors.card.secondary,
                borderRadius: 12,
                padding: spacing[3],
              }}>
                <Text style={{
                  fontSize: typography.fontSize.md,
                  color: colors.text.primary,
                  fontFamily: typography.fontFamily.regular,
                }}>
                  {transaction.adminNotes}
                </Text>
              </View>
            </View>
          )}
        </View>
      </View>
    </ScrollView>
  );
}
