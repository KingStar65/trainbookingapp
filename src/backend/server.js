import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth.routes.js';
import stationRoutes from './routes/station.routes.js';
import seatRoutes from './routes/seat.routes.js';
import bookingRoutes from './routes/booking.routes.js';

dotenv.config();
const app = express();

// Middleware
app.use(cors({
  origin: 'http://localhost:5173' // Your Vite dev server port
}));
app.use(express.json());

// Routes
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