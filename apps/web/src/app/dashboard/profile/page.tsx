'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'
import { databaseService } from '@/lib/database'
import { EditProfileModal } from '@/components/profile/edit-profile-modal'
import Link from 'next/link'

export default function ProfilePage() {
  const { user, signOut } = useAuth()
  const [userProfile, setUserProfile] = useState<any>(null)
  const [streaks, setStreaks] = useState({ current_count: 0, longest_count: 0 })
  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadUserData()
    }
  }, [user])

  const loadUserData = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      // Load user profile
      const { data: profile } = await databaseService.getUserProfile(user.id)
      setUserProfile(profile)

      // Load streaks - for now just set to 0 since we don't have streak calculation yet
      setStreaks({ current_count: 0, longest_count: 0 })
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setIsLoading(false)
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-nunito">Profile</h1>
            <p className="text-sm text-muted-foreground mt-1">Your gratitude journey</p>
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

        {isLoading ? (
          <div className="soft-card p-8 text-center">
            <div className="text-muted-foreground">Loading profile...</div>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <div className="soft-card p-8 mb-6 hover-lift">
              <div className="text-center mb-6">
                <div className="w-28 h-28 rounded-3xl overflow-hidden bg-gradient-to-br from-warm-400 to-warm-500 mx-auto mb-4 flex items-center justify-center soft-shadow-lg">
                  {userProfile?.profile_photo_url ? (
                    <img 
                      src={userProfile.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-4xl text-white">🌸</span>
                  )}
                </div>
                <h2 className="text-xl font-semibold text-foreground mb-2 font-nunito">
                  {userProfile?.display_name || 'Anonymous User'}
                </h2>
                <p className="text-muted-foreground mb-4">{user.email}</p>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="soft-button px-6 py-3 bg-accent/10 border border-accent/20 text-accent hover:bg-accent/20 transition-colors font-medium"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Streak Stats */}
            <div className="soft-card p-6 mb-6 hover-lift">
              <h3 className="text-lg font-semibold mb-6 text-foreground font-nunito">Your Gratitude Streaks</h3>
              <div className="grid grid-cols-2 gap-6">
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-warm-400 to-warm-500 rounded-2xl flex items-center justify-center soft-shadow">
                    <span className="text-2xl font-bold text-black">{streaks.current_count}</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="w-16 h-16 mx-auto mb-3 bg-gradient-to-br from-nature-400 to-nature-500 rounded-2xl flex items-center justify-center soft-shadow">
                    <span className="text-2xl font-bold text-black">{streaks.longest_count}</span>
                  </div>
                  <div className="text-sm text-muted-foreground font-medium">Longest Streak</div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="soft-card p-6 mb-20 hover-lift">
              <h3 className="text-lg font-semibold mb-6 text-foreground font-nunito">Settings</h3>
              <div className="space-y-4">
                <button 
                  onClick={() => alert('Notification settings coming soon!')}
                  className="w-full text-left p-4 rounded-2xl hover:bg-accent/5 bg-muted/50 border border-border transition-all duration-200 hover:border-accent/30"
                >
                  <div className="font-medium text-foreground mb-1">🔔 Notifications</div>
                  <div className="text-sm text-muted-foreground">Manage when you get notified</div>
                </button>
                <button 
                  onClick={() => alert('Timezone settings coming soon!')}
                  className="w-full text-left p-4 rounded-2xl hover:bg-accent/5 bg-muted/50 border border-border transition-all duration-200 hover:border-accent/30"
                >
                  <div className="font-medium text-foreground mb-1">🌍 Timezone</div>
                  <div className="text-sm text-muted-foreground">Update your timezone</div>
                </button>
                <button 
                  onClick={() => alert('Privacy settings coming soon!')}
                  className="w-full text-left p-4 rounded-2xl hover:bg-accent/5 bg-muted/50 border border-border transition-all duration-200 hover:border-accent/30"
                >
                  <div className="font-medium text-foreground mb-1">🔒 Privacy</div>
                  <div className="text-sm text-muted-foreground">Control who sees your posts</div>
                </button>
              </div>
            </div>
          </>
        )}

        {/* Edit Profile Modal */}
        <EditProfileModal
          isOpen={isEditProfileOpen}
          onClose={() => setIsEditProfileOpen(false)}
          onProfileUpdated={loadUserData}
          currentProfile={userProfile}
        />

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto flex justify-around py-4">
            <Link href="/dashboard/today" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌱</span>
              <span className="text-xs font-medium">Today</span>
            </Link>
            <Link href="/dashboard/circle" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌿</span>
              <span className="text-xs font-medium">Circle</span>
            </Link>
            <button className="flex flex-col items-center text-primary">
              <span className="text-xl mb-1">🌸</span>
              <span className="text-xs font-medium">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
