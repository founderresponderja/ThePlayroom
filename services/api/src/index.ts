import express, { type Request, type Response } from 'express';

const app = express();
const port = process.env.PORT ?? 4000;

app.use(express.json());

app.get('/api/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'api' });
});

app.listen(port, () => {
  console.log(`API service listening on http://localhost:${port}`);
});
