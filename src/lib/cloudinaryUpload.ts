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

const MAX_FILES = 12
const MAX_FILE_SIZE = 5 * 1024 * 1024

/**
 * Envoie les photos directement à Cloudinary avec une signature produite par
 * l'API. Le secret Cloudinary ne quitte jamais le serveur et les fichiers ne
 * passent pas par la limite de 4,5 Mo des Vercel Functions.
 */
export async function uploadImagesDirect(files: File[]): Promise<UploadedImage[]> {
  if (!files.length) return []
  if (files.length > MAX_FILES) {
    throw new Error(`Maximum ${MAX_FILES} images par véhicule.`)
  }
  const oversized = files.find((file) => file.size > MAX_FILE_SIZE)
  if (oversized) {
    throw new Error(`« ${oversized.name} » dépasse 5 Mo.`)
  }

  const signature = await apiFetch<UploadSignature>('/admin/upload-signature', {
    method: 'POST',
    body: {},
  })

  const uploaded: UploadedImage[] = []
  for (const file of files) {
    const form = new FormData()
    form.append('file', file)
    form.append('api_key', signature.apiKey)
    form.append('timestamp', String(signature.timestamp))
    form.append('signature', signature.signature)
    form.append('folder', signature.folder)

    let response: Response
    try {
      response = await fetch(
        `https://api.cloudinary.com/v1_1/${encodeURIComponent(signature.cloudName)}/image/upload`,
        { method: 'POST', body: form },
      )
    } catch {
      throw new Error('Envoi Cloudinary indisponible. Vérifiez votre connexion.')
    }

    const data: unknown = await response.json().catch(() => ({}))
    const record = data as { secure_url?: unknown; public_id?: unknown; error?: { message?: unknown } }
    if (!response.ok || typeof record.secure_url !== 'string') {
      const message = typeof record.error?.message === 'string' ? record.error.message : 'Envoi Cloudinary refusé.'
      throw new Error(message)
    }
    uploaded.push({
      url: record.secure_url,
      publicId: typeof record.public_id === 'string' ? record.public_id : '',
      name: file.name,
    })
  }
  return uploaded
}
