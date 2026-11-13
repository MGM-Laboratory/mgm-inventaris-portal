"use client";

import QRCode from "qrcode";

/** QR selalu hitam di atas putih, apa pun tema, agar mudah dipindai. */
export function QrCode({
  value,
  size = 160,
  label,
}: {
  value: string;
  size?: number | string;
  label: string;
}) {
  const qr = QRCode.create(value, { errorCorrectionLevel: "M" });
  const n = qr.modules.size;
  const data = qr.modules.data;
  let d = "";
  for (let r = 0; r < n; r++) {
    for (let c = 0; c < n; c++) {
      if (data[r * n + c]) d += `M${c} ${r}h1v1h-1z`;
    }
  }
  const quiet = 2;
  return (
    <svg
      viewBox={`${-quiet} ${-quiet} ${n + quiet * 2} ${n + quiet * 2}`}
      width={size}
      height={size}
      role="img"
      aria-label={label}
      shapeRendering="crispEdges"
    >
      <rect
        x={-quiet}
        y={-quiet}
        width={n + quiet * 2}
        height={n + quiet * 2}
        fill="#ffffff"
      />
      <path d={d} fill="#0e1116" />
    </svg>
  );
}
