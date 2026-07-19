import { ImageResponse } from "next/og";

/**
 * apple-touch-icon — Amuletta yay/halka negatif-A markası.
 * iOS SVG’yi güvenilir işlemez; PNG üretiriz.
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
        }}
      >
        <svg
          width="124"
          height="124"
          viewBox="0 0 100 100"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path
            fill="#6b5bd6"
            d="M38.5 12C20.5 18.5 11.5 34 11.5 48.5C11.5 67 26.5 81 44 81C35.5 81 25.5 71.5 25.5 48.5C25.5 31.5 31.5 18.5 38.5 12Z"
          />
          <path
            fill="#6b5bd6"
            d="M61.5 12C79.5 18.5 88.5 34 88.5 48.5C88.5 67 73.5 81 56 81C64.5 81 74.5 71.5 74.5 48.5C74.5 31.5 68.5 18.5 61.5 12Z"
          />
          <ellipse cx="50" cy="16.5" rx="5.5" ry="4.2" fill="#6b5bd6" />
          <path fill="#6b5bd6" d="M50 52 L41.5 65.5 L58.5 65.5 Z" />
        </svg>
      </div>
    ),
    { ...size },
  );
}
