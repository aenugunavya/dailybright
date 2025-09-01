'use client'

import { useAuth } from '@/providers/auth-provider'
import { useEffect, useState } from 'react'
import { databaseService } from '@/lib/database'
import { AddFriendsModal } from '@/components/friends/add-friends-modal'
import Link from 'next/link'

export default function CirclePage() {
  const { user } = useAuth()
  const [friends, setFriends] = useState<any[]>([])
  const [friendEntries, setFriendEntries] = useState<any[]>([])
  const [isAddFriendsOpen, setIsAddFriendsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)

  useEffect(() => {
    if (user) {
      loadFriends()
      loadFriendEntries()
    }
  }, [user])

  const loadFriends = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const { data, error } = await databaseService.getFriends(user.id)
      if (!error && data) {
        setFriends(data)
      }
    } catch (error) {
      console.error('Error loading friends:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const loadFriendEntries = async () => {
    if (!user) return

    try {
      const { data, error } = await databaseService.getFriendsRecentEntries(user.id)
      if (!error && data) {
        setFriendEntries(data)
      }
    } catch (error) {
      console.error('Error loading friend entries:', error)
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
          <h1 className="text-2xl font-bold text-white">Your Circle</h1>
          <button
            onClick={() => setIsAddFriendsOpen(true)}
            className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
          >
            Add Friends
          </button>
        </div>
        
        {isLoading ? (
          <div className="gradient-card rounded-lg p-6 text-center">
            <div className="text-slate-300">Loading friends...</div>
          </div>
        ) : friends.length === 0 ? (
          <div className="gradient-card rounded-lg p-6 text-center">
            <div className="text-6xl mb-4">👥</div>
            <h2 className="text-lg font-semibold mb-2 text-white">No friends yet</h2>
            <p className="text-slate-300 text-sm mb-4">
              Add friends to see their gratitude posts and share yours with them
            </p>
            <button 
              onClick={() => setIsAddFriendsOpen(true)}
              className="bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 rounded-lg text-sm font-medium transition-colors"
            >
              Get Started
            </button>
          </div>
        ) : (
          <>
            {/* Friends' Recent Posts */}
            {friendEntries.length > 0 && (
              <div className="mb-6">
                <h2 className="text-lg font-semibold text-white mb-4">Recent Gratitude from Friends</h2>
                <div className="space-y-4">
                  {friendEntries.map((entry, index) => (
                    <div key={index} className="gradient-card rounded-lg p-4">
                      <div className="flex items-start space-x-3">
                        <div className="w-10 h-10 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                          <span className="text-lg">👤</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-1">
                            <h4 className="font-medium text-white text-sm">
                              {entry.users?.display_name || 'Anonymous User'}
                            </h4>
                            <span className="text-xs text-slate-400">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-purple-200 mb-2 italic">
                            "{entry.prompts?.text}"
                          </p>
                          <p className="text-sm text-slate-300 mb-2">
                            {entry.text}
                          </p>
                          {entry.photo_url && (
                            <img 
                              src={entry.photo_url} 
                              alt="Gratitude post" 
                              className="w-full max-w-xs rounded-lg mt-2"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Friends List */}
            <div className="space-y-4 mb-20">
              <h2 className="text-lg font-semibold text-white">Your Circle</h2>
              {friends.map((friendship, index) => {
                const friend = friendship.friend_id === user.id ? friendship.user : friendship.friend
                return (
                  <div key={index} className="gradient-card rounded-lg p-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-12 h-12 bg-purple-500/20 border border-purple-500/30 rounded-full flex items-center justify-center">
                        <span className="text-xl">👤</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-white">
                          {friend.display_name || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-slate-400">{friend.email}</p>
                      </div>
                      <div className="text-green-400 text-sm">
                        ✅ Friends
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          </>
        )}

        {/* Add Friends Modal */}
        <AddFriendsModal
          isOpen={isAddFriendsOpen}
          onClose={() => setIsAddFriendsOpen(false)}
          onFriendAdded={loadFriends}
        />

        {/* Navigation */}
        <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t border-border">
          <div className="max-w-md mx-auto flex justify-around py-3">
            <Link href="/dashboard/today" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">📝</span>
              <span className="text-xs">Today</span>
            </Link>
            <button className="flex flex-col items-center text-primary">
              <span className="text-lg">👥</span>
              <span className="text-xs">Circle</span>
            </button>
            <Link href="/dashboard/profile" className="flex flex-col items-center text-slate-400 hover:text-slate-300">
              <span className="text-lg">👤</span>
              <span className="text-xs">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
