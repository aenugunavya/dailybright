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
      <div className="soft-card p-5 border border-accent/30 soft-shadow-lg">
        <div className="flex items-start space-x-4">
          <div className="text-2xl">🔔</div>
          <div className="flex-1">
            <h4 className="font-medium text-foreground mb-2 font-nunito">Stay Connected with Gratitude</h4>
            <p className="text-sm text-muted-foreground mb-4 leading-relaxed">
              Get surprise reminders throughout the day to share what you're grateful for!
            </p>
            <div className="flex space-x-3">
              <Button 
                onClick={handleEnableNotifications}
                size="sm"
                className="bg-primary hover:bg-primary/90 text-primary-foreground"
              >
                Enable Notifications
              </Button>
              <Button 
                onClick={handleDismiss}
                variant="outline"
                size="sm"
                className="border-border text-muted-foreground hover:bg-accent/10 hover:border-accent"
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
