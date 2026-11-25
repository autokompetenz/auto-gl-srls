import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'

const source = fs.readFileSync(new URL('../src/data/vehicles.ts', import.meta.url), 'utf8')

test('inventory contains eight distinct vehicle ids', () => {
  const ids = [...source.matchAll(/^\s{4}id: '([^']+)'/gm)].map(match => match[1])
  assert.equal(ids.length, 8)
  assert.equal(new Set(ids).size, 8)
})

test('every referenced media file exists locally', () => {
  const paths = [...new Set([...source.matchAll(/'(\/media\/[^']+)'/g)].map(match => match[1]))]
  assert.ok(paths.length >= 8)
  for (const path of paths) {
    assert.ok(fs.existsSync(new URL(`../public${path}`, import.meta.url)), `missing ${path}`)
  }
})

test('prices and mileages are positive numbers', () => {
  const prices = [...source.matchAll(/price: (\d+)/g)].map(match => Number(match[1]))
  const mileages = [...source.matchAll(/mileage: (\d+)/g)].map(match => Number(match[1]))
  assert.equal(prices.length, 8)
  assert.equal(mileages.length, 8)
  assert.ok(prices.every(value => value > 10000))
  assert.ok(mileages.every(value => value > 0))
})
