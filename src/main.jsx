import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
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
        )
    },
    { 
        path: '/history', 
        element: (
            <ProtectedRoute>
                <History />
            </ProtectedRoute>
        )
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
