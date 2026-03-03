'use client'

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string }
  reset: () => void
}) {
  const isChunkLoad = error?.message?.includes('ChunkLoadError') ?? false

  return (
    <html lang="tr">
      <body style={{ margin: 0, fontFamily: 'system-ui, sans-serif', background: '#fafafa', minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: 24, maxWidth: 400 }}>
          <h1 style={{ fontSize: 18, color: '#18181b', marginBottom: 8 }}>
            {isChunkLoad ? 'Sayfa yüklenemedi' : 'Bir hata oluştu'}
          </h1>
          <p style={{ fontSize: 14, color: '#52525b', marginBottom: 16 }}>
            {isChunkLoad
              ? 'Önbellek veya ağ kaynaklı geçici bir sorun olabilir. Sayfayı yenilemeyi deneyin.'
              : error?.message || 'Beklenmeyen bir hata oluştu.'}
          </p>
          <button
            type="button"
            onClick={() => (window.location.href = '/')}
            style={{
              padding: '12px 24px',
              fontSize: 14,
              fontWeight: 600,
              color: '#fff',
              background: '#18181b',
              border: 'none',
              borderRadius: 12,
              cursor: 'pointer',
            }}
          >
            Yenile
          </button>
        </div>
      </body>
    </html>
  )
}
