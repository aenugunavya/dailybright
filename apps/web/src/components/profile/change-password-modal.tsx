'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useAuth } from '@/providers/auth-provider'

interface ChangePasswordModalProps {
  isOpen: boolean
  onClose: () => void
}

export function ChangePasswordModal({ isOpen, onClose }: ChangePasswordModalProps) {
  const { supabase } = useAuth()
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')
  const [showPasswords, setShowPasswords] = useState(false)

  const validateForm = () => {
    if (!newPassword || !confirmPassword) {
      setMessage('Please fill in all fields')
      return false
    }

    if (newPassword.length < 6) {
      setMessage('New password must be at least 6 characters long')
      return false
    }

    if (newPassword !== confirmPassword) {
      setMessage('New passwords do not match')
      return false
    }

    if (newPassword === currentPassword) {
      setMessage('New password must be different from current password')
      return false
    }

    return true
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!supabase) return

    if (!validateForm()) return

    setIsLoading(true)
    setMessage('')

    try {
      // Update password using Supabase Auth
      const { error } = await supabase.auth.updateUser({
        password: newPassword
      })

      if (error) {
        throw new Error(error.message)
      }

      setMessage('Password updated successfully!')
      
      // Clear form and close modal after success
      setTimeout(() => {
        setCurrentPassword('')
        setNewPassword('')
        setConfirmPassword('')
        setMessage('')
        onClose()
      }, 2000)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update password')
    } finally {
      setIsLoading(false)
    }
  }

  const handleClose = () => {
    setCurrentPassword('')
    setNewPassword('')
    setConfirmPassword('')
    setMessage('')
    onClose()
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="soft-card p-6 w-full max-w-md soft-shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground font-nunito">Change Password</h2>
          <button
            onClick={handleClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Current Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Current Password
            </label>
            <div className="relative">
              <Input
                type={showPasswords ? "text" : "password"}
                placeholder="Enter your current password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 focus:ring-2 pr-12"
                required
              />
              <button
                type="button"
                onClick={() => setShowPasswords(!showPasswords)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
              >
                {showPasswords ? '🙈' : '👁️'}
              </button>
            </div>
          </div>

          {/* New Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              New Password
            </label>
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Enter your new password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 focus:ring-2"
              required
              minLength={6}
            />
            <p className="text-xs text-muted-foreground mt-1">
              Must be at least 6 characters long
            </p>
          </div>

          {/* Confirm New Password */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Confirm New Password
            </label>
            <Input
              type={showPasswords ? "text" : "password"}
              placeholder="Confirm your new password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 focus:ring-2"
              required
              minLength={6}
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !newPassword || !confirmPassword || !currentPassword}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? 'Updating Password...' : 'Update Password'}
          </Button>

          {message && (
            <div className={`text-center text-sm p-3 rounded-2xl ${
              message.includes('successfully')
                ? 'bg-nature-50 text-nature-600 border border-nature-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}
