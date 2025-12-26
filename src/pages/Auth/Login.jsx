import { useNavigate } from "react-router-dom";
import React, { useState, useEffect } from "react";
import { onAuthStateChanged } from "firebase/auth";
import { collection, getDocs } from "firebase/firestore";
import { auth, db } from "@/lib/firebase";
import { Eye, EyeOff } from "lucide-react";

const Login = () => {
    const navigate = useNavigate();
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);
    const [checkingAuth, setCheckingAuth] = useState(true);

    // Redirect if already authenticated
    useEffect(() => {
        const unsubscribe = onAuthStateChanged(auth, (user) => {
            if (user) {
                navigate("/home", { replace: true });
            } else {
                setCheckingAuth(false);
            }
        });
        return () => unsubscribe();
    }, [navigate]);

    // Show loading while checking auth
    if (checkingAuth) {
        return (
            <div className="flex items-center justify-center min-h-screen">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
        );
    }

    // Format phone for query (normalize to digits only)
    const normalizePhone = (phone) => {
        if (!phone) return "";
        let cleaned = phone.replace(/\D/g, '');
        // Remove leading 0 or country code for consistent comparison
        if (cleaned.startsWith('62')) {
            cleaned = cleaned.substring(2);
        }
        if (cleaned.startsWith('0')) {
            cleaned = cleaned.substring(1);
        }
        return cleaned;
    };

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!phoneNumber.trim()) {
            setError("Masukkan nomor telepon terlebih dahulu!");
            setLoading(false);
            return;
        }

        if (!password.trim()) {
            setError("Masukkan password terlebih dahulu!");
            setLoading(false);
            return;
        }

        try {
            // Query Firestore for user with matching phone number
            const usersRef = collection(db, "users");
            const normalizedInput = normalizePhone(phoneNumber);
            
            console.log("Looking for phone (normalized):", normalizedInput);
            
            // Query users and find matching phone
            const querySnapshot = await getDocs(usersRef);
            let matchedUser = null;
            
            querySnapshot.forEach((doc) => {
                const userData = doc.data();
                const storedPhone = normalizePhone(userData.phoneNumber || "");
                
                console.log("Checking user:", doc.id, "storedPhone:", storedPhone, "vs input:", normalizedInput);
                
                // Compare normalized phone numbers
                if (storedPhone === normalizedInput) {
                    matchedUser = { id: doc.id, ...userData };
                    console.log("Phone matched! User found:", matchedUser);
                }
            });

            if (!matchedUser) {
                console.log("No user found with phone:", normalizedInput);
                setError("Nomor telepon tidak terdaftar. Silakan daftar terlebih dahulu.");
                setLoading(false);
                return;
            }

            // Check password match - compare trimmed values
            const storedPassword = matchedUser.password || "";
            const inputPassword = password.trim();
            
            console.log("Password check - stored exists:", !!storedPassword, "input:", inputPassword);
            console.log("Password match:", storedPassword === inputPassword);
            
            if (!storedPassword) {
                // If no password stored, allow login (for users registered before password was added)
                console.log("No password stored for user, proceeding to verification");
            } else if (storedPassword !== inputPassword) {
                setError("Password salah. Silakan coba lagi.");
                setLoading(false);
                return;
            }

            console.log("Login credentials valid, navigating to verification...");
            
            // Password correct - navigate to OTP verification
            navigate('/verification', { 
                state: { 
                    phoneNumber: matchedUser.phoneNumber,
                    mode: 'login',
                    userData: matchedUser
                }
            });

        } catch (error) {
            console.error("Login error:", error);
            setError("Terjadi kesalahan saat login. Silakan coba lagi.");
        } finally {
            setLoading(false);
        }
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^\d+\-\s]/g, '');
        setPhoneNumber(value);
    };

    return (
        <div className="flex items-center justify-center min-h-screen p-16">
            <div className="w-full">
                <form
                    onSubmit={handleLogin}
                    className="flex flex-col bg-white p-8 rounded-2xl shadow-md h-full max-w-[700px] mx-auto"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Phone Number */}
                    <div className="mb-4 text-start">
                        <label
                            htmlFor="phone"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nomor Telepon
                        </label>
                        <input
                            type="tel"
                            required
                            name="phone"
                            id="phone"
                            placeholder="081234567890"
                            value={phoneNumber}
                            onChange={handlePhoneChange}
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    {/* Password */}
                    <div className="mb-6 text-start">
                        <label
                            htmlFor="password"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Password
                        </label>
                        <div className="relative">
                            <input
                                name="password"
                                id="password"
                                type={showPassword ? "text" : "password"}
                                required
                                placeholder="Password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                className="w-full p-2 pr-10 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                            >
                                {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                            </button>
                        </div>
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? "Memverifikasi..." : "Login"}
                    </button>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        Belum punya akun?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/registration")}
                            className="text-blue-500 hover:text-blue-600 underline"
                        >
                            Daftar di sini
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Login;
