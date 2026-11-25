import nodemailer from 'nodemailer'

let transporter = null

/** SMTP est optionnel : l'API reste fonctionnelle sans configuration. */
export function isSmtpConfigured() {
  return Boolean(process.env.SMTP_HOST && process.env.FROM_EMAIL)
}

function getTransporter() {
  if (transporter) return transporter
  const port = Number(process.env.SMTP_PORT) || 587
  transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port,
    secure: port === 465,
    auth:
      process.env.SMTP_USER || process.env.SMTP_PASS
        ? { user: process.env.SMTP_USER || '', pass: process.env.SMTP_PASS || '' }
        : undefined,
  })
  return transporter
}

/**
 * Envoi tolérant aux pannes : journalise et renvoie false, sans jamais faire
 * échouer la requête HTTP qui a déclenché l'e-mail.
 */
export async function sendMail({ to, subject, text, html }) {
  if (!isSmtpConfigured()) {
    console.warn('[mailer] SMTP non configuré : e-mail ignoré', { to, subject })
    return false
  }
  if (!to) {
    console.warn('[mailer] destinataire manquant : e-mail ignoré', { subject })
    return false
  }
  try {
    await getTransporter().sendMail({
      from: {
        name: process.env.FROM_NAME || 'AUTO GL SRLS',
        address: process.env.FROM_EMAIL,
      },
      to,
      subject,
      text,
      html,
    })
    return true
  } catch (error) {
    console.error('[mailer] échec de l\'envoi', { to, subject, message: error?.message })
    return false
  }
}

export function leadsRecipient() {
  return process.env.LEADS_EMAIL || process.env.ADMIN_EMAIL || process.env.FROM_EMAIL || ''
}

export async function sendLeadMail(lead) {
  return sendMail({
    to: leadsRecipient(),
    subject: `Nouveau message — ${lead.name}`,
    text: [
      `Nom : ${lead.name}`,
      `E-mail : ${lead.email}`,
      `Téléphone : ${lead.phone || 'non renseigné'}`,
      '',
      lead.message,
    ].join('\n'),
  })
}

export async function sendOrderNotification(order, { statusChanged, note }) {
  const lines = [
    `Bonjour ${order.customerName},`,
    '',
    `Votre commande ${order.orderNumber} est enregistrée.`,
    `Statut actuel : ${order.status}.`,
  ]
  if (note) lines.push('', `Note : ${note}`)
  lines.push('', "L'équipe AUTO GL SRLS")
  return sendMail({
    to: order.customerEmail,
    subject: `Commande ${order.orderNumber} — ${order.status}`,
    text: lines.join('\n'),
  })
}

export async function sendAlertNotification({ to, name, car }) {
  const link = process.env.APP_URL
    ? `${process.env.APP_URL.replace(/\/$/, '')}/#/vehicule/${encodeURIComponent(car.id)}`
    : `#/vehicule/${encodeURIComponent(car.id)}`
  return sendMail({
    to,
    subject: `AUTO GL SRLS — une annonce correspond à votre alerte`,
    text: [
      name ? `Bonjour ${name},` : 'Bonjour,',
      '',
      `Un véhicule correspond à vos critères : ${car.name} (${car.version}) — ${car.price} €.`,
      `Voir l'annonce : ${link}`,
      '',
      "L'équipe AUTO GL SRLS",
    ].join('\n'),
  })
}
