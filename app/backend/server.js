const express = require('express');
const cors = require('cors');

const app = express();
const port = process.env.PORT || 5000;
const version = process.env.APP_VERSION || 'local';

app.use(cors());
app.use(express.json());

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok' });
});

app.get('/api/message', (req, res) => {
  res.json({
    title: 'Backend API is running',
    message: 'Hello from the W8-W9 demo backend.',
    version,
    timestamp: new Date().toISOString()
  });
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});
