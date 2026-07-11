import { ImageResponse } from "next/og";

/**
 * apple-touch-icon — derin mürekkep (#14161d) zeminde çivit-leylak (#a5adff)
 * Artifact faset elmas markı. Platform `app/icon.svg` ve manifest tema
 * rengiyle tutarlı. SVG yerine PNG üretiriz çünkü iOS apple-touch-icon
 * SVG'yi güvenilir işlemez.
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
          background: "#14161d",
        }}
      >
        <svg
          width="116"
          height="116"
          viewBox="0 0 48 48"
          xmlns="http://www.w3.org/2000/svg"
        >
          <g
            fill="none"
            stroke="#a5adff"
            strokeWidth="2.6"
            strokeLinejoin="round"
            strokeLinecap="round"
          >
            <path d="M24 9 40 21.5 24 40 8 21.5Z" />
            <path d="M8 21.5h32" />
            <path d="M24 9 17.2 21.5 24 40l6.8-18.5Z" />
          </g>
        </svg>
      </div>
    ),
    { ...size },
  );
}
