import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import authRoutes from './src/backend/routes/auth.routes.js';
import stationRoutes from './src/backend/routes/station.routes.js';
import seatRoutes from './src/backend/routes/seat.routes.js';
import bookingRoutes from './src/backend/routes/booking.routes.js';

// Get current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config(); // loads the environment variables

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/stations', stationRoutes);
app.use('/api/seats', seatRoutes);
app.use('/api/bookings', bookingRoutes);

// Serve static files from the React app
app.use(express.static(join(__dirname, 'dist')));

// Test route
app.get('/api/test', (req, res) => {
  res.json({ message: 'Connection established' });
});

// Handle React routing, return all requests to React app
app.get('*', (req, res) => {
  res.sendFile(join(__dirname, 'dist', 'index.html'));
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});