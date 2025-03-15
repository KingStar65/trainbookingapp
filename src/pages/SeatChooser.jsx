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
  const departureStationId = queryParams.get('departureStationId') || '1';
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        const [departureRes, arrivalRes] = await Promise.all([
          axios.get(`/api/stations/${departureStationId}`),
          axios.get(`/api/stations/${arrivalStationId}`)
        ]);
        
        setDepartureStation(departureRes.data);
        setArrivalStation(arrivalRes.data);
      } catch (err) {
        setError('Error fetching station details');
      }
    };
    
    if (departureStationId && arrivalStationId) {
      fetchStationDetails();
    } else {
      navigate('/station-select');
    }
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
      
      // Get the current user's ID (you would normally get this from context/redux)
      const userId = localStorage.getItem('userId'); // Placeholder
      
      if (!userId) {
        navigate('/login?redirect=/seat-chooser');
        return;
      }
      
      // Create the booking
      await axios.post('/api/bookings/create', {
        userId,
        departureStationId: parseInt(departureStationId),
        arrivalStationId: parseInt(arrivalStationId),
        seatId: selectedSeatId,
        travelDate: new Date().toISOString().split('T')[0] // Today's date
      });
      
      // Redirect to booking confirmation page
      navigate('/booking-confirmation');
    } catch (err) {
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
            <p>Journey: {departureStation.name} to {arrivalStation.name}</p>
          </div>
        )}
        
        <div className='back-div'>
          <Link to="/station-select">
            <button className='back-btn'>
              <ArrowLeft size={14} />
              Back
            </button>
          </Link>
        </div>
        
        <SeatLayout 
          onSeatSelect={handleSeatSelect} 
        />
        
        {selectedSeatId && (
          <div className="selected-seat-info">
            Selected Seat ID: {selectedSeatId}
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