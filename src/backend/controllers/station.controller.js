import Station from '../models/station.model.js';

const stationController = {
  async getAllStations(req, res) {
    try {
      const stations = await Station.findAll();
      res.json(stations);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  },
  
  async getStationById(req, res) {
    try {
      const { id } = req.params;
      
      if (!id) {
        return res.status(400).json({ message: 'Station ID is required' });
      }
      
      const station = await Station.findById(id);
      
      if (!station) {
        return res.status(404).json({ message: 'Station not found' });
      }
      
      res.json(station);
    } catch (error) {
      res.status(500).json({ message: error.message });
    }
  }
};

export default stationController;