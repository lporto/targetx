// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');

// Load environment variables from .env file
dotenv.config();

const app = express();
const port = 5000;
const JWT_SECRET = process.env.JWT_SECRET;

// Middleware
app.use(cors());
app.use(express.json());

// Construct MongoDB URI
const mongoUsername = process.env.MONGO_USERNAME;
const mongoPassword = process.env.MONGO_PASSWORD;
const mongoHost = process.env.MONGO_HOST;
const mongoDBName = process.env.MONGO_DBNAME;
const mongoOptions = process.env.MONGO_OPTIONS;
const mongoURI = `mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoHost}/${mongoDBName}${mongoOptions}`;

// MongoDB connection using MongoClient
let client = new MongoClient(mongoURI);

client.connect()
  .then(() => {
    console.log('Connected to MongoDB');
  })
  .catch(err => {
    console.error('Error connecting to MongoDB:', err);
    process.exit(1); // Exit the process with an error code
  });

// Hardcoded user for login
const user = {
    id: 1,
    username: process.env.ADMIN_USERNAME,
    password: process.env.ADMIN_PASSWORD,
  };

// Middleware to verify JWT
const auth = (req, res, next) => {
  const token = req.header('Authorization')?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ msg: 'No token, authorization denied' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'Token is not valid' });
  }
};

// Define routes

// Login route to generate JWT
app.post('/api/login', (req, res) => {
    const { username, password } = req.body;
    if (username === user.username && password === user.password) {
      const token = jwt.sign({ user: { id: user.id } }, JWT_SECRET, { expiresIn: '1h' });
      res.json({ token });
    } else {
      res.status(400).json({ msg: 'Invalid credentials' });
    }
  });
  
// Get all collections
app.get('/api/collections', auth, async (req, res) => {
    try {
    const collections = await client.db(process.env.MONGO_DBNAME).listCollections().toArray();
    res.json(collections.map(collection => collection.name));
    } catch (error) {
    console.error('Error fetching collections', error);
    res.status(500).json({ error: 'Error fetching collections' });
    }
});
  
// Get data points from a specified collection
app.get('/api/datapoints/:collection', auth, async (req, res) => {
    const collectionName = req.params.collection;
    try {
      const dataPoints = await client.db(mongoDBName).collection(collectionName).find().toArray();
      res.json(dataPoints);
    } catch (error) {
      console.error('Error fetching data points', error);
      res.status(500).json({ error: 'Error fetching data points' });
    }
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});
