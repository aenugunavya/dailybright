'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { createDatabaseService } from '@/lib/database'
import { useAuth } from '@/providers/auth-provider'

interface PendingRequestsProps {
  onRequestUpdated: () => void
}

export function PendingRequests({ onRequestUpdated }: PendingRequestsProps) {
  const { user, supabase } = useAuth()
  const [pendingRequests, setPendingRequests] = useState<any[]>([])
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (user) {
      loadPendingRequests()
    }
  }, [user])

  const loadPendingRequests = async () => {
    if (!user) return

    setIsLoading(true)
    try {
      const databaseService = createDatabaseService(supabase)
      const { data, error } = await databaseService.getPendingFriendRequests(user.id)
      
      if (!error && data) {
        setPendingRequests(data)
      }
    } catch (error) {
      console.error('Error loading pending requests:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleFriendRequest = async (senderId: string, status: 'accepted' | 'blocked') => {
    if (!user) return

    setIsLoading(true)
    try {
      const databaseService = createDatabaseService(supabase)
      const { error } = await databaseService.updateFriendStatus(user.id, senderId, status)
      
      if (!error) {
        // Reload pending requests and notify parent
        await loadPendingRequests()
        onRequestUpdated()
      }
    } catch (error) {
      console.error('Error updating friend request:', error)
    } finally {
      setIsLoading(false)
    }
  }

  if (pendingRequests.length === 0) {
    return null
  }

  return (
    <div className="space-y-4 mb-8">
      <h2 className="text-xl font-semibold text-foreground font-nunito">Pending Friend Requests</h2>
      
              {pendingRequests.map((request, index) => (
        <div key={index} className="soft-card p-5 hover-lift">
          <div className="flex items-center space-x-4">
            <div className="w-14 h-14 rounded-2xl flex items-center justify-center soft-shadow overflow-hidden">
              {request.sender?.profile_photo_url ? (
                <img 
                  src={request.sender.profile_photo_url} 
                  alt="Profile" 
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full bg-gradient-to-br from-blue-400 to-blue-500 flex items-center justify-center">
                  <span className="text-white text-xl">👋</span>
                </div>
              )}
            </div>
            <div className="flex-1">
              <h3 className="font-medium text-foreground text-lg">
                {request.sender?.display_name || 'Anonymous User'}
              </h3>
              <p className="text-sm text-muted-foreground">{request.sender?.email}</p>
              <p className="text-xs text-blue-600 mt-1">Wants to be your friend</p>
            </div>
            <div className="flex space-x-2">
              <Button
                onClick={() => handleFriendRequest(request.user_id, 'accepted')}
                disabled={isLoading}
                className="bg-green-200 hover:bg-green-300 text-black px-4 py-2 rounded-lg text-sm font-medium"
              >
                Accept
              </Button>
              <Button
                onClick={() => handleFriendRequest(request.user_id, 'blocked')}
                disabled={isLoading}
                className="bg-red-200 hover:bg-red-300 text-black px-4 py-2 rounded-lg text-sm font-medium"
              >
                Decline
              </Button>
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
