import { v2 as cloudinary } from 'cloudinary'

function config() {
  const cloudName = process.env.CLOUDINARY_CLOUD_NAME
  const apiKey = process.env.CLOUDINARY_API_KEY
  const apiSecret = process.env.CLOUDINARY_API_SECRET
  if (!cloudName || !apiKey || !apiSecret) return null
  cloudinary.config({ cloud_name: cloudName, api_key: apiKey, api_secret: apiSecret, secure: true })
  return cloudinary
}

export function isCloudinaryConfigured() {
  return config() !== null
}

/**
 * Signature pour un envoi direct navigateur → Cloudinary.
 * Le secret reste côté serveur : le navigateur ne reçoit que cloudName, apiKey,
 * timestamp, folder et signature. Cela évite de faire transiter les images par
 * une Vercel Function (limite de corps 4,5 Mo).
 */
export function getUploadSignature() {
  const client = config()
  if (!client) {
    const error = new Error('Cloudinary non configuré')
    error.code = 'CLOUDINARY_NOT_CONFIGURED'
    throw error
  }
  const folder = 'auto-gl'
  const timestamp = Math.floor(Date.now() / 1000)
  const signature = client.utils.api_sign_request(
    { timestamp, folder },
    process.env.CLOUDINARY_API_SECRET,
  )
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME,
    apiKey: process.env.CLOUDINARY_API_KEY,
    timestamp,
    signature,
    folder,
  }
}

/** Téléverse un buffer image et renvoie { url, publicId }. */
export function uploadImage(buffer) {
  const client = config()
  if (!client) {
    const error = new Error('Cloudinary non configuré')
    error.code = 'CLOUDINARY_NOT_CONFIGURED'
    throw error
  }
  return new Promise((resolve, reject) => {
    const stream = client.uploader.upload_stream(
      { folder: 'auto-gl', resource_type: 'image' },
      (error, result) => {
        if (error) return reject(error)
        resolve({ url: result.secure_url, publicId: result.public_id })
      },
    )
    stream.on('error', reject)
    stream.end(buffer)
  })
}

/** Supprime une image téléversée, notamment si un import multiple échoue. */
export function deleteImage(publicId) {
  const client = config()
  if (!client || !publicId) return Promise.resolve()
  return new Promise((resolve, reject) => {
    client.uploader.destroy(publicId, (error, result) => {
      if (error) return reject(error)
      resolve(result)
    })
  })
}
