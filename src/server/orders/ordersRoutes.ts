import { Router } from 'express'
import * as controller from './ordersController'
import { requireAdmin } from '../auth/adminAuth'

export const ordersRouter = Router()

ordersRouter.get('/', requireAdmin, controller.listGetAllOrders)
ordersRouter.get('/:id', requireAdmin, controller.getById)
ordersRouter.post('/', controller.create)
ordersRouter.patch('/:id/status', requireAdmin, controller.updateStatusById)
ordersRouter.patch('/status', requireAdmin, controller.updateStatusBatch)