export type Programa = {
  slug: string
  nombre: string
  precio_usd: number
  duracion: string
  pitch: string          // una línea para el mensaje de outreach
  ideal_para: string[]   // cargos/roles target
  areas_match: string[]  // ids de áreas del diagnóstico que aplican
}

export const PROGRAMAS_30X: Programa[] = [
  {
    slug: 'ai-sales',
    nombre: 'AI Sales',
    precio_usd: 1950,
    duracion: '4 semanas',
    pitch: 'Pipeline B2B 24/7 con IA — prospecta, califica y cierra sin agrandar el equipo.',
    ideal_para: ['Gerente de Ventas', 'Director Comercial', 'VP Sales', 'Head of Sales', 'SDR', 'BDR', 'Account Executive', 'Jefe de Ventas'],
    areas_match: ['ventas', 'comercial'],
  },
  {
    slug: 'sales-machine',
    nombre: 'Sales Machine',
    precio_usd: 1990,
    duracion: '8 semanas',
    pitch: 'Playbook B2B completo: desde generación de demanda hasta cierre y expansión.',
    ideal_para: ['Director Comercial', 'VP Sales', 'Country Manager', 'Gerente Regional'],
    areas_match: ['ventas', 'comercial', 'mercadeo'],
  },
  {
    slug: 'growth-rockstar',
    nombre: 'Growth Rockstar',
    precio_usd: 1295,
    duracion: '8 semanas',
    pitch: 'Motor de adquisición, retención y monetización — crecer sin quemar presupuesto.',
    ideal_para: ['Growth Manager', 'Marketing Manager', 'Head of Marketing', 'Gerente de Mercadeo', 'CMO', 'Director de Marketing'],
    areas_match: ['mercadeo', 'marketing', 'gestion-humana'],
  },
  {
    slug: 'ai-for-executives',
    nombre: 'AI for Executives',
    precio_usd: 3000,
    duracion: '8 semanas',
    pitch: 'Estrategia, gobernanza y business case de IA para tomar decisiones que importan.',
    ideal_para: ['CEO', 'COO', 'CTO', 'CFO', 'CIO', 'VP', 'Director General', 'Gerente General', 'Presidente'],
    areas_match: ['direccion', 'estrategia', 'financiero'],
  },
  {
    slug: 'hardcore-ai',
    nombre: 'Hardcore AI',
    precio_usd: 1500,
    duracion: '4 semanas',
    pitch: 'Construye agentes, automatizaciones y productos IA con código real.',
    ideal_para: ['CTO', 'Tech Lead', 'Desarrollador', 'Engineer', 'Data Scientist', 'VP Engineering', 'Head of Tech'],
    areas_match: ['tecnologia', 'it', 'datos'],
  },
  {
    slug: 'achievers',
    nombre: 'Achievers',
    precio_usd: 1500,
    duracion: '8 semanas',
    pitch: 'De mindset a MVP desplegado — para quien quiere ejecutar proyectos IA de verdad.',
    ideal_para: ['Profesional independiente', 'Emprendedor', 'Manager', 'Jefe de Proyecto'],
    areas_match: ['operaciones', 'proyectos', 'general'],
  },
  {
    slug: 'operaciones',
    nombre: 'Operaciones con IA',
    precio_usd: 0, // a la medida
    duracion: 'A la medida',
    pitch: 'Automatización de procesos operativos con IA — reducción de carga y errores.',
    ideal_para: ['Director de Operaciones', 'COO', 'Gerente de Operaciones', 'Jefe de Logística', 'Head of Operations'],
    areas_match: ['operaciones', 'logistica', 'supply-chain'],
  },
]

export function sugerirPrograma(cargo: string, industria: string): Programa {
  const c = (cargo ?? '').toLowerCase()
  const i = (industria ?? '').toLowerCase()

  if (/ceo|gerente general|director general|presidente|coo|country/.test(c)) return getProg('ai-for-executives')
  if (/cto|tech|engineer|developer|data|it |sistemas/.test(c)) return getProg('hardcore-ai')
  if (/venta|sales|comercial|sdr|bdr|account/.test(c)) return getProg('ai-sales')
  if (/market|growth|adquisic|cmо/.test(c)) return getProg('growth-rockstar')
  if (/operac|logist|supply|coo|proceso/.test(c)) return getProg('operaciones')
  if (/financi|cfo|contab|tesor/.test(c)) return getProg('ai-for-executives')

  // Por industria si el cargo no matchea
  if (/tech|software|saas|fintech/.test(i)) return getProg('hardcore-ai')
  if (/retail|e-commerce|consumo/.test(i)) return getProg('ai-sales')

  return getProg('achievers') // fallback
}

function getProg(slug: string): Programa {
  return PROGRAMAS_30X.find(p => p.slug === slug) ?? PROGRAMAS_30X[5]
}
