'use client'

import { useState } from 'react'
import { 
  Cog6ToothIcon,
  ShieldCheckIcon,
  BellIcon,
  GlobeAltIcon,
  CurrencyDollarIcon,
  UserGroupIcon,
  CloudIcon
} from '@heroicons/react/24/outline'
import { useToast, ToastContainer } from '@/components/common'

interface SystemSettings {
  siteName: string
  siteDescription: string
  maintenanceMode: boolean
  allowNewRegistrations: boolean
  requireEmailVerification: boolean
  maxFileUploadSize: number
  defaultEarningPercentage: number
  defaultRedemptionPercentage: number
  welcomeBonusAmount: number
  maxCoinsPerTransaction: number
  autoApproveTransactions: boolean
  notificationEmail: string
  supportEmail: string
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<SystemSettings>({
    siteName: 'Club Corra',
    siteDescription: 'Loyalty and rewards system for brands and users',
    maintenanceMode: false,
    allowNewRegistrations: true,
    requireEmailVerification: true,
    maxFileUploadSize: 10,
    defaultEarningPercentage: 5,
    defaultRedemptionPercentage: 3,
    welcomeBonusAmount: 100,
    maxCoinsPerTransaction: 1000,
    autoApproveTransactions: false,
    notificationEmail: 'admin@clubcorra.com',
    supportEmail: 'support@clubcorra.com'
  })

  const [isLoading, setIsLoading] = useState(false)
  const { toasts, removeToast, showSuccess, showError } = useToast()

  const handleSettingChange = (key: keyof SystemSettings, value: any) => {
    setSettings(prev => ({ ...prev, [key]: value }))
  }

  const handleSaveSettings = async () => {
    setIsLoading(true)
    try {
      // TODO: Replace with actual API call
      await new Promise(resolve => setTimeout(resolve, 1000)) // Simulate API call
      
      showSuccess('Settings Saved', 'System settings have been updated successfully')
    } catch (error) {
      console.error('Failed to save settings:', error)
      showError('Save Failed', 'Failed to save settings. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  const handleResetToDefaults = () => {
    if (confirm('Are you sure you want to reset all settings to default values?')) {
      setSettings({
        siteName: 'Club Corra',
        siteDescription: 'Loyalty and rewards system for brands and users',
        maintenanceMode: false,
        allowNewRegistrations: true,
        requireEmailVerification: true,
        maxFileUploadSize: 10,
        defaultEarningPercentage: 5,
        defaultRedemptionPercentage: 3,
        welcomeBonusAmount: 100,
        maxCoinsPerTransaction: 1000,
        autoApproveTransactions: false,
        notificationEmail: 'admin@clubcorra.com',
        supportEmail: 'support@clubcorra.com'
      })
      showSuccess('Settings Reset', 'All settings have been reset to default values')
    }
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900">System Settings</h1>
        <p className="mt-2 text-gray-600">
          Configure system-wide settings, security options, and default values.
        </p>
      </div>

      <div className="space-y-8">
        {/* General Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <GlobeAltIcon className="h-6 w-6 text-blue-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">General Settings</h3>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="siteName" className="block text-sm font-medium text-gray-700 mb-2">
                  Site Name
                </label>
                <input
                  type="text"
                  id="siteName"
                  value={settings.siteName}
                  onChange={(e) => handleSettingChange('siteName', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
              
              <div>
                <label htmlFor="siteDescription" className="block text-sm font-medium text-gray-700 mb-2">
                  Site Description
                </label>
                <input
                  type="text"
                  id="siteDescription"
                  value={settings.siteDescription}
                  onChange={(e) => handleSettingChange('siteDescription', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="maintenanceMode"
                  checked={settings.maintenanceMode}
                  onChange={(e) => handleSettingChange('maintenanceMode', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="maintenanceMode" className="ml-2 block text-sm text-gray-900">
                  Maintenance Mode
                </label>
                <span className="ml-2 text-xs text-gray-500">(Site will be unavailable to users)</span>
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="allowNewRegistrations"
                  checked={settings.allowNewRegistrations}
                  onChange={(e) => handleSettingChange('allowNewRegistrations', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="allowNewRegistrations" className="ml-2 block text-sm text-gray-900">
                  Allow New User Registrations
                </label>
              </div>
            </div>
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <ShieldCheckIcon className="h-6 w-6 text-green-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Security Settings</h3>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="requireEmailVerification"
                  checked={settings.requireEmailVerification}
                  onChange={(e) => handleSettingChange('requireEmailVerification', e.target.checked)}
                  className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
                />
                <label htmlFor="requireEmailVerification" className="ml-2 block text-sm text-gray-900">
                  Require Email Verification
                </label>
              </div>

              <div>
                <label htmlFor="maxFileUploadSize" className="block text-sm font-medium text-gray-700 mb-2">
                  Max File Upload Size (MB)
                </label>
                <input
                  type="number"
                  id="maxFileUploadSize"
                  value={settings.maxFileUploadSize}
                  onChange={(e) => handleSettingChange('maxFileUploadSize', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                  max="100"
                />
              </div>
            </div>
          </div>
        </div>

        {/* Coin System Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CurrencyDollarIcon className="h-6 w-6 text-yellow-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Coin System Settings</h3>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="defaultEarningPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Earning Percentage (%)
                </label>
                <input
                  type="number"
                  id="defaultEarningPercentage"
                  value={settings.defaultEarningPercentage}
                  onChange={(e) => handleSettingChange('defaultEarningPercentage', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>

              <div>
                <label htmlFor="defaultRedemptionPercentage" className="block text-sm font-medium text-gray-700 mb-2">
                  Default Redemption Percentage (%)
                </label>
                <input
                  type="number"
                  id="defaultRedemptionPercentage"
                  value={settings.defaultRedemptionPercentage}
                  onChange={(e) => handleSettingChange('defaultRedemptionPercentage', parseFloat(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                  max="100"
                  step="0.01"
                />
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="welcomeBonusAmount" className="block text-sm font-medium text-gray-700 mb-2">
                  Welcome Bonus Amount (coins)
                </label>
                <input
                  type="number"
                  id="welcomeBonusAmount"
                  value={settings.welcomeBonusAmount}
                  onChange={(e) => handleSettingChange('welcomeBonusAmount', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="0"
                />
              </div>

              <div>
                <label htmlFor="maxCoinsPerTransaction" className="block text-sm font-medium text-gray-700 mb-2">
                  Max Coins Per Transaction
                </label>
                <input
                  type="number"
                  id="maxCoinsPerTransaction"
                  value={settings.maxCoinsPerTransaction}
                  onChange={(e) => handleSettingChange('maxCoinsPerTransaction', parseInt(e.target.value))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  min="1"
                />
              </div>
            </div>

            <div className="flex items-center">
              <input
                type="checkbox"
                id="autoApproveTransactions"
                checked={settings.autoApproveTransactions}
                onChange={(e) => handleSettingChange('autoApproveTransactions', e.target.checked)}
                className="h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded"
              />
              <label htmlFor="autoApproveTransactions" className="ml-2 block text-sm text-gray-900">
                Auto-approve Transactions
              </label>
              <span className="ml-2 text-xs text-gray-500">(Transactions will be automatically approved)</span>
            </div>
          </div>
        </div>

        {/* Notification Settings */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <BellIcon className="h-6 w-6 text-purple-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">Notification Settings</h3>
            </div>
          </div>
          <div className="px-6 py-6 space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="notificationEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Admin Notification Email
                </label>
                <input
                  type="email"
                  id="notificationEmail"
                  value={settings.notificationEmail}
                  onChange={(e) => handleSettingChange('notificationEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>

              <div>
                <label htmlFor="supportEmail" className="block text-sm font-medium text-gray-700 mb-2">
                  Support Email
                </label>
                <input
                  type="email"
                  id="supportEmail"
                  value={settings.supportEmail}
                  onChange={(e) => handleSettingChange('supportEmail', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-indigo-500"
                />
              </div>
            </div>
          </div>
        </div>

        {/* System Information */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-6 py-4 border-b border-gray-200">
            <div className="flex items-center">
              <CloudIcon className="h-6 w-6 text-gray-600 mr-3" />
              <h3 className="text-lg font-medium text-gray-900">System Information</h3>
            </div>
          </div>
          <div className="px-6 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Environment</h4>
                <p className="text-sm text-gray-900">Production</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Version</h4>
                <p className="text-sm text-gray-900">1.0.0</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Database</h4>
                <p className="text-sm text-gray-900">PostgreSQL 14</p>
              </div>
              
              <div className="bg-gray-50 p-4 rounded-lg">
                <h4 className="text-sm font-medium text-gray-700 mb-2">Last Updated</h4>
                <p className="text-sm text-gray-900">{new Date().toLocaleDateString()}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex justify-between items-center">
          <button
            onClick={handleResetToDefaults}
            className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 font-medium hover:bg-gray-50"
          >
            Reset to Defaults
          </button>

          <div className="flex space-x-3">
            <button
              onClick={handleSaveSettings}
              disabled={isLoading}
              className="px-6 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white font-medium rounded-md transition-colors flex items-center"
            >
              {isLoading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Saving...
                </>
              ) : (
                <>
                  <Cog6ToothIcon className="w-4 h-4 mr-2" />
                  Save Settings
                </>
              )}
            </button>
          </div>
        </div>
      </div>
      
      <ToastContainer toasts={toasts} onRemove={removeToast} />
    </div>
  )
}
