'use client'

import { useState, useEffect } from 'react'
import { Button } from './button'
import { notificationService } from '@/lib/notification'

export function NotificationPrompt() {
  const [showPrompt, setShowPrompt] = useState(false)
  const [permissionState, setPermissionState] = useState<NotificationPermission>('default')

  useEffect(() => {
    if ('Notification' in window) {
      setPermissionState(Notification.permission)
      
      // Show prompt if permission is default (not asked yet)
      if (Notification.permission === 'default') {
        // Wait a bit before showing the prompt to not be intrusive
        setTimeout(() => setShowPrompt(true), 3000)
      }
    }
  }, [])

  const handleEnableNotifications = async () => {
    const granted = await notificationService.requestPermission()
    if (granted) {
      setPermissionState('granted')
      setShowPrompt(false)
      // Start scheduling notifications
      notificationService.initializeForUser()
    } else {
      setPermissionState('denied')
    }
  }

  const handleDismiss = () => {
    setShowPrompt(false)
  }

  if (!showPrompt || permissionState !== 'default') {
    return null
  }

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 max-w-md mx-auto">
      <div className="gradient-card rounded-lg p-4 border border-purple-500/30 shadow-lg">
        <div className="flex items-start space-x-3">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h4 className="font-medium text-white mb-1">Stay Connected with Gratitude</h4>
            <p className="text-sm text-slate-300 mb-3">
              Get surprise reminders throughout the day to share what you're grateful for!
            </p>
            <div className="flex space-x-2">
              <Button 
                onClick={handleEnableNotifications}
                size="sm"
                className="bg-purple-600 hover:bg-purple-700 text-white"
              >
                Enable Notifications
              </Button>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="border-slate-600 text-slate-300 hover:bg-slate-700"
              >
                Maybe Later
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
