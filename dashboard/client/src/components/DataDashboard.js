// src/components/DataDashboard.js
import React, { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { getDataPoints } from '../services/dataService';
import TimelineChart from './TimelineChart';
import './DataDashboard.css';

const DataDashboard = ({ onLogout }) => {
  const [collections, setCollections] = useState([]);
  const [selectedCollection, setSelectedCollection] = useState('sparta0');
  const [dataPoints, setDataPoints] = useState([]);
  const [loading, setLoading] = useState(false); // Track loading state
  const [error, setError] = useState('');
  const wsRef = useRef(null); // To keep a reference to the WebSocket connection

  // Function to fetch collections
  const fetchCollections = async () => {
    setLoading(true); // Set loading state to true
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
    } finally {
      setLoading(false); // Reset loading state to false after request completes
    }
  };

  useEffect(() => {
    fetchCollections();
  }, []);

  useEffect(() => {
    const fetchDataPoints = async () => {
      try {
        const data = await getDataPoints(selectedCollection);
        setDataPoints(data);
      } catch (err) {
        setError('Failed to fetch data');
        onLogout();
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
      setDataPoints((prevDataPoints) => [...prevDataPoints, newDataPoint]);
    };

    ws.onclose = () => {
      console.log('WebSocket disconnected');
    };

    return () => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
        // Unsubscribe from the collection before unmounting or changing collection
        wsRef.current.send(JSON.stringify({ type: 'unsubscribe', collection: selectedCollection }));
        wsRef.current.close();
      } else if (wsRef.current) {
        wsRef.current.onopen = () => {
          wsRef.current.send(JSON.stringify({ type: 'unsubscribe', collection: selectedCollection }));
          wsRef.current.close();
        };
      }
    };
  }, [selectedCollection]);

  if (error) {
    return <div>{error}</div>;
  }

  return (
    <div className="dashboard">
      <div className="sidebar">
        <h3>
          Collections
          <span
            onClick={!loading ? fetchCollections : null} // Disable click if loading
            style={{
              marginLeft: '10px',
              cursor: loading ? 'not-allowed' : 'pointer',
              opacity: loading ? 0.7 : 1, // Slightly dim during loading
            }}
            className={loading ? 'loading-icon' : ''}
            title={loading ? "Refreshing..." : "Refresh Collections"}
          >
            ⟳
          </span>
        </h3>
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
        <button onClick={onLogout} className="logout-button">Logout</button>
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
