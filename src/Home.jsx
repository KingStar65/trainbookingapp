import React from 'react'
import StationSelect from './components/StationSelect'
import './Home.css'
import Navbar from './components/Navbar'

const Home = () => {
  return (
  <>
    <Navbar/>
    <div className='welcome'>
      <h2>Welcome to the train booking website</h2>
      <p>This line goes from station 1 to station 8</p>
    </div>
    </>
  )
}

export default Home