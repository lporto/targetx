// src/components/DataDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getDataPoints } from '../services/dataService';
import TimelineChart from './TimelineChart';
import './DataDashboard.css';

const DataDashboard = () => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('sparta0');
  const [dataPoints, setDataPoints] = useState([]);
  const [error, setError] = useState('');
  const wsRef = useRef(null); // To keep a reference to the WebSocket connection

  useEffect(() => {
    const fetchCollections = async () => {
      try {
        const token = localStorage.getItem('token');
        const response = await axios.get('/api/collections', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        setCollections(response.data);
      } catch (error) {
        console.error('Error fetching collections', error);
      }
    };

    fetchCollections();
  }, []);


  useEffect(() => {
    const fetchDataPoints = async () => {
      try {
        const data = await getDataPoints(selectedCollection);
        setDataPoints(data);
      } catch (err) {
        setError('Failed to fetch data');
      }
    };

    fetchDataPoints();

    // WebSocket setup
    if (wsRef.current) {
      wsRef.current.close(); // Close previous WebSocket connection
    }

    const ws = new WebSocket(`/api/ws`);
    wsRef.current = ws;

    ws.onopen = () => {
      console.log('WebSocket connected');
      // Subscribe to the selected collection
      ws.send(JSON.stringify({ type: 'subscribe', collection: selectedCollection }));
    };

    ws.onmessage = (event) => {
      console.log('WebSocket message received:', event.data);
      const newDataPoint = JSON.parse(event.data);
      //if (newDataPoint.collection === selectedCollection) {
        setDataPoints((prevDataPoints) => [...prevDataPoints, newDataPoint]);
      //}
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current) {
        // Unsubscribe from the collection before unmounting or changing collection
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe', collection: selectedCollection }));
        wsRef.current.close();
      }
    };
  }, [selectedCollection]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>Collections</h3>
        <ul>
          {collections.map(collection => (
            <li
              key={collection}
              className={selectedCollection === collection ? 'active' : ''}
              onClick={() => setSelectedCollection(collection)}
            >
              {collection}
            </li>
          ))}
        </ul>
      </div>
      <div className="main">
        <h2>Dashboard - {selectedCollection}</h2>
        <TimelineChart dataPoints={dataPoints} />
        <table>
          <thead>
            <tr>
              <th>Timestamp</th>
              <th>Event</th>
              <th>Value</th>
            </tr>
          </thead>
          <tbody>
            {dataPoints.map((dataPoint) => (
              <tr key={dataPoint._id}>
                <td>{new Date(dataPoint.timestamp / 1000000).toLocaleString()}</td>
                <td>{dataPoint.event}</td>
                <td>{dataPoint.value}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default DataDashboard;
