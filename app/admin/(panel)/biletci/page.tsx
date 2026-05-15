import { redirect } from 'next/navigation'

/** Eski URL; middleware de `/biletci`ye yönlendirir — tip üretimi için dosya tutulur. */
export default function AdminBiletciLegacyRedirect() {
  redirect('/biletci')
}
