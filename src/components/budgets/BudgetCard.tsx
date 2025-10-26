import { useState } from 'react'
import type { BudgetWithProgress } from '@/types'
import { DEFAULT_CATEGORIES } from '@/types'
import { budgetsService, couplesService } from '@/services'
import { useAuthStore } from '@/store'
import { Card, CardContent, CardHeader } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle
} from '@/components/ui/alert-dialog'
import { useToast } from '@/hooks/use-toast'
import { Trash2, TrendingUp, AlertTriangle, Edit3, Check, X, Plus } from 'lucide-react'
import { cn } from '@/lib/utils'

interface BudgetCardProps {
  budget: BudgetWithProgress & { isPlaceholder?: boolean }
  onBudgetUpdated?: () => void
  onBudgetDeleted?: () => void
}

export const BudgetCard = ({ budget, onBudgetUpdated, onBudgetDeleted }: BudgetCardProps) => {
  const { toast } = useToast()
  const session = useAuthStore((state) => state.session)

  // Helper function to get category emoji - must be defined before state initialization
  // Handles custom category names and custom emoji selections
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

  const commonEmojis = ['💰', '🍔', '🚗', '⚡', '🎮', '🛒', '🏥', '🏠', '🐾', '📦', '✈️', '👕', '📚', '🎬', '☕']

  const [isEditing, setIsEditing] = useState(false)
  const [isSettingLimit, setIsSettingLimit] = useState(false)
  const [editedCategory, setEditedCategory] = useState(budget.category)
  const [editedEmoji, setEditedEmoji] = useState(getCategoryEmoji(budget.category))
  const [editedLimit, setEditedLimit] = useState(budget.limit_amount.toString())
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [resetDialogOpen, setResetDialogOpen] = useState(false)
  const [isDeleting, setIsDeleting] = useState(false)
  const [isResetting, setIsResetting] = useState(false)
  const [isSaving, setIsSaving] = useState(false)

  const getStatusColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'bg-success'
      case 'warning':
        return 'bg-warning'
      case 'error':
        return 'bg-error'
      default:
        return 'bg-primary'
    }
  }

  const getStatusTextColor = (status: 'success' | 'warning' | 'error') => {
    switch (status) {
      case 'success':
        return 'text-success'
      case 'warning':
        return 'text-warning'
      case 'error':
        return 'text-error'
      default:
        return 'text-primary'
    }
  }

  const handleDelete = async () => {
    // Prevent deleting placeholder budgets - they don't exist in the database
    if (budget.isPlaceholder) {
      toast({
        title: 'Cannot delete',
        description: 'This is a placeholder category. It will disappear when you have no expenses in it.',
        variant: 'destructive'
      })
      setDeleteDialogOpen(false)
      return
    }

    try {
      setIsDeleting(true)
      await budgetsService.deleteBudget(budget.id)

      toast({
        title: 'Category deleted',
        description: `${budget.category} category has been removed`
      })

      setDeleteDialogOpen(false)
      onBudgetDeleted?.()
    } catch (err: any) {
      console.error('Delete budget error:', err)
      toast({
        title: 'Failed to delete',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsDeleting(false)
    }
  }

  const handleReset = async () => {
    // Prevent resetting placeholder budgets - they don't exist in the database
    if (budget.isPlaceholder) {
      toast({
        title: 'Cannot reset',
        description: 'This is a placeholder category. Set a spending limit first.',
        variant: 'destructive'
      })
      setResetDialogOpen(false)
      return
    }

    try {
      setIsResetting(true)
      await budgetsService.resetBudget(budget.id)

      toast({
        title: 'Category reset',
        description: `${budget.category} spending reset to $0`
      })

      setResetDialogOpen(false)
      onBudgetUpdated?.()
    } catch (err: any) {
      console.error('Reset budget error:', err)
      toast({
        title: 'Failed to reset',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsResetting(false)
    }
  }

  const handleEdit = () => {
    setEditedCategory(budget.category)
    setEditedEmoji(getCategoryEmoji(budget.category))

    // For placeholder budgets, suggest a reasonable limit based on current spending
    if (budget.isPlaceholder) {
      const suggestedLimit = Math.max(budget.current_spent * 2, 100)
      setEditedLimit(suggestedLimit.toFixed(2))
    } else {
      setEditedLimit(budget.limit_amount.toString())
    }

    setIsEditing(true)
  }

  const handleCancelEdit = () => {
    setEditedCategory(budget.category)
    setEditedEmoji(getCategoryEmoji(budget.category))
    setEditedLimit(budget.limit_amount.toString())
    setIsEditing(false)
  }

  const handleSaveEdit = async () => {
    try {
      setIsSaving(true)

      // Validate category name first
      if (!editedCategory.trim()) {
        toast({
          title: 'Invalid category',
          description: 'Please enter a category name',
          variant: 'destructive'
        })
        setIsSaving(false)
        return
      }

      // Validate and parse limit amount
      const limitAmount = parseFloat(editedLimit)

      if (isNaN(limitAmount) || limitAmount <= 0) {
        toast({
          title: 'Invalid amount',
          description: 'Please enter a valid spending limit',
          variant: 'destructive'
        })
        setIsSaving(false)
        return
      }

      // If this is a placeholder budget, create it instead of updating
      if (budget.isPlaceholder) {
        if (!session?.couple?.id) {
          toast({
            title: 'Error',
            description: 'No active couple found',
            variant: 'destructive'
          })
          setIsSaving(false)
          return
        }

        await budgetsService.createBudgetForCategory(
          session.couple.id,
          editedCategory,
          limitAmount
        )

        // Save emoji selection
        await couplesService.updateCategoryEmoji(session.couple.id, editedCategory, editedEmoji)

        toast({
          title: 'Budget created!',
          description: `${editedCategory} budget set to $${limitAmount.toFixed(2)}`
        })
      } else {
        // Update existing budget
        await budgetsService.updateBudget(budget.id, {
          category: editedCategory,
          limit_amount: limitAmount
        })

        // Save emoji selection
        await couplesService.updateCategoryEmoji(session.couple.id, editedCategory, editedEmoji)

        toast({
          title: 'Category updated!',
          description: `${editedCategory} has been updated`
        })
      }

      // Refresh session to get updated emoji mapping
      await useAuthStore.getState().refreshSession()

      setIsEditing(false)
      onBudgetUpdated?.()
    } catch (err: any) {
      console.error('Save budget error:', err)
      toast({
        title: 'Failed to save',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleSetLimit = async () => {
    try {
      setIsSaving(true)
      const limitAmount = parseFloat(editedLimit)

      if (isNaN(limitAmount) || limitAmount <= 0) {
        toast({
          title: 'Invalid amount',
          description: 'Please enter a valid spending limit',
          variant: 'destructive'
        })
        setIsSaving(false)
        return
      }

      if (!session?.couple?.id) {
        toast({
          title: 'Error',
          description: 'No active couple found',
          variant: 'destructive'
        })
        setIsSaving(false)
        return
      }

      await budgetsService.createBudgetForCategory(
        session.couple.id,
        budget.category,
        limitAmount
      )

      toast({
        title: 'Limit set!',
        description: `$${limitAmount.toFixed(2)} limit set for ${budget.category}`
      })

      setIsSettingLimit(false)
      onBudgetUpdated?.()
    } catch (err: any) {
      console.error('Set limit error:', err)
      toast({
        title: 'Failed to set limit',
        description: err.message || 'Please try again',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  // Render placeholder budget (category without a limit set)
  if (budget.isPlaceholder && !isEditing && !isSettingLimit) {
    return (
      <Card className="transition-all hover:shadow-lg border-0">
        <CardHeader className="pb-2 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{getCategoryEmoji(budget.category)}</span>
              <div>
                <h3 className="font-semibold text-sm">{budget.category}</h3>
                <p className="text-xs text-muted-foreground">
                  {budget.current_spent > 0
                    ? `$${budget.current_spent.toFixed(2)} spent (no limit)`
                    : 'No limit set'}
                </p>
              </div>
            </div>

            <Button variant="ghost" size="icon" onClick={handleEdit}>
              <Edit3 className="h-3.5 w-3.5" />
            </Button>
          </div>
        </CardHeader>

        <CardContent className="pt-2">
          <Button
            className="w-full h-8 text-xs"
            variant="outline"
            onClick={() => {
              setEditedLimit('')
              setIsSettingLimit(true)
            }}
          >
            <Plus className="h-3 w-3 mr-1.5" />
            Set Spending Limit
          </Button>
        </CardContent>
      </Card>
    )
  }

  // Handle setting limit for placeholder budgets
  if (budget.isPlaceholder && isSettingLimit) {
    return (
      <Card className="transition-all hover:shadow-md border-0">
        <CardHeader className="pb-2 py-3">
          <div className="flex items-center gap-2">
            <span className="text-2xl">{getCategoryEmoji(budget.category)}</span>
            <div>
              <h3 className="font-semibold text-sm">{budget.category}</h3>
              <p className="text-xs text-muted-foreground">Setting limit...</p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="text-sm text-muted-foreground min-w-[60px]">Limit:</span>
              <div className="relative flex-1">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                <Input
                  type="number"
                  step="0.01"
                  value={editedLimit}
                  onChange={(e) => setEditedLimit(e.target.value)}
                  placeholder="0.00"
                  className="pl-7"
                  disabled={isSaving}
                  autoFocus
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="ghost"
                onClick={() => {
                  setIsSettingLimit(false)
                  setEditedLimit('0')
                }}
                disabled={isSaving}
                className="flex-1"
              >
                <X className="h-4 w-4 mr-1" />
                Cancel
              </Button>
              <Button
                size="sm"
                onClick={handleSetLimit}
                disabled={isSaving}
                className="flex-1"
              >
                <Check className="h-4 w-4 mr-1" />
                {isSaving ? 'Saving...' : 'Set Limit'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <>
      <Card className="transition-all hover:shadow-lg border-0">
        <CardHeader className="pb-3">
          {isEditing ? (
            // Edit Mode
            <div className="space-y-3">
              {/* Emoji Selector */}
              <div className="space-y-2">
                <Label className="text-sm">Icon</Label>
                <div className="flex flex-wrap gap-2">
                  {commonEmojis.map((emoji) => (
                    <button
                      key={emoji}
                      type="button"
                      onClick={() => setEditedEmoji(emoji)}
                      className={cn(
                        'text-2xl p-2 rounded-lg transition-colors',
                        editedEmoji === emoji
                          ? 'bg-primary/20 ring-2 ring-primary'
                          : 'bg-accent hover:bg-accent/80'
                      )}
                      disabled={isSaving}
                    >
                      {emoji}
                    </button>
                  ))}
                  <Input
                    value={editedEmoji}
                    onChange={(e) => setEditedEmoji(e.target.value)}
                    placeholder="Or type emoji"
                    className="w-16 text-center text-2xl h-12"
                    disabled={isSaving}
                    maxLength={2}
                  />
                </div>
              </div>

              {/* Category Name */}
              <div className="space-y-2">
                <Label className="text-sm">Category Name</Label>
                <Input
                  value={editedCategory}
                  onChange={(e) => setEditedCategory(e.target.value)}
                  placeholder="Category name"
                  disabled={isSaving}
                />
              </div>

              {/* Limit Amount */}
              <div className="space-y-2">
                <Label className="text-sm">Spending Limit</Label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">$</span>
                  <Input
                    type="number"
                    step="0.01"
                    value={editedLimit}
                    onChange={(e) => setEditedLimit(e.target.value)}
                    placeholder="0.00"
                    className="pl-7"
                    disabled={isSaving}
                  />
                </div>
                {budget.isPlaceholder && (
                  <p className="text-xs text-muted-foreground">
                    Set a budget limit to track spending for this category
                  </p>
                )}
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-2">
                <div className="flex items-center gap-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={handleCancelEdit}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <X className="h-4 w-4 mr-1" />
                    Cancel
                  </Button>
                  <Button
                    size="sm"
                    onClick={handleSaveEdit}
                    disabled={isSaving}
                    className="flex-1"
                  >
                    <Check className="h-4 w-4 mr-1" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                </div>
                {!budget.isPlaceholder && (
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      setIsEditing(false)
                      setDeleteDialogOpen(true)
                    }}
                    disabled={isSaving}
                    className="w-full"
                  >
                    <Trash2 className="h-4 w-4 mr-1" />
                    Delete Category
                  </Button>
                )}
              </div>
            </div>
          ) : (
            // Display Mode
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-2xl">{getCategoryEmoji(budget.category)}</span>
                <div>
                  <h3 className="font-semibold text-sm">{budget.category}</h3>
                  <p className="text-xs text-muted-foreground">
                    ${budget.current_spent.toFixed(2)} of ${budget.limit_amount.toFixed(2)}
                  </p>
                </div>
              </div>

              <Button variant="ghost" size="icon" onClick={handleEdit}>
                <Edit3 className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </CardHeader>

        <CardContent className="space-y-2 pt-2">
          {/* Progress Bar */}
          <div className="space-y-1.5">
            <Progress
              value={Math.min(budget.percentage, 100)}
              className="h-2"
              indicatorClassName={getStatusColor(budget.status)}
            />

            <div className="flex items-center justify-between text-xs">
              <span className={cn('font-medium', getStatusTextColor(budget.status))}>
                {budget.percentage.toFixed(0)}% used
              </span>
              <span className="text-muted-foreground">
                ${budget.remaining.toFixed(2)} left
              </span>
            </div>
          </div>

          {/* Status Messages */}
          {budget.status === 'error' && (
            <div className="flex items-start gap-1.5 p-2 bg-error/10 border border-error/20 rounded-lg">
              <AlertTriangle className="h-3.5 w-3.5 text-error mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-error">Over limit!</p>
                <p className="text-error/80">
                  Exceeded by ${Math.abs(budget.remaining).toFixed(2)}
                </p>
              </div>
            </div>
          )}

          {budget.status === 'warning' && (
            <div className="flex items-start gap-1.5 p-2 bg-warning/10 border border-warning/20 rounded-lg">
              <TrendingUp className="h-3.5 w-3.5 text-warning mt-0.5 flex-shrink-0" />
              <div className="text-xs">
                <p className="font-medium text-warning">Approaching limit</p>
                <p className="text-warning/80">
                  Be mindful of spending in this category
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete category?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete the {budget.category} category. Your expenses will
              not be affected.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Confirmation */}
      <AlertDialog open={resetDialogOpen} onOpenChange={setResetDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset category spending?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reset the current spending for {budget.category} to $0. The spending limit
              will remain at ${budget.limit_amount.toFixed(2)}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isResetting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleReset} disabled={isResetting}>
              {isResetting ? 'Resetting...' : 'Reset'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}
