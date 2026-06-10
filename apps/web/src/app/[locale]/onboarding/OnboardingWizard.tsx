'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'

type AccountType =
  | 'FEMALE_SINGLE'
  | 'MALE_SINGLE'
  | 'COUPLE_MF'
  | 'COUPLE_MM'
  | 'COUPLE_FF'
  | 'SWING_CLUB'
  | 'SEX_SHOP'

const ACCOUNT_TYPES: { value: AccountType; emoji: string; title: string; desc: string }[] = [
  { value: 'FEMALE_SINGLE', emoji: '👩', title: 'Single Feminina',   desc: 'Explora o lifestyle ao teu ritmo' },
  { value: 'MALE_SINGLE',   emoji: '👨', title: 'Single Masculino',  desc: 'Conecta com singles e casais' },
  { value: 'COUPLE_MF',     emoji: '👫', title: 'Casal MF',          desc: 'Exploração a dois, perfis individuais' },
  { value: 'COUPLE_MM',     emoji: '👬', title: 'Casal MM',          desc: 'Exploração a dois, perfis individuais' },
  { value: 'COUPLE_FF',     emoji: '👭', title: 'Casal FF',          desc: 'Exploração a dois, perfis individuais' },
  { value: 'SWING_CLUB',    emoji: '🏛️', title: 'Swing Club',        desc: 'Gere eventos e a tua comunidade' },
  { value: 'SEX_SHOP',      emoji: '🛍️', title: 'Sex Shop',          desc: 'Vende produtos à comunidade' },
]

export default function OnboardingWizard() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const TOTAL_STEPS = 4
  const [step, setStep]               = useState(1)
  const [loading, setLoading]         = useState(false)
  const [error, setError]             = useState('')

  // Step 1
  const [accountType, setAccountType] = useState<AccountType | null>(null)

  // Step 2
  const [day, setDay]     = useState('')
  const [month, setMonth] = useState('')
  const [year, setYear]   = useState('')

  // Step 3
  const [name1, setName1] = useState('')
  const [name2, setName2] = useState('')

  const isCouple   = accountType?.startsWith('COUPLE_') ?? false
  const isBusiness = accountType === 'SWING_CLUB' || accountType === 'SEX_SHOP'

  // ── helpers ──────────────────────────────────────────────────────────────

  const patch = async (data: Record<string, unknown>) => {
    const res = await fetch('/api/users/me', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    })
    if (!res.ok) throw new Error('Failed to save')
  }

  const handleNext = async () => {
    setError('')
    setLoading(true)
    try {
      if (step === 1) {
        if (!accountType) { setError('Escolhe um tipo de conta'); setLoading(false); return }
        await patch({ accountType })
        setStep(2)

      } else if (step === 2) {
        if (!day || !month || !year) { setError('Preenche a data de nascimento'); setLoading(false); return }
        const dob = new Date(Number(year), Number(month) - 1, Number(day))
        const age = Math.floor((Date.now() - dob.getTime()) / (365.25 * 24 * 60 * 60 * 1000))
        if (age < 18) { setError('Tens de ter pelo menos 18 anos para aceder ao The Playroom.'); setLoading(false); return }
        await patch({ dateOfBirth: dob.toISOString(), ageVerifiedAt: new Date().toISOString() })
        setStep(3)

      } else if (step === 3) {
        if (!name1) { setError('Indica o teu nome'); setLoading(false); return }
        const displayName = isCouple && name2 ? `${name1} & ${name2}` : name1
        await patch({ displayName })
        setStep(4)

      } else if (step === 4) {
        await patch({ onboardingComplete: true })
        if (isBusiness) {
          router.push(`/${locale}/${accountType === 'SWING_CLUB' ? 'club-setup' : 'shop-setup'}`)
        } else {
          router.push(`/${locale}/kink-test`)
        }
      }
    } catch {
      setError('Ocorreu um erro. Tenta novamente.')
    }
    setLoading(false)
  }

  const handleLocation = () => {
    if (!navigator.geolocation) { void handleNext(); return }
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const approxLat = Math.round(pos.coords.latitude  * 100) / 100
        const approxLng = Math.round(pos.coords.longitude * 100) / 100
        fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ approxLat, approxLng }),
        }).then(() => void handleNext()).catch(() => void handleNext())
      },
      () => void handleNext(),
    )
  }

  const progressPct = ((step - 1) / TOTAL_STEPS) * 100

  // ── render ────────────────────────────────────────────────────────────────

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--bg)',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1.5rem',
    }}>

      {/* ── Progress bar ── */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'var(--border)', zIndex: 50 }}>
        <div style={{
          height: '100%',
          width: `${progressPct}%`,
          background: 'var(--primary)',
          transition: 'width 0.3s ease',
        }} />
      </div>

      <div style={{ width: '100%', maxWidth: '600px' }}>

        {/* ── Header ── */}
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🍍</div>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
            Passo {step} de {TOTAL_STEPS}
          </p>
        </div>

        {/* ── Step 1 — Account type ── */}
        {step === 1 && (
          <div>
            <h2 style={{ color: 'var(--text)', textAlign: 'center', marginBottom: '1.5rem', fontSize: '1.5rem' }}>
              Como te defines?
            </h2>
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))',
              gap: '1rem',
            }}>
              {ACCOUNT_TYPES.map(t => (
                <button
                  key={t.value}
                  onClick={() => setAccountType(t.value)}
                  style={{
                    background: 'var(--surface)',
                    border: `2px solid ${accountType === t.value ? 'var(--primary)' : 'var(--border)'}`,
                    borderRadius: '0.75rem',
                    padding: '1.25rem 1rem',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'border-color 0.2s',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{t.emoji}</div>
                  <div style={{ color: 'var(--text)', fontWeight: 600, fontSize: '0.9rem' }}>{t.title}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginTop: '0.25rem' }}>{t.desc}</div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 2 — Date of birth ── */}
        {step === 2 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              Qual é a tua data de nascimento?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Tens de ter 18 anos ou mais.
            </p>
            <div style={{ display: 'flex', gap: '1rem', justifyContent: 'center' }}>
              {([
                { label: 'Dia',  value: day,   set: setDay,   placeholder: 'DD',   min: 1,    max: 31   },
                { label: 'Mês',  value: month, set: setMonth, placeholder: 'MM',   min: 1,    max: 12   },
                { label: 'Ano',  value: year,  set: setYear,  placeholder: 'AAAA', min: 1900, max: 2099 },
              ] as const).map(f => (
                <div key={f.label} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{f.label}</label>
                  <input
                    type="number"
                    placeholder={f.placeholder}
                    value={f.value}
                    onChange={e => f.set(e.target.value)}
                    min={f.min}
                    max={f.max}
                    style={{
                      background: 'var(--surface)',
                      border: '1px solid var(--border)',
                      borderRadius: '0.5rem',
                      padding: '0.75rem',
                      color: 'var(--text)',
                      width: f.label === 'Ano' ? '100px' : '70px',
                      textAlign: 'center',
                      fontSize: '1rem',
                    }}
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ── Step 3 — Display name ── */}
        {step === 3 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>
              Como te queres chamar?
            </h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem', fontSize: '0.9rem' }}>
              Este é o nome que os outros vão ver.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px', margin: '0 auto' }}>
              <input
                type="text"
                placeholder={isCouple ? 'Nome do parceiro 1' : 'O teu nome'}
                value={name1}
                onChange={e => setName1(e.target.value)}
                maxLength={30}
                style={{
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '0.5rem',
                  padding: '0.875rem 1rem',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  width: '100%',
                }}
              />
              {isCouple && (
                <input
                  type="text"
                  placeholder="Nome do parceiro 2"
                  value={name2}
                  onChange={e => setName2(e.target.value)}
                  maxLength={30}
                  style={{
                    background: 'var(--surface)',
                    border: '1px solid var(--border)',
                    borderRadius: '0.5rem',
                    padding: '0.875rem 1rem',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    width: '100%',
                  }}
                />
              )}
              {isCouple && name1 && name2 && (
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Vai aparecer como:{' '}
                  <strong style={{ color: 'var(--text)' }}>{name1} & {name2}</strong>
                </p>
              )}
            </div>
          </div>
        )}

        {/* ── Step 4 — Location ── */}
        {step === 4 && (
          <div style={{ textAlign: 'center' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem', fontSize: '1.5rem' }}>📍 Localização</h2>
            <p style={{
              color: 'var(--text-muted)',
              marginBottom: '2rem',
              fontSize: '0.9rem',
              maxWidth: '400px',
              margin: '0 auto 2rem',
            }}>
              Para te mostrarmos pessoas perto de ti, precisamos da tua localização aproximada.
              Nunca partilhamos a localização exacta.
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', maxWidth: '320px', margin: '0 auto' }}>
              <button
                onClick={handleLocation}
                className="btn-primary"
                style={{ padding: '0.875rem', fontSize: '1rem' }}
              >
                Permitir localização
              </button>
              <button
                onClick={() => void handleNext()}
                className="btn-outline"
                style={{ padding: '0.875rem', fontSize: '1rem' }}
              >
                Mais tarde
              </button>
            </div>
          </div>
        )}

        {/* ── Error ── */}
        {error && (
          <p style={{ color: 'var(--primary)', textAlign: 'center', marginTop: '1rem', fontSize: '0.9rem' }}>
            {error}
          </p>
        )}

        {/* ── Navigation (steps 1-3) ── */}
        {step < 4 && (
          <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem', gap: '1rem' }}>
            {step > 1 ? (
              <button
                onClick={() => setStep(s => s - 1)}
                className="btn-outline"
                style={{ flex: 1, padding: '0.875rem' }}
              >
                Voltar
              </button>
            ) : (
              <div style={{ flex: 1 }} />
            )}
            <button
              onClick={() => void handleNext()}
              disabled={loading}
              className="btn-primary"
              style={{ flex: 2, padding: '0.875rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? 'A guardar…' : step === 3 ? 'Continuar' : 'Seguinte'}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
