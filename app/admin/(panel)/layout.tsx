import AdminHeader from '@/components/admin/AdminHeader'

export default function AdminPanelLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <div className="min-h-screen bg-slate-100">
      <AdminHeader />
      <main>{children}</main>
    </div>
  )
}
