import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SeatLayout from '../components/SeatLayout';
import Navbar from '../components/Navbar';
import './SeatChooser.css';
import { ArrowLeft } from 'lucide-react';

const SeatChooser = () => {
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  const [selectedSeatDetails, setSelectedSeatDetails] = useState(null);
  const [departureStation, setDepartureStation] = useState(null);
  const [arrivalStation, setArrivalStation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const departureStationId = queryParams.get('departureStationId');
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        // Check if we have both station IDs
        if (!departureStationId || !arrivalStationId) {
          navigate('/station-select');
          return;
        }
        
        // Validate that arrival is after departure
        if (parseInt(departureStationId) >= parseInt(arrivalStationId)) {
          setError('Invalid station selection: arrival must be after departure');
          return;
        }
        
        // Fetch station details
        const [departureRes, arrivalRes] = await Promise.all([
          axios.get(`/api/stations/${departureStationId}`),
          axios.get(`/api/stations/${arrivalStationId}`)
        ]);
        
        setDepartureStation(departureRes.data);
        setArrivalStation(arrivalRes.data);
      } catch (err) {
        console.error('Error fetching station details:', err);
        setError('Error fetching station details');
        
        // Fallback to hardcoded station names
        setDepartureStation({ id: departureStationId, station_name: `Station ${departureStationId}` });
        setArrivalStation({ id: arrivalStationId, station_name: `Station ${arrivalStationId}` });
      }
    };
    
    fetchStationDetails();
  }, [departureStationId, arrivalStationId, navigate]);
  
  const handleSeatSelect = (seatId, seatDetails) => {
    setSelectedSeatId(seatId);
    setSelectedSeatDetails(seatDetails);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedSeatId || !departureStationId || !arrivalStationId) {
      setError('Please select a seat');
      return;
    }
    
    try {
      setIsLoading(true);
      setError(null);
      
      // Get the current user's ID from localStorage
      const userJson = localStorage.getItem('user');
      if (!userJson) {
        navigate('/login?redirect=/seat-chooser');
        return;
      }
      
      const user = JSON.parse(userJson);
      const userId = user.id;
      
      // Create the booking
      const response = await axios.post('/api/bookings/create', {
        userId,
        departureStationId: parseInt(departureStationId),
        arrivalStationId: parseInt(arrivalStationId),
        seatId: selectedSeatId
      });

      // Store booking details for the confirmation page
      const bookingDetails = {
        bookingId: response.data.id,
        departureStation: departureStation.station_name,
        arrivalStation: arrivalStation.station_name,
        seatNumber: selectedSeatDetails.seat_number,
        carNumber: selectedSeatDetails.car_number,
        userId: userId
      };
      
      // Save to localStorage as fallback mechanism
      localStorage.setItem('recentBooking', JSON.stringify(bookingDetails));
      
      // Navigate to booking confirmation page with the details
      navigate('/booking-confirmation', { 
        state: { bookingDetails }
      });
    } catch (err) {
      console.error('Error creating booking:', err);
      setError(err.response?.data?.message || 'Error creating booking');
      setIsLoading(false);
    }
  };
  
  return (
    <>
      <Navbar />
      <div className="seat-chooser-container">
        <h2>Choose Your Seat</h2>
        
        <div className='back-div'>
          <Link to="/station-select">
            <button className='back-btn'>
              <ArrowLeft size={14} />
              Back to Stations
            </button>
          </Link>
        </div>
        
        <SeatLayout 
          onSeatSelect={handleSeatSelect} 
        />
        
        {selectedSeatId && (
          <div className="selected-seat-info">
            <p>You have selected Seat #{selectedSeatDetails?.seat_number}</p>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className='container'>
          <button 
            className={`confirm-btn ${(!selectedSeatId || isLoading) ? 'disabled' : ''}`}
            onClick={handleConfirmBooking}
            disabled={!selectedSeatId || isLoading}
          >
            {isLoading ? 'Processing...' : 'Confirm Booking'}
          </button>
        </div>
      </div>
    </>
  );
};

export default SeatChooser;