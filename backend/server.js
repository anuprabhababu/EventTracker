const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventsRoutes = require('./routes/events');

const app = express();

/* ================= CORS ================= */

app.use(cors({
  origin: true,
  credentials: true
}));

app.options('*', cors()); // handle preflight

/* ================= BODY PARSER ================= */

app.use(express.json());

/* ================= ROUTES ================= */

app.use('/api/events', eventsRoutes);

/* ================= TEST ROUTE ================= */

app.get("/", (req, res) => {
  res.send("BACKEND RUNNING ✅");
});

/* ================= SERVER ================= */

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});