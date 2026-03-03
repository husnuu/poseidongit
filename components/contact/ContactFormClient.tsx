'use client'

import dynamic from 'next/dynamic'

const ContactForm = dynamic(() => import('@/components/contact/ContactForm'), { ssr: false })

interface ContactFormClientProps {
  submitLabel?: string
  successMessage?: string
}

export default function ContactFormClient(props: ContactFormClientProps) {
  return <ContactForm {...props} />
}
