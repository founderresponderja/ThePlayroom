import { SignUp } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentUserByClerkId } from '@/lib/current-user'

interface SignUpPageProps {
  params: { locale: string }
}

export default async function SignUpPage({ params }: SignUpPageProps) {
  const { userId } = await auth()
  if (userId) {
    const user = await getCurrentUserByClerkId(userId)
    redirect(user?.onboardingComplete ? `/${params.locale}/matches` : `/${params.locale}/onboarding`)
  }

  return (
    <SignUp
      routing="path"
      path={`/${params.locale}/sign-up`}
      signInUrl={`/${params.locale}/sign-in`}
      forceRedirectUrl={`/${params.locale}/onboarding`}
      fallbackRedirectUrl={`/${params.locale}/onboarding`}
    />
  )
}
