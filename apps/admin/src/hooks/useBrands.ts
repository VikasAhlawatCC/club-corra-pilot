import { useState, useCallback } from 'react'
import { brandApi } from '@/lib/api'
import { useToast } from '@/components/common'
import type { Brand } from '@shared/schemas'

interface BrandSearchParams {
  page: number
  pageSize: number
  searchTerm?: string
  categoryId?: string
  isActive?: boolean
}

export function useBrands() {
  const [brands, setBrands] = useState<Brand[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [totalPages, setTotalPages] = useState(1)
  const [totalBrands, setTotalBrands] = useState(0)
  const { showError } = useToast()

  const fetchBrands = useCallback(async (params: BrandSearchParams) => {
    try {
      setIsLoading(true)
      
      const response = await brandApi.getAllBrands(
        params.page,
        params.pageSize,
        params.searchTerm,
        params.categoryId,
        params.isActive
      )
      
      // Add safety checks for the response structure
      if (response && typeof response === 'object') {
        // The API returns { brands: [...], total: ..., page: ..., limit: ..., totalPages: ... }
        setBrands(response.brands || [])
        setTotalPages(response.totalPages || 1)
        setTotalBrands(response.total || 0)
      } else {
        console.error('Invalid response structure:', response)
        setBrands([])
        setTotalPages(1)
        setTotalBrands(0)
        showError('Invalid response from server')
      }
    } catch (error) {
      console.error('Failed to fetch brands:', error)
      showError('Failed to fetch brands')
      // Set default values on error
      setBrands([])
      setTotalPages(1)
      setTotalBrands(0)
    } finally {
      setIsLoading(false)
    }
  }, [showError]) // Re-add showError dependency since we're using it in the error handling

  const deleteBrand = useCallback(async (brandId: string) => {
    try {
      await brandApi.deleteBrand(brandId)
      return true
    } catch (error) {
      console.error('Failed to delete brand:', error)
      showError('Failed to delete brand')
      return false
    }
  }, [showError])

  const toggleBrandStatus = useCallback(async (brandId: string) => {
    try {
      await brandApi.toggleBrandStatus(brandId)
      return true
    } catch (error) {
      console.error('Failed to update brand status:', error)
      showError('Failed to update brand status')
      return false
    }
  }, [showError])

  return {
    brands,
    isLoading,
    totalPages,
    totalBrands,
    fetchBrands,
    deleteBrand,
    toggleBrandStatus,
  }
}
