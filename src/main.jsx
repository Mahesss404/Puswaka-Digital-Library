import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import Login from "./pages/Login.jsx";
import Registration from "./pages/Registration.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Verification from "./Verification.jsx";
import IdCard from "@/pages/IdCard.jsx";
import BookBorrowSystem from './pages/admin';
import BookDetail from './pages/BookDetail';

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
    { path: '/about', element: <About />,},
    { path: '*', element: <NotFoundPage />,},
    { path: '/login', element: <Login />,},
    { path: '/registration', element: <Registration />,},
    { path: '/verification', element: <Verification />,},
    { path: '/idcard', element: <IdCard />,},
    { path: '/book/:id', element: <BookDetail />,},
    { path: '/admin', element: <BookBorrowSystem />,},





]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
