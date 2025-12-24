import React, { useState } from 'react';
import {
  InputOTP,
  InputOTPGroup,
  InputOTPSlot,
  InputOTPSeparator,
} from "@/components/ui/input-otp";
import { Loader2 } from 'lucide-react';

const OTPVerification = ({ 
  onVerify, 
  phoneNumber, 
  onResend,
  isResending = false,
  isLoading = false 
}) => {
  const [value, setValue] = useState("");
  const [localLoading, setLocalLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (value.length < 6) return;
    
    setLocalLoading(true);
    try {
      if (onVerify) {
        await onVerify(value);
      } else {
        console.log("OTP Verified:", value);
      }
    } finally {
      setLocalLoading(false);
    }
  };

  const handleResend = () => {
    if (onResend && !isResending) {
      onResend();
    }
  };

  const loading = localLoading || isLoading;

  return (
    <div className="flex flex-col items-center justify-center space-y-4 w-full">
      <form onSubmit={handleSubmit} className="space-y-6 w-full flex flex-col items-center">
        <div className="flex justify-center">
          <InputOTP
            maxLength={6}
            value={value}
            onChange={(val) => setValue(val)}
            disabled={loading}
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
          disabled={value.length < 6 || loading}
          className="w-full bg-blue-500 text-white hover:bg-blue-600 h-12 px-4 py-2 rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-all font-medium flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Verifying...
            </>
          ) : (
            "Verify Code"
          )}
        </button>
      </form>

      <div className="text-center text-sm">
        <p className="text-gray-500">
          Didn't receive code?{" "}
          <button 
            type="button"
            onClick={handleResend}
            disabled={isResending}
            className="underline underline-offset-4 hover:text-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isResending ? "Sending..." : "Resend"}
          </button>
        </p>
      </div>
    </div>
  );
};

export default OTPVerification;
