import React, { useState, useEffect } from 'react';
import './SeatLayout.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const SeatLayout = ({ onSeatSelect }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeatId, setSelectedSeatId] = useState(null);
  
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const departureStationId = queryParams.get('departureStationId') || '1'; // Default to station 1
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  useEffect(() => {
    const fetchAvailableSeats = async () => {
      try {
        if (!departureStationId || !arrivalStationId) {
          throw new Error('Departure and arrival stations are required');
        }
        
        setLoading(true);
        const response = await axios.get('/api/seats/available', {
          params: { departureStationId, arrivalStationId }
        });
        
        // Group seats by car number
        const groupedSeats = {};
        response.data.forEach(seat => {
          if (!groupedSeats[seat.car_number]) {
            groupedSeats[seat.car_number] = [];
          }
          groupedSeats[seat.car_number].push(seat);
        });
        
        setSeats(groupedSeats);
        setLoading(false);
      } catch (err) {
        setError(err.message || 'Error fetching seats');
        setLoading(false);
      }
    };
    
    fetchAvailableSeats();
  }, [departureStationId, arrivalStationId]);
  
  const handleSeatClick = (seat) => {
    if (!seat.is_available) return; // Don't allow selection of unavailable seats
    
    // Toggle selection
    if (selectedSeatId === seat.id) {
      setSelectedSeatId(null);
      onSeatSelect(null);
    } else {
      setSelectedSeatId(seat.id);
      onSeatSelect(seat.id);
    }
  };
  
  if (loading) return <div className="loading">Loading seats...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="seat-layout-container">
      <div className="legend">
        <div className="legend-item">
          <div className="seat-icon available"></div>
          <span>Available</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon unavailable"></div>
          <span>Unavailable</span>
        </div>
        <div className="legend-item">
          <div className="seat-icon selected"></div>
          <span>Selected</span>
        </div>
      </div>
      
      {Object.entries(seats).map(([carNumber, carSeats]) => (
        <div key={carNumber} className="car-container">
          <h3>Car {carNumber}</h3>
          <div className="seat-grid">
            {carSeats.map(seat => (
              <div 
                key={seat.id}
                className={`seat ${!seat.is_available ? 'unavailable' : ''} ${selectedSeatId === seat.id ? 'selected' : ''}`}
                onClick={() => handleSeatClick(seat)}
              >
                {seat.seat_number}
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
};

export default SeatLayout;