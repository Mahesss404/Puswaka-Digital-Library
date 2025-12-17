import React, { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";

const OTPVerification = ({ onVerify }) => {
  const [value, setValue] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (value.length < 6) return;
    
    setIsLoading(true);
    // Simulate API call or trigger callback
    setTimeout(() => {
        if (onVerify) {
            onVerify(value);
        } else {
            console.log("OTP Verified:", value);
            alert(`OTP Verified: ${value}`);
        }
        setIsLoading(false);
    }, 1000);
  };

  return (
    <div className="flex flex-col items-center justify-center p-6 space-y-4 bg-white rounded-lg shadow-sm w-full max-w-sm mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-semibold tracking-tight">Verification Code</h2>
        <p className="text-sm text-gray-500">
          Enter the 6-digit code sent to your device.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
        <div className="flex justify-center">
             <InputOTP
                maxLength={6}
                value={value}
                onChange={(val) => setValue(val)}
             >
              <InputOTPGroup>
                <InputOTPSlot index={0} />
                <InputOTPSlot index={1} />
                <InputOTPSlot index={2} />
              </InputOTPGroup>
              <InputOTPSeparator />
              <InputOTPGroup>
                <InputOTPSlot index={3} />
                <InputOTPSlot index={4} />
                <InputOTPSlot index={5} />
              </InputOTPGroup>
            </InputOTP>
        </div>

        <button
          type="submit"
          disabled={value.length < 6 || isLoading}
          className="w-full bg-primary text-white hover:bg-primary/80 h-10 px-4 py-2 rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-all"
        >
          {isLoading ? "Verifying..." : "Verify Code"}
        </button>
      </form>

      <div className="text-center text-sm">
        <p className="text-gray-500">
          Didn't receive code?{" "}
          <button className="underline underline-offset-4 hover:text-primary">
            Resend
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
