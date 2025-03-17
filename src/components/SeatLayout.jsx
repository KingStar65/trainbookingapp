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
  const departureStationId = queryParams.get('departureStationId');
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  useEffect(() => {
    const fetchAvailableSeats = async () => {
      try {
        if (!departureStationId || !arrivalStationId) {
          throw new Error('Departure and arrival stations are required');
        }
        
        setLoading(true);
        console.log(`Fetching available seats for journey from station ${departureStationId} to ${arrivalStationId}`);
        
        const response = await axios.get('/api/seats/available', {
          params: { departureStationId, arrivalStationId }
        });
        
        console.log('Seat data received:', response.data);
        
        // Group seats by car number
        const groupedSeats = {};
        response.data.forEach(seat => {
          if (!groupedSeats[seat.car_number]) {
            groupedSeats[seat.car_number] = [];
          }
          groupedSeats[seat.car_number].push(seat);
        });
        
        // Sort car numbers
        const sortedGroupedSeats = {};
        Object.keys(groupedSeats)
          .sort((a, b) => parseInt(a) - parseInt(b))
          .forEach(key => {
            sortedGroupedSeats[key] = groupedSeats[key];
          });
        
        setSeats(sortedGroupedSeats);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching seats:', err);
        setError(err.message || 'Error fetching seats');
        setLoading(false);
        
        // Fallback to hardcoded sample seats for testing UI
        const sampleSeats = {};
        for (let car = 1; car <= 2; car++) {
          sampleSeats[car] = [];
          for (let i = 1; i <= 10; i++) {
            sampleSeats[car].push({
              id: (car - 1) * 10 + i,
              seat_number: `${car}-${i}`,
              car_number: car,
              is_available: Math.random() > 0.3 // 70% seats available
            });
          }
        }
        setSeats(sampleSeats);
      }
    };
    
    fetchAvailableSeats();
  }, [departureStationId, arrivalStationId]);
  
  const handleSeatClick = (seat) => {
    if (!seat.is_available) return; // Don't allow selection of unavailable seats
    
    // Toggle selection
    if (selectedSeatId === seat.id) {
      setSelectedSeatId(null);
      onSeatSelect(null, null);
    } else {
      setSelectedSeatId(seat.id);
      onSeatSelect(seat.id, seat); // Pass the entire seat object
    }
  };
  
  if (loading) return <div className="loading">Loading seats...</div>;
  if (error) return <div className="error">Error: {error}</div>;
  
  return (
    <div className="seat-layout-container">
      <div className="journey-info">
        <h3>Journey from Station {departureStationId} to Station {arrivalStationId}</h3>
      </div>
    
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
      
      {Object.keys(seats).length === 0 ? (
        <div className="no-seats">No seats found for this journey.</div>
      ) : (
        Object.entries(seats).map(([carNumber, carSeats]) => (
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
        ))
      )}
    </div>
  );
};

export default SeatLayout;