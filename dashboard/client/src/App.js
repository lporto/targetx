// src/App.js
import React, { useState } from 'react';
import DataDashboard from './components/DataDashboard';
import Login from './components/Login';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div className="App">
      <main>
        <DataDashboard />
      </main>
    </div>
  );
};

export default App;
