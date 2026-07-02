import { auth } from '@clerk/nextjs/server'
import { redirect } from 'next/navigation'
import KinkTest from './KinkTest'

export default async function KinkTestPage({
  params,
}: {
  params: { locale: string }
}) {
  const { userId } = await auth()
  if (!userId) redirect(`/${params.locale}/sign-in`)

  return <KinkTest />
}
