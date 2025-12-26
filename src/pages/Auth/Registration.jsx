import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Tesseract from "tesseract.js";
import { Eye, EyeOff, CheckCircle, XCircle, Loader2 } from "lucide-react";

const Registration = () => {
    const navigate = useNavigate();
    
    // Step management
    const [currentStep, setCurrentStep] = useState(1);
    
    // Step 1: ID Card Upload
    const [image, setImage] = useState(null);
    const [extractedData, setExtractedData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [extractError, setExtractError] = useState("");
    
    // Step 2: Account Details
    const [phoneNumber, setPhoneNumber] = useState("");
    const [password, setPassword] = useState("");
    const [showPassword, setShowPassword] = useState(false);
    const [phoneError, setPhoneError] = useState("");
    const [passwordErrors, setPasswordErrors] = useState([]);
    
    // Password validation requirements
    const validatePassword = (pwd) => {
        const errors = [];
        
        // Check for emoji and special unicode (only allow ASCII printable)
        const asciiOnly = /^[\x20-\x7E]*$/;
        if (!asciiOnly.test(pwd)) {
            errors.push("Only standard characters allowed (no emoji)");
        }
        
        if (pwd.length < 6) {
            errors.push("Minimum 6 characters");
        }
        if (!/[A-Z]/.test(pwd)) {
            errors.push("At least 1 uppercase letter");
        }
        if (!/[a-z]/.test(pwd)) {
            errors.push("At least 1 lowercase letter");
        }
        if (!/[0-9]/.test(pwd)) {
            errors.push("At least 1 number");
        }
        if (!/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(pwd)) {
            errors.push("At least 1 special character (!@#$%^&*...)");
        }
        
        return errors;
    };
    
    // Phone validation
    const validatePhone = (phone) => {
        // Remove any non-digit characters for validation
        const digits = phone.replace(/\D/g, '');
        if (digits.length < 10 || digits.length > 13) {
            return "Phone number must be 10-13 digits";
        }
        return "";
    };
    
    // Handle text-only input (filter emoji)
    const filterTextOnly = (text) => {
        // Remove emoji and special unicode, keep only ASCII printable
        return text.replace(/[^\x20-\x7E]/g, '');
    };
    
    const handleImageUpload = (e) => {
        const file = e.target.files[0];
        if (file) {
            if (file.size > 2 * 1024 * 1024) {
                setExtractError("File size must be less than 2MB");
                return;
            }
            setImage(URL.createObjectURL(file));
            setExtractedData(null);
            setExtractError("");
        }
    };

    const handleExtract = async () => {
        if (!image) {
            setExtractError("Upload ID card terlebih dahulu!");
            return;
        }

        setLoading(true);
        setExtractError("");
        
        try {
            const result = await Tesseract.recognize(image, "eng");
            const text = result.data.text;

            const data = {
                name: extractField(text, /^[A-Z\s]+(?=\nNIS)/m),
                address: extractField(text, /Alamat\s*[:.']?\s*([^|\n]+)/i),
                idNumber: extractField(text, /NIS\s*[:.']?\s*(\d+)/i),
            };

            // Check if all required fields were extracted
            if (data.name === "Not found" || data.address === "Not found" || data.idNumber === "Not found") {
                setExtractError("Could not extract all required data. Please try a clearer image.");
                setExtractedData(null);
            } else {
                setExtractedData(data);
                // Save to localStorage
                localStorage.setItem("idCardData", JSON.stringify(data));
            }
        } catch (err) {
            console.error(err);
            setExtractError("Gagal membaca ID Card. Silakan coba lagi.");
        }
        setLoading(false);
    };

    const extractField = (text, regex) => {
        const match = text.match(regex);
        if (match) {
            return match[1] ? match[1].trim() : match[0].trim();
        }
        return "Not found";
    };

    const handleNextStep = () => {
        if (extractedData) {
            setCurrentStep(2);
        }
    };

    const handlePasswordChange = (e) => {
        const value = filterTextOnly(e.target.value);
        setPassword(value);
        setPasswordErrors(validatePassword(value));
    };

    const handlePhoneChange = (e) => {
        const value = e.target.value.replace(/[^\d+\-\s]/g, '');
        setPhoneNumber(value);
        setPhoneError(validatePhone(value));
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        
        // Final validation
        const phoneValidation = validatePhone(phoneNumber);
        const passwordValidation = validatePassword(password);
        
        if (phoneValidation) {
            setPhoneError(phoneValidation);
            return;
        }
        
        if (passwordValidation.length > 0) {
            setPasswordErrors(passwordValidation);
            return;
        }
        
        // Store all signup data to localStorage
        const signupData = {
            ...extractedData,
            phoneNumber: phoneNumber,
            password: password
        };
        localStorage.setItem("signupData", JSON.stringify(signupData));
        
        // Navigate to verification with registration mode
        navigate('/verification', { 
            state: { 
                phoneNumber: phoneNumber,
                signupData: signupData,
                mode: 'registration'
            }
        });
    };

    const isStep2Valid = () => {
        return phoneNumber.length >= 10 && 
               password.length >= 6 && 
               passwordErrors.length === 0 &&
               !phoneError;
    };

    return (
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-50 p-6">
            <div className="bg-white p-8 rounded-2xl shadow-lg w-full max-w-md">
                {/* Progress Steps */}
                <div className="flex items-center justify-center mb-6">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 1 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        1
                    </div>
                    <div className={`w-16 h-1 mx-2 ${currentStep >= 2 ? 'bg-blue-500' : 'bg-gray-200'}`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full ${currentStep >= 2 ? 'bg-blue-500 text-white' : 'bg-gray-200 text-gray-500'}`}>
                        2
                    </div>
                    <div className={`w-16 h-1 mx-2 bg-gray-200`}></div>
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full bg-gray-200 text-gray-500`}>
                        3
                    </div>
                </div>

                {/* Step 1: ID Card Upload */}
                {currentStep === 1 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-center">Upload ID Card</h2>
                        <p className="text-gray-500 text-sm text-center mb-6">
                            Upload your student ID card to extract your information
                        </p>

                        {/* Upload Area */}
                        <div className="text-center p-8 border-2 border-dashed border-gray-300 rounded-xl mb-4 hover:border-blue-400 transition-colors">
                            <p className="mb-3 text-sm text-gray-500">Choose a file with a size up to 2MB</p>
                            <input
                                name="fileUpload"
                                type="file"
                                accept="image/*"
                                onChange={handleImageUpload}
                                className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-600 hover:file:bg-blue-100 cursor-pointer"
                            />
                        </div>

                        {/* Error Message */}
                        {extractError && (
                            <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-600 rounded-lg text-sm flex items-center gap-2">
                                <XCircle className="w-4 h-4" />
                                {extractError}
                            </div>
                        )}

                        {/* Preview */}
                        {image && (
                            <div className="mb-4">
                                <img
                                    src={image}
                                    alt="Preview"
                                    className="rounded-lg shadow-sm border w-full"
                                />
                            </div>
                        )}

                        {/* Extract button */}
                        <button
                            onClick={handleExtract}
                            disabled={loading || !image}
                            className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {loading ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : (
                                "Extract Data"
                            )}
                        </button>

                        {/* Extracted Data Preview (Read-only) */}
                        {extractedData && (
                            <div className="mt-6 p-4 bg-green-50 border border-green-200 rounded-xl">
                                <div className="flex items-center gap-2 mb-4">
                                    <CheckCircle className="w-5 h-5 text-green-500" />
                                    <h3 className="text-lg font-semibold text-green-700">Data Extracted Successfully</h3>
                                </div>
                                
                                <div className="space-y-3">
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Name</label>
                                        <div className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-800">
                                            {extractedData.name}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">Address</label>
                                        <div className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-800">
                                            {extractedData.address}
                                        </div>
                                    </div>
                                    
                                    <div>
                                        <label className="block text-xs font-medium text-gray-500 mb-1">ID Number (NIS)</label>
                                        <div className="w-full p-3 bg-white border border-gray-200 rounded-lg text-gray-800">
                                            {extractedData.idNumber}
                                        </div>
                                    </div>
                                </div>

                                <button
                                    onClick={handleNextStep}
                                    className="w-full mt-4 bg-green-500 text-white py-3 rounded-lg hover:bg-green-600 transition font-medium"
                                >
                                    Continue →
                                </button>
                            </div>
                        )}

                        <p className="mt-6 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                )}

                {/* Step 2: Account Details */}
                {currentStep === 2 && (
                    <div>
                        <h2 className="text-2xl font-bold mb-2 text-center">Account Details</h2>
                        <p className="text-gray-500 text-sm text-center mb-6">
                            Enter your phone number and create a password
                        </p>

                        <form onSubmit={handleSubmit} className="space-y-4">
                            {/* Phone Number */}
                            <div>
                                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number
                                </label>
                                <input
                                    type="tel"
                                    id="phone"
                                    name="phone"
                                    placeholder="081234567890"
                                    value={phoneNumber}
                                    onChange={handlePhoneChange}
                                    className={`w-full p-3 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition ${phoneError ? 'border-red-400' : 'border-gray-300'}`}
                                />
                                {phoneError && (
                                    <p className="text-red-500 text-xs mt-1 flex items-center gap-1">
                                        <XCircle className="w-3 h-3" />
                                        {phoneError}
                                    </p>
                                )}
                            </div>

                            {/* Password */}
                            <div>
                                <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                                    Password
                                </label>
                                <div className="relative">
                                    <input
                                        type={showPassword ? "text" : "password"}
                                        id="password"
                                        name="password"
                                        placeholder="Create a strong password"
                                        value={password}
                                        onChange={handlePasswordChange}
                                        className={`w-full p-3 pr-12 border rounded-lg focus:ring-2 focus:ring-blue-400 outline-none transition ${passwordErrors.length > 0 && password ? 'border-red-400' : 'border-gray-300'}`}
                                    />
                                    <button
                                        type="button"
                                        onClick={() => setShowPassword(!showPassword)}
                                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    >
                                        {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                                    </button>
                                </div>
                                
                                {/* Password Requirements */}
                                <div className="mt-2 space-y-1">
                                    {[
                                        { check: password.length >= 6, text: "Minimum 6 characters" },
                                        { check: /[A-Z]/.test(password), text: "At least 1 uppercase letter" },
                                        { check: /[a-z]/.test(password), text: "At least 1 lowercase letter" },
                                        { check: /[0-9]/.test(password), text: "At least 1 number" },
                                        { check: /[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]/.test(password), text: "At least 1 special character" },
                                    ].map((req, idx) => (
                                        <div key={idx} className={`text-xs flex items-center gap-1 ${req.check ? 'text-green-600' : 'text-gray-400'}`}>
                                            {req.check ? <CheckCircle className="w-3 h-3" /> : <div className="w-3 h-3 rounded-full border border-gray-300" />}
                                            {req.text}
                                        </div>
                                    ))}
                                </div>
                            </div>

                            {/* Back Button */}
                            <button
                                type="button"
                                onClick={() => setCurrentStep(1)}
                                className="w-full py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition"
                            >
                                ← Back
                            </button>

                            {/* Submit Button */}
                            <button
                                type="submit"
                                disabled={!isStep2Valid()}
                                className="w-full bg-blue-500 text-white py-3 rounded-lg hover:bg-blue-600 transition disabled:bg-gray-300 disabled:cursor-not-allowed font-medium"
                            >
                                Continue to Verification
                            </button>
                        </form>

                        <p className="mt-4 text-center text-sm text-gray-500">
                            Already have an account?{" "}
                            <button
                                type="button"
                                onClick={() => navigate("/login")}
                                className="text-blue-500 hover:text-blue-600 underline"
                            >
                                Login here
                            </button>
                        </p>
                    </div>
                )}
            </div>
        </div>
    );
};

export default Registration;