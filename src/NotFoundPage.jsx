import React from 'react';
import {Link} from "react-router-dom";

const NotFoundPage = () => {
    return (
        <div>
            This page doesn't exist!'
            <Link to="/">
                <button type="button">back to home</button>
            </Link>
        </div>
    );
};

export default NotFoundPage;