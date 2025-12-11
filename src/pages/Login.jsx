import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Login = () => {
    const navigate = useNavigate();
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleLogin = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!email.trim()) {
            setError("Masukkan email terlebih dahulu!");
            setLoading(false);
            return;
        }

        if (!password.trim()) {
            setError("Masukkan password terlebih dahulu!");
            setLoading(false);
            return;
        }

        try {
            // Sign in with email and password
            const userCredential = await signInWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Get user display name or email
            const displayName = userCredential.user.displayName || email.split("@")[0];

            // Store auth state in localStorage (matching existing pattern)
            localStorage.setItem("auth", "true");
            localStorage.setItem("username", displayName);

            // Navigate to home after successful login
            navigate("/home");
        } catch (error) {
            console.error("Login error:", error);
            
            // Handle different Firebase errors
            let errorMessage = "Terjadi kesalahan saat login. Silakan coba lagi.";
            
            if (error.code === "auth/user-not-found") {
                errorMessage = "Email tidak terdaftar. Silakan daftar terlebih dahulu.";
            } else if (error.code === "auth/wrong-password") {
                errorMessage = "Password salah. Silakan coba lagi.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Format email tidak valid.";
            } else if (error.code === "auth/invalid-credential") {
                errorMessage = "Email atau password salah. Silakan coba lagi.";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Koneksi internet bermasalah. Periksa koneksi Anda.";
            } else if (error.code === "auth/too-many-requests") {
                errorMessage = "Terlalu banyak percobaan login. Silakan coba lagi nanti.";
            }
            
            setError(errorMessage);
        } finally {
            setLoading(false);
        }
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

                    {/* Email */}
                    <div className="mb-4 text-start">
                        <label
                            htmlFor="email"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Email
                        </label>
                        <input
                            type="email"
                            required
                            name="email"
                            id="email"
                            placeholder="john@example.com"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
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
                        <input
                            name="password"
                            id="password"
                            type="password"
                            required
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        disabled={loading}
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition disabled:bg-blue-300 disabled:cursor-not-allowed"
                    >
                        {loading ? "Masuk..." : "Login"}
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
