import Image, { type ImageProps } from 'next/image'

type CoverImageProps = Omit<ImageProps, 'fill' | 'width' | 'height' | 'src'> & {
  src: string
  /** Zorunlu: srcset genişlikleri width'ten değil sizes'tan üretilsin. */
  sizes: string
  /** Adresten boyut okunamazsa (Sanity dışı görsel) kullanılacak oran. */
  fallbackWidth?: number
  fallbackHeight?: number
}

/** Sanity CDN adresinden görselin (kırpılmışsa kırpılmış) boyutu: ?w&h → rect → dosya adı (-1600x1200.jpg). */
function intrinsicDimensions(src: string): { width: number; height: number } | null {
  try {
    const u = new URL(src, 'https://cdn.sanity.io')
    const w = Number(u.searchParams.get('w'))
    const h = Number(u.searchParams.get('h'))
    if (w > 0 && h > 0) return { width: w, height: h }
    const rect = u.searchParams.get('rect')?.split(',').map(Number)
    if (rect?.length === 4 && rect[2] > 0 && rect[3] > 0) return { width: rect[2], height: rect[3] }
    const m = /-(\d+)x(\d+)\.[a-z0-9]+$/i.exec(u.pathname)
    if (m) return { width: Number(m[1]), height: Number(m[2]) }
  } catch {
    // göreli/geçersiz adres → yedek oran
  }
  return null
}

/**
 * `fill` ile aynı yerleşim (konumlandırılmış kapsayıcıyı kaplar, object-fit
 * className'den) ama <img>'e width/height öznitelikleri de yazar — `fill`
 * bunları atlıyor, denetim araçları da "boyut bilgisi yok" diye işaretliyordu.
 */
export default function CoverImage({
  src,
  className,
  fallbackWidth = 1200,
  fallbackHeight = 900,
  alt,
  ...rest
}: CoverImageProps) {
  const dims = intrinsicDimensions(src) ?? { width: fallbackWidth, height: fallbackHeight }
  return (
    <Image
      src={src}
      alt={alt}
      width={dims.width}
      height={dims.height}
      className={`absolute inset-0 h-full w-full${className ? ` ${className}` : ''}`}
      {...rest}
    />
  )
}
