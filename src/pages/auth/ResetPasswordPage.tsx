import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { resetPasswordSchema, type ResetPasswordFormData } from '@/types/schemas'
import { authService } from '@/services'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2, Mail } from 'lucide-react'

export const ResetPasswordPage = () => {
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<ResetPasswordFormData>({
    resolver: zodResolver(resetPasswordSchema)
  })

  const onSubmit = async (data: ResetPasswordFormData) => {
    try {
      setError(null)
      setSuccess(false)

      await authService.resetPassword(data.email)
      setSuccess(true)
    } catch (err: any) {
      console.error('Reset password error:', err)
      setError(err.message || 'Failed to send reset email. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <div className="mb-4">
            <h1 className="text-4xl font-bold">
              <span className="text-primary">Couple</span>
              <span className="text-accent mx-2">|</span>
              <span className="text-secondary">Bucks</span>
            </h1>
          </div>
          <CardTitle className="text-2xl">Reset password</CardTitle>
          <CardDescription>
            We'll send you a link to reset your password.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {success ? (
            <div className="space-y-4">
              <Alert className="border-success">
                <Mail className="h-4 w-4 text-success" />
                <AlertDescription className="text-success">
                  Check your email! We've sent you a password reset link.
                </AlertDescription>
              </Alert>

              <p className="text-sm text-muted-foreground text-center">
                Didn't receive the email? Check your spam folder or try again.
              </p>

              <Button
                variant="outline"
                className="w-full"
                onClick={() => setSuccess(false)}
              >
                Send another email
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            </div>
          ) : (
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">Email</Label>
                <Input
                  id="email"
                  type="email"
                  placeholder="you@example.com"
                  {...register('email')}
                  disabled={isSubmitting}
                />
                {errors.email && (
                  <p className="text-sm text-destructive">{errors.email.message}</p>
                )}
              </div>

              <Button type="submit" className="w-full" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send reset link'
                )}
              </Button>

              <div className="text-center">
                <Link to="/login" className="text-sm text-primary hover:underline">
                  Back to sign in
                </Link>
              </div>
            </form>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
