import React from 'react';
import {Link} from "react-router-dom";
import App from "../App.jsx";
import About from "./About.jsx";
import NotFoundPage from "../NotFoundPage.jsx";

const Home = () => {
        const routes  = [
                { path: '/', element: <Home />, label: 'Home' },
                { path: '/app', element: <App />, label: 'App' },
                { path: '/About', element: <About />, label: 'About' },

            ]
    return (

        <div className="flex flex-col gap-4">
            <nav className="bg-red-300 border-red-500 border-2 p-4 rounded-md">
                <ul className="flex gap-2  justify-between">
                    {routes.map((route) => (
                        <li key={route.path}>
                            <Link className="bg-[#d9d9d9] p-2 rounded-md" to={route.path}>{route.label}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <h1>Ini Homepage</h1>
        </div>
    );
};

export default Home;