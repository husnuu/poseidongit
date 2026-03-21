/** Site Ayarları > Üst duyuru çubuğu (Sanity `siteSettings.announcementBar`) */
export type AnnouncementBarIcon =
  | 'none'
  | 'megaphone'
  | 'info'
  | 'bell'
  | 'sparkles'
  | 'tag'
  | 'percent'
  | 'anchor'
  | 'calendar'
  | 'ship'
  | 'star'

export type AnnouncementBarData = {
  enabled?: boolean | null
  text?: string | null
  icon?: string | null
  linkUrl?: string | null
}
