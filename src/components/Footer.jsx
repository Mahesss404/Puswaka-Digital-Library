import React from 'react';
import { Link } from 'react-router-dom';
import { BookOpen, Mail, Phone, MapPin } from 'lucide-react';

const Footer = () => {
    const currentYear = new Date().getFullYear();

    return (
        <footer className="text-gray-400 py-8 sm:py-12 mt-auto">
            <div className="max-w-7xl mx-auto px-4 sm:px-6">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
                    {/* Brand Section */}
                    <div className="col-span-1 md:col-span-2">
                        <div className="flex items-center gap-2 mb-4">
                            <BookOpen className="w-8 h-8 text-blue-500" />
                            <span className="text-xl font-bold text-primary">Puswaka</span>
                        </div>
                        <p className="text-sm mb-4">
                            Your digital gateway to knowledge. Browse, borrow, and explore our extensive collection of books.
                        </p>
                        <div className="flex flex-col gap-2 text-sm">
                            <div className="flex items-center gap-2">
                                <Mail className="w-4 h-4" />
                                <a href="mailto:info@puswaka.com" className="hover:text-primary transition-colors">
                                    info@puswaka.com
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <Phone className="w-4 h-4" />
                                <a href="tel:+6281234567890" className="hover:text-primary transition-colors">
                                    +62 812-3456-7890
                                </a>
                            </div>
                            <div className="flex items-center gap-2">
                                <MapPin className="w-4 h-4" />
                                <span>Jakarta, Indonesia</span>
                            </div>
                        </div>
                    </div>

                    {/* Quick Links */}
                    <div>
                        <h3 className="text-primary font-semibold mb-4">Quick Links</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <Link to="/home" className="hover:text-primary transition-colors">
                                    Home
                                </Link>
                            </li>
                            <li>
                                <Link to="/catalog" className="hover:text-primary transition-colors">
                                    Book Catalog
                                </Link>
                            </li>
                            <li>
                                <Link to="/history" className="hover:text-primary transition-colors">
                                    History
                                </Link>
                            </li>
                            <li>
                                <Link to="/profile" className="hover:text-primary transition-colors">
                                    Profile
                                </Link>
                            </li>
                        </ul>
                    </div>

                    {/* Support */}
                    <div>
                        <h3 className="text-primary font-semibold mb-4">Support</h3>
                        <ul className="space-y-2 text-sm">
                            <li>
                                <a href="#" className="hover:text-primary transition-colors">
                                    Help Center
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary transition-colors">
                                    Privacy Policy
                                </a>
                            </li>
                            <li>
                                <a href="#" className="hover:text-primary transition-colors">
                                    Terms of Service
                                </a>
                            </li>
                            <li>
                                <Link to="/notification" className="hover:text-primary transition-colors">
                                    Notifications
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>

                {/* Copyright */}
                <div className="border-t border-gray-200 mt-8 pt-8 text-center text-sm">
                    <p>© {currentYear} Puswaka Digital Library. All rights reserved.</p>
                </div>
            </div>
        </footer>
    );
};

export default Footer;
