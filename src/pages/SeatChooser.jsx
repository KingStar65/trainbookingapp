import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SeatLayout from '../components/SeatLayout';
import Navbar from '../components/Navbar';
import './SeatChooser.css';
import { ArrowLeft } from 'lucide-react';

const SeatChooser = () => {
  const [selectedSeatId, setSelectedSeatId] = useState(null);
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
        setDepartureStation({ id: departureStationId, name: `Station ${departureStationId}` });
        setArrivalStation({ id: arrivalStationId, name: `Station ${arrivalStationId}` });
      }
    };
    
    fetchStationDetails();
  }, [departureStationId, arrivalStationId, navigate]);
  
  const handleSeatSelect = (seatId) => {
    setSelectedSeatId(seatId);
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
      
      // Create the booking - no travel date
      await axios.post('/api/bookings/create', {
        userId,
        departureStationId: parseInt(departureStationId),
        arrivalStationId: parseInt(arrivalStationId),
        seatId: selectedSeatId
      });
      
      // Redirect to booking confirmation page
      navigate('/booking-confirmation');
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
        
        {departureStation && arrivalStation && (
          <div className="journey-details">
            <h3>Journey: {departureStation.name || `Station ${departureStationId}`} to {arrivalStation.name || `Station ${arrivalStationId}`}</h3>
          </div>
        )}
        
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
            <p>You have selected Seat #{selectedSeatId}</p>
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