// server.js
const express = require('express');
const { MongoClient } = require('mongodb');
const cors = require('cors');
const jwt = require('jsonwebtoken');
const dotenv = require('dotenv');
const WebSocket = require('ws');

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

const wss = new WebSocket.Server({ noServer: true });

// Map to store client subscriptions
const subscriptions = new Map();

// Handle WebSocket connections
wss.on('connection', (ws) => {
  console.log('New WebSocket connection established');

  ws.on('message', (message) => {
    try {
      const parsedMessage = JSON.parse(message);

      if (parsedMessage.type === 'subscribe') {
        // Client wants to subscribe to a collection
        const collectionName = parsedMessage.collection;
        if (!subscriptions.has(collectionName)) {
          subscriptions.set(collectionName, new Set());
        }
        subscriptions.get(collectionName).add(ws);
        console.log(`Client subscribed to ${collectionName}`);
      }
      
      if (parsedMessage.type === 'unsubscribe') {
        // Client wants to unsubscribe from a collection
        const collectionName = parsedMessage.collection;
        if (subscriptions.has(collectionName)) {
          subscriptions.get(collectionName).delete(ws);
          if (subscriptions.get(collectionName).size === 0) {
            subscriptions.delete(collectionName);
          }
        }
        console.log(`Client unsubscribed from ${collectionName}`);
      }

    } catch (error) {
      console.error('Error processing WebSocket message:', error);
    }
  });

  ws.on('close', () => {
    console.log('WebSocket connection closed');
    // Remove the client from all subscriptions on close
    subscriptions.forEach((clients, collectionName) => {
      clients.delete(ws);
      if (clients.size === 0) {
        subscriptions.delete(collectionName);
      }
    });
  });
});

// Optimized Broadcast function
const broadcast = (collectionName, data) => {
  const clients = subscriptions.get(collectionName);

  if (!clients || clients.size === 0) {
    console.log(`No clients to broadcast to for collection ${collectionName}`);
    return;
  }

  console.log(`Broadcasting data to ${clients.size} clients for collection ${collectionName}`);

  clients.forEach(client => {
    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));
      console.log('Data broadcasted:', data);
    }
  });
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

// Post a new data point to a specified collection
app.post('/api/datapoints/:collection', auth, async (req, res) => {
  const collectionName = req.params.collection;
  const dataPoint = req.body;

  try {
    const result = await client.db(mongoDBName).collection(collectionName).insertOne(dataPoint);
    res.status(201).json({ msg: 'Data point inserted successfully', result });

    // Broadcast the new data point to all subscribed clients
    broadcast(collectionName, dataPoint);
  } catch (error) {
    console.error('Error inserting data point', error);
    // Send the error response only if headers haven't been sent yet
    if (!res.headersSent) {
      res.status(500).json({ error: 'Error inserting data point' });
    }
  }
});


// Start the server
const server = app.listen(port, () => {
  console.log(`Server is running on http://localhost:${port}`);
});

server.on('upgrade', (request, socket, head) => {
  wss.handleUpgrade(request, socket, head, socket => {
    wss.emit('connection', socket, request);
  });
});
