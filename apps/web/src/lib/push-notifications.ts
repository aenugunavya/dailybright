'use client'

export class PushNotificationService {
  private static instance: PushNotificationService
  private registration: ServiceWorkerRegistration | null = null

  private constructor() {}

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService()
    }
    return PushNotificationService.instance
  }

  async initializePushNotifications(): Promise<boolean> {
    try {
      // Register service worker
      if ('serviceWorker' in navigator) {
        this.registration = await navigator.serviceWorker.register('/sw.js')
      }

      // Request notification permission
      if ('Notification' in window && Notification.permission !== 'granted') {
        const permission = await Notification.requestPermission()
        if (permission !== 'granted') {
          return false
        }
      }

      // Subscribe to push notifications
      if (this.registration && 'PushManager' in window) {
        const vapidKey = process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        if (vapidKey) {
          const subscription = await this.registration.pushManager.subscribe({
            userVisibleOnly: true,
            applicationServerKey: this.urlB64ToUint8Array(vapidKey)
          })

          // Send subscription to your server
          await this.sendSubscriptionToServer(subscription)
        }
        return true

        // Send subscription to your server
        await this.sendSubscriptionToServer(subscription)
        return true
      }

      return false
    } catch (error) {
      console.error('Push notification setup failed:', error)
      return false
    }
  }

  private urlB64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4)
    const base64 = (base64String + padding)
      .replace(/-/g, '+')
      .replace(/_/g, '/')

    const rawData = window.atob(base64)
    const outputArray = new Uint8Array(rawData.length)

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i)
    }
    return outputArray
  }

  private async sendSubscriptionToServer(subscription: PushSubscription): Promise<void> {
    try {
      await fetch('/api/notifications/subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(subscription),
      })
    } catch (error) {
      console.error('Failed to send subscription to server:', error)
    }
  }

  // Schedule push notification via server
  async scheduleGratitudeReminder(): Promise<void> {
    try {
      await fetch('/api/notifications/schedule-push', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
      })
    } catch (error) {
      console.error('Failed to schedule push notification:', error)
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance()
