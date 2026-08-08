/**
 * Utilitaire client pour le traitement, recadrage et redimensionnement d'images via Canvas HTML5.
 */

export type AspectRatio = "1:1" | "16:9";

export function processImageFile(
  file: File,
  aspectRatio: AspectRatio = "1:1",
  targetWidth = 600,
): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement("canvas");
        const ctx = canvas.getContext("2d");
        if (!ctx) {
          reject(new Error("Impossible d'initialiser le contexte Canvas"));
          return;
        }

        let ratioMultiplier = 1;
        if (aspectRatio === "16:9") {
          ratioMultiplier = 9 / 16;
        }

        const targetHeight = Math.round(targetWidth * ratioMultiplier);
        canvas.width = targetWidth;
        canvas.height = targetHeight;

        // Calcul du centrage et de la découpe (crop object-fit: cover)
        const imgRatio = img.width / img.height;
        const targetRatio = targetWidth / targetHeight;

        let srcX = 0;
        let srcY = 0;
        let srcW = img.width;
        let srcH = img.height;

        if (imgRatio > targetRatio) {
          srcW = img.height * targetRatio;
          srcX = (img.width - srcW) / 2;
        } else {
          srcH = img.width / targetRatio;
          srcY = (img.height - srcH) / 2;
        }

        ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, targetWidth, targetHeight);
        resolve(canvas.toDataURL("image/jpeg", 0.85));
      };
      img.onerror = () => reject(new Error("Erreur de chargement de l'image"));
      img.src = e.target?.result as string;
    };
    reader.onerror = () => reject(new Error("Erreur de lecture du fichier"));
    reader.readAsDataURL(file);
  });
}
