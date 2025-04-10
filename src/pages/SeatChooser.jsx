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
  const [seatCount, setSeatCount] = useState(1);
  
  const navigate = useNavigate();
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const departureStationId = queryParams.get('departureStationId');
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  useEffect(() => {
    const fetchStationDetails = async () => {
      try {
        
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
  
  const findContiguousSeats = (seats, count) => {
    // Parse seat numbers to identify row and column
    const parsedSeats = seats.map(seat => {
      const seatNum = seat.seat_number.toString();
      
      // Extract row number and column letter
      const row = seatNum.match(/\d+/) ? seatNum.match(/\d+/)[0] : '';
      const col = seatNum.match(/[A-Z]+/i) ? seatNum.match(/[A-Z]+/i)[0].toUpperCase() : '';
      
      return {
        ...seat,
        row,
        col
      };
    });

    // Group seats by car and row
    const seatsByCarAndRow = {};
    parsedSeats.forEach(seat => {
      const key = `${seat.car_number}-${seat.row}`;
      if (!seatsByCarAndRow[key]) {
        seatsByCarAndRow[key] = [];
      }
      seatsByCarAndRow[key].push(seat);
    });
    const colOrder = ['A', 'B', 'C', 'D'];  
    // Look for contiguous seats in the same row of each car
    for (const carRowKey in seatsByCarAndRow) {
      const rowSeats = seatsByCarAndRow[carRowKey];
      rowSeats.sort((a, b) => colOrder.indexOf(a.col) - colOrder.indexOf(b.col)); // Sort by column within the row
      // Find contiguous block of seats (adjacent columns)
      for (let i = 0; i <= rowSeats.length - count; i++) {
        const candidate = rowSeats.slice(i, i + count);
        // Check if seats are truly contiguous (adjacent columns)
        let contiguous = true;
        for (let j = 1; j < candidate.length; j++) {
          const prevColIndex = colOrder.indexOf(candidate[j-1].col);
          const currColIndex = colOrder.indexOf(candidate[j].col);
          
          if (currColIndex !== prevColIndex + 1) {
            contiguous = false;
            break;
          }
        }
        
        if (contiguous) {
          return candidate;
        }
      }
    }
    
    // If no contiguous seats in the same row, try to find closest available seats
    console.log("No perfectly contiguous seats found, looking for closest available");
    
    return null; // No contiguous seats found
  };
  
  const handleAutoChoose = () => {
    if (availableSeats.length === 0) {
      setError('No available seats to auto-choose');
      return;
    }
    setSelectedSeatIds([]);
    setSelectedSeatsDetails([]);
    
    const numSeats = parseInt(seatCount);
    if (numSeats > availableSeats.length) {
      setError(`Not enough available seats. Only ${availableSeats.length} seats available.`);
      return;
    }
    
    if (numSeats === 1) {
      // Just select the first available seat for single seat selection
      const firstAvailableSeat = availableSeats[0];
      setSelectedSeatIds([firstAvailableSeat.id]);
      setSelectedSeatsDetails([firstAvailableSeat]);
    } else {
      // Find contiguous seats
      const contiguousSeats = findContiguousSeats(availableSeats, numSeats);
      
      if (contiguousSeats) {
        setSelectedSeatIds(contiguousSeats.map(seat => seat.id));
        setSelectedSeatsDetails(contiguousSeats);
        console.log("Selected contiguous seats:", contiguousSeats.map(s => s.seat_number).join(", "));
      } else {
        // Fallback: If no contiguous seats available, try to find seats in the same car at least
        const seatsByCarNumber = {};
        availableSeats.forEach(seat => {
          if (!seatsByCarNumber[seat.car_number]) {
            seatsByCarNumber[seat.car_number] = [];
          }
          seatsByCarNumber[seat.car_number].push(seat);
        });
        
        // Find a car with enough seats
        let selectedFromSameCar = null;
        for (const carNumber in seatsByCarNumber) {
          if (seatsByCarNumber[carNumber].length >= numSeats) {
            selectedFromSameCar = seatsByCarNumber[carNumber].slice(0, numSeats);
            break;
          }
        }
      }
    }
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
      
      let bookingIds = [];
      
      // Use different endpoints based on the number of seats selected
      if (selectedSeatIds.length === 1) {
        // For single seat booking, use the createBooking endpoint
        const response = await axios.post('/api/bookings/create', {
          userId,
          departureStationId: parseInt(departureStationId),
          arrivalStationId: parseInt(arrivalStationId),
          seatId: selectedSeatIds[0]
        });
        bookingIds = [response.data.id];
      } else {
        // For multiple seats, use the createMultipleBookings endpoint
        const response = await axios.post('/api/bookings/multiple', {
          userId,
          departureStationId: parseInt(departureStationId),
          arrivalStationId: parseInt(arrivalStationId),
          seatIds: selectedSeatIds
        });
        
        // Extract booking IDs from the response
        if (Array.isArray(response.data)) {
          bookingIds = response.data.map(booking => booking.id);
          console.log('Multiple bookings created successfully with IDs:', bookingIds);
        } else {
          throw new Error('Unexpected response format from multiple bookings endpoint');
        }
      }
      
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
  
  return (
    <>
      <Navbar />
      <div className="seat-chooser-container">
        <h1>Choose Your Seats</h1>
        
        <div className='back-div'>
         <Link to="/station-select" className="back-btn">
            <ArrowLeft size={16} />
              Back to Stations
         </Link>
        </div>
        <div className="journey-info">
          <h3>Journey from {departureStation?.station_name || `Station ${departureStationId}`} to {arrivalStation?.station_name || `Station ${arrivalStationId}`}</h3>
        </div>
        
        <div className="seat-selection-actions">
          <div className="auto-choose-container">
            <select 
              className="seat-count-select"
              value={seatCount}
              onChange={(e) => setSeatCount(e.target.value)}
            >
              {[1, 2, 3, 4].map(count => (
                <option key={count} value={count}>
                  {count} {count === 1 ? 'seat' : 'seats'}
                </option>
              ))}
            </select>
            <button 
              className="auto-choose-btn"
              onClick={handleAutoChoose}
            >
              Auto Choose Seats
            </button>
          </div>
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