'use client'

import dynamic from 'next/dynamic'
import type { ContactFormProps } from '@/components/contact/ContactForm'

const ContactForm = dynamic(() => import('@/components/contact/ContactForm'), { ssr: false })

export default function ContactFormClient(props: ContactFormProps) {
  return <ContactForm {...props} />
}
