import React from 'react';
import { Outlet } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

/**
 * Layout component that wraps Header and Footer around child pages
 * This eliminates the need to import Header/Footer on each individual page
 */
const Layout = () => {
    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <Outlet />
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
