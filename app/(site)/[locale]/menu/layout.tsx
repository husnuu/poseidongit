import { Poppins } from 'next/font/google'

const poppins = Poppins({
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

export default function MenuLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className={`${poppins.className} min-h-screen bg-white text-zinc-900 antialiased`}>
      {children}
    </div>
  )
}
