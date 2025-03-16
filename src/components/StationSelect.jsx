import React, { useState, useEffect } from 'react';
import './StationSelect.css';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import axios from 'axios';

const StationSelect = () => {
  const [stations, setStations] = useState([]);
  const [departureStation, setDepartureStation] = useState('');
  const [arrivalStation, setArrivalStation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        console.log('Fetching stations...');
        const response = await axios.get('/api/stations');
        console.log('Station data received:', response.data);
        setStations(response.data);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching stations:', err);
        setError('Error fetching stations: ' + (err.message || 'Unknown error'));
        
        // Fallback to hardcoded stations if API fails
        setStations([
          { id: 1, name: 'Station 1' },
          { id: 2, name: 'Station 2' },
          { id: 3, name: 'Station 3' },
          { id: 4, name: 'Station 4' },
          { id: 5, name: 'Station 5' },
          { id: 6, name: 'Station 6' }
        ]);
        setLoading(false);
      }
    };
    
    fetchStations();
  }, []);
  
  const handleSearchClick = () => {
    if (departureStation && arrivalStation) {
      navigate(`/seat-chooser?departureStationId=${departureStation}&arrivalStationId=${arrivalStation}`);
    }
  };
  
  // Filter departure stations (1-5)
  const departureStations = stations.filter(station => station.id >= 1 && station.id <= 5);
  
  // Filter arrival stations (2-6)
  const arrivalStations = stations.filter(station => station.id >= 2 && station.id <= 6);
  
  // Validate that arrival station is after departure station
  const isValidSelection = departureStation && arrivalStation && parseInt(arrivalStation) > parseInt(departureStation);
  
  return (
    <div>
      <Navbar />
      <div className='flex-container'>
        <div className='depart'>
          <h2 className='text-depart'>Select Departure Station</h2>
          <select 
            className='select-station' 
            value={departureStation}
            onChange={(e) => {
              setDepartureStation(e.target.value);
              // Clear arrival station if it's now invalid
              if (arrivalStation && parseInt(e.target.value) >= parseInt(arrivalStation)) {
                setArrivalStation('');
              }
            }}
            required
          >
            <option value="">Select a station</option>
            {departureStations.map(station => (
              <option key={station.id} value={station.id}>
                {station.name || `Station ${station.id}`}
              </option>
            ))}
          </select>
          <p className="info-text">You can select stations 1-5 as departure</p>
        </div>
        <div className='arrive'>
          <h2 className='text-arrive'>Select Arrival Station</h2>
          <select 
            className='select-station'
            value={arrivalStation}
            onChange={(e) => setArrivalStation(e.target.value)}
            required
            disabled={!departureStation}
          >
            <option value="">Select a station</option>
            {arrivalStations
              .filter(station => !departureStation || parseInt(station.id) > parseInt(departureStation))
              .map(station => (
                <option key={station.id} value={station.id}>
                  {station.name || `Station ${station.id}`}
                </option>
              ))
            }
          </select>
          <p className="info-text">Arrival station must be after departure station</p>
        </div>
      </div>
      <div className='container'>
        {loading && <p>Loading stations...</p>}
        {error && <p style={{color: 'red'}}>{error}</p>}
        {!isValidSelection && departureStation && arrivalStation && (
          <p style={{color: 'red'}}>Arrival station must be after departure station</p>
        )}
        <button 
          className='search-btn' 
          onClick={handleSearchClick}
          disabled={!isValidSelection}
        >
          Search Stations
        </button>
      </div>
    </div>
  );
};

export default StationSelect;