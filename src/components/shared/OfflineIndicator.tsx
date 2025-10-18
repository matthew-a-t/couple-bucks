import { useEffect, useState } from 'react'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Badge } from '@/components/ui/badge'
import { WifiOff, Wifi, Clock } from 'lucide-react'
import { NetworkStatus, OfflineQueue } from '@/lib/offlineQueue'

export const OfflineIndicator = () => {
  const [isOnline, setIsOnline] = useState(NetworkStatus.isOnline())
  const [queueCount, setQueueCount] = useState(OfflineQueue.getQueueCount())
  const [justBackOnline, setJustBackOnline] = useState(false)

  useEffect(() => {
    // Set up network status listener
    const cleanup = NetworkStatus.addListener((online) => {
      setIsOnline(online)

      if (online) {
        // Just came back online
        setJustBackOnline(true)
        setTimeout(() => setJustBackOnline(false), 5000)
      }
    })

    // Check queue count periodically
    const interval = setInterval(() => {
      setQueueCount(OfflineQueue.getQueueCount())
    }, 1000)

    return () => {
      cleanup()
      clearInterval(interval)
    }
  }, [])

  // Don't show anything if online and no queued items
  if (isOnline && queueCount === 0 && !justBackOnline) {
    return null
  }

  return (
    <div className="fixed top-16 left-4 right-4 z-40">
      {!isOnline && (
        <Alert variant="destructive" className="shadow-lg">
          <WifiOff className="h-4 w-4" />
          <AlertDescription className="flex items-center justify-between">
            <span>You're offline. Expenses will be queued.</span>
            {queueCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                <Clock className="h-3 w-3 mr-1" />
                {queueCount} queued
              </Badge>
            )}
          </AlertDescription>
        </Alert>
      )}

      {isOnline && queueCount > 0 && (
        <Alert className="shadow-lg border-warning bg-warning/10">
          <Wifi className="h-4 w-4 text-warning" />
          <AlertDescription className="flex items-center justify-between text-warning-foreground">
            <span>Back online! Syncing {queueCount} queued expense{queueCount !== 1 ? 's' : ''}...</span>
          </AlertDescription>
        </Alert>
      )}

      {justBackOnline && queueCount === 0 && (
        <Alert className="shadow-lg border-success bg-success/10">
          <Wifi className="h-4 w-4 text-success" />
          <AlertDescription className="text-success-foreground">
            Back online! All expenses synced.
          </AlertDescription>
        </Alert>
      )}
    </div>
  )
}
