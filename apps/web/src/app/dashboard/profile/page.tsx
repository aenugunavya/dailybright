'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'

export default function ProfilePage() {
  const { user, signOut } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Profile</h1>
          <Button onClick={signOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>

        {/* Profile Info */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <div className="text-center mb-4">
            <div className="w-20 h-20 bg-gray-200 rounded-full mx-auto mb-3 flex items-center justify-center">
              <span className="text-2xl">👤</span>
            </div>
            <h2 className="text-lg font-semibold">{user.email}</h2>
          </div>
        </div>

        {/* Streak Stats */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-4">
          <h3 className="text-lg font-semibold mb-4">Your Streaks</h3>
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center">
              <div className="text-3xl font-bold text-orange-600">0</div>
              <div className="text-sm text-gray-600">Current Streak</div>
            </div>
            <div className="text-center">
              <div className="text-3xl font-bold text-blue-600">0</div>
              <div className="text-sm text-gray-600">Longest Streak</div>
            </div>
          </div>
        </div>

        {/* Settings */}
        <div className="bg-white rounded-lg p-6 shadow-sm mb-20">
          <h3 className="text-lg font-semibold mb-4">Settings</h3>
          <div className="space-y-3">
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border">
              <div className="font-medium">Notifications</div>
              <div className="text-sm text-gray-600">Manage when you get notified</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border">
              <div className="font-medium">Timezone</div>
              <div className="text-sm text-gray-600">Update your timezone</div>
            </button>
            <button className="w-full text-left p-3 rounded-lg hover:bg-gray-50 border">
              <div className="font-medium">Privacy</div>
              <div className="text-sm text-gray-600">Control who sees your posts</div>
            </button>
          </div>
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <a href="/dashboard/today" className="flex flex-col items-center text-gray-400">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </a>
            <a href="/dashboard/circle" className="flex flex-col items-center text-gray-400">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </a>
            <button className="flex flex-col items-center text-blue-600">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
