import express from 'express';
import { createServer } from 'http';
import { WebSocketServer, WebSocket } from 'ws';
import { createServer as createViteServer } from 'vite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function startServer() {
  const app = express();
  const server = createServer(app);
  const wss = new WebSocketServer({ server });

  app.use(express.json());

  // Store connected clients
  const clients = new Set<WebSocket>();

  wss.on('connection', (ws) => {
    clients.add(ws);
    console.log('Client connected. Total clients:', clients.size);

    ws.on('close', () => {
      clients.delete(ws);
      console.log('Client disconnected. Total clients:', clients.size);
    });
  });

  // Broadcast function
  const broadcast = (data: any) => {
    const message = JSON.stringify(data);
    clients.forEach((client) => {
      if (client.readyState === WebSocket.OPEN) {
        client.send(message);
      }
    });
  };

  // API Routes
  app.post('/api/notify', (req, res) => {
    const { type, message, data } = req.body;
    broadcast({ type, message, data, timestamp: new Date().toISOString() });
    res.json({ success: true });
  });

  app.post('/api/send-email', (req, res) => {
    const { to, subject, body } = req.body;
    console.log(`[MOCK EMAIL] To: ${to}, Subject: ${subject}, Body: ${body}`);
    // In a real app, you'd use nodemailer or a service like SendGrid
    res.json({ success: true, message: 'Email sent successfully (mocked)' });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== 'production') {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, 'dist', 'index.html'));
    });
  }

  const PORT = 3000;
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch(console.error);
