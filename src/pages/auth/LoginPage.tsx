import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { loginSchema, type LoginFormData } from '@/types/schemas'
import { useAuthStore } from '@/store'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Loader2 } from 'lucide-react'

export const LoginPage = () => {
  const navigate = useNavigate()
  const login = useAuthStore((state) => state.login)
  const [error, setError] = useState<string | null>(null)

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting }
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema)
  })

  const onSubmit = async (data: LoginFormData) => {
    try {
      setError(null)
      await login(data.email, data.password)

      // Check if user needs onboarding
      const session = useAuthStore.getState().session

      if (!session) {
        setError('Failed to load session. Please try again.')
        return
      }

      // Redirect based on onboarding status
      if (!session.profile.couple_id) {
        // User hasn't created or joined a couple yet
        navigate('/onboarding')
      } else if (!session.couple?.is_paired) {
        // User created couple but partner hasn't joined
        navigate('/onboarding/waiting')
      } else {
        // User is fully set up
        navigate('/dashboard')
      }
    } catch (err: any) {
      console.error('Login error:', err)
      setError(err.message || 'Invalid email or password. Please try again.')
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
          <CardTitle className="text-2xl">Welcome back!</CardTitle>
          <CardDescription>Sign in to manage your finances together.</CardDescription>
        </CardHeader>
        <CardContent>
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

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Password</Label>
                <Link
                  to="/reset-password"
                  className="text-sm text-primary hover:underline"
                  tabIndex={-1}
                >
                  Forgot password?
                </Link>
              </div>
              <Input
                id="password"
                type="password"
                placeholder="••••••••"
                {...register('password')}
                disabled={isSubmitting}
              />
              {errors.password && (
                <p className="text-sm text-destructive">{errors.password.message}</p>
              )}
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Signing in...
                </>
              ) : (
                'Sign in'
              )}
            </Button>

            <div className="text-center text-sm">
              <span className="text-muted-foreground">New to Couple Bucks? </span>
              <Link to="/signup" className="text-primary hover:underline font-medium">
                Create an account
              </Link>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
