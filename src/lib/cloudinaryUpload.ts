import { apiFetch } from './api'

export type UploadSignature = {
  cloudName: string
  apiKey: string
  timestamp: number
  signature: string
  folder: string
}

export type UploadedImage = {
  url: string
  publicId: string
  name: string
}

const MAX_IMAGES = 20
const MAX_SOURCE_SIZE = 10 * 1024 * 1024
const MAX_TOTAL_SIZE = 5 * 1024 * 1024
const MAX_DIMENSION = 1600
const UPLOAD_TIMEOUT = 120_000

/**
 * Réduit les photos avant envoi : 1600 px maximum, JPEG qualité 0,8.
 * Les images non décodables sont envoyées telles quelles.
 */
async function compressImage(file: File): Promise<File> {
  if (!file.type.startsWith('image/') || file.type === 'image/gif') return file

  const url = URL.createObjectURL(file)
  try {
    const image = await new Promise<HTMLImageElement>((resolve, reject) => {
      const element = new Image()
      element.onload = () => resolve(element)
      element.onerror = () => reject(new Error('Image illisible'))
      element.src = url
    })

    const width = image.naturalWidth
    const height = image.naturalHeight
    if (!width || !height) return file

    const ratio = Math.min(MAX_DIMENSION / width, MAX_DIMENSION / height, 1)
    if (ratio === 1 && file.size <= MAX_TOTAL_SIZE) return file

    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(width * ratio))
    canvas.height = Math.max(1, Math.round(height * ratio))
    const context = canvas.getContext('2d')
    if (!context) return file
    context.drawImage(image, 0, 0, canvas.width, canvas.height)

    const blob = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/jpeg', 0.8))
    if (!blob) return file
    const name = `${file.name.replace(/\.[^.]+$/, '')}.jpg`
    return new File([blob], name, { type: 'image/jpeg', lastModified: Date.now() })
  } catch {
    return file
  } finally {
    URL.revokeObjectURL(url)
  }
}

/**
 * Envoie les photos directement au navigateur → Cloudinary avec une signature
 * produite par l'API. Le secret ne quitte jamais le serveur et les fichiers ne
 * passent pas par la limite de 4,5 Mo des Vercel Functions.
 */
export async function uploadImagesDirect(files: File[]): Promise<UploadedImage[]> {
  if (!files.length) return []
  if (files.length > MAX_IMAGES) {
    throw new Error(`Maximum ${MAX_IMAGES} images autorisées (${files.length}/${MAX_IMAGES}).`)
  }
  const oversized = files.find(file => file.size > MAX_SOURCE_SIZE)
  if (oversized) {
    throw new Error(`Image ${oversized.name} trop volumineuse (max 10 Mo).`)
  }

  const prepared = await Promise.all(files.map(compressImage))
  const total = prepared.reduce((sum, file) => sum + file.size, 0)
  if (total > MAX_TOTAL_SIZE) {
    throw new Error('Total des images trop volumineux pour l’envoi. Réduisez le nombre de photos.')
  }

  const signature = await apiFetch<UploadSignature>('/admin/upload-signature', {
    method: 'POST',
    body: {},
  })

  const uploaded: UploadedImage[] = []
  for (const [index, file] of prepared.entries()) {
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', signature.apiKey)
    form.append('timestamp', String(signature.timestamp))
    form.append('signature', signature.signature)
    form.append('folder', signature.folder)

    const controller = new AbortController()
    const timeout = setTimeout(() => controller.abort(), UPLOAD_TIMEOUT)
    let response: Response
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: 'POST', body: form, signal: controller.signal },
      )
    } catch (caught) {
      if (caught instanceof DOMException && caught.name === 'AbortError') {
        throw new Error('Délai dépassé — trop d’images ou connexion lente. Réessayez ou réduisez le nombre de photos.')
      }
      throw new Error('Envoi Cloudinary indisponible. Vérifiez votre connexion.')
    } finally {
      clearTimeout(timeout)
    }

    const data: unknown = await response.json().catch(() => ({}))
    const record = data as { secure_url?: unknown; public_id?: unknown; error?: { message?: unknown } }
    if (!response.ok || typeof record.secure_url !== 'string') {
      const message = typeof record.error?.message === 'string' ? record.error.message : `Envoi refusé pour ${file.name}.`
      throw new Error(message)
    }
    uploaded.push({
      url: record.secure_url,
      publicId: typeof record.public_id === 'string' ? record.public_id : '',
      name: files[index]?.name ?? file.name,
    })
  }
  return uploaded
}
