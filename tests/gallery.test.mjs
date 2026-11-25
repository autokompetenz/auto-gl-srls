import assert from 'node:assert/strict'
import test from 'node:test'

import { toVehicleDTO } from '../server/lib/vehicles.js'

const baseCar = {
  id: 'multi-images-2024',
  name: 'AUTO GL Multi Images',
  version: 'Série 01',
  year: 2024,
  mileage: 1000,
  price: 20000,
  color: 'Graphite',
  image: '/media/config/graphite.png',
  wheels: 'Multi-spoke',
  location: 'Lyon',
  warranty: '12 mois',
  gearbox: 'Automatique',
  badges: [],
  description: '',
  equipment: [],
  isFeatured: false,
  isSold: false,
  views: 0,
}

test('vehicle DTO keeps every gallery image', () => {
  const gallery = [
    { src: '/media/one.png', caption: 'Vue 1' },
    { src: '/media/two.png', caption: 'Vue 2' },
    { src: '/media/three.png', caption: 'Vue 3' },
  ]
  const dto = toVehicleDTO({ ...baseCar, gallery })
  assert.equal(dto.gallery.length, 3)
  assert.deepEqual(dto.gallery.map(item => item.caption), ['Vue 1', 'Vue 2', 'Vue 3'])
})

test('vehicle DTO falls back to the main image when gallery is empty', () => {
  const dto = toVehicleDTO({ ...baseCar, gallery: [] })
  assert.deepEqual(dto.gallery, [{ src: baseCar.image, caption: baseCar.name }])
})

test('vehicle DTO ignores gallery entries without a source', () => {
  const dto = toVehicleDTO({
    ...baseCar,
    gallery: [{ src: '/media/one.png', caption: 'Vue 1' }, { src: '', caption: 'Vide' }, null],
  })
  assert.deepEqual(dto.gallery, [{ src: '/media/one.png', caption: 'Vue 1' }])
})
