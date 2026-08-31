import express from 'express';
import { getPaymentClientSecret, createBooking, getBookingDetail } from '../controllers/booking.controller.js';
import AuthMiddleware from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/get-payment-secret', AuthMiddleware, getPaymentClientSecret);

// Create Booking
router.post('/confirm', AuthMiddleware, createBooking);

// Get Booking details
router.get('/', AuthMiddleware, getBookingDetail);



export default router;