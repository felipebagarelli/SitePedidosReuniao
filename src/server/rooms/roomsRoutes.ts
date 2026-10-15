import { Router } from 'express';
import * as controller from './roomsController';

export const roomsRouter = Router();

roomsRouter.get('/', controller.list);
roomsRouter.get('/:id', controller.getById);
roomsRouter.post('/', controller.create);
roomsRouter.patch('/:id/active', controller.updateActive);

