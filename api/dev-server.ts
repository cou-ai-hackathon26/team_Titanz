// Runs the scan API on your laptop without Vercel: npm run dev  (reads api/.env.local)
// Then set EXPO_PUBLIC_SCAN_URL=http://<your laptop's Wi-Fi IP>:3001/api/scan in the app's .env.local.
import { createServer } from 'node:http';
import { POST, OPTIONS } from './api/scan.ts';

const PORT = Number(process.env.PORT) || 3001;

// Turns Node's request into a standard Request, calls our handler, and writes the Response back.
createServer(async (req, res) => {
  if (req.url !== '/api/scan') {
    res.writeHead(404).end('Not found');
    return;
  }
  const chunks: Buffer[] = [];
  for await (const chunk of req) chunks.push(chunk as Buffer);
  const request = new Request(`http://localhost${req.url}`, {
    method: req.method,
    headers: { 'content-type': req.headers['content-type'] ?? '' },
    body: req.method === 'POST' ? Buffer.concat(chunks) : undefined,
  });
  const response = req.method === 'OPTIONS' ? OPTIONS() : req.method === 'POST' ? await POST(request) : new Response('Use POST', { status: 405 });
  res.writeHead(response.status, Object.fromEntries(response.headers));
  res.end(Buffer.from(await response.arrayBuffer()));
}).listen(PORT, () => console.log(`Scan API on http://localhost:${PORT}/api/scan`));
