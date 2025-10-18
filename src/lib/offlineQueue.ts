import { ExpenseFormData } from '@/types'

interface QueuedExpense {
  id: string
  data: ExpenseFormData & {
    coupleId: string
    userId: string
  }
  timestamp: number
}

const QUEUE_KEY = 'couple-bucks-offline-queue'

/**
 * Offline Queue Manager for Expenses
 * Stores expenses in localStorage when offline and syncs when back online
 */
export class OfflineQueue {
  /**
   * Add an expense to the offline queue
   */
  static addExpense(
    coupleId: string,
    userId: string,
    expenseData: ExpenseFormData
  ): string {
    const queue = this.getQueue()
    const id = `offline-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`

    const queuedExpense: QueuedExpense = {
      id,
      data: {
        ...expenseData,
        coupleId,
        userId
      },
      timestamp: Date.now()
    }

    queue.push(queuedExpense)
    this.saveQueue(queue)

    return id
  }

  /**
   * Get all queued expenses
   */
  static getQueue(): QueuedExpense[] {
    try {
      const data = localStorage.getItem(QUEUE_KEY)
      return data ? JSON.parse(data) : []
    } catch (error) {
      console.error('Failed to read offline queue:', error)
      return []
    }
  }

  /**
   * Save queue to localStorage
   */
  private static saveQueue(queue: QueuedExpense[]): void {
    try {
      localStorage.setItem(QUEUE_KEY, JSON.stringify(queue))
    } catch (error) {
      console.error('Failed to save offline queue:', error)
    }
  }

  /**
   * Remove an expense from the queue
   */
  static removeExpense(id: string): void {
    const queue = this.getQueue()
    const filtered = queue.filter((item) => item.id !== id)
    this.saveQueue(filtered)
  }

  /**
   * Clear all queued expenses
   */
  static clearQueue(): void {
    localStorage.removeItem(QUEUE_KEY)
  }

  /**
   * Get count of queued expenses
   */
  static getQueueCount(): number {
    return this.getQueue().length
  }

  /**
   * Check if there are queued expenses
   */
  static hasQueuedExpenses(): boolean {
    return this.getQueueCount() > 0
  }
}

/**
 * Network status utilities
 */
export class NetworkStatus {
  private static listeners: Array<(isOnline: boolean) => void> = []

  /**
   * Check if browser is currently online
   */
  static isOnline(): boolean {
    return navigator.onLine
  }

  /**
   * Register listener for network status changes
   */
  static addListener(callback: (isOnline: boolean) => void): () => void {
    this.listeners.push(callback)

    // Set up native event listeners if not already done
    if (this.listeners.length === 1) {
      window.addEventListener('online', this.handleOnline)
      window.addEventListener('offline', this.handleOffline)
    }

    // Return cleanup function
    return () => {
      this.listeners = this.listeners.filter((l) => l !== callback)

      // Remove native listeners if no more listeners
      if (this.listeners.length === 0) {
        window.removeEventListener('online', this.handleOnline)
        window.removeEventListener('offline', this.handleOffline)
      }
    }
  }

  private static handleOnline = () => {
    this.listeners.forEach((listener) => listener(true))
  }

  private static handleOffline = () => {
    this.listeners.forEach((listener) => listener(false))
  }
}
