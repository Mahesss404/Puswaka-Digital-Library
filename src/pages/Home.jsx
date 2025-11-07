import React, {useEffect, useState} from 'react';
import {Link, useNavigate} from "react-router-dom";
import App from "../App.jsx";
import About from "./About.jsx";
import Book from '../components/ui/Book.jsx';
import { Button } from '@/components/ui/Buttons.jsx';
import { ArrowRight } from 'lucide-react';
import { ArrowRightIcon } from '@radix-ui/react-icons';

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
        
        <div className="flex flex-col gap-4 px-[20px] py-[20px] h-screen ">
            {/* Navbar */}
            <nav className="bg-red-300 border-red-500 border-2 p-4 rounded-md">
                <ul className="flex gap-2  justify-between">
                    {routes.map((route) => (
                        <li key={route.path}>
                            <Link className="bg-[#d9d9d9] p-2 rounded-md" to={route.path}>{route.label}</Link>
                        </li>
                    ))}
                </ul>
            </nav>
            <h2 className="text-2xl font-bold mb-4 text-start max-w-[250px] text-white">Selamat datang, {username} 👋</h2>
            
            {/* Book Group */}
            <div className="flex gap-2 items-center">
            <Book
            coverSrc="https://placehold.co/147x217"
            title="The Great Gatsby"
            author="F. Scott Fitzgerald"
            />
            <Book
            coverSrc="https://placehold.co/147x217"
            title="The Great Gatsby"
            author="F. Scott Fitzgerald"
            />
            <div className="whitespace-nowrap flex flex-col items-center p-4 rounded-4xl bg-red-200 opacity-75">
                <ArrowRightIcon />
                <h3 className="text-sm">See all</h3>
            </div>
            </div>

            {/* Logout Button */}
            <Button
            variant="outline"
            size="lg"
            onClick={handleLogout}
            className="bg-red-500 text-white border-red-500 border-2 rounded-md"
            > Logout</Button>    
        </div>
    );
};

export default Home;