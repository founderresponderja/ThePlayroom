type CoupleProfileInput = {
  accountType: string
  sharedTags: string[]
  memberOrientations: string[]
  memberLookingFor: string[][]
}

export type CouplePublicProfile = {
  headline: string
  about: string
  commonCharacteristics: string[]
  lookingFor: string[]
  aiMeta: {
    provider: 'openai' | 'local-free'
    tokenCost: number
  }
}

function prettifyTag(tag: string) {
  return tag
    .replace(/^curious:/, 'curioso em ')
    .replace(/_/g, ' ')
    .trim()
}

function unique<T>(items: T[]) {
  return Array.from(new Set(items))
}

function buildLocalFreeProfile(input: CoupleProfileInput): CouplePublicProfile {
  const sharedHumanTags = input.sharedTags.map(prettifyTag).slice(0, 8)
  const flattenedLookingFor = unique(input.memberLookingFor.flat()).slice(0, 6)
  const orientationLabel = unique(input.memberOrientations).join(' + ')

  const headline =
    input.accountType === 'COUPLE_MF'
      ? 'Casal MF com perfil alinhado'
      : input.accountType === 'COUPLE_MM'
        ? 'Casal MM com perfil alinhado'
        : 'Casal FF com perfil alinhado'

  const about = [
    'Somos um casal com interesses em comum e comunicação aberta.',
    sharedHumanTags.length > 0
      ? `Características comuns: ${sharedHumanTags.join(', ')}.`
      : 'Estamos a descobrir interesses em conjunto no lifestyle.',
    orientationLabel ? `Orientações declaradas: ${orientationLabel}.` : '',
  ]
    .filter(Boolean)
    .join(' ')

  return {
    headline,
    about,
    commonCharacteristics: sharedHumanTags,
    lookingFor: flattenedLookingFor,
    aiMeta: {
      provider: 'local-free',
      tokenCost: 0,
    },
  }
}

export async function generateCouplePublicProfile(input: CoupleProfileInput): Promise<CouplePublicProfile> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    return buildLocalFreeProfile(input)
  }

  const prompt = `Gera um JSON com headline, about, commonCharacteristics (array), lookingFor (array) para um perfil publico de casal discreto e consent-based.\nConta: ${input.accountType}\nTags comuns: ${input.sharedTags.join(', ')}\nOrientacoes: ${input.memberOrientations.join(', ')}\nProcura: ${input.memberLookingFor.flat().join(', ')}`

  try {
    const res = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        temperature: 0.4,
        response_format: { type: 'json_object' },
        messages: [
          { role: 'system', content: 'Responde apenas JSON valido.' },
          { role: 'user', content: prompt },
        ],
      }),
    })

    if (!res.ok) {
      return buildLocalFreeProfile(input)
    }

    const data = (await res.json()) as any
    const raw = data?.choices?.[0]?.message?.content
    const parsed = JSON.parse(typeof raw === 'string' ? raw : '{}') as Partial<CouplePublicProfile>

    return {
      headline: parsed.headline?.trim() || buildLocalFreeProfile(input).headline,
      about: parsed.about?.trim() || buildLocalFreeProfile(input).about,
      commonCharacteristics: Array.isArray(parsed.commonCharacteristics)
        ? parsed.commonCharacteristics.map((v) => String(v)).slice(0, 8)
        : buildLocalFreeProfile(input).commonCharacteristics,
      lookingFor: Array.isArray(parsed.lookingFor)
        ? parsed.lookingFor.map((v) => String(v)).slice(0, 6)
        : buildLocalFreeProfile(input).lookingFor,
      aiMeta: {
        provider: 'openai',
        tokenCost: 0,
      },
    }
  } catch {
    return buildLocalFreeProfile(input)
  }
}
