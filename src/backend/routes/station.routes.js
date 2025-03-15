import { Router } from 'express';
import stationController from '../controllers/station.controller.js';

const router = Router();

router.get('/', stationController.getAllStations);
router.get('/:id', stationController.getStationById);

export default router;