// src/App.js
import React, { useState } from 'react';
import DataDashboard from './components/DataDashboard';
import Login from './components/Login';

const App = () => {
  const [token, setToken] = useState(localStorage.getItem('token'));

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
  };

  if (!token) {
    return <Login setToken={setToken} />;
  }

  return (
    <div className="App">
      <main>
        <DataDashboard  onLogout={handleLogout} />
      </main>
    </div>
  );
};

export default App;
