'use client'

/**
 * Banka ödeme sayfasına yönlendirme sırasında gösterilen tam ekran yükleme overlay'i.
 * Tekne SVG animasyonu + dalga efekti içerir.
 */
export default function PaymentLoadingOverlay() {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        background: 'linear-gradient(160deg, #0f2557 0%, #1a3d7c 40%, #1565a8 100%)',
        gap: 32,
      }}
      aria-live="polite"
      aria-label="Ödeme sayfasına yönlendiriliyorsunuz"
    >
      <style>{`
        @keyframes boat-rock {
          0%, 100% { transform: rotate(-4deg) translateY(0px); }
          50%       { transform: rotate(4deg)  translateY(-6px); }
        }
        @keyframes wave1 {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes wave2 {
          0%   { transform: translateX(0); }
          100% { transform: translateX(-50%); }
        }
        @keyframes dots {
          0%, 20%  { content: '.';   }
          40%      { content: '..';  }
          60%      { content: '...'; }
          80%, 100%{ content: '';   }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(10px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        .payment-overlay-content {
          animation: fade-in 0.5s ease-out forwards;
        }
        .boat-icon {
          animation: boat-rock 2.2s ease-in-out infinite;
          transform-origin: center bottom;
          filter: drop-shadow(0 8px 24px rgba(0,0,0,0.4));
        }
        .loading-dots::after {
          content: '';
          animation: dots 1.5s steps(1) infinite;
        }
      `}</style>

      <div className="payment-overlay-content" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 28 }}>

        {/* Tekne SVG */}
        <div className="boat-icon">
          <svg width="100" height="100" viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg">
            {/* Yelken */}
            <path d="M50 10 L50 52 L22 52 Z" fill="white" fillOpacity="0.95"/>
            <path d="M50 10 L50 52 L76 52 Z" fill="white" fillOpacity="0.7"/>
            {/* Direk */}
            <rect x="48.5" y="8" width="3" height="50" rx="1.5" fill="white"/>
            {/* Tekne gövdesi */}
            <path d="M15 58 Q50 74 85 58 L80 68 Q50 82 20 68 Z" fill="#1f3c88"/>
            <path d="M20 68 Q50 80 80 68 L76 73 Q50 84 24 73 Z" fill="#16306e"/>
            {/* Bayrak */}
            <path d="M51.5 8 L62 14 L51.5 20 Z" fill="#e53e3e"/>
            {/* Güneş ışıkları / parlama */}
            <circle cx="78" cy="22" r="8" fill="#fbbf24" fillOpacity="0.25"/>
            <circle cx="78" cy="22" r="5" fill="#fbbf24" fillOpacity="0.5"/>
            <circle cx="78" cy="22" r="2.5" fill="#fbbf24"/>
          </svg>
        </div>

        {/* Dalga efekti */}
        <div style={{ position: 'relative', width: 220, height: 28, overflow: 'hidden', borderRadius: 14 }}>
          <svg
            style={{ position: 'absolute', top: 0, left: 0, animation: 'wave1 2s linear infinite' }}
            width="440" height="28" viewBox="0 0 440 28" fill="none"
          >
            <path
              d="M0 14 C20 4, 40 24, 60 14 C80 4, 100 24, 120 14 C140 4, 160 24, 180 14 C200 4, 220 24, 240 14 C260 4, 280 24, 300 14 C320 4, 340 24, 360 14 C380 4, 400 24, 420 14 L440 14 L440 28 L0 28 Z"
              fill="rgba(255,255,255,0.12)"
            />
          </svg>
          <svg
            style={{ position: 'absolute', top: 6, left: 0, animation: 'wave2 1.4s linear infinite reverse' }}
            width="440" height="22" viewBox="0 0 440 22" fill="none"
          >
            <path
              d="M0 11 C30 3, 60 19, 90 11 C120 3, 150 19, 180 11 C210 3, 240 19, 270 11 C300 3, 330 19, 360 11 C390 3, 420 19, 440 11 L440 22 L0 22 Z"
              fill="rgba(255,255,255,0.08)"
            />
          </svg>
        </div>

        {/* Yazılar */}
        <div style={{ textAlign: 'center', color: 'white' }}>
          <p style={{ fontSize: 17, fontWeight: 600, margin: 0, letterSpacing: '0.02em' }}>
            Güvenli ödeme sayfasına
          </p>
          <p style={{ fontSize: 17, fontWeight: 600, margin: '2px 0 0', letterSpacing: '0.02em' }}>
            yönlendiriliyorsunuz<span className="loading-dots" />
          </p>
          <p style={{ fontSize: 13, margin: '12px 0 0', color: 'rgba(255,255,255,0.65)', fontWeight: 400 }}>
            Lütfen bekleyin, sayfayı kapatmayın.
          </p>
        </div>

        {/* Güvenlik rozeti */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 8,
          background: 'rgba(255,255,255,0.1)', borderRadius: 24,
          padding: '8px 18px', border: '1px solid rgba(255,255,255,0.2)',
        }}>
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.85)" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
            <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
            <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
          </svg>
          <span style={{ fontSize: 12, color: 'rgba(255,255,255,0.85)', fontWeight: 500 }}>
            256-bit SSL ile şifreli bağlantı
          </span>
        </div>
      </div>
    </div>
  )
}
