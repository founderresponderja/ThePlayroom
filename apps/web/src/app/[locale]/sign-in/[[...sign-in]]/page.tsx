import { SignIn } from '@clerk/nextjs'

interface SignInPageProps {
  params: { locale: string }
}

export default function SignInPage({ params }: SignInPageProps) {
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
