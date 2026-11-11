import { Source_Serif_4 } from 'next/font/google'

/** Partner tanıtım/giriş sayfasının başlık yazı tipi (yalnızca /partner/giris'te yüklenir). */
const partnerSerif = Source_Serif_4({
  subsets: ['latin', 'latin-ext'],
  style: ['normal', 'italic'],
  display: 'swap',
})

export const SERIF = partnerSerif.className
