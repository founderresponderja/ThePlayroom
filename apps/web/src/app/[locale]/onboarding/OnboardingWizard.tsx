'use client'
import { useEffect, useMemo, useState } from 'react'
import type { Dispatch, SetStateAction } from 'react'
import { useParams, useRouter } from 'next/navigation'
import {
  isCoupleAccount,
  isDatingAccount,
  isSingleAccount,
  LOOKING_FOR_OPTIONS,
  ORIENTATION_OPTIONS,
  type LookingForOption,
  type SexualOrientationOption,
} from '@/lib/relationship-preferences'

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

  const [stepIndex, setStepIndex] = useState(0)
  const [loading, setLoading] = useState(false)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [quizStatus, setQuizStatus] = useState<{ completed: boolean; accountTypeAtTime: string | null } | null>(null)
  const [dateOfBirth, setDateOfBirth] = useState<Date | null>(null)
  const [displayName, setDisplayName] = useState('')
  const [partner2Name, setPartner2Name] = useState('')
  const [city, setCity] = useState('')
  const [singleOrientation, setSingleOrientation] = useState<SexualOrientationOption | ''>('')
  const [singleLookingFor, setSingleLookingFor] = useState<LookingForOption[]>([])
  const [member1Orientation, setMember1Orientation] = useState<SexualOrientationOption | ''>('')
  const [member2Orientation, setMember2Orientation] = useState<SexualOrientationOption | ''>('')
  const [member1LookingFor, setMember1LookingFor] = useState<LookingForOption[]>([])
  const [member2LookingFor, setMember2LookingFor] = useState<LookingForOption[]>([])
  const [error, setError] = useState('')

  useEffect(() => {
    const bootstrap = async () => {
      try {
        const [userRes, quizRes] = await Promise.all([fetch('/api/users/me'), fetch('/api/quiz')])
        if (userRes.ok) {
          const user = await userRes.json()
          if (user?.accountType) setAccountType(user.accountType)
        }
        if (quizRes.ok) {
          const quiz = await quizRes.json()
          setQuizStatus({ completed: Boolean(quiz?.completed), accountTypeAtTime: quiz?.accountTypeAtTime ?? null })
        }
      } catch {
        // Keep onboarding usable even if bootstrap fails.
      }
    }
    void bootstrap()
  }, [])

  const flow = useMemo(() => {
    if (isDatingAccount(accountType)) return ['account', 'preferences', 'dob', 'name', 'location'] as const
    return ['account', 'dob', 'name', 'location'] as const
  }, [accountType])

  const currentStep = flow[stepIndex]
  const progressPercent = ((stepIndex + 1) / flow.length) * 100

  const needsKinkTest =
    isDatingAccount(accountType) && (!quizStatus?.completed || quizStatus?.accountTypeAtTime !== accountType)

  const handleAccountTypeSelect = (type: AccountType) => {
    setAccountType(type)
  }

  const toggleLookingFor = (
    value: LookingForOption,
    setter: Dispatch<SetStateAction<LookingForOption[]>>,
  ) => {
    setter((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]))
  }

  const goNext = async () => {
    setError('')
    if (currentStep === 'account' && !accountType) {
      setError('Por favor seleciona um tipo de conta')
      return
    }

    if (currentStep === 'account' && isDatingAccount(accountType) && needsKinkTest) {
      const selectedAccountType = accountType as AccountType
      try {
        await fetch('/api/users/me', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ accountType: selectedAccountType }),
        })
      } catch {
        // Ignore PATCH errors here and still allow redirect to kink test.
      }
      router.push(`/${locale}/kink-test?fromOnboarding=1&accountType=${encodeURIComponent(selectedAccountType)}`)
      return
    }

    if (currentStep === 'preferences' && isSingleAccount(accountType)) {
      if (!singleOrientation) {
        setError('Seleciona a tua orientação sexual')
        return
      }
      if (singleLookingFor.length === 0) {
        setError('Seleciona pelo menos uma opção do que procuras')
        return
      }
    }

    if (currentStep === 'preferences' && isCoupleAccount(accountType)) {
      if (!member1Orientation || !member2Orientation) {
        setError('Seleciona a orientação de ambos os membros do casal')
        return
      }
      if (member1LookingFor.length === 0 || member2LookingFor.length === 0) {
        setError('Cada membro deve selecionar pelo menos uma opção do que procura')
        return
      }
    }

    if (currentStep === 'dob' && !dateOfBirth) {
      setError('Por favor seleciona a data de nascimento')
      return
    }
    if (currentStep === 'dob' && dateOfBirth) {
      const age = new Date().getFullYear() - dateOfBirth.getFullYear()
      if (age < 18) {
        setError('Tens de ter pelo menos 18 anos para aceder ao The Playroom.')
        return
      }
    }
    if (currentStep === 'name' && !displayName.trim()) {
      setError('Por favor preenche o teu nome')
      return
    }
    if (currentStep === 'name' && accountType?.startsWith('COUPLE') && !partner2Name.trim()) {
      setError('Por favor preenche o nome do teu parceiro')
      return
    }

    if (stepIndex < flow.length - 1) {
      setStepIndex(stepIndex + 1)
    } else {
      await completeOnboarding()
    }
  }

  const handleLocationPermission = async (allowed: boolean) => {
    if (allowed) {
      setLoading(true)
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLoading(false)
          goNext()
        },
        () => {
          setLoading(false)
          goNext()
        }
      )
    } else {
      goNext()
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
        updates.dateOfBirth = dateOfBirth.toISOString()
      }

      const res = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updates),
      })

      if (!res.ok) throw new Error('Failed to update user')

      const trimmedCity = city.trim()
      const preferences: Record<string, unknown> = {}
      if (isSingleAccount(accountType)) {
        preferences.matchPreferences = {
          orientation: singleOrientation,
          lookingFor: singleLookingFor,
        }
      }

      if (isCoupleAccount(accountType)) {
        preferences.matchPreferences = {
          members: {
            member1: {
              orientation: member1Orientation,
              lookingFor: member1LookingFor,
            },
            member2: {
              orientation: member2Orientation,
              lookingFor: member2LookingFor,
            },
          },
        }
      }

      if (trimmedCity || Object.keys(preferences).length > 0) {
        const profileRes = await fetch('/api/profile', {
          method: 'PATCH',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            approxLocation: trimmedCity ? { city: trimmedCity } : undefined,
            preferences,
          }),
        })

        if (!profileRes.ok) throw new Error('Failed to update location')
      }

      // Redirect to next step
      if ((accountType?.startsWith('COUPLE') || accountType === 'FEMALE_SINGLE' || accountType === 'MALE_SINGLE') && needsKinkTest) {
        const selectedAccountType = accountType as AccountType
        router.push(`/${locale}/kink-test?fromOnboarding=1&accountType=${encodeURIComponent(selectedAccountType)}`)
      } else if (accountType === 'SWING_CLUB') {
        router.push(`/${locale}/club-setup`)
      } else if (accountType === 'SEX_SHOP') {
        router.push(`/${locale}/shop-setup`)
      } else {
        router.push(`/${locale}/dashboard`)
      }
    } catch (err) {
      setError('Erro ao guardar dados. Tenta novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

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
        {currentStep === 'account' && (
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

            {isDatingAccount(accountType) && (
              <div style={{ marginTop: '1rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.25rem' }}>🧪 Kinky Test no início</p>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>
                  Singles e casais fazem o Kinky Test antes de concluir onboarding. Em casais, cada membro responde individualmente.
                </p>
              </div>
            )}
          </div>
        )}

        {/* Step 2: Preferences for singles/couples */}
        {currentStep === 'preferences' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>O que procuras?</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>Escolha múltipla para os teus matches preferidos</p>

            {isSingleAccount(accountType) && (
              <>
                <div style={{ marginBottom: '1rem' }}>
                  <p style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>Orientação sexual</p>
                  <select
                    value={singleOrientation}
                    onChange={(event) => setSingleOrientation(event.target.value as SexualOrientationOption)}
                    style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', width: '100%', maxWidth: '320px' }}
                  >
                    <option value="">Seleciona...</option>
                    {ORIENTATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                </div>

                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {LOOKING_FOR_OPTIONS.map((option) => (
                    <button
                      type="button"
                      key={option.value}
                      onClick={() => toggleLookingFor(option.value, setSingleLookingFor)}
                      style={{
                        padding: '0.5rem 0.75rem',
                        borderRadius: '999px',
                        border: singleLookingFor.includes(option.value) ? '2px solid var(--primary)' : '1px solid var(--border)',
                        background: 'var(--surface)',
                        color: 'var(--text)',
                        cursor: 'pointer',
                      }}
                    >
                      {option.label}
                    </button>
                  ))}
                </div>
              </>
            )}

            {isCoupleAccount(accountType) && (
              <div style={{ display: 'grid', gap: '1rem' }}>
                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>Membro 1</p>
                  <select
                    value={member1Orientation}
                    onChange={(event) => setMember1Orientation(event.target.value as SexualOrientationOption)}
                    style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', width: '100%', maxWidth: '320px', marginBottom: '0.75rem' }}
                  >
                    <option value="">Orientação sexual...</option>
                    {ORIENTATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {LOOKING_FOR_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={`m1-${option.value}`}
                        onClick={() => toggleLookingFor(option.value, setMember1LookingFor)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '999px',
                          border: member1LookingFor.includes(option.value) ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 600, marginBottom: '0.5rem' }}>Membro 2</p>
                  <select
                    value={member2Orientation}
                    onChange={(event) => setMember2Orientation(event.target.value as SexualOrientationOption)}
                    style={{ padding: '0.75rem', border: '1px solid var(--border)', borderRadius: '4px', background: 'var(--surface)', color: 'var(--text)', width: '100%', maxWidth: '320px', marginBottom: '0.75rem' }}
                  >
                    <option value="">Orientação sexual...</option>
                    {ORIENTATION_OPTIONS.map((option) => (
                      <option key={option.value} value={option.value}>{option.label}</option>
                    ))}
                  </select>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                    {LOOKING_FOR_OPTIONS.map((option) => (
                      <button
                        type="button"
                        key={`m2-${option.value}`}
                        onClick={() => toggleLookingFor(option.value, setMember2LookingFor)}
                        style={{
                          padding: '0.5rem 0.75rem',
                          borderRadius: '999px',
                          border: member2LookingFor.includes(option.value) ? '2px solid var(--primary)' : '1px solid var(--border)',
                          background: 'var(--surface)',
                          color: 'var(--text)',
                          cursor: 'pointer',
                        }}
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {error && <p style={{ color: 'var(--primary)', marginTop: '1rem' }}>{error}</p>}
          </div>
        )}

        {/* Date of Birth */}
        {currentStep === 'dob' && (
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
        {currentStep === 'name' && (
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
        {currentStep === 'location' && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>A tua localização</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>
              Podes escrever a tua cidade. Se deixares em branco, seguimos sem localização.
            </p>

            <div style={{ marginBottom: '1.25rem' }}>
              <input
                type="text"
                placeholder="Ex: Lisboa"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                maxLength={80}
                style={{
                  padding: '0.75rem',
                  border: '1px solid var(--border)',
                  borderRadius: '4px',
                  background: 'var(--surface)',
                  color: 'var(--text)',
                  fontSize: '1rem',
                  width: '100%',
                  maxWidth: '420px',
                }}
              />
            </div>

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
                {loading ? 'A processar...' : 'Usar localização automática'}
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
          {stepIndex > 0 && (
            <button
              onClick={() => setStepIndex(stepIndex - 1)}
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
            onClick={() => goNext()}
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
            {loading ? 'A processar...' : currentStep === 'location' ? 'Terminar' : 'Seguinte'}
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
