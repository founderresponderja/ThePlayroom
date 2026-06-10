export type QuizItem = {
  id: string
  label: string
  category: string
  description?: string
}

const DYNAMICS: QuizItem[] = [
  { id: 'dom_role',      label: 'Papel dominante',    category: 'Dinâmicas', description: 'Liderar e ter controlo durante o encontro' },
  { id: 'sub_role',      label: 'Papel submisso',     category: 'Dinâmicas', description: 'Entregar o controlo ao parceiro' },
  { id: 'switch_role',   label: 'Switch (dom/sub)',   category: 'Dinâmicas', description: 'Alternar entre papéis conforme o momento' },
  { id: 'voyeurism',     label: 'Voyeurismo',          category: 'Dinâmicas', description: 'Prazer em observar' },
  { id: 'exhibitionism', label: 'Exibicionismo',       category: 'Dinâmicas', description: 'Prazer em ser observado' },
]

const LIFESTYLE: QuizItem[] = [
  { id: 'soft_swap',      label: 'Soft swap',        category: 'Lifestyle', description: 'Troca parcial, sem penetração com outro casal' },
  { id: 'full_swap',      label: 'Full swap',        category: 'Lifestyle', description: 'Troca completa com outro casal' },
  { id: 'same_room',      label: 'Mesmo quarto',     category: 'Lifestyle', description: 'Actividade no mesmo espaço que outro casal' },
  { id: 'separate_rooms', label: 'Quartos separados', category: 'Lifestyle', description: 'Actividade em espaços separados' },
  { id: 'group_play',     label: 'Grupo (3+)',        category: 'Lifestyle', description: 'Encontros com mais de duas pessoas' },
]

const ACTIVITIES: QuizItem[] = [
  { id: 'massage',       label: 'Massagem sensual',       category: 'Actividades' },
  { id: 'roleplay',      label: 'Role play',              category: 'Actividades', description: 'Fantasias com personagens ou cenários' },
  { id: 'bondage_light', label: 'Restrição suave',        category: 'Actividades', description: 'Lenços, algemas suaves, vendas' },
  { id: 'impact_light',  label: 'Impacto suave',          category: 'Actividades', description: 'Palmadas ocasionais' },
  { id: 'sensory',       label: 'Privação sensorial',     category: 'Actividades', description: 'Vendas, bloqueio de sentidos' },
  { id: 'toys',          label: 'Brinquedos',             category: 'Actividades', description: 'Uso de sex toys durante o encontro' },
  { id: 'outdoor',       label: 'Espaços semi-públicos',  category: 'Actividades', description: 'Locais com risco de ser visto (privado)' },
  { id: 'photography',   label: 'Fotografia/vídeo',       category: 'Actividades', description: 'Registo do encontro (com consentimento)' },
]

const PREFERENCES: QuizItem[] = [
  { id: 'age_gap',             label: 'Diferença de idades',       category: 'Preferências', description: 'Abertura a parceiros com diferença significativa de idade' },
  { id: 'experienced',         label: 'Parceiros experientes',     category: 'Preferências', description: 'Preferência por pessoas com experiência no lifestyle' },
  { id: 'newcomers',           label: 'Novatos no lifestyle',      category: 'Preferências', description: 'Abertura a pessoas a explorar pela primeira vez' },
  { id: 'emotional_connection', label: 'Conexão emocional primeiro', category: 'Preferências', description: 'Necessidade de conhecer bem antes de encontro físico' },
  { id: 'nsa',                 label: 'Sem envolvimento emocional', category: 'Preferências', description: 'Encontros puramente físicos e recreativos' },
]

export const questionSets: Record<string, QuizItem[]> = {
  FEMALE_SINGLE: [...DYNAMICS, ...ACTIVITIES, ...PREFERENCES,
    { id: 'unicorn', label: 'Unicórnio (terceiro num casal)', category: 'Lifestyle', description: 'Juntar-se a um casal como terceiro elemento' },
    { id: 'hotwife', label: 'Dinâmica hotwife',               category: 'Lifestyle', description: 'Contexto onde um parceiro observa/encoraja' },
  ],
  MALE_SINGLE: [...DYNAMICS, ...ACTIVITIES, ...PREFERENCES,
    { id: 'couple_join', label: 'Juntar-se a um casal', category: 'Lifestyle' },
    { id: 'cuckold',     label: 'Dinâmica cuckold',     category: 'Lifestyle' },
  ],
  COUPLE_MF: [...DYNAMICS, ...LIFESTYLE, ...ACTIVITIES, ...PREFERENCES,
    { id: 'hotwife',          label: 'Dinâmica hotwife',         category: 'Lifestyle' },
    { id: 'invite_single_f',  label: 'Convidar single feminina', category: 'Lifestyle' },
    { id: 'invite_single_m',  label: 'Convidar single masculino', category: 'Lifestyle' },
  ],
  COUPLE_MM: [...DYNAMICS, ...LIFESTYLE, ...ACTIVITIES, ...PREFERENCES,
    { id: 'invite_single_m',  label: 'Convidar single masculino', category: 'Lifestyle' },
    { id: 'couple_mm_swap',   label: 'Troca com outro casal MM',  category: 'Lifestyle' },
  ],
  COUPLE_FF: [...DYNAMICS, ...LIFESTYLE, ...ACTIVITIES, ...PREFERENCES,
    { id: 'invite_single_f',  label: 'Convidar single feminina',  category: 'Lifestyle' },
    { id: 'couple_ff_swap',   label: 'Troca com outro casal FF',  category: 'Lifestyle' },
  ],
}

export const archetypes: Record<string, { emoji: string; title: string; description: string }> = {
  'The Adventurer': { emoji: '🌋', title: 'O Aventureiro', description: 'Aberto a tudo, vives o lifestyle com intensidade e curiosidade sem limites.' },
  'The Explorer':   { emoji: '🗺️', title: 'O Explorador',  description: 'Gostas de descobrir novas experiências, com critério e ao teu ritmo.' },
  'The Curious':    { emoji: '🔍', title: 'O Curioso',     description: 'Ainda a descobrir o que o lifestyle tem para oferecer. Com calma e confiança.' },
  'The Selective':  { emoji: '💎', title: 'O Selectivo',   description: 'Qualidade acima de quantidade. Sabes exactamente o que queres.' },
}
