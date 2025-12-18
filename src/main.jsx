import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
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
import IdCard from "@/pages/Auth/IdCard.jsx";
import BookDetail from './pages/Books/BookDetail';
import Profile from './pages/Users/Profile.jsx';
import Admin from './pages/Admin/Admin';
import BookCatalog from './pages/Books/BookCatalog';
import History from './pages/Users/History';
import Notification from './pages/Users/Notification';

const router = createBrowserRouter([
    { path: '/',
        element: (localStorage.getItem("auth")
                ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
        ),
    },
    { path: '/login', element: <Login />,},
    { path: '/registration', element: <Registration />,},
    { path: '/verification', element: <Verification />,},
    { path: '/idcard', element: <IdCard />,},
    {
        element: (
            <ProtectedRoute>
                <Outlet />
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
            { 
                path: '/admin', 
                element: (
                    <AdminProtectedRoute>
                        <Admin />
                    </AdminProtectedRoute>
                ),
            },
        ]
    },
    { path: '*', element: <NotFoundPage />,},
]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
