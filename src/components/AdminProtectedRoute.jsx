import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// AdminProtectedRoute - Only allows admin users to access
const AdminProtectedRoute = ({ children }) => {
    const [authState, setAuthState] = useState({
        isAuthenticated: null,
        isAdmin: false,
        isLoading: true
    });

    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setAuthState({
                    isAuthenticated: false,
                    isAdmin: false,
                    isLoading: false
                });
                return;
            }

            // User is authenticated, check if admin
            try {
                const userEmail = user.email;

                // Check if email exists in admins collection
                const adminsQuery = query(
                    collection(db, 'admins'),
                    where('email', '==', userEmail)
                );
                const adminSnapshot = await getDocs(adminsQuery);

                setAuthState({
                    isAuthenticated: true,
                    isAdmin: !adminSnapshot.empty,
                    isLoading: false
                });
            } catch (error) {
                console.error('Error checking admin status:', error);
                setAuthState({
                    isAuthenticated: true,
                    isAdmin: false,
                    isLoading: false
                });
            }
        });

        return () => unsubscribe();
    }, []);

    if (authState.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!authState.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (!authState.isAdmin) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default AdminProtectedRoute;
