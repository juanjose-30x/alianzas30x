import { Sidebar } from '@/components/Sidebar'

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
  return (
    <div style={{ display: 'flex', minHeight: '100dvh', background: 'var(--bg)' }}>
      <Sidebar />
      <main style={{ flex: 1, overflowY: 'auto', height: '100dvh' }}>
        {children}
      </main>
    </div>
  )
}
