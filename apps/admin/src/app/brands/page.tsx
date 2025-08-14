'use client'

import Link from 'next/link'
import { PlusIcon } from '@heroicons/react/24/outline'
import { BrandTable } from '@/components/brands/BrandTable'

export default function BrandsPage() {
  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage partner brands and their earning/redeeming rules</p>
        </div>
        <Link
          href="/brands/new"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          <PlusIcon className="w-4 h-4 mr-2" />
          Add Brand
        </Link>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Partner Brands
          </h3>
          
          {/* Sample data for demonstration - in real app this would come from API */}
          <BrandTable 
            brands={[
              {
                id: '550e8400-e29b-41d4-a716-446655440001',
                name: 'Amazon',
                description: 'E-commerce and digital services',
                categoryId: '550e8400-e29b-41d4-a716-446655440010',
                category: {
                  id: '550e8400-e29b-41d4-a716-446655440010',
                  name: 'E-commerce',
                  description: 'Online shopping and digital services',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                earningPercentage: 5,
                redemptionPercentage: 3,
                minRedemptionAmount: 100,
                maxRedemptionAmount: 1000,
                overallMaxCap: 5000,
                brandwiseMaxCap: 1000,
                isActive: true,
                logoUrl: 'https://via.placeholder.com/40x40/FF9900/FFFFFF?text=A',
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: '550e8400-e29b-41d4-a716-446655440002',
                name: 'Flipkart',
                description: 'Online shopping platform',
                categoryId: '550e8400-e29b-41d4-a716-446655440010',
                category: {
                  id: '550e8400-e29b-41d4-a716-446655440010',
                  name: 'E-commerce',
                  description: 'Online shopping and digital services',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                earningPercentage: 4,
                redemptionPercentage: 2.5,
                minRedemptionAmount: 50,
                maxRedemptionAmount: 800,
                overallMaxCap: 3000,
                brandwiseMaxCap: 800,
                isActive: true,
                logoUrl: 'https://via.placeholder.com/40x40/2874F0/FFFFFF?text=F',
                createdAt: new Date(),
                updatedAt: new Date()
              },
              {
                id: '550e8400-e29b-41d4-a716-446655440003',
                name: 'Swiggy',
                description: 'Food delivery service',
                categoryId: '550e8400-e29b-41d4-a716-446655440011',
                category: {
                  id: '550e8400-e29b-41d4-a716-446655440011',
                  name: 'Food & Beverage',
                  description: 'Food delivery and dining services',
                  createdAt: new Date(),
                  updatedAt: new Date()
                },
                earningPercentage: 6,
                redemptionPercentage: 4,
                minRedemptionAmount: 200,
                maxRedemptionAmount: 500,
                overallMaxCap: 2000,
                brandwiseMaxCap: 500,
                isActive: true,
                logoUrl: 'https://via.placeholder.com/40x40/FC8019/FFFFFF?text=S',
                createdAt: new Date(),
                updatedAt: new Date()
              }
            ]}
            onEdit={(brand) => console.log('Edit brand:', brand)}
            onDelete={(brandId) => console.log('Delete brand:', brandId)}
            onView={(brand) => console.log('View brand:', brand)}
          />
        </div>
      </div>
    </div>
  )
}
