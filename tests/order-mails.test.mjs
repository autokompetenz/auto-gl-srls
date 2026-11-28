import assert from 'node:assert/strict'
import test from 'node:test'
import { orderAdminMail, orderCustomerMail, orderRecipient } from '../server/lib/mailer.js'
import { calculateOrderTotals } from '../server/lib/orders.js'

const order = {
  id: 'order_1',
  orderNumber: 'AGL-20261125-ABC123',
  createdAt: '2026-11-25T10:00:00.000Z',
  status: 'PENDING',
  customerName: 'Marie Dupont',
  customerEmail: 'marie@example.test',
  customerPhone: '0612345678',
  address: '12 rue de la Paix',
  postalCode: '75002',
  city: 'Paris',
  country: 'France',
  locale: 'fr',
  notes: 'Livraison le matin',
  purchaseType: 'ACHAT',
  deliveryType: 'LIVRAISON',
  totalPrice: 27900,
  discountAmount: 0,
  amountDue: 27900,
  depositAmount: 8370,
  balanceAmount: 19530,
  monthlyAmount: 0,
  monthlyDuration: 0,
  paymentBeneficiary: 'AUTO GL SRLS',
  paymentIban: 'IT60X0542811101000000123456',
  paymentBic: 'BPMOIT22',
  items: [{ name: 'AUTO GL Studio Silver', version: 'Série 01' }],
}

const fullOrder = { ...order, ...calculateOrderTotals({ price: 27900, paymentPlan: 'FULL' }) }
const depositOrder = { ...order, ...calculateOrderTotals({ price: 27900, paymentPlan: 'DEPOSIT' }) }
const monthlyOrder = { ...order, ...calculateOrderTotals({ price: 27900, paymentPlan: 'MONTHLY' }) }

test('le mail client confirme la commande avec le véhicule, le montant et le suivi', () => {
  const mail = orderCustomerMail(order)
  assert.equal(mail.to, 'marie@example.test')
  assert.match(mail.subject, /Confirmation de votre commande AGL-20261125-ABC123/)
  assert.match(mail.text, /AUTO GL Studio Silver · Série 01/)
  assert.match(mail.text, /27\s?900\s?€/)
  assert.match(mail.text, /IBAN : IT60X0542811101000000123456/)
  assert.match(mail.text, /\/suivi\/AGL-20261125-ABC123/)
  assert.doesNotMatch(mail.text, /<[a-z]+>/i)
})

test('le mail détaille la remise de 5 % du paiement intégral', () => {
  const mail = orderCustomerMail(fullOrder)
  assert.match(mail.text, /Remise : -1\s?395\s?€/)
  assert.match(mail.text, /Montant à payer : 26\s?505\s?€/)
  assert.match(mail.text, /26\s?505\s?€ en totalité, remise de 5 % appliquée/)
})

test('le mail précise le solde à la livraison pour l’acompte de 25 %', () => {
  const mail = orderCustomerMail(depositOrder)
  assert.match(mail.text, /6\s?975\s?€ d’acompte \(25 %\), puis 20\s?925\s?€ à la livraison/)
})

test('le mail précise l’apport de 15 % et les 60 mensualités', () => {
  const mail = orderCustomerMail(monthlyOrder)
  assert.match(mail.text, /4\s?185\s?€ à la commande \(15 %\), puis 60 mensualités de/)
})

test('le mail admin notifie la nouvelle commande au destinataire configuré', () => {
  const previous = process.env.LEADS_EMAIL
  process.env.LEADS_EMAIL = 'contatto@autoglsrls.com'
  try {
    const mail = orderAdminMail(order)
    assert.equal(mail.to, 'contatto@autoglsrls.com')
    assert.equal(orderRecipient(), 'contatto@autoglsrls.com')
    assert.match(mail.subject, /Nouvelle commande AGL-20261125-ABC123/)
    assert.match(mail.text, /Marie Dupont/)
    assert.match(mail.text, /marie@example.test/)
    assert.match(mail.text, /Livraison le matin/)
    assert.match(mail.text, /\/admin\/commandes/)
  } finally {
    if (previous === undefined) delete process.env.LEADS_EMAIL
    else process.env.LEADS_EMAIL = previous
  }
})

test('un changement de statut garde un objet mail distinct de la création', () => {
  const creation = orderCustomerMail(order)
  const update = orderCustomerMail(order, { statusChanged: true, note: 'Véhicule préparé' })
  assert.match(update.subject, /Commande AGL-20261125-ABC123 — En attente/)
  assert.match(update.text, /Véhicule préparé/)
  assert.doesNotMatch(update.text, /Coordonnées bancaires/)
  assert.notEqual(creation.subject, update.subject)
})

test('sans locale, les mails sont en italien par défaut', () => {
  const mail = orderCustomerMail({ ...order, locale: undefined })
  assert.match(mail.subject, /Conferma del tuo ordine AGL-20261125-ABC123/)
  assert.match(mail.text, /Buongiorno Marie Dupont/)
  assert.match(mail.text, /Importo da pagare/)
  assert.match(mail.text, /IBAN: IT60X0542811101000000123456/)
  assert.match(mail.text, /\/suivi\/AGL-20261125-ABC123/)
})

test('les mails client suivent la langue de la commande', () => {
  const english = orderCustomerMail({ ...order, locale: 'en' })
  assert.match(english.subject, /Order confirmation AGL-20261125-ABC123/)
  assert.match(english.text, /Hello Marie Dupont/)
  assert.match(english.text, /Amount due/)

  const german = orderCustomerMail({ ...order, locale: 'de' })
  assert.match(german.subject, /Bestellbestätigung AGL-20261125-ABC123/)
  assert.match(german.text, /Guten Tag Marie Dupont/)
  assert.match(german.text, /Zu zahlender Betrag/)

  const spanish = orderCustomerMail({ ...order, locale: 'es' })
  assert.match(spanish.subject, /Confirmación de su pedido AGL-20261125-ABC123/)
  assert.match(spanish.text, /Hola Marie Dupont/)
  assert.match(spanish.text, /Importe a pagar/)
})

test('le mail admin suit aussi la langue de la commande', () => {
  const previous = process.env.LEADS_EMAIL
  process.env.LEADS_EMAIL = 'contatto@autoglsrls.com'
  try {
    const mail = orderAdminMail({ ...order, locale: 'de' })
    assert.match(mail.subject, /Neue Bestellung AGL-20261125-ABC123/)
    assert.match(mail.text, /Fahrzeug und Zahlung/)
    assert.match(mail.text, /Kundenverfolgung/)
  } finally {
    if (previous === undefined) delete process.env.LEADS_EMAIL
    else process.env.LEADS_EMAIL = previous
  }
})
