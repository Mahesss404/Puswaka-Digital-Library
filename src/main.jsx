import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import Home from "./pages/Home.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import Login from "./pages/Login.jsx";
import Registration from "./pages/Registration.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import AdminProtectedRoute from "./components/AdminProtectedRoute.jsx";
import Verification from "./Verification.jsx";
import IdCard from "@/pages/IdCard.jsx";
import BookDetail from './pages/BookDetail';
import Profile from './pages/Profile.jsx';
import Admin from './pages/admin';
import BookCatalog from './pages/BookCatalog';

const router = createBrowserRouter([
    { path: '/',
        element: (localStorage.getItem("auth")
                ? <Navigate to="/home" replace /> : <Navigate to="/login" replace />
        ),
    },
    { path: '/app',
        element:
        <ProtectedRoute>
            <App />
        </ProtectedRoute>
    },
    { path: '/home', element: <Home />,},
    { 
        path: '/profile', 
        element: (
            <ProtectedRoute>
                <Profile />
            </ProtectedRoute>
        ),
    },
    { path: '*', element: <NotFoundPage />,},
    { path: '/login', element: <Login />,},
    { path: '/registration', element: <Registration />,},
    { path: '/verification', element: <Verification />,},
    { path: '/idcard', element: <IdCard />,},
    { path: '/book/:id', element: <BookDetail />,},
    { path: '/catalog', element: <BookCatalog />,},
    { 
        path: '/admin', 
        element: (
            <AdminProtectedRoute>
                <Admin />
            </AdminProtectedRoute>
        ),
    },





]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
