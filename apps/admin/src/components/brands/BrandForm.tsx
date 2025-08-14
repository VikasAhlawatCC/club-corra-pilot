'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon, TrashIcon } from '@heroicons/react/24/outline'
import type { Brand, CreateBrandRequest, UpdateBrandRequest, BrandCategory } from '@shared/schemas'

interface BrandFormProps {
  brand?: Brand | null
  categories: BrandCategory[]
  isOpen: boolean
  onClose: () => void
  onSubmit: (data: CreateBrandRequest | UpdateBrandRequest) => void
  isLoading?: boolean
}

export function BrandForm({ 
  brand, 
  categories, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: BrandFormProps) {
  const [formData, setFormData] = useState<CreateBrandRequest>({
    name: '',
    description: '',
    logoUrl: '',
    categoryId: '',
    earningPercentage: 30,
    redemptionPercentage: 100,
    minRedemptionAmount: undefined,
    maxRedemptionAmount: undefined,
    overallMaxCap: 2000,
    brandwiseMaxCap: 2000,
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (brand) {
      setFormData({
        name: brand.name,
        description: brand.description,
        logoUrl: brand.logoUrl || '',
        categoryId: brand.categoryId,
        earningPercentage: brand.earningPercentage,
        redemptionPercentage: brand.redemptionPercentage,
        minRedemptionAmount: brand.minRedemptionAmount,
        maxRedemptionAmount: brand.maxRedemptionAmount,
        overallMaxCap: brand.overallMaxCap,
        brandwiseMaxCap: brand.brandwiseMaxCap,
      })
    } else {
      setFormData({
        name: '',
        description: '',
        logoUrl: '',
        categoryId: '',
        earningPercentage: 30,
        redemptionPercentage: 100,
        minRedemptionAmount: undefined,
        maxRedemptionAmount: undefined,
        overallMaxCap: 2000,
        brandwiseMaxCap: 2000,
      })
    }
    setErrors({})
  }, [brand])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Brand name is required'
    } else if (formData.name.trim().length > 200) {
      newErrors.name = 'Brand name cannot exceed 200 characters'
    }

    if (!formData.description.trim()) {
      newErrors.description = 'Description is required'
    }

    if (!formData.categoryId) {
      newErrors.categoryId = 'Category is required'
    }

    // Percentage validation
    if (formData.earningPercentage < 0 || formData.earningPercentage > 100) {
      newErrors.earningPercentage = 'Earning percentage must be between 0 and 100'
    }

    if (formData.redemptionPercentage < 0 || formData.redemptionPercentage > 100) {
      newErrors.redemptionPercentage = 'Redemption percentage must be between 0 and 100'
    }

    // Amount validation
    if (formData.minRedemptionAmount !== undefined && formData.minRedemptionAmount < 0) {
      newErrors.minRedemptionAmount = 'Minimum redemption amount must be non-negative'
    }

    if (formData.maxRedemptionAmount !== undefined && formData.maxRedemptionAmount < 0) {
      newErrors.maxRedemptionAmount = 'Maximum redemption amount must be non-negative'
    }

    if (formData.minRedemptionAmount !== undefined && formData.maxRedemptionAmount !== undefined) {
      if (formData.minRedemptionAmount > formData.maxRedemptionAmount) {
        newErrors.maxRedemptionAmount = 'Maximum redemption amount must be greater than minimum'
      }
    }

    // Cap validation
    if (formData.overallMaxCap < 0) {
      newErrors.overallMaxCap = 'Overall max cap must be non-negative'
    }

    if (formData.brandwiseMaxCap < 0) {
      newErrors.brandwiseMaxCap = 'Brandwise max cap must be non-negative'
    }

    // URL validation
    if (formData.logoUrl && !isValidUrl(formData.logoUrl)) {
      newErrors.logoUrl = 'Please enter a valid URL'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidUrl = (string: string) => {
    try {
      new URL(string)
      return true
    } catch (_) {
      return false
    }
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = { ...formData }
    
    // Clean up undefined values
    if (submitData.logoUrl === '') submitData.logoUrl = undefined
    if (submitData.minRedemptionAmount === undefined) delete submitData.minRedemptionAmount
    if (submitData.maxRedemptionAmount === undefined) delete submitData.maxRedemptionAmount

    onSubmit(submitData)
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      logoUrl: '',
      categoryId: '',
      earningPercentage: 30,
      redemptionPercentage: 100,
      minRedemptionAmount: undefined,
      maxRedemptionAmount: undefined,
      overallMaxCap: 2000,
      brandwiseMaxCap: 2000,
    })
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof CreateBrandRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-4xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {brand ? 'Edit Brand' : 'Create New Brand'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Basic Information */}
            <div className="space-y-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                  Brand Name *
                </label>
                <input
                  type="text"
                  id="name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.name ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="Enter brand name"
                  required
                />
                {errors.name && (
                  <p className="mt-1 text-sm text-red-600">{errors.name}</p>
                )}
              </div>

              <div>
                <label htmlFor="categoryId" className="block text-sm font-medium text-gray-700 mb-2">
                  Category *
                </label>
                <select
                  id="categoryId"
                  value={formData.categoryId}
                  onChange={(e) => handleInputChange('categoryId', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.categoryId ? 'border-red-300' : 'border-gray-300'
                  }`}
                  required
                >
                  <option value="">Select a category</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.id}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {errors.categoryId && (
                  <p className="mt-1 text-sm text-red-600">{errors.categoryId}</p>
                )}
              </div>

              <div>
                <label htmlFor="logoUrl" className="block text-sm font-medium text-gray-700 mb-2">
                  Logo URL
                </label>
                <input
                  type="url"
                  id="logoUrl"
                  value={formData.logoUrl}
                  onChange={(e) => handleInputChange('logoUrl', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.logoUrl ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="https://example.com/logo.png"
                />
                {errors.logoUrl && (
                  <p className="mt-1 text-sm text-red-600">{errors.logoUrl}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: URL to the brand logo image
                </p>
              </div>
            </div>

            {/* Description */}
            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description *
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={4}
                placeholder="Enter brand description"
                required
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
            </div>
          </div>

          {/* Percentage Configuration */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Percentage Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="earningPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Earning Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="earningPercentage"
                    value={formData.earningPercentage}
                    onChange={(e) => handleInputChange('earningPercentage', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.earningPercentage ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
                {errors.earningPercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.earningPercentage}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of bill amount users earn as coins
                </p>
              </div>

              <div>
                <label htmlFor="redemptionPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Redemption Percentage *
                </label>
                <div className="relative">
                  <input
                    type="number"
                    id="redemptionPercentage"
                    value={formData.redemptionPercentage}
                    onChange={(e) => handleInputChange('redemptionPercentage', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 pr-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.redemptionPercentage ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    max="100"
                    step="0.01"
                    required
                  />
                  <span className="absolute right-3 top-2 text-gray-500">%</span>
                </div>
                {errors.redemptionPercentage && (
                  <p className="mt-1 text-sm text-red-600">{errors.redemptionPercentage}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Percentage of bill amount users can redeem with coins
                </p>
              </div>
            </div>
          </div>

          {/* Redemption Amount Limits */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Redemption Amount Limits</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="minRedemptionAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Minimum Redemption Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="minRedemptionAmount"
                    value={formData.minRedemptionAmount || ''}
                    onChange={(e) => handleInputChange('minRedemptionAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.minRedemptionAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    placeholder="No minimum"
                  />
                </div>
                {errors.minRedemptionAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.minRedemptionAmount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Minimum bill amount for redemption
                </p>
              </div>

              <div>
                <label htmlFor="maxRedemptionAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Maximum Redemption Amount
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="maxRedemptionAmount"
                    value={formData.maxRedemptionAmount || ''}
                    onChange={(e) => handleInputChange('maxRedemptionAmount', e.target.value ? parseFloat(e.target.value) : undefined)}
                    className={`w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.maxRedemptionAmount ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    placeholder="No maximum"
                  />
                </div>
                {errors.maxRedemptionAmount && (
                  <p className="mt-1 text-sm text-red-600">{errors.maxRedemptionAmount}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Maximum bill amount for redemption
                </p>
              </div>
            </div>
          </div>

          {/* Cap Configuration */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Cap Configuration</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="overallMaxCap" className="block text-sm font-medium text-gray-700 mb-2">
                  Overall Max Cap *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="overallMaxCap"
                    value={formData.overallMaxCap}
                    onChange={(e) => handleInputChange('overallMaxCap', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.overallMaxCap ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {errors.overallMaxCap && (
                  <p className="mt-1 text-sm text-red-600">{errors.overallMaxCap}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum total redemption amount across all users for this brand
                </p>
              </div>

              <div>
                <label htmlFor="brandwiseMaxCap" className="block text-sm font-medium text-gray-700 mb-2">
                  Brandwise Max Cap *
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-gray-500">₹</span>
                  <input
                    type="number"
                    id="brandwiseMaxCap"
                    value={formData.brandwiseMaxCap}
                    onChange={(e) => handleInputChange('brandwiseMaxCap', parseFloat(e.target.value) || 0)}
                    className={`w-full px-3 py-2 pl-8 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.brandwiseMaxCap ? 'border-red-300' : 'border-gray-300'
                    }`}
                    min="0"
                    step="0.01"
                    required
                  />
                </div>
                {errors.brandwiseMaxCap && (
                  <p className="mt-1 text-sm text-red-600">{errors.brandwiseMaxCap}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Maximum redemption amount per transaction for this brand
                </p>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
            <button
              type="button"
              onClick={handleClose}
              disabled={isLoading}
              className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {brand ? 'Updating...' : 'Creating...'}
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  {brand ? 'Update Brand' : 'Create Brand'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
