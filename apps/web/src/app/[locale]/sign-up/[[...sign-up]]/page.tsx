import { SignUp } from '@clerk/nextjs'

interface SignUpPageProps {
  params: { locale: string }
}

export default function SignUpPage({ params }: SignUpPageProps) {
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
