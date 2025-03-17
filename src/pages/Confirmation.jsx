import React, { useEffect, useState } from 'react';
import Navbar from '../components/Navbar';
import './Confirmation.css';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { CheckCircle } from 'lucide-react';

const Confirmation = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [bookingDetails, setBookingDetails] = useState(null);

  useEffect(() => {
    // Check if booking details were passed in location state
    if (location.state && location.state.bookingDetails) {
      setBookingDetails(location.state.bookingDetails);
    } else {
      // Try to get the most recent booking from localStorage as fallback
      const recentBooking = localStorage.getItem('recentBooking');
      if (recentBooking) {
        setBookingDetails(JSON.parse(recentBooking));
      }
    }
  }, [location]);

  // If no booking details available, show a message
  if (!bookingDetails) {
    return (
      <>
        <Navbar />
        <div className="confirmation-container">
          <div className="confirmation-box error">
            <h2>Booking Information Not Available</h2>
            <p>Sorry, we couldn't retrieve your booking information.</p>
            <div className="confirmation-actions">
              <Link to="/station-select" className="action-button primary">
                Book a New Journey
              </Link>
              <Link to="/bookings" className="action-button secondary">
                View All Bookings
              </Link>
            </div>
          </div>
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="confirmation-container">
        <div className="confirmation-box">
          <div className="confirmation-header">
            <CheckCircle className="success-icon" size={60} color="#4CAF50" />
            <h2>Booking Confirmed!</h2>
            <p className="confirmation-message">
              Your seat has been successfully booked.
            </p>
          </div>

          <div className="booking-details">
            You have successfully booked station: <span className='booked-highlight'>{bookingDetails.departureStation}</span> to <span className='booked-highlight'>{bookingDetails.arrivalStation}</span> and seat: <span className='booked-highlight'>{bookingDetails.seatNumber}</span>
          </div>
          <div className="confirmation-actions">
            <Link to="/bookings" className="action-button primary">
              View My Bookings
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Confirmation;