// Service Worker for GratiTime notifications
const CACHE_NAME = 'gratitime-v1'

// Install event
self.addEventListener('install', (event) => {
  console.log('Service Worker installing...')
  self.skipWaiting()
})

// Activate event
self.addEventListener('activate', (event) => {
  console.log('Service Worker activating...')
  event.waitUntil(self.clients.claim())
})

// Push event for notifications
self.addEventListener('push', (event) => {
  console.log('Push event received:', event)
  
  let data = {}
  if (event.data) {
    data = event.data.json()
  }

  const options = {
    body: data.body || 'Time to share your gratitude!',
    icon: '/favicon.ico',
    badge: '/favicon.ico',
    tag: 'daily-gratitude',
    requireInteraction: true,
    actions: [
      { action: 'open', title: 'Share Gratitude' },
      { action: 'close', title: 'Later' }
    ],
    data: {
      url: '/dashboard/today'
    }
  }

  event.waitUntil(
    self.registration.showNotification(data.title || '🙏 GratiTime', options)
  )
})

// Notification click event
self.addEventListener('notificationclick', (event) => {
  console.log('Notification click received:', event)
  
  event.notification.close()

  if (event.action === 'open' || !event.action) {
    event.waitUntil(
      self.clients.matchAll({ type: 'window' }).then((clients) => {
        // Check if there's already a window/tab open with the target URL
        for (const client of clients) {
          if (client.url.includes('/dashboard/today') && 'focus' in client) {
            return client.focus()
          }
        }
        
        // If not, open a new window/tab
        if (self.clients.openWindow) {
          return self.clients.openWindow('/dashboard/today')
        }
      })
    )
  }
})

// Background sync for notifications
self.addEventListener('sync', (event) => {
  if (event.tag === 'gratitude-reminder') {
    event.waitUntil(
      // Schedule next notification
      self.registration.showNotification('🙏 Time for Gratitude!', {
        body: 'Share what you\'re grateful for today',
        icon: '/favicon.ico',
        tag: 'daily-gratitude',
        requireInteraction: true
      })
    )
  }
})
