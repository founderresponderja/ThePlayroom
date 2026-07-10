import { clerkClient } from '@clerk/nextjs/server'
import { NextRequest, NextResponse } from 'next/server'
import { accountTypeEnum, db, eq, users } from '@playroom/db'
import { z } from 'zod'
import { getValidClerkSession } from '@/lib/auth'
import { ensureCurrentUserByClerkId } from '@/lib/current-user'

const onboardingPayloadSchema = z.object({
  accountType: z.enum(accountTypeEnum.enumValues).optional(),
  displayName: z.string().trim().min(1).max(100).optional(),
  dateOfBirth: z
    .string()
    .datetime({ offset: true })
    .transform((value: string) => new Date(value))
    .optional(),
  ageVerifiedAt: z
    .string()
    .datetime({ offset: true })
    .transform((value: string) => new Date(value))
    .optional(),
  onboardingComplete: z.boolean().optional(),
}).refine((payload) => Object.keys(payload).length > 0, {
  message: 'At least one field is required',
})

function formatZodError(error: z.ZodError) {
  return error.issues.map((issue: z.ZodIssue) => ({
    path: issue.path.join('.'),
    message: issue.message,
  }))
}

export async function GET(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  try {
    const user = await ensureCurrentUserByClerkId(userId)

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error fetching user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}

export async function PATCH(req: NextRequest) {
  const { userId } = await getValidClerkSession(req)
  if (!userId) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  let payload: z.infer<typeof onboardingPayloadSchema>

  try {
    const body = await req.json()
    const parsed = onboardingPayloadSchema.safeParse(body)

    if (!parsed.success) {
      return NextResponse.json(
        {
          error: 'Invalid request payload',
          details: formatZodError(parsed.error),
        },
        { status: 400 },
      )
    }

    payload = parsed.data
  } catch (error) {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 })
  }

  try {
    const updatedAt = new Date().toISOString()
    const currentUser = await ensureCurrentUserByClerkId(userId, {
      accountType: payload.accountType,
      displayName: payload.displayName,
    })
    if (!currentUser) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    const updates: Record<string, unknown> = { updatedAt }

    if (payload.accountType) updates.accountType = payload.accountType
    if (payload.displayName) updates.displayName = payload.displayName
    if (payload.dateOfBirth !== undefined) updates.dateOfBirth = payload.dateOfBirth
    if (payload.ageVerifiedAt) updates.ageVerifiedAt = payload.ageVerifiedAt
    if (typeof payload.onboardingComplete === 'boolean') updates.onboardingComplete = payload.onboardingComplete

    const updatedUsers = await db
      .update(users)
      .set(updates)
      .where(eq(users.id, currentUser.id))
      .returning({
        id: users.id,
        clerkUserId: users.clerkUserId,
        accountType: users.accountType,
        displayName: users.displayName,
        dateOfBirth: users.dateOfBirth,
        ageVerifiedAt: users.ageVerifiedAt,
        verificationLevel: users.verificationLevel,
        onboardingComplete: users.onboardingComplete,
        subscriptionTier: users.subscriptionTier,
        isVip: users.isVip,
        createdAt: users.createdAt,
        updatedAt: users.updatedAt,
        deletedAt: users.deletedAt,
        deletedBy: users.deletedBy,
      })

    const user = updatedUsers[0]

    if (!user) return NextResponse.json({ error: 'User not found' }, { status: 404 })

    if (payload.accountType || typeof payload.onboardingComplete === 'boolean') {
      await clerkClient.users.updateUserMetadata(userId, {
        publicMetadata: {
          ...(payload.accountType ? { accountType: payload.accountType } : {}),
          ...(typeof payload.onboardingComplete === 'boolean' ? { onboardingComplete: payload.onboardingComplete } : {}),
        },
      })
    }

    return NextResponse.json(user)
  } catch (error) {
    console.error('Error updating user:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}
