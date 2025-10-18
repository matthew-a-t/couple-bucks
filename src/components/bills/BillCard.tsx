import { useState } from 'react'
import { format } from 'date-fns'
import type { BillWithStatus } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { billsService, expensesService } from '@/services'
import { useAuthStore } from '@/store'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger
} from '@/components/ui/dropdown-menu'
import { useToast } from '@/hooks/use-toast'
import { MoreVertical, CheckCircle2, Trash2, Calendar } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BillCardProps {
  bill: BillWithStatus
  onBillUpdated?: () => void
  onBillDeleted?: () => void
}

export const BillCard = ({ bill, onBillUpdated, onBillDeleted }: BillCardProps) => {
  const session = useAuthStore((state) => state.session)
  const { toast } = useToast()
  const [isProcessing, setIsProcessing] = useState(false)

  const getCategoryEmoji = (categoryName: string) => {
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

  const handleMarkAsPaid = async () => {
    try {
      setIsProcessing(true)
      await billsService.markBillAsPaid(bill.id)

      // Optionally create expense
      if (session?.couple?.id && session.user.id) {
        await expensesService.createExpenseWithSplit(
          session.couple.id,
          session.user.id,
          Number(bill.amount),
          bill.category,
          bill.split_type as any,
          `Bill payment: ${bill.name}`
        )
      }

      toast({
        title: 'Bill marked as paid',
        description: `${bill.name} payment logged`
      })

      onBillUpdated?.()
    } catch (err: any) {
      toast({
        title: 'Failed to mark as paid',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDelete = async () => {
    try {
      setIsProcessing(true)
      await billsService.deleteBill(bill.id)
      toast({ title: 'Bill deleted' })
      onBillDeleted?.()
    } catch (err: any) {
      toast({
        title: 'Failed to delete',
        description: err.message,
        variant: 'destructive'
      })
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <Card className={cn(bill.status === 'overdue' && 'border-destructive/50')}>
      <CardContent className="p-4">
        <div className="flex items-start gap-4">
          <div className="text-3xl">{getCategoryEmoji(bill.category)}</div>

          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div>
                <h3 className="font-semibold truncate">{bill.name}</h3>
                <p className="text-sm text-muted-foreground">{bill.category}</p>
              </div>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" disabled={isProcessing}>
                    <MoreVertical className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem onClick={handleMarkAsPaid}>
                    <CheckCircle2 className="mr-2 h-4 w-4" />
                    Mark as Paid
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleDelete} className="text-destructive">
                    <Trash2 className="mr-2 h-4 w-4" />
                    Delete
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
  )
}
