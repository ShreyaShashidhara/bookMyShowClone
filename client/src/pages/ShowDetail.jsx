import React, { useCallback, useEffect, useState } from "react";
import { useNavigate, useParams, useSearchParams } from "react-router-dom";
import { jwtToken } from "../constants/authToken";
import { stripePromise } from "../stripe";
import { Elements } from "@stripe/react-stripe-js";

import CheckoutForm from "./CheckoutForm";

const ShowPage = () => {
  const { showId } = useParams();
  const [show, setShow] = useState({});
  const [selectedSeats, setSelectedSeats] = useState(1);
  const [clientSecret, setClientSecret] = useState("");
  const [paymentError, setPaymentError] = useState("");
  const [isStartingPayment, setIsStartingPayment] = useState(false);
  let [searchParams] = useSearchParams();
  const navigate = useNavigate();

  const getAuthHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token") || jwtToken}`,
  });

  const handleUnauthorized = useCallback(() => {
    localStorage.removeItem("token");
    navigate("/login");
  }, [navigate]);

  const appearance = {
    theme: "stripe",
  };

  const handleSeatChange = (e) => {
    setSelectedSeats(Number(e.target.value));
  };

  const handleBookSeats = () => {
    const ticketPrice = Number(show.ticketPrice);

    if (!stripePromise) {
      setPaymentError("Stripe is not configured. Set REACT_APP_STRIPE_PUBLISHABLE_KEY in client/.env");
      return;
    }

    if (!Number.isFinite(ticketPrice) || ticketPrice <= 0) {
      window.alert("Ticket price is unavailable for this show");
      return;
    }

    setPaymentError("");
    setIsStartingPayment(true);

    fetch("http://localhost:5010/api/booking/get-payment-secret", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...getAuthHeaders(),
      },
      body: JSON.stringify({
        seats: Number(selectedSeats),
        price: ticketPrice,
        showId,
      }),
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        if (!res.ok) {
          throw new Error(data.message || "Unable to start payment");
        }
        if (!data.clientSecret) {
          throw new Error("The server did not return a Stripe client secret");
        }
        return data;
      })
      .then((data) => {
        if (data) {
          setClientSecret(data.clientSecret);
        }
      })
      .catch((error) => setPaymentError(error.message))
      .finally(() => setIsStartingPayment(false));
  };

  useEffect(() => {
    fetch(`http://localhost:5010/api/show/${showId}`, {
      headers: {
        ...getAuthHeaders(),
      },
    })
      .then(async (res) => {
        const data = await res.json();
        if (res.status === 401) {
          handleUnauthorized();
          return null;
        }
        return data;
      })
      .then((data) => {
        if (!data) {
          return;
        }
        setShow({
          ...data,
          availableSeats: data.totalSeats - data.bookedSeats?.length,
        });
      });
  }, [showId, handleUnauthorized]);

  useEffect(() => {
    // Call confirm booking API

    const transactionId = searchParams.get("payment_intent");

    if (transactionId) {
      fetch("http://localhost:5010/api/booking/confirm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          transactionId: searchParams.get("payment_intent"),
        }),
      })
        .then(async (res) => {
          const data = await res.json();
          if (res.status === 401) {
            handleUnauthorized();
            return null;
          }
          return data;
        })
        .then((data) => {
          navigate("/profile/bookings");
        });
    }
  }, [searchParams, navigate, handleUnauthorized]);

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Show Details</h2>
        <div className="mb-6">
          <h3 className="text-xl font-semibold mb-2">
            Theatre: {show.theatre?.name}
          </h3>
          <p className="text-gray-700 mb-2">
            <strong>Movie:</strong> {show.movie?.title}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Duration:</strong> {show.movie?.duration} min
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Show Time:</strong> {show.time}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Ticket Price:</strong>Rs. {show.ticketPrice}
          </p>
          <p className="text-gray-700 mb-2">
            <strong>Total Seats:</strong> {show.totalSeats}
          </p>
          <p className="text-gray-700 mb-6">
            <strong>Available Seats:</strong> {show.availableSeats}
          </p>
        </div>
        <div className="flex flex-col md:flex-row items-center mb-6">
          <label
            htmlFor="seats"
            className="text-gray-700 text-lg mb-2 md:mb-0 md:mr-4"
          >
            Select Seats:
          </label>
          <select
            id="seats"
            value={selectedSeats}
            onChange={handleSeatChange}
            className="shadow appearance-none border rounded py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline mb-4 md:mb-0"
          >
            {Array.from({ length: show.availableSeats }, (_, index) => (
              <option key={index + 1} value={index + 1}>
                {index + 1}
              </option>
            ))}
          </select>
          <button
            onClick={handleBookSeats}
            disabled={isStartingPayment}
            className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
          >
            {isStartingPayment ? "Loading..." : "Book Seat"}
          </button>
        </div>

        {paymentError && (
          <p className="mb-4 text-red-600" role="alert">
            {paymentError}
          </p>
        )}

        {clientSecret && (
          <Elements
            options={{
              clientSecret,
              appearance,
            }}
            stripe={stripePromise}
          >
            <CheckoutForm successUrl={window.location.href} />
          </Elements>
        )}
      </div>
    </div>
  );
};

export default ShowPage;

// http://localhost:3002/bookings?
// payment_intent=pi_3Pn9ywSHyBJaG3xB0Wo1tAP8&
// payment_intent_client_secret=pi_3Pn9ywSHyBJaG3xB0Wo1tAP8_secret_BjnCp8KnkNd1u8ABDuIvm4VMG&
// redirect_status=succeeded