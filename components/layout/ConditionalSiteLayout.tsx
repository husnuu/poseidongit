'use client'

import { usePathname } from 'next/navigation'
import Header from '@/components/layout/Header'
import Footer from '@/components/layout/Footer'

export default function ConditionalSiteLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const pathname = usePathname() ?? ''
  const isAdmin = pathname.startsWith('/admin')

  if (isAdmin) {
    return <>{children}</>
  }

  return (
    <>
      <Header />
      {children}
      <Footer />
    </>
  )
}
