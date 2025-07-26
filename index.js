const express = require('express');
const app = express();
const cors = require('cors');
const crypto = require('crypto');
require('dotenv').config();

app.use(cors());
app.use(express.static('public'));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const urlDatabase = {}; // In-memory storage

function generateObjectId() {
  return crypto.randomBytes(12).toString('hex'); // 12 bytes = 24 hex characters
}

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/views/index.html');
});

// Create a new user
app.post('/api/users', (req, res) => {
  const username = req.body.username;

  if (!username) {
    return res.json({ error: 'Username is required' });
  }

  const id_user = generateObjectId();
  urlDatabase[id_user] = { username, log: [] };

  res.json({
    username: username,
    _id: id_user
  });
});

// Add an exercise to a user
app.post('/api/users/:_id/exercises', (req, res) => {
  const user = urlDatabase[req.params._id];
  if (!user) return res.json({ error: 'User not found' });

  const description = req.body.description;
  const duration = parseInt(req.body.duration);
  let date = req.body.date ? new Date(req.body.date) : new Date();

  if (!description || isNaN(duration)) return res.json({ error: 'Invalid input' });
  if (isNaN(date)) return res.json({ error: 'Invalid date' });

  date = date.toDateString();

  const exercise = { description, duration, date };
  user.log.push(exercise);

  res.json({
    _id: req.params._id,
    username: user.username,
    description,
    duration,
    date
  });
});

// (Optional) Get all users
app.get('/api/users', (req, res) => {
  const users = Object.entries(urlDatabase).map(([id, userData]) => ({
    username: userData.username,
    _id: id
  }));
  res.json(users);
});

// (Optional) Get exercise log
app.get('/api/users/:_id/logs', (req, res) => {
  const user = urlDatabase[req.params._id];
  if (!user) return res.json({ error: 'User not found' });

  let { from, to, limit } = req.query;
  let log = [...user.log];

  if (from) {
    const fromDate = new Date(from);
    if (!isNaN(fromDate)) {
      log = log.filter(e => new Date(e.date) >= fromDate);
    }
  }

  if (to) {
    const toDate = new Date(to);
    if (!isNaN(toDate)) {
      log = log.filter(e => new Date(e.date) <= toDate);
    }
  }

  if (limit) {
    limit = parseInt(limit);
    if (!isNaN(limit)) {
      log = log.slice(0, limit);
    }
  }

  res.json({
    username: user.username,
    count: log.length,
    _id: req.params._id,
    log
  });
});

// Start server
const listener = app.listen(process.env.PORT || 3000, () => {
  console.log('Your app is listening on port ' + listener.address().port);
});
