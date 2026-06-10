'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { archetypes } from '@/data/kink-test-questions'

type Photo = { id: number; url: string; isPrivate: boolean; isPrimary: boolean }

// verificationLevel and isVip are notNull in schema but we accept | null
// so any Drizzle user object is assignable here
type User = {
  displayName: string | null
  accountType: string | null
  verificationLevel: string | null
  isVip: boolean | null
}

// interests is jsonb (unknown) and not rendered here — omit it to avoid type friction
type Profile = { bio?: string | null } | null

const ACCOUNT_TYPE_LABELS: Record<string, string> = {
  FEMALE_SINGLE: '👩 Single Feminina',
  MALE_SINGLE:   '👨 Single Masculino',
  COUPLE_MF:     '👫 Casal MF',
  COUPLE_MM:     '👬 Casal MM',
  COUPLE_FF:     '👭 Casal FF',
  SWING_CLUB:    '🏛️ Swing Club',
  SEX_SHOP:      '🛍️ Sex Shop',
}

const VERIFICATION_BADGES: Record<string, string> = {
  none:   '',
  photo:  '✅',
  video:  '🎥',
  social: '🔗',
}

export default function ProfileView({
  user,
  photos,
  profile,
  archetype,
  derivedTags,
}: {
  user: User
  photos: Photo[]
  profile: Profile
  archetype: string | null
  derivedTags: string[]
}) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [photoIndex, setPhotoIndex] = useState(0)
  const publicPhotos = photos.filter(p => !p.isPrivate)
  const currentPhoto = publicPhotos[photoIndex]
  const archetypeData = archetype ? archetypes[archetype] : undefined
  const publicTags = derivedTags.filter(t => !t.startsWith('curious:')).slice(0, 6)

  const total = Math.max(publicPhotos.length, 1)
  const nextPhoto = () => setPhotoIndex(i => (i + 1) % total)
  const prevPhoto = () => setPhotoIndex(i => (i - 1 + total) % total)

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)' }}>

      {/* ── Photo stack ── */}
      <div style={{
        position: 'relative', width: '100%', maxWidth: '480px',
        margin: '0 auto', aspectRatio: '3/4', background: 'var(--surface)',
      }}>
        {currentPhoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={currentPhoto.url}
            alt="Profile"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '4rem' }}>
            🍍
          </div>
        )}

        {/* Navigation arrows + dot indicators */}
        {publicPhotos.length > 1 && (
          <>
            <button onClick={prevPhoto} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>‹</button>
            <button onClick={nextPhoto} style={{ position: 'absolute', right: '1rem', top: '50%', transform: 'translateY(-50%)', background: 'rgba(0,0,0,0.5)', border: 'none', borderRadius: '50%', width: '40px', height: '40px', color: 'white', cursor: 'pointer', fontSize: '1.2rem' }}>›</button>
            <div style={{ position: 'absolute', top: '0.75rem', left: '50%', transform: 'translateX(-50%)', display: 'flex', gap: '4px' }}>
              {publicPhotos.map((_, i) => (
                <div key={i} style={{ width: '6px', height: '6px', borderRadius: '50%', background: i === photoIndex ? 'white' : 'rgba(255,255,255,0.4)' }} />
              ))}
            </div>
          </>
        )}

        {/* Gradient overlay */}
        <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: '40%', background: 'linear-gradient(to top, rgba(11,7,8,0.95), transparent)' }} />

        {/* Name + badges */}
        <div style={{ position: 'absolute', bottom: '1rem', left: '1rem', right: '1rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <h1 style={{ color: 'white', fontSize: '1.5rem', fontWeight: 700 }}>{user.displayName ?? 'Anónimo'}</h1>
            {user.verificationLevel && user.verificationLevel !== 'none' && (
              <span title={`Verificado: ${user.verificationLevel}`}>
                {VERIFICATION_BADGES[user.verificationLevel]}
              </span>
            )}
            {user.isVip && (
              <span style={{ background: 'var(--primary)', color: 'white', fontSize: '0.65rem', padding: '2px 8px', borderRadius: '999px', fontWeight: 600 }}>VIP</span>
            )}
          </div>
          <p style={{ color: 'rgba(255,255,255,0.8)', fontSize: '0.85rem' }}>
            {user.accountType ? ACCOUNT_TYPE_LABELS[user.accountType] : ''}
          </p>
        </div>

        {/* Edit button */}
        <button
          onClick={() => router.push(`/${locale}/profile/edit`)}
          style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.6)', border: '1px solid rgba(255,255,255,0.3)', borderRadius: '0.5rem', color: 'white', padding: '0.4rem 0.75rem', cursor: 'pointer', fontSize: '0.8rem' }}
        >
          ✏️ Editar
        </button>
      </div>

      {/* ── Profile info ── */}
      <div style={{ maxWidth: '480px', margin: '0 auto', padding: '1.5rem' }}>

        {/* Bio */}
        {profile?.bio && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Sobre mim</h2>
            <p style={{ color: 'var(--text)', fontSize: '0.95rem', lineHeight: 1.6 }}>{profile.bio}</p>
          </section>
        )}

        {/* Archetype */}
        {archetypeData && (
          <section style={{ marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem' }}>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.5rem' }}>Arquétipo</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <span style={{ fontSize: '1.75rem' }}>{archetypeData.emoji}</span>
              <div>
                <p style={{ color: 'var(--text)', fontWeight: 600 }}>{archetypeData.title}</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{archetypeData.description}</p>
              </div>
            </div>
          </section>
        )}

        {/* Public kink tags */}
        {publicTags.length > 0 && (
          <section style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.75rem' }}>Interesses</h2>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              {publicTags.map(tag => (
                <span key={tag} style={{ background: 'var(--surface)', border: '1px solid var(--border)', color: 'var(--text-muted)', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                  {tag}
                </span>
              ))}
            </div>
          </section>
        )}

        {/* Private photos count */}
        {photos.some(p => p.isPrivate) && (
          <section style={{ marginBottom: '1.5rem', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '0.75rem', padding: '1rem', textAlign: 'center' }}>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>🔒 {photos.filter(p => p.isPrivate).length} foto(s) privada(s)</p>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>Só visíveis para quem autorizares</p>
          </section>
        )}

        {/* CTAs */}
        {!profile?.bio && (
          <button onClick={() => router.push(`/${locale}/profile/edit`)} className="btn-outline" style={{ width: '100%', padding: '0.875rem', marginBottom: '1rem' }}>
            ✏️ Completa o teu perfil
          </button>
        )}
        {!archetype && (
          <button onClick={() => router.push(`/${locale}/kink-test`)} className="btn-primary" style={{ width: '100%', padding: '0.875rem' }}>
            🍍 Fazer o Kink Test
          </button>
        )}
      </div>
    </div>
  )
}
