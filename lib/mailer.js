import nodemailer from 'nodemailer'
import { mailDelivery, mailIntl, mailPurchase, mailStatus, mailText, normalizeMailLocale } from './mail-copy.js'

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
  return process.env.LEADS_EMAIL || process.env.FROM_EMAIL || ''
}

/** Destinataire interne des notifications de commande. */
export function orderRecipient() {
  return leadsRecipient()
}

function localeOf(order) {
  return normalizeMailLocale(order?.locale)
}

function formatEuro(value, locale) {
  return new Intl.NumberFormat(mailIntl(locale), {
    style: 'currency',
    currency: 'EUR',
    maximumFractionDigits: 0,
  }).format(Number(value) || 0)
}

function appLink(path, locale) {
  const base = String(process.env.APP_URL || '').replace(/\/$/, '')
  const localized = locale === 'it' ? path : `/${locale}${path === '/' ? '' : path}`
  return base ? `${base}${localized}` : localized
}

function vehicleLabel(order, locale) {
  const item = Array.isArray(order.items) ? order.items[0] : null
  return [item?.name, item?.version].filter(Boolean).join(' · ') || mailText(locale, 'vehicleFallback')
}

function paymentLabel(order, locale) {
  const due = Number(order.amountDue ?? order.totalPrice)
  const rate = (amount) => {
    const base = Number(order.totalPrice)
    return base > 0 ? Math.round((Number(amount) / base) * 100) : 0
  }
  if (Number(order.monthlyAmount) > 0 && Number(order.monthlyDuration) > 0) {
    return mailText(locale, 'paymentMonthly', {
      down: formatEuro(order.depositAmount, locale),
      rate: rate(order.depositAmount),
      months: order.monthlyDuration,
      amount: formatEuro(order.monthlyAmount, locale),
    })
  }
  if (Number(order.depositAmount) > 0) {
    const balance = Number(order.balanceAmount ?? due - Number(order.depositAmount))
    return mailText(locale, 'paymentDeposit', {
      amount: formatEuro(order.depositAmount, locale),
      rate: rate(order.depositAmount),
      balance: formatEuro(balance, locale),
    })
  }
  if (Number(order.discountAmount) > 0) {
    return mailText(locale, 'paymentFullDiscount', {
      amount: formatEuro(due, locale),
      rate: rate(order.discountAmount),
    })
  }
  return mailText(locale, 'paymentFull', { amount: formatEuro(due, locale) })
}

function deliveryLabel(order, locale) {
  if (order.deliveryType !== 'LIVRAISON') return mailText(locale, 'deliveryPickup')
  return mailText(locale, 'deliveryAddress', {
    address: order.address,
    zip: order.postalCode,
    city: order.city,
    country: order.country,
  })
}

/** E-mail envoyé au client, à la création ou lors d'un changement de statut. */
export function orderCustomerMail(order, { statusChanged = false, note } = {}) {
  const locale = localeOf(order)
  const t = (key, vars) => mailText(locale, key, vars)
  const due = Number(order.amountDue ?? order.totalPrice)
  const lines = [
    t('hello', { name: order.customerName }),
    '',
    statusChanged
      ? t('statusChanged', { order: order.orderNumber, status: mailStatus(locale, order.status) })
      : t('created', { order: order.orderNumber }),
    '',
    t('vehicle', { value: vehicleLabel(order, locale) }),
    t('vehiclePrice', { value: formatEuro(order.totalPrice, locale) }),
    ...(Number(order.discountAmount) > 0 ? [t('discount', { value: formatEuro(order.discountAmount, locale) })] : []),
    t('amountDue', { value: formatEuro(due, locale) }),
    t('payment', { value: paymentLabel(order, locale) }),
    deliveryLabel(order, locale),
  ]

  if (note) lines.push('', t('teamNote', { note }))

  if (!statusChanged && order.paymentIban) {
    lines.push('', t('bankHeading'))
    if (order.paymentBeneficiary) lines.push(t('beneficiary', { value: order.paymentBeneficiary }))
    lines.push(t('iban', { value: order.paymentIban }))
    if (order.paymentBic) lines.push(t('bic', { value: order.paymentBic }))
    lines.push(t('reference', { value: order.orderNumber }))
  }

  lines.push(
    '',
    t('tracking', { link: appLink(`/suivi/${encodeURIComponent(order.orderNumber)}`, locale) }),
    '',
    t('question'),
    '',
    t('team'),
  )

  return {
    to: order.customerEmail,
    subject: statusChanged
      ? t('subjectStatus', { order: order.orderNumber, status: mailStatus(locale, order.status) })
      : t('subjectCreated', { order: order.orderNumber }),
    text: lines.join('\n'),
  }
}

/** E-mail interne envoyé à l'équipe dès qu'une commande est créée. */
export function orderAdminMail(order) {
  const locale = localeOf(order)
  const t = (key, vars) => mailText(locale, key, vars)
  const due = Number(order.amountDue ?? order.totalPrice)
  const lines = [
    t('adminIntro'),
    '',
    t('adminNumber', { value: order.orderNumber }),
    t('adminDate', { value: order.createdAt || '' }),
    t('adminStatus', { value: mailStatus(locale, order.status) }),
    '',
    t('adminCustomer'),
    t('adminName', { value: order.customerName }),
    t('adminEmail', { value: order.customerEmail }),
    t('adminPhone', { value: order.customerPhone || t('notProvided') }),
    t('adminAddress', { value: `${order.address}, ${order.postalCode} ${order.city}, ${order.country}` }),
    '',
    t('adminVehicle'),
    vehicleLabel(order, locale),
    t('vehiclePrice', { value: formatEuro(order.totalPrice, locale) }),
    ...(Number(order.discountAmount) > 0 ? [t('discount', { value: formatEuro(order.discountAmount, locale) })] : []),
    t('amountDue', { value: formatEuro(due, locale) }),
    t('payment', { value: paymentLabel(order, locale) }),
    t('adminPurchase', {
      purchase: mailPurchase(locale, order.purchaseType),
      delivery: mailDelivery(locale, order.deliveryType),
    }),
  ]

  if (order.notes) lines.push('', t('adminNotes', { value: order.notes }))

  lines.push(
    '',
    t('adminLink', { link: appLink('/admin/commandes', locale) }),
    t('customerLink', { link: appLink(`/suivi/${encodeURIComponent(order.orderNumber)}`, locale) }),
  )

  return {
    to: orderRecipient(),
    subject: t('subjectAdmin', { order: order.orderNumber }),
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
  const locale = normalizeMailLocale(lead?.locale)
  return sendMail({
    to: leadsRecipient(),
    subject: mailText(locale, 'leadSubject', { name: lead.name }),
    text: [
      mailText(locale, 'leadName', { value: lead.name }),
      mailText(locale, 'leadEmail', { value: lead.email }),
      mailText(locale, 'leadPhone', { value: lead.phone || mailText(locale, 'notProvided') }),
      '',
      lead.message,
    ].join('\n'),
  })
}

export async function sendAlertNotification({ to, name, car, locale }) {
  const currentLocale = normalizeMailLocale(locale)
  const link = appLink(`/vehicule/${encodeURIComponent(car.id)}`, currentLocale)
  return sendMail({
    to,
    subject: mailText(currentLocale, 'alertSubject'),
    text: [
      name ? mailText(currentLocale, 'hello', { name }) : mailText(currentLocale, 'helloAnonymous'),
      '',
      mailText(currentLocale, 'alertBody', {
        name: car.name,
        version: car.version,
        price: formatEuro(car.price, currentLocale),
      }),
      mailText(currentLocale, 'alertLink', { link }),
      '',
      mailText(currentLocale, 'team'),
    ].join('\n'),
  })
}
