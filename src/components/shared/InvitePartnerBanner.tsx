import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Copy, Check, UserPlus } from 'lucide-react'
import { useToast } from '@/hooks/use-toast'

export const InvitePartnerBanner = () => {
  const navigate = useNavigate()
  const { session } = useAuthStore()
  const { toast } = useToast()
  const [copied, setCopied] = useState(false)

  const inviteCode = session?.couple?.invite_code

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

  if (!inviteCode) return null

  return (
    <Card className="border-2 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
      <CardContent className="p-6">
        <div className="flex flex-col gap-4">
          {/* Header */}
          <div className="flex items-start gap-3">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-primary to-secondary flex items-center justify-center flex-shrink-0">
              <UserPlus className="h-6 w-6 text-white" />
            </div>
            <div className="flex-1">
              <h3 className="font-semibold text-lg text-foreground mb-1">
                Invite your partner
              </h3>
              <p className="text-sm text-muted-foreground">
                Share your invite code to unlock all features and start managing money together
              </p>
            </div>
          </div>

          {/* Invite Code */}
          <div className="rounded-lg p-4 bg-gradient-to-br from-primary to-secondary">
            <p className="text-white/80 text-xs font-medium mb-2 text-center">
              Your Invite Code
            </p>
            <p className="text-white text-2xl font-bold tracking-widest font-mono text-center">
              {inviteCode}
            </p>
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            <Button
              onClick={copyInviteCode}
              variant="outline"
              className="flex-1"
              size="sm"
            >
              {copied ? (
                <>
                  <Check className="mr-2 h-4 w-4 text-success" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="mr-2 h-4 w-4" />
                  Copy Code
                </>
              )}
            </Button>
            <Button
              onClick={shareInviteCode}
              className="flex-1"
              size="sm"
            >
              Share
            </Button>
          </div>

          {/* Learn More Link */}
          <button
            onClick={() => navigate('/onboarding/waiting')}
            className="text-sm text-primary hover:underline font-medium text-center"
          >
            View full invite details
          </button>
        </div>
      </CardContent>
    </Card>
  )
}
