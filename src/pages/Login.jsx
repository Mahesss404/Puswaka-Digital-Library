import { useNavigate } from "react-router-dom";

const Login = () => {
    const navigate = useNavigate();

    const handleLogin = () => {
        // ganti logic Firebase Auth


        localStorage.setItem("auth", "true");
        navigate("/Home");
    };

    return (
        <div className="flex flex-col items-center justify-center h-screen gap-4">
            <h1 className="text-2xl font-semibold">Login</h1>
            <button
                onClick={handleLogin}
                className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
            >
                Simulasi Login
            </button>
        </div>
    );
};

export default Login;
