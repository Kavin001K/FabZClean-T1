import express from 'express';
import { registerAllRoutes } from '../server/routes/index';

const app = express();

// Middleware
app.use(express.json());

// CORS configuration (basic for Vercel)
app.use((req, res, next) => {
    const allowedOrigins = [
        'http://localhost:5000',
        'http://localhost:5173',
        'https://fab-z-clean-t1-test-enviroment.vercel.app',
        'https://fab-z-clean-t1.vercel.app'
    ];

    const origin = req.headers.origin;
    if (origin && allowedOrigins.includes(origin)) {
        res.header('Access-Control-Allow-Origin', origin);
    } else {
        // Allow all for now to fix issues, but should be restricted in prod
        res.header('Access-Control-Allow-Origin', '*');
    }

    res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
    res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
    res.header('Access-Control-Allow-Credentials', 'true');

    if (req.method === 'OPTIONS') {
        return res.sendStatus(200);
    }

    next();
});

// Register all routes
registerAllRoutes(app);

// Root endpoint for health check
app.get('/api', (req, res) => {
    res.json({ status: 'ok', message: 'FabZClean API is running' });
});

export default app;
