import { client, safeSanityImageUrl } from '@/lib/sanity'
import { menuItemsQuery } from '@/lib/queries'
import { getTripsForDate, parseTripKey } from '@/lib/crew/manifest'
import { getBarOrdersForTrip } from '@/lib/crew/barOrders'
import BarTripClient, { type CrewMenuItem } from '@/components/crew/BarTripClient'

export const dynamic = 'force-dynamic'

type MenuItemRaw = {
  _id: string
  title: string
  category: string
  price: number
  inStock?: boolean | null
  image?: { asset?: { _ref?: string; _type?: string } } | null
}

export default async function CrewBarTripPage({
  params,
}: {
  params: Promise<{ tripKey: string }>
}) {
  const { tripKey: rawTripKey } = await params
  const tripKey = decodeURIComponent(rawTripKey)
  const { tourId, date, time } = parseTripKey(tripKey)

  const [orders, menuRaw, trips] = await Promise.all([
    getBarOrdersForTrip(tourId, date, time),
    client.fetch<MenuItemRaw[]>(menuItemsQuery),
    getTripsForDate(date),
  ])

  const menu: CrewMenuItem[] = (menuRaw ?? [])
    .filter((m) => m.inStock !== false)
    .map((m) => ({
      id: m._id,
      title: m.title,
      category: m.category,
      price: m.price,
      imageUrl: safeSanityImageUrl(m.image, (b) => b.width(200).height(200).fit('crop').auto('format')),
    }))

  const tourTitle = trips.find((t) => t.tripKey === tripKey)?.tourTitle ?? orders[0]?.tourTitle ?? '—'

  return (
    <BarTripClient
      tripKey={tripKey}
      tourId={tourId}
      tourTitle={tourTitle}
      tripDate={date}
      tripTime={time}
      initialOrders={orders}
      menu={menu}
    />
  )
}
