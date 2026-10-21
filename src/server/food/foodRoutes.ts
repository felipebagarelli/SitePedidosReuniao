import { Router } from 'express'
import * as controller from './foodController'
import { requireAdmin, requireAdminUnlessActiveFilter } from '../auth/adminAuth'


export const foodRouter = Router()


foodRouter.get('/', requireAdminUnlessActiveFilter, controller.list)
foodRouter.get('/:id', requireAdmin, controller.getById)
foodRouter.post('/', requireAdmin, controller.create)
foodRouter.put('/:id', requireAdmin, controller.update)
foodRouter.patch('/:id/active', requireAdmin, controller.updateActive)