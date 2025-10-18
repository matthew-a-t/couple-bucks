import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Copy, Check, RefreshCw, UserCheck } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const WaitingForPartnerPage = () => {
  const navigate = useNavigate()
  const { session, refreshSession } = useAuthStore()
  const { toast } = useToast()

  const [inviteCode, setInviteCode] = useState<string | null>(null)
  const [copied, setCopied] = useState(false)
  const [isRegenerating, setIsRegenerating] = useState(false)
  const [isChecking, setIsChecking] = useState(false)

  useEffect(() => {
    // Load invite code
    if (session?.couple?.invite_code) {
      setInviteCode(session.couple.invite_code)
    }

    // Check if partner has joined every 5 seconds
    const interval = setInterval(async () => {
      await checkIfPartnerJoined()
    }, 5000)

    return () => clearInterval(interval)
  }, [session])

  const checkIfPartnerJoined = async () => {
    try {
      setIsChecking(true)
      await refreshSession()

      const updatedSession = useAuthStore.getState().session

      if (updatedSession?.couple?.is_paired) {
        // Partner has joined!
        toast({
          title: 'Partner joined!',
          description: 'Your partner has successfully joined. Welcome to Couple Bucks!'
        })

        // Navigate to dashboard
        setTimeout(() => {
          navigate('/dashboard')
        }, 1500)
      }
    } catch (error) {
      console.error('Error checking partner status:', error)
    } finally {
      setIsChecking(false)
    }
  }

  const copyInviteCode = async () => {
    if (!inviteCode) return

    try {
      await navigator.clipboard.writeText(inviteCode)
      setCopied(true)

      toast({
        title: 'Copied!',
        description: 'Invite code copied to clipboard'
      })

      setTimeout(() => setCopied(false), 2000)
    } catch (error) {
      toast({
        title: 'Failed to copy',
        description: 'Please copy the code manually',
        variant: 'destructive'
      })
    }
  }

  const regenerateInviteCode = async () => {
    try {
      setIsRegenerating(true)

      if (!session?.couple?.id) {
        throw new Error('No couple found')
      }

      const updatedCouple = await couplesService.regenerateInviteCode(session.couple.id)
      setInviteCode(updatedCouple.invite_code)

      await refreshSession()

      toast({
        title: 'New invite code generated',
        description: 'Share the new code with your partner'
      })
    } catch (error: any) {
      toast({
        title: 'Failed to regenerate',
        description: error.message,
        variant: 'destructive'
      })
    } finally {
      setIsRegenerating(false)
    }
  }

  const shareInviteCode = async () => {
    if (!inviteCode) return

    const shareText = `Join me on Couple Bucks! Use invite code: ${inviteCode}\n\nDownload: ${window.location.origin}`

    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join me on Couple Bucks',
          text: shareText
        })
      } catch (error) {
        // User cancelled share
      }
    } else {
      // Fallback: copy to clipboard
      await copyInviteCode()
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4 animate-pulse">
              <UserCheck className="h-8 w-8 text-white" />
            </div>
          </div>
          <CardTitle className="text-2xl">Waiting for your partner</CardTitle>
          <CardDescription>
            Share this invite code with your partner to get started
          </CardDescription>
        </CardHeader>

        <CardContent className="space-y-6">
          {inviteCode ? (
            <>
              {/* Invite Code Display */}
              <div className="space-y-3">
                <div className="p-6 rounded-lg text-center" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
                  <p className="text-white/80 text-sm font-medium mb-2">Your Invite Code</p>
                  <p className="text-white text-3xl font-bold tracking-widest font-mono">
                    {inviteCode}
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant="outline"
                    onClick={copyInviteCode}
                    className="w-full"
                  >
                    {copied ? (
                      <>
                        <Check className="mr-2 h-4 w-4 text-success" />
                        Copied!
                      </>
                    ) : (
                      <>
                        <Copy className="mr-2 h-4 w-4" />
                        Copy code
                      </>
                    )}
                  </Button>

                  <Button
                    onClick={shareInviteCode}
                    className="w-full"
                  >
                    Share code
                  </Button>
                </div>
              </div>

              {/* Status */}
              <Alert>
                <Loader2 className="h-4 w-4 animate-spin" />
                <AlertDescription>
                  {isChecking ? 'Checking...' : 'Waiting for partner to join'}
                </AlertDescription>
              </Alert>

              {/* Instructions */}
              <div className="bg-accent/50 p-4 rounded-lg space-y-2">
                <p className="text-sm font-medium">How your partner can join:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Sign up for Couple Bucks</li>
                  <li>Complete the setup steps</li>
                  <li>Enter your invite code when prompted</li>
                </ol>
              </div>

              {/* Actions */}
              <div className="space-y-2">
                <Button
                  variant="outline"
                  onClick={checkIfPartnerJoined}
                  disabled={isChecking}
                  className="w-full"
                >
                  {isChecking ? (
                    <>
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                      Checking...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="mr-2 h-4 w-4" />
                      Check now
                    </>
                  )}
                </Button>

                <Button
                  variant="ghost"
                  onClick={regenerateInviteCode}
                  disabled={isRegenerating}
                  className="w-full text-sm"
                >
                  {isRegenerating ? (
                    <>
                      <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                      Generating new code...
                    </>
                  ) : (
                    'Generate new invite code'
                  )}
                </Button>
              </div>

              {/* Skip option */}
              <div className="text-center pt-4 border-t">
                <p className="text-sm text-muted-foreground mb-2">
                  Want to explore first?
                </p>
                <Button
                  variant="link"
                  onClick={() => navigate('/dashboard')}
                  className="text-sm"
                >
                  Continue to dashboard
                </Button>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Loading invite code...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
