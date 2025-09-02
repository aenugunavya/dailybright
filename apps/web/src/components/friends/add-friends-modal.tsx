'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { createDatabaseService } from '@/lib/database'
import { useAuth } from '@/providers/auth-provider'

interface AddFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendAdded: () => void
}

export function AddFriendsModal({ isOpen, onClose, onFriendAdded }: AddFriendsModalProps) {
  const { user, supabase } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !email.trim()) return

    // Prevent users from adding themselves
    if (user.email === email.trim()) {
      setMessage('You cannot add yourself as a friend')
      return
    }

    setIsLoading(true)
    setMessage('')

    try {
      const databaseService = createDatabaseService(supabase)
      const { error } = await databaseService.sendFriendRequest(user.id, email.trim())
      
      if (error) {
        setMessage(error)
      } else {
        setMessage('Friend request sent successfully!')
        setEmail('')
        onFriendAdded()
        setTimeout(() => {
          onClose()
          setMessage('')
        }, 1500)
      }
    } catch (error) {
      setMessage('Failed to send friend request. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="soft-card p-6 w-full max-w-md soft-shadow-lg">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-foreground font-nunito">Add Friends</h2>
          <button
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground transition-colors text-xl"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddFriend} className="space-y-5">
          <div>
            <label className="block text-sm font-medium text-foreground mb-2">
              Friend's Email
            </label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value)
                setMessage('') // Clear any previous messages
              }}
              className="h-12 bg-card border-border text-foreground placeholder:text-muted-foreground focus:border-primary focus:ring-primary/20 focus:ring-2"
              required
            />
            {user && email.trim() && user.email === email.trim() && (
              <p className="text-xs text-destructive mt-2">
                You cannot add yourself as a friend
              </p>
            )}
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? 'Sending...' : 'Send Friend Request'}
          </Button>

          {message && (
            <div className={`text-center text-sm p-3 rounded-2xl ${
              message.includes('sent') || message.includes('success')
                ? 'bg-nature-50 text-nature-600 border border-nature-200'
                : 'bg-destructive/10 text-destructive border border-destructive/20'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-border">
          <p className="text-xs text-muted-foreground text-center leading-relaxed">
            Your friends will need to accept your request before you can see each other's posts.
          </p>
        </div>
      </div>
    </div>
  )
}


