# Rate Limiting Suggestions for Booking APIs

To reduce brute-force and abuse risk on public booking endpoints, consider adding rate limiting to:

- **POST /api/bookings** – create booking (web form)
- **GET /api/booking** – load booking (manage page; requires `bookingId` + `email`)
- **POST /api/booking/cancel** – cancel booking
- **POST /api/booking/change-date** – change date

## Suggested approach

1. **By IP (recommended for anonymous endpoints)**  
   Limit requests per client IP per time window, e.g.:
   - `/api/bookings` (POST): e.g. **10 requests per minute** per IP (prevents mass booking spam).
   - `/api/booking` (GET), `/api/booking/cancel` (POST), `/api/booking/change-date` (POST): e.g. **20–30 requests per minute** per IP (allows normal use, limits email/bookingId guessing).

2. **Implementation options**
   - **Vercel:** Use Vercel’s rate limiting (e.g. [@upstash/ratelimit](https://github.com/upstash/ratelimit) with Redis, or Vercel KV).
   - **Next.js middleware:** In `middleware.ts`, read `x-forwarded-for` or `x-real-ip`, maintain a small store (e.g. Upstash Redis or in-memory with a short TTL) and return `429 Too Many Requests` when the limit is exceeded.
   - **Per-route:** Alternatively, implement the same logic inside each route handler and return `429` with a `Retry-After` header when over limit.

3. **Suggested limits (starting point)**

   | Endpoint                     | Suggested limit (per IP) |
   |-----------------------------|---------------------------|
   | POST /api/bookings         | 10 req / 1 min            |
   | GET /api/booking           | 20 req / 1 min            |
   | POST /api/booking/cancel   | 10 req / 1 min            |
   | POST /api/booking/change-date | 10 req / 1 min         |

4. **Response when over limit**
   - Status: **429 Too Many Requests**
   - Body: `{ "error": "Çok fazla istek. Lütfen bir dakika sonra tekrar deneyin." }`
   - Header: `Retry-After: 60` (seconds)

5. **Optional: by email**
   - For GET/POST `/api/booking*`, you can also (or instead) limit by `email` when present, to slow down targeted guessing of `bookingId` for a known email. Example: 5 failed attempts per email per 15 minutes, then require a short backoff.

These are suggestions only; adjust limits and storage (e.g. Redis vs in-memory) to your traffic and hosting environment.
