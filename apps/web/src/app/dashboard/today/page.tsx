'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { databaseService } from '@/lib/database'
import { storageService } from '@/lib/storage'
import { notificationService } from '@/lib/notification'
import { NotificationPrompt } from '@/components/ui/notification-prompt'
import Link from 'next/link'

export default function TodayPage() {
  const { user, signOut } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gratitudeText, setGratitudeText] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [todayState, setTodayState] = useState<any>(null)
  const [todayEntry, setTodayEntry] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      // Ensure user profile exists before proceeding
      ensureUserProfile()
        .then(() => {
          // Initialize notification system
          notificationService.initializeForUser()
          
          // Load today's state and entry
          loadTodayData()
          loadRecentEntries()
        })
        .catch(error => {
          console.error('Failed to ensure user profile:', error)
        })
    }
  }, [user])

  const ensureUserProfile = async () => {
    if (!user) return

    try {
      // Check if user profile exists
      const { data: existingUser, error } = await databaseService.getUserProfile(user.id)
      
      if (error && error.includes('not found')) {
        // Create user profile if it doesn't exist
        await databaseService.createUserProfile({
          id: user.id,
          email: user.email || '',
          display_name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
        })
      }
    } catch (error) {
      console.error('Error ensuring user profile:', error)
      throw error
    }
  }

  const loadTodayData = async () => {
    if (!user) return

    try {
      // Get today's state
      let { data: state, error: stateError } = await databaseService.getTodayState(user.id)
      
      if (!state && !stateError) {
        // Create today's state if it doesn't exist
        const { data: newState } = await databaseService.createTodayState(user.id)
        state = newState
      }
      
      setTodayState(state)

      // Get today's entry
      const { data: entry } = await databaseService.getTodayEntry(user.id)
      setTodayEntry(entry)
    } catch (error) {
      console.error('Error loading today data:', error)
    }
  }

  const loadRecentEntries = async () => {
    if (!user) return

    try {
      // Get user's own recent entries (excluding today)
      const today = new Date().toISOString().split('T')[0]
      const { data, error } = await databaseService.getUserRecentEntries(user.id, today)
      if (!error && data) {
        setRecentEntries(data)
      }
    } catch (error) {
      console.error('Error loading recent entries:', error)
    }
  }

  const handlePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) {
      setSelectedPhoto(file)
      const reader = new FileReader()
      reader.onload = (e) => {
        setPhotoPreview(e.target?.result as string)
      }
      reader.readAsDataURL(file)
    }
  }

  const handlePost = async () => {
    if (!user || !gratitudeText.trim() || !todayState) return

    setIsPosting(true)
    try {
      // Upload photo if selected
      let photoUrl = null
      if (selectedPhoto) {
        const uploadResult = await storageService.uploadPhoto(selectedPhoto, 'entries', user.id)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        photoUrl = uploadResult.url
      }

      // Create entry
      const today = new Date().toISOString().split('T')[0]
      const { error } = await databaseService.createEntry({
        user_id: user.id,
        date: today,
        prompt_id: todayState.prompt_id,
        text: gratitudeText.trim(),
        photo_url: photoUrl,
        on_time: true // Since we removed time windows, always true
      })

      if (error) {
        throw new Error(error)
      }

      // Reload data
      await loadTodayData()
      
      // Clear form
      setGratitudeText('')
      setSelectedPhoto(null)
      setPhotoPreview(null)
    } catch (error) {
      console.error('Error posting:', error)
      alert('Failed to post. Please try again.')
    } finally {
      setIsPosting(false)
    }
  }

  if (!user) {
    return <div className="min-h-screen gradient-bg flex items-center justify-center">
      <div className="text-white">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">GratiTime</h1>
          <Button onClick={signOut} variant="outline" size="sm" className="border-border bg-card/50 text-white hover:bg-accent">
            Sign Out
          </Button>
        </div>

        {/* User Info */}
        <div className="gradient-card rounded-lg p-4 mb-6">
          <p className="text-sm text-slate-300">Welcome back!</p>
          <p className="font-medium text-white">{user.email}</p>
          <p className="text-xs text-slate-400 mt-1">
            Local time: {currentTime.toLocaleString()}
          </p>
        </div>

        {/* Today's Prompt */}
        <div className="gradient-card rounded-lg p-6 mb-20">
          <h2 className="text-lg font-semibold mb-4 text-white">Today's Gratitude Prompt</h2>
          
          {todayState?.prompts && (
            <div className="bg-slate-700/70 rounded-lg p-4 mb-4 border border-slate-600">
              <p className="text-slate-300 italic">
                "{todayState.prompts.text}"
              </p>
            </div>
          )}
          
          {/* Notification Info */}
          <div className="bg-purple-500/20 border border-purple-500/30 rounded-lg p-3 mb-4">
            <div className="flex items-center space-x-2 mb-2">
              <span className="text-lg">🎲</span>
              <span className="font-medium text-purple-200">Random Gratitude Reminder</span>
            </div>
            <p className="text-sm text-purple-200">
              We know you're excited to share your gratitude, but today's surprise notification hasn't arrived yet! 
            </p>
            <p className="text-xs text-purple-300 mt-1">
              Keep your notifications on - it could come at any moment today! 🙏
            </p>
          </div>

          {/* Show existing entry or form */}
          {todayEntry ? (
            <div className="bg-green-500/10 border border-green-500/30 rounded-lg p-4">
              <h3 className="text-green-400 font-medium mb-2">✅ Posted today!</h3>
              <p className="text-slate-300 mb-2">{todayEntry.text}</p>
              {todayEntry.photo_url && (
                <img 
                  src={todayEntry.photo_url} 
                  alt="Gratitude post" 
                  className="w-full max-w-xs rounded-lg mt-2"
                />
              )}
            </div>
          ) : (
            <div className="space-y-4">
              {/* Photo Preview */}
              {photoPreview && (
                <div className="flex items-center space-x-3">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-16 h-16 rounded-lg object-cover border border-slate-600"
                  />
                  <button 
                    onClick={() => {
                      setSelectedPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="text-red-400 hover:text-red-300 text-sm"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Post Form */}
              <textarea
                placeholder="Share your gratitude (max 2000 characters)..."
                value={gratitudeText}
                onChange={(e) => setGratitudeText(e.target.value)}
                className="w-full p-3 bg-slate-700/70 border border-slate-600 text-white placeholder:text-slate-400 rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
                rows={4}
                maxLength={2000}
              />
              
              <div className="flex justify-between items-center">
                <div className="flex items-center space-x-3">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handlePhotoChange}
                    className="hidden"
                    id="post-photo"
                  />
                  <label
                    htmlFor="post-photo"
                    className="cursor-pointer text-sm text-slate-400 hover:text-slate-300 transition-colors"
                  >
                    📷 Add Photo
                  </label>
                  <span className="text-xs text-slate-500">
                    {gratitudeText.length}/2000
                  </span>
                </div>
                <Button 
                  onClick={handlePost}
                  disabled={!gratitudeText.trim() || isPosting}
                  className="bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  {isPosting ? 'Posting...' : 'Post'}
                </Button>
              </div>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {recentEntries.length > 0 && !todayEntry && (
          <div className="gradient-card rounded-lg p-6 mb-20">
            <h2 className="text-lg font-semibold mb-4 text-white">Your Recent Gratitude</h2>
            <div className="space-y-4">
              {recentEntries.slice(0, 3).map((entry, index) => (
                <div key={index} className="bg-slate-700/50 rounded-lg p-4 border border-slate-600">
                  <div className="flex items-center space-x-2 mb-2">
                    <span className="text-xs text-slate-400">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-xs text-purple-200 mb-2 italic">
                    "{entry.prompts?.text}"
                  </p>
                  <p className="text-sm text-slate-300">
                    {entry.text.length > 100 ? `${entry.text.substring(0, 100)}...` : entry.text}
                  </p>
                  {entry.photo_url && (
                    <img 
                      src={entry.photo_url} 
                      alt="Gratitude post" 
                      className="w-16 h-16 rounded-lg mt-2 object-cover"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <button className="flex flex-col items-center text-primary">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </button>
            <Link href="/dashboard/circle" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </Link>
            <Link href="/dashboard/profile" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>

        {/* Notification Permission Prompt */}
        <NotificationPrompt />
      </div>
    </div>
  )
}
