"use client";
import { useState, useEffect } from "react";
import toast, { Toaster } from "react-hot-toast";
import { MdOutlinePhoneIphone } from "react-icons/md";

export default function OTPLoginPage() {
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [isOtpSent, setIsOtpSent] = useState(false);
  const [resendTimer, setResendTimer] = useState(30);
  const [isResendDisabled, setIsResendDisabled] = useState(false);

  useEffect(() => {
    let timerId: ReturnType<typeof setInterval>;
    if (isOtpSent && resendTimer > 0) {
      setIsResendDisabled(true);
      timerId = setInterval(() => {
        setResendTimer((prev) => prev - 1);
      }, 1000);
    } else if (resendTimer === 0) {
      setIsResendDisabled(false);
    }
    return () => clearInterval(timerId);
  }, [isOtpSent, resendTimer]);

  const handleSendOtp = () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }
    setIsOtpSent(true);
    setResendTimer(30);
    toast.success("OTP sent!");
  };

  const handleResendOtp = () => {
    if (!phoneNumber) {
      toast.error("Please enter a phone number");
      return;
    }
    setResendTimer(30);
    setIsResendDisabled(true);
    toast.success("OTP resent!");
  };

  const handleVerifyOtp = () => {
    if (!otp) {
      toast.error("Please enter the OTP");
      return;
    }
    toast.success("OTP verified!");
  };

  return (
    <div className="min-h-158 max-md:min-h-160 flex items-center justify-center text-gray-900">
      <Toaster position="top-center" />
      <div className="w-full max-w-md p-6 rounded-xl shadow-lg border border-gray-200 bg-white max-sm:w-[95%] flex flex-col items-center justify-center gap-4">
        <h1 className="text-2xl font-bold mb-6 text-center text-blue-600 flex items-center justify-center gap-2">
          OTP Login <MdOutlinePhoneIphone size={30} />


        </h1>
        <span className="text-red-500">This is not a functional page but a dummy UI</span>
        {!isOtpSent ? (
          <div className="space-y-4">
            <div className="flex items-center border border-gray-300 rounded-lg mb-4">
              <span className="px-3 py-3 text-lg text-gray-700 bg-gray-100 border-r border-gray-300">
                +91
              </span>
              <input
                type="tel"
                placeholder="XXXXXXXXXX"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                className="w-full p-3 rounded-r-lg outline-none focus:ring-2 focus:ring-blue-500 text-center text-lg"
              />
            </div>
            <button
              onClick={handleSendOtp}
              className="w-full flex items-center justify-center gap-2 bg-blue-600 text-white p-3 rounded-lg hover:bg-blue-700 transition"
            >
              Send OTP
            </button>
          </div>
        ) : (
          <div className="space-y-5">
            <p className="text-center font-semibold text-base text-gray-700">OTP has been sent to your number : {phoneNumber}</p>
            <input
              type="text"
              placeholder="Enter OTP"
              value={otp}
              onChange={(e) => setOtp(e.target.value)}
              className="w-full p-3 border border-gray-300 rounded-lg mb-4 outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="flex gap-4 max-sm:flex-col justify-center">
              <div className="flex gap-4 max-sm:flex-col">
                <button
                  onClick={handleVerifyOtp}
                  className="flex-1 flex items-center justify-center gap-2 bg-blue-500 text-white py-2 px-6 rounded-md hover:bg-blue-700 transition text-base font-medium"
                >
                  Verify OTP
                </button>
                <button
                  onClick={handleResendOtp}
                  disabled={isResendDisabled}
                  className={`flex-1 flex items-center justify-center gap-2 py-2 px-6 rounded-md text-base font-medium transition whitespace-nowrap ${isResendDisabled
                    ? "bg-gray-400 text-white cursor-not-allowed"
                    : "bg-gray-600 text-white hover:bg-gray-700"
                    }`}
                >
                  {isResendDisabled ? `Resend OTP (${resendTimer}s)` : "Resend OTP"}
                </button>

              </div>

            </div>
          </div>
        )}
      </div>
    </div>
  );
}

