import { createClient } from '@/lib/supabase/client'

export interface UploadResult {
  url: string | null
  error: string | null
}

export class StorageService {
  private supabase = createClient()

  async uploadPhoto(file: File, bucket: 'profiles' | 'entries', userId: string): Promise<UploadResult> {
    try {
      // Validate file
      if (!file.type.startsWith('image/')) {
        return { url: null, error: 'Please select a valid image file' }
      }

      const maxSize = 5 * 1024 * 1024 // 5MB
      if (file.size > maxSize) {
        return { url: null, error: 'Image must be less than 5MB' }
      }

      // Generate unique filename with user folder structure
      const fileExt = file.name.split('.').pop()
      const fileName = `${Date.now()}.${fileExt}`
      const filePath = `${userId}/${fileName}`

      // Upload file
      const { data, error } = await this.supabase.storage
        .from(bucket)
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false
        })

      if (error) {
        console.error('Upload error:', error)
        if (error.message?.includes('Bucket not found')) {
          return { url: null, error: 'Storage not configured. Please contact support.' }
        }
        return { url: null, error: 'Failed to upload image' }
      }

      // Get public URL
      const { data: urlData } = this.supabase.storage
        .from(bucket)
        .getPublicUrl(data.path)

      return { url: urlData.publicUrl, error: null }
    } catch (error) {
      console.error('Upload error:', error)
      return { url: null, error: 'Failed to upload image' }
    }
  }

  async deletePhoto(url: string, bucket: 'profiles' | 'entries'): Promise<boolean> {
    try {
      // Extract file path from URL (userId/fileName)
      const urlParts = url.split('/')
      const fileName = urlParts[urlParts.length - 1]
      const userId = urlParts[urlParts.length - 2]
      const filePath = `${userId}/${fileName}`

      const { error } = await this.supabase.storage
        .from(bucket)
        .remove([filePath])

      if (error) {
        console.error('Delete error:', error)
        return false
      }

      return true
    } catch (error) {
      console.error('Delete error:', error)
      return false
    }
  }
}

export const storageService = new StorageService()


