import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import 'express-async-errors';

import { errorHandler } from './shared/middleware/error-handler.js';
import { activityLogger } from './shared/middleware/activity-logger.js';
import { eventsRouter } from './features/events/events.routes.js';
import { contactsRouter } from './features/contacts/contacts.routes.js';

const app = express();
const PORT = process.env.API_PORT || 8002;

// Middleware
app.use(cors()); // Simple - allows all origins for development
app.use(express.json());
app.use(activityLogger);

// Health check
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    timestamp: new Date().toISOString(),
    port: PORT 
  });
});

// Feature routes
app.use('/api/events', eventsRouter);
app.use('/api/contacts', contactsRouter);

// Error handling (must be last)
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 Health check: http://localhost:${PORT}/api/health`);
});