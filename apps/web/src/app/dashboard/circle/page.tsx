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
      <div className="text-foreground">Loading...</div>
    </div>
  }

  return (
    <div className="min-h-screen gradient-bg p-6">
      <div className="max-w-md mx-auto">
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-foreground font-nunito">Your Circle</h1>
            <p className="text-sm text-muted-foreground mt-1">Grow gratitude together</p>
          </div>
          <button
            onClick={() => setIsAddFriendsOpen(true)}
            className="soft-button bg-primary hover:bg-primary/90 text-primary-foreground px-4 py-2 text-sm font-medium transition-colors"
          >
            Add Friends
          </button>
        </div>
        
        {isLoading ? (
          <div className="soft-card p-8 text-center">
            <div className="text-muted-foreground">Loading friends...</div>
          </div>
        ) : friends.length === 0 ? (
          <div className="soft-card p-8 text-center hover-lift">
            <div className="text-6xl mb-6">🌱</div>
            <h2 className="text-xl font-semibold mb-3 text-foreground font-nunito">Your gratitude circle is waiting to grow</h2>
            <p className="text-muted-foreground text-base mb-6 leading-relaxed">
              Add friends to see their gratitude posts and share yours with them. Together, you'll create a beautiful network of appreciation and joy.
            </p>
            <button 
              onClick={() => setIsAddFriendsOpen(true)}
              className="soft-button bg-primary hover:bg-primary/90 text-primary-foreground px-6 py-3 text-base font-medium transition-colors"
            >
              Start Growing Your Circle
            </button>
          </div>
        ) : (
          <>
            {/* Friends' Recent Posts */}
            {friendEntries.length > 0 && (
              <div className="mb-8">
                <h2 className="text-xl font-semibold text-foreground mb-6 font-nunito">Recent Gratitude from Friends</h2>
                <div className="space-y-4">
                  {friendEntries.map((entry, index) => (
                    <div key={index} className="soft-card p-5 hover-lift">
                      <div className="flex items-start space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-br from-nature-400 to-nature-500 rounded-2xl flex items-center justify-center soft-shadow">
                          <span className="text-white text-lg">🌿</span>
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center space-x-3 mb-2">
                            <h4 className="font-medium text-foreground text-base">
                              {entry.users?.display_name || 'Anonymous User'}
                            </h4>
                            <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-full">
                              {new Date(entry.created_at).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-sm text-accent mb-3 italic font-medium">
                            "{entry.prompts?.text}"
                          </p>
                          <p className="text-foreground leading-relaxed mb-3">
                            {entry.text}
                          </p>
                          {entry.photo_url && (
                            <img 
                              src={entry.photo_url} 
                              alt="Gratitude post" 
                              className="w-full max-w-xs rounded-2xl mt-3 soft-shadow"
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
              <h2 className="text-xl font-semibold text-foreground font-nunito">Your Circle</h2>
              {friends.map((friendship, index) => {
                const friend = friendship.friend_id === user.id ? friendship.user : friendship.friend
                return (
                  <div key={index} className="soft-card p-5 hover-lift">
                    <div className="flex items-center space-x-4">
                      <div className="w-14 h-14 bg-gradient-to-br from-warm-400 to-warm-500 rounded-2xl flex items-center justify-center soft-shadow">
                        <span className="text-white text-xl">🌸</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-medium text-foreground text-lg">
                          {friend.display_name || 'Anonymous User'}
                        </h3>
                        <p className="text-sm text-muted-foreground">{friend.email}</p>
                      </div>
                      <div className="text-nature-600 text-sm font-medium bg-nature-50 px-3 py-1 rounded-full">
                        🌿 Friends
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
          <div className="max-w-md mx-auto flex justify-around py-4">
            <Link href="/dashboard/today" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌱</span>
              <span className="text-xs font-medium">Today</span>
            </Link>
            <button className="flex flex-col items-center text-primary">
              <span className="text-xl mb-1">🌿</span>
              <span className="text-xs font-medium">Circle</span>
            </button>
            <Link href="/dashboard/profile" className="flex flex-col items-center text-muted-foreground hover:text-accent transition-colors">
              <span className="text-xl mb-1">🌸</span>
              <span className="text-xs font-medium">Profile</span>
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
}
