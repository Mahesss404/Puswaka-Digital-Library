import OTPVerification from "@/components/OTPVerification";
const Verification = () => {
    const handleVerify = (code) => {
        console.log("Verifying code:", code);
        // Call your auth API here
    };
    return (
        <div className="flex justify-center items-center min-h-screen">
            <OTPVerification onVerify={handleVerify} />
        </div>
    );
};

export default Verification;