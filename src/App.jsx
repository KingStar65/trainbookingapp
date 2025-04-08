import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import Home from './Home'
import Login from './pages/Login';
import Register from './pages/Register';
import SeatChooser from './pages/SeatChooser';
import Navbar from './components/Navbar'
import StationSelect from './components/StationSelect';
import Bookings from './pages/Bookings';
import Confirmation from './pages/Confirmation';

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/station-select" element={<StationSelect />} />
        <Route path="/seat-chooser" element={<SeatChooser />} />
        <Route path="/bookings" element={<Bookings />} />
        <Route path="/booking-confirmation" element={<Confirmation />} />
      </Routes>
    </Router>
  );
}

export default App;