import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { 
    BookOpen, 
    Search, 
    Clock, 
    Shield, 
    Users, 
    Star,
    ChevronDown,
    ChevronUp,
    BookMarked,
    Library,
    Sparkles,
    ArrowRight,
    CheckCircle,
    Menu,
    X
} from 'lucide-react';

const Landingpage = () => {
    const [openFaq, setOpenFaq] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Handle scroll for navbar background
    useEffect(() => {
        const handleScroll = () => {
            setIsScrolled(window.scrollY > 50);
        };
        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    const features = [
        {
            icon: BookOpen,
            title: "Extensive Book Collection",
            description: "Access thousands of books across various genres, from classic literature to modern bestsellers."
        },
        {
            icon: Search,
            title: "Smart Search",
            description: "Find your next read instantly with our intelligent search and category filtering system."
        },
        {
            icon: Clock,
            title: "24/7 Access",
            description: "Borrow and read books anytime, anywhere. Your digital library is always open."
        },
        {
            icon: Shield,
            title: "Secure & Private",
            description: "Your reading history and personal data are protected with enterprise-grade security."
        },
        {
            icon: Users,
            title: "Community Driven",
            description: "Join a community of readers, share reviews, and discover new favorites together."
        },
        {
            icon: Star,
            title: "Personalized Recommendations",
            description: "Get book suggestions tailored to your reading preferences and interests."
        }
    ];

    const benefits = [
        "Unlimited access to digital books",
        "No late fees or penalties",
        "Read on any device",
        "Offline reading support",
        "Track your reading progress",
        "Create personal book lists"
    ];

    const faqs = [
        {
            question: "What is Puswaka Digital Library?",
            answer: "Puswaka is a modern digital library platform that allows you to browse, borrow, and read books online. We offer a vast collection of books across multiple genres, accessible from any device."
        },
        {
            question: "How do I borrow a book?",
            answer: "Simply create an account, browse our catalog, and click the 'Borrow' button on any available book. The book will be added to your reading list, and you can start reading immediately."
        },
        {
            question: "Is there a limit to how many books I can borrow?",
            answer: "Yes, to ensure fair access for all members, you can borrow up to 5 books at a time. Once you return a book, you can borrow another one."
        },
        {
            question: "How long can I keep a borrowed book?",
            answer: "The standard borrowing period is 14 days. You'll receive notifications before your due date, and you can extend the borrowing period if no one else is waiting for the book."
        },
        {
            question: "Is my reading history private?",
            answer: "Absolutely! Your reading history and personal information are completely private and protected. We use industry-standard encryption to keep your data safe."
        }
    ];

    const stats = [
        { value: "10K+", label: "Books Available" },
        { value: "5K+", label: "Active Members" },
        { value: "50+", label: "Categories" },
        { value: "99.9%", label: "Uptime" }
    ];

    const toggleFaq = (index) => {
        setOpenFaq(openFaq === index ? null : index);
    };

    return (
        <div className="min-h-screen bg-white overflow-x-hidden">
            {/* Navigation */}
            <nav className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 ${
                isScrolled ? 'bg-white/95 backdrop-blur-md shadow-lg' : 'bg-transparent'
            }`}>
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex items-center justify-between h-16 sm:h-20">
                        {/* Logo */}
                        <Link to="/" className="flex items-center gap-2 group">
                            <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center shadow-lg group-hover:shadow-primary/30 transition-all duration-300">
                                <Library className="w-5 h-5 text-white" />
                            </div>
                            <span className={`text-xl font-bold transition-colors duration-300 ${
                                isScrolled ? 'text-gray-900' : 'text-gray-900'
                            }`}>
                                Puswaka
                            </span>
                        </Link>

                        {/* Desktop Navigation */}
                        <div className="hidden md:flex items-center gap-8">
                            <a href="#features" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>Features</a>
                            <a href="#benefits" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>Benefits</a>
                            <a href="#faq" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>FAQ</a>
                        </div>

                        {/* Auth Buttons
                        <div className="hidden md:flex items-center gap-3">
                            <Link 
                                to="/login"
                                className=" px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-300"
                            >
                                Admin Login
                            </Link>
                        </div> */}

                        {/* Mobile Menu Button */}
                        <button 
                            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
                            className="md:hidden p-2 rounded-xl hover:bg-gray-100 transition-colors"
                        >
                            {isMobileMenuOpen ? (
                                <X className="w-6 h-6 text-gray-900" />
                            ) : (
                                <Menu className="w-6 h-6 text-gray-900" />
                            )}
                        </button>
                    </div>

                    {/* Mobile Menu */}
                    <div className={`md:hidden transition-all duration-300 overflow-hidden ${
                        isMobileMenuOpen ? 'max-h-96 pb-4' : 'max-h-0'
                    }`}>
                        <div className="flex flex-col gap-2 pt-2">
                            <a href="#features" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">Features</a>
                            <a href="#benefits" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">Benefits</a>
                            <a href="#faq" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">FAQ</a>
                            <hr className="my-2 border-gray-200" />
                            {/* <Link to="/login" className="px-4 py-2 text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors">
                                Admin Login
                            </Link> */}
                            <Link to="/login" className="mx-4 py-2.5 text-center font-semibold text-white bg-gradient-to-r from-primary to-blue-600 rounded-xl">
                                Login
                            </Link>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Hero Section */}
            <section className="relative pt-24 sm:pt-32 pb-16 sm:pb-24 overflow-hidden">
                {/* Background Gradient */}
                <div className="absolute inset-0 bg-gradient-to-br from-blue-50 via-white to-primary/5" />
                
                {/* Animated Background Elements */}
                <div className="absolute top-20 left-10 w-72 h-72 bg-primary/10 rounded-full blur-3xl animate-pulse" />
                <div className="absolute bottom-10 right-10 w-96 h-96 bg-blue-400/10 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1s' }} />
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gradient-to-r from-primary/5 to-blue-400/5 rounded-full blur-3xl" />
                
                {/* Floating Book Icons */}
                <div className="absolute top-32 left-[15%] animate-float">
                    <BookMarked className="w-8 h-8 text-primary/30" />
                </div>
                <div className="absolute top-48 right-[20%] animate-float" style={{ animationDelay: '0.5s' }}>
                    <BookOpen className="w-10 h-10 text-blue-400/30" />
                </div>
                <div className="absolute bottom-32 left-[25%] animate-float" style={{ animationDelay: '1s' }}>
                    <Sparkles className="w-6 h-6 text-primary/40" />
                </div>

                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="text-center max-w-4xl mx-auto">
                        {/* Badge */}
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-6 animate-fadeIn">
                            <Sparkles className="w-4 h-4" />
                            Welcome to Your Digital Library
                        </div>

                        {/* Main Headline */}
                        <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 leading-tight mb-6">
                            Discover a World of
                            <span className="relative inline-block ml-3">
                                <span className="relative z-10 bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                    Knowledge
                                </span>
                                <svg className="absolute -bottom-2 left-0 w-full" viewBox="0 0 200 12" fill="none">
                                    <path d="M2 10C50 2 150 2 198 10" stroke="url(#gradient)" strokeWidth="4" strokeLinecap="round"/>
                                    <defs>
                                        <linearGradient id="gradient" x1="0" y1="0" x2="200" y2="0">
                                            <stop stopColor="#4995ED"/>
                                            <stop offset="1" stopColor="#2563eb"/>
                                        </linearGradient>
                                    </defs>
                                </svg>
                            </span>
                        </h1>

                        <p className="text-lg sm:text-xl text-gray-600 mb-8 max-w-2xl mx-auto leading-relaxed">
                            Access thousands of books at your fingertips. Browse, borrow, and read from anywhere, 
                            at any time. Your personal library is just a click away.
                        </p>

                        {/* CTA Buttons */}
                        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12">
                            <Link 
                                to="/login"
                                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </Link>
                            <a 
                                href="#features"
                                className="w-full sm:w-auto px-8 py-4 bg-white text-gray-700 font-semibold rounded-2xl ring-1 ring-gray-200 hover:ring-primary/30 hover:bg-gray-50 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Explore Features
                            </a>
                        </div>

                        {/* Stats */}
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 sm:gap-8 max-w-3xl mx-auto">
                            {stats.map((stat, index) => (
                                <div 
                                    key={index}
                                    className="group p-4 bg-white/60 backdrop-blur-sm rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:shadow-lg transition-all duration-300"
                                >
                                    <div className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                                        {stat.value}
                                    </div>
                                    <div className="text-sm text-gray-500">{stat.label}</div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>
            </section>

            {/* Features Section */}
            <section id="features" className="py-16 sm:py-24 bg-white relative">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                            <BookOpen className="w-4 h-4" />
                            Features
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Everything You Need for
                            <span className="text-primary"> Better Reading</span>
                        </h2>
                        <p className="text-gray-600">
                            Discover powerful features designed to enhance your reading experience and help you manage your library effortlessly.
                        </p>
                    </div>

                    {/* Features Grid */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 sm:gap-8">
                        {features.map((feature, index) => {
                            const IconComponent = feature.icon;
                            return (
                                <div 
                                    key={index}
                                    className="group p-6 sm:p-8 bg-white rounded-2xl ring-1 ring-gray-100 hover:ring-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-1 transition-all duration-300"
                                >
                                    <div className="w-14 h-14 bg-gradient-to-br from-primary/10 to-blue-100 rounded-2xl flex items-center justify-center mb-5 group-hover:scale-110 transition-transform duration-300">
                                        <IconComponent className="w-7 h-7 text-primary" />
                                    </div>
                                    <h3 className="text-xl font-semibold text-gray-900 mb-3">
                                        {feature.title}
                                    </h3>
                                    <p className="text-gray-600 leading-relaxed">
                                        {feature.description}
                                    </p>
                                </div>
                            );
                        })}
                    </div>
                </div>
            </section>

            {/* Benefits Section */}
            <section id="benefits" className="py-16 sm:py-24 relative overflow-hidden">
                {/* Background */}
                <div className="absolute inset-0 bg-gradient-to-br from-primary via-blue-600 to-blue-700" />
                <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmYiIGZpbGwtb3BhY2l0eT0iMC4wNSI+PGNpcmNsZSBjeD0iMzAiIGN5PSIzMCIgcj0iMiIvPjwvZz48L2c+PC9zdmc+')] opacity-50" />
                
                <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid lg:grid-cols-2 gap-12 items-center">
                        {/* Left Content */}
                        <div>
                            <div className="inline-flex items-center gap-2 px-4 py-2 bg-white/10 rounded-full text-white/90 text-sm font-medium mb-6">
                                <Star className="w-4 h-4" />
                                Why Choose Us
                            </div>
                            <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 leading-tight">
                                Experience the Future of 
                                <span className="block">Digital Libraries</span>
                            </h2>
                            <p className="text-blue-100 text-lg leading-relaxed mb-8">
                                Join thousands of readers who have transformed their reading habits with Puswaka. 
                                Our platform makes it easy to discover, borrow, and enjoy books like never before.
                            </p>

                            <div className="grid sm:grid-cols-2 gap-4">
                                {benefits.map((benefit, index) => (
                                    <div 
                                        key={index}
                                        className="flex items-center gap-3 p-3 bg-white/10 backdrop-blur-sm rounded-xl hover:bg-white/15 transition-colors"
                                    >
                                        <div className="w-6 h-6 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0">
                                            <CheckCircle className="w-4 h-4 text-white" />
                                        </div>
                                        <span className="text-white text-sm font-medium">{benefit}</span>
                                    </div>
                                ))}
                            </div>
                        </div>

                        {/* Right Content - Illustration */}
                        <div className="relative">
                            <div className="relative z-10 bg-white/10 backdrop-blur-sm rounded-3xl p-8 ring-1 ring-white/20">
                                <div className="grid grid-cols-2 gap-4">
                                    {/* Book Cards */}
                                    <div className="space-y-4">
                                        <div className="bg-white rounded-2xl p-4 shadow-xl hover:-translate-y-1 transition-transform cursor-pointer">
                                            <div className="w-full h-32 bg-gradient-to-br from-orange-100 to-orange-200 rounded-xl mb-3 flex items-center justify-center">
                                                <BookOpen className="w-12 h-12 text-orange-400" />
                                            </div>
                                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                                        </div>
                                        <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-primary/20 rounded-full flex items-center justify-center">
                                                    <Star className="w-5 h-5 text-primary" />
                                                </div>
                                                <div>
                                                    <div className="h-2 bg-gray-200 rounded w-20 mb-1" />
                                                    <div className="h-2 bg-gray-100 rounded w-16" />
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                    <div className="space-y-4 mt-8">
                                        <div className="bg-white/80 rounded-2xl p-4 shadow-lg">
                                            <div className="flex items-center gap-3">
                                                <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                                </div>
                                                <div>
                                                    <div className="text-xs font-medium text-gray-900">Book Borrowed!</div>
                                                    <div className="text-xs text-gray-500">Just now</div>
                                                </div>
                                            </div>
                                        </div>
                                        <div className="bg-white rounded-2xl p-4 shadow-xl hover:-translate-y-1 transition-transform cursor-pointer">
                                            <div className="w-full h-32 bg-gradient-to-br from-blue-100 to-blue-200 rounded-xl mb-3 flex items-center justify-center">
                                                <BookMarked className="w-12 h-12 text-blue-400" />
                                            </div>
                                            <div className="h-3 bg-gray-200 rounded w-3/4 mb-2" />
                                            <div className="h-2 bg-gray-100 rounded w-1/2" />
                                        </div>
                                    </div>
                                </div>
                            </div>
                            
                            {/* Decorative Elements */}
                            <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-2xl" />
                            <div className="absolute -bottom-8 -left-8 w-40 h-40 bg-blue-300/20 rounded-full blur-2xl" />
                        </div>
                    </div>
                </div>
            </section>

            {/* FAQ Section */}
            <section id="faq" className="py-16 sm:py-24 bg-gray-50">
                <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center mb-12">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            FAQ
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Frequently Asked
                            <span className="text-primary"> Questions</span>
                        </h2>
                        <p className="text-gray-600">
                            Find answers to common questions about Puswaka Digital Library.
                        </p>
                    </div>

                    {/* FAQ Accordion */}
                    <div className="space-y-4">
                        {faqs.map((faq, index) => (
                            <div 
                                key={index}
                                className={`bg-white rounded-2xl ring-1 transition-all duration-300 overflow-hidden ${
                                    openFaq === index 
                                        ? 'ring-primary/30 shadow-lg shadow-primary/5' 
                                        : 'ring-gray-200 hover:ring-gray-300'
                                }`}
                            >
                                <button
                                    onClick={() => toggleFaq(index)}
                                    className="w-full px-6 py-5 flex items-center justify-between text-left"
                                >
                                    <span className="font-semibold text-gray-900 pr-4">
                                        {faq.question}
                                    </span>
                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-colors ${
                                        openFaq === index ? 'bg-primary text-white' : 'bg-gray-100 text-gray-500'
                                    }`}>
                                        {openFaq === index ? (
                                            <ChevronUp className="w-5 h-5" />
                                        ) : (
                                            <ChevronDown className="w-5 h-5" />
                                        )}
                                    </div>
                                </button>
                                <div className={`transition-all duration-300 ${
                                    openFaq === index ? 'max-h-96 opacity-100' : 'max-h-0 opacity-0'
                                }`}>
                                    <p className="px-6 pb-5 text-gray-600 leading-relaxed">
                                        {faq.answer}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Still Have Questions */}
                    <div className="mt-12 text-center p-6 sm:p-8 bg-white rounded-2xl ring-1 ring-gray-200">
                        <h3 className="text-xl font-semibold text-gray-900 mb-2">
                            Still have questions?
                        </h3>
                        <p className="text-gray-600 mb-4">
                            Can't find the answer you're looking for? We're here to help!
                        </p>
                        <a 
                            href="mailto:support@puswaka.com"
                            className="inline-flex items-center gap-2 px-6 py-3 bg-primary text-white font-semibold rounded-xl hover:bg-primary/90 transition-colors"
                        >
                            Contact Support
                            <ArrowRight className="w-4 h-4" />
                        </a>
                    </div>
                </div>
            </section>

            {/* CTA Section */}
            <section className="py-16 sm:py-24 bg-white relative overflow-hidden">
                {/* Background Elements */}
                <div className="absolute top-0 left-1/4 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
                <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-blue-400/5 rounded-full blur-3xl" />
                
                <div className="relative max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
                    <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        Ready to Start Your
                        <span className="block bg-gradient-to-r from-primary to-blue-600 bg-clip-text text-transparent">
                            Reading Journey?
                        </span>
                    </h2>
                    <p className="text-lg text-gray-600 mb-8 max-w-2xl mx-auto">
                        Join Puswaka today and unlock access to thousands of books. 
                        Start reading for free and discover your next favorite book.
                    </p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                        <Link 
                            to="/login"
                            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Start Reading Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </Link>
                        {/* <Link 
                            to="/login"
                            className="w-full sm:w-auto px-8 py-4 bg-gray-900 text-white font-semibold rounded-2xl hover:bg-gray-800 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Admin Dashboard
                        </Link> */}
                    </div>
                </div>
            </section>

            {/* Footer */}
            <footer className="bg-gray-900 text-gray-400 py-12 sm:py-16">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-8 mb-12">
                        {/* Brand */}
                        <div className="col-span-full lg:col-span-1">
                            <Link to="/" className="flex items-center gap-2 mb-4">
                                <div className="w-10 h-10 bg-gradient-to-br from-primary to-blue-600 rounded-xl flex items-center justify-center">
                                    <Library className="w-5 h-5 text-white" />
                                </div>
                                <span className="text-xl font-bold text-white">Puswaka</span>
                            </Link>
                            <p className="text-sm leading-relaxed">
                                Your gateway to knowledge. Discover, borrow, and read thousands of books from anywhere.
                            </p>
                        </div>

                        {/* Quick Links */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Quick Links</h4>
                            <ul className="space-y-2">
                                <li><a href="#features" className="text-sm hover:text-white transition-colors">Features</a></li>
                                <li><a href="#benefits" className="text-sm hover:text-white transition-colors">Benefits</a></li>
                                <li><a href="#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        {/* Access */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Access</h4>
                            <ul className="space-y-2">
                                <li><Link to="/login" className="text-sm hover:text-white transition-colors">User Login</Link></li>
                                <li><Link to="/login" className="text-sm hover:text-white transition-colors">Admin Login</Link></li>
                                <li><Link to="/registration" className="text-sm hover:text-white transition-colors">Register</Link></li>
                            </ul>
                        </div>

                        {/* Contact */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Contact</h4>
                            <ul className="space-y-2">
                                <li className="text-sm">support@puswaka.com</li>
                                <li className="text-sm">+62 123 456 789</li>
                            </ul>
                        </div>
                    </div>

                    <div className="pt-8 border-t border-gray-800 flex flex-col sm:flex-row items-center justify-between gap-4">
                        <p className="text-sm">© 2024 Puswaka. All rights reserved.</p>
                        <div className="flex items-center gap-6">
                            <a href="#" className="text-sm hover:text-white transition-colors">Privacy Policy</a>
                            <a href="#" className="text-sm hover:text-white transition-colors">Terms of Service</a>
                        </div>
                    </div>
                </div>
            </footer>

            {/* Custom Styles */}
            <style>{`
                @keyframes float {
                    0%, 100% { transform: translateY(0px); }
                    50% { transform: translateY(-20px); }
                }
                
                @keyframes fadeIn {
                    from { opacity: 0; transform: translateY(10px); }
                    to { opacity: 1; transform: translateY(0); }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }
                
                /* Hide scrollbar for Chrome, Safari and Opera */
                .scrollbar-hide::-webkit-scrollbar {
                    display: none;
                }
                
                /* Hide scrollbar for IE, Edge and Firefox */
                .scrollbar-hide {
                    -ms-overflow-style: none;
                    scrollbar-width: none;
                }
            `}</style>
        </div>
    );
};

export default Landingpage;