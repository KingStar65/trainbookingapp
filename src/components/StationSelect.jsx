import React, { useState, useEffect } from 'react';
import './StationSelect.css';
import { useNavigate } from 'react-router-dom';
import Navbar from './Navbar';
import axios from 'axios';

const StationSelect = () => {
  const [stations, setStations] = useState([]);
  const [departureStation, setDepartureStation] = useState('1'); // Default to Station 1
  const [arrivalStation, setArrivalStation] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  const navigate = useNavigate();
  
  useEffect(() => {
    const fetchStations = async () => {
      try {
        setLoading(true);
        const response = await axios.get('/api/stations');
        setStations(response.data);
        setLoading(false);
      } catch (err) {
        setError('Error fetching stations');
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
  
  // According to the requirements, users can only book from station 1
  // So we'll disable the departure station selection and set it to Station 1
  
  if (loading) return <div>Loading stations...</div>;
  if (error) return <div>Error: {error}</div>;
  
  return (
    <div>
      <Navbar />
      <div className='flex-container'>
        <div className='depart'>
          <h2 className='text-depart'>Select Departure Station</h2>
          <select 
            className='select-station' 
            value={departureStation}
            onChange={(e) => setDepartureStation(e.target.value)}
            disabled // Disabled as per requirement
          >
            {stations
              .filter(station => station.id === 1)
              .map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))
            }
          </select>
          <p className="info-text">According to train policy, all journeys start from Station 1</p>
        </div>
        <div className='arrive'>
          <h2 className='text-arrive'>Select Arrival Station</h2>
          <select 
            className='select-station'
            value={arrivalStation}
            onChange={(e) => setArrivalStation(e.target.value)}
            required
          >
            <option value="">Select a station</option>
            {stations
              .filter(station => station.id !== 1) // Exclude Station 1 as arrival
              .map(station => (
                <option key={station.id} value={station.id}>
                  {station.name}
                </option>
              ))
            }
          </select>
        </div>
      </div>
      <div className='container'>
        <button 
          className='search-btn' 
          onClick={handleSearchClick}
          disabled={!arrivalStation}
        >
          Search Stations
        </button>
      </div>
    </div>
  );
};

export default StationSelect;