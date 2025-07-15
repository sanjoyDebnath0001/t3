import axios from 'axios';


const API_BASE_URL=import.meta.env.VITE_API_BASE_URL ||'http://localhost:5001';

const axiosInstance = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});


axiosInstance.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            
            config.headers['x-auth-token'] = token; 
        }
        return config; 
    },
    (error) => {
        return Promise.reject(error); 
    }
);


axiosInstance.interceptors.response.use(
    (response) => response, 
    (error) => {
        // If the error response indicates token expiration or invalidity (e.g., 401 Unauthorized, 403 Forbidden)
        if (error.response && (error.response.status === 401 || error.response.status === 403)) {
            console.error('Authentication error: Token expired or invalid. Redirecting to login.');
            localStorage.removeItem('token'); 
            window.location.href = '/Login'; 
        }
        return Promise.reject(error); 
    }
);

export default axiosInstance