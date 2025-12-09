import axios from 'axios';

// Create an Axios instance with default configuration
const api = axios.create({
    baseURL: 'https://localhost:7062/api/v1', // Hardcoded as per Angular project
    headers: {
        'Content-Type': 'application/json',
    },
});

// Add a response interceptor to handle errors globally if needed
api.interceptors.response.use(
    (response) => response,
    (error) => {
        console.error('API Error:', error);
        return Promise.reject(error);
    }
);

export default api;
