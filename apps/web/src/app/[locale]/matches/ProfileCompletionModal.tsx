'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import PhotoUploader from '@/components/PhotoUploader'

type Photo = {
  id: number
  url: string
  isPrivate: boolean
  isPrimary: boolean
  moderationStatus: string
}

type CompletionUser = {
  id: number
  displayName: string
  accountType: string
}

type Profile = { bio?: string | null } | null

type Club = { id: number; name: string; address: string | null } | null
type Shop = { id: number; name: string; payoutsEnabled: boolean; stripeConnectAccountId: string | null } | null

const ACCOUNT_TYPES = [
  { value: 'MALE_SINGLE', label: 'Single M' },
  { value: 'FEMALE_SINGLE', label: 'Single F' },
  { value: 'COUPLE_MF', label: 'Casal MF' },
  { value: 'COUPLE_MM', label: 'Casal MM' },
  { value: 'COUPLE_FF', label: 'Casal FF' },
  { value: 'SWING_CLUB', label: 'Clube' },
  { value: 'SEX_SHOP', label: 'Loja' },
]

const ACCOUNT_HELP: Record<string, string> = {
  MALE_SINGLE: 'Perfil individual com acesso a matches, feed e mensagens.',
  FEMALE_SINGLE: 'Perfil individual com acesso a matches, feed e mensagens.',
  COUPLE_MF: 'Perfil de casal com acesso a matches, feed e mensagens.',
  COUPLE_MM: 'Perfil de casal com acesso a matches, feed e mensagens.',
  COUPLE_FF: 'Perfil de casal com acesso a matches, feed e mensagens.',
  SWING_CLUB: 'Clube com eventos e, se aplicável, gestão de reservas.',
  SEX_SHOP: 'Loja com marketplace e configuração de faturação.',
}

export default function ProfileCompletionModal({
  locale,
  user,
  photos: initialPhotos,
  profile,
  club,
  shop,
}: {
  locale: string
  user: CompletionUser
  photos: Photo[]
  profile: Profile
  club: Club
  shop: Shop
}) {
  const router = useRouter()
  const [photos, setPhotos] = useState(initialPhotos)
  const [displayName, setDisplayName] = useState(user.displayName ?? '')
  const [accountType, setAccountType] = useState(user.accountType)
  const [bio, setBio] = useState(profile?.bio ?? '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [clubName, setClubName] = useState(club?.name ?? '')
  const [clubDescription, setClubDescription] = useState('')
  const [clubAddress, setClubAddress] = useState(club?.address ?? '')
  const [eventTitle, setEventTitle] = useState('')
  const [eventDescription, setEventDescription] = useState('')
  const [eventStartsAt, setEventStartsAt] = useState('')
  const [eventEndsAt, setEventEndsAt] = useState('')

  const [shopName, setShopName] = useState(shop?.name ?? '')
  const [bulkProducts, setBulkProducts] = useState('')

  const handleUploadComplete = (photo: Photo) => setPhotos((prev) => [...prev, photo])
  const handleDelete = async (photoId: number) => {
    await fetch('/api/photos', {
      method: 'DELETE',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ photoId }),
    })
    setPhotos((prev) => prev.filter((photo) => photo.id !== photoId))
  }
  const handleSetPrimary = async (photoId: number) => {
    await fetch(`/api/photos/${photoId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ isPrimary: true }),
    })
    setPhotos((prev) => prev.map((photo) => ({ ...photo, isPrimary: photo.id === photoId })))
  }

  const handleSaveGeneral = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const userRes = await fetch('/api/users/me', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          accountType,
          displayName: displayName.trim(),
        }),
      })
      if (!userRes.ok) throw new Error('Falha ao guardar o tipo de conta.')

      const profileRes = await fetch('/api/profile', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ bio }),
      })
      if (!profileRes.ok) throw new Error('Falha ao guardar a bio.')

      setSuccess('Perfil guardado.')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const handleCreateClubAndEvent = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const clubRes = await fetch('/api/clubs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: clubName,
          description: clubDescription,
          address: clubAddress,
          amenities: [],
        }),
      })

      const clubData = (await clubRes.json()) as { id?: number; error?: string }
      if (!clubRes.ok) throw new Error(clubData.error ?? 'Falha ao criar o clube.')

      if (eventTitle && eventStartsAt) {
        const eventRes = await fetch('/api/events', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title: eventTitle,
            description: eventDescription,
            startsAt: eventStartsAt,
            endsAt: eventEndsAt || undefined,
            locationMode: 'club',
            clubId: clubData.id,
            privacy: 'public',
            ticketed: false,
          }),
        })

        const eventData = (await eventRes.json()) as { error?: string }
        if (!eventRes.ok) throw new Error(eventData.error ?? 'Falha ao criar o evento.')
      }

      setSuccess('Clube configurado.')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const handleBulkProducts = async () => {
    setError('')
    setSuccess('')
    setSaving(true)

    try {
      const rows = bulkProducts
        .split('\n')
        .map((row) => row.trim())
        .filter(Boolean)

      for (const row of rows) {
        const [title, price, description, imageUrl] = row.split('|').map((part) => part.trim())
        if (!title || !price) continue

        const response = await fetch('/api/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            title,
            description: description ?? '',
            priceCents: Math.round(Number(price) * 100),
            category: 'Marketplace',
            stock: 0,
            images: imageUrl ? [imageUrl] : [],
          }),
        })

        if (!response.ok) {
          const data = (await response.json().catch(() => null)) as { error?: string } | null
          throw new Error(data?.error ?? 'Falha ao importar produtos.')
        }
      }

      setSuccess('Produtos importados.')
      setBulkProducts('')
      router.refresh()
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Erro inesperado.')
    } finally {
      setSaving(false)
    }
  }

  const openShopSetup = async () => {
    router.push(`/${locale}/shop-setup`)
  }

  const openClubSetup = async () => {
    router.push(`/${locale}/club-setup`)
  }

  const accountHelp = ACCOUNT_HELP[accountType] ?? 'Escolhe o tipo que melhor descreve a tua conta.'

  return (
    <div className="fixed inset-0 z-[100] flex items-start justify-center overflow-y-auto bg-[rgba(0,0,0,0.78)] px-4 py-8 backdrop-blur-sm">
      <div className="w-full max-w-5xl rounded-[2rem] border border-[var(--border)] bg-[var(--bg)] shadow-2xl">
        <div className="flex items-center justify-between border-b border-[var(--border)] px-6 py-4">
          <div>
            <p className="text-xs uppercase tracking-[0.3em] text-[var(--primary)]">Completa o perfil</p>
            <h2 className="text-2xl font-semibold text-[var(--text)]">Antes de veres os matches</h2>
          </div>
          <button onClick={() => router.back()} className="rounded-full border border-[var(--border)] px-4 py-2 text-sm text-[var(--text-muted)]">
            Voltar
          </button>
        </div>

        <div className="grid gap-6 p-6 lg:grid-cols-[1.15fr_0.85fr]">
          <div className="space-y-6">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="mb-3 text-lg font-semibold text-[var(--text)]">Fotos</h3>
              <PhotoUploader
                photos={photos}
                onUploadComplete={handleUploadComplete}
                onDelete={(id) => void handleDelete(id)}
                onSetPrimary={(id) => void handleSetPrimary(id)}
              />
            </section>

            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
              <div>
                <h3 className="text-lg font-semibold text-[var(--text)]">Perfil base</h3>
                <p className="text-sm text-[var(--text-muted)]">Bio até 2500 caracteres e tipo de conta.</p>
              </div>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[var(--text)]">Nome visível</span>
                <input
                  value={displayName}
                  onChange={(event) => setDisplayName(event.target.value)}
                  maxLength={100}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none"
                />
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[var(--text)]">Tipo de conta</span>
                <select
                  value={accountType}
                  onChange={(event) => setAccountType(event.target.value)}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none"
                >
                  {ACCOUNT_TYPES.map((type) => (
                    <option key={type.value} value={type.value}>{type.label}</option>
                  ))}
                </select>
                <span className="text-xs text-[var(--text-muted)]">{accountHelp}</span>
              </label>
              <label className="flex flex-col gap-2">
                <span className="text-sm text-[var(--text)]">Bio</span>
                <textarea
                  value={bio}
                  onChange={(event) => setBio(event.target.value)}
                  maxLength={2500}
                  rows={8}
                  className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none"
                  placeholder="Conta quem és, o que procuras e o que ofereces na comunidade..."
                />
                <span className="text-right text-xs text-[var(--text-muted)]">{bio.length}/2500</span>
              </label>
              <button onClick={() => void handleSaveGeneral()} disabled={saving} className="btn-primary w-full py-3">
                {saving ? 'A guardar...' : 'Guardar perfil base'}
              </button>
            </section>

            {accountType === 'SWING_CLUB' ? (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">Perfil do clube</h3>
                  <p className="text-sm text-[var(--text-muted)]">Clube tem acesso a eventos e, na versão paga, à gestão de reservas.</p>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--text)]">Nome do clube</span>
                  <input value={clubName} onChange={(event) => setClubName(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--text)]">Morada</span>
                  <input value={clubAddress} onChange={(event) => setClubAddress(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none" />
                </label>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--text)]">Descrição do clube</span>
                  <textarea value={clubDescription} onChange={(event) => setClubDescription(event.target.value)} rows={3} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none" />
                </label>
                <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <h4 className="font-semibold text-[var(--text)]">Evento rápido</h4>
                  <input placeholder="Título" value={eventTitle} onChange={(event) => setEventTitle(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none" />
                  <textarea placeholder="Descrição" value={eventDescription} onChange={(event) => setEventDescription(event.target.value)} rows={3} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none" />
                  <label className="flex flex-col gap-2 text-sm text-[var(--text)]">
                    <span>Início</span>
                    <input type="datetime-local" value={eventStartsAt} onChange={(event) => setEventStartsAt(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none" />
                  </label>
                  <label className="flex flex-col gap-2 text-sm text-[var(--text)]">
                    <span>Fim</span>
                    <input type="datetime-local" value={eventEndsAt} onChange={(event) => setEventEndsAt(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none" />
                  </label>
                </div>
                <button onClick={() => void handleCreateClubAndEvent()} disabled={saving || !clubName} className="btn-primary w-full py-3">
                  {saving ? 'A guardar...' : 'Criar clube e evento'}
                </button>
                <button onClick={() => void openClubSetup()} className="btn-outline w-full py-3">
                  Abrir configuração avançada do clube
                </button>
              </section>
            ) : null}

            {accountType === 'SEX_SHOP' ? (
              <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5 space-y-4">
                <div>
                  <h3 className="text-lg font-semibold text-[var(--text)]">Perfil da loja</h3>
                  <p className="text-sm text-[var(--text-muted)]">A loja tem acesso apenas ao marketplace. Cada venda paga taxa da plataforma.</p>
                </div>
                <label className="flex flex-col gap-2">
                  <span className="text-sm text-[var(--text)]">Nome da loja</span>
                  <input value={shopName} onChange={(event) => setShopName(event.target.value)} className="rounded-xl border border-[var(--border)] bg-[var(--bg)] px-4 py-3 text-[var(--text)] outline-none" />
                </label>
                <div className="rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--text-muted)]">
                  <p className="font-semibold text-[var(--text)]">Taxa de marketplace</p>
                  <p>As lojas são avisadas que será cobrada uma taxa por cada compra no marketplace.</p>
                </div>
                <div className="grid gap-3 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4">
                  <h4 className="font-semibold text-[var(--text)]">Importação massiva de produtos</h4>
                  <p className="text-xs text-[var(--text-muted)]">Uma linha por produto: Nome | Preço | Descrição | URL da imagem</p>
                  <textarea value={bulkProducts} onChange={(event) => setBulkProducts(event.target.value)} rows={8} className="rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-3 text-[var(--text)] outline-none" />
                </div>
                <button onClick={() => void handleBulkProducts()} disabled={saving || !bulkProducts.trim()} className="btn-primary w-full py-3">
                  {saving ? 'A importar...' : 'Importar produtos'}
                </button>
                <button onClick={() => void openShopSetup()} className="btn-outline w-full py-3">
                  Abrir configuração de faturação e ligação à loja
                </button>
              </section>
            ) : null}
          </div>

          <aside className="space-y-4">
            <section className="rounded-2xl border border-[var(--border)] bg-[var(--surface)] p-5">
              <h3 className="text-lg font-semibold text-[var(--text)]">Estado</h3>
              <div className="mt-3 space-y-2 text-sm text-[var(--text-muted)]">
                <p>Fotos: {photos.length}</p>
                <p>Bio: {bio.trim().length > 0 ? 'ok' : 'em falta'}</p>
                <p>Tipo: {accountType}</p>
                <p>Clube: {accountType === 'SWING_CLUB' ? (club ? 'configurado' : 'em falta') : 'n/a'}</p>
                <p>Loja: {accountType === 'SEX_SHOP' ? (shop ? 'configurada' : 'em falta') : 'n/a'}</p>
              </div>
              <div className="mt-4 rounded-xl border border-[var(--border)] bg-[var(--bg)] p-4 text-sm text-[var(--text-muted)]">
                <p className="font-semibold text-[var(--text)]">Permissões</p>
                <p>Single e casais: matches, kink test, eventos e marketplace.</p>
                <p>Clube: eventos e, no plano pago, gestão de reservas.</p>
                <p>Loja: apenas marketplace.</p>
              </div>
            </section>

            {error ? <p className="rounded-xl border border-red-500/40 bg-red-500/10 p-4 text-sm text-red-300">{error}</p> : null}
            {success ? <p className="rounded-xl border border-emerald-500/40 bg-emerald-500/10 p-4 text-sm text-emerald-300">{success}</p> : null}
          </aside>
        </div>
      </div>
    </div>
  )
}