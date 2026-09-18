import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-zinc-50" style={{ fontFamily: 'var(--font-family)' }}>
      <AdminHeader />
      <main>{children}</main>
    </div>
  )
}
