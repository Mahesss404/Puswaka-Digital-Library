import {useNavigate} from "react-router-dom";
import React, {useState} from "react";

const Login = () => {
    const navigate = useNavigate();
    const [name, setName] = useState("");

    const handleLogin = (e) => {
        e.preventDefault();

        // Simulasi login sederhana
        if (name.trim() === "") {
            alert("Masukkan nama terlebih dahulu!");
            return;
        }

        localStorage.setItem("auth", "true");
        localStorage.setItem("username", name);

        navigate("/home");
    };




    return (
        <div className="flex items-center justify-center min-h-screen p-16">
            <div className="w-full">
                <form
                    onSubmit={handleLogin}
                    className="flex flex-col bg-white p-8 rounded-2xl shadow-md h-full max-w-[700px]  mx-auto"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

                    {/* Nama */}
                    <div className="mb-4 text-start">
                        <label
                            htmlFor="nama"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nama Lengkap
                        </label>
                        <input
                            type="text"
                            required
                            name="nama"
                            id="nama"
                            placeholder="John Smith"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none "
                        />
                    </div>

                    {/* Nis */}
                    <div className="mb-4 text-start">
                        <label
                            htmlFor="nis"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nis
                        </label>
                        <input
                            type="text"
                            required
                            name="nis"
                            id="nis"
                            placeholder="10997"
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    {/* Nomor Telepon */}
                    <div className="mb-4 text-start" >
                        <label
                            htmlFor="number"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Nomor Telepon
                        </label>
                        <input
                            type="text"
                            inputMode="numeric"
                            name="number"
                            id="number"
                            required
                            placeholder="+62 89123456789"
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    {/* Alamat */}
                    <div className="mb-4 text-start" >
                        <label
                            htmlFor="address"
                            className="block text-sm font-medium text-gray-700 mb-1"
                        >
                            Alamat
                        </label>
                        <textarea
                            name="address"
                            id="address"
                            required
                            placeholder="Jl.mangga..."
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
                            className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md focus:ring-2 focus:ring-blue-400 outline-none"
                        />
                    </div>

                    <button
                        type="submit"
                        className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-600 transition"
                    >
                        Login
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Login;
