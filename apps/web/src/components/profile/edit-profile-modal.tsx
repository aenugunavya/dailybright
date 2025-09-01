'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { databaseService } from '@/lib/database'
import { storageService } from '@/lib/storage'
import { useAuth } from '@/providers/auth-provider'

interface EditProfileModalProps {
  isOpen: boolean
  onClose: () => void
  onProfileUpdated: () => void
  currentProfile: any
}

export function EditProfileModal({ isOpen, onClose, onProfileUpdated, currentProfile }: EditProfileModalProps) {
  const { user } = useAuth()
  const [displayName, setDisplayName] = useState(currentProfile?.display_name || '')
  const [profilePhoto, setProfilePhoto] = useState<File | null>(null)
  const [profilePhotoPreview, setProfilePhotoPreview] = useState<string | null>(
    currentProfile?.profile_photo_url || null
  )
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setProfilePhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setProfilePhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handleRemovePhoto = () => {
    setProfilePhoto(null)
    setProfilePhotoPreview(null)
  }

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user) return

    setIsLoading(true)
    setMessage('')

    try {
      let photoUrl = currentProfile?.profile_photo_url

      // Handle photo upload/removal
      if (profilePhoto) {
        // Delete old photo if exists
        if (photoUrl) {
          await storageService.deletePhoto(photoUrl, 'profiles')
        }
        
        // Upload new photo
        const uploadResult = await storageService.uploadPhoto(profilePhoto, 'profiles', user.id)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        photoUrl = uploadResult.url
      } else if (!profilePhotoPreview && photoUrl) {
        // Remove photo
        await storageService.deletePhoto(photoUrl, 'profiles')
        photoUrl = null
      }

      // Update profile
      const { error } = await databaseService.updateUserProfile(user.id, {
        display_name: displayName.trim() || null,
        profile_photo_url: photoUrl,
      })

      if (error) {
        throw new Error(error)
      }

      setMessage('Profile updated successfully!')
      onProfileUpdated()
      setTimeout(() => {
        onClose()
        setMessage('')
      }, 1500)
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Failed to update profile')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-3">
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-full overflow-hidden bg-slate-700 border-2 border-slate-600 flex items-center justify-center">
                {profilePhotoPreview ? (
                  <img 
                    src={profilePhotoPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl">👤</span>
                )}
              </div>
              <div className="flex-1 space-y-2">
                <input
                  type="file"
                  accept="image/*"
                  onChange={handlePhotoChange}
                  className="hidden"
                  id="profile-photo-edit"
                />
                <label
                  htmlFor="profile-photo-edit"
                  className="cursor-pointer inline-flex items-center px-3 py-2 bg-slate-700/70 border border-slate-600 rounded-lg text-sm text-slate-300 hover:bg-slate-600/70 transition-colors"
                >
                  📷 Change Photo
                </label>
                {profilePhotoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="block text-sm text-red-400 hover:text-red-300"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 bg-slate-700/70 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary focus:ring-2"
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? 'Saving...' : 'Save Changes'}
          </Button>

          {message && (
            <div className={`text-center text-sm p-3 rounded-lg ${
              message.includes('success')
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message}
            </div>
          )}
        </form>
      </div>
    </div>
  )
}


