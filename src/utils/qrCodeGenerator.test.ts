import { generateQrPng, generateQrSvg } from './qrCodeGenerator'

describe('generateQrPng', () => {
  it('gera uma imagem PNG', async () => {
    const png = await generateQrPng('http://localhost:3000/?room=abc')

    expect(png.subarray(0, 8)).toEqual(Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]))
  })
})

describe('generateQrSvg', () => {
  it('gera um SVG', async () => {
    const svg = await generateQrSvg('http://localhost:3000/?room=abc')

    expect(svg).toContain('<svg')
  })
})