import { Router } from 'express'
import * as controller from './foodController'

export const foodRouter = Router()

foodRouter.get('/', controller.list)
foodRouter.get('/:id', controller.getById)
foodRouter.post('/', controller.create)
foodRouter.put('/:id', controller.update)
foodRouter.patch('/:id/inactive', controller.setInactive)