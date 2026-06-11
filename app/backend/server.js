const express = require('express');
const cors = require('cors');
const client = require('prom-client');

const app = express();
const port = process.env.PORT || 5000;
const version = process.env.APP_VERSION || 'local';

app.use(cors());
app.use(express.json());

client.collectDefaultMetrics();

const httpRequests = new client.Counter({
  name: 'demo_http_requests_total',
  help: 'Total HTTP requests to demo backend',
  labelNames: ['method', 'route', 'status_code']
});

app.use((req, res, next) => {
  res.on('finish', () => {
    httpRequests.inc({
      method: req.method,
      route: req.path,
      status_code: String(res.statusCode)
    });
  });
  next();
});

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

app.get('/metrics', async (req, res) => {
  res.set('Content-Type', client.register.contentType);
  res.end(await client.register.metrics());
});

app.listen(port, () => {
  console.log(`Backend listening on port ${port}`);
});