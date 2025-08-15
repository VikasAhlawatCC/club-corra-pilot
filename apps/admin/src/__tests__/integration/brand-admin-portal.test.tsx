import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import '@testing-library/jest-dom'
import { BrandTable } from '@/components/brands/BrandTable'
import { BrandForm } from '@/components/brands/BrandForm'
import { CategoryModal } from '@/components/brands/CategoryModal'
import { DeleteConfirmationModal } from '@/components/brands/DeleteConfirmationModal'

// Mock the API calls
jest.mock('@/lib/api', () => ({
  brandApi: {
    getAllBrands: jest.fn(),
    createBrand: jest.fn(),
    updateBrand: jest.fn(),
    deleteBrand: jest.fn(),
    toggleBrandStatus: jest.fn(),
  },
  categoryApi: {
    getAllCategories: jest.fn(),
  },
}))

// Mock data
const mockBrands = [
  {
    id: '1',
    name: 'Test Brand 1',
    description: 'Test Description 1',
    logoUrl: 'https://example.com/logo1.png',
    categoryId: 'cat1',
    category: { id: 'cat1', name: 'Electronics', description: 'Electronic items' },
    earningPercentage: 10,
    redemptionPercentage: 30,
    minRedemptionAmount: 1,
    maxRedemptionAmount: 1000,
    brandwiseMaxCap: 1000,
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: '2',
    name: 'Test Brand 2',
    description: 'Test Description 2',
    logoUrl: undefined,
    categoryId: 'cat2',
    category: { id: 'cat2', name: 'Food', description: 'Food items' },
    earningPercentage: 15,
    redemptionPercentage: 25,
    minRedemptionAmount: 5,
    maxRedemptionAmount: 500,
    brandwiseMaxCap: 500,
    isActive: false,
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

const mockCategories = [
  {
    id: 'cat1',
    name: 'Electronics',
    description: 'Electronic items',
    icon: 'device-mobile',
    color: '#3B82F6',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
  {
    id: 'cat2',
    name: 'Food',
    description: 'Food items',
    icon: 'cake',
    color: '#10B981',
    createdAt: new Date(),
    updatedAt: new Date(),
  },
]

describe('Brand Admin Portal - Integration Tests', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  describe('BrandTable Component', () => {
    it('should render brands with proper data', () => {
      render(<BrandTable brands={mockBrands} />)
      
      expect(screen.getByText('Test Brand 1')).toBeInTheDocument()
      expect(screen.getByText('Test Brand 2')).toBeInTheDocument()
      expect(screen.getByText('Active')).toBeInTheDocument()
      expect(screen.getByText('Inactive')).toBeInTheDocument()
    })

    it('should display category information correctly', () => {
      render(<BrandTable brands={mockBrands} />)
      
      expect(screen.getByText('Electronics')).toBeInTheDocument()
      expect(screen.getByText('Food')).toBeInTheDocument()
    })

    it('should display earning and redemption percentages', () => {
      render(<BrandTable brands={mockBrands} />)
      
      expect(screen.getByText('10%')).toBeInTheDocument()
      expect(screen.getByText('30%')).toBeInTheDocument()
      expect(screen.getByText('15%')).toBeInTheDocument()
      expect(screen.getByText('25%')).toBeInTheDocument()
    })

    it('should display redemption amount limits', () => {
      render(<BrandTable brands={mockBrands} />)
      
      expect(screen.getByText('₹1000')).toBeInTheDocument()
      expect(screen.getByText('₹500')).toBeInTheDocument()
    })

    it('should handle sorting correctly', async () => {
      const user = userEvent.setup()
      render(<BrandTable brands={mockBrands} />)
      
      const nameHeader = screen.getByText('Brand Name')
      await user.click(nameHeader)
      
      // Verify sort indicators
      expect(screen.getByText('↑')).toBeInTheDocument()
    })

    it('should call edit handler when edit button is clicked', async () => {
      const mockOnEdit = jest.fn()
      const user = userEvent.setup()
      
      render(<BrandTable brands={mockBrands} onEdit={mockOnEdit} />)
      
      const editButtons = screen.getAllByTitle('Edit Brand')
      await user.click(editButtons[0])
      
      expect(mockOnEdit).toHaveBeenCalledWith(mockBrands[0])
    })

    it('should call delete handler when delete button is clicked', async () => {
      const mockOnDelete = jest.fn()
      const user = userEvent.setup()
      
      render(<BrandTable brands={mockBrands} onDelete={mockOnDelete} />)
      
      const deleteButtons = screen.getAllByTitle('Delete Brand')
      await user.click(deleteButtons[0])
      
      expect(mockOnDelete).toHaveBeenCalledWith(mockBrands[0].id)
    })

    it('should call toggle status handler when toggle button is clicked', async () => {
      const mockOnToggleStatus = jest.fn()
      const user = userEvent.setup()
      
      render(<BrandTable brands={mockBrands} onToggleStatus={mockOnToggleStatus} />)
      
      const toggleButtons = screen.getAllByTitle(/Activate|Deactivate/)
      await user.click(toggleButtons[0])
      
      expect(mockOnToggleStatus).toHaveBeenCalledWith(mockBrands[0].id)
    })

    it('should display empty state when no brands', () => {
      render(<BrandTable brands={[]} />)
      
      expect(screen.getByText('No brands found')).toBeInTheDocument()
      expect(screen.getByText('Start by adding your first partner brand')).toBeInTheDocument()
    })
  })

  describe('BrandForm Component', () => {
    it('should populate form with brand data when editing', () => {
      render(
        <BrandForm
          brand={mockBrands[0]}
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />
      )
      
      expect(screen.getByDisplayValue('Test Brand 1')).toBeInTheDocument()
      expect(screen.getByDisplayValue('10')).toBeInTheDocument() // earning percentage
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // redemption percentage
    })

    it('should show create form when no brand is provided', () => {
      render(
        <BrandForm
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />
      )
      
      expect(screen.getByText('Create New Brand')).toBeInTheDocument()
      expect(screen.getByDisplayValue('30')).toBeInTheDocument() // default earning percentage
      expect(screen.getByDisplayValue('100')).toBeInTheDocument() // default redemption percentage
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      render(
        <BrandForm
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )
      
      const submitButton = screen.getByText('Create Brand')
      await user.click(submitButton)
      
      expect(screen.getByText('Brand name is required')).toBeInTheDocument()
      expect(screen.getByText('Description is required')).toBeInTheDocument()
      expect(screen.getByText('Category is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate percentage ranges', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      render(
        <BrandForm
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText('Brand Name *'), 'Test Brand')
      await user.type(screen.getByLabelText('Description *'), 'Test Description')
      await user.selectOptions(screen.getByLabelText('Category *'), 'cat1')
      
      // Test invalid percentage
      const earningInput = screen.getByLabelText('Earning Percentage *')
      await user.clear(earningInput)
      await user.type(earningInput, '150')
      
      const submitButton = screen.getByText('Create Brand')
      await user.click(submitButton)
      
      expect(screen.getByText('Earning percentage must be between 0 and 100')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should auto-sync maxRedemptionAmount with brandwiseMaxCap', async () => {
      const user = userEvent.setup()
      
      render(
        <BrandForm
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText('Brand Name *'), 'Test Brand')
      await user.type(screen.getByLabelText('Description *'), 'Test Description')
      await user.selectOptions(screen.getByLabelText('Category *'), 'cat1')
      
      const maxCapInput = screen.getByLabelText('Brandwise Max Cap *')
      await user.clear(maxCapInput)
      await user.type(maxCapInput, '1500')
      
      const maxRedemptionInput = screen.getByLabelText('Maximum Redemption Amount')
      expect(maxRedemptionInput).toHaveValue(1500)
    })

    it('should validate URL format for logo', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      render(
        <BrandForm
          categories={mockCategories}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Fill required fields
      await user.type(screen.getByLabelText('Brand Name *'), 'Test Brand')
      await user.type(screen.getByLabelText('Description *'), 'Test Description')
      await user.selectOptions(screen.getByLabelText('Category *'), 'cat1')
      
      // Test invalid URL
      const logoInput = screen.getByLabelText('Logo URL')
      await user.type(logoInput, 'invalid-url')
      
      const submitButton = screen.getByText('Create Brand')
      await user.click(submitButton)
      
      expect(screen.getByText('Please enter a valid URL')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('CategoryModal Component', () => {
    it('should show create form when mode is create', () => {
      render(
        <CategoryModal
          mode="create"
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />
      )
      
      expect(screen.getByText('Create New Category')).toBeInTheDocument()
      expect(screen.getByLabelText('Category Name *')).toBeInTheDocument()
    })

    it('should show edit form when mode is edit', () => {
      render(
        <CategoryModal
          mode="edit"
          category={mockCategories[0]}
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={jest.fn()}
        />
      )
      
      expect(screen.getByText('Edit Category')).toBeInTheDocument()
      expect(screen.getByDisplayValue('Electronics')).toBeInTheDocument()
    })

    it('should validate required fields', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      render(
        <CategoryModal
          mode="create"
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )
      
      const submitButton = screen.getByText('Create Category')
      await user.click(submitButton)
      
      expect(screen.getByText('Category name is required')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })

    it('should validate hex color format', async () => {
      const user = userEvent.setup()
      const mockOnSubmit = jest.fn()
      
      render(
        <CategoryModal
          mode="create"
          isOpen={true}
          onClose={jest.fn()}
          onSubmit={mockOnSubmit}
        />
      )
      
      // Fill required field
      await user.type(screen.getByLabelText('Category Name *'), 'Test Category')
      
      // Test invalid color
      const colorInput = screen.getByDisplayValue('#3B82F6')
      await user.clear(colorInput)
      await user.type(colorInput, 'invalid-color')
      
      const submitButton = screen.getByText('Create Category')
      await user.click(submitButton)
      
      expect(screen.getByText('Please enter a valid hex color (e.g., #FF0000)')).toBeInTheDocument()
      expect(mockOnSubmit).not.toHaveBeenCalled()
    })
  })

  describe('DeleteConfirmationModal Component', () => {
    it('should display category name and brand count', () => {
      render(
        <DeleteConfirmationModal
          categoryName="Test Category"
          brandCount={5}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      )
      
      expect(screen.getByText(/Test Category/)).toBeInTheDocument()
      expect(screen.getByText(/5 brands/)).toBeInTheDocument()
    })

    it('should show warning when category has brands', () => {
      render(
        <DeleteConfirmationModal
          categoryName="Test Category"
          brandCount={3}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      )
      
      expect(screen.getByText(/⚠️ This category has 3 associated brands/)).toBeInTheDocument()
      expect(screen.getByText('Delete Anyway')).toBeInTheDocument()
    })

    it('should show normal delete button when no brands', () => {
      render(
        <DeleteConfirmationModal
          categoryName="Test Category"
          brandCount={0}
          onConfirm={jest.fn()}
          onCancel={jest.fn()}
        />
      )
      
      expect(screen.getByText('This category has no associated brands')).toBeInTheDocument()
      expect(screen.getByText('Delete Category')).toBeInTheDocument()
    })

    it('should call onConfirm when delete button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnConfirm = jest.fn()
      
      render(
        <DeleteConfirmationModal
          categoryName="Test Category"
          brandCount={0}
          onConfirm={mockOnConfirm}
          onCancel={jest.fn()}
        />
      )
      
      const deleteButton = screen.getByText('Delete Category')
      await user.click(deleteButton)
      
      expect(mockOnConfirm).toHaveBeenCalled()
    })

    it('should call onCancel when cancel button is clicked', async () => {
      const user = userEvent.setup()
      const mockOnCancel = jest.fn()
      
      render(
        <DeleteConfirmationModal
          categoryName="Test Category"
          brandCount={0}
          onConfirm={jest.fn()}
          onCancel={mockOnCancel}
        />
      )
      
      const cancelButton = screen.getByText('Cancel')
      await user.click(cancelButton)
      
      expect(mockOnCancel).toHaveBeenCalled()
    })
  })
})
