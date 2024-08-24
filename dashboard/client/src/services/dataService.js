import axios from 'axios';

const API_URL = '/api/datapoints';

const getDataPoints = async (collection) => {
  try {
    const token = localStorage.getItem('token');
    const response = await axios.get(`${API_URL}/${collection}`, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    });
    return response.data;
  } catch (error) {
    console.error('Error fetching data points', error);
    throw error;
  }
};

export { getDataPoints };
