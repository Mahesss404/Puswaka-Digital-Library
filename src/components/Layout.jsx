import React, { useLayoutEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import Header from './Header';
import Footer from './Footer';

/**
 * Layout component that wraps Header and Footer around child pages
 * This eliminates the need to import Header/Footer on each individual page
 * Includes scroll restoration to top on route changes
 * Applies max-width constraint (1280px) to all page content
 */
const Layout = () => {
    const { pathname } = useLocation();

    // Scroll to top on route change - useLayoutEffect prevents flicker
    useLayoutEffect(() => {
        window.scrollTo(0, 0);
    }, [pathname]);

    return (
        <div className="min-h-screen flex flex-col">
            <Header />
            <main className="flex-1">
                <div className="max-w-7xl mx-auto">
                    <Outlet />
                </div>
            </main>
            <Footer />
        </div>
    );
};

export default Layout;
