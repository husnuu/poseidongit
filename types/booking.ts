/**
 * Bookings collection document shape.
 * Used for type safety when reading/writing bookings.
 */
export type Booking = {
  tourId: string
  date: string // "YYYY-MM-DD"
  classId: string // "eco" | "premium" | "first" etc.
  counts: {
    adult: number
    child: number
    infant: number
  }
  status: string // "pending" | "paid" | "cancelled" | "refunded" | ...
}
