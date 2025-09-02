'use client'

// Notification system for random daily prompts
export class NotificationService {
  private static instance: NotificationService
  private isTestMode: boolean = false
  private testDelay: number = 0 // milliseconds
  private hasPermission = false

  private constructor() {
    // Only initialize on client side
    if (typeof window !== 'undefined') {
      this.initializeServiceWorker()
      this.requestPermission()
    }
  }

  async initializeServiceWorker(): Promise<void> {
    if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
      try {
        const registration = await navigator.serviceWorker.register('/sw.js')
        console.log('Service Worker registered:', registration)
      } catch (error) {
        console.error('Service Worker registration failed:', error)
      }
    }
  }

  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService()
    }
    return NotificationService.instance
  }

  async requestPermission(): Promise<boolean> {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      console.log('This browser does not support notifications or running on server')
      return false
    }

    if (Notification.permission === 'granted') {
      this.hasPermission = true
      return true
    }

    if (Notification.permission !== 'denied') {
      const permission = await Notification.requestPermission()
      this.hasPermission = permission === 'granted'
      return this.hasPermission
    }

    return false
  }

  showNotification(title: string, options?: NotificationOptions): void {
    if (typeof window === 'undefined' || !this.hasPermission) {
      console.log('Notification permission not granted or running on server')
      return
    }

    const notification = new Notification(title, {
      icon: '/favicon.ico',
      badge: '/favicon.ico',
      requireInteraction: true,
      ...options
    })

    notification.onclick = () => {
      window.focus()
      window.location.href = '/dashboard/today'
      notification.close()
    }

    // Auto close after 10 seconds
    setTimeout(() => {
      notification.close()
    }, 10000)
  }

  // Test mode controls
  enableTestMode(delayMs: number = 5000): void {
    this.isTestMode = true
    this.testDelay = delayMs
    console.log(`Test mode enabled. Notifications will appear after ${delayMs}ms`)
  }

  disableTestMode(): void {
    this.isTestMode = false
    this.testDelay = 0
    console.log('Test mode disabled. Notifications will appear at random times.')
  }

  // Trigger a notification immediately for testing
  triggerTestNotification(): void {
    if (!this.hasPermission) {
      console.warn('Notification permission not granted')
      return
    }
    this.showGratitudeNotification()
  }

  scheduleRandomNotification(): void {
    if (typeof window === 'undefined') {
      console.log('Cannot schedule notifications on server side')
      return
    }

    // Clear any existing timeout
    this.clearScheduledNotification()

    // If in test mode, use test delay instead of random time
    if (this.isTestMode) {
      console.log(`Scheduling test notification with ${this.testDelay}ms delay`)
      const timeoutId = setTimeout(() => {
        this.showGratitudeNotification()
      }, this.testDelay)
      localStorage.setItem('notificationTimeoutId', timeoutId.toString())
      return
    }

    // Check if user has already posted today
    const today = new Date().toISOString().split('T')[0]
    const lastNotificationDate = localStorage.getItem('lastNotificationDate')
    
    if (lastNotificationDate === today) {
      console.log('Notification already sent today')
      return
    }

    // Generate random time between 9 AM and 9 PM
    const now = new Date()
    const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    
    // Random hour between 9 and 21 (9 AM to 9 PM)
    const randomHour = Math.floor(Math.random() * 12) + 9
    // Random minute between 0 and 59
    const randomMinute = Math.floor(Math.random() * 60)
    
    const notificationTime = new Date(todayStart)
    notificationTime.setHours(randomHour, randomMinute, 0, 0)

    // If the time has already passed today, schedule for tomorrow
    if (notificationTime <= now) {
      notificationTime.setDate(notificationTime.getDate() + 1)
    }

    const timeUntilNotification = notificationTime.getTime() - now.getTime()

    console.log(`Next notification scheduled for: ${notificationTime.toLocaleString()}`)

    // Store the timeout ID for cleanup
    const timeoutId = setTimeout(() => {
      this.showGratitudeNotification()
      
      // Mark notification as sent for today
      const notificationDate = new Date().toISOString().split('T')[0]
      localStorage.setItem('lastNotificationDate', notificationDate)
      
      // Schedule the next notification for tomorrow
      setTimeout(() => this.scheduleRandomNotification(), 1000 * 60 * 60) // Wait 1 hour before scheduling next
    }, timeUntilNotification)

    // Store timeout ID in localStorage for persistence
    localStorage.setItem('notificationTimeoutId', timeoutId.toString())
  }

  showGratitudeNotification(): void {
    const messages = [
      "🎮 GratiTime Quest Available!",
      "🏆 New Gratitude Mission Unlocked!", 
      "⚡ Daily Challenge Ready!",
      "🌟 Achievement Opportunity Detected!",
      "🎯 Your Gratitude Quest Awaits!"
    ]
    
    const bodies = [
      "A new gratitude adventure is waiting for you to explore!",
      "Level up your day with today's special gratitude challenge",
      "Your daily quest is ready - discover what made today magical!",
      "Time to unlock hidden treasures of appreciation in your day",
      "New mission available: Find the extraordinary in your ordinary day!"
    ]

    const randomMessage = messages[Math.floor(Math.random() * messages.length)]
    const randomBody = bodies[Math.floor(Math.random() * bodies.length)]

    this.showNotification(randomMessage, {
      body: randomBody,
      tag: 'daily-gratitude',

    })
  }

  clearScheduledNotification(): void {
    if (typeof window === 'undefined') return
    
    const timeoutId = localStorage.getItem('notificationTimeoutId')
    if (timeoutId) {
      clearTimeout(parseInt(timeoutId))
      localStorage.removeItem('notificationTimeoutId')
      localStorage.removeItem('nextNotificationTime')
    }
  }

  getNextNotificationTime(): Date | null {
    if (typeof window === 'undefined') return null
    
    const timeString = localStorage.getItem('nextNotificationTime')
    return timeString ? new Date(timeString) : null
  }

  initializeForUser(): void {
    // Request permission and schedule notifications
    this.requestPermission().then((granted) => {
      if (granted) {
        this.scheduleRandomNotification()
      }
    })
  }
}

// Export singleton instance
export const notificationService = NotificationService.getInstance()

// Function to test notifications in the browser console
export function testNotifications(delayMs?: number) {
  const ns = NotificationService.getInstance();
  ns.enableTestMode(delayMs);
  console.log('Test mode enabled. Try these commands:');
  console.log('1. testNotifications.trigger() - to trigger a notification immediately');
  console.log('2. testNotifications.disable() - to disable test mode');
  return {
    trigger: () => ns.triggerTestNotification(),
    disable: () => ns.disableTestMode()
  };
}

// Make testing functions available globally
if (typeof window !== 'undefined') {
  ;(window as any).testNotifications = testNotifications;
}

