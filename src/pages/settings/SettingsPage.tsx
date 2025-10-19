import { useState, useEffect } from 'react'
import { useAuthStore } from '@/store'
import { BottomNav } from '@/components/shared/BottomNav'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Separator } from '@/components/ui/separator'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
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
import { User, Bell, LogOut, UserX, Copy, Check } from 'lucide-react'
import { supabase } from '@/lib/supabase'

export const SettingsPage = () => {
  const { session, logout } = useAuthStore()
  const { toast } = useToast()

  const [fullName, setFullName] = useState(session?.profile.full_name || '')
  const [isSaving, setIsSaving] = useState(false)
  const [showLogoutDialog, setShowLogoutDialog] = useState(false)
  const [showLeaveDialog, setShowLeaveDialog] = useState(false)
  const [inviteCodeCopied, setInviteCodeCopied] = useState(false)

  // Notification preferences (placeholder - would connect to push notification system)
  const [billReminders, setBillReminders] = useState(true)
  const [budgetAlerts, setBudgetAlerts] = useState(true)
  const [expenseSync, setExpenseSync] = useState(true)

  const isManager = session?.profile.permission_tier === 'manager'
  const inviteCode = session?.couple?.invite_code

  useEffect(() => {
    if (session?.profile.full_name) {
      setFullName(session.profile.full_name)
    }
  }, [session?.profile.full_name])

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
        .update({ full_name: fullName.trim() })
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

      // Refresh session and redirect to onboarding
      await useAuthStore.getState().refreshSession()
      window.location.href = '/onboarding/couple-setup'
    } catch (error) {
      console.error('Failed to leave couple:', error)
      toast({
        title: 'Error',
        description: 'Failed to leave couple account',
        variant: 'destructive'
      })
    }
  }

  return (
    <div className="min-h-screen bg-background pb-32">
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

            <div className="space-y-2">
              <Label>Permission Tier</Label>
              <div className="flex items-center gap-2">
                <Badge variant={isManager ? 'default' : 'secondary'} className="capitalize">
                  {session?.profile.permission_tier}
                </Badge>
                <p className="text-sm text-muted-foreground">
                  {isManager
                    ? 'Full access to budgets, reports, and settings'
                    : 'Can log expenses, view summaries, and manage bills'}
                </p>
              </div>
            </div>

            <Button onClick={handleSaveProfile} disabled={isSaving || fullName === session?.profile.full_name}>
              {isSaving ? 'Saving...' : 'Save Changes'}
            </Button>
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
                      <p className="font-medium">{session.partner?.full_name || 'Partner'}</p>
                      <p className="text-sm text-muted-foreground">{session.partner?.email}</p>
                    </div>
                    <Badge variant="secondary" className="capitalize">
                      {session.partner?.permission_tier}
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
              </>
            ) : (
              <p className="text-sm text-muted-foreground">Not paired with a partner yet</p>
            )}
          </CardContent>
        </Card>

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
              Couple Bucks v0.1.0 • Made with ❤️ for couples
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

      <BottomNav />
    </div>
  )
}
