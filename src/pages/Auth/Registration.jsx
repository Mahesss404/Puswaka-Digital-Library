import { useNavigate } from "react-router-dom";
import React, { useState } from "react";
import { createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { auth } from "@/lib/firebase";

const Registration = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [error, setError] = useState("");
    const [loading, setLoading] = useState(false);

    const handleRegistration = async (e) => {
        e.preventDefault();
        setError("");
        setLoading(true);

        // Validation
        if (!name.trim()) {
            setError("Masukkan nama terlebih dahulu!");
            setLoading(false);
            return;
        }

        if (!email.trim()) {
            setError("Masukkan email terlebih dahulu!");
            setLoading(false);
            return;
        }

        if (password.length < 6) {
            setError("Password harus minimal 6 karakter!");
            setLoading(false);
            return;
        }

        try {
            // Create user with email and password
            const userCredential = await createUserWithEmailAndPassword(
                auth,
                email,
                password
            );

            // Update user profile with name
            await updateProfile(userCredential.user, {
                displayName: name,
            });

            // Store auth state in localStorage (matching existing pattern)
            localStorage.setItem("auth", "true");
            localStorage.setItem("username", name);

            // Navigate to home after successful registration
            navigate("/home");
        } catch (error) {
            console.error("Registration error:", error);
            
            // Handle different Firebase errors
            let errorMessage = "Terjadi kesalahan saat registrasi. Silakan coba lagi.";
            
            if (error.code === "auth/email-already-in-use") {
                errorMessage = "Email sudah terdaftar. Silakan gunakan email lain atau login.";
            } else if (error.code === "auth/invalid-email") {
                errorMessage = "Format email tidak valid.";
            } else if (error.code === "auth/weak-password") {
                errorMessage = "Password terlalu lemah. Gunakan password yang lebih kuat.";
            } else if (error.code === "auth/network-request-failed") {
                errorMessage = "Koneksi internet bermasalah. Periksa koneksi Anda.";
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
                    onSubmit={handleRegistration}
                    className="flex flex-col bg-white p-8 rounded-2xl shadow-md h-full max-w-[700px] mx-auto"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">Registrasi</h2>

                    {/* Error Message */}
                    {error && (
                        <div className="mb-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded-md text-sm">
                            {error}
                        </div>
                    )}

                    {/* Nama */}
                    <div className="mb-4 text-start">
                        <label
                            htmlFor="name"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            required
                            name="name"
                            id="name"
                            placeholder="John Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

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
                            placeholder="Minimal 6 karakter"
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
                        {loading ? "Mendaftar..." : "Daftar"}
                    </button>

                    <p className="mt-4 text-center text-sm text-gray-600">
                        Sudah punya akun?{" "}
                        <button
                            type="button"
                            onClick={() => navigate("/login")}
                            className="text-blue-500 hover:text-blue-600 underline"
                        >
                            Login di sini
                        </button>
                    </p>
                </form>
            </div>
        </div>
    );
};

export default Registration;