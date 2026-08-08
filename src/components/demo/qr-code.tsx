import { useEffect, useRef, useState } from "react";
import QRCode from "qrcode";

/**
 * QR code réel (bibliothèque `qrcode`) rendu sur une zone dégagée de tout décor
 * pour rester scannable — exigence AE2V (charte + ergonomie).
 * Le contenu encodé est un token opaque de démonstration, jamais un identifiant
 * utilisateur en clair.
 */
export function QrCode({
  value,
  size = 200,
  label,
  className,
}: {
  value: string;
  size?: number;
  label: string;
  className?: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [error, setError] = useState(false);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    QRCode.toCanvas(canvas, value, {
      width: size,
      margin: 1,
      color: { dark: "#090908", light: "#ffffff" },
      errorCorrectionLevel: "M",
    }).catch(() => setError(true));
  }, [value, size]);

  return (
    <div className={className}>
      <div className="inline-block bg-white p-3">
        {error ? (
          <div
            style={{ width: size, height: size }}
            className="grid place-items-center text-xs font-bold text-ae2v-black"
          >
            QR indisponible
          </div>
        ) : (
          <canvas ref={canvasRef} role="img" aria-label={label} />
        )}
      </div>
    </div>
  );
}
