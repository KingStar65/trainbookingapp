import { Link } from 'react-router-dom'
import './Navbar.css'

const Navbar = () => {
  return (
    <div className="navbar">
      <div className="nav-left">
        <Link to="/" className="home-link">Home</Link>
        <Link to="/bookings" className="bookings">Bookings</Link>
      </div>
      <div className="nav-right">
        <Link to="/login">Login</Link>
        <Link to="/register">Register</Link>
      </div>
    </div>
  )
}

export default Navbar