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
  const [todaysPrompt, setTodaysPrompt] = useState<string>('')
  const [userProfile, setUserProfile] = useState<any>(null)
  
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
          
          // Get today's prompt text directly (no database dependency)
          setTodaysPrompt(databaseService.getTodaysPromptText())
          
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
      
      // Set user profile for display
      if (existingUser) {
        setUserProfile(existingUser)
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
      <div className="text-foreground">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-nunito">Daily Bright</h1>
            <p className="text-sm text-muted-foreground mt-1">Your daily gratitude journey</p>
          </div>
          <Button 
            onClick={signOut} 
            variant="outline" 
            size="sm" 
            className="soft-button border-border bg-card/50 text-foreground hover:bg-accent/10 hover:border-accent"
          >
            Sign Out
          </Button>
        </div>

        {/* User Info */}
        <div className="soft-card p-6 mb-8 hover-lift">
          <div className="flex items-center space-x-3 mb-3">
            <div className="w-3 h-3 bg-secondary rounded-full animate-pulse"></div>
            <p className="text-sm text-muted-foreground">Welcome back!</p>
          </div>
          <p className="font-medium text-foreground text-lg">
            {userProfile?.display_name || user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'}
          </p>
          <p className="text-xs text-muted-foreground mt-2">
            Local time: {currentTime.toLocaleString()}
          </p>
        </div>

        {/* Today's Prompt - Flattened design */}
        <div className="mb-12">
          <h2 className="text-2xl font-bold mb-6 text-foreground font-nunito">Today's Gratitude Prompt</h2>
          
          {todaysPrompt && (
            <div className="mb-8">
              <div className="bg-gradient-to-r from-warm-50 to-nature-50 border-l-4 border-primary p-6 rounded-r-2xl soft-shadow">
                <p className="text-foreground italic text-lg leading-relaxed font-nunito">
                  "{todaysPrompt}"
                </p>
              </div>
            </div>
          )}
          
          {/* Show notification info only when prompt is not displayed */}
          {!todaysPrompt && (
            <div className="bg-gradient-to-r from-sky-50 to-accent/10 border border-sky-200 rounded-2xl p-6 mb-8 soft-shadow">
              <div className="flex items-center space-x-3 mb-3">
                <span className="text-2xl">🌅</span>
                <span className="font-medium text-sky-700 text-lg">Random Gratitude Reminder</span>
              </div>
              <p className="text-sky-600 mb-2">
                We know you're excited to share your gratitude, but today's surprise notification hasn't arrived yet! 
              </p>
              <p className="text-sm text-sky-500">
                Keep your notifications on - it could come at any moment today! 🙏
              </p>
            </div>
          )}

          {/* Show existing entry or form */}
          {todayEntry ? (
            <div className="bg-gradient-to-r from-nature-50 to-green-100 border border-nature-200 rounded-2xl p-6 soft-shadow">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-nature-500 rounded-full flex items-center justify-center">
                  <span className="text-white text-lg">✓</span>
                </div>
                <h3 className="text-nature-700 font-semibold text-lg">Posted today!</h3>
              </div>
              <p className="text-foreground mb-4 leading-relaxed">{todayEntry.text}</p>
              {todayEntry.photo_url && (
                <img 
                  src={todayEntry.photo_url} 
                  alt="Gratitude post" 
                  className="w-full max-w-xs rounded-2xl mt-4 soft-shadow"
                />
              )}
            </div>
          ) : (
            <div className="space-y-6">
              {/* Photo Preview */}
              {photoPreview && (
                <div className="flex items-center space-x-4">
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="w-20 h-20 rounded-2xl object-cover soft-shadow"
                  />
                  <button 
                    onClick={() => {
                      setSelectedPhoto(null)
                      setPhotoPreview(null)
                    }}
                    className="text-destructive hover:text-destructive/80 text-sm font-medium"
                  >
                    Remove
                  </button>
                </div>
              )}

              {/* Post Form */}
              <div className="space-y-4">
                <textarea
                  placeholder="Share your gratitude (max 2000 characters)..."
                  value={gratitudeText}
                  onChange={(e) => setGratitudeText(e.target.value)}
                  className="w-full p-4 bg-card border border-border text-foreground placeholder:text-muted-foreground rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary transition-all duration-200"
                  rows={4}
                  maxLength={2000}
                />
                
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoChange}
                      className="hidden"
                      id="post-photo"
                    />
                    <label
                      htmlFor="post-photo"
                      className="cursor-pointer text-sm text-muted-foreground hover:text-accent transition-colors font-medium"
                    >
                      📷 Add Photo
                    </label>
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {gratitudeText.length}/2000
                    </span>
                  </div>
                  <Button 
                    onClick={handlePost}
                    disabled={!gratitudeText.trim() || isPosting}
                    className="soft-button bg-primary hover:bg-primary/90 text-primary-foreground px-6"
                  >
                    {isPosting ? 'Posting...' : 'Post'}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Recent Entries */}
        {recentEntries.length > 0 && !todayEntry && (
          <div className="mb-20">
            <h2 className="text-xl font-semibold mb-6 text-foreground font-nunito">Your Recent Gratitude</h2>
            <div className="space-y-4">
              {recentEntries.slice(0, 3).map((entry, index) => (
                <div key={index} className="soft-card p-5 hover-lift">
                  <div className="flex items-center space-x-2 mb-3">
                    <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                      {new Date(entry.created_at).toLocaleDateString()}
                    </span>
                  </div>
                  <p className="text-sm text-accent mb-3 italic font-medium">
                    "{entry.prompts?.text}"
                  </p>
                  <p className="text-foreground leading-relaxed">
                    {entry.text.length > 100 ? `${entry.text.substring(0, 100)}...` : entry.text}
                  </p>
                  {entry.photo_url && (
                    <img 
                      src={entry.photo_url} 
                      alt="Gratitude post" 
                      className="w-20 h-20 rounded-2xl mt-3 object-cover soft-shadow"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto flex justify-around py-4">
            <button className="flex flex-col items-center text-primary">
              <span className="text-xl mb-1">🌱</span>
              <span className="text-xs font-medium">Today</span>
            </button>
            <Link href="/dashboard/circle" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌿</span>
              <span className="text-xs font-medium">Circle</span>
            </Link>
            <Link href="/dashboard/profile" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌸</span>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </div>

        {/* Notification Permission Prompt */}
        <NotificationPrompt />
      </div>
    </div>
  )
}
