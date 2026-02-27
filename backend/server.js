const express = require('express');
const cors = require('cors');
require('dotenv').config();

const eventsRoutes = require('./routes/events');

const app = express();

// CORS (allow frontend + local dev)
app.use(cors({
  origin: [
    "http://localhost:5173",
    "https://ex1-liard-six.vercel.app"
  ]
}));

// Parse JSON
app.use(express.json());

// Routes
app.use('/api/events', eventsRoutes);

// Test Route
app.get("/", (req, res) => {
  res.send("Backend is running successfully 🚀");
});

// PORT fix (important)
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});