// frontend/src/components/PrivateRoute.jsx
import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode'; // For decoding JWT on the client side

const PrivateRoute = ({ allowedRoles }) => {
    const token = localStorage.getItem('token');
    let isAuthenticated = false;
    let userRole = null;

    if (token) {
        try {
            const decodedToken = jwtDecode(token);
            // Check if token is expired
            if (decodedToken.exp * 1000 > Date.now()) { // exp is in seconds, Date.now() is in milliseconds
                isAuthenticated = true;
                userRole = decodedToken.user.role;
            } else {
                localStorage.removeItem('token'); // Token expired, remove it
            }
        } catch (error) {
            console.error("Invalid token:", error);
            localStorage.removeItem('token'); // Invalid token, remove it
        }
    }

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />; // Redirect to login if not authenticated
    }

    // If allowedRoles are specified, check if user has one of them
    if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
        // You can redirect to an unauthorized page or dashboard, or show an error
        return <Navigate to="/dashboard" replace />; // Redirect to dashboard if not authorized
    }

    return <Outlet />; // Render child routes if authenticated and authorized
};

export default PrivateRoute;