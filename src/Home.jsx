import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import StationSelect from './components/StationSelect';
import './Home.css';
import Navbar from './components/Navbar';

const Home = () => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    // Check if user is logged in when component mounts
    checkLoginStatus();
  }, []);

  const checkLoginStatus = () => {
    const token = localStorage.getItem('token');
    const user = localStorage.getItem('user');
    
    if (token && user) {
      setIsLoggedIn(true);
    } else {
      setIsLoggedIn(false);
    }
  };

  const handleBookNow = () => {
    navigate('/station-select');
  };

  const handleLogin = () => {
    navigate('/login');
  };

  return (
    <>
      <Navbar />
      <div className='welcome'>
        <h2>Welcome to the train booking website</h2>
        <p>This line goes from station 1 to station 6</p>
        
        <div className="home-actions">
          {isLoggedIn ? (
            <button 
              className="book-now-button"
              onClick={handleBookNow}
            >
              Book a Train Ticket
            </button>
          ) : (
            <div className="login-prompt">
              <p>Please log in to book a train ticket</p>
              <button 
                className="login-button"
                onClick={handleLogin}
              >
                Log In
              </button>
            </div>
          )}
        </div>
      </div>
    </>
  );
};

export default Home;