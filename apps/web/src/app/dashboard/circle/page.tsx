'use client'

import { useAuth } from '@/providers/auth-provider'

export default function CirclePage() {
  const { user } = useAuth()

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        <h1 className="text-2xl font-bold mb-6">Your Circle</h1>
        
        <div className="bg-white rounded-lg p-6 shadow-sm text-center">
          <div className="text-6xl mb-4">👥</div>
          <h2 className="text-lg font-semibold mb-2">No friends yet</h2>
          <p className="text-gray-600 text-sm mb-4">
            Add friends to see their gratitude posts and share yours with them
          </p>
          <button className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm">
            Add Friends
          </button>
        </div>

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <a href="/dashboard/today" className="flex flex-col items-center text-gray-400">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </a>
            <button className="flex flex-col items-center text-blue-600">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </button>
            <a href="/dashboard/profile" className="flex flex-col items-center text-gray-400">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  )
}
