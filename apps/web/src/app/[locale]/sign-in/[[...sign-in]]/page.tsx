import { SignIn } from '@clerk/nextjs'
import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import { getCurrentUserByClerkId } from '@/lib/current-user'

interface SignInPageProps {
  params: { locale: string }
}

export default async function SignInPage({ params }: SignInPageProps) {
  const { userId } = await auth()
  if (userId) {
    const user = await getCurrentUserByClerkId(userId)
    redirect(user?.onboardingComplete ? `/${params.locale}/matches` : `/${params.locale}/onboarding`)
  }

  return (
    <SignIn
      routing="path"
      path={`/${params.locale}/sign-in`}
      signUpUrl={`/${params.locale}/sign-up`}
      forceRedirectUrl={`/${params.locale}/matches`}
      fallbackRedirectUrl={`/${params.locale}/matches`}
    />
  )
}
