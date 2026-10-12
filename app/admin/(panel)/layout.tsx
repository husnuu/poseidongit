import AdminSidebar from '@/components/admin/AdminSidebar'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 md:flex-row" style={{ fontFamily: 'var(--font-family)' }}>
      <AdminSidebar />
      <main className="min-w-0 flex-1">{children}</main>
    </div>
  )
}
