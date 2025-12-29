import React, { useState, useEffect } from 'react';
import { Navigate } from "react-router-dom";
import { onAuthStateChanged } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";

// ProtectedRoute Auth - Uses Firebase onAuthStateChanged
// Also checks role: ADMIN users are redirected to /admin (they can only access dashboard)
const ProtectedRoute = ({ children }) => {
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

            // User is authenticated, check their role
            try {
                const userDocRef = doc(db, "users", user.uid);
                const userDocSnap = await getDoc(userDocRef);
                const userData = userDocSnap.exists() ? userDocSnap.data() : null;
                const isAdmin = userData?.role === "ADMIN";

                setAuthState({
                    isAuthenticated: true,
                    isAdmin: isAdmin,
                    isLoading: false
                });
            } catch (error) {
                console.error('Error checking user role:', error);
                setAuthState({
                    isAuthenticated: true,
                    isAdmin: false,
                    isLoading: false
                });
            }
        });

        return () => unsubscribe();
    }, []);

    // Show loading state while checking auth
    if (authState.isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading...</p>
                </div>
            </div>
        );
    }

    // Redirect to login if not authenticated
    if (!authState.isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // ADMIN users can only access /admin routes - redirect them to admin dashboard
    if (authState.isAdmin) {
        return <Navigate to="/admin" replace />;
    }

    return children;
};

export default ProtectedRoute;