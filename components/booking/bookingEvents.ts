/** Custom event to open the booking modal from anywhere (e.g. sticky bar, card). */
export const BOOKING_MODAL_OPEN_EVENT = 'poseidon-open-booking-modal'

export function openBookingModal(): void {
  if (typeof window === 'undefined') return
  window.dispatchEvent(new CustomEvent(BOOKING_MODAL_OPEN_EVENT))
}
