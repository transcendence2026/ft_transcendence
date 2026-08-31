import cors from 'cors';
import express from 'express';
import { MongoClient } from 'mongodb';

const app = express();
const port = Number(process.env.PORT || 3000);
const mongoClient = new MongoClient(process.env.DATABASE_URL || 'mongodb://db:27017');
const database = mongoClient.db(process.env.MONGO_DB || 'transcendence');

app.use(cors());
app.use(express.json());

app.get('/api/health', async (_request, response) => {
  try {
	await database.command({ ping: 1 });
	response.json({ status: 'ok' });
  } catch (error) {
	console.error(error);
	response.status(503).json({ status: 'error' });
  }
});

app.get('/api/messages', async (_request, response) => {
  const messages = await database
	.collection('messages')
	.find({}, { projection: { _id: 0 } })
	.sort({ created_at: -1 })
	.toArray();
  response.json(messages);
});

mongoClient.connect()
  .then(() => {
	app.listen(port, () => {
	  console.log(`Backend listening on port ${port}`);
	});
  })
  .catch((error: unknown) => {
	console.error('Unable to connect to MongoDB', error);
	process.exit(1);
  });
