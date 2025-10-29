import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { incomeService } from '@/services/income'
import type { Income, IncomeFrequency } from '@/types/database'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
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
import { User, Bell, LogOut, UserX, Copy, Check, UserCheck, Users, RefreshCw, DollarSign, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const SettingsPage = () => {
  const navigate = useNavigate()
  const { session, partner, logout } = useAuthStore()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(session?.profile.full_name || '')
  const [permissionTier, setPermissionTier] = useState<'logger' | 'manager'>(
    session?.profile.permission_tier || 'logger'
  )
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [showResetDialog, setShowResetDialog] = useState(false)
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false)

  // Notification preferences (placeholder - would connect to push notification system)
  const [billReminders, setBillReminders] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [expenseSync, setExpenseSync] = useState(true)

  // Income management
  const [myIncomes, setMyIncomes] = useState<Income[]>([])
  const [partnerIncomes, setPartnerIncomes] = useState<Income[]>([])
  const [splitRatio, setSplitRatio] = useState<{ myPercentage: number; partnerPercentage: number } | null>(null)
  const [isLoadingIncomes, setIsLoadingIncomes] = useState(true)
  const [newIncomeAmount, setNewIncomeAmount] = useState('')
  const [newIncomeFrequency, setNewIncomeFrequency] = useState<IncomeFrequency>('monthly')
  const [isSavingIncome, setIsSavingIncome] = useState(false)

  const inviteCode = session?.couple?.invite_code

  // Redirect to onboarding if user doesn't have a couple
  useEffect(() => {
    if (session && !session.profile.couple_id) {
      navigate('/onboarding', { replace: true })
    }
  }, [session, navigate])

  useEffect(() => {
    if (session?.profile.full_name) {
      setFullName(session.profile.full_name)
    }
    if (session?.profile.permission_tier) {
      setPermissionTier(session.profile.permission_tier)
    }
  }, [session?.profile.full_name, session?.profile.permission_tier])

  // Load both partners' incomes and calculate split ratio
  useEffect(() => {
    const loadIncomes = async () => {
      if (!session?.user?.id || !session?.couple?.track_income || !session?.profile?.couple_id) {
        setIsLoadingIncomes(false)
        return
      }

      try {
        setIsLoadingIncomes(true)

        // Load my incomes
        const myIncomesData = await incomeService.getIncomeForProfile(session.user.id)
        setMyIncomes(myIncomesData)

        // Get couple info to find partner ID
        const coupleData = await couplesService.getCouple(session.profile.couple_id)
        if (coupleData) {
          const partnerId = coupleData.user1_id === session.user.id ? coupleData.user2_id : coupleData.user1_id

          // Load partner's incomes
          const partnerIncomesData = await incomeService.getIncomeForProfile(partnerId)
          setPartnerIncomes(partnerIncomesData)

          // Calculate proportional split ratio
          const split = await incomeService.calculateProportionalSplit(session.profile.couple_id)
          const myPercentage = coupleData.user1_id === session.user.id ? split.user1Percentage : split.user2Percentage
          const partnerPercentage = coupleData.user1_id === session.user.id ? split.user2Percentage : split.user1Percentage
          setSplitRatio({ myPercentage, partnerPercentage })
        }
      } catch (error: any) {
        console.error('Failed to load incomes:', error)
        // Check if error is due to missing table (migrations not applied)
        if (error?.code === '42P01' || error?.message?.includes('relation') || error?.message?.includes('does not exist')) {
          console.warn('Income table not found - database migrations may not be applied yet')
          // Silently fail - don't show error to user, just hide the income section
        } else {
          // Show error for other types of failures
          toast({
            title: 'Error',
            description: 'Failed to load income data',
            variant: 'destructive'
          })
        }
      } finally {
        setIsLoadingIncomes(false)
      }
    }

    loadIncomes()
  }, [session?.user?.id, session?.couple?.track_income, session?.profile?.couple_id, toast])

  const handleSaveProfile = async () => {
    if (!session?.user?.id || !fullName.trim()) {
      toast({
        title: 'Error',
        description: 'Please enter your full name',
        variant: 'destructive'
      })
      return
    }

    setIsSaving(true)

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          full_name: fullName.trim(),
          permission_tier: permissionTier
        })
        .eq('id', session.user.id)

      if (error) throw error

      // Refresh session to get updated profile
      await useAuthStore.getState().refreshSession()

      toast({
        title: 'Profile updated',
        description: 'Your profile has been saved successfully'
      })
    } catch (error) {
      console.error('Failed to update profile:', error)
      toast({
        title: 'Error',
        description: 'Failed to update profile',
        variant: 'destructive'
      })
    } finally {
      setIsSaving(false)
    }
  }

  const handleCopyInviteCode = () => {
    if (inviteCode) {
      navigator.clipboard.writeText(inviteCode)
      setInviteCodeCopied(true)
      setTimeout(() => setInviteCodeCopied(false), 2000)
      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard'
      })
    }
  }

  const handleLogout = async () => {
    try {
      await logout()
      window.location.href = '/login'
    } catch (error) {
      console.error('Logout failed:', error)
      toast({
        title: 'Error',
        description: 'Failed to log out',
        variant: 'destructive'
      })
    }
  }

  const handleLeaveCouple = async () => {
    if (!session?.user?.id) return

    try {
      // Remove couple_id from profile (unpair)
      const { error } = await supabase
        .from('profiles')
        .update({ couple_id: null })
        .eq('id', session.user.id)

      if (error) throw error

      toast({
        title: 'Left couple',
        description: 'You have left your couple account. You can join a new one anytime.'
      })

      // Refresh session and redirect to onboarding landing page
      await useAuthStore.getState().refreshSession()
      window.location.href = '/onboarding'
    } catch (error) {
      console.error('Failed to leave couple:', error)
      toast({
        title: 'Error',
        description: 'Failed to leave couple account',
        variant: 'destructive'
      })
    }
  }

  const handleResetAccount = async () => {
    if (!session?.couple?.id) return

    try {
      await couplesService.resetCoupleData(session.couple.id)

      toast({
        title: 'Account reset',
        description: 'All expenses, budgets, and bills have been cleared. Starting fresh!'
      })

      // Refresh session to clear cached data
      await useAuthStore.getState().refreshSession()

      // Reload the page to reflect changes
      window.location.reload()
    } catch (error) {
      console.error('Failed to reset account:', error)
      toast({
        title: 'Error',
        description: 'Failed to reset account data',
        variant: 'destructive'
      })
    } finally {
      setShowResetDialog(false)
    }
  }

  const handleAddIncome = async () => {
    if (!session?.user?.id || !session?.couple?.id) return

    const amount = parseFloat(newIncomeAmount)
    if (isNaN(amount) || amount <= 0) {
      toast({
        title: 'Invalid amount',
        description: 'Please enter a valid income amount',
        variant: 'destructive'
      })
      return
    }

    try {
      setIsSavingIncome(true)
      await incomeService.createIncome({
        profile_id: session.user.id,
        couple_id: session.couple.id,
        amount,
        frequency: newIncomeFrequency,
        source_name: 'Primary Income',
        is_primary: myIncomes.length === 0 // First income is primary
      })

      toast({
        title: 'Income added',
        description: 'Your income has been saved'
      })

      // Reload incomes and recalculate split
      const incomes = await incomeService.getIncomeForProfile(session.user.id)
      setMyIncomes(incomes)
      setNewIncomeAmount('')
      setNewIncomeFrequency('monthly')

      // Recalculate split ratio
      if (session.profile?.couple_id) {
        const coupleData = await couplesService.getCouple(session.profile.couple_id)
        if (coupleData) {
          const split = await incomeService.calculateProportionalSplit(session.profile.couple_id)
          const myPercentage = coupleData.user1_id === session.user.id ? split.user1Percentage : split.user2Percentage
          const partnerPercentage = coupleData.user1_id === session.user.id ? split.user2Percentage : split.user1Percentage
          setSplitRatio({ myPercentage, partnerPercentage })
        }
      }
    } catch (error) {
      console.error('Failed to add income:', error)
      toast({
        title: 'Error',
        description: 'Failed to add income',
        variant: 'destructive'
      })
    } finally {
      setIsSavingIncome(false)
    }
  }

  const handleDeleteIncome = async (incomeId: string) => {
    try {
      await incomeService.deleteIncome(incomeId)

      toast({
        title: 'Income deleted',
        description: 'Income source has been removed'
      })

      // Reload incomes and recalculate split
      if (session?.user?.id) {
        const incomes = await incomeService.getIncomeForProfile(session.user.id)
        setMyIncomes(incomes)

        // Recalculate split ratio
        if (session.profile?.couple_id) {
          const coupleData = await couplesService.getCouple(session.profile.couple_id)
          if (coupleData) {
            const split = await incomeService.calculateProportionalSplit(session.profile.couple_id)
            const myPercentage = coupleData.user1_id === session.user.id ? split.user1Percentage : split.user2Percentage
            const partnerPercentage = coupleData.user1_id === session.user.id ? split.user2Percentage : split.user1Percentage
            setSplitRatio({ myPercentage, partnerPercentage })
          }
        }
      }
    } catch (error) {
      console.error('Failed to delete income:', error)
      toast({
        title: 'Error',
        description: 'Failed to delete income',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen pb-32">
      <main className="px-4 pt-6 space-y-6 max-w-[90rem] mx-auto">
        {/* Profile Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5 text-primary" />
              Profile
            </CardTitle>
            <CardDescription>Update your personal information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={session?.user?.email || ''}
                disabled
                className="bg-muted"
              />
              <p className="text-xs text-muted-foreground">Email cannot be changed</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name</Label>
              <Input
                id="fullName"
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="Enter your full name"
              />
            </div>

            <div className="space-y-3">
              <Label>Permission Tier</Label>
              <RadioGroup value={permissionTier} onValueChange={(value: 'logger' | 'manager') => setPermissionTier(value)}>
                {/* Logger Option */}
                <div className="relative">
                  <RadioGroupItem value="logger" id="logger-setting" className="peer sr-only" />
                  <Label
                    htmlFor="logger-setting"
                    className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="p-2 bg-primary/10 rounded-lg mt-1">
                      <UserCheck className="h-5 w-5 text-primary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Logger</div>
                      <p className="text-xs text-muted-foreground">
                        Log expenses, view summaries, and see bills
                      </p>
                    </div>
                  </Label>
                </div>

                {/* Manager Option */}
                <div className="relative">
                  <RadioGroupItem value="manager" id="manager-setting" className="peer sr-only" />
                  <Label
                    htmlFor="manager-setting"
                    className="flex items-start gap-3 p-4 border-2 rounded-lg cursor-pointer hover:bg-accent peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5"
                  >
                    <div className="p-2 bg-secondary/10 rounded-lg mt-1">
                      <Users className="h-5 w-5 text-secondary" />
                    </div>
                    <div className="flex-1">
                      <div className="font-semibold mb-1">Manager</div>
                      <p className="text-xs text-muted-foreground">
                        Full access: create budgets, manage bills, view reports, and more
                      </p>
                    </div>
                  </Label>
                </div>
              </RadioGroup>
            </div>

            <Button
              onClick={handleSaveProfile}
              disabled={
                isSaving ||
                (fullName === session?.profile.full_name && permissionTier === session?.profile.permission_tier)
              }
            >
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
          </CardContent>
        </Card>

        {/* Income Management */}
        {session?.couple?.track_income && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <DollarSign className="h-5 w-5 text-primary" />
                Income Management
              </CardTitle>
              <CardDescription>Each partner can independently track their income for proportional expense splits</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {isLoadingIncomes ? (
                <p className="text-sm text-muted-foreground">Loading income data...</p>
              ) : (
                <>
                  {/* Split Ratio Summary */}
                  {splitRatio && (
                    <div className="p-4 bg-primary/5 rounded-lg border border-primary/20">
                      <div className="flex items-center gap-2 mb-3">
                        <Users className="h-4 w-4 text-primary" />
                        <Label className="text-sm font-semibold">Current Proportional Split</Label>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">You pay</p>
                          <p className="text-2xl font-bold text-primary">{splitRatio.myPercentage}%</p>
                          {myIncomes.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ${myIncomes.reduce((sum, inc) => sum + incomeService.calculateMonthlyIncome(inc.amount, inc.frequency), 0).toFixed(2)}/mo
                            </p>
                          )}
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground mb-1">Partner pays</p>
                          <p className="text-2xl font-bold text-secondary">{splitRatio.partnerPercentage}%</p>
                          {partnerIncomes.length > 0 && (
                            <p className="text-xs text-muted-foreground mt-1">
                              ${partnerIncomes.reduce((sum, inc) => sum + incomeService.calculateMonthlyIncome(inc.amount, inc.frequency), 0).toFixed(2)}/mo
                            </p>
                          )}
                        </div>
                      </div>
                      {myIncomes.length === 0 && partnerIncomes.length === 0 && (
                        <p className="text-xs text-muted-foreground mt-3">
                          💡 Add income below to calculate proportional splits. Without income data, splits default to 50/50.
                        </p>
                      )}
                      {(myIncomes.length > 0 || partnerIncomes.length > 0) && (myIncomes.length === 0 || partnerIncomes.length === 0) && (
                        <p className="text-xs text-muted-foreground mt-3">
                          💡 Only one partner has added income. {myIncomes.length === 0 ? 'Add your income' : 'Your partner can add their income'} to adjust the split ratio, or it will remain 50/50.
                        </p>
                      )}
                    </div>
                  )}

                  <Separator />

                  {/* My Income Sources */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">Your Income</Label>
                      <Badge variant="outline" className="text-xs">Independent</Badge>
                    </div>
                    {myIncomes.length > 0 ? (
                      <div className="space-y-2">
                        {myIncomes.map((income) => {
                          const monthlyAmount = incomeService.calculateMonthlyIncome(income.amount, income.frequency)
                          return (
                            <div
                              key={income.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-primary/5"
                            >
                              <div>
                                <p className="font-medium">
                                  ${income.amount.toFixed(2)}{' '}
                                  <span className="text-sm text-muted-foreground">
                                    {income.frequency}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ≈ ${monthlyAmount.toFixed(2)}/month
                                </p>
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => handleDeleteIncome(income.id)}
                              >
                                <Trash2 className="h-4 w-4 text-destructive" />
                              </Button>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">No income sources added yet</p>
                    )}

                    {/* Add new income form */}
                    <div className="space-y-3 pt-2">
                      <Label className="text-sm">{myIncomes.length > 0 ? 'Add Another Income Source' : 'Add Your Income'}</Label>
                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <Label htmlFor="income-amount" className="text-xs text-muted-foreground">
                            Amount
                          </Label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                              $
                            </span>
                            <Input
                              id="income-amount"
                              type="number"
                              step="0.01"
                              value={newIncomeAmount}
                              onChange={(e) => setNewIncomeAmount(e.target.value)}
                              placeholder="0.00"
                              className="pl-7"
                              disabled={isSavingIncome}
                            />
                          </div>
                        </div>
                        <div className="space-y-2">
                          <Label htmlFor="income-frequency" className="text-xs text-muted-foreground">
                            Frequency
                          </Label>
                          <Select
                            value={newIncomeFrequency}
                            onValueChange={(value: IncomeFrequency) => setNewIncomeFrequency(value)}
                            disabled={isSavingIncome}
                          >
                            <SelectTrigger id="income-frequency">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="weekly">Weekly</SelectItem>
                              <SelectItem value="biweekly">Bi-weekly</SelectItem>
                              <SelectItem value="monthly">Monthly</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </div>
                      <Button
                        onClick={handleAddIncome}
                        disabled={isSavingIncome || !newIncomeAmount}
                        className="w-full"
                      >
                        {isSavingIncome ? 'Adding...' : 'Add Income'}
                      </Button>
                    </div>
                  </div>

                  <Separator />

                  {/* Partner's Income Sources (Read-only) */}
                  <div className="space-y-3">
                    <div className="flex items-center gap-2">
                      <Label className="font-semibold">Partner's Income</Label>
                      <Badge variant="outline" className="text-xs">Read-only</Badge>
                    </div>
                    {partnerIncomes.length > 0 ? (
                      <div className="space-y-2">
                        {partnerIncomes.map((income) => {
                          const monthlyAmount = incomeService.calculateMonthlyIncome(income.amount, income.frequency)
                          return (
                            <div
                              key={income.id}
                              className="flex items-center justify-between p-3 border rounded-lg bg-secondary/5"
                            >
                              <div>
                                <p className="font-medium">
                                  ${income.amount.toFixed(2)}{' '}
                                  <span className="text-sm text-muted-foreground">
                                    {income.frequency}
                                  </span>
                                </p>
                                <p className="text-xs text-muted-foreground">
                                  ≈ ${monthlyAmount.toFixed(2)}/month
                                </p>
                              </div>
                            </div>
                          )
                        })}
                      </div>
                    ) : (
                      <p className="text-sm text-muted-foreground">Partner hasn't added income yet</p>
                    )}
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        )}

        {/* Notification Preferences */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bell className="h-5 w-5 text-primary" />
              Notifications
            </CardTitle>
            <CardDescription>Manage your notification preferences</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Bill Reminders</Label>
                <p className="text-sm text-muted-foreground">Get notified before bills are due</p>
              </div>
              <Switch checked={billReminders} onCheckedChange={setBillReminders} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Budget Alerts</Label>
                <p className="text-sm text-muted-foreground">Alerts when approaching budget limits</p>
              </div>
              <Switch checked={budgetAlerts} onCheckedChange={setBudgetAlerts} />
            </div>

            <Separator />

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label>Expense Sync</Label>
                <p className="text-sm text-muted-foreground">Notifications when partner logs expenses</p>
              </div>
              <Switch checked={expenseSync} onCheckedChange={setExpenseSync} />
            </div>

            <p className="text-xs text-muted-foreground">
              Note: Push notifications require browser permissions and may not work on all devices
            </p>
          </CardContent>
        </Card>

        {/* Couple Information */}
        <Card>
          <CardHeader>
            <CardTitle>Couple Account</CardTitle>
            <CardDescription>Your couple pairing information</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {session?.couple ? (
              <>
                <div className="space-y-2">
                  <Label>Partner</Label>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div>
                      <p className="font-medium">{partner?.full_name || 'Partner'}</p>
                      <p className="text-sm text-muted-foreground">{partner?.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {partner?.permission_tier}
                    </Badge>
                  </div>
                </div>

                {inviteCode && (
                  <div className="space-y-2">
                    <Label>Invite Code</Label>
                    <div className="flex gap-2">
                      <Input value={inviteCode} readOnly className="font-mono bg-muted" />
                      <Button
                        variant="outline"
                        size="icon"
                        onClick={handleCopyInviteCode}
                      >
                        {inviteCodeCopied ? (
                          <Check className="h-4 w-4 text-success" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Share this code with someone if you want to change partners (they must join first)
                    </p>
                  </div>
                )}

                <Separator />

                <div className="space-y-3">
                  <div>
                    <Button
                      variant="outline"
                      onClick={() => setShowResetDialog(true)}
                      className="w-full border-warning text-warning hover:bg-warning/10"
                    >
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Reset Account Data
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      Clear all expenses, budgets, and bills. You'll stay paired with your partner and can start fresh.
                    </p>
                  </div>

                  <div>
                    <Button
                      variant="destructive"
                      onClick={() => setShowLeaveDialog(true)}
                      className="w-full"
                    >
                      <UserX className="mr-2 h-4 w-4" />
                      Leave Couple Account
                    </Button>
                    <p className="text-xs text-muted-foreground mt-2">
                      This will unpair you from your partner. Your data will remain but you'll need to create or join a new couple.
                    </p>
                  </div>
                </div>
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not paired with a partner yet</p>
            )}
          </CardContent>
        </Card>

        {/* Account Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Account</CardTitle>
            <CardDescription>Manage your account settings</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <Button
              variant="outline"
              onClick={() => setShowLogoutDialog(true)}
              className="w-full"
            >
              <LogOut className="mr-2 h-4 w-4" />
              Log Out
            </Button>

            <p className="text-xs text-muted-foreground text-center">
              Couple Bucks v0.4.0 • Made with ❤️ for couples
            </p>
          </CardContent>
        </Card>
      </main>

      {/* Logout Confirmation Dialog */}
      <AlertDialog open={showLogoutDialog} onOpenChange={setShowLogoutDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Log out?</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to log out? You'll need to sign in again to access your account.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLogout}>Log Out</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Leave Couple Confirmation Dialog */}
      <AlertDialog open={showLeaveDialog} onOpenChange={setShowLeaveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Leave couple account?</AlertDialogTitle>
            <AlertDialogDescription>
              This will unpair you from your partner. Your expense history will remain, but you'll need to create
              or join a new couple account to continue using the app. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleLeaveCouple} className="bg-destructive text-destructive-foreground">
              Leave Couple
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reset Account Confirmation Dialog */}
      <AlertDialog open={showResetDialog} onOpenChange={setShowResetDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reset all account data?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete all expenses, budgets, and bills for both you and your partner.
              You'll stay paired together and can start fresh with a clean slate. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleResetAccount} className="bg-warning text-white hover:bg-warning/90">
              Reset Account
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <BottomNav />
    </div>
  )
}
