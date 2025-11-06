import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import App from "../App.jsx";
import About from "./About.jsx";

const Home = () => {
    const navigate = useNavigate();
    const [username, setUsername] = useState("");

    useEffect(() => {
        const isAuth = localStorage.getItem("auth");
        const name = localStorage.getItem("username");

        if (!isAuth) {
            navigate("/");
        } else {
            setUsername(name);
        }
    }, [navigate]);

    const handleLogout = () => {
        localStorage.removeItem("auth");
        localStorage.removeItem("username");
        navigate("/login");
    };

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
            <h1 className="text-3xl font-bold mb-4">Selamat datang, {username} 👋</h1>
            <button
                onClick={handleLogout}
                className="bg-red-500 text-white px-4 py-2 rounded-md hover:bg-red-600 transition"
            >
                Logout
            </button>
        </div>
    );
};

export default Home;