import { useState } from 'react'
import { format } from 'date-fns'
import type { BillWithStatus } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { useAuthStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Calendar, Receipt } from 'lucide-react'
import { cn } from '@/lib/utils'
import { BillDetailDialog } from './BillDetailDialog'

interface BillCardProps {
  bill: BillWithStatus
  onBillUpdated?: () => void
  onBillDeleted?: () => void
}

export const BillCard = ({ bill, onBillUpdated, onBillDeleted }: BillCardProps) => {
  const session = useAuthStore((state) => state.session)
  const [detailDialogOpen, setDetailDialogOpen] = useState(false)

  const getCategoryEmoji = (categoryName: string) => {
    // Check if user has selected a custom emoji for this category
    const customEmojiMap = session?.couple?.custom_category_emojis || {}
    if (customEmojiMap[categoryName]) {
      return customEmojiMap[categoryName]
    }

    // Check custom categories by index
    const customCategories = session?.couple?.custom_categories || []
    if (customCategories.length > 0) {
      const customIndex = customCategories.indexOf(categoryName)
      if (customIndex !== -1 && DEFAULT_CATEGORIES[customIndex]) {
        return DEFAULT_CATEGORIES[customIndex].emoji
      }
    }

    // Fall back to DEFAULT_CATEGORIES lookup
    const category = DEFAULT_CATEGORIES.find((cat) => cat.name === categoryName)
    return category?.emoji || '📦'
  }

  const getStatusBadge = () => {
    if (bill.status === 'overdue') {
      return <Badge variant="destructive">Overdue</Badge>
    } else if (bill.status === 'due_soon') {
      return <Badge className="bg-warning text-warning-foreground">Due Soon</Badge>
    }
    return <Badge variant="outline">Upcoming</Badge>
  }

  const getDaysText = () => {
    const days = Math.abs(bill.days_until_due)
    if (bill.status === 'overdue') {
      return `${days} day${days !== 1 ? 's' : ''} overdue`
    } else if (bill.days_until_due === 0) {
      return 'Due today'
    } else if (bill.days_until_due === 1) {
      return 'Due tomorrow'
    }
    return `Due in ${days} day${days !== 1 ? 's' : ''}`
  }

  const handleBillUpdated = () => {
    setDetailDialogOpen(false)
    onBillUpdated?.()
  }

  const handleBillDeleted = () => {
    setDetailDialogOpen(false)
    onBillDeleted?.()
  }

  return (
    <>
      <Card
        className={cn(
          'cursor-pointer hover:shadow-md transition-shadow',
          bill.status === 'overdue' && 'border-destructive/50'
        )}
        onClick={() => setDetailDialogOpen(true)}
      >
        <CardContent className="p-4">
          <div className="flex items-start gap-4">
            <div className="text-3xl">{getCategoryEmoji(bill.category)}</div>

            <div className="flex-1 min-w-0">
              <div className="flex items-start justify-between gap-2 mb-2">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold truncate">{bill.name}</h3>
                    {bill.receipt_url && (
                      <Receipt className="h-4 w-4 text-muted-foreground flex-shrink-0" />
                    )}
                  </div>
                  <p className="text-sm text-muted-foreground">{bill.category}</p>
                </div>
              </div>

              <div className="flex flex-wrap items-center gap-2 text-sm">
                <span className="font-bold text-lg">${Number(bill.amount).toFixed(2)}</span>
                {getStatusBadge()}
                <Badge variant="outline" className="text-xs">
                  {bill.frequency}
                </Badge>
              </div>

              <div className="mt-2 flex items-center gap-2 text-sm text-muted-foreground">
                <Calendar className="h-3 w-3" />
                <span>{format(new Date(bill.due_date), 'MMM d, yyyy')}</span>
                <span>•</span>
                <span>{getDaysText()}</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Bill Detail Dialog */}
      <BillDetailDialog
        bill={bill}
        open={detailDialogOpen}
        onOpenChange={setDetailDialogOpen}
        onBillUpdated={handleBillUpdated}
        onBillDeleted={handleBillDeleted}
      />
    </>
  )
}
