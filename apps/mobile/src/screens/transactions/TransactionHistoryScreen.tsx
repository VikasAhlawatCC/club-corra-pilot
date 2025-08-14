import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';

import { useTransactionsStore } from '../../stores/transactions.store';
import { colors, typography, spacing } from '../../styles/theme';

type TransactionType = 'EARN' | 'REDEEM' | 'WELCOME_BONUS' | 'ADJUSTMENT';
type TransactionStatus = 'PENDING' | 'APPROVED' | 'REJECTED' | 'PROCESSED' | 'PAID';

interface FilterOption {
  label: string;
  value: string;
  count?: number;
}

export default function TransactionHistoryScreen() {
  const router = useRouter();
  const [selectedType, setSelectedType] = useState<string>('ALL');
  const [selectedStatus, setSelectedStatus] = useState<string>('ALL');
  const [refreshing, setRefreshing] = useState(false);
  
  const { 
    transactions, 
    fetchTransactions, 
    isLoading, 
    error, 
    clearError,
    total,
    page,
    totalPages,
  } = useTransactionsStore();

  const typeFilters: FilterOption[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Earn', value: 'EARN' },
    { label: 'Redeem', value: 'REDEEM' },
    { label: 'Welcome Bonus', value: 'WELCOME_BONUS' },
    { label: 'Adjustment', value: 'ADJUSTMENT' },
  ];

  const statusFilters: FilterOption[] = [
    { label: 'All', value: 'ALL' },
    { label: 'Pending', value: 'PENDING' },
    { label: 'Approved', value: 'APPROVED' },
    { label: 'Rejected', value: 'REJECTED' },
    { label: 'Processed', value: 'PROCESSED' },
    { label: 'Paid', value: 'PAID' },
  ];

  useEffect(() => {
    loadTransactions();
  }, [selectedType, selectedStatus]);

  useEffect(() => {
    return () => clearError();
  }, [clearError]);

  const loadTransactions = async () => {
    const filters: any = { page: 1, limit: 20 };
    
    if (selectedType !== 'ALL') {
      filters.type = selectedType;
    }
    
    if (selectedStatus !== 'ALL') {
      filters.status = selectedStatus;
    }
    
    await fetchTransactions(filters);
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadTransactions();
    setRefreshing(false);
  };

  const loadMore = async () => {
    if (page < totalPages && !isLoading) {
      const filters: any = { page: page + 1, limit: 20 };
      
      if (selectedType !== 'ALL') {
        filters.type = selectedType;
      }
      
      if (selectedStatus !== 'ALL') {
        filters.status = selectedStatus;
      }
      
      await fetchTransactions(filters);
    }
  };

  const getStatusColor = (status: TransactionStatus) => {
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

  const getStatusIcon = (status: TransactionStatus) => {
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

  const getTransactionIcon = (type: TransactionType) => {
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

  const getTransactionColor = (type: TransactionType) => {
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

  const renderTransaction = ({ item }: { item: any }) => (
    <TouchableOpacity
      onPress={() => router.push(`/transactions/${item.id}`)}
      style={{
        backgroundColor: colors.card.primary,
        borderRadius: 12,
        padding: spacing[4],
        marginBottom: spacing[3],
        borderWidth: 1,
        borderColor: colors.card.border,
      }}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', marginBottom: spacing[3] }}>
        <View style={{
          backgroundColor: getTransactionColor(item.type),
          borderRadius: 20,
          width: 40,
          height: 40,
          justifyContent: 'center',
          alignItems: 'center',
          marginRight: spacing[3],
        }}>
          <Ionicons 
            name={getTransactionIcon(item.type)} 
            size={20} 
            color={colors.text.white} 
          />
        </View>
        
        <View style={{ flex: 1 }}>
          <Text style={{
            fontSize: typography.fontSize.md,
            fontFamily: typography.fontFamily.semiBold,
            color: colors.text.primary,
            marginBottom: spacing[1],
          }}>
            {item.type === 'EARN' ? 'Earned Coins' : 
             item.type === 'REDEEM' ? 'Redeemed Coins' :
             item.type === 'WELCOME_BONUS' ? 'Welcome Bonus' : 'Adjustment'}
          </Text>
          
          {item.brand && (
            <Text style={{
              fontSize: typography.fontSize.sm,
              color: colors.text.secondary,
            }}>
              {item.brand.name}
            </Text>
          )}
        </View>
        
        <View style={{ alignItems: 'flex-end' }}>
          <Text style={{
            fontSize: typography.fontSize.lg,
            fontFamily: typography.fontFamily.bold,
            color: item.type === 'EARN' ? colors.success[500] : colors.primary[500],
          }}>
            {item.type === 'EARN' ? '+' : '-'}{item.coinsEarned || item.coinsRedeemed || item.amount}
          </Text>
          <Text style={{
            fontSize: typography.fontSize.xs,
            color: colors.text.muted,
          }}>
            coins
          </Text>
        </View>
      </View>
      
      <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
        <View style={{ flexDirection: 'row', alignItems: 'center' }}>
          <Ionicons 
            name={getStatusIcon(item.status)} 
            size={16} 
            color={getStatusColor(item.status)} 
          />
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: getStatusColor(item.status),
            marginLeft: spacing[1],
            fontFamily: typography.fontFamily.medium,
          }}>
            {item.status}
          </Text>
        </View>
        
        <Text style={{
          fontSize: typography.fontSize.xs,
          color: colors.text.muted,
        }}>
          {new Date(item.createdAt).toLocaleDateString()}
        </Text>
      </View>
      
      {item.billAmount && (
        <View style={{ 
          marginTop: spacing[2], 
          paddingTop: spacing[2], 
          borderTopWidth: 1, 
          borderTopColor: colors.card.border 
        }}>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.secondary,
          }}>
            Bill Amount: ₹{item.billAmount}
          </Text>
        </View>
      )}
    </TouchableOpacity>
  );

  const renderFilterChips = (filters: FilterOption[], selectedValue: string, onSelect: (value: string) => void) => (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={{ marginBottom: spacing[4] }}
    >
      {filters.map((filter) => (
        <TouchableOpacity
          key={filter.value}
          onPress={() => onSelect(filter.value)}
          style={{
            backgroundColor: selectedValue === filter.value ? colors.primary[500] : colors.card.primary,
            paddingHorizontal: spacing[3],
            paddingVertical: spacing[2],
            borderRadius: 20,
            marginRight: spacing[2],
            borderWidth: 1,
            borderColor: selectedValue === filter.value ? colors.primary[400] : colors.card.border,
          }}
        >
          <Text style={{
            fontSize: typography.fontSize.sm,
            fontFamily: typography.fontFamily.medium,
            color: selectedValue === filter.value ? colors.text.white : colors.text.primary,
          }}>
            {filter.label}
          </Text>
        </TouchableOpacity>
      ))}
    </ScrollView>
  );

  if (isLoading && transactions.length === 0) {
    return (
      <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary[500]} />
        <Text style={{ marginTop: spacing[4], color: colors.text.primary }}>
          Loading transactions...
        </Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, backgroundColor: colors.background.dark[900] }}>
      <View style={{ padding: spacing[4] }}>
        <Text style={{
          fontSize: typography.fontSize['3xl'],
          fontFamily: typography.fontFamily.bold,
          color: colors.text.primary,
          marginBottom: spacing[2],
        }}>
          Transaction History
        </Text>
        <Text style={{
          fontSize: typography.fontSize.md,
          color: colors.text.secondary,
          marginBottom: spacing[4],
        }}>
          Track all your coin transactions
        </Text>
      </View>

      {/* Type Filters */}
      <View style={{ paddingHorizontal: spacing[4] }}>
        <Text style={{
          fontSize: typography.fontSize.lg,
          fontFamily: typography.fontFamily.semiBold,
          color: colors.text.primary,
          marginBottom: spacing[3],
        }}>
          Transaction Type
        </Text>
        {renderFilterChips(typeFilters, selectedType, setSelectedType)}
      </View>

      {/* Status Filters */}
      <View style={{ paddingHorizontal: spacing[4], marginBottom: spacing[4] }}>
        <Text style={{
          fontSize: typography.fontSize.lg,
          fontFamily: typography.fontFamily.semiBold,
          color: colors.text.primary,
          marginBottom: spacing[3],
        }}>
          Status
        </Text>
        {renderFilterChips(statusFilters, selectedStatus, setSelectedStatus)}
      </View>

      {/* Transactions List */}
      <FlatList
        data={transactions}
        renderItem={renderTransaction}
        keyExtractor={(item) => item.id}
        contentContainerStyle={{ padding: spacing[4] }}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary[500]]}
            tintColor={colors.primary[500]}
          />
        }
        onEndReached={loadMore}
        onEndReachedThreshold={0.1}
        ListEmptyComponent={
          <View style={{ 
            alignItems: 'center', 
            paddingVertical: spacing[8],
            paddingHorizontal: spacing[4],
          }}>
            <Ionicons 
              name="document-outline" 
              size={64} 
              color={colors.text.muted} 
            />
            <Text style={{
              fontSize: typography.fontSize.lg,
              fontFamily: typography.fontFamily.medium,
              color: colors.text.muted,
              marginTop: spacing[3],
              textAlign: 'center',
            }}>
              No transactions found
            </Text>
            <Text style={{
              fontSize: typography.fontSize.md,
              color: colors.text.secondary,
              marginTop: spacing[2],
              textAlign: 'center',
            }}>
              {selectedType !== 'ALL' || selectedStatus !== 'ALL' 
                ? 'Try adjusting your filters' 
                : 'Start earning coins by uploading your first bill!'}
            </Text>
          </View>
        }
        ListFooterComponent={
          isLoading && transactions.length > 0 ? (
            <View style={{ paddingVertical: spacing[4], alignItems: 'center' }}>
              <ActivityIndicator size="small" color={colors.primary[500]} />
            </View>
          ) : null
        }
      />

      {/* Error Display */}
      {error && (
        <View style={{
          backgroundColor: colors.error[500],
          margin: spacing[4],
          borderRadius: 8,
          padding: spacing[3],
        }}>
          <Text style={{
            fontSize: typography.fontSize.sm,
            color: colors.text.white,
            textAlign: 'center',
          }}>
            {error}
          </Text>
        </View>
      )}
    </View>
  );
}
