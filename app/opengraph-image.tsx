import { ImageResponse } from "next/og";

/**
 * Paylaşım kartı (Open Graph / Twitter) — derin mürekkep (#14161d) zeminde
 * çivit-leylak (#a5adff) Artifact faset elmas markı + "ARTIFACT" + ince kural
 * çizgisi + "YÖNETİM PLATFORMU". Ölçülü ve yerel: harici CDN/font yok
 * (next/og varsayılan Geist fallback'i kullanılır).
 */
export const alt = "Artifact — Yönetim Platformu";
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
          background: "#14161d",
          // Sağ-üst çivit ışık — ölçülü platform ambiyansı
          backgroundImage:
            "radial-gradient(900px 520px at 84% -12%, rgba(122,132,255,0.22), transparent 62%)",
        }}
      >
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
          }}
        >
          <svg
            width="170"
            height="170"
            viewBox="0 0 48 48"
            xmlns="http://www.w3.org/2000/svg"
          >
            <g
              fill="none"
              stroke="#a5adff"
              strokeWidth="2.4"
              strokeLinejoin="round"
              strokeLinecap="round"
            >
              <path d="M24 9 40 21.5 24 40 8 21.5Z" />
              <path d="M8 21.5h32" />
              <path d="M24 9 17.2 21.5 24 40l6.8-18.5Z" />
            </g>
          </svg>

          <div
            style={{
              marginTop: 30,
              fontSize: 76,
              fontWeight: 600,
              letterSpacing: "0.22em",
              color: "#EFF0F6",
            }}
          >
            ARTIFACT
          </div>

          {/* İnce çivit kural çizgisi */}
          <div
            style={{
              width: 220,
              height: 2,
              marginTop: 26,
              marginBottom: 24,
              background: "#a5adff",
            }}
          />

          <div
            style={{
              fontSize: 26,
              letterSpacing: "0.42em",
              color: "#9BA0B4",
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
