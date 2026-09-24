import Booking from "../model/booking.model.js";
import Stripe from "stripe";
//import {transporter} from "../index.js";

const getStripeClient = () => {
  const stripeSecretKey = process.env.STRIPE_SECRET_KEY || process.env.stripe_secret_key;

  if (!stripeSecretKey) {
    throw new Error("Stripe is not configured. Set STRIPE_SECRET_KEY in server/config/.env");
  }

  return new Stripe(stripeSecretKey);
};


export const getPaymentClientSecret = async (req, res) => {
  try {
    const stripe = getStripeClient();
    const bookingDetails = req.body;
    const seats = Number(bookingDetails.seats);
    const ticketPrice = Number(bookingDetails.price);
    const amount = Math.round(seats * ticketPrice * 100);

    if (!Number.isInteger(seats) || seats < 1 || !Number.isFinite(ticketPrice) || ticketPrice <= 0 || amount < 1) {
      return res.status(400).send({
        success: false,
        message: "Seats and ticket price must be valid positive numbers",
      });
    }

    // Create a PaymentIntent with the order amount and currency
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "inr",
      payment_method_types: ["card"],
      metadata: {
        showId: bookingDetails.showId,
        seats: String(seats),
      },
    });

    res.send({
      clientSecret: paymentIntent.client_secret,
    });
  } catch (e) {
    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

export const createBooking = async (req, res) => {
  try {
    const stripe = getStripeClient();
    // UserId > req.user (jwt token)
    // Transaction Id > req.transactionId (get transaction details from /make-payment)
    // Seats > req.seats (verify if selected seats are really available, updated bookedSeats in Show collection)
    // showId > req.showId

    const bookingDetails = req.body;

    const paymentIntent = await stripe.paymentIntents.retrieve(
      bookingDetails.transactionId
    );
    const booking = new Booking({
      ...bookingDetails,
      seats: paymentIntent.metadata.seats,
      show: paymentIntent.metadata.showId,
    });
    booking.user = req.user.id;
    await booking.save();

    const info = await transporter.sendMail({
        from: '"Chirag Goel" <xyz@gmail.com>', // sender address
        to: "x@gmail.com, y@gmail.com", // list of receivers
        subject: "Booking is confirmed", // Subject line
        text: "Hello world?", // plain text body
        html: "<b>Hello world?</b>", // html body
      });

    res.send({
      success: true,
      message: "Booking is confirm",
    });

  } catch (e) {
    console.log(e);
    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};

export const getBookingDetail = async (req, res) => {
  try {
    const bookingDetail = await Booking.find()
      .populate("user")
      .populate({
        path: "show",
        model: "shows",
        populate: {
          path: "movie",
          model: "movies",
        },
      })
      .populate({
        path: "show",
        model: "shows",
        populate: {
          path: "theatre",
          model: "theatres",
        },
      });
    res.send(bookingDetail);
  } catch (e) {
    res.status(500).send({
      success: false,
      message: e.message,
    });
  }
};