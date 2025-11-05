import React, {useEffect, useRef, useState} from 'react';

const Verification = () => {
    //Timer
    const [timer, setTimer] = useState(10);

    useEffect(() => {
        const t = setInterval(() => {
            setTimer((prev) => Math.max(prev - 1, 0));
        }, 1000);
        return () => clearInterval(t);
    }, []);

    const inputsRef = useRef([]);
    const handleChange = (e, index) => {
        const value = e.target.value;

        // Only allow numeric input
        if (!/^[0-9]*$/.test(value)) return;

        // Move to next input if value is entered
        if (value && index < inputsRef.current.length - 1) {
            inputsRef.current[index + 1].focus();
        }
    }

        return (
        <div className="flex items-center justify-center min-h-screen">
            <div className="bg-white p-8 rounded-2xl shadow-md w-80">
                <h2 className="text-2xl font-bold mb-6 text-center">Verifikasi</h2>
                <p>Masukan Kode otp terlebih dahulu</p>
                <div className="my-8 flex justify-between ">
                    {[0, 1, 2, 3].map((i) => (
                        <input
                            key={i}
                            ref={(el) => (inputsRef.current[i] = el)}
                            type="text"
                            inputMode="numeric"
                            maxLength={1}
                            className="w-10 h-10 bg-background border border-[#d9d9d9] rounded-md text-2xl font-bold text-text text-center"
                            onChange={(e) => handleChange(e, i)}
                        />
                    ))}
                </div>
                <p className="text-sm">Didnt receive code?</p>
                <div className="">
                    {timer > 0 ? (
                        // Show countdown text while timer is running
                        <p className="text-sm text-gray-500">
                            You can resend in - {Math.floor(timer / 60)}:{String(timer % 60).padStart(2, "0")}
                        </p>
                    ) : (
                        // Show resend button when timer reaches 0
                        <button
                            // onClick={resendOtp}
                            className="text-blue-600 transition-colors"
                        >
                            Resend
                        </button>
                    )}
                </div>

            </div>
        </div>
    );
};

export default Verification;