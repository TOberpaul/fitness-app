/**
 * Compress an image file to a JPEG data URL.
 * Target: max ~150KB, max 800px on longest side.
 */
export async function compressImage(file: File, maxSizeKB = 150, maxDimension = 800): Promise<string> {
  return new Promise((resolve, reject) => {
    const img = new Image()
    const url = URL.createObjectURL(file)
    img.onload = () => {
      URL.revokeObjectURL(url)
      let { width, height } = img
      if (width > maxDimension || height > maxDimension) {
        const ratio = Math.min(maxDimension / width, maxDimension / height)
        width = Math.round(width * ratio)
        height = Math.round(height * ratio)
      }
      const canvas = document.createElement('canvas')
      canvas.width = width
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (!ctx) { reject(new Error('Canvas not supported')); return }
      ctx.drawImage(img, 0, 0, width, height)

      // Try decreasing quality until under maxSizeKB
      let quality = 0.8
      let dataUrl = canvas.toDataURL('image/jpeg', quality)
      while (dataUrl.length > maxSizeKB * 1024 * 1.37 && quality > 0.1) {
        quality -= 0.1
        dataUrl = canvas.toDataURL('image/jpeg', quality)
      }
      resolve(dataUrl)
    }
    img.onerror = () => { URL.revokeObjectURL(url); reject(new Error('Image load failed')) }
    img.src = url
  })
}
