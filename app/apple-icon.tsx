import { ImageResponse } from "next/og";

/**
 * apple-touch-icon — Spatial register: lavanta radyal zemin (#eaecf3)
 * üzerinde indigo orb (#6b5bd6 ailesi, ışık tepeden) içinde beyaz serif "A"
 * monogramı. `app/icon.svg`, OG kartı ve manifest renkleriyle tutarlı.
 * SVG yerine PNG üretiriz çünkü iOS apple-touch-icon SVG'yi güvenilir
 * işlemez.
 */
export const size = { width: 180, height: 180 };
export const contentType = "image/png";

export default function AppleIcon() {
  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          background: "#eaecf3",
          backgroundImage:
            "radial-gradient(220px 160px at 50% -10%, #f6f5fa 0%, rgba(246,245,250,0) 70%), radial-gradient(160px 130px at 82% 0%, rgba(212,198,255,0.5), transparent 66%), radial-gradient(150px 120px at 8% 100%, rgba(182,220,255,0.4), transparent 62%)",
        }}
      >
        {/* İndigo orb + serif "A" monogram */}
        <div
          style={{
            width: 124,
            height: 124,
            borderRadius: "50%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background:
              "radial-gradient(circle at 32% 28%, #cfc8ff 0%, #8a7ae6 48%, #6b5bd6 66%, #4030a0 100%)",
            boxShadow:
              "0 14px 26px rgba(80,64,180,0.38), 0 0 34px rgba(157,140,255,0.45), inset 0 2px 4px rgba(255,255,255,0.55), inset 0 -9px 16px rgba(38,26,96,0.4)",
          }}
        >
          <svg
            width="74"
            height="74"
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
      </div>
    ),
    { ...size },
  );
}
