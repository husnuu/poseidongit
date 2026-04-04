/**
 * Response shape for GET /api/availability?tourId=...&date=YYYY-MM-DD
 * Capacity from Sanity, booked from Supabase, remaining = capacity - booked.
 */
export type ClassAvailability = {
  capacity: number
  booked: number
  remaining: number
}

export type Availability = {
  tourId: string
  date: string // YYYY-MM-DD
  classes: Record<string, ClassAvailability> // classId -> { capacity, booked, remaining }
  /** First Class için o tarihte dolu loca ID'leri (L1–L10). Her zaman dizi (boş olabilir). */
  firstClassLocasReserved: string[]
}
