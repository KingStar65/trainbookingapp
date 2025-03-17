import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar';
import axios from 'axios';
import './Bookings.css';

const Bookings = () => {
  const [bookings, setBookings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchBookings = async () => {
      try {
        // Check if user is logged in
        const userJson = localStorage.getItem('user');
        const token = localStorage.getItem('token');
        
        if (!userJson || !token) {
          setError('Please log in to view your bookings');
          setLoading(false);
          return;
        }

        const user = JSON.parse(userJson);
        
        // Fetch bookings for the user
        const response = await axios.get(`/api/bookings/user-bookings?userId=${user.id}`, {
          headers: {
            Authorization: `Bearer ${token}`
          }
        });
        
        setBookings(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching bookings:', err);
        setError('Failed to load bookings. ' + (err.response?.data?.message || err.message));
        setLoading(false);
      }
    };
    
    fetchBookings();
  }, [navigate]);

  const handleCancelBooking = async (bookingId) => {
    try {
      const token = localStorage.getItem('token');
      
      if (!token) {
        setError('Authentication required');
        return;
      }
      
      await axios.post(`/api/bookings/${bookingId}/cancel`, {}, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      
      // Refresh bookings after cancellation
      setBookings(bookings.map(booking => 
        booking.id === bookingId 
          ? { ...booking, status: 'cancelled' } 
          : booking
      ));
      
    } catch (err) {
      console.error('Error cancelling booking:', err);
      setError('Failed to cancel booking: ' + (err.response?.data?.message || err.message));
    }
  };

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="bookings-container">
          <h1 className="page-title">My Bookings</h1>
          <div className="loading-message">Loading your bookings...</div>
        </div>
      </>
    );
  }

  if (error && !bookings.length) {
    return (
      <>
        <Navbar />
        <div className="bookings-container">
          <h1 className="page-title">My Bookings</h1>
          <div className="error-message">{error}</div>
          {error.includes('Please log in') && (
            <div className="login-prompt">
              <button 
                className="login-btn" 
                onClick={() => navigate('/login')}
              >
                Go to Login
              </button>
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Navbar />
      <div className="bookings-container">
        <h1 className="page-title">My Bookings</h1>
        
        {error && <div className="error-message">{error}</div>}
        
        {bookings.length === 0 ? (
          <div className="no-bookings-message">
            <p>You don't have any bookings yet.</p>
            <button 
              className="book-now-btn" 
              onClick={() => navigate('/station-select')}
            >
              Book Now
            </button>
          </div>
        ) : (
          <div className="bookings-list">
            {bookings.map(booking => (
              <div 
                key={booking.id} 
                className={`booking-card ${booking.status === 'cancelled' ? 'cancelled' : ''}`}
              >
                <div className="booking-info">
                  <div className="booking-header">
                    <h3>Booking #{booking.id}</h3>
                    <span className={`booking-status ${booking.status}`}>
                      {booking.status === 'active' ? 'Active' : booking.status}
                    </span>
                  </div>
                  
                  <div className="booking-journey">
                    <div className="journey-stations">
                      <div className="station departure">
                        <span className="station-label">From</span>
                        <span className="station-name">{booking.departure_station}</span>
                      </div>
                      <div className="journey-arrow"></div>
                      <div className="station arrival">
                        <span className="station-label">To</span>
                        <span className="station-name">{booking.arrival_station}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="booking-details">
                    <div className="detail-item">
                      <span className="detail-label">Seat</span>
                      <span className="detail-value">{booking.seat_number}</span>
                    </div>
                  </div>
                </div>
                
                {booking.status === 'active' && (
                  <div className="booking-actions">
                    <button 
                      className="cancel-btn" 
                      onClick={() => handleCancelBooking(booking.id)}
                    >
                      Cancel Booking
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default Bookings;