import { describe, it, expect } from 'vitest'
import {
  STORE_HEADER_PRESETS,
  HEADER_PAD_MIN,
  HEADER_PAD_MAX,
  HEADER_PAD_DEFAULT,
  DEFAULT_HEADER,
  softenColor,
  menuAccent,
  getStoreHeaderStyle,
} from '../lib/storeHeaderPresets'

describe('STORE_HEADER_PRESETS', () => {
  it('tiene al menos un preset', () => {
    expect(STORE_HEADER_PRESETS.length).toBeGreaterThan(0)
  })

  it('cada preset tiene id y label', () => {
    STORE_HEADER_PRESETS.forEach((p) => {
      expect(p.id).toBeTruthy()
      expect(p.label).toBeTruthy()
    })
  })
})

describe('getStoreHeaderStyle', () => {
  it('devuelve variant=marca por defecto', () => {
    const style = getStoreHeaderStyle({})
    expect(style.variant).toBe('marca')
  })

  it('respeta un preset válido', () => {
    const style = getStoreHeaderStyle({ header_preset: 'boutique', header_color: '#3B1969' })
    expect(style.variant).toBe('boutique')
  })

  it('clampa header_height al mínimo', () => {
    const style = getStoreHeaderStyle({ header_height: -999 })
    expect(style.padY).toBe(HEADER_PAD_MIN)
  })

  it('clampa header_height al máximo', () => {
    const style = getStoreHeaderStyle({ header_height: 9999 })
    expect(style.padY).toBe(HEADER_PAD_MAX)
  })

  it('usa HEADER_PAD_DEFAULT cuando height es inválido', () => {
    const style = getStoreHeaderStyle({ header_height: 'abc' })
    expect(style.padY).toBe(HEADER_PAD_DEFAULT)
  })

  it('retorna color formateado con #', () => {
    const style = getStoreHeaderStyle({ header_color: '#FF0000' })
    expect(style.color).toBe('#FF0000')
  })

  it('barIntegrated es true cuando header_bar=integrada', () => {
    const style = getStoreHeaderStyle({ header_bar: 'integrada' })
    expect(style.barIntegrated).toBe(true)
  })

  it('barIntegrated es false cuando header_bar=separada', () => {
    const style = getStoreHeaderStyle({ header_bar: 'separada' })
    expect(style.barIntegrated).toBe(false)
  })

  it('usa DEFAULT_HEADER como base', () => {
    const style = getStoreHeaderStyle(DEFAULT_HEADER)
    expect(style.variant).toBe(DEFAULT_HEADER.header_preset)
    expect(style.color).toBe(DEFAULT_HEADER.header_color)
  })
})

describe('softenColor', () => {
  it('devuelve un string rgb()', () => {
    expect(softenColor('#3B1969')).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('mezcla hacia gris oscuro (valores bajos)', () => {
    const result = softenColor('#FFFFFF')
    const [r, g, b] = result.match(/\d+/g).map(Number)
    expect(r).toBeLessThan(255)
    expect(g).toBeLessThan(255)
    expect(b).toBeLessThan(255)
  })
})

describe('menuAccent', () => {
  it('devuelve un string rgb()', () => {
    expect(menuAccent('#3B1969')).toMatch(/^rgb\(\d+, \d+, \d+\)$/)
  })

  it('aclara colores oscuros', () => {
    const dark = '#100820'
    const result = menuAccent(dark)
    const [r, g, b] = result.match(/\d+/g).map(Number)
    const [origR, origG, origB] = [0x10, 0x08, 0x20]
    expect(r + g + b).toBeGreaterThan(origR + origG + origB)
  })
})
