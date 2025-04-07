import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import stationRoutes from './routes/station.routes.js';
import seatRoutes from './routes/seat.routes.js';
import bookingRoutes from './routes/booking.routes.js';

dotenv.config(); //loads the environment variables
const app = express(); 

app.use(cors({
  origin: 'http://localhost:5173' 
}));
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);

// Basic route test
app.get('/api/test', (req, res) => {
  res.json({ message: 'Connection established' });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});