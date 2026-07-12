import { ImageResponse } from "next/og";

/**
 * Paylaşım kartı (Open Graph / Twitter) — Spatial register: lavanta radyal
 * zemin (#eaecf3 + leylak/gök ışık havuzları) üzerinde indigo orb (üstten
 * ışıklı küre, #6b5bd6 ailesi) içinde beyaz serif "A" monogramı +
 * "AMULETTA" + ince çivit kural + "YÖNETİM PLATFORMU". Ölçülü ve yerel:
 * harici CDN/font yok (serif A el çizimi SVG; metin next/og varsayılanı).
 */
export const alt = "Amuletta — Yönetim Platformu";
export const size = { width: 1200, height: 630 };
export const contentType = "image/png";

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          background: "#eaecf3",
          // Spatial lavanta zemin — tepe radyali + leylak/gök ışık havuzları
          backgroundImage:
            "radial-gradient(1200px 700px at 50% -20%, #f6f5fa 0%, rgba(246,245,250,0) 60%), radial-gradient(760px 520px at 80% -8%, rgba(212,198,255,0.55), transparent 62%), radial-gradient(640px 460px at 6% 108%, rgba(182,220,255,0.4), transparent 58%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          {/* İndigo orb — ışık tepeden (32% 28% highlight), lavanta zemine
              yumuşak indigo glow + taban gölgesi */}
          <div
            style={{
              width: 170,
              height: 170,
              borderRadius: "50%",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              background:
                "radial-gradient(circle at 32% 28%, #cfc8ff 0%, #8a7ae6 48%, #6b5bd6 66%, #4030a0 100%)",
              boxShadow:
                "0 24px 44px rgba(80,64,180,0.38), 0 0 60px rgba(157,140,255,0.45), inset 0 2px 5px rgba(255,255,255,0.55), inset 0 -12px 22px rgba(38,26,96,0.4)",
            }}
          >
            {/* Serif "A" monogram — kontrastlı çift stem + taban serifleri */}
            <svg
              width="100"
              height="100"
              viewBox="0 0 48 48"
              xmlns="http://www.w3.org/2000/svg"
            >
              <g stroke="#ffffff" fill="none" strokeLinecap="round">
                <path d="M24 10.8 14.6 36.6" strokeWidth="1.7" />
                <path d="M24 10.8 33.4 36.6" strokeWidth="3.1" />
                <path d="M16.9 28.4h14.2" strokeWidth="1.7" />
                <path d="M11.4 36.6h6.4" strokeWidth="1.7" />
                <path d="M30.2 36.6h6.4" strokeWidth="1.7" />
              </g>
            </svg>
          </div>

          <div
            style={{
              marginTop: 30,
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: "#242835",
            }}
          >
            AMULETTA
          </div>

          {/* İnce çivit kural çizgisi */}
          <div
            style={{
              width: 220,
              height: 2,
              marginTop: 26,
              marginBottom: 24,
              background: "#6b5bd6",
            }}
          />

          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.42em",
              color: "#6f7488",
            }}
          >
            YÖNETİM PLATFORMU
          </div>
        </div>
      </div>
    ),
    { ...size },
  );
}
