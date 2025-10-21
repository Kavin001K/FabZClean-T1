import express from 'express';
const app = express();
const port = 5001;

app.get('/', (req, res) => {
  res.json({ message: 'FabZClean Test Server is running!' });
});

app.get('/api/health', (req, res) => {
  res.json({ status: 'healthy', timestamp: new Date().toISOString() });
});

app.listen(port, () => {
  console.log(`Test server running on port ${port}`);
});
