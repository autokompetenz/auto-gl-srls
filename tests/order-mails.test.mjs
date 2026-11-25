import assert from 'node:assert/strict'
import test from 'node:test'
import { orderAdminMail, orderCustomerMail, orderRecipient } from '../server/lib/mailer.js'

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
  notes: 'Livraison le matin',
  purchaseType: 'ACHAT',
  deliveryType: 'LIVRAISON',
  totalPrice: 27900,
  depositAmount: 8370,
  monthlyAmount: 0,
  monthlyDuration: 0,
  paymentBeneficiary: 'AUTO GL SRLS',
  paymentIban: 'IT60X0542811101000000123456',
  paymentBic: 'BPMOIT22',
  items: [{ name: 'AUTO GL Studio Silver', version: 'Série 01' }],
}

test('le mail client confirme la commande avec le véhicule, le montant et le suivi', () => {
  const mail = orderCustomerMail(order)
  assert.equal(mail.to, 'marie@example.test')
  assert.match(mail.subject, /Confirmation de votre commande AGL-20261125-ABC123/)
  assert.match(mail.text, /AUTO GL Studio Silver · Série 01/)
  assert.match(mail.text, /27\s?900\s?€/)
  assert.match(mail.text, /IBAN : IT60X0542811101000000123456/)
  assert.match(mail.text, /#\/suivi\/AGL-20261125-ABC123/)
  assert.doesNotMatch(mail.text, /<[a-z]+>/i)
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
    assert.match(mail.text, /#\/admin\/commandes/)
  } finally {
    if (previous === undefined) delete process.env.LEADS_EMAIL
    else process.env.LEADS_EMAIL = previous
  }
})

test('un changement de statut garde un objet mail distinct de la création', () => {
  const creation = orderCustomerMail(order)
  const update = orderCustomerMail(order, { statusChanged: true, note: 'Véhicule préparé' })
  assert.match(update.subject, /Commande AGL-20261125-ABC123 — PENDING/)
  assert.match(update.text, /Véhicule préparé/)
  assert.doesNotMatch(update.text, /Coordonnées bancaires/)
  assert.notEqual(creation.subject, update.subject)
})
