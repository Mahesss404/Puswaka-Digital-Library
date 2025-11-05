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
        <div className="flex items-center justify-center min-h-screen">
            <div className="">
                <form
                    onSubmit={handleLogin}
                    className="bg-white p-8 rounded-2xl shadow-md w-80"
                >
                    <h2 className="text-2xl font-bold mb-6 text-center">Login</h2>

                    <input
                        type="text"
                        placeholder="Masukan nama"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md mb-4"
                    />
                    <input
                        type="password"
                        placeholder="Masukan Password"
                        className="w-full p-2 bg-background border border-[#d9d9d9] rounded-md mb-4"
                    />

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
