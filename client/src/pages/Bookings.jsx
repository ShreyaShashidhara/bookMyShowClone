import React, {useEffect,useRef,useState} from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { jwtToken } from '../constants/authToken';

const bookingRequests = new Map();
const confirmationRequests = new Map();

const fetchBookings = (token) => {
  if (!bookingRequests.has(token)) {
    let request;
    request = fetch("http://localhost:5010/api/booking", {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to load bookings");
      }
      return Array.isArray(data) ? data : [];
    }).finally(() => {
      if (bookingRequests.get(token) === request) {
        bookingRequests.delete(token);
      }
    });

    bookingRequests.set(token, request);
  }

  return bookingRequests.get(token);
};

const confirmPaymentAndFetchBookings = (transactionId, token) => {
  if (!confirmationRequests.has(transactionId)) {
    const request = fetch("http://localhost:5010/api/booking/confirm", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ transactionId }),
    }).then(async (res) => {
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.message || "Unable to confirm booking");
      }
      bookingRequests.delete(token);
      return fetchBookings(token);
    }).finally(() => confirmationRequests.delete(transactionId));

    confirmationRequests.set(transactionId, request);
  }

  return confirmationRequests.get(transactionId);
};

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const loadedTokenRef = useRef(null);
  const transactionId = searchParams.get("payment_intent");
  const redirectStatus = searchParams.get("redirect_status");

  useEffect(() => {
    let cancelled = false;
    const token = localStorage.getItem("token") || jwtToken;

    if (loadedTokenRef.current === token) {
      return () => {
        cancelled = true;
      };
    }

    const loadBookings = async () => {
      try {
        setIsLoading(true);
        setError("");
        const data = transactionId && redirectStatus === "succeeded"
          ? await confirmPaymentAndFetchBookings(transactionId, token)
          : await fetchBookings(token);

        if (!cancelled) {
          loadedTokenRef.current = token;
          setBookings(data);
          if (transactionId && redirectStatus === "succeeded") {
            navigate("/profile/bookings", { replace: true });
          }
        }
      } catch (requestError) {
        if (!cancelled) {
          setError(requestError.message);
          console.error("Failed to load bookings:", requestError);
        }
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    };

    loadBookings();
    return () => {
      cancelled = true;
    };
  }, [transactionId, redirectStatus, navigate]);

  const filteredBookings = bookings.filter((booking) => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) {
      return true;
    }

    return [
      booking.user?.name,
      booking.show?.name,
      booking.show?.movie?.title,
      booking.show?.theatre?.name,
    ].some((value) => value?.toLowerCase().includes(query));
  });

  const formatDate = (date) => {
    if (!date) {
      return "-";
    }

    const parsedDate = new Date(date);
    return Number.isNaN(parsedDate.getTime())
      ? "-"
      : parsedDate.toLocaleDateString();
  };

  return (
    <div className="min-h-screen p-4 bg-gray-100">
      <div className="max-w-7xl mx-auto bg-white p-8 rounded-lg shadow-lg">
        <h2 className="text-2xl font-bold mb-6">Bookings</h2>
        {error && <p className="mb-4 text-red-600" role="alert">{error}</p>}
        <div className="mb-4 flex justify-between items-center">
          <input
            type="text"
            value={searchQuery}
            onChange={(event) => setSearchQuery(event.target.value)}
            placeholder="Search bookings"
            aria-label="Search bookings by customer, movie, show, or theatre"
            className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline max-w-sm"
          />
        </div>
        <div className="overflow-x-auto">
        <table className="min-w-full bg-white">
          <thead>
            <tr>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Customer</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Movie</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Theatre</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Date</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Time</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Seats</th>
              <th className="py-2 px-4 border-b border-gray-200 text-left">Total</th>
            </tr>
          </thead>
          <tbody>
            {isLoading ? (
              <tr>
                <td className="py-4 px-4 text-gray-600" colSpan="7">Loading bookings...</td>
              </tr>
            ) : filteredBookings.length === 0 ? (
              <tr>
                <td className="py-4 px-4 text-gray-600" colSpan="7">
                  {bookings.length === 0 ? "No bookings found." : "No bookings match your search."}
                </td>
              </tr>
            ) : filteredBookings.map((booking) => (
              <tr key={booking._id} className="hover:bg-gray-50">
                <td className="py-3 px-4 border-b border-gray-200">{booking.user?.name || "-"}</td>
                <td className="py-3 px-4 border-b border-gray-200">
                  <div>{booking.show?.movie?.title || "-"}</div>
                  {booking.show?.name && <div className="text-sm text-gray-500">{booking.show.name}</div>}
                </td>
                <td className="py-3 px-4 border-b border-gray-200">{booking.show?.theatre?.name || "-"}</td>
                <td className="py-3 px-4 border-b border-gray-200">{formatDate(booking.show?.date)}</td>
                <td className="py-3 px-4 border-b border-gray-200">{booking.show?.time || "-"}</td>
                <td className="py-3 px-4 border-b border-gray-200">{booking.seats ?? "-"}</td>
                <td className="py-3 px-4 border-b border-gray-200">
                  {Number.isFinite(Number(booking.show?.ticketPrice)) && Number.isFinite(Number(booking.seats))
                    ? new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR" })
                      .format(Number(booking.show.ticketPrice) * Number(booking.seats))
                    : "-"}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        </div>
      </div>

    </div>
  );
};

export default Bookings;