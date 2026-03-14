const express = require('express');
const cors = require('cors');
const bookingsRouter = require('./routes/bookings');

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());
app.use('/api', bookingsRouter);

app.listen(PORT, () => {
  console.log(`Server kör på http://localhost:${PORT}`);
});
