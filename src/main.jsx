import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { HelmetProvider } from 'react-helmet-async'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, Navigate, RouterProvider, Outlet} from "react-router-dom";
import Home from "./pages/Home.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import Login from "./pages/Auth/Login.jsx";
import Registration from "./pages/Auth/Registration.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Verification from "./pages/Auth/Verification.jsx";
import BookDetail from './pages/Books/BookDetail';
import Profile from './pages/Users/Profile.jsx';
import BookCatalog from './pages/Books/BookCatalog';
import History from './pages/Users/History';
import Notification from './pages/Users/Notification/Notification';
import NotificationDetails from './pages/Users/Notification/NotificationDetails';
import Dashboard from './pages/Admin/Dashboard';
import DashboardBooks from './pages/Admin/Dashboard/Books';
import DashboardMembers from './pages/Admin/Dashboard/Members';
import DashboardTransactions from './pages/Admin/Dashboard/Transactions';
import Landingpage from './Landingpage'
import Layout from './components/Layout.jsx'

const router = createBrowserRouter([
    { 
        path: '/',
        element: <Landingpage />,
    },
    { path: '/login', element: <Login />,},
    { path: '/registration', element: <Registration />,},
    { path: '/verification', element: <Verification />,},
    // User routes - protected, ADMINs redirected to /admin
    // Layout component wraps all protected routes with Header and Footer
    {
        element: (
            <ProtectedRoute>
                <Layout />
            </ProtectedRoute>
        ),
        children: [
            { path: '/app', element: <App /> },
            { path: '/home', element: <Home /> },
            { path: '/profile', element: <Profile /> },
            { path: '/history', element: <History /> },
            { path: '/book/:id', element: <BookDetail /> },
            { path: '/catalog', element: <BookCatalog /> },
            { path: '/notification', element: <Notification /> },
            { path: '/notification/:id', element: <NotificationDetails /> },
        ]
    },
    // Admin routes - separate from user routes, only ADMIN role can access
    { 
        path: '/admin',
        element: (
            <AdminProtectedRoute>
                <Dashboard />
            </AdminProtectedRoute>
        ),
        children: [
            { path: 'books', element: <DashboardBooks /> },
            { path: 'members', element: <DashboardMembers /> },
            { path: 'transactions', element: <DashboardTransactions /> },
        ]
    },
    { path: '*', element: <NotFoundPage />,},
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <HelmetProvider>
      <RouterProvider router={router}/>
    </HelmetProvider>
  </StrictMode>,
)
