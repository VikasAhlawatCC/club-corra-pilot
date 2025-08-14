'use client'

import { CoinOverview } from '@/components/coins/CoinOverview'

export default function CoinsPage() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Coin System Overview</h1>
        <p className="text-gray-600">Monitor coin distribution, transactions, and system health</p>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Total Coins in Circulation</h3>
          <p className="text-3xl font-bold text-indigo-600">89,432</p>
          <p className="text-sm text-gray-500">Across all users</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Welcome Bonuses Given</h3>
          <p className="text-3xl font-bold text-green-600">1,234</p>
          <p className="text-sm text-gray-500">100 coins each</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow">
          <h3 className="text-lg font-medium text-gray-900">Pending Redemptions</h3>
          <p className="text-3xl font-bold text-yellow-600">23</p>
          <p className="text-sm text-gray-500">Awaiting approval</p>
        </div>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Coin System Statistics
          </h3>
          
          {/* Sample data for demonstration - in real app this would come from API */}
          <CoinOverview
            stats={{
              totalCoinsInCirculation: 89432,
              totalUsers: 1234,
              welcomeBonusesGiven: 1234,
              pendingRedemptions: 23,
              activeBrands: 15,
              systemHealth: 'healthy' as const
            }}
            recentTransactions={[
              {
                id: '1',
                userId: 'user-123',
                userName: 'John Doe',
                type: 'WELCOME_BONUS',
                amount: 100,
                timestamp: new Date(),
                status: 'completed'
              },
              {
                id: '2',
                userId: 'user-456',
                userName: 'Jane Smith',
                type: 'EARNED',
                amount: 25,
                timestamp: new Date(Date.now() - 3600000),
                status: 'completed'
              },
              {
                id: '3',
                userId: 'user-789',
                userName: 'Bob Johnson',
                type: 'REDEEMED',
                amount: -50,
                timestamp: new Date(Date.now() - 7200000),
                status: 'pending'
              }
            ]}
            onViewTransaction={(transaction) => console.log('View transaction:', transaction)}
            onViewAllTransactions={() => console.log('View all transactions')}
          />
        </div>
      </div>
    </div>
  )
}
