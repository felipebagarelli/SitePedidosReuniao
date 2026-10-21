import { createHash, timingSafeEqual } from 'node:crypto'
import type { NextFunction, Request, Response } from 'express'

function safeEqual(a: string, b: string): boolean {
    const hashA = createHash('sha256').update(a).digest()
    const hashB = createHash('sha256').update(b).digest()
    return timingSafeEqual(hashA, hashB)
}

function unauthorized(res: Response) {
    res.set('WWW-Authenticate', 'Basic realm="Administração", charset="UTF-8"')
    return res.status(401).json({ error: 'Autenticação necessária' })
}

export function requireAdmin(req: Request, res: Response, next: NextFunction) {
    if (process.env.ADMIN_AUTH_DISABLED === 'true') return next()

    const user = process.env.ADMIN_USER
    const password = process.env.ADMIN_PASSWORD
    if (!user || !password) {
        return res.status(503).json({ error: 'Administração não configurada' })
    }

    const header = req.headers.authorization
    if (!header?.startsWith('Basic ')) return unauthorized(res)

    const decoded = Buffer.from(header.slice(6), 'base64').toString('utf8')
    const separator = decoded.indexOf(':')
    if (separator === -1) return unauthorized(res)

    const userOk = safeEqual(decoded.slice(0, separator), user)
    const passwordOk = safeEqual(decoded.slice(separator + 1), password)
    if (!(userOk && passwordOk)) return unauthorized(res)

    next()
}

export function requireAdminUnlessActiveFilter(req: Request, res: Response, next: NextFunction) {
    if (req.query.active === 'true') return next()
    return requireAdmin(req, res, next)
}