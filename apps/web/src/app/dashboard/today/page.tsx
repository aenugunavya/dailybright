'use client'

import { useAuth } from '@/providers/auth-provider'
import { Button } from '@/components/ui/button'
import { useEffect, useState } from 'react'

export default function TodayPage() {
  const { user, signOut } = useAuth()
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)

    return () => clearInterval(timer)
  }, [])

  if (!user) {
    return <div>Loading...</div>
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-md mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">GratiTime</h1>
          <Button onClick={signOut} variant="outline" size="sm">
            Sign Out
          </Button>
        </div>

        {/* User Info */}
        <div className="bg-white rounded-lg p-4 mb-6 shadow-sm">
          <p className="text-sm text-gray-600">Welcome back!</p>
          <p className="font-medium">{user.email}</p>
          <p className="text-xs text-gray-500 mt-1">
            Local time: {currentTime.toLocaleString()}
          </p>
        </div>

        {/* Today's Prompt Placeholder */}
        <div className="bg-white rounded-lg p-6 shadow-sm">
          <h2 className="text-lg font-semibold mb-4">Today's Gratitude Prompt</h2>
          <div className="bg-gray-100 rounded-lg p-4 mb-4">
            <p className="text-gray-600 italic">
              "What's something small that made you smile today?"
            </p>
          </div>
          
          {/* Posting Window Info */}
          <div className="bg-blue-50 rounded-lg p-3 mb-4">
            <p className="text-sm text-blue-800">
              <span className="font-medium">Today's window:</span> 5:00 PM - 7:00 PM
            </p>
            <p className="text-xs text-blue-600 mt-1">
              You'll get a notification when it's time to post!
            </p>
          </div>

          {/* Post Form (placeholder) */}
          <div className="space-y-3">
            <textarea
              placeholder="Share your gratitude (max 140 characters)..."
              className="w-full p-3 border rounded-lg resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={3}
              maxLength={140}
            />
            <div className="flex justify-between items-center">
              <button className="text-sm text-gray-500 hover:text-gray-700">
                📷 Add Photo
              </button>
              <Button disabled className="bg-gray-300">
                Post (Window Closed)
              </Button>
            </div>
          </div>
        </div>

        {/* Navigation Placeholder */}
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <button className="flex flex-col items-center text-blue-600">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </button>
            <button className="flex flex-col items-center text-gray-400">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </button>
            <button className="flex flex-col items-center text-gray-400">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
