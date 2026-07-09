'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter, useSearchParams } from 'next/navigation'
import { questionSets, archetypes } from '@/data/kink-test-questions'
import { isCoupleAccount } from '@/lib/relationship-preferences'

type AccountType = 'FEMALE_SINGLE' | 'MALE_SINGLE' | 'COUPLE_MF' | 'COUPLE_MM' | 'COUPLE_FF'

type QuizAnswerValue = { rating: 'yes' | 'no' | 'maybe'; intensity?: number; role?: string }
interface QuizAnswers {
  [itemId: string]: QuizAnswerValue
}

export default function KinkTest() {
  const router = useRouter()
  const params = useParams()
  const searchParams = useSearchParams()
  const locale = params.locale as string
  const fromOnboarding = searchParams.get('fromOnboarding') === '1'
  const accountTypeFallback = searchParams.get('accountType') as AccountType | null

  const [loading, setLoading] = useState(!accountTypeFallback)
  const [accountType, setAccountType] = useState<AccountType | null>(accountTypeFallback)
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0)

  const [singleAnswers, setSingleAnswers] = useState<QuizAnswers>({})
  const [memberIndex, setMemberIndex] = useState(0)
  const [coupleAnswers, setCoupleAnswers] = useState<{ member1: QuizAnswers; member2: QuizAnswers }>({
    member1: {},
    member2: {},
  })

  const [showResults, setShowResults] = useState(false)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [memberArchetypes, setMemberArchetypes] = useState<{ member1?: string; member2?: string } | null>(null)
  const [derivedTags, setDerivedTags] = useState<string[]>([])
  const [coupleCompatibility, setCoupleCompatibility] = useState<{ score: number; sharedTags: string[] } | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) throw new Error('Failed to fetch user')
        const userData = await res.json()
        setAccountType(userData.accountType ?? accountTypeFallback)
        setLoading(false)
      } catch (err) {
        console.error(err)
        if (accountTypeFallback) {
          setAccountType(accountTypeFallback)
          setLoading(false)
          return
        }

        router.push(`/${locale}/onboarding`)
      }
    }
    void fetchUser()
  }, [accountTypeFallback, locale, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text)' }}>A carregar...</p>
      </div>
    )
  }

  if (!accountType || !questionSets[accountType]) {
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <p style={{ color: 'var(--text-muted)' }}>Tipo de conta não suportado</p>
      </div>
    )
  }

  const questions = questionSets[accountType]
  const categories = [...new Set(questions.map((q) => q.category))]
  const currentCategory = categories[currentCategoryIdx]
  const categoryQuestions = questions.filter((q) => q.category === currentCategory)
  const coupleMode = isCoupleAccount(accountType)

  const activeAnswers = coupleMode
    ? memberIndex === 0
      ? coupleAnswers.member1
      : coupleAnswers.member2
    : singleAnswers

  const allAnswered = categoryQuestions.every((q) => activeAnswers[q.id])

  const setActiveAnswers = (next: QuizAnswers) => {
    if (!coupleMode) {
      setSingleAnswers(next)
      return
    }
    setCoupleAnswers((prev) =>
      memberIndex === 0
        ? { ...prev, member1: next }
        : { ...prev, member2: next }
    )
  }

  const handleAnswerChange = (itemId: string, rating: 'yes' | 'no' | 'maybe') => {
    setActiveAnswers({
      ...activeAnswers,
      [itemId]: { ...activeAnswers[itemId], rating },
    })
  }

  const handleNextCategory = async () => {
    if (currentCategoryIdx < categories.length - 1) {
      setCurrentCategoryIdx(currentCategoryIdx + 1)
      return
    }

    if (coupleMode && memberIndex === 0) {
      setMemberIndex(1)
      setCurrentCategoryIdx(0)
      return
    }

    await submitQuiz()
  }

  const submitQuiz = async () => {
    setLoading(true)
    try {
      const payload = coupleMode
        ? {
            memberAnswers: {
              member1: coupleAnswers.member1,
              member2: coupleAnswers.member2,
            },
            accountTypeAtTime: accountType,
          }
        : {
            answers: singleAnswers,
            accountTypeAtTime: accountType,
          }

      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      })

      if (!res.ok) throw new Error('Failed to submit quiz')

      const result = await res.json()
      setArchetype(result.archetype ?? null)
      setDerivedTags(Array.isArray(result.derivedTags) ? result.derivedTags : [])
      setMemberArchetypes(result.memberArchetypes ?? null)
      setCoupleCompatibility(result.coupleCompatibility ?? null)
      setShowResults(true)
    } catch (err) {
      setError('Erro ao guardar teste. Tenta novamente.')
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  if (showResults) {
    const archetypeData = archetype ? archetypes[archetype as keyof typeof archetypes] ?? null : null
    return (
      <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
        <div style={{ maxWidth: '700px', margin: '0 auto', textAlign: 'center' }}>
          {!coupleMode && (
            <>
              <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{archetypeData?.emoji}</h1>
              <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>{archetypeData?.title}</h2>
              <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{archetypeData?.description}</p>
            </>
          )}

          {coupleMode && (
            <div style={{ marginBottom: '1.5rem', padding: '1rem', border: '1px solid var(--border)', borderRadius: '8px', background: 'var(--surface)' }}>
              <h2 style={{ color: 'var(--text)', marginBottom: '0.75rem' }}>Resultado do casal (privado)</h2>
              <p style={{ color: 'var(--text-muted)' }}>Compatibilidade interna: <strong style={{ color: 'var(--text)' }}>{coupleCompatibility?.score ?? 0}%</strong></p>
              <p style={{ color: 'var(--text-muted)', marginTop: '0.5rem' }}>Membro 1: {memberArchetypes?.member1 ?? 'N/A'} · Membro 2: {memberArchetypes?.member2 ?? 'N/A'}</p>
            </div>
          )}

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '1rem' }}>
              {coupleMode ? 'Características comuns do casal:' : 'Os teus interesses:'}
            </h3>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center' }}>
              {derivedTags.map((tag) => (
                <span
                  key={tag}
                  style={{
                    padding: '0.5rem 1rem',
                    background: 'var(--surface)',
                    border: '1px solid var(--primary)',
                    borderRadius: '999px',
                    color: 'var(--text)',
                    fontSize: '0.85rem',
                  }}
                >
                  {tag}
                </span>
              ))}
            </div>
          </div>

          <button
            onClick={() => router.push(fromOnboarding ? `/${locale}/onboarding` : `/${locale}/profile`)}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer',
              fontSize: '1rem',
            }}
          >
            {fromOnboarding ? 'Continuar onboarding' : 'Ver o meu perfil'}
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>The Kink Test 🍍</h1>
          {coupleMode && (
            <p style={{ color: 'var(--primary)', marginBottom: '0.5rem', fontWeight: 600 }}>
              Casal: responder individualmente (Membro {memberIndex + 1}/2)
            </p>
          )}
          <p style={{ color: 'var(--text-muted)', marginBottom: '1rem' }}>
            {currentCategoryIdx + 1} de {categories.length}: {currentCategory}
          </p>
          <div
            style={{
              height: '4px',
              background: 'var(--border)',
              borderRadius: '2px',
              overflow: 'hidden',
            }}
          >
            <div
              style={{
                height: '100%',
                background: 'var(--primary)',
                width: `${((currentCategoryIdx + 1) / categories.length) * 100}%`,
                transition: 'width 0.3s ease',
              }}
            />
          </div>
        </div>

        <div style={{ marginBottom: '2rem' }}>
          {categoryQuestions.map((question) => (
            <div
              key={question.id}
              style={{
                marginBottom: '1.5rem',
                padding: '1rem',
                border: '1px solid var(--border)',
                borderRadius: '8px',
                background: 'var(--surface)',
              }}
            >
              <div style={{ marginBottom: '1rem' }}>
                <div style={{ color: 'var(--text)', fontWeight: 'bold', marginBottom: '0.25rem' }}>
                  {question.label}
                </div>
                {question.description && (
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>{question.description}</div>
                )}
              </div>

              <div style={{ display: 'flex', gap: '0.5rem' }}>
                {(['yes', 'no', 'maybe'] as const).map((rating) => (
                  <button
                    key={rating}
                    onClick={() => handleAnswerChange(question.id, rating)}
                    style={{
                      padding: '0.5rem 1rem',
                      border: activeAnswers[question.id]?.rating === rating ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background:
                        activeAnswers[question.id]?.rating === rating
                          ? rating === 'yes'
                            ? 'rgba(34, 197, 94, 0.1)'
                            : rating === 'no'
                              ? 'rgba(239, 68, 68, 0.1)'
                              : 'rgba(217, 119, 6, 0.1)'
                          : 'var(--surface)',
                      color: 'var(--text)',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      flex: 1,
                      textAlign: 'center',
                      textTransform: 'uppercase',
                      fontSize: '0.75rem',
                      fontWeight: 'bold',
                    }}
                  >
                    {rating === 'yes' ? 'Sim' : rating === 'no' ? 'Não' : 'Talvez'}
                  </button>
                ))}
              </div>
            </div>
          ))}
        </div>

        {error && <p style={{ color: 'var(--primary)', marginBottom: '1rem' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '1rem', justifyContent: 'space-between' }}>
          <button
            onClick={() => setCurrentCategoryIdx(Math.max(0, currentCategoryIdx - 1))}
            disabled={currentCategoryIdx === 0}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'transparent',
              color: 'var(--text)',
              border: '1px solid var(--border)',
              borderRadius: '4px',
              cursor: currentCategoryIdx === 0 ? 'not-allowed' : 'pointer',
              opacity: currentCategoryIdx === 0 ? 0.5 : 1,
            }}
          >
            Voltar
          </button>
          <button
            onClick={() => void handleNextCategory()}
            disabled={!allAnswered || loading}
            style={{
              padding: '0.75rem 1.5rem',
              background: 'var(--primary)',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: !allAnswered || loading ? 'not-allowed' : 'pointer',
              opacity: !allAnswered || loading ? 0.6 : 1,
            }}
          >
            {loading ? 'A processar...' : currentCategoryIdx === categories.length - 1 ? (coupleMode && memberIndex === 0 ? 'Próximo membro' : 'Terminar') : 'Seguinte'}
          </button>
        </div>
      </div>
    </div>
  )
}
