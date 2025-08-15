'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon } from '@heroicons/react/24/outline'
import { BrandTable } from '@/components/brands/BrandTable'
import { brandApi } from '@/lib/api'
import { useToast } from '@/components/common'
import type { Brand } from '@shared/schemas'

export default function BrandsPage() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBrands, setTotalBrands] = useState(0)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    fetchBrands()
  }, [currentPage, searchTerm, categoryFilter, statusFilter])

  const fetchBrands = async () => {
    try {
      setIsLoading(true)
      const response = await brandApi.getAllBrands(
        currentPage,
        20,
        searchTerm || undefined,
        categoryFilter === 'all' ? undefined : categoryFilter,
        statusFilter === 'all' ? undefined : statusFilter === 'active'
      )
      setBrands(response.brands)
      setTotalPages(response.totalPages)
      setTotalBrands(response.total)
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      showError('Failed to fetch brands')
    } finally {
      setIsLoading(false)
    }
  }

  const handleEdit = (brand: Brand) => {
    // Navigate to edit page
    window.location.href = `/brands/${brand.id}`
  }

  const handleDelete = async (brandId: string) => {
    try {
      await brandApi.deleteBrand(brandId)
      showSuccess('Brand deleted successfully')
      fetchBrands()
    } catch (error) {
      console.error('Failed to delete brand:', error)
      showError('Failed to delete brand')
    }
  }

  const handleView = (brand: Brand) => {
    // Navigate to view page (could be same as edit for now)
    window.location.href = `/brands/${brand.id}`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    setCurrentPage(1)
    fetchBrands()
  }

  const handleFilterChange = () => {
    setCurrentPage(1)
  }

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

      {/* Search and Filters */}
      <div className="bg-white shadow rounded-lg p-6">
        <form onSubmit={handleSearch} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <div>
              <label htmlFor="search" className="block text-sm font-medium text-gray-700 mb-1">
                Search Brands
              </label>
              <div className="relative">
                <input
                  type="text"
                  id="search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Search by name or description..."
                  className="block w-full border border-gray-300 rounded-md px-3 py-2 pl-10 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                />
                <MagnifyingGlassIcon className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
              </div>
            </div>
            
            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700 mb-1">
                Category
              </label>
              <select
                id="category"
                value={categoryFilter}
                onChange={(e) => {
                  setCategoryFilter(e.target.value)
                  handleFilterChange()
                }}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Categories</option>
                {/* TODO: Add categories from API */}
                <option value="ecommerce">E-commerce</option>
                <option value="food">Food & Beverage</option>
                <option value="retail">Retail</option>
              </select>
            </div>

            <div>
              <label htmlFor="status" className="block text-sm font-medium text-gray-700 mb-1">
                Status
              </label>
              <select
                id="status"
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value)
                  handleFilterChange()
                }}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
            </div>
          </div>
          
          <div className="flex justify-between items-center">
            <button
              type="submit"
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              <FunnelIcon className="w-4 h-4 mr-2" />
              Apply Filters
            </button>
            
            <div className="text-sm text-gray-500">
              Showing {brands.length} of {totalBrands} brands
            </div>
          </div>
        </form>
      </div>
      
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Partner Brands
          </h3>
          
          {isLoading ? (
            <div className="animate-pulse space-y-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : brands.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 mb-4">
                <svg className="mx-auto h-12 w-12" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-sm font-medium text-gray-900 mb-2">No brands found</h3>
              <p className="text-sm text-gray-500 mb-4">
                {searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'
                  ? 'Try adjusting your search criteria.'
                  : 'Get started by adding your first brand.'}
              </p>
              {!searchTerm && categoryFilter === 'all' && statusFilter === 'all' && (
                <Link
                  href="/brands/new"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
                >
                  <PlusIcon className="w-4 h-4 mr-2" />
                  Add Brand
                </Link>
              )}
            </div>
          ) : (
            <>
              <BrandTable 
                brands={brands}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
              />
              
              {/* Pagination */}
              {totalPages > 1 && (
                <div className="mt-6 flex items-center justify-between">
                  <div className="text-sm text-gray-700">
                    Page {currentPage} of {totalPages}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                      disabled={currentPage === 1}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Previous
                    </button>
                    <button
                      onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                      disabled={currentPage === totalPages}
                      className="px-3 py-2 text-sm font-medium text-gray-500 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Next
                    </button>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
