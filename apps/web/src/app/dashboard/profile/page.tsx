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
      <div className="text-white">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen gradient-bg p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-white">Profile</h1>
          <Button onClick={signOut} variant="outline" size="sm" className="border-border bg-card/50 text-white hover:bg-accent">
            Sign Out
          </Button>
        </div>

        {isLoading ? (
          <div className="gradient-card rounded-lg p-6 text-center">
            <div className="text-slate-300">Loading profile...</div>
          </div>
        ) : (
          <>
            {/* Profile Info */}
            <div className="gradient-card rounded-lg p-6 mb-4">
              <div className="text-center mb-4">
                <div className="w-24 h-24 rounded-full overflow-hidden bg-purple-500/20 border border-purple-500/30 mx-auto mb-3 flex items-center justify-center">
                  {userProfile?.profile_photo_url ? (
                    <img 
                      src={userProfile.profile_photo_url} 
                      alt="Profile" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-3xl">👤</span>
                  )}
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">
                  {userProfile?.display_name || 'Anonymous User'}
                </h2>
                <p className="text-sm text-slate-400">{user.email}</p>
                <button
                  onClick={() => setIsEditProfileOpen(true)}
                  className="mt-3 px-4 py-2 bg-slate-700/70 border border-slate-600 text-slate-300 rounded-lg text-sm hover:bg-slate-600/70 transition-colors"
                >
                  Edit Profile
                </button>
              </div>
            </div>

            {/* Streak Stats */}
            <div className="gradient-card rounded-lg p-6 mb-4">
              <h3 className="text-lg font-semibold mb-4 text-white">Your Streaks</h3>
              <div className="grid grid-cols-2 gap-4">
                <div className="text-center">
                  <div className="text-3xl font-bold text-orange-400">{streaks.current_count}</div>
                  <div className="text-sm text-slate-300">Current Streak</div>
                </div>
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-400">{streaks.longest_count}</div>
                  <div className="text-sm text-slate-300">Longest Streak</div>
                </div>
              </div>
            </div>

            {/* Settings */}
            <div className="gradient-card rounded-lg p-6 mb-20">
              <h3 className="text-lg font-semibold mb-4 text-white">Settings</h3>
              <div className="space-y-3">
                <button 
                  onClick={() => alert('Notification settings coming soon!')}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 bg-slate-700/30 border border-slate-600 transition-colors"
                >
                  <div className="font-medium text-white">🔔 Notifications</div>
                  <div className="text-sm text-slate-300">Manage when you get notified</div>
                </button>
                <button 
                  onClick={() => alert('Timezone settings coming soon!')}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 bg-slate-700/30 border border-slate-600 transition-colors"
                >
                  <div className="font-medium text-white">🌍 Timezone</div>
                  <div className="text-sm text-slate-300">Update your timezone</div>
                </button>
                <button 
                  onClick={() => alert('Privacy settings coming soon!')}
                  className="w-full text-left p-3 rounded-lg hover:bg-slate-700/50 bg-slate-700/30 border border-slate-600 transition-colors"
                >
                  <div className="font-medium text-white">🔒 Privacy</div>
                  <div className="text-sm text-slate-300">Control who sees your posts</div>
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
          <div className="max-w-md mx-auto flex justify-around py-3">
            <Link href="/dashboard/today" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </Link>
            <Link href="/dashboard/circle" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </Link>
            <button className="flex flex-col items-center text-primary">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
