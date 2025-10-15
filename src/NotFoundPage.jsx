import React from 'react';
import {Link} from "react-router-dom";
import "./App.css"

const NotFoundPage = () => {
    return (
        <>
            <h1 className="italic text-red-900 font-bold text-lg">This page doesn't exist!</h1>
            <Link to="/">
                <button type="button" className="p-2 rounded-md bg-[#d9d9d9] cursor-pointer">back to home</button>
            </Link>
        </>
    );
};

export default NotFoundPage;