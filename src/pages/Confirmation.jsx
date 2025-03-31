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

  const numberOfSeats = bookingDetails.seats ? bookingDetails.seats.length : 1;

  return (
    <>
      <Navbar />
      <div className="confirmation-container">
        <div className="confirmation-box">
          <div className="confirmation-header">
            <CheckCircle className="success-icon" size={60} color="#4CAF50" />
            <h2>Booking Confirmed!</h2>
            <p className="confirmation-message">
              Your {numberOfSeats > 1 ? `${numberOfSeats} seats have` : 'seat has'} been successfully booked.
            </p>
          </div>

          <div className="booking-details">
            <p>Journey: <span className='booked-highlight'>{bookingDetails.departureStation}</span> to <span className='booked-highlight'>{bookingDetails.arrivalStation}</span></p>
            
            {bookingDetails.seats ? (
              <div className="seats-list">
                <h3>Booked Seats:</h3>
                <ul className="seat-items">
                  {bookingDetails.seats.map((seat, index) => (
                    <li key={index} className="seat-item">
                      Car {seat.carNumber}, Seat {seat.seatNumber}
                    </li>
                  ))}
                </ul>
              </div>
            ) : (
              <p>Seat: <span className='booked-highlight'>{bookingDetails.seatNumber}</span></p>
            )}
          </div>
          
          <div className="confirmation-actions">
            <Link to="/bookings" className="action-button primary">
              View My Bookings
            </Link>
            <Link to="/station-select" className="action-button secondary">
              Book Another Journey
            </Link>
          </div>
        </div>
      </div>
    </>
  );
};

export default Confirmation;