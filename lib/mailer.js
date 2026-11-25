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

/** Destinataire interne des notifications de commande. */
export function orderRecipient() {
  return leadsRecipient()
}

function formatEuro(value) {
  return new Intl.NumberFormat('fr-FR', {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function appLink(path) {
  const base = String(process.env.APP_URL || '').replace(/\/$/, '')
  return base ? `${base}${path}` : path
}

function vehicleLabel(order) {
  const item = Array.isArray(order.items) ? order.items[0] : null
  return [item?.name, item?.version].filter(Boolean).join(' · ') || 'Véhicule'
}

function paymentLabel(order) {
  if (order.monthlyAmount > 0 && order.monthlyDuration > 0) {
    return `${formatEuro(order.depositAmount)} à la commande, puis ${order.monthlyDuration} mensualités de ${formatEuro(order.monthlyAmount)}`
  }
  if (order.depositAmount > 0) {
    return `${formatEuro(order.depositAmount)} d'acompte, puis ${formatEuro(Number(order.totalPrice) - Number(order.depositAmount))} à régler`
  }
  return `${formatEuro(order.totalPrice)} en totalité`
}

function deliveryLabel(order) {
  if (order.deliveryType !== 'LIVRAISON') return 'Retrait sur place'
  return `Livraison à ${order.address}, ${order.postalCode} ${order.city}, ${order.country}`
}

/** E-mail envoyé au client, à la création ou lors d'un changement de statut. */
export function orderCustomerMail(order, { statusChanged = false, note } = {}) {
  const lines = [
    `Bonjour ${order.customerName},`,
    '',
    statusChanged
      ? `Le statut de votre commande ${order.orderNumber} est désormais : ${order.status}.`
      : `Merci pour votre commande ${order.orderNumber}. Elle est bien enregistrée auprès d'AUTO GL SRLS.`,
    '',
    `Véhicule : ${vehicleLabel(order)}`,
    `Montant : ${formatEuro(order.totalPrice)}`,
    `Règlement : ${paymentLabel(order)}`,
    deliveryLabel(order),
  ]

  if (note) lines.push('', `Note de l’équipe : ${note}`)

  if (!statusChanged && order.paymentIban) {
    lines.push('', 'Coordonnées bancaires pour le virement :')
    if (order.paymentBeneficiary) lines.push(`Bénéficiaire : ${order.paymentBeneficiary}`)
    lines.push(`IBAN : ${order.paymentIban}`)
    if (order.paymentBic) lines.push(`BIC : ${order.paymentBic}`)
    lines.push(`Référence à indiquer : ${order.orderNumber}`)
  }

  lines.push(
    '',
    `Suivre la commande : ${appLink(`/#/suivi/${encodeURIComponent(order.orderNumber)}`)}`,
    '',
    'Une question ? Répondez à cet e-mail ou écrivez à contatto@autoglsrls.com.',
    '',
    "L’équipe AUTO GL SRLS",
  )

  return {
    to: order.customerEmail,
    subject: statusChanged
      ? `Commande ${order.orderNumber} — ${order.status} — AUTO GL SRLS`
      : `Confirmation de votre commande ${order.orderNumber} — AUTO GL SRLS`,
    text: lines.join('\n'),
  }
}

/** E-mail interne envoyé à l'équipe dès qu'une commande est créée. */
export function orderAdminMail(order) {
  const lines = [
    'Nouvelle commande reçue sur AUTO GL SRLS.',
    '',
    `Numéro : ${order.orderNumber}`,
    `Date : ${order.createdAt || ''}`,
    `Statut : ${order.status}`,
    '',
    'Client',
    `Nom : ${order.customerName}`,
    `E-mail : ${order.customerEmail}`,
    `Téléphone : ${order.customerPhone || 'non renseigné'}`,
    `Adresse : ${order.address}, ${order.postalCode} ${order.city}, ${order.country}`,
    '',
    'Véhicule et règlement',
    vehicleLabel(order),
    `Montant : ${formatEuro(order.totalPrice)}`,
    `Règlement : ${paymentLabel(order)}`,
    `Achat : ${order.purchaseType} — ${order.deliveryType}`,
  ]

  if (order.notes) lines.push('', `Notes du client : ${order.notes}`)

  lines.push(
    '',
    `Dossier admin : ${appLink('/#/admin/commandes')}`,
    `Suivi client : ${appLink(`/#/suivi/${encodeURIComponent(order.orderNumber)}`)}`,
  )

  return {
    to: orderRecipient(),
    subject: `Nouvelle commande ${order.orderNumber} — AUTO GL SRLS`,
    text: lines.join('\n'),
  }
}

export async function sendOrderNotification(order, options = {}) {
  return sendMail(orderCustomerMail(order, options))
}

/** Les deux envois de la création de commande, sans jamais la faire échouer. */
export async function sendNewOrderMails(order) {
  const [customer, admin] = await Promise.all([
    sendOrderNotification(order),
    sendMail(orderAdminMail(order)),
  ])
  return { customer, admin }
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
      "L’équipe AUTO GL SRLS",
    ].join('\n'),
  })
}
