import express from 'express';
import { addTheatre, deleteTheatre, getAllTheatre, getTheatreById, updateTheatre} from '../controllers/theatre.controller.js';
import authMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

//add theatre
router.post('/',authMiddleware, addTheatre);

//getTheatreById
router.get('/:theatreId', getTheatreById);

//getAllTheatre
//get theatre by Owners
router.get('/', getAllTheatre);

//update theatre
router.put('/:theatreId', updateTheatre);

//delete theatre
router.delete('/:theatreId', deleteTheatre);

export default router;