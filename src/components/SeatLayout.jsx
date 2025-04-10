import React, { useState, useEffect } from 'react';
import './SeatLayout.css';
import axios from 'axios';
import { useLocation } from 'react-router-dom';

const SeatLayout = ({ onSeatSelect, selectedSeatIds: externalSelectedSeatIds }) => {
  const [seats, setSeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedSeatIds, setSelectedSeatIds] = useState([]);
  const [availableSeats, setAvailableSeats] = useState([]);
  const location = useLocation();
  const queryParams = new URLSearchParams(location.search);
  const departureStationId = queryParams.get('departureStationId');
  const arrivalStationId = queryParams.get('arrivalStationId');
  
  // Sync internal state with external state
  useEffect(() => {
    if (externalSelectedSeatIds) {
      setSelectedSeatIds(externalSelectedSeatIds);
    }
  }, [externalSelectedSeatIds]);
  
  useEffect(() => {
    const fetchAvailableSeats = async () => {
      try {
        setLoading(true);
        console.log(`Fetching available seats for journey from station ${departureStationId} to ${arrivalStationId}`);
        
        const response = await axios.get('/api/seats/available', {
          params: { departureStationId, arrivalStationId }
        });
        
        console.log('Seat data received:', response.data);
        
        // Extract all available seats for the auto-choose feature
        const allAvailableSeats = response.data.filter(seat => seat.is_available);
        setAvailableSeats(allAvailableSeats);
        
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
            // Sort seats within each car by seat number
            sortedGroupedSeats[key] = groupedSeats[key].sort(
              (a, b) => parseInt(a.seat_number) - parseInt(b.seat_number)
            );
          });
        
        setSeats(sortedGroupedSeats);
        setLoading(false);
        
        // Pass all available seats to parent component
        onSeatSelect(selectedSeatIds, getSelectedSeatsDetails(selectedSeatIds), allAvailableSeats);
      } catch (err) {
        console.error('Error fetching seats:', err);
        setError(err.message || 'Error fetching seats');
        setLoading(false);
        
        
      }
    };
    
    fetchAvailableSeats();
  }, [departureStationId, arrivalStationId]);
  
  const getSelectedSeatsDetails = (seatIds) => {
    const selectedSeatsDetails = [];
    Object.values(seats).flat().forEach(s => {
      if (seatIds.includes(s.id)) {
        selectedSeatsDetails.push(s);
      }
    });
    return selectedSeatsDetails;
  };
  
  const handleSeatClick = (seat) => {
    if (!seat.is_available) return; // Don't allow selection of unavailable seats
    // Toggle selection
    let updatedSelectedSeats;
    if (selectedSeatIds.includes(seat.id)) {
      updatedSelectedSeats = selectedSeatIds.filter(id => id !== seat.id);
    } else {
      updatedSelectedSeats = [...selectedSeatIds, seat.id];
    }
    
    setSelectedSeatIds(updatedSelectedSeats);
    
    // Get full details of all selected seats and pass to parent
    const selectedSeatsDetails = getSelectedSeatsDetails(updatedSelectedSeats);
    onSeatSelect(updatedSelectedSeats, selectedSeatsDetails, availableSeats);
  };
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
      
      <div className="multi-seat-info">
        You can select multiple seats by clicking on them
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
                  className={`seat ${!seat.is_available ? 'unavailable' : ''} ${selectedSeatIds.includes(seat.id) ? 'selected' : ''}`}
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