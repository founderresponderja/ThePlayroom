'use client'
import { useState } from 'react'
import { useParams, useRouter } from 'next/navigation'

type AccountType = 'FEMALE_SINGLE' | 'MALE_SINGLE' | 'COUPLE_MF' | 'COUPLE_MM' | 'COUPLE_FF' | 'SWING_CLUB' | 'SEX_SHOP'

const ACCOUNT_TYPES: Array<{ type: AccountType; emoji: string; title: string; description: string }> = [
  { type: 'FEMALE_SINGLE', emoji: '👩', title: 'Single Feminina', description: 'Explora o lifestyle ao teu ritmo' },
  { type: 'MALE_SINGLE', emoji: '👨', title: 'Single Masculino', description: 'Conecta com singles e casais' },
  { type: 'COUPLE_MF', emoji: '👫', title: 'Casal MF', description: 'Exploração a dois, perfis individuais' },
  { type: 'COUPLE_MM', emoji: '👬', title: 'Casal MM', description: 'Exploração a dois, perfis individuais' },
  { type: 'COUPLE_FF', emoji: '👭', title: 'Casal FF', description: 'Exploração a dois, perfis individuais' },
  { type: 'SWING_CLUB', emoji: '🏛️', title: 'Swing Club', description: 'Gere eventos e a tua comunidade' },
  { type: 'SEX_SHOP', emoji: '🛍️', title: 'Sex Shop', description: 'Vende produtos à comunidade' },
]

export default function OnboardingWizard() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [step, setStep] = useState(1)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [partner2Name, setPartner2Name] = useState('')
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null)
  const [error, setError] = useState('')

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
  }

  const handleNextStep = async () => {
    setError('')
    if (step === 1 && !accountType) {
      setError('Por favor seleciona um tipo de conta')
      return
    }
    if (step === 2 && !dateOfBirth) {
      setError('Por favor seleciona a data de nascimento')
      return
    }
    if (step === 2 && dateOfBirth) {
      const age = new Date().getFullYear() - dateOfBirth.getFullYear()
      if (age < 18) {
        setError('Tens de ter pelo menos 18 anos para aceder ao The Playroom.')
        return
      }
    }
    if (step === 3 && !displayName.trim()) {
      setError('Por favor preenche o teu nome')
      return
    }
    if (step === 3 && accountType?.startsWith('COUPLE') && !partner2Name.trim()) {
      setError('Por favor preenche o nome do teu parceiro')
      return
    }

    if (step < 4) {
      setStep(step + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleLocationPermission = async (allowed: boolean) => {
    if (allowed) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const lat = Math.round(position.coords.latitude * 100) / 100
          const lng = Math.round(position.coords.longitude * 100) / 100
          setLocation({ lat, lng })
          setLoading(false)
          handleNextStep()
        },
        () => {
          setError('Não conseguimos aceder à tua localização')
          setLoading(false)
        }
      )
    } else {
      handleNextStep()
    }
  }

  const completeOnboarding = async () => {
    setLoading(true)
    try {
      const finalName =
        accountType?.startsWith('COUPLE') && partner2Name
          ? `${displayName} & ${partner2Name}`
          : displayName

      const updates: Record<string, any> = {
        accountType,
        displayName: finalName,
        ageVerifiedAt: new Date(),
        onboardingComplete: true,
      }

      if (dateOfBirth) {
        updates.dateOfBirth = dateOfBirth
      }

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error('Failed to update user')

      // Redirect to next step
      if (accountType?.startsWith('COUPLE') || accountType === 'FEMALE_SINGLE' || accountType === 'MALE_SINGLE') {
        router.push(`/${locale}/kink-test`)
      } else if (accountType === 'SWING_CLUB') {
        router.push(`/${locale}/club-setup`)
      } else if (accountType === 'SEX_SHOP') {
        router.push(`/${locale}/shop-setup`)
      }
    } catch (err) {
      setError('Erro ao guardar dados. Tenta novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const progressPercent = (step / 4) * 100

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', overflow: 'hidden' }}>
      {/* Progress bar */}
      <div
        style={{
          height: '3px',
          background: 'var(--primary)',
          width: `${progressPercent}%`,
          transition: 'width 0.3s ease',
        }}
      />

      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
        {/* Step 1: Account Type */}
        {step === 1 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>O teu tipo de conta</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Escolhe como queres participar no lifestyle
            </p>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
                gap: '1rem',
                marginBottom: '2rem',
              }}
            >
              {ACCOUNT_TYPES.map((type) => (
                <button
                  key={type.type}
                  onClick={() => handleAccountTypeSelect(type.type)}
                  style={{
                    padding: '1.5rem',
                    border: accountType === type.type ? '2px solid var(--primary)' : '1px solid var(--border)',
                    background: accountType === type.type ? 'var(--surface)' : 'var(--surface)',
                    borderRadius: '8px',
                    cursor: 'pointer',
                    textAlign: 'center',
                    transition: 'all 0.2s ease',
                  }}
                >
                  <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>{type.emoji}</div>
                  <div style={{ color: 'var(--text)', fontWeight: 'bold', fontSize: '0.9rem', marginBottom: '0.5rem' }}>
                    {type.title}
                  </div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>{type.description}</div>
                </button>
              ))}
            </div>

            {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Step 2: Date of Birth */}
        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Data de nascimento</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Tens de ter pelo menos 18 anos</p>

            <div style={{ marginBottom: '2rem' }}>
              <input
                type="date"
                value={dateOfBirth ? dateOfBirth.toISOString().split('T')[0] : ''}
                onChange={(e) => setDateOfBirth(e.target.value ? new Date(e.target.value) : null)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '200px',
                }}
              />
            </div>

            {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Step 3: Display Name */}
        {step === 3 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Como te queres chamar?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>Este é o teu nome visível no perfil</p>

            <div style={{ marginBottom: '2rem' }}>
              <input
                type="text"
                placeholder="O teu nome"
                maxLength={30}
                value={displayName}
                onChange={(e) => setDisplayName(e.target.value)}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  width: '100%',
                  marginBottom: '1rem',
                }}
              />

              {accountType?.startsWith('COUPLE') && (
                <input
                  type="text"
                  placeholder="Nome do teu parceiro"
                  maxLength={30}
                  value={partner2Name}
                  onChange={(e) => setPartner2Name(e.target.value)}
                  style={{
                    padding: '0.75rem',
                    border: '1px solid var(--border)',
                    borderRadius: '4px',
                    background: 'var(--surface)',
                    color: 'var(--text)',
                    fontSize: '1rem',
                    width: '100%',
                  }}
                />
              )}
            </div>

            {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Step 4: Location */}
        {step === 4 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>A tua localização</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Para te mostrarmos pessoas perto de ti, precisamos da tua localização aproximada.
            </p>

            <div style={{ display: 'flex', gap: '1rem' }}>
              <button
                onClick={() => handleLocationPermission(true)}
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'var(--primary)',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer',
                  opacity: loading ? 0.6 : 1,
                }}
              >
                {loading ? 'A processar...' : 'Permitir localização'}
              </button>
              <button
                onClick={() => handleLocationPermission(false)}
                style={{
                  padding: '0.75rem 1.5rem',
                  background: 'transparent',
                  color: 'var(--text)',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  cursor: 'pointer',
                }}
              >
                Mais tarde
              </button>
            </div>

            {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Navigation buttons */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem', justifyContent: 'flex-end' }}>
          {step > 1 && (
            <button
              onClick={() => setStep(step - 1)}
              style={{
                padding: '0.75rem 1.5rem',
                background: 'transparent',
                color: 'var(--text)',
                border: '1px solid var(--border)',
                borderRadius: '4px',
                cursor: 'pointer',
              }}
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => handleNextStep()}
            disabled={loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.6 : 1,
            }}
          >
            {loading ? 'A processar...' : step === 4 ? 'Terminar' : 'Seguinte'}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
          }
          to {
            opacity: 1;
          }
        }
      `}</style>
    </div>
  )
}
