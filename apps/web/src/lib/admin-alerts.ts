import { clerkClient } from '@clerk/nextjs/server'
import { db, users, sql } from '@playroom/db'

type AdminAlert = {
  subject: string
  text: string
}

type AdminUserRow = {
  clerkUserId: string
  displayName: string
  adminRole: string
}

const DEFAULT_FROM = 'alerts@theplayroom.pt'

async function getAdminUsers(): Promise<AdminUserRow[]> {
  const rows = await (db as any).execute(sql`
    select clerk_user_id as "clerkUserId", display_name as "displayName", admin_role as "adminRole"
    from users
    where admin_role in ('admin', 'super_admin')
      and deleted_at is null
    order by id asc
  `)

  return rows as AdminUserRow[]
}

async function getAdminEmails() {
  const adminUsers = await getAdminUsers()
  if (adminUsers.length === 0) return []

  const recipients = await Promise.all(
    adminUsers.map(async (adminUser) => {
      try {
        const clerkUser = await clerkClient.users.getUser(adminUser.clerkUserId)
        const primary = clerkUser.emailAddresses.find((mail) => mail.id === clerkUser.primaryEmailAddressId)
        const email = primary?.emailAddress ?? clerkUser.emailAddresses[0]?.emailAddress
        if (!email) return null

        return {
          email,
          displayName: adminUser.displayName,
          adminRole: adminUser.adminRole,
        }
      } catch (error) {
        console.error('[admin-alerts] failed to resolve admin email', {
          clerkUserId: adminUser.clerkUserId,
          error,
        })
        return null
      }
    })
  )

  const dedup = new Map<string, { email: string; displayName: string; adminRole: string }>()
  recipients.forEach((entry) => {
    if (!entry) return
    if (!dedup.has(entry.email)) {
      dedup.set(entry.email, entry)
    }
  })

  return Array.from(dedup.values())
}

async function sendViaResend(to: string[], subject: string, text: string) {
  const apiKey = process.env.RESEND_API_KEY
  if (!apiKey) {
    console.warn('[admin-alerts] RESEND_API_KEY missing, email alert skipped')
    return
  }

  const from = process.env.ADMIN_ALERT_FROM_EMAIL?.trim() || DEFAULT_FROM

  const response = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from,
      to,
      subject,
      text,
    }),
  })

  if (!response.ok) {
    const body = await response.text()
    console.error('[admin-alerts] resend API error', {
      status: response.status,
      body,
    })
  }
}

export async function notifyAllAdminsByEmail(alert: AdminAlert) {
  try {
    const recipients = await getAdminEmails()
    if (recipients.length === 0) {
      console.warn('[admin-alerts] no admin recipients found')
      return
    }

    await sendViaResend(
      recipients.map((recipient) => recipient.email),
      alert.subject,
      alert.text
    )
  } catch (error) {
    console.error('[admin-alerts] failed to dispatch admin alert', error)
  }
}
