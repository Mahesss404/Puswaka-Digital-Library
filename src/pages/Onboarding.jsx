import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { auth, db } from '@/lib/firebase';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { ChevronRight, ChevronLeft, BookOpen, Library, Bell } from 'lucide-react';

const Onboarding = () => {
    const navigate = useNavigate();
    const [currentStep, setCurrentStep] = useState(0);
    const [loading, setLoading] = useState(false);

    // Onboarding steps data
    const steps = [
        {
            title: "Welcome to Puswaka Digital Library",
            description: "Your gateway to thousands of books, all in one place. Start your reading journey today!",
            icon: BookOpen,
            bgGradient: "from-blue-50 to-indigo-50"
        },
        {
            title: "Browse Thousands of Books",
            description: "Explore our vast collection of books across multiple genres. Find your next favorite read with ease.",
            icon: Library,
            bgGradient: "from-indigo-50 to-purple-50"
        },
        {
            title: "Easy Borrowing & Notifications",
            description: "Borrow books with just a click and get notified about due dates and new arrivals. Start reading now!",
            icon: Bell,
            bgGradient: "from-purple-50 to-blue-50"
        }
    ];

    // Check if user has already completed onboarding
    useEffect(() => {
        const checkOnboardingStatus = async () => {
            try {
                const user = auth.currentUser;
                if (user) {
                    const userRef = doc(db, 'users', user.uid);
                    const userSnap = await getDoc(userRef);
                    
                    if (userSnap.exists()) {
                        const hasCompletedOnboarding = userSnap.data().hasCompletedOnboarding;
                        // If user has already completed onboarding, redirect to home
                        if (hasCompletedOnboarding) {
                            navigate('/home', { replace: true });
                        }
                    }
                }
            } catch (error) {
                console.error('Error checking onboarding status:', error);
            }
        };

        checkOnboardingStatus();
    }, [navigate]);

    // Handle completing onboarding
    const handleComplete = async () => {
        setLoading(true);
        try {
            const user = auth.currentUser;
            if (user) {
                // Update user document in Firestore
                const userRef = doc(db, 'users', user.uid);
                await updateDoc(userRef, {
                    hasCompletedOnboarding: true
                });
            }
            // Navigate to home
            navigate('/home', { replace: true });
        } catch (error) {
            console.error('Error completing onboarding:', error);
            // Navigate anyway to avoid blocking user
            navigate('/home', { replace: true });
        } finally {
            setLoading(false);
        }
    };

    // Handle skip
    const handleSkip = async () => {
        await handleComplete();
    };

    // Handle next step
    const handleNext = () => {
        if (currentStep < steps.length - 1) {
            setCurrentStep(currentStep + 1);
        } else {
            handleComplete();
        }
    };

    // Handle previous step
    const handlePrevious = () => {
        if (currentStep > 0) {
            setCurrentStep(currentStep - 1);
        }
    };

    const currentStepData = steps[currentStep];
    const isLastStep = currentStep === steps.length - 1;
    const isFirstStep = currentStep === 0;

    return (
        <div className={`min-h-screen bg-gradient-to-br ${currentStepData.bgGradient} relative overflow-hidden transition-all duration-500`}>
            {/* Decorative Floating Bubbles */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
                <div className="bubble bubble-1"></div>
                <div className="bubble bubble-2"></div>
                <div className="bubble bubble-3"></div>
                <div className="bubble bubble-4"></div>
                <div className="bubble bubble-5"></div>
            </div>

            {/* Skip Button */}
            <div className="absolute top-4 right-4 md:top-6 md:right-6 z-10">
                <button
                    onClick={handleSkip}
                    disabled={loading}
                    className="text-gray-600 hover:text-primary font-medium px-3 py-1.5 md:px-4 md:py-2 rounded-lg hover:bg-white/50 transition text-sm md:text-base"
                >
                    Skip
                </button>
            </div>

            {/* Main Content */}
            <div className="relative z-10 flex flex-col items-center justify-center min-h-screen px-4 py-8 md:px-6 md:py-12">

                {/* Content Card */}
                <div className="w-full max-w-2xl bg-white rounded-2xl md:rounded-3xl shadow-2xl p-6 md:p-8 lg:p-12 transition-all duration-500 transform">
                    {/* Icon */}
                    <div className="flex justify-center mb-6 md:mb-8">
                        <div className="relative w-48 h-48 sm:w-56 sm:h-56 md:w-80 md:h-80 flex items-center justify-center">
                            {/* Icon */}
                            <currentStepData.icon 
                                className="relative w-24 h-24 sm:w-32 sm:h-32 md:w-40 md:h-40 text-primary drop-shadow-lg" 
                                strokeWidth={1.5}
                            />
                        </div>
                    </div>

                    {/* Title */}
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-center text-gray-900 mb-3 md:mb-4 px-2">
                        {currentStepData.title}
                    </h1>

                    {/* Description */}
                    <p className="text-base sm:text-lg text-center text-gray-600 mb-8 md:mb-12 max-w-lg mx-auto px-2">
                        {currentStepData.description}
                    </p>

                    {/* Navigation Buttons */}
                    <div className="flex items-center justify-between gap-2 md:gap-4">
                        {/* Previous Button */}
                        <button
                            onClick={handlePrevious}
                            disabled={isFirstStep}
                            className={`flex items-center gap-1 md:gap-2 px-3 py-2.5 md:px-6 md:py-3 rounded-lg md:rounded-xl font-medium transition ${
                                isFirstStep
                                    ? 'invisible'
                                    : 'text-gray-700 hover:bg-gray-100'
                            }`}
                        >
                            <ChevronLeft className="w-4 h-4 md:w-5 md:h-5" />
                            <span className="hidden sm:inline">Previous</span>
                        </button>

                        {/* Progress Dots */}
                        <div className="flex items-center gap-1.5 md:gap-2">
                            {steps.map((_, index) => (
                                <div
                                    key={index}
                                    className={`h-1.5 md:h-2 rounded-full transition-all duration-300 ${
                                        index === currentStep
                                            ? 'w-6 md:w-8 bg-primary'
                                            : index < currentStep
                                            ? 'w-1.5 md:w-2 bg-primary/60'
                                            : 'w-1.5 md:w-2 bg-gray-300'
                                    }`}
                                />
                            ))}
                        </div>

                        {/* Next/Get Started Button */}
                        <button
                            onClick={handleNext}
                            disabled={loading}
                            className="flex items-center gap-1 md:gap-2 px-4 py-2.5 md:px-8 md:py-4 bg-primary text-white rounded-lg md:rounded-xl font-semibold hover:bg-blue-600 transition shadow-lg hover:shadow-xl transform hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed text-sm md:text-base"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-4 w-4 md:h-5 md:w-5 border-b-2 border-white"></div>
                                    <span className="hidden sm:inline">Loading...</span>
                                </>
                            ) : (
                                <>
                                    <span className="whitespace-nowrap">{isLastStep ? 'Get Started' : 'Continue'}</span>
                                    <ChevronRight className="w-4 h-4 md:w-5 md:h-5" />
                                </>
                            )}
                        </button>
                    </div>
                </div>
            </div>

            {/* Custom Styles for Bubbles and Animations */}
            <style jsx>{`
                .bubble {
                    position: absolute;
                    border-radius: 50%;
                    background: linear-gradient(135deg, rgba(73, 149, 237, 0.2), rgba(73, 149, 237, 0.05));
                    backdrop-filter: blur(10px);
                    animation: float 20s ease-in-out infinite;
                }

                .bubble-1 {
                    width: 150px;
                    height: 150px;
                    top: -75px;
                    left: -75px;
                    animation-delay: 0s;
                }

                .bubble-2 {
                    width: 100px;
                    height: 100px;
                    top: 20%;
                    right: -50px;
                    animation-delay: 2s;
                }

                .bubble-3 {
                    width: 120px;
                    height: 120px;
                    bottom: -60px;
                    left: 10%;
                    animation-delay: 4s;
                }

                .bubble-4 {
                    width: 90px;
                    height: 90px;
                    bottom: 15%;
                    right: 15%;
                    animation-delay: 6s;
                }

                .bubble-5 {
                    width: 80px;
                    height: 80px;
                    top: 50%;
                    left: -40px;
                    animation-delay: 8s;
                }

                /* Larger bubbles on tablet and desktop */
                @media (min-width: 768px) {
                    .bubble-1 {
                        width: 300px;
                        height: 300px;
                        top: -150px;
                        left: -150px;
                    }

                    .bubble-2 {
                        width: 200px;
                        height: 200px;
                        right: -100px;
                    }

                    .bubble-3 {
                        width: 250px;
                        height: 250px;
                        bottom: -125px;
                    }

                    .bubble-4 {
                        width: 180px;
                        height: 180px;
                    }

                    .bubble-5 {
                        width: 150px;
                        height: 150px;
                        left: -75px;
                    }
                }

                @keyframes float {
                    0%, 100% {
                        transform: translateY(0) translateX(0) scale(1);
                    }
                    25% {
                        transform: translateY(-30px) translateX(20px) scale(1.05);
                    }
                    50% {
                        transform: translateY(-15px) translateX(-20px) scale(0.95);
                    }
                    75% {
                        transform: translateY(-40px) translateX(10px) scale(1.02);
                    }
                }

                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
            `}</style>
        </div>
    );
};

export default Onboarding;
