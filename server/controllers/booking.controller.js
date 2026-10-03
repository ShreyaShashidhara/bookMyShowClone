import Booking from "../model/booking.model.js";
import User from "../model/user.model.js";
import Stripe from "stripe";
import {transporter} from "../index.js";

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
    const userId = req.user?.id || req.user?.userId;

    if (!userId) {
      return res.status(401).send({
        success: false,
        message: "User authentication is required to create a booking",
      });
    }

    const existingBooking = await Booking.findOne({ transactionId: bookingDetails.transactionId });
    if (existingBooking) {
      return res.status(200).send({
        success: true,
        message: "Booking already exists for this transaction",
      });
    }

    const paymentIntent = await stripe.paymentIntents.retrieve(
      bookingDetails.transactionId
    );
    if (paymentIntent.status !== "succeeded") {
      return res.status(400).send({
        success: false,
        message: "Payment has not succeeded",
      });
    }

    const booking = new Booking({
      ...bookingDetails,
      user: userId,
      seats: Number(paymentIntent.metadata.seats),
      show: paymentIntent.metadata.showId,
      transactionId: bookingDetails.transactionId,
    });
    await booking.save();

    if (transporter) {
      try {
        const user = await User.findById(userId).select("name email");
        if (!user?.email) {
          throw new Error("Booking customer email address was not found");
        }

        await transporter.sendMail({
          from: `"BookMyShow" <${process.env.GMAIL_USER}>`,
          to: user.email,
          subject: "Booking is confirmed",
          text: `Hello ${user.name}, your booking is confirmed.\n\nBooking ID: ${booking.id}\nSeats: ${booking.seats}\nTransaction ID: ${booking.transactionId}`,
          html: `<p>Hello,</p><p>Your booking is confirmed.</p><p><strong>Booking ID:</strong> ${booking.id}<br><strong>Seats:</strong> ${booking.seats}<br><strong>Transaction ID:</strong> ${booking.transactionId}</p>`,
        });
      } catch (emailError) {
        console.error("Booking saved, but confirmation email failed:", emailError.message);
      }
    }

    res.send({
      success: true,
      message: "Booking is confirm",
    });

  } catch (e) {
    if (e.code === 11000 && e.keyPattern?.transactionId) {
      return res.status(200).send({
        success: true,
        message: "Booking already exists for this transaction",
      });
    }
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
          model: "movie",
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