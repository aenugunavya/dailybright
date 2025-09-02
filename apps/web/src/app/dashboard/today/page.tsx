'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { createDatabaseService } from '@/lib/database'
import { storageService } from '@/lib/storage'
import { notificationService } from '@/lib/notification'
import { NotificationPrompt } from '@/components/ui/notification-prompt'
import Link from 'next/link'

export default function TodayPage() {
  const { user, signOut, supabase, refreshSession } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())
  const [gratitudeText, setGratitudeText] = useState('')
  const [selectedPhoto, setSelectedPhoto] = useState<File | null>(null)
  const [photoPreview, setPhotoPreview] = useState<string | null>(null)
  const [isPosting, setIsPosting] = useState(false)
  const [todayState, setTodayState] = useState<any>(null)
  const [todayEntry, setTodayEntry] = useState<any>(null)
  const [recentEntries, setRecentEntries] = useState<any[]>([])
  const [todaysPrompt, setTodaysPrompt] = useState<any>(null)
  const [userProfile, setUserProfile] = useState<any>(null)
  const [loadingPrompt, setLoadingPrompt] = useState(true)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  useEffect(() => {
    if (user) {
      console.log('👤 User loaded, starting initialization...')
      // Ensure user profile exists before proceeding
      ensureUserProfile()
        .then(() => {
          console.log('✅ User profile ensured, continuing...')
          // Initialize notification system
          notificationService.initializeForUser()
          
          // Load today's prompt from the new daily prompt system
          loadTodaysPrompt()
          
          // Load today's state and entry
          console.log('🔄 Calling loadTodayData...')
          loadTodayData()
          loadRecentEntries()
        })
        .catch(error => {
          console.error('❌ Failed to ensure user profile:', error)
          // Even if profile creation fails, try to load data
          console.log('🔄 Trying to load data anyway...')
          loadTodaysPrompt()
          loadTodayData()
          loadRecentEntries()
        })
    }
  }, [user])

  // Debug: Log whenever todayState changes
  useEffect(() => {
    console.log('🔄 todayState changed to:', todayState)
  }, [todayState])

  const loadTodaysPrompt = async () => {
    if (!user) return

    try {
      setLoadingPrompt(true)
      console.log('📅 Loading today\'s prompt...')
      
      const response = await fetch('/api/daily-prompt', {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📅 Daily prompt response:', data)

      if (data.success && data.has_prompt) {
        setTodaysPrompt(data)
        
        // Check if user has already responded
        if (data.user_response?.has_responded) {
          setTodayEntry(data.user_response)
        }
      } else {
        // No prompt available yet - show a fallback
        setTodaysPrompt({
          has_prompt: false,
          message: data.message || 'No prompt available for today yet. Check back later!'
        })
      }
    } catch (error) {
      console.error('❌ Error loading today\'s prompt:', error)
      // Fallback to a default prompt
      setTodaysPrompt({
        has_prompt: true,
        prompt: {
          text: "⚡ What superpower did you accidentally unlock today without realizing it?",
          id: null
        },
        is_fallback: true
      })
    } finally {
      setLoadingPrompt(false)
    }
  }

  const ensureUserProfile = async () => {
    if (!user) return

    try {
      const databaseService = createDatabaseService(supabase)
      
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
      console.log('🔐 Testing Supabase client authentication...')
      const { data: { user: supabaseUser } } = await supabase.auth.getUser()
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Supabase client user:', supabaseUser?.id)
      console.log('🔐 Frontend user:', user.id)
      console.log('🔐 Users match?', supabaseUser?.id === user.id)
      console.log('🔐 Session exists?', !!session)
      console.log('🔐 Session access token length:', session?.access_token?.length || 0)
      
      const databaseService = createDatabaseService(supabase)
      
      // Get today's state
      let { data: state, error: stateError } = await databaseService.getTodayState(user.id)
      
      if (!state && !stateError) {
        // Create today's state if it doesn't exist
        console.log('🔄 Creating today state...')
        const { data: newState, error: createError } = await databaseService.createTodayState(user.id)
        console.log('🔄 Create state result:', { newState, createError })
        state = newState
      }
      
      // Fallback: If we still don't have a state, create a basic one
      if (!state) {
        console.log('⚠️ Creating fallback state...')
        const fallbackState = {
          user_id: user.id,
          date: new Date().toISOString().split('T')[0],
          prompt_id: 91, // Use a valid prompt ID from our seed data
          window_start_ts: new Date().toISOString(),
          window_end_ts: new Date().toISOString(),
          notified_at_ts: null,
          created_at: new Date().toISOString()
        }
        console.log('⚠️ Fallback state created:', fallbackState)
        state = fallbackState
      }
      
      console.log('🔄 Final state to be set:', state)
      setTodayState(state)
      console.log('🔄 setTodayState called with:', state)

      // Get today's entry using the working RPC function
      try {
        const { data: entriesData } = await supabase.rpc('get_todays_entries_simple', {
          p_user_id: user.id
        })
        
        if (entriesData?.success && entriesData.entries && entriesData.entries.length > 0) {
          // Get the most recent entry by created_at timestamp
          const sortedEntries = entriesData.entries.sort((a: any, b: any) => {
            const dateA = new Date(a.created_at || 0)
            const dateB = new Date(b.created_at || 0)
            return dateB.getTime() - dateA.getTime()
          })
          
          const mostRecentEntry = sortedEntries[0]
          console.log('🔄 Loaded today entry via RPC (most recent):', mostRecentEntry)
          setTodayEntry(mostRecentEntry)
        } else {
          console.log('🔄 No entries found for today')
          setTodayEntry(null)
        }
      } catch (err) {
        console.error('Error loading today entry via RPC:', err)
        setTodayEntry(null)
      }
    } catch (error) {
      console.error('Error loading today data:', error)
      
      // Create fallback state even if there's an error
      const fallbackState = {
        user_id: user.id,
        date: new Date().toISOString().split('T')[0],
        prompt_id: 91, // Use a valid prompt ID from our seed data
        window_start_ts: new Date().toISOString(),
        window_end_ts: new Date().toISOString(),
        notified_at_ts: null,
        created_at: new Date().toISOString()
      }
      console.log('⚠️ Setting fallback state due to error:', fallbackState)
      setTodayState(fallbackState)
    }
  }

  const loadRecentEntries = async () => {
    if (!user) return

    try {
      const databaseService = createDatabaseService(supabase)
      
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
    if (!user || !gratitudeText.trim() || !todaysPrompt?.has_prompt) return

    console.log('🚀 Starting post process...')
    console.log('🚀 User:', user.id)
    console.log('🚀 Text:', gratitudeText.trim())
    console.log('🚀 Today\'s prompt:', todaysPrompt)

    setIsPosting(true)
    try {
      // Upload photo if selected
      let photoUrl = null
      if (selectedPhoto) {
        console.log('📷 Uploading photo...')
        const uploadResult = await storageService.uploadPhoto(selectedPhoto, 'entries', user.id)
        if (uploadResult.error) {
          throw new Error(uploadResult.error)
        }
        photoUrl = uploadResult.url
        console.log('📷 Photo uploaded:', photoUrl)
      }

      // Use the new daily prompt API to create entry
      const response = await fetch('/api/daily-prompt', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: gratitudeText.trim(),
          photo_url: photoUrl
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log('📝 Entry creation result:', data)

      if (!data.success) {
        throw new Error(data.error || 'Failed to create entry')
      }

      console.log('✅ Entry created successfully!')

      // Update the today entry and reload prompt to get updated response status
      setTodayEntry(data.entry)
      await loadTodaysPrompt()
      
      // Clear form
      setGratitudeText('')
      setSelectedPhoto(null)
      setPhotoPreview(null)
    } catch (error) {
      console.error('❌ Error posting:', error)
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
          
          <div className="mb-8">
            {loadingPrompt ? (
              <div className="bg-gradient-to-r from-warm-50 to-nature-50 border-l-4 border-muted p-6 rounded-r-2xl soft-shadow">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-4 bg-muted rounded w-1/2"></div>
                </div>
              </div>
            ) : todaysPrompt?.has_prompt ? (
              <div className="bg-gradient-to-r from-warm-50 to-nature-50 border-l-4 border-primary p-6 rounded-r-2xl soft-shadow">
                <p className="text-foreground italic text-lg leading-relaxed font-nunito">
                  "{todaysPrompt.prompt.text}"
                </p>
                {todaysPrompt.is_fallback && (
                  <p className="text-xs text-muted-foreground mt-2">
                    ⚠️ Fallback prompt - daily generation will be available soon!
                  </p>
                )}
                {todaysPrompt.daily_prompt_info?.scheduled_time && (
                  <p className="text-xs text-muted-foreground mt-2">
                    🕐 Generated today at {todaysPrompt.daily_prompt_info.scheduled_time}
                  </p>
                )}
              </div>
            ) : (
              <div className="bg-gradient-to-r from-muted/20 to-muted/30 border-l-4 border-muted p-6 rounded-r-2xl soft-shadow">
                <p className="text-muted-foreground italic text-lg leading-relaxed font-nunito">
                  {todaysPrompt?.message || "No prompt available for today yet. Check back later! 🌅"}
                </p>
                <p className="text-xs text-muted-foreground mt-2">
                  💡 New prompts are generated automatically throughout the day
                </p>
              </div>
            )}
          </div>

          {/* Show existing entry or form */}
          {todayEntry ? (
            <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                  <span className="text-white text-sm font-medium">✓</span>
                </div>
                <h3 className="text-foreground font-semibold text-lg">Today's response:</h3>
              </div>
              <p className="text-foreground mb-4 leading-relaxed text-base">{todayEntry.text}</p>
              {todayEntry.photo_url && (
                <img 
                  src={todayEntry.photo_url} 
                  alt="Gratitude post" 
                  className="w-full max-w-xs rounded-lg mt-4 border border-gray-200"
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
