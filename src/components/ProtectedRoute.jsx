import React from 'react';
import {Navigate} from "react-router-dom";

// ProtectedRoute Auth

const ProtectedRoute = ({children}) => {
    const isAuthenticated = localStorage.getItem("auth");

    // logic auth
    if (isAuthenticated) {
        return <Navigate to="/login" replace />
    }
    return children
};

export default ProtectedRoute;