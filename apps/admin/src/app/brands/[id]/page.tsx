'use client'

import { useState, useEffect } from 'react'
import { useRouter, useParams } from 'next/navigation'
import Link from 'next/link'
import { ArrowLeftIcon, PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline'
import { brandApi, categoryApi } from '@/lib/api'
import { useToast } from '@/components/common'
import type { Brand, BrandCategory, UpdateBrandRequest } from '@shared/schemas'

export default function BrandEditPage() {
  const router = useRouter()
  const params = useParams()
  const brandId = params.id as string
  
  const [brand, setBrand] = useState<Brand | null>(null)
  const [categories, setCategories] = useState<BrandCategory[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [isSaving, setIsSaving] = useState(false)
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const { showSuccess, showError } = useToast()

  useEffect(() => {
    if (brandId) {
      fetchBrand()
      fetchCategories()
    }
  }, [brandId])

  const fetchBrand = async () => {
    try {
      setIsLoading(true)
      const response = await brandApi.getBrand(brandId)
      setBrand(response)
    } catch (error) {
      console.error('Failed to fetch brand:', error)
      showError('Failed to fetch brand')
      router.push('/brands')
    } finally {
      setIsLoading(false)
    }
  }

  const fetchCategories = async () => {
    try {
      const response = await categoryApi.getAllCategories()
      setCategories(response)
    } catch (error) {
      console.error('Failed to fetch categories:', error)
    }
  }

  const handleSave = async (formData: UpdateBrandRequest) => {
    try {
      setIsSaving(true)
      await brandApi.updateBrand(brandId, formData)
      showSuccess('Brand updated successfully')
      fetchBrand() // Refresh the brand data
    } catch (error) {
      console.error('Failed to update brand:', error)
      showError('Failed to update brand')
    } finally {
      setIsSaving(false)
    }
  }

  const handleToggleStatus = async () => {
    try {
      await brandApi.toggleBrandStatus(brandId)
      showSuccess('Brand status updated successfully')
      fetchBrand() // Refresh the brand data
    } catch (error) {
      console.error('Failed to update brand status:', error)
      showError('Failed to update brand status')
    }
  }

  const handleDelete = async () => {
    try {
      await brandApi.deleteBrand(brandId)
      showSuccess('Brand deleted successfully')
      router.push('/brands')
    } catch (error) {
      console.error('Failed to delete brand:', error)
      showError('Failed to delete brand')
    }
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="animate-pulse">
          <div className="h-8 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2 mb-8"></div>
          <div className="space-y-4">
            {[...Array(8)].map((_, i) => (
              <div key={i} className="h-16 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    )
  }

  if (!brand) {
    return (
      <div className="text-center py-12">
        <h3 className="text-lg font-medium text-gray-900 mb-2">Brand not found</h3>
        <p className="text-gray-500 mb-4">The brand you're looking for doesn't exist.</p>
        <Link
          href="/brands"
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-indigo-600 bg-indigo-100 hover:bg-indigo-200"
        >
          <ArrowLeftIcon className="w-4 h-4 mr-2" />
          Back to Brands
        </Link>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center space-x-4">
          <Link
            href="/brands"
            className="inline-flex items-center text-sm text-gray-500 hover:text-gray-700"
          >
            <ArrowLeftIcon className="w-4 h-4 mr-2" />
            Back to Brands
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">{brand.name}</h1>
            <p className="text-gray-600">Edit brand details and settings</p>
          </div>
        </div>
        <div className="flex space-x-3">
          <button
            onClick={handleToggleStatus}
            className={`inline-flex items-center px-4 py-2 border text-sm font-medium rounded-md ${
              brand.isActive
                ? 'border-red-300 text-red-700 bg-red-50 hover:bg-red-100'
                : 'border-green-300 text-green-700 bg-green-50 hover:bg-green-100'
            }`}
          >
            {brand.isActive ? 'Deactivate' : 'Activate'}
          </button>
          <button
            onClick={() => setShowDeleteModal(true)}
            className="inline-flex items-center px-4 py-2 border border-red-300 text-sm font-medium rounded-md text-red-700 bg-red-50 hover:bg-red-100"
          >
            <TrashIcon className="w-4 h-4 mr-2" />
            Delete
          </button>
        </div>
      </div>

      {/* Brand Form */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <BrandForm
            brand={brand}
            categories={categories}
            onSave={handleSave}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <DeleteConfirmationModal
          brandName={brand.name}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteModal(false)}
        />
      )}
    </div>
  )
}

// Brand Form Component
interface BrandFormProps {
  brand: Brand
  categories: BrandCategory[]
  onSave: (data: UpdateBrandRequest) => void
  isSaving: boolean
}

function BrandForm({ brand, categories, onSave, isSaving }: BrandFormProps) {
  const [formData, setFormData] = useState({
    name: brand.name,
    description: brand.description,
    logoUrl: brand.logoUrl || '',
    categoryId: brand.categoryId,
    earningPercentage: brand.earningPercentage,
    redemptionPercentage: brand.redemptionPercentage,
    minRedemptionAmount: brand.minRedemptionAmount,
    maxRedemptionAmount: brand.maxRedemptionAmount,
    brandwiseMaxCap: brand.brandwiseMaxCap,
  })

  const [errors, setErrors] = useState<Record<string, string>>({})

  const validateForm = () => {
    const newErrors: Record<string, string> = {}

    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (formData.earningPercentage < 0 || formData.earningPercentage > 100) {
      newErrors.earningPercentage = 'Earning percentage must be between 0 and 100'
    }

    if (formData.redemptionPercentage < 0 || formData.redemptionPercentage > 100) {
      newErrors.redemptionPercentage = 'Redemption percentage must be between 0 and 100'
    }

    if (formData.minRedemptionAmount < 0) {
      newErrors.minRedemptionAmount = 'Minimum redemption amount must be non-negative'
    }

    if (formData.maxRedemptionAmount < formData.minRedemptionAmount) {
      newErrors.maxRedemptionAmount = 'Maximum redemption amount must be greater than minimum'
    }

    if (formData.brandwiseMaxCap < 0) {
      newErrors.brandwiseMaxCap = 'Brandwise max cap must be non-negative'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (validateForm()) {
      onSave(formData)
    }
  }

  const handleInputChange = (field: string, value: string | number) => {
    setFormData({ ...formData, [field]: value })
    if (errors[field]) {
      setErrors({ ...errors, [field]: '' })
    }
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
        {/* Basic Information */}
        <div className="sm:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Basic Information</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Brand Name</label>
          <input
            type="text"
            required
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.name ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.name && <p className="mt-1 text-sm text-red-600">{errors.name}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">Category</label>
          <select
            value={formData.categoryId}
            onChange={(e) => handleInputChange('categoryId', e.target.value)}
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          >
            {categories.map((category) => (
              <option key={category.id} value={category.id}>
                {category.name}
              </option>
            ))}
          </select>
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Description</label>
          <textarea
            required
            rows={3}
            value={formData.description}
            onChange={(e) => handleInputChange('description', e.target.value)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.description ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.description && <p className="mt-1 text-sm text-red-600">{errors.description}</p>}
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium text-gray-700">Logo URL</label>
          <input
            type="url"
            value={formData.logoUrl}
            onChange={(e) => handleInputChange('logoUrl', e.target.value)}
            placeholder="https://example.com/logo.png"
            className="mt-1 block w-full border border-gray-300 rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
          />
        </div>

        {/* Earning & Redemption Rules */}
        <div className="sm:col-span-2">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Earning & Redemption Rules</h3>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Earning Percentage (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.earningPercentage}
            onChange={(e) => handleInputChange('earningPercentage', parseFloat(e.target.value) || 0)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.earningPercentage ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.earningPercentage && <p className="mt-1 text-sm text-red-600">{errors.earningPercentage}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Redemption Percentage (%)
          </label>
          <input
            type="number"
            min="0"
            max="100"
            step="0.1"
            value={formData.redemptionPercentage}
            onChange={(e) => handleInputChange('redemptionPercentage', parseFloat(e.target.value) || 0)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.redemptionPercentage ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.redemptionPercentage && <p className="mt-1 text-sm text-red-600">{errors.redemptionPercentage}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Min Redemption Amount
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.minRedemptionAmount}
            onChange={(e) => handleInputChange('minRedemptionAmount', parseInt(e.target.value) || 0)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.minRedemptionAmount ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.minRedemptionAmount && <p className="mt-1 text-sm text-red-600">{errors.minRedemptionAmount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Max Redemption Amount
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.maxRedemptionAmount}
            onChange={(e) => handleInputChange('maxRedemptionAmount', parseInt(e.target.value) || 0)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.maxRedemptionAmount ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.maxRedemptionAmount && <p className="mt-1 text-sm text-red-600">{errors.maxRedemptionAmount}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700">
            Brandwise Max Cap
          </label>
          <input
            type="number"
            min="0"
            step="1"
            value={formData.brandwiseMaxCap}
            onChange={(e) => handleInputChange('brandwiseMaxCap', parseInt(e.target.value) || 0)}
            className={`mt-1 block w-full border rounded-md px-3 py-2 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 ${
              errors.brandwiseMaxCap ? 'border-red-300' : 'border-gray-300'
            }`}
          />
          {errors.brandwiseMaxCap && <p className="mt-1 text-sm text-red-600">{errors.brandwiseMaxCap}</p>}
        </div>
      </div>

      {/* Form Actions */}
      <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
        <Link
          href="/brands"
          className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
        >
          Cancel
        </Link>
        <button
          type="submit"
          disabled={isSaving}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSaving ? 'Saving...' : 'Save Changes'}
        </button>
      </div>
    </form>
  )
}

// Delete Confirmation Modal
interface DeleteConfirmationModalProps {
  brandName: string
  onConfirm: () => void
  onCancel: () => void
}

function DeleteConfirmationModal({ brandName, onConfirm, onCancel }: DeleteConfirmationModalProps) {
  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
        <div className="mt-3 text-center">
          <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
            <TrashIcon className="h-6 w-6 text-red-600" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mt-4">Delete Brand</h3>
          <p className="text-sm text-gray-500 mt-2">
            Are you sure you want to delete "{brandName}"? This action cannot be undone and will affect all associated transactions.
          </p>
          <div className="flex justify-center space-x-3 mt-6">
            <button
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
            >
              Cancel
            </button>
            <button
              onClick={onConfirm}
              className="px-4 py-2 text-sm font-medium text-white bg-red-600 border border-transparent rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              Delete
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
