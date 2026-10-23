import { Router } from 'express'
import multer from 'multer'
import { randomUUID } from 'node:crypto'
import { mkdirSync } from 'node:fs'
import { BadRequestError } from '../errors'
import { requireAdmin } from '../auth/adminAuth'

const UPLOAD_DIR = 'uploads'
const EXTENSIONS: Record<string, string> = {
    'image/jpeg': '.jpg',
    'image/png': '.png',
    'image/webp': '.webp',
}

mkdirSync(UPLOAD_DIR, { recursive: true })

const upload = multer({
    storage: multer.diskStorage({
        destination: UPLOAD_DIR,
        filename: (_req, file, cb) => cb(null, randomUUID() + (EXTENSIONS[file.mimetype] ?? '')),
    }),
    limits: { fileSize: 2 * 1024 * 1024 },
    fileFilter: (_req, file, cb) => {
        if (file.mimetype in EXTENSIONS) {
            cb(null, true)
        } else {
            cb(new BadRequestError('Envie uma imagem JPG, PNG ou WebP'))
        }
    },
})

export const uploadsRouter = Router()

uploadsRouter.post('/', requireAdmin, upload.single('image'), (req, res) => {
    if (!req.file) {
        throw new BadRequestError('Nenhum arquivo enviado')
    }

    res.status(201).json({ url: `/uploads/${req.file.filename}` })
})
