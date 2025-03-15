import pool from '../config/db.config.js';

const Station = {
  async findAll() {
    const query = 'SELECT * FROM stations ORDER BY id';
    const { rows } = await pool.query(query);
    return rows;
  },
  
  async findById(id) {
    const query = 'SELECT * FROM stations WHERE id = $1';
    const { rows } = await pool.query(query, [id]);
    return rows[0];
  }
};

export default Station;