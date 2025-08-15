'use client'

import { useState, useEffect } from 'react'
import { XMarkIcon, PlusIcon } from '@heroicons/react/24/outline'
import type { BrandCategory, CreateBrandCategoryRequest, UpdateBrandCategoryRequest } from '@shared/schemas'

interface BaseCategoryModalProps {
  category?: BrandCategory | null
  isOpen: boolean
  onClose: () => void
  isLoading?: boolean
}

interface CreateCategoryModalProps extends BaseCategoryModalProps {
  mode: 'create'
  onSubmit: (data: CreateBrandCategoryRequest) => Promise<void> | void
}

interface EditCategoryModalProps extends BaseCategoryModalProps {
  mode: 'edit'
  onSubmit: (data: UpdateBrandCategoryRequest) => Promise<void> | void
}

type CategoryModalProps = CreateCategoryModalProps | EditCategoryModalProps

export function CategoryModal({ 
  mode, 
  category, 
  isOpen, 
  onClose, 
  onSubmit, 
  isLoading = false 
}: CategoryModalProps) {
  const [formData, setFormData] = useState<CreateBrandCategoryRequest>({
    name: '',
    description: '',
    icon: '',
    color: '',
  })

  const [errors, setErrors] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    if (category && mode === 'edit') {
      setFormData({
        name: category.name,
        description: category.description || '',
        icon: category.icon || '',
        color: category.color || '',
      })
    } else {
      setFormData({
        name: '',
        description: '',
        icon: '',
        color: '',
      })
    }
    setErrors({})
  }, [category, mode])

  const validateForm = () => {
    const newErrors: { [key: string]: string } = {}

    // Required fields
    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required'
    } else if (formData.name.trim().length > 100) {
      newErrors.name = 'Category name cannot exceed 100 characters'
    }

    // Optional field validation
    if (formData.description && formData.description.length > 500) {
      newErrors.description = 'Description cannot exceed 500 characters'
    }

    if (formData.icon && formData.icon.length > 100) {
      newErrors.icon = 'Icon name cannot exceed 100 characters'
    }

    if (formData.color && !isValidHexColor(formData.color)) {
      newErrors.color = 'Please enter a valid hex color (e.g., #FF0000)'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const isValidHexColor = (color: string) => {
    return /^#[0-9A-Fa-f]{6}$/.test(color)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    
    if (!validateForm()) return

    const submitData = { ...formData }
    
    // Clean up empty strings
    if (submitData.description === '') submitData.description = undefined
    if (submitData.icon === '') submitData.icon = undefined
    if (submitData.color === '') submitData.color = undefined

    if (mode === 'create') {
      (onSubmit as (data: CreateBrandCategoryRequest) => Promise<void> | void)(submitData as CreateBrandCategoryRequest)
    } else {
      (onSubmit as (data: UpdateBrandCategoryRequest) => Promise<void> | void)(submitData as UpdateBrandCategoryRequest)
    }
  }

  const handleClose = () => {
    setFormData({
      name: '',
      description: '',
      icon: '',
      color: '',
    })
    setErrors({})
    onClose()
  }

  const handleInputChange = (field: keyof CreateBrandCategoryRequest, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }))
    
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
      <div className="relative top-10 mx-auto p-5 border w-11/12 max-w-2xl shadow-lg rounded-md bg-white">
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-2xl font-bold text-gray-900">
            {mode === 'create' ? 'Create New Category' : 'Edit Category'}
          </h3>
          <button
            onClick={handleClose}
            className="text-gray-400 hover:text-gray-600 p-2 rounded-full hover:bg-gray-100"
          >
            <XMarkIcon className="w-6 h-6" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Basic Information */}
          <div className="space-y-4">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Category Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => handleInputChange('name', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.name ? 'border-red-300' : 'border-gray-300'
                }`}
                placeholder="Enter category name"
                required
              />
              {errors.name && (
                <p className="mt-1 text-sm text-red-600">{errors.name}</p>
              )}
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                Description
              </label>
              <textarea
                id="description"
                value={formData.description}
                onChange={(e) => handleInputChange('description', e.target.value)}
                className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                  errors.description ? 'border-red-300' : 'border-gray-300'
                }`}
                rows={3}
                placeholder="Enter category description (optional)"
              />
              {errors.description && (
                <p className="mt-1 text-sm text-red-600">{errors.description}</p>
              )}
              <p className="mt-1 text-xs text-gray-500">
                Optional: Brief description of the category
              </p>
            </div>
          </div>

          {/* Visual Properties */}
          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="text-lg font-semibold text-gray-900 mb-4">Visual Properties</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="icon" className="block text-sm font-medium text-gray-700 mb-2">
                  Icon Name
                </label>
                <input
                  type="text"
                  id="icon"
                  value={formData.icon}
                  onChange={(e) => handleInputChange('icon', e.target.value)}
                  className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                    errors.icon ? 'border-red-300' : 'border-gray-300'
                  }`}
                  placeholder="e.g., shopping-bag, food, electronics"
                />
                {errors.icon && (
                  <p className="mt-1 text-sm text-red-600">{errors.icon}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Icon identifier for the category
                </p>
              </div>

              <div>
                <label htmlFor="color" className="block text-sm font-medium text-gray-700 mb-2">
                  Color
                </label>
                <div className="flex space-x-2">
                  <input
                    type="color"
                    id="color"
                    value={formData.color || '#3B82F6'}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className="w-12 h-10 border border-gray-300 rounded cursor-pointer"
                  />
                  <input
                    type="text"
                    value={formData.color}
                    onChange={(e) => handleInputChange('color', e.target.value)}
                    className={`flex-1 px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
                      errors.color ? 'border-red-300' : 'border-gray-300'
                    }`}
                    placeholder="#3B82F6"
                  />
                </div>
                {errors.color && (
                  <p className="mt-1 text-sm text-red-600">{errors.color}</p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  Optional: Hex color code for category styling
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
                  {mode === 'create' ? 'Creating...' : 'Updating...'}
                </>
              ) : (
                <>
                  <PlusIcon className="w-4 h-4 mr-2" />
                  {mode === 'create' ? 'Create Category' : 'Update Category'}
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
