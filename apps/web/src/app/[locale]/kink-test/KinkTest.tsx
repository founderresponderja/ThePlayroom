'use client'
import { useEffect, useState } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { questionSets, archetypes } from '@/data/kink-test-questions'

type AccountType = 'FEMALE_SINGLE' | 'MALE_SINGLE' | 'COUPLE_MF' | 'COUPLE_MM' | 'COUPLE_FF'

interface QuizAnswers {
  [itemId: string]: { rating: 'yes' | 'no' | 'maybe'; intensity?: number; role?: string }
}

export default function KinkTest() {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<any>(null)
  const [accountType, setAccountType] = useState<AccountType | null>(null)
  const [currentCategoryIdx, setCurrentCategoryIdx] = useState(0)
  const [answers, setAnswers] = useState<QuizAnswers>({})
  const [showResults, setShowResults] = useState(false)
  const [archetype, setArchetype] = useState<string | null>(null)
  const [derivedTags, setDerivedTags] = useState<string[]>([])
  const [error, setError] = useState('')

  // Fetch user data
  useEffect(() => {
    const fetchUser = async () => {
      try {
        const res = await fetch('/api/users/me')
        if (!res.ok) throw new Error('Failed to fetch user')
        const userData = await res.json()
        setUser(userData)
        setAccountType(userData.accountType)
        setLoading(false)
      } catch (err) {
        console.error(err)
        router.push(`/${locale}/onboarding`)
      }
    }
    fetchUser()
  }, [locale, router])

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

  const allAnswered = categoryQuestions.every((q) => answers[q.id])

  const handleAnswerChange = (itemId: string, rating: 'yes' | 'no' | 'maybe') => {
    setAnswers({
      ...answers,
      [itemId]: { ...answers[itemId], rating },
    })
  }

  const handleNextCategory = () => {
    if (currentCategoryIdx < categories.length - 1) {
      setCurrentCategoryIdx(currentCategoryIdx + 1)
    } else {
      submitQuiz()
    }
  }

  const submitQuiz = async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          answers,
          accountTypeAtTime: accountType,
        }),
      })

      if (!res.ok) throw new Error('Failed to submit quiz')

      const result = await res.json()
      setArchetype(result.archetype)
      setDerivedTags(result.derivedTags)
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
        <div style={{ maxWidth: '600px', margin: '0 auto', textAlign: 'center' }}>
          <h1 style={{ fontSize: '3rem', marginBottom: '1rem' }}>{archetypeData?.emoji}</h1>
          <h2 style={{ color: 'var(--text)', marginBottom: '1rem' }}>{archetypeData?.title}</h2>
          <p style={{ color: 'var(--text-muted)', marginBottom: '2rem' }}>{archetypeData?.description}</p>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--text)', marginBottom: '1rem' }}>Os teus interesses:</h3>
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
            onClick={() => router.push(`/${locale}/profile`)}
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
            Ver o meu perfil
          </button>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '2rem 1rem' }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        {/* Header */}
        <div style={{ marginBottom: '2rem' }}>
          <h1 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>The Kink Test 🍍</h1>
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

        {/* Questions */}
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
                      border: answers[question.id]?.rating === rating ? '2px solid var(--primary)' : '1px solid var(--border)',
                      background:
                        answers[question.id]?.rating === rating
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

        {/* Navigation */}
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
            onClick={() => handleNextCategory()}
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
            {loading ? 'A processar...' : currentCategoryIdx === categories.length - 1 ? 'Terminar' : 'Seguinte'}
          </button>
        </div>
      </div>
    </div>
  )
}
