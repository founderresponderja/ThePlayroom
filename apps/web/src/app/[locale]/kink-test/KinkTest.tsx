'use client'
import { useState } from 'react'
import { useRouter, useParams } from 'next/navigation'
import { questionSets, archetypes, type QuizItem } from '@/data/kink-test-questions'

type Rating = 'yes' | 'no' | 'maybe'
type Answer = { rating: Rating; intensity?: number; role?: string }
type Answers = Record<string, Answer>

// Typed option arrays to satisfy noUncheckedIndexedAccess
const RATING_OPTIONS: { r: Rating; label: string; bg: string; color: string }[] = [
  { r: 'yes',   label: '✅ Sim',     bg: '#1a3a1a', color: '#4ade80' },
  { r: 'maybe', label: '🤔 Talvez',  bg: '#2a2a0a', color: '#fbbf24' },
  { r: 'no',    label: '❌ Não',     bg: '#3a1a1a', color: '#f87171' },
]
const ROLE_OPTIONS: { value: string; label: string }[] = [
  { value: 'give',    label: 'Dar' },
  { value: 'receive', label: 'Receber' },
  { value: 'both',    label: 'Ambos' },
]
const INTENSITY_OPTIONS = [1, 2, 3] as const

export default function KinkTest({ accountType }: { accountType: string }) {
  const router = useRouter()
  const params = useParams()
  const locale = params.locale as string

  const isCouple = accountType.startsWith('COUPLE_')
  const questions: QuizItem[] =
    questionSets[accountType] ?? questionSets['FEMALE_SINGLE'] ?? []

  // Group by category
  const categories = [...new Set(questions.map(q => q.category))]

  const [partner, setPartner]       = useState<1 | 2>(1)
  const [catIndex, setCatIndex]     = useState(0)
  const [answers1, setAnswers1]     = useState<Answers>({})
  const [answers2, setAnswers2]     = useState<Answers>({})
  const [showMutual, setShowMutual] = useState(false)
  const [result, setResult]         = useState<{ archetype: string; derivedTags: string[] } | null>(null)
  const [loading, setLoading]       = useState(false)

  const currentAnswers    = partner === 1 ? answers1 : answers2
  const setCurrentAnswers = partner === 1 ? setAnswers1 : setAnswers2

  // Guard against undefined (noUncheckedIndexedAccess)
  const currentCategory = categories[catIndex] ?? ''
  const currentItems    = questions.filter(q => q.category === currentCategory)
  const allAnswered     = currentItems.every(q => currentAnswers[q.id])

  const setAnswer = (id: string, rating: Rating) => {
    setCurrentAnswers(prev => ({ ...prev, [id]: { ...prev[id], rating } }))
  }

  const setDetail = (id: string, field: 'intensity' | 'role', value: string | number) => {
    setCurrentAnswers(prev => {
      const existing = prev[id]
      // Only update detail if a rating has already been set (prev[id] is defined)
      if (!existing) return prev
      return { ...prev, [id]: { ...existing, [field]: value } }
    })
  }

  const handleNext = async () => {
    if (catIndex < categories.length - 1) {
      setCatIndex(c => c + 1)
      return
    }
    // End of categories for current partner
    if (isCouple && partner === 1) {
      setPartner(2)
      setCatIndex(0)
      return
    }
    // Submit
    setLoading(true)
    const combined = isCouple
      ? {
          ...answers1,
          ...Object.fromEntries(Object.entries(answers2).map(([k, v]) => [`p2_${k}`, v])),
        }
      : answers1
    try {
      const res = await fetch('/api/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ answers: combined, accountTypeAtTime: accountType }),
      })
      const data = (await res.json()) as { archetype: string; derivedTags: string[] }
      if (isCouple) setShowMutual(true)
      setResult(data)
    } catch { /* ignore */ }
    setLoading(false)
  }

  // Mutual match lists for couples
  const mutualYes = isCouple
    ? questions.filter(q => answers1[q.id]?.rating === 'yes' && answers2[q.id]?.rating === 'yes')
    : []
  const mutualMaybe = isCouple
    ? questions.filter(q =>
        (answers1[q.id]?.rating === 'yes' || answers1[q.id]?.rating === 'maybe') &&
        (answers2[q.id]?.rating === 'yes' || answers2[q.id]?.rating === 'maybe') &&
        !(answers1[q.id]?.rating === 'yes' && answers2[q.id]?.rating === 'yes'),
      )
    : []

  const archetypeData = result ? archetypes[result.archetype] : undefined

  // ── Results screen ────────────────────────────────────────────────────────
  if (result && (!isCouple || !showMutual || catIndex >= categories.length - 1)) {
    return (
      <div style={{
        minHeight: '100vh', background: 'var(--bg)',
        display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center',
        padding: '2rem',
      }}>
        {isCouple && showMutual && (
          <div style={{ width: '100%', maxWidth: '600px', marginBottom: '2rem' }}>
            <h3 style={{ color: 'var(--primary)', marginBottom: '1rem' }}>✨ Os vossos matches mútuos</h3>
            {mutualYes.length > 0 && (
              <div style={{ marginBottom: '1rem' }}>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Ambos disseram SIM:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {mutualYes.map(q => (
                    <span key={q.id} style={{ background: '#1a3a1a', color: '#4ade80', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                      {q.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
            {mutualMaybe.length > 0 && (
              <div>
                <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '0.5rem' }}>Ambos estão curiosos:</p>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
                  {mutualMaybe.map(q => (
                    <span key={q.id} style={{ background: '#2a2a0a', color: '#fbbf24', padding: '0.3rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem' }}>
                      {q.label}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {archetypeData && (
          <div style={{
            background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '1rem',
            padding: '2rem', textAlign: 'center', maxWidth: '480px', width: '100%',
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>{archetypeData.emoji}</div>
            <h2 style={{ color: 'var(--text)', marginBottom: '0.5rem' }}>{archetypeData.title}</h2>
            <p style={{ color: 'var(--text-muted)', marginBottom: '1.5rem' }}>{archetypeData.description}</p>
            {result.derivedTags.length > 0 && (
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', justifyContent: 'center', marginBottom: '1.5rem' }}>
                {result.derivedTags.slice(0, 8).map(tag => (
                  <span key={tag} style={{
                    background: 'var(--surface-2)', color: 'var(--text-muted)',
                    padding: '0.25rem 0.75rem', borderRadius: '999px', fontSize: '0.8rem',
                  }}>
                    {tag.replace('curious:', '~ ')}
                  </span>
                ))}
              </div>
            )}
            <button
              onClick={() => router.push(`/${locale}/dashboard`)}
              className="btn-primary"
              style={{ width: '100%', padding: '0.875rem' }}
            >
              Ver o meu perfil 🍍
            </button>
          </div>
        )}
      </div>
    )
  }

  // ── Quiz screen ───────────────────────────────────────────────────────────
  return (
    <div style={{ minHeight: '100vh', background: 'var(--bg)', padding: '1.5rem' }}>
      {/* Progress bar */}
      <div style={{ position: 'fixed', top: 0, left: 0, right: 0, height: '3px', background: 'var(--border)', zIndex: 50 }}>
        <div style={{
          height: '100%',
          width: `${(catIndex / categories.length) * 100}%`,
          background: 'var(--primary)',
          transition: 'width 0.3s',
        }} />
      </div>

      <div style={{ maxWidth: '640px', margin: '0 auto', paddingTop: '2rem' }}>
        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <h1 style={{ color: 'var(--text)', fontSize: '1.5rem' }}>The Kink Test 🍍</h1>
          {isCouple && (
            <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', marginTop: '0.75rem' }}>
              {([1, 2] as const).map(p => (
                <span key={p} style={{
                  padding: '0.25rem 1rem', borderRadius: '999px', fontSize: '0.85rem',
                  background: partner === p ? 'var(--primary)' : 'var(--surface)',
                  color: partner === p ? 'white' : 'var(--text-muted)',
                }}>
                  Parceiro {p}
                </span>
              ))}
            </div>
          )}
        </div>

        <h2 style={{ color: 'var(--primary)', marginBottom: '1.5rem', fontSize: '1.1rem' }}>
          {currentCategory}
        </h2>

        {/* Question cards */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {currentItems.map((item: QuizItem) => {
            const ans = currentAnswers[item.id]
            return (
              <div key={item.id} style={{
                background: 'var(--surface)', border: '1px solid var(--border)',
                borderRadius: '0.75rem', padding: '1rem',
              }}>
                <div style={{ marginBottom: '0.75rem' }}>
                  <p style={{ color: 'var(--text)', fontWeight: 500 }}>{item.label}</p>
                  {item.description && (
                    <p style={{ color: 'var(--text-muted)', fontSize: '0.8rem', marginTop: '0.2rem' }}>
                      {item.description}
                    </p>
                  )}
                </div>

                {/* Yes / Maybe / No */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {RATING_OPTIONS.map(({ r, label, bg, color }) => (
                    <button
                      key={r}
                      onClick={() => setAnswer(item.id, r)}
                      style={{
                        flex: 1, padding: '0.5rem', borderRadius: '0.5rem',
                        border: 'none', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600,
                        background: ans?.rating === r ? bg : 'var(--surface-2)',
                        color: ans?.rating === r ? color : 'var(--text-muted)',
                        transition: 'all 0.15s',
                      }}
                    >
                      {label}
                    </button>
                  ))}
                </div>

                {/* Intensity + role sub-options */}
                {ans?.rating && ans.rating !== 'no' && (
                  <div style={{ marginTop: '0.75rem', display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Intensidade</p>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {INTENSITY_OPTIONS.map(i => (
                          <button
                            key={i}
                            onClick={() => setDetail(item.id, 'intensity', i)}
                            style={{
                              width: '32px', height: '32px', borderRadius: '0.375rem',
                              border: 'none', cursor: 'pointer', fontSize: '0.85rem',
                              background: ans.intensity === i ? 'var(--primary)' : 'var(--surface-2)',
                              color: ans.intensity === i ? 'white' : 'var(--text-muted)',
                            }}
                          >
                            {i}
                          </button>
                        ))}
                      </div>
                    </div>
                    <div>
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', marginBottom: '0.3rem' }}>Papel</p>
                      <div style={{ display: 'flex', gap: '0.25rem' }}>
                        {ROLE_OPTIONS.map(({ value, label }) => (
                          <button
                            key={value}
                            onClick={() => setDetail(item.id, 'role', value)}
                            style={{
                              padding: '0.25rem 0.5rem', borderRadius: '0.375rem',
                              border: 'none', cursor: 'pointer', fontSize: '0.75rem',
                              background: ans.role === value ? 'var(--accent)' : 'var(--surface-2)',
                              color: ans.role === value ? 'white' : 'var(--text-muted)',
                            }}
                          >
                            {label}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )
          })}
        </div>

        {/* Navigation */}
        <div style={{ display: 'flex', gap: '1rem', marginTop: '2rem', paddingBottom: '2rem' }}>
          {catIndex > 0 && (
            <button
              onClick={() => setCatIndex(c => c - 1)}
              className="btn-outline"
              style={{ flex: 1, padding: '0.875rem' }}
            >
              Voltar
            </button>
          )}
          <button
            onClick={() => void handleNext()}
            disabled={!allAnswered || loading}
            className="btn-primary"
            style={{ flex: 2, padding: '0.875rem', opacity: !allAnswered || loading ? 0.5 : 1 }}
          >
            {loading
              ? 'A guardar…'
              : catIndex < categories.length - 1
                ? 'Seguinte'
                : isCouple && partner === 1
                  ? 'Parceiro 2 →'
                  : 'Ver resultado'}
          </button>
        </div>
      </div>
    </div>
  )
}
