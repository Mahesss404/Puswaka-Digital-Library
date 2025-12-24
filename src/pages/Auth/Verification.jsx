import React, { useState, useEffect, useCallback } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { doc, setDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '@/lib/firebase';
import OTPVerification from "@/components/OTPVerification";
import { AlertCircle, Phone } from 'lucide-react';

const Verification = () => {
    const navigate = useNavigate();
    const location = useLocation();
    
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState("");
    const [otpSent, setOtpSent] = useState(false);
    const [resending, setResending] = useState(false);
    const [recaptchaReady, setRecaptchaReady] = useState(false);
    
    // Get data from navigation state or localStorage
    const signupData = location.state?.signupData || JSON.parse(localStorage.getItem("signupData") || "{}");
    const phoneNumber = location.state?.phoneNumber || signupData?.phoneNumber || "";
    
    // Format phone number for Firebase (needs +62 format for Indonesian numbers)
    const formatPhoneForFirebase = (phone) => {
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('0')) {
            cleaned = '62' + cleaned.substring(1);
        }
        if (!cleaned.startsWith('62')) {
            cleaned = '62' + cleaned;
        }
        return '+' + cleaned;
    };
    
    // Setup reCAPTCHA on mount
    useEffect(() => {
        if (!phoneNumber) {
            navigate('/idcard', { replace: true });
            return;
        }
        
        // Clear any existing recaptcha
        if (window.recaptchaVerifier) {
            try {
                window.recaptchaVerifier.clear();
            } catch (e) {
                console.log('Clear existing recaptcha:', e);
            }
            window.recaptchaVerifier = null;
        }
        
        // Create new reCAPTCHA verifier - stored on window as per Firebase docs
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'recaptcha-container', {
                'size': 'normal',
                'callback': (response) => {
                    console.log('reCAPTCHA solved');
                    setRecaptchaReady(true);
                    setError("");
                },
                'expired-callback': () => {
                    console.log('reCAPTCHA expired');
                    setRecaptchaReady(false);
                    setError("reCAPTCHA expired. Please solve it again.");
                }
            });
            
            // Render the reCAPTCHA
            window.recaptchaVerifier.render().then((widgetId) => {
                window.recaptchaWidgetId = widgetId;
                console.log('reCAPTCHA rendered, widgetId:', widgetId);
            }).catch((err) => {
                console.error('Error rendering reCAPTCHA:', err);
                setError("Failed to load reCAPTCHA. Please refresh the page.");
            });
        } catch (err) {
            console.error('Error creating reCAPTCHA:', err);
            setError("Failed to initialize verification. Please refresh the page.");
        }
        
        // Cleanup on unmount
        return () => {
            if (window.recaptchaVerifier) {
                try {
                    window.recaptchaVerifier.clear();
                    window.recaptchaVerifier = null;
                } catch (e) {
                    console.log('Cleanup recaptcha:', e);
                }
            }
        };
    }, [phoneNumber, navigate]);
    
    // Send OTP function
    const sendOTP = useCallback(async () => {
        if (!phoneNumber) {
            setError("Phone number not found. Please start over.");
            return;
        }
        
        if (!window.recaptchaVerifier) {
            setError("reCAPTCHA not ready. Please refresh the page.");
            return;
        }
        
        setLoading(true);
        setError("");
        
        try {
            const formattedPhone = formatPhoneForFirebase(phoneNumber);
            console.log('Sending OTP to:', formattedPhone);
            
            const confirmationResult = await signInWithPhoneNumber(
                auth, 
                formattedPhone, 
                window.recaptchaVerifier
            );
            
            // Store confirmation result on window as per Firebase docs
            window.confirmationResult = confirmationResult;
            setOtpSent(true);
            console.log('OTP sent successfully');
            
        } catch (err) {
            console.error('Error sending OTP:', err);
            
            let errorMessage = "Failed to send OTP. Please try again.";
            
            if (err.code === 'auth/invalid-phone-number') {
                errorMessage = "Invalid phone number format.";
            } else if (err.code === 'auth/too-many-requests') {
                errorMessage = "Too many attempts. Please try again later.";
            } else if (err.code === 'auth/captcha-check-failed') {
                errorMessage = "reCAPTCHA verification failed. Please try again.";
            } else if (err.code === 'auth/quota-exceeded') {
                errorMessage = "SMS quota exceeded. Please try again later.";
            } else if (err.code === 'auth/internal-error') {
                errorMessage = "Internal error. Please check Firebase Phone Auth is enabled and try again.";
            }
            
            setError(errorMessage);
            
            // Reset reCAPTCHA on error
            if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
                try {
                    window.grecaptcha.reset(window.recaptchaWidgetId);
                    setRecaptchaReady(false);
                } catch (e) {
                    console.log('Reset recaptcha error:', e);
                }
            }
        } finally {
            setLoading(false);
        }
    }, [phoneNumber]);
    
    // Resend OTP
    const handleResendOTP = async () => {
        setResending(true);
        setOtpSent(false);
        
        // Reset reCAPTCHA
        if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
            try {
                window.grecaptcha.reset(window.recaptchaWidgetId);
                setRecaptchaReady(false);
            } catch (e) {
                console.log('Reset recaptcha error:', e);
            }
        }
        
        setResending(false);
    };
    
    // Verify OTP
    const handleVerify = async (code) => {
        if (!window.confirmationResult) {
            setError("Verification session expired. Please request a new code.");
            return;
        }
        
        setLoading(true);
        setError("");
        
        try {
            // Verify OTP
            const result = await window.confirmationResult.confirm(code);
            console.log('OTP verified successfully:', result.user);
            
            // Update user profile with name from ID card
            if (signupData?.name) {
                await updateProfile(result.user, {
                    displayName: signupData.name
                });
            }
            
            // Store user data in Firestore users collection
            const userData = {
                uid: result.user.uid,
                name: signupData?.name || "",
                address: signupData?.address || "",
                idNumber: signupData?.idNumber || "",
                phoneNumber: phoneNumber,
                createdAt: serverTimestamp()
            };
            
            // Save to Firestore
            await setDoc(doc(db, "users", result.user.uid), userData);
            console.log('User data saved to Firestore:', userData);
            
            // Also keep a copy in localStorage for quick access
            localStorage.setItem("userData", JSON.stringify({
                ...userData,
                createdAt: new Date().toISOString()
            }));
            
            // Clear signup data from localStorage
            localStorage.removeItem("signupData");
            localStorage.removeItem("idCardData");
            
            console.log('User registered successfully:', userData);
            
            // Navigate to home
            navigate('/home', { replace: true });
            
        } catch (err) {
            console.error('Error verifying OTP:', err);
            
            let errorMessage = "Invalid verification code. Please try again.";
            
            if (err.code === 'auth/invalid-verification-code') {
                errorMessage = "The verification code is incorrect.";
            } else if (err.code === 'auth/code-expired') {
                errorMessage = "The verification code has expired. Please request a new code.";
            } else if (err.code === 'auth/credential-already-in-use') {
                errorMessage = "This phone number is already registered.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
    };
    
    // Redirect if no phone number
    if (!phoneNumber) {
        return null;
    }
    
    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white">
                        ✓
                    </div>
                    <div className="w-16 h-1 mx-2 bg-green-500"></div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-green-500 text-white">
                        ✓
                    </div>
                    <div className="w-16 h-1 mx-2 bg-blue-500"></div>
                    <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-500 text-white">
                        3
                    </div>
                </div>
                
                <div className="text-center mb-6">
                    <div className="flex items-center justify-center w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full">
                        <Phone className="w-8 h-8 text-blue-500" />
                    </div>
                    <h2 className="text-2xl font-bold mb-2">Verify Your Phone</h2>
                    <p className="text-gray-500 text-sm">
                        {otpSent ? "Enter the verification code sent to" : "We'll send a verification code to"}
                    </p>
                    <p className="text-gray-800 font-medium mt-1">
                        {formatPhoneForFirebase(phoneNumber)}
                    </p>
                </div>
                
                {/* Error Message */}
                {error && (
                    <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                        <AlertCircle className="w-4 h-4 flex-shrink-0" />
                        {error}
                    </div>
                )}
                
                {/* reCAPTCHA and Send OTP - Before OTP sent */}
                {!otpSent && (
                    <div className="flex flex-col items-center gap-4 mb-4">
                        <p className="text-sm text-gray-500">Please complete the reCAPTCHA to continue:</p>
                        
                        {/* reCAPTCHA Container */}
                        <div id="recaptcha-container" className="flex justify-center"></div>
                        
                        {/* Send OTP Button */}
                        <button
                            onClick={sendOTP}
                            disabled={loading || !recaptchaReady}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                                    Sending...
                                </>
                            ) : (
                                "Send Verification Code"
                            )}
                        </button>
                        
                        {!recaptchaReady && !loading && (
                            <p className="text-xs text-gray-400">Complete the reCAPTCHA above to enable sending</p>
                        )}
                    </div>
                )}
                
                {/* OTP Input - After OTP sent */}
                {otpSent && (
                    <OTPVerification 
                        onVerify={handleVerify}
                        phoneNumber={formatPhoneForFirebase(phoneNumber)}
                        onResend={handleResendOTP}
                        isResending={resending}
                        isLoading={loading}
                    />
                )}
                
                {/* Back to signup */}
                <div className="mt-6 text-center">
                    <button
                        onClick={() => navigate('/idcard')}
                        className="text-sm text-gray-500 hover:text-gray-700 underline"
                    >
                        ← Back to signup
                    </button>
                </div>
            </div>
        </div>
    );
};

export default Verification;