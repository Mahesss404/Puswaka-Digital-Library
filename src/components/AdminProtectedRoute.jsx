import React, { useEffect, useState } from 'react';
import { Navigate } from "react-router-dom";
import { auth } from "@/lib/firebase";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "@/lib/firebase";
import { onAuthStateChanged } from "firebase/auth";

// AdminProtectedRoute - Only allows admin users to access
const AdminProtectedRoute = ({ children }) => {
    const [isAdmin, setIsAdmin] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    const isAuthenticated = localStorage.getItem("auth") === "true";

    useEffect(() => {
        if (!isAuthenticated) {
            setIsLoading(false);
            return;
        }

        // Check if user is admin
        const unsubscribe = onAuthStateChanged(auth, async (user) => {
            if (!user) {
                setIsAdmin(false);
                setIsLoading(false);
                return;
            }

            try {
                const userEmail = user.email;

                // Check if email exists in admins collection
                const adminsQuery = query(
                    collection(db, 'admins'),
                    where('email', '==', userEmail)
                );
                const adminSnapshot = await getDocs(adminsQuery);

                if (!adminSnapshot.empty) {
                    setIsAdmin(true);
                } else {
                    setIsAdmin(false);
                }
            } catch (error) {
                console.error('Error checking admin status:', error);
                setIsAdmin(false);
            } finally {
                setIsLoading(false);
            }
        });

        return () => unsubscribe();
    }, [isAuthenticated]);

    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Checking permissions...</p>
                </div>
            </div>
        );
    }

    if (!isAdmin) {
        return <Navigate to="/home" replace />;
    }

    return children;
};

export default AdminProtectedRoute;

