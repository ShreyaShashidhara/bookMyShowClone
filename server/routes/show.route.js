import express from 'express';
import { addShow, getShowById, getShowByFilter, updateShow, deleteShow } from '../controllers/show.controller.js';
import AuthMiddleware from '../middleware/auth.middleware.js';
import isTheatreOwnerMiddleware from '../middleware/isTheatreOwner.middleware.js';


const router = express.Router();

// Add show
router.post('/', AuthMiddleware, isTheatreOwnerMiddleware, addShow);

// Update show
router.put('/:showId', AuthMiddleware, isTheatreOwnerMiddleware, updateShow);

// delete show
router.delete('/:showId', AuthMiddleware, isTheatreOwnerMiddleware, deleteShow);

// get show by Id
router.get('/:showId', getShowById);

// get all show by movie
// get all show by theatre
router.get('/', getShowByFilter);

export default router;