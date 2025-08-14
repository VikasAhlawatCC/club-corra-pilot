import { Stack } from 'expo-router';

export default function TransactionsLayout() {
  return (
    <Stack>
      <Stack.Screen
        name="earn"
        options={{
          title: 'Earn Coins',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="redeem"
        options={{
          title: 'Redeem Coins',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="history"
        options={{
          title: 'Transaction History',
          headerShown: false,
        }}
      />
      <Stack.Screen
        name="[id]"
        options={{
          title: 'Transaction Details',
          headerShown: false,
        }}
      />
    </Stack>
  );
}
