import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import axios from 'axios';
import SeatLayout from '../components/SeatLayout';
import Navbar from '../components/Navbar';
import './SeatChooser.css';
import { ArrowLeft, X } from 'lucide-react';

const SeatChooser = () => {
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [selectedSeatsDetails, setSelectedSeatsDetails] = useState([]);
  const [departureStation, setDepartureStation] = useState(null);
  const [arrivalStation, setArrivalStation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [availableSeats, setAvailableSeats] = useState([]);
  
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
  
  const handleSeatSelect = (seatIds, seatsDetails, allAvailableSeats) => {
    setSelectedSeatIds(seatIds);
    setSelectedSeatsDetails(seatsDetails);
    setAvailableSeats(allAvailableSeats || []);
  };
  
  const handleConfirmBooking = async () => {
    if (!selectedSeatIds.length || !departureStationId || !arrivalStationId) {
      setError('Please select at least one seat');
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
      
      // Create bookings for all selected seats
      const bookingPromises = selectedSeatIds.map(seatId => 
        axios.post('/api/bookings/create', {
          userId,
          departureStationId: parseInt(departureStationId),
          arrivalStationId: parseInt(arrivalStationId),
          seatId: seatId
        })
      );
      
      const responses = await Promise.all(bookingPromises);
      
      // Extract booking IDs
      const bookingIds = responses.map(response => response.data.id);
      
      // Store booking details for the confirmation page
      const bookingDetails = {
        bookingIds: bookingIds,
        departureStation: departureStation.station_name,
        arrivalStation: arrivalStation.station_name,
        seats: selectedSeatsDetails.map(seat => ({
          seatNumber: seat.seat_number,
          carNumber: seat.car_number
        })),
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
  
  const removeSeat = (seatId) => {
    const newSelectedSeatIds = selectedSeatIds.filter(id => id !== seatId);
    const newSelectedSeatsDetails = selectedSeatsDetails.filter(seat => seat.id !== seatId);
    
    setSelectedSeatIds(newSelectedSeatIds);
    setSelectedSeatsDetails(newSelectedSeatsDetails);
  };
  
  const handleAutoChoose = () => {
    if (availableSeats.length === 0) {
      setError('No available seats to auto-choose');
      return;
    }
    
    // Select the first available seat
    const firstAvailableSeat = availableSeats[0];
    setSelectedSeatIds([firstAvailableSeat.id]);
    setSelectedSeatsDetails([firstAvailableSeat]);
  };
  
  return (
    <>
      <Navbar />
      <div className="seat-chooser-container">
        <h2>Choose Your Seats</h2>
        
        <div className='back-div'>
         <Link to="/station-select" className="back-btn">
            <ArrowLeft size={16} />
              Back to Stations
         </Link>
        </div>
        <div className="journey-info">
        <h3>Journey from Station {departureStationId} to Station {arrivalStationId}</h3>
      </div>
        <div className="seat-selection-actions">
          <button 
            className="auto-choose-btn"
            onClick={handleAutoChoose}
          >
            Auto Choose Seat
          </button>
        </div>
        <SeatLayout 
          onSeatSelect={handleSeatSelect} 
          selectedSeatIds={selectedSeatIds}
        />
        
    
        
        {selectedSeatIds.length > 0 && (
          <div className="selected-seats-summary">
            <h3>Selected Seats ({selectedSeatIds.length})</h3>
            <div className="selected-seats-list">
              {selectedSeatsDetails.map(seat => (
                <div key={seat.id} className="selected-seat-item">
                  <span>Car {seat.car_number}, Seat {seat.seat_number}</span>
                  <button 
                    className="remove-seat-btn" 
                    onClick={() => removeSeat(seat.id)}
                  >
                    <X size={16} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {error && (
          <div className="error-message">
            {error}
          </div>
        )}
        
        <div className='container'>
          <button 
            className={`confirm-btn ${(!selectedSeatIds.length || isLoading) ? 'disabled' : ''}`}
            onClick={handleConfirmBooking}
            disabled={!selectedSeatIds.length || isLoading}
          >
            {isLoading ? 'Processing...' : `Confirm Booking (${selectedSeatIds.length} seat${selectedSeatIds.length !== 1 ? 's' : ''})`}
          </button>
        </div>
      </div>
    </>
  );
};

export default SeatChooser;