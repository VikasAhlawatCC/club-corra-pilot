'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { ArrowLeftIcon } from '@heroicons/react/24/outline'
import { BrandForm } from '@/components/brands/BrandForm'
import { useToast, ToastContainer } from '@/components/common'
import type { CreateBrandRequest, BrandCategory } from '@shared/schemas'

export default function NewBrandPage() {
  const router = useRouter()
  const [isLoading, setIsLoading] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  // Mock categories - in real app this would come from API
  const categories: BrandCategory[] = [
    {
      id: '550e8400-e29b-41d4-a716-446655440010',
      name: 'E-commerce',
      description: 'Online shopping and digital services',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440011',
      name: 'Food & Beverage',
      description: 'Food delivery and dining services',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440012',
      name: 'Retail',
      description: 'Physical retail stores and shopping',
      createdAt: new Date(),
      updatedAt: new Date()
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440013',
      name: 'Entertainment',
      description: 'Movies, games, and entertainment services',
      createdAt: new Date(),
      updatedAt: new Date()
    }
  ]

  const handleSubmit = async (data: CreateBrandRequest | any) => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      console.log('Creating brand:', data)
      
      // Simulate API delay
      await new Promise(resolve => setTimeout(resolve, 1000))
      
      showSuccess('Brand Created', 'New brand has been created successfully')
      
      // Redirect to brands list after a short delay
      setTimeout(() => {
        router.push('/brands')
      }, 1500)
      
    } catch (error) {
      console.error('Failed to create brand:', error)
      showError('Creation Failed', 'Failed to create brand. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    router.push('/brands')
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <button
            onClick={handleClose}
            className="mr-4 p-2 text-gray-400 hover:text-gray-600 rounded-full hover:bg-gray-100"
          >
            <ArrowLeftIcon className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-3xl font-bold text-gray-900">Create New Brand</h1>
            <p className="mt-2 text-gray-600">
              Add a new partner brand to the Club Corra system.
            </p>
          </div>
        </div>
      </div>

      <BrandForm
        brand={null}
        categories={categories}
        isOpen={true}
        onClose={handleClose}
        onSubmit={handleSubmit}
        isLoading={isLoading}
      />
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
