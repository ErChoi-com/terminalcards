import express from "express";
import dotenv from "dotenv";
import fetch from "node-fetch";

dotenv.config();

const serverside = express();
const PORT = 3000;
const GITAPI = process.env.GITAPI;

require('dotenv').config();
const { Pool } = require('pg');

const pool = new Pool({
  user: process.env.DB_USER,
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  password: process.env.DB_PASS,
  port: process.env.DB_PORT,
  ssl: { rejectUnauthorized: false }
});

serverside.get('/users', async (req, res) => {
  try {
    const result = await pool.query('SELECT * FROM repositories');
    res.json(result.rows);
  } catch (err) {
    console.error('Database query error:', err);
    res.status(500).json({ error: 'Database error' });
  }
});

serverside.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});