import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, Navigate, RouterProvider} from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import NotFoundPage from "./NotFoundPage.jsx";
import Login from "./pages/Login.jsx";
import ProtectedRoute from "./components/ProtectedRoute.jsx";
import Verification from "./Verification.jsx";

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
    { path: '/Login', element: <Login />,},
    { path: '/Verification', element: <Verification />,},




]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
