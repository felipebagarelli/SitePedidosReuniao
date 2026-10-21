import { Router } from 'express'
import * as controller from './roomsController'
import { requireAdmin } from '../auth/adminAuth'

export const roomsRouter = Router()

roomsRouter.get('/', requireAdmin, controller.list)
roomsRouter.get('/qrcodes', requireAdmin, controller.qrCodes)
roomsRouter.get('/:id', controller.getById)
roomsRouter.get('/:id/qrcode', requireAdmin, controller.qrCodePng)
roomsRouter.post('/', requireAdmin, controller.create)
roomsRouter.patch('/:id/active', requireAdmin, controller.updateActive)