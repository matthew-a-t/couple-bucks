import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useForm, type SubmitHandler } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { onboardingSurveySchema, type OnboardingSurveyData } from '@/types/schemas'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { Checkbox } from '@/components/ui/checkbox'
import { ArrowRight } from 'lucide-react'

export const OnboardingSurveyPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)

  const {
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting }
  } = useForm<OnboardingSurveyData>({
    resolver: zodResolver(onboardingSurveySchema) as any,
    defaultValues: {
      accountType: 'joint',
      splitMethod: 'fifty_fifty',
      trackIncome: false
    }
  })

  const trackIncome = watch('trackIncome')

  const onSubmit: SubmitHandler<OnboardingSurveyData> = async (data) => {
    try {
      setError(null)

      // Store survey data in sessionStorage to use later
      sessionStorage.setItem('onboarding_survey', JSON.stringify(data))

      // Navigate to permission tier selection
      navigate('/onboarding/permission')
    } catch (err: any) {
      console.error('Survey error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <div className="mb-4">
            <div className="w-12 h-12 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
              <span className="text-white font-bold text-xl">1</span>
            </div>
          </div>
          <CardTitle className="text-2xl">Let's set up your finances</CardTitle>
          <CardDescription>
            Answer a few questions so we can customize Couple Bucks for you.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Question 1: Account Type */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                1. How do you manage finances?
              </Label>
              <RadioGroup
                onValueChange={(value) => setValue('accountType', value as any)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="joint" id="joint" />
                  <Label htmlFor="joint" className="cursor-pointer flex-1">
                    <div className="font-medium">Joint accounts only</div>
                    <div className="text-sm text-muted-foreground">
                      We share all our money in joint accounts
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="separate" id="separate" />
                  <Label htmlFor="separate" className="cursor-pointer flex-1">
                    <div className="font-medium">Separate accounts with shared expenses</div>
                    <div className="text-sm text-muted-foreground">
                      We keep separate accounts but split shared costs
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="mixed" id="mixed" />
                  <Label htmlFor="mixed" className="cursor-pointer flex-1">
                    <div className="font-medium">Mix of joint and separate</div>
                    <div className="text-sm text-muted-foreground">
                      We have some joint accounts and some separate accounts
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.accountType && (
                <p className="text-sm text-destructive">{errors.accountType.message}</p>
              )}
            </div>

            {/* Question 2: Split Method */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                2. How do you split expenses?
              </Label>
              <RadioGroup
                onValueChange={(value) => setValue('splitMethod', value as any)}
                className="space-y-3"
              >
                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="fifty_fifty" id="fifty_fifty" />
                  <Label htmlFor="fifty_fifty" className="cursor-pointer flex-1">
                    <div className="font-medium">50/50 on everything</div>
                    <div className="text-sm text-muted-foreground">
                      We split all expenses equally
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="proportional" id="proportional" />
                  <Label htmlFor="proportional" className="cursor-pointer flex-1">
                    <div className="font-medium">Proportional to income</div>
                    <div className="text-sm text-muted-foreground">
                      We split based on how much each of us earns
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom" className="cursor-pointer flex-1">
                    <div className="font-medium">Custom per expense</div>
                    <div className="text-sm text-muted-foreground">
                      We decide the split for each expense individually
                    </div>
                  </Label>
                </div>

                <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-accent cursor-pointer">
                  <RadioGroupItem value="single_payer" id="single_payer" />
                  <Label htmlFor="single_payer" className="cursor-pointer flex-1">
                    <div className="font-medium">One person pays everything</div>
                    <div className="text-sm text-muted-foreground">
                      One partner handles all expenses
                    </div>
                  </Label>
                </div>
              </RadioGroup>
              {errors.splitMethod && (
                <p className="text-sm text-destructive">{errors.splitMethod.message}</p>
              )}
            </div>

            {/* Question 3: Track Income */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                3. Do you want to track income?
              </Label>
              <div className="flex items-center space-x-3 p-4 border rounded-lg">
                <Checkbox
                  id="trackIncome"
                  checked={trackIncome}
                  onCheckedChange={(checked) => setValue('trackIncome', checked as boolean)}
                />
                <Label htmlFor="trackIncome" className="cursor-pointer flex-1">
                  <div className="font-medium">Yes, track both partner incomes</div>
                  <div className="text-sm text-muted-foreground">
                    Useful for proportional splits and financial planning
                  </div>
                </Label>
              </div>
            </div>

            <Button type="submit" className="w-full" disabled={isSubmitting}>
              Continue
              <ArrowRight className="ml-2 h-4 w-4" />
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
