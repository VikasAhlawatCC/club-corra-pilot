'use client'

import { useState, useEffect, useCallback } from 'react'
import Link from 'next/link'
import { PlusIcon, MagnifyingGlassIcon, FunnelIcon, ArrowPathIcon } from '@heroicons/react/24/outline'
import { BrandTable } from '@/components/brands/BrandTable'
import { brandApi, categoryApi } from '@/lib/api'
import { useToast } from '@/components/common'
import { useBrands } from '@/hooks/useBrands'
import { useBrandFilters } from '@/hooks/useBrandFilters'
import { useDebounce } from '@/hooks/useDebounce'
import { ErrorBoundary } from '@/components/common'
import type { Brand, BrandCategory } from '@shared/schemas'

function BrandsPageContent() {
  const [categories, setCategories] = useState<BrandCategory[]>([])
  const [isLoadingCategories, setIsLoadingCategories] = useState(true)
  const [pageSize, setPageSize] = useState(20)
  const [showDeleteModal, setShowDeleteModal] = useState<string | null>(null)
  const { showSuccess, showError } = useToast()
  
  const {
    brands,
    isLoading,
    totalPages,
    totalBrands,
    fetchBrands,
    deleteBrand,
    toggleBrandStatus,
  } = useBrands()

  // Ensure brands is always an array to prevent crashes
  const safeBrands = brands || []
  
  const {
    searchTerm,
    categoryFilter,
    statusFilter,
    currentPage,
    setSearchTerm,
    setCategoryFilter,
    setStatusFilter,
    setCurrentPage,
    clearFilters,
    handleFilterChange,
    hasActiveFilters,
  } = useBrandFilters()

  // Debounce search term to prevent excessive API calls
  const debouncedSearchTerm = useDebounce(searchTerm, 500)

  useEffect(() => {
    fetchCategories()
    fetchBrands({
      page: currentPage,
      pageSize,
      searchTerm: searchTerm || undefined,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
    })
  }, []) // Only run once on mount

  useEffect(() => {
    // Only fetch brands when dependencies actually change, not on every render
    if (currentPage > 0) {
      fetchBrands({
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      })
    }
  }, [currentPage, pageSize, debouncedSearchTerm, categoryFilter, statusFilter]) // Use debounced search term

  const fetchCategories = async () => {
    try {
      setIsLoadingCategories(true)
      const response = await categoryApi.getAllCategories()
      setCategories(response)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
      showError('Failed to fetch categories')
    } finally {
      setIsLoadingCategories(false)
    }
  }



  const handleEdit = (brand: Brand) => {
    // Navigate to edit page
    window.location.href = `/brands/${brand.id}`
  }

  const handleDelete = async (brandId: string) => {
    setShowDeleteModal(brandId)
  }

  const confirmDelete = async () => {
    if (!showDeleteModal) return
    
    const success = await deleteBrand(showDeleteModal)
    if (success) {
      showSuccess('Brand deleted successfully')
      fetchBrands({
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      })
    }
    setShowDeleteModal(null)
  }

  const handleView = (brand: Brand) => {
    // Navigate to view page (could be same as edit for now)
    window.location.href = `/brands/${brand.id}`
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    if (isLoading) return // Prevent multiple API calls while loading
    
    setCurrentPage(1)
    fetchBrands({
      page: 1,
      pageSize,
      searchTerm: searchTerm || undefined,
      categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
      isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
    })
  }

  const handleToggleStatus = async (brandId: string) => {
    if (isLoading) return // Prevent multiple API calls while loading
    
    const success = await toggleBrandStatus(brandId)
    if (success) {
      showSuccess('Brand status updated successfully')
      fetchBrands({
        page: currentPage,
        pageSize,
        searchTerm: debouncedSearchTerm || undefined,
        categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
        isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
      })
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Brand Management</h1>
          <p className="text-gray-600">Manage partner brands and their earning/redeeming rules</p>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={() => {
              if (isLoading) return // Prevent multiple API calls while loading
              fetchBrands({
                page: currentPage,
                pageSize,
                searchTerm: debouncedSearchTerm || undefined,
                categoryId: categoryFilter === 'all' ? undefined : categoryFilter,
                isActive: statusFilter === 'all' ? undefined : statusFilter === 'active'
              })
            }}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
            title="Refresh brands list"
          >
            <ArrowPathIcon className={`w-4 h-4 mr-2 ${isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <Link
            href="/brands/new"
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
          >
            <PlusIcon className="w-4 h-4 mr-2" />
            Add Brand
          </Link>
        </div>
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
                  setCurrentPage(1)
                }}
                className="block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
                disabled={isLoadingCategories}
              >
                <option value="all">All Categories</option>
                {isLoadingCategories ? (
                  <option value="" disabled>Loading categories...</option>
                ) : (
                  categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))
                )}
              </select>
              {isLoadingCategories && (
                <p className="mt-1 text-xs text-gray-500">Loading categories...</p>
              )}
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
                  setCurrentPage(1)
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
            <div className="flex space-x-3">
              <button
                type="submit"
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
              >
                <FunnelIcon className="w-4 h-4 mr-2" />
                Apply Filters
              </button>
              
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={() => {
                    setSearchTerm('')
                    setCategoryFilter('all')
                    setStatusFilter('all')
                    setCurrentPage(1)
                  }}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Clear Filters
                </button>
              )}
            </div>
            
            <div className="text-sm text-gray-500">
              Showing {safeBrands.length} of {totalBrands} brands
              {hasActiveFilters && (
                <span className="ml-2 text-indigo-600">
                  (filtered)
                </span>
              )}
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
              <div className="flex items-center justify-between">
                <div className="h-4 bg-gray-200 rounded w-1/4"></div>
                <div className="h-4 bg-gray-200 rounded w-1/6"></div>
              </div>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 bg-gray-200 rounded"></div>
              ))}
            </div>
          ) : safeBrands.length === 0 ? (
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
                brands={safeBrands}
                onEdit={handleEdit}
                onDelete={handleDelete}
                onView={handleView}
                onToggleStatus={handleToggleStatus}
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
      
      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3 text-center">
              <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Brand</h3>
              <div className="mt-2 px-7 py-3">
                <p className="text-sm text-gray-500">
                  Are you sure you want to delete this brand? This action cannot be undone.
                </p>
              </div>
              <div className="flex justify-center space-x-4 mt-4">
                <button
                  onClick={() => setShowDeleteModal(null)}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={confirmDelete}
                  className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-medium rounded-md"
                >
                  Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default function BrandsPage() {
  return (
    <ErrorBoundary fallback={<div className="p-6 text-red-600">Something went wrong loading the brands page. Please refresh the page.</div>}>
      <BrandsPageContent />
    </ErrorBoundary>
  )
}
