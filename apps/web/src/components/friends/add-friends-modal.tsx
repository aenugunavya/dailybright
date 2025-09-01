'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { databaseService } from '@/lib/database'
import { useAuth } from '@/providers/auth-provider'

interface AddFriendsModalProps {
  isOpen: boolean
  onClose: () => void
  onFriendAdded: () => void
}

export function AddFriendsModal({ isOpen, onClose, onFriendAdded }: AddFriendsModalProps) {
  const { user } = useAuth()
  const [email, setEmail] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleAddFriend = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!user || !email.trim()) return

    setIsLoading(true)
    setMessage('')

    try {
      const { error } = await databaseService.sendFriendRequest(user.id, email.trim())
      
      if (error) {
        setMessage(error)
      } else {
        setMessage('Friend request sent!')
        setEmail('')
        onFriendAdded()
        setTimeout(() => {
          onClose()
          setMessage('')
        }, 1500)
      }
    } catch (error) {
      setMessage('Failed to send friend request')
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) return null

  return (
    <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50">
      <div className="gradient-card rounded-2xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold text-white">Add Friends</h2>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-white transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={handleAddFriend} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Friend's Email
            </label>
            <Input
              type="email"
              placeholder="Enter email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="h-12 bg-slate-700/70 border-slate-600 text-white placeholder:text-slate-400 focus:border-primary focus:ring-primary focus:ring-2"
              required
            />
          </div>

          <Button
            type="submit"
            disabled={isLoading || !email.trim()}
            className="w-full h-12 bg-primary hover:bg-primary/90 text-primary-foreground font-semibold"
          >
            {isLoading ? 'Sending...' : 'Send Friend Request'}
          </Button>

          {message && (
            <div className={`text-center text-sm p-3 rounded-lg ${
              message.includes('sent') || message.includes('success')
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-red-500/10 text-red-400 border border-red-500/20'
            }`}>
              {message}
            </div>
          )}
        </form>

        <div className="mt-6 pt-4 border-t border-slate-600">
          <p className="text-xs text-slate-400 text-center">
            Your friends will need to accept your request before you can see each other's posts.
          </p>
        </div>
      </div>
    </div>
  )
}


