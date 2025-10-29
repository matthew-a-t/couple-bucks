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
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '@/store'
import { couplesService } from '@/services'
import { incomeService } from '@/services/income'
import type { AccountType, SplitType, IncomeFrequency } from '@/types/database'
import { OnboardingProgress } from '@/components/shared/OnboardingProgress'

export const SurveyReviewPage = () => {
  const navigate = useNavigate()
  const [error, setError] = useState<string | null>(null)
  const { session, refreshSession } = useAuthStore()

  const {
    handleSubmit,
    register,
    watch,
    setValue,
    formState: { errors, isSubmitting, isDirty }
  } = useForm<OnboardingSurveyData>({
    resolver: zodResolver(onboardingSurveySchema) as any,
    defaultValues: {
      accountType: (session?.couple?.account_type as AccountType) || 'joint',
      splitMethod: (session?.couple?.default_split_type as SplitType) || 'fifty_fifty',
      trackIncome: session?.couple?.track_income ?? false,
      user1IncomeFrequency: 'monthly',
      user2IncomeFrequency: 'monthly'
    }
  })

  const trackIncome = watch('trackIncome')
  const splitMethod = watch('splitMethod')

  const onSubmit: SubmitHandler<OnboardingSurveyData> = async (data) => {
    try {
      setError(null)

      if (!session?.couple?.id || !session?.user?.id) {
        throw new Error('No couple found. Please ask your partner for a new invite code.')
      }

      // Update survey answers if user made changes
      if (isDirty) {
        await couplesService.updateSurveyAnswers(
          session.couple.id,
          data.accountType as AccountType,
          data.splitMethod as SplitType,
          data.trackIncome
        )

        await refreshSession()
      }

      // Create income record if income tracking is enabled
      if (data.trackIncome && session.couple.id && data.user2Income && data.user2IncomeFrequency) {
        const amount = parseFloat(data.user2Income)
        if (!isNaN(amount) && amount > 0) {
          await incomeService.createIncome({
            profile_id: session.user.id,
            couple_id: session.couple.id,
            amount,
            frequency: data.user2IncomeFrequency as IncomeFrequency,
            source_name: 'Primary Income',
            is_primary: true
          })
        }
      }

      // Navigate to permission tier selection
      navigate('/onboarding/permission')
    } catch (err: any) {
      console.error('Survey review error:', err)
      setError(err.message || 'Something went wrong. Please try again.')
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="w-full max-w-2xl">
        <CardHeader className="text-center">
          <OnboardingProgress currentStep={1} totalSteps={4} />
          <CardTitle className="text-2xl">Review your partner's answers</CardTitle>
          <CardDescription>
            Your partner completed the initial setup. Review and modify anything if needed.
          </CardDescription>
        </CardHeader>

        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
            {error && (
              <Alert variant="destructive">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {isDirty && (
              <Alert>
                <AlertDescription>
                  You've made changes. Click Continue to save them.
                </AlertDescription>
              </Alert>
            )}

            {/* Question 1: Account Type */}
            <div className="space-y-4">
              <Label className="text-base font-semibold">
                1. How do you manage finances?
              </Label>
              <RadioGroup
                defaultValue={session?.couple?.account_type}
                onValueChange={(value) => setValue('accountType', value as any, { shouldDirty: true })}
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
                defaultValue={session?.couple?.default_split_type}
                onValueChange={(value) => setValue('splitMethod', value as any, { shouldDirty: true })}
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
                  onCheckedChange={(checked) => setValue('trackIncome', checked as boolean, { shouldDirty: true })}
                />
                <Label htmlFor="trackIncome" className="cursor-pointer flex-1">
                  <div className="font-medium">Yes, enable income tracking</div>
                  <div className="text-sm text-muted-foreground">
                    {splitMethod === 'proportional'
                      ? 'Required for proportional splits. Each partner can independently track their own income.'
                      : 'Each partner can independently track their own income for better financial insights'}
                  </div>
                </Label>
              </div>

              {/* Income input fields - show when trackIncome is true */}
              {trackIncome && (
                <div className="ml-4 space-y-4 pt-4 border-l-2 border-primary pl-4">
                  <div className="space-y-3">
                    <Label className="text-sm font-medium">Your income (optional)</Label>
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <Label htmlFor="user2Income" className="text-xs text-muted-foreground">
                          Amount
                        </Label>
                        <Input
                          id="user2Income"
                          type="number"
                          placeholder="0"
                          {...register('user2Income')}
                          className={errors.user2Income ? 'border-destructive' : ''}
                        />
                        {errors.user2Income && (
                          <p className="text-xs text-destructive">{errors.user2Income.message}</p>
                        )}
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="user2IncomeFrequency" className="text-xs text-muted-foreground">
                          Frequency
                        </Label>
                        <Select
                          defaultValue="monthly"
                          onValueChange={(value) => setValue('user2IncomeFrequency', value as any, { shouldDirty: true })}
                        >
                          <SelectTrigger id="user2IncomeFrequency">
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
                    <p className="text-xs text-muted-foreground">
                      💡 You can skip this for now and add it later. Your partner will also be able to independently add their own income in settings.
                    </p>
                  </div>
                </div>
              )}
            </div>

            <div className="flex gap-3">
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate(-1)}
                className="flex-1"
              >
                Back
              </Button>
              <Button type="submit" className="flex-1" disabled={isSubmitting}>
                {isDirty ? 'Save & Continue' : 'Continue'}
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
