import { useState, useCallback } from 'react'

export function useBrandFilters() {
  const [searchTerm, setSearchTerm] = useState('')
  const [categoryFilter, setCategoryFilter] = useState<string>('all')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [currentPage, setCurrentPage] = useState(1)

  const clearFilters = useCallback(() => {
    setSearchTerm('')
    setCategoryFilter('all')
    setStatusFilter('all')
    setCurrentPage(1)
  }, [])

  const handleFilterChange = useCallback(() => {
    setCurrentPage(1)
  }, [])

  const hasActiveFilters = searchTerm || categoryFilter !== 'all' || statusFilter !== 'all'

  return {
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
  }
}
