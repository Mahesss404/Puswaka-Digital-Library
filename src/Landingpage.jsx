import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link, useNavigate } from 'react-router-dom';
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
    X,
    Eye,
    EyeOff,
    Loader2,
    XCircle,
    AlertCircle,
    Phone
} from 'lucide-react';
import { collection, getDocs, doc, getDoc, setDoc, serverTimestamp } from 'firebase/firestore';
import { onAuthStateChanged, RecaptchaVerifier, signInWithPhoneNumber, updateProfile } from 'firebase/auth';
import { auth, db } from '@/lib/firebase';
import Tesseract from 'tesseract.js';
import OTPVerification from '@/components/OTPVerification';

const Landingpage = () => {
    const navigate = useNavigate();
    const [openFaq, setOpenFaq] = useState(null);
    const [isScrolled, setIsScrolled] = useState(false);
    const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

    // Auth modal state
    const [showAuthModal, setShowAuthModal] = useState(false);
    const [authTab, setAuthTab] = useState('login'); // 'login' | 'register'

    // Unified reCAPTCHA cleanup helper
    const clearRecaptcha = useCallback(() => {
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (_) {}
            window.recaptchaVerifier = null;
        }
        if (window.recaptchaWidgetId !== undefined) {
            window.recaptchaWidgetId = undefined;
        }
        loginRecaptchaInit.current = false;
        regRecaptchaInit.current = false;
    }, []);

    // Login form state
    const [phoneNumber, setPhoneNumber] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loginError, setLoginError] = useState('');
    const [loginLoading, setLoginLoading] = useState(false);
    const [loginStep, setLoginStep] = useState(1); // 1=Credentials, 2=Verify OTP
    const [loginMatchedUser, setLoginMatchedUser] = useState(null);
    const [loginOtpSent, setLoginOtpSent] = useState(false);
    const [loginOtpError, setLoginOtpError] = useState('');
    const [loginOtpLoading, setLoginOtpLoading] = useState(false);
    const [loginRecaptchaReady, setLoginRecaptchaReady] = useState(false);
    const loginRecaptchaRef = useRef(null);
    const loginRecaptchaInit = useRef(false);
    const [loginResending, setLoginResending] = useState(false);

    const openModal = (tab = 'login') => {
        setAuthTab(tab);
        setLoginError('');
        setPhoneNumber('');
        setPassword('');
        setShowPassword(false);
        setLoginStep(1);
        setLoginMatchedUser(null);
        setLoginOtpSent(false);
        setLoginOtpError('');
        setLoginRecaptchaReady(false);
        clearRecaptcha();
        if (tab === 'register') {
            resetRegister();
        }
        setShowAuthModal(true);
        document.body.style.overflow = 'hidden';
    };

    const closeModal = () => {
        setShowAuthModal(false);
        document.body.style.overflow = '';
        clearRecaptcha();
        resetRegister();
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^\d+\-\s]/g, '');
        setPhoneNumber(value);
    };

    const normalizePhone = (phone) => {
        if (!phone) return '';
        let cleaned = phone.replace(/\D/g, '');
        if (cleaned.startsWith('62')) cleaned = cleaned.substring(2);
        if (cleaned.startsWith('0')) cleaned = cleaned.substring(1);
        return cleaned;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setLoginError('');
        setLoginLoading(true);

        if (!phoneNumber.trim()) {
            setLoginError('Masukkan nomor telepon terlebih dahulu!');
            setLoginLoading(false);
            return;
        }
        if (!password.trim()) {
            setLoginError('Masukkan password terlebih dahulu!');
            setLoginLoading(false);
            return;
        }

        try {
            const usersRef = collection(db, 'users');
            const normalizedInput = normalizePhone(phoneNumber);
            const querySnapshot = await getDocs(usersRef);
            let matchedUser = null;

            querySnapshot.forEach((docSnap) => {
                const userData = docSnap.data();
                const storedPhone = normalizePhone(userData.phoneNumber || '');
                if (storedPhone === normalizedInput) {
                    matchedUser = { id: docSnap.id, ...userData };
                }
            });

            if (!matchedUser) {
                setLoginError('Nomor telepon tidak terdaftar. Silakan daftar terlebih dahulu.');
                setLoginLoading(false);
                return;
            }

            const storedPassword = matchedUser.password || '';
            const inputPassword = password.trim();

            if (storedPassword && storedPassword !== inputPassword) {
                setLoginError('Password salah. Silakan coba lagi.');
                setLoginLoading(false);
                return;
            }

            setLoginMatchedUser(matchedUser);
            setLoginStep(2);
            // We set normal phone to regPhone style for common formatter usage if needed
            // But login already has matchedUser.phoneNumber
        } catch (err) {
            console.error('Login error:', err);
            setLoginError('Terjadi kesalahan saat login. Silakan coba lagi.');
        } finally {
            setLoginLoading(false);
        }
    };

    // ─── Login OTP Logic ─────────────────────────────────────────
    const initLoginRecaptcha = useCallback(() => {
        if (loginRecaptchaInit.current) return;
        const container = document.getElementById('login-recaptcha-container');
        if (!container) return;
        
        clearRecaptcha();
        
        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'login-recaptcha-container', {
                'size': 'normal',
                'callback': () => {
                    setLoginRecaptchaReady(true);
                    setLoginOtpError('');
                },
                'expired-callback': () => {
                    setLoginRecaptchaReady(false);
                    setLoginOtpError('reCAPTCHA kadaluarsa. Silakan selesaikan lagi.');
                }
            });
            
            window.recaptchaVerifier.render().then((wid) => {
                window.recaptchaWidgetId = wid;
                loginRecaptchaInit.current = true;
            }).catch(() => setLoginOtpError('Gagal memuat reCAPTCHA.'));
        } catch (err) {
            console.error('Login Recaptcha init error:', err);
            setLoginOtpError('Gagal inisialisasi verifikasi.');
        }
    }, [clearRecaptcha]);

    useEffect(() => {
        if (authTab === 'login' && loginStep === 2 && showAuthModal) {
            const t = setTimeout(initLoginRecaptcha, 300); // 300ms to ensure dialog animation is done
            return () => {
                clearTimeout(t);
                // We don't clear immediately because if user stays on screen 2 it's fine
            };
        }
        if (loginStep !== 2 || authTab !== 'login') {
            loginRecaptchaInit.current = false;
        }
    }, [authTab, loginStep, showAuthModal, initLoginRecaptcha]);

    const sendLoginOTP = async () => {
        if (!loginMatchedUser?.phoneNumber) return;
        
        if (!window.recaptchaVerifier) {
            setLoginOtpError('reCAPTCHA belum siap. Silakan tunggu.');
            return;
        }
        
        setLoginOtpLoading(true);
        setLoginOtpError('');
        
        try {
            const formattedPhone = formatRegPhone(loginMatchedUser.phoneNumber);
            const confirmationResult = await signInWithPhoneNumber(auth, formattedPhone, window.recaptchaVerifier);
            window.confirmationResult = confirmationResult;
            setLoginOtpSent(true);
        } catch (err) {
            console.error('Login OTP error:', err);
            setLoginOtpError('Gagal mengirim kode verifikasi. Coba lagi nanti.');
            if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
                try { window.grecaptcha.reset(window.recaptchaWidgetId); setLoginRecaptchaReady(false); } catch (_) {}
            }
        } finally {
            setLoginOtpLoading(false);
        }
    };

    const handleLoginVerifyOTP = async (code) => {
        if (!window.confirmationResult) {
            setLoginOtpError('Sesi verifikasi kadaluarsa. Silakan minta kode baru.');
            return;
        }
        
        setLoginOtpLoading(true);
        setLoginOtpError('');
        
        try {
            const result = await window.confirmationResult.confirm(code);
            console.log('Login OTP verified:', result.user);
            
            // Success! Save user data to local storage
            if (loginMatchedUser) {
                localStorage.setItem("userData", JSON.stringify({
                    ...loginMatchedUser,
                    lastLogin: new Date().toISOString()
                }));
            }
            
            // Fetch role and redirect
            const userDocRef = doc(db, "users", result.user.uid);
            const userDocSnap = await getDoc(userDocRef);
            const userRole = userDocSnap.exists() ? userDocSnap.data().role : "USER";
            const hasCompletedOnboarding = userDocSnap.exists() ? userDocSnap.data().hasCompletedOnboarding : false;
            
            closeModal();
            if (userRole === "ADMIN") {
                navigate('/admin', { replace: true });
            } else if (!hasCompletedOnboarding) {
                navigate('/onboarding', { replace: true });
            } else {
                navigate('/home', { replace: true });
            }
        } catch (err) {
            console.error('OTP verification error:', err);
            setLoginOtpError(err.code === 'auth/invalid-verification-code' ? 'Kode verifikasi salah.' : 'Terjadi kesalahan. Coba lagi.');
        } finally {
            setLoginOtpLoading(false);
        }
    };

    const handleLoginResendOTP = () => {
        setLoginResending(true);
        setLoginOtpSent(false);
        if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
            try { window.grecaptcha.reset(window.recaptchaWidgetId); setLoginRecaptchaReady(false); } catch (_) {}
        }
        loginRecaptchaInit.current = false;
        setTimeout(initLoginRecaptcha, 150);
        setLoginResending(false);
    };

    // ─── Register multi-step state ───────────────────────────────
    const [regStep, setRegStep] = useState(1); // 1=ID Card, 2=Account Details, 3=Verify Phone

    // Step 1 – ID Card
    const [regImage, setRegImage] = useState(null);
    const [regImageFile, setRegImageFile] = useState(null);
    const [regExtracted, setRegExtracted] = useState(null);
    const [regOcrLoading, setRegOcrLoading] = useState(false);
    const [regOcrError, setRegOcrError] = useState('');

    // Step 2 – Account Details
    const [regPhone, setRegPhone] = useState('');
    const [regPwd, setRegPwd] = useState('');
    const [regShowPwd, setRegShowPwd] = useState(false);
    const [regPhoneError, setRegPhoneError] = useState('');
    const [regPwdErrors, setRegPwdErrors] = useState([]);

    // Step 3 – OTP
    const [regOtpSent, setRegOtpSent] = useState(false);
    const [regOtpLoading, setRegOtpLoading] = useState(false);
    const [regOtpError, setRegOtpError] = useState('');
    const [regRecaptchaReady, setRegRecaptchaReady] = useState(false);
    const regRecaptchaRef = useRef(null);
    const regRecaptchaInit = useRef(false);
    const [regResending, setRegResending] = useState(false);

    // Reset register state on modal open/close
    const resetRegister = () => {
        setRegStep(1);
        setRegImage(null); setRegImageFile(null);
        setRegExtracted(null); setRegOcrLoading(false); setRegOcrError('');
        setRegPhone(''); setRegPwd(''); setRegShowPwd(false);
        setRegPhoneError(''); setRegPwdErrors([]);
        setRegOtpSent(false); setRegOtpLoading(false); setRegOtpError('');
        setRegRecaptchaReady(false); setRegResending(false);
        regRecaptchaInit.current = false;
        if (window.recaptchaVerifier) {
            try { window.recaptchaVerifier.clear(); } catch (_) {}
            window.recaptchaVerifier = null;
        }
    };

    // ID Card OCR helpers
    const extractField = (text, regex) => {
        const m = text.match(regex);
        if (m) return m[1] ? m[1].trim() : m[0].trim();
        return 'Not found';
    };

    const handleRegImageUpload = (e) => {
        const file = e.target.files[0];
        if (!file) return;
        if (file.size > 2 * 1024 * 1024) {
            setRegOcrError('File size must be less than 2MB');
            return;
        }
        setRegImageFile(file);
        setRegImage(URL.createObjectURL(file));
        setRegExtracted(null);
        setRegOcrError('');
    };

    const handleRegExtract = async () => {
        if (!regImage) { setRegOcrError('Upload ID card terlebih dahulu!'); return; }
        setRegOcrLoading(true); setRegOcrError('');
        try {
            const result = await Tesseract.recognize(regImage, 'eng');
            const text = result.data.text;
            const data = {
                name:     extractField(text, /^[A-Z\s]+(?=\nNIS)/m),
                address:  extractField(text, /Alamat\s*[:.']?\s*([^|\n]+)/i),
                idNumber: extractField(text, /NIS\s*[:.']?\s*(\d+)/i),
            };
            if (data.name === 'Not found' || data.address === 'Not found' || data.idNumber === 'Not found') {
                setRegOcrError('Could not extract all required data. Please try a clearer image.');
            } else {
                setRegExtracted(data);
                localStorage.setItem('idCardData', JSON.stringify(data));
            }
        } catch (err) {
            setRegOcrError('Gagal membaca ID Card. Silakan coba lagi.');
        } finally {
            setRegOcrLoading(false);
        }
    };

    // Password validation
    const validateRegPassword = (pwd) => {
        const errs = [];
        if (!/^[\x20-\x7E]*$/.test(pwd)) errs.push('Only standard characters allowed (no emoji)');
        if (pwd.length < 6) errs.push('Minimum 6 characters');
        if (!/[A-Z]/.test(pwd)) errs.push('At least 1 uppercase letter');
        if (!/[a-z]/.test(pwd)) errs.push('At least 1 lowercase letter');
        if (!/[0-9]/.test(pwd)) errs.push('At least 1 number');
        if (!/[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]/.test(pwd)) errs.push('At least 1 special character');
        return errs;
    };

    const validateRegPhone = (phone) => {
        const d = phone.replace(/\D/g, '');
        if (d.length < 10 || d.length > 13) return 'Phone number must be 10-13 digits';
        return '';
    };

    const handleRegPwdChange = (e) => {
        const v = e.target.value.replace(/[^\x20-\x7E]/g, '');
        setRegPwd(v); setRegPwdErrors(validateRegPassword(v));
    };

    const handleRegPhoneChange = (e) => {
        const v = e.target.value.replace(/[^\d+\-\s]/g, '');
        setRegPhone(v); setRegPhoneError(validateRegPhone(v));
    };

    const isStep2Valid = () =>
        regPhone.length >= 10 && regPwd.length >= 6 &&
        regPwdErrors.length === 0 && !regPhoneError;

    const handleRegStep2Submit = (e) => {
        e.preventDefault();
        const pe = validateRegPhone(regPhone);
        const pwe = validateRegPassword(regPwd);
        if (pe) { setRegPhoneError(pe); return; }
        if (pwe.length > 0) { setRegPwdErrors(pwe); return; }
        const signupData = { ...regExtracted, phoneNumber: regPhone, password: regPwd };
        localStorage.setItem('signupData', JSON.stringify(signupData));
        setRegStep(3);
    };

    // Format phone for Firebase (+62)
    const formatRegPhone = (phone) => {
        let c = phone.replace(/\D/g, '');
        if (c.startsWith('0')) c = '62' + c.substring(1);
        if (!c.startsWith('62')) c = '62' + c;
        return '+' + c;
    };

    // Init reCAPTCHA for register dialog
    const initRegRecaptcha = useCallback(() => {
        if (regRecaptchaInit.current) return;
        const container = document.getElementById('reg-recaptcha-container');
        if (!container) return;

        clearRecaptcha();

        try {
            window.recaptchaVerifier = new RecaptchaVerifier(auth, 'reg-recaptcha-container', {
                size: 'normal',
                callback: () => { setRegRecaptchaReady(true); setRegOtpError(''); },
                'expired-callback': () => { setRegRecaptchaReady(false); setRegOtpError('reCAPTCHA kadaluarsa. Silakan selesaikan lagi.'); }
            });
            window.recaptchaVerifier.render().then((wid) => {
                window.recaptchaWidgetId = wid;
                regRecaptchaInit.current = true;
            }).catch(() => setRegOtpError('Gagal memuat reCAPTCHA.'));
        } catch (_) {
            setRegOtpError('Gagal inisialisasi verifikasi.');
        }
    }, [clearRecaptcha]);

    useEffect(() => {
        if (authTab === 'register' && regStep === 3 && showAuthModal) {
            const t = setTimeout(initRegRecaptcha, 300);
            return () => clearTimeout(t);
        }
        if (regStep !== 3 || authTab !== 'register') {
            regRecaptchaInit.current = false;
        }
    }, [authTab, regStep, showAuthModal, initRegRecaptcha]);

    const sendRegOTP = useCallback(async () => {
        if (!window.recaptchaVerifier) {
            setRegOtpError('reCAPTCHA not ready. Please wait.'); return;
        }
        setRegOtpLoading(true); setRegOtpError('');
        try {
            const result = await signInWithPhoneNumber(auth, formatRegPhone(regPhone), window.recaptchaVerifier);
            window.confirmationResult = result;
            setRegOtpSent(true);
        } catch (err) {
            let msg = 'Failed to send OTP. Please try again.';
            if (err.code === 'auth/invalid-phone-number') msg = 'Invalid phone number format.';
            else if (err.code === 'auth/too-many-requests') msg = 'Too many attempts. Please try again later.';
            setRegOtpError(msg);
            if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
                try { window.grecaptcha.reset(window.recaptchaWidgetId); setRegRecaptchaReady(false); } catch (_) {}
            }
        } finally {
            setRegOtpLoading(false);
        }
    }, [regPhone]);

    const handleRegResendOTP = () => {
        setRegResending(true);
        setRegOtpSent(false);
        if (window.recaptchaWidgetId !== undefined && window.grecaptcha) {
            try { window.grecaptcha.reset(window.recaptchaWidgetId); setRegRecaptchaReady(false); } catch (_) {}
        }
        regRecaptchaInit.current = false;
        setTimeout(initRegRecaptcha, 150);
        setRegResending(false);
    };

    const handleRegVerifyOTP = async (code) => {
        if (!window.confirmationResult) {
            setRegOtpError('Session expired. Please request a new code.'); return;
        }
        setRegOtpLoading(true); setRegOtpError('');
        try {
            const result = await window.confirmationResult.confirm(code);
            const signupData = JSON.parse(localStorage.getItem('signupData') || '{}');
            if (signupData?.name) await updateProfile(result.user, { displayName: signupData.name });
            const newUser = {
                uid: result.user.uid,
                name: signupData?.name || '',
                address: signupData?.address || '',
                idNumber: signupData?.idNumber || '',
                phoneNumber: regPhone,
                password: signupData?.password || '',
                role: 'USER',
                createdAt: serverTimestamp()
            };
            await setDoc(doc(db, 'users', result.user.uid), newUser);
            localStorage.setItem('userData', JSON.stringify({ ...newUser, createdAt: new Date().toISOString() }));
            localStorage.removeItem('signupData');
            localStorage.removeItem('idCardData');
            closeModal();
            navigate('/onboarding', { replace: true });
        } catch (err) {
            let msg = 'Invalid verification code. Please try again.';
            if (err.code === 'auth/invalid-verification-code') msg = 'The verification code is incorrect.';
            else if (err.code === 'auth/code-expired') msg = 'Code has expired. Please request a new code.';
            else if (err.code === 'auth/credential-already-in-use') msg = 'This phone number is already registered.';
            setRegOtpError(msg);
        } finally {
            setRegOtpLoading(false);
        }
    };
    // ─────────────────────────────────────────────────────────────

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

    const howToUse = [
        {
            step: "1",
            title: "Register Your Account",
            description: "Sign up using your school ID to create an account and start browsing our collection.",
            icon: "register"
        },
        {
            step: "2",
            title: "Find Your Book",
            description: "Browse our catalog and search for books by title, author, or category.",
            icon: "search"
        },
        {
            step: "3",
            title: "Locate the Book",
            description: "Visit the school library and find the book on the rack using the location shown in the app.",
            icon: "location"
        },
        {
            step: "4",
            title: "Borrow from Admin",
            description: "Go to the admin desk with your selected book to complete the borrowing process.",
            icon: "admin"
        },
        {
            step: "5",
            title: "Return On Time",
            description: "Take your book home and return it before the deadline to avoid late fees.",
            icon: "return"
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
                            <a href="#how-to-use" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>How to Use</a>
                            <a href="#benefits" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>Benefits</a>
                            <a href="#faq" className={`text-sm font-medium transition-colors hover:text-primary ${
                                isScrolled ? 'text-gray-600' : 'text-gray-700'
                            }`}>FAQ</a>
                        </div>

                        {/* Auth Buttons */}
                        <div className="hidden md:flex items-center gap-3">
                            <button
                                onClick={() => openModal('login')}
                                className="px-5 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-primary to-blue-600 rounded-xl hover:shadow-lg hover:shadow-primary/30 transition-all duration-300"
                            >
                                Login
                            </button>
                            <button
                                onClick={() => navigate('/registration')}
                                className="px-5 py-2.5 text-sm font-semibold text-primary hover:bg-primary/5 rounded-xl transition-all duration-300"
                            >
                                Register
                            </button>
                        </div>

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
                            <a href="#how-to-use" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">How to Use</a>
                            <a href="#benefits" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">Benefits</a>
                            <a href="#faq" className="px-4 py-2 text-gray-700 hover:bg-primary/5 rounded-lg transition-colors">FAQ</a>
                            <hr className="my-2 border-gray-200" />
                            <button onClick={() => navigate('/registration')} className="px-4 py-2 text-primary font-semibold hover:bg-primary/5 rounded-lg transition-colors text-left">
                                Register
                            </button>
                            <button onClick={() => openModal('login')} className="mx-4 py-2.5 text-center font-semibold text-white bg-gradient-to-r from-primary to-blue-600 rounded-xl">
                                Login
                            </button>
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
                            <button
                                onClick={() => openModal('login')}
                                className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                            >
                                Get Started Free
                                <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                            </button>
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

            {/* How to Use Section */}
            <section id="how-to-use" className="py-16 sm:py-24 bg-gradient-to-br from-blue-50 via-white to-primary/5 relative overflow-hidden">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    {/* Section Header */}
                    <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
                        <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 rounded-full text-primary text-sm font-medium mb-4">
                            <Sparkles className="w-4 h-4" />
                            How It Works
                        </div>
                        <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
                            Simple Steps to
                            <span className="text-primary"> Borrow Books</span>
                        </h2>
                        <p className="text-gray-600">
                            Follow these easy steps to start borrowing books from our digital library system.
                        </p>
                    </div>

                    {/* Steps Flow */}
                    <div className="grid sm:grid-cols-2 lg:grid-cols-5 gap-6 lg:gap-4 mb-12">
                        {howToUse.map((item, index) => (
                            <div key={index} className="relative">
                                {/* Connector Line (desktop only) */}
                                {index < howToUse.length - 1 && (
                                    <div className="hidden lg:block absolute top-16 left-[60%] w-full h-0.5 bg-gradient-to-r from-primary/30 to-primary/10 z-0" />
                                )}
                                
                                <div className="relative group bg-white rounded-2xl p-6 ring-1 ring-gray-100 hover:ring-primary/20 hover:shadow-xl hover:shadow-primary/5 hover:-translate-y-2 transition-all duration-300 h-full">
                                    {/* Step Number Badge */}
                                    <div className="absolute -top-3 -right-3 w-8 h-8 bg-gradient-to-br from-primary to-blue-600 rounded-full flex items-center justify-center shadow-lg">
                                        <span className="text-white text-sm font-bold">{item.step}</span>
                                    </div>

                                    {/* Icon */}
                                    <div className="w-16 h-16 mx-auto mb-4 bg-gradient-to-br from-primary/10 to-blue-100 rounded-2xl flex items-center justify-center group-hover:scale-110 transition-transform duration-300">
                                        {item.icon === "register" && (
                                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                                            </svg>
                                        )}
                                        {item.icon === "search" && (
                                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                                            </svg>
                                        )}
                                        {item.icon === "location" && (
                                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                                            </svg>
                                        )}
                                        {item.icon === "admin" && (
                                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                                            </svg>
                                        )}
                                        {item.icon === "return" && (
                                            <svg className="w-8 h-8 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                        )}
                                    </div>

                                    {/* Content */}
                                    <h3 className="text-base font-semibold text-gray-900 mb-2 text-center">
                                        {item.title}
                                    </h3>
                                    <p className="text-sm text-gray-600 leading-relaxed text-center">
                                        {item.description}
                                    </p>
                                </div>
                            </div>
                        ))}
                    </div>

                    {/* Important Note */}
                    <div className="max-w-3xl mx-auto">
                        <div className="bg-gradient-to-r from-orange-50 to-red-50 border-2 border-orange-200 rounded-2xl p-6 relative overflow-hidden">
                            {/* Background decoration */}
                            <div className="absolute top-0 right-0 w-32 h-32 bg-orange-300/10 rounded-full blur-2xl" />
                            
                            <div className="relative flex items-start gap-4">
                                <div className="flex-shrink-0 w-12 h-12 bg-gradient-to-br from-orange-400 to-red-500 rounded-xl flex items-center justify-center">
                                    <svg className="w-6 h-6 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                                    </svg>
                                </div>
                                <div className="flex-1">
                                    <h3 className="text-lg font-bold text-gray-900 mb-2 flex items-center gap-2">
                                        <span>⚠️</span> Important Notice
                                    </h3>
                                    <p className="text-gray-700 leading-relaxed">
                                        Please return books before the due date. <strong className="text-orange-700">Late returns will incur a fine of Rp 10,000 per day</strong> for each overdue book. Make sure to check your borrowing deadline and set reminders to avoid any penalties.
                                    </p>
                                </div>
                            </div>
                        </div>
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
                        <button
                            onClick={() => openModal('login')}
                            className="group w-full sm:w-auto px-8 py-4 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-2xl shadow-lg shadow-primary/30 hover:shadow-xl hover:shadow-primary/40 hover:-translate-y-1 transition-all duration-300 flex items-center justify-center gap-2"
                        >
                            Start Reading Now
                            <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform" />
                        </button>
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
                                <li><a href="#how-to-use" className="text-sm hover:text-white transition-colors">How to Use</a></li>
                                <li><a href="#benefits" className="text-sm hover:text-white transition-colors">Benefits</a></li>
                                <li><a href="#faq" className="text-sm hover:text-white transition-colors">FAQ</a></li>
                            </ul>
                        </div>

                        {/* Access */}
                        <div>
                            <h4 className="text-white font-semibold mb-4">Access</h4>
                            <ul className="space-y-2">
                                <li><Link to="/#" className="text-sm hover:text-white transition-colors">User Login</Link></li>
                                <li><Link to="/#" className="text-sm hover:text-white transition-colors">Admin Login</Link></li>
                                <li><Link to="/#" className="text-sm hover:text-white transition-colors">Register</Link></li>
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
                        <p className="text-sm">© 2025 Puswaka. All rights reserved.</p>
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

                @keyframes dialogIn {
                    from { opacity: 0; transform: translateY(-24px) scale(0.97); }
                    to   { opacity: 1; transform: translateY(0)    scale(1);    }
                }
                
                .animate-float {
                    animation: float 6s ease-in-out infinite;
                }
                
                .animate-fadeIn {
                    animation: fadeIn 0.6s ease-out;
                }

                .animate-dialog-in {
                    animation: dialogIn 0.28s cubic-bezier(0.34,1.56,0.64,1) both;
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

            {/* ══════════════════════════════════════════
                AUTH DIALOG MODAL
            ══════════════════════════════════════════ */}
            {showAuthModal && (
                <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
                    {/* Backdrop */}
                    <div
                        className="absolute inset-0 bg-black/60 backdrop-blur-[3px]"
                        onClick={closeModal}
                    />

                    {/* Dialog Card */}
                    <div className="relative w-full max-w-[460px] bg-white rounded-3xl shadow-2xl overflow-hidden animate-dialog-in">

                        {/* Close Button */}
                        <button
                            onClick={closeModal}
                            className="absolute top-4 right-4 z-10 w-8 h-8 flex items-center justify-center rounded-full bg-gray-100 hover:bg-gray-200 text-gray-500 hover:text-gray-700 transition-all duration-200"
                        >
                            <X className="w-4 h-4" />
                        </button>

                        <div className="px-8 pt-6 pb-8">
                            {/* ── Logo & Title ── */}
                            <div className="flex flex-col items-center mb-6">
                                <div className="w-12 h-12 bg-gradient-to-br from-primary to-blue-600 rounded-2xl flex items-center justify-center shadow-lg shadow-primary/30 mb-3">
                                    <Library className="w-6 h-6 text-white" />
                                </div>
                                {authTab === 'login' ? (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-900">Welcome back!</h2>
                                        <p className="text-sm text-gray-400 mt-1">Sign in to your Puswaka account</p>
                                    </>
                                ) : (
                                    <>
                                        <h2 className="text-xl font-bold text-gray-900">Join Puswaka</h2>
                                        <p className="text-sm text-gray-400 mt-1">Create your digital library account</p>
                                    </>
                                )}
                            </div>

                            {/* ──────── LOGIN FORM ──────── */}
                            {authTab === 'login' && loginStep === 1 && (
                                <form onSubmit={handleLogin} className="space-y-4">
                                    {/* Error */}
                                    {loginError && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-sm flex items-start gap-2">
                                            <svg className="w-4 h-4 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd"/></svg>
                                            {loginError}
                                        </div>
                                    )}

                                    {/* Phone */}
                                    <div>
                                        <label htmlFor="modal-phone" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Nomor Telepon
                                        </label>
                                        <input
                                            type="tel"
                                            id="modal-phone"
                                            name="phone"
                                            placeholder="081234567890"
                                            value={phoneNumber}
                                            onChange={handlePhoneChange}
                                            required
                                            className="w-full px-4 py-3 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 bg-gray-50"
                                        />
                                    </div>

                                    {/* Password */}
                                    <div>
                                        <label htmlFor="modal-password" className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">
                                            Password
                                        </label>
                                        <div className="relative">
                                            <input
                                                type={showPassword ? 'text' : 'password'}
                                                id="modal-password"
                                                name="password"
                                                placeholder="Masukkan password"
                                                value={password}
                                                onChange={(e) => setPassword(e.target.value)}
                                                required
                                                className="w-full px-4 py-3 pr-11 border border-gray-200 rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 focus:border-primary transition-all duration-200 bg-gray-50"
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowPassword(!showPassword)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 transition-colors"
                                            >
                                                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>

                                    {/* Submit */}
                                    <button
                                        type="submit"
                                        disabled={loginLoading}
                                        className="w-full py-3.5 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl shadow-lg shadow-primary/30 transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed flex items-center justify-center gap-2 mt-2"
                                    >
                                        {loginLoading ? (
                                            <>
                                                <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                                                Memverifikasi...
                                            </>
                                        ) : 'Login'}
                                    </button>

                                    <p className="text-center text-xs text-gray-400 pt-1">
                                        Belum punya akun?{' '}
                                        <button
                                            type="button"
                                            onClick={() => { setAuthTab('register'); setLoginError(''); }}
                                            className="text-primary font-semibold hover:underline"
                                        >
                                            Daftar di sini
                                        </button>
                                    </p>
                                </form>
                            )}

                            {/* ──────── LOGIN VERIFICATION ──────── */}
                            {authTab === 'login' && loginStep === 2 && (
                                <div className="space-y-4">
                                    <div className="text-center mb-2">
                                        <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                            <Phone className="w-6 h-6 text-primary" />
                                        </div>
                                        <h3 className="text-base font-bold text-gray-800">Verify Login</h3>
                                        <p className="text-xs text-gray-400 mt-0.5">
                                            {loginOtpSent ? 'Masukkan kode yang dikirim ke' : 'Kami akan mengirimkan kode verifikasi ke'}
                                        </p>
                                        <p className="text-sm font-semibold text-gray-700 mt-1">{formatRegPhone(loginMatchedUser?.phoneNumber || '')}</p>
                                    </div>

                                    {loginOtpError && (
                                        <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                                            <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                            {loginOtpError}
                                        </div>
                                    )}

                                    {!loginOtpSent && (
                                        <div className="flex flex-col items-center gap-3">
                                            <p className="text-xs text-gray-400">Selesaikan reCAPTCHA untuk melanjutkan:</p>
                                            <div id="login-recaptcha-container" ref={loginRecaptchaRef} className="flex justify-center min-h-[78px]"></div>
                                            <button
                                                onClick={sendLoginOTP}
                                                disabled={loginOtpLoading || !loginRecaptchaReady}
                                                className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {loginOtpLoading ? (
                                                    <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Mengirim...</>
                                                ) : 'Kirim Kode Verifikasi'}
                                            </button>
                                        </div>
                                    )}

                                    {loginOtpSent && (
                                        <OTPVerification
                                            onVerify={handleLoginVerifyOTP}
                                            phoneNumber={formatRegPhone(loginMatchedUser?.phoneNumber || '')}
                                            onResend={handleLoginResendOTP}
                                            isResending={loginResending}
                                            isLoading={loginOtpLoading}
                                        />
                                    )}

                                    <button type="button" onClick={() => setLoginStep(1)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline">
                                        ← Kembali ke Login
                                    </button>
                                </div>
                            )}

                            {/* ──────── REGISTER PANEL (multi-step) ──────── */}
                            {authTab === 'register' && (
                                <div>
                                    {/* Step walkthrough indicator */}
                                    <div className="flex items-center justify-center mb-6">
                                        {[
                                            { n: 1, label: 'ID Card' },
                                            { n: 2, label: 'Details' },
                                            { n: 3, label: 'Verify' },
                                        ].map(({ n, label }, i) => (
                                            <React.Fragment key={n}>
                                                <div className="flex flex-col items-center gap-1">
                                                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all duration-300 ${
                                                        regStep > n
                                                            ? 'bg-green-500 text-white'
                                                            : regStep === n
                                                                ? 'bg-primary text-white ring-4 ring-primary/20'
                                                                : 'bg-gray-100 text-gray-400'
                                                    }`}>
                                                        {regStep > n ? <CheckCircle className="w-4 h-4" /> : n}
                                                    </div>
                                                    <span className={`text-[10px] font-medium ${
                                                        regStep >= n ? 'text-primary' : 'text-gray-400'
                                                    }`}>{label}</span>
                                                </div>
                                                {i < 2 && (
                                                    <div className={`w-12 h-0.5 mx-1 mb-4 transition-all duration-300 ${
                                                        regStep > n + 1 ? 'bg-green-400' : regStep > n ? 'bg-primary' : 'bg-gray-200'
                                                    }`} />
                                                )}
                                            </React.Fragment>
                                        ))}
                                    </div>

                                    {/* ── Step 1: Upload ID Card ── */}
                                    {regStep === 1 && (
                                        <div className="space-y-4">
                                            <div className="text-center mb-2">
                                                <h3 className="text-base font-bold text-gray-800">Upload ID Card</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">Upload your student ID card to extract your information</p>
                                            </div>

                                            {/* Upload area */}
                                            <div className="text-center p-6 border-2 border-dashed border-gray-200 rounded-2xl hover:border-primary/50 transition-colors cursor-pointer">
                                                <div className="flex flex-col items-center gap-2">
                                                    <div className="w-12 h-12 bg-primary/10 rounded-2xl flex items-center justify-center">
                                                        <svg className="w-6 h-6 text-primary" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                                        </svg>
                                                    </div>
                                                    {regImageFile ? (
                                                        <p className="text-xs text-primary font-medium">{regImageFile.name}</p>
                                                    ) : (
                                                        <p className="text-xs text-gray-400">Choose a file up to 2MB</p>
                                                    )}
                                                    <input
                                                        type="file"
                                                        accept="image/*"
                                                        onChange={handleRegImageUpload}
                                                        className="w-full text-xs text-gray-500 file:mr-3 file:py-1.5 file:px-3 file:rounded-full file:border-0 file:text-xs file:font-semibold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 cursor-pointer"
                                                    />
                                                </div>
                                            </div>

                                            {/* Error */}
                                            {regOcrError && (
                                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                                                    <XCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    {regOcrError}
                                                </div>
                                            )}

                                            {/* Extracted data (shown inline after extract) */}
                                            {regExtracted && (
                                                <div className="p-4 bg-green-50 border border-green-200 rounded-2xl space-y-2">
                                                    <div className="flex items-center gap-2 mb-2">
                                                        <CheckCircle className="w-4 h-4 text-green-500" />
                                                        <span className="text-xs font-semibold text-green-700">Data Extracted Successfully</span>
                                                    </div>
                                                    {[{ label: 'Name', val: regExtracted.name }, { label: 'Address', val: regExtracted.address }, { label: 'ID Number (NIS)', val: regExtracted.idNumber }].map(({ label, val }) => (
                                                        <div key={label}>
                                                            <p className="text-[10px] text-gray-400 font-medium uppercase tracking-wide mb-0.5">{label}</p>
                                                            <div className="px-3 py-2 bg-white border border-gray-200 rounded-lg text-xs text-gray-800 font-medium">{val}</div>
                                                        </div>
                                                    ))}
                                                </div>
                                            )}

                                            {/* Buttons */}
                                            <button
                                                onClick={handleRegExtract}
                                                disabled={regOcrLoading || !regImage}
                                                className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                            >
                                                {regOcrLoading ? (
                                                    <><Loader2 className="w-4 h-4 animate-spin" /> Processing...</>
                                                ) : regExtracted ? 'Re-extract Data' : 'Extract Data'}
                                            </button>

                                            {regExtracted && (
                                                <button
                                                    onClick={() => setRegStep(2)}
                                                    className="w-full py-3 border-2 border-primary text-primary font-semibold rounded-xl hover:bg-primary/5 transition-all flex items-center justify-center gap-2"
                                                >
                                                    Continue <ArrowRight className="w-4 h-4" />
                                                </button>
                                            )}

                                            <p className="text-center text-xs text-gray-400">
                                                Sudah punya akun?{' '}
                                                <button type="button" onClick={() => { setAuthTab('login'); setLoginError(''); }} className="text-primary font-semibold hover:underline">Login di sini</button>
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Step 2: Account Details ── */}
                                    {regStep === 2 && (
                                        <div className="space-y-4">
                                            <div className="text-center mb-2">
                                                <h3 className="text-base font-bold text-gray-800">Account Details</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">Enter your phone number and create a password</p>
                                            </div>

                                            <form onSubmit={handleRegStep2Submit} className="space-y-4">
                                                {/* Phone */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Phone Number</label>
                                                    <input
                                                        type="tel"
                                                        placeholder="081234567890"
                                                        value={regPhone}
                                                        onChange={handleRegPhoneChange}
                                                        className={`w-full px-4 py-3 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all bg-gray-50 ${
                                                            regPhoneError ? 'border-red-400' : 'border-gray-200 focus:border-primary'
                                                        }`}
                                                    />
                                                    {regPhoneError && (
                                                        <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                                            <XCircle className="w-3 h-3" />{regPhoneError}
                                                        </p>
                                                    )}
                                                </div>

                                                {/* Password */}
                                                <div>
                                                    <label className="block text-xs font-semibold text-gray-500 mb-1.5 uppercase tracking-wide">Password</label>
                                                    <div className="relative">
                                                        <input
                                                            type={regShowPwd ? 'text' : 'password'}
                                                            placeholder="Create a strong password"
                                                            value={regPwd}
                                                            onChange={handleRegPwdChange}
                                                            className={`w-full px-4 py-3 pr-11 border rounded-xl text-sm text-gray-800 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-primary/40 transition-all bg-gray-50 ${
                                                                regPwdErrors.length > 0 && regPwd ? 'border-red-400' : 'border-gray-200 focus:border-primary'
                                                            }`}
                                                        />
                                                        <button type="button" onClick={() => setRegShowPwd(!regShowPwd)} className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600">
                                                            {regShowPwd ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                                        </button>
                                                    </div>
                                                    {/* Password checklist */}
                                                    <div className="mt-2 space-y-1">
                                                        {[
                                                            { check: regPwd.length >= 6, text: 'Minimum 6 characters' },
                                                            { check: /[A-Z]/.test(regPwd), text: 'At least 1 uppercase letter' },
                                                            { check: /[a-z]/.test(regPwd), text: 'At least 1 lowercase letter' },
                                                            { check: /[0-9]/.test(regPwd), text: 'At least 1 number' },
                                                            { check: /[!@#$%^&*()_+\-=\[\]{};':"|,.<>\/?]/.test(regPwd), text: 'At least 1 special character' },
                                                        ].map((r, i) => (
                                                            <div key={i} className={`text-xs flex items-center gap-1.5 ${r.check ? 'text-green-600' : 'text-gray-400'}`}>
                                                                {r.check ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300 flex-shrink-0" />}
                                                                {r.text}
                                                            </div>
                                                        ))}
                                                    </div>
                                                </div>

                                                <div className="flex gap-2 pt-1">
                                                    <button type="button" onClick={() => setRegStep(1)} className="flex-1 py-3 border border-gray-200 text-gray-600 font-semibold rounded-xl hover:bg-gray-50 transition-all text-sm">
                                                        ← Back
                                                    </button>
                                                    <button type="submit" disabled={!isStep2Valid()} className="flex-1 py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed text-sm">
                                                        Continue
                                                    </button>
                                                </div>
                                            </form>

                                            <p className="text-center text-xs text-gray-400">
                                                Sudah punya akun?{' '}
                                                <button type="button" onClick={() => { setAuthTab('login'); setLoginError(''); }} className="text-primary font-semibold hover:underline">Login di sini</button>
                                            </p>
                                        </div>
                                    )}

                                    {/* ── Step 3: Verify Phone ── */}
                                    {regStep === 3 && (
                                        <div className="space-y-4">
                                            <div className="text-center mb-2">
                                                <div className="w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                                                    <Phone className="w-6 h-6 text-primary" />
                                                </div>
                                                <h3 className="text-base font-bold text-gray-800">Verify Your Phone</h3>
                                                <p className="text-xs text-gray-400 mt-0.5">
                                                    {regOtpSent ? 'Enter the code sent to' : "We'll send a verification code to"}
                                                </p>
                                                <p className="text-sm font-semibold text-gray-700 mt-1">{formatRegPhone(regPhone)}</p>
                                            </div>

                                            {/* OTP Error */}
                                            {regOtpError && (
                                                <div className="p-3 bg-red-50 border border-red-200 text-red-600 rounded-xl text-xs flex items-start gap-2">
                                                    <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                                    {regOtpError}
                                                </div>
                                            )}

                                            {/* Before OTP sent: reCAPTCHA + send button */}
                                            {!regOtpSent && (
                                                <div className="flex flex-col items-center gap-3">
                                                    <p className="text-xs text-gray-400">Complete the reCAPTCHA to continue:</p>
                                                    <div id="reg-recaptcha-container" ref={regRecaptchaRef} className="flex justify-center min-h-[78px]"></div>
                                                    <button
                                                        onClick={sendRegOTP}
                                                        disabled={regOtpLoading || !regRecaptchaReady}
                                                        className="w-full py-3 bg-gradient-to-r from-primary to-blue-600 text-white font-semibold rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                                                    >
                                                        {regOtpLoading ? (
                                                            <><div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" /> Sending...</>
                                                        ) : 'Send Verification Code'}
                                                    </button>
                                                    {!regRecaptchaReady && !regOtpLoading && (
                                                        <p className="text-xs text-gray-400">Complete the reCAPTCHA above to enable sending</p>
                                                    )}
                                                </div>
                                            )}

                                            {/* After OTP sent: OTP input */}
                                            {regOtpSent && (
                                                <OTPVerification
                                                    onVerify={handleRegVerifyOTP}
                                                    phoneNumber={formatRegPhone(regPhone)}
                                                    onResend={handleRegResendOTP}
                                                    isResending={regResending}
                                                    isLoading={regOtpLoading}
                                                />
                                            )}

                                            <button type="button" onClick={() => setRegStep(2)} className="w-full text-center text-xs text-gray-400 hover:text-gray-600 underline">
                                                ← Back to Account Details
                                            </button>
                                        </div>
                                    )}
                                </div>
                            )}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

export default Landingpage;