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
      <div className="soft-card p-6 w-full max-w-md soft-shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground font-nunito">Edit Profile</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-6">
          {/* Profile Photo */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-3">
              Profile Photo
            </label>
            <div className="flex items-center space-x-4">
              <div className="w-20 h-20 rounded-2xl overflow-hidden bg-gradient-to-br from-warm-400 to-warm-500 border-2 border-warm-300 flex items-center justify-center soft-shadow">
                {profilePhotoPreview ? (
                  <img 
                    src={profilePhotoPreview} 
                    alt="Profile" 
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-2xl text-white">🌸</span>
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
                  className="cursor-pointer inline-flex items-center px-3 py-2 bg-accent/10 border border-accent/20 rounded-xl text-sm text-accent hover:bg-accent/20 transition-colors font-medium"
                >
                  📷 Change Photo
                </label>
                {profilePhotoPreview && (
                  <button
                    type="button"
                    onClick={handleRemovePhoto}
                    className="block text-sm text-destructive hover:text-destructive/80 font-medium"
                  >
                    Remove Photo
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Display Name */}
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Display Name
            </label>
            <Input
              type="text"
              placeholder="Enter your display name"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 focus:ring-2"
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
            <div className={`text-center text-sm p-3 rounded-2xl ${
              message.includes('success')
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


