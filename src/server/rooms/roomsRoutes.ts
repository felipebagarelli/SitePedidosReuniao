import { Router } from 'express'
import * as controller from './roomsController'

export const roomsRouter = Router()

roomsRouter.get('/', controller.list)
roomsRouter.get('/qrcodes', controller.qrCodes)
roomsRouter.get('/:id', controller.getById)
roomsRouter.get('/:id/qrcode', controller.qrCodePng)
roomsRouter.post('/', controller.create)
roomsRouter.patch('/:id/active', controller.updateActive)