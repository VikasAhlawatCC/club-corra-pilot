'use client'

import { useState } from 'react'
import { 
  PencilIcon, 
  TrashIcon, 
  EyeIcon,
  CheckCircleIcon,
  XCircleIcon
} from '@heroicons/react/24/outline'
import type { Brand } from '@shared/schemas'

interface BrandTableProps {
  brands: Brand[]
  onEdit?: (brand: Brand) => void
  onDelete?: (brandId: string) => void
  onView?: (brand: Brand) => void
}

export function BrandTable({ brands, onEdit, onDelete, onView }: BrandTableProps) {
  const [sortField, setSortField] = useState<keyof Brand>('name')
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('asc')

  const handleSort = (field: keyof Brand) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDirection('asc')
    }
  }

  const sortedBrands = [...brands].sort((a, b) => {
    const aValue = a[sortField]
    const bValue = b[sortField]
    
    // Handle undefined values
    if (aValue === undefined && bValue === undefined) return 0
    if (aValue === undefined) return sortDirection === 'asc' ? -1 : 1
    if (bValue === undefined) return sortDirection === 'asc' ? 1 : -1
    
    if (aValue < bValue) return sortDirection === 'asc' ? -1 : 1
    if (aValue > bValue) return sortDirection === 'asc' ? 1 : -1
    return 0
  })

  return (
    <div className="overflow-x-auto">
      <table className="min-w-full divide-y divide-gray-200">
        <thead className="bg-gray-50">
          <tr>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('name')}
            >
              <div className="flex items-center">
                Brand Name
                {sortField === 'name' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Category
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Earning %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Redemption %
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Caps
            </th>
            <th 
              className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider cursor-pointer hover:bg-gray-100"
              onClick={() => handleSort('isActive')}
            >
              <div className="flex items-center">
                Status
                {sortField === 'isActive' && (
                  <span className="ml-1">
                    {sortDirection === 'asc' ? '↑' : '↓'}
                  </span>
                )}
              </div>
            </th>
            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
              Actions
            </th>
          </tr>
        </thead>
        <tbody className="bg-white divide-y divide-gray-200">
          {sortedBrands.map((brand) => (
            <tr key={brand.id} className="hover:bg-gray-50">
              <td className="px-6 py-4 whitespace-nowrap">
                <div className="flex items-center">
                  {brand.logoUrl ? (
                    <img 
                      className="h-10 w-10 rounded-full mr-3" 
                      src={brand.logoUrl} 
                      alt={brand.name}
                    />
                  ) : (
                    <div className="h-10 w-10 rounded-full bg-gray-200 mr-3 flex items-center justify-center">
                      <span className="text-gray-500 text-sm font-medium">
                        {brand.name.charAt(0).toUpperCase()}
                      </span>
                    </div>
                  )}
                  <div>
                    <div className="text-sm font-medium text-gray-900">{brand.name}</div>
                    <div className="text-sm text-gray-500 truncate max-w-xs">
                      {brand.description}
                    </div>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                  {brand.category?.name || 'Unknown Category'}
                </span>
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {brand.earningPercentage}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                {brand.redemptionPercentage}%
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                <div className="space-y-1">
                  <div className="text-xs">
                    <span className="text-gray-500">Overall: </span>
                    <span className="font-medium">₹{brand.overallMaxCap}</span>
                  </div>
                  <div className="text-xs">
                    <span className="text-gray-500">Per Tx: </span>
                    <span className="font-medium">₹{brand.brandwiseMaxCap}</span>
                  </div>
                </div>
              </td>
              <td className="px-6 py-4 whitespace-nowrap">
                {brand.isActive ? (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    <CheckCircleIcon className="w-4 h-4 mr-1" />
                    Active
                  </span>
                ) : (
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800">
                    <XCircleIcon className="w-4 h-4 mr-1" />
                    Inactive
                  </span>
                )}
              </td>
              <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                <div className="flex space-x-2">
                  {onView && (
                    <button
                      onClick={() => onView(brand)}
                      className="text-indigo-600 hover:text-indigo-900 p-1 rounded hover:bg-indigo-50"
                      title="View Brand"
                    >
                      <EyeIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onEdit && (
                    <button
                      onClick={() => onEdit(brand)}
                      className="text-blue-600 hover:text-blue-900 p-1 rounded hover:bg-blue-50"
                      title="Edit Brand"
                    >
                      <PencilIcon className="w-4 h-4" />
                    </button>
                  )}
                  {onDelete && (
                    <button
                      onClick={() => onDelete(brand.id)}
                      className="text-red-600 hover:text-red-900 p-1 rounded hover:bg-red-50"
                      title="Delete Brand"
                    >
                      <TrashIcon className="w-4 h-4" />
                    </button>
                  )}
                </div>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      
      {sortedBrands.length === 0 && (
        <div className="text-center py-12">
          <div className="text-gray-500">
            <p>No brands found</p>
            <p className="text-sm mt-2">Start by adding your first partner brand</p>
          </div>
        </div>
      )}
    </div>
  )
}
