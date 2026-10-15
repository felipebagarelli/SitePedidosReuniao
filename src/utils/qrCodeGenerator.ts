import QRCode from 'qrcode'

const QR_OPTIONS = {
  errorCorrectionLevel: 'M' as const,
  margin: 2,
}

export async function generateQrPng(text: string, size = 400): Promise<Buffer> {
  return QRCode.toBuffer(text, { ...QR_OPTIONS, type: 'png', width: size })
}

export async function generateQrSvg(text: string): Promise<string> {
  return QRCode.toString(text, { ...QR_OPTIONS, type: 'svg' })
}