import { Router } from 'express'
import * as controller from './ordersController'

export const ordersRouter = Router()

ordersRouter.get('/', controller.listGetAllOrders)
ordersRouter.get('/:id', controller.getById)
ordersRouter.post('/', controller.create)
ordersRouter.patch('/:id/status', controller.updateStatusById)