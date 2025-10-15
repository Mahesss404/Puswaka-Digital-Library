import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {createBrowserRouter, RouterProvider} from "react-router-dom";
import Home from "./pages/Home.jsx";
import About from "./pages/About.jsx";
import NotFoundPage from "./NotFoundPage.jsx";

const router = createBrowserRouter([
    { path: '/', element: <Home />,},
    { path: '/app', element: <App />,},
    { path: '/About', element: <About />,},
    { path: '*', element: <NotFoundPage />,},


]);

createRoot(document.getElementById('root')).render(
  <StrictMode>
      <RouterProvider router={router}/>
  </StrictMode>,
)
