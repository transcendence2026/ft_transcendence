const transcendence = db.getSiblingDB('transcendence');

if (transcendence.messages.countDocuments() === 0) {
  transcendence.messages.insertOne({
	id: 1,
	text: 'Database connection is working.',
	created_at: new Date(),
  });
}
