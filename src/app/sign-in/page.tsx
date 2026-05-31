"use client"
import React, { useState } from 'react';
import { FaGoogle } from "react-icons/fa";
import { auth } from '@/config/firebaseConfig';
import {
    GoogleAuthProvider,
    signInWithPopup,
    signOut,
} from "firebase/auth";
import toast, { Toaster } from "react-hot-toast"
import { MdOutlinePhoneIphone } from "react-icons/md";
import axios from "axios"
import { Eye, EyeOff, Loader2, LogIn } from 'lucide-react';

export default function Page() {
    const [signinSuccessfull, setSignInSuccessfull] = useState(false)
    const [phoneloginredirection, setPhoneloginredirection] = useState(false)
    const [email, setEmail] = useState("")
    const [password, setPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isLoggingIn, setIsLoggingIn] = useState(false)
    const [isGoogleSigningIn, setIsGoogleSigningIn] = useState(false)

    const handlePasswordLogin = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!email.trim() || !password) {
            toast.error("Please enter email and password");
            return;
        }

        setIsLoggingIn(true);
        try {
            const { data } = await axios.post("/api/login", {
                email: email.trim(),
                password,
            });

            if (data.success) {
                toast.success("Signed in successfully");
                setSignInSuccessfull(true);
                window.location.href = "/admin";
            } else {
                toast.error(data.message || "Invalid credentials");
            }
        } catch (err) {
            if (axios.isAxiosError(err)) {
                toast.error(err.response?.data?.message || "Login failed");
            } else {
                toast.error("Login failed");
            }
        } finally {
            setIsLoggingIn(false);
        }
    };

    const handleGoogleSignIn = async () => {
        setIsGoogleSigningIn(true);
        try {
            const provider = new GoogleAuthProvider();
            const result = await signInWithPopup(auth, provider);

            const email = result.user.email;

            const { data } = await axios.post("/api/verify-user", { email });

            if (data.allowed) {
                toast.success("Access granted");
                setSignInSuccessfull(true)
                window.location.reload();
            } else {
                await signOut(auth);
                toast.error("Access denied: not whitelisted");
            }
        } catch (err) {
            console.error(err);
            toast.error("Google Sign-in failed");
        } finally {
            setIsGoogleSigningIn(false);
        }
    };

    return (
        signinSuccessfull ? (
            <div className="h-[32rem] flex justify-center items-center p-5">
                <div className="bg-white rounded-2xl shadow-lg p-8 max-w-md w-full text-center space-y-6 flex flex-col items-center justify-center gap-3">

                    <div className='flex flex-col items-center justify-center gap-3'>
                        <h2 className="text-2xl font-semibold text-green-600">Signed in Successfully</h2>
                        <p className="text-gray-700">You can now access the admin panel.</p>
                    </div>

                    <button className="bg-blue-500 text-white font-medium px-6 py-2 rounded-lg transition duration-200 flex items-center justify-center">
                        <Loader2 className='animate-spin' />
                    </button>
                </div>
            </div>
        ) : (
            <div className=" min-h-150 flex items-center justify-center px-4 py-8">
                <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-5">
                    <h1 className="text-3xl font-semibold text-gray-900 text-center">Sign In</h1>
                    <p className='text-center text-gray-600'>Welcome to E Malkhana</p>

                    {/* Email + Password form */}
                    <form className="space-y-3" onSubmit={handlePasswordLogin}>
                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Email</label>
                            <input
                                type="email"
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                placeholder="you@example.com"
                                className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                autoComplete="email"
                            />
                        </div>

                        <div>
                            <label className="block text-sm text-gray-700 mb-1">Password</label>
                            <div className="relative">
                                <input
                                    type={showPassword ? "text" : "password"}
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    placeholder="Enter password"
                                    className="w-full px-4 py-2 pr-10 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500 text-gray-900"
                                    autoComplete="current-password"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword((s) => !s)}
                                    className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                                    tabIndex={-1}
                                >
                                    {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                </button>
                            </div>
                        </div>

                        <button
                            type="submit"
                            disabled={isLoggingIn}
                            className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2 cursor-pointer"
                        >
                            {isLoggingIn ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <LogIn size={18} />
                                    <span>Sign In</span>
                                </>
                            )}
                        </button>
                    </form>

                    {/* Divider */}
                    <div className="flex items-center gap-3 pt-2">
                        <div className="flex-1 h-px bg-gray-200" />
                        <span className="text-xs text-gray-500">OR</span>
                        <div className="flex-1 h-px bg-gray-200" />
                    </div>

                    {/* Google */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            disabled={isGoogleSigningIn}
                            className="bg-white border border-gray-300 hover:bg-gray-50 text-gray-700 font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2 cursor-pointer disabled:opacity-60"
                            onClick={handleGoogleSignIn}
                        >
                            {isGoogleSigningIn ? (
                                <Loader2 className="animate-spin" size={18} />
                            ) : (
                                <>
                                    <FaGoogle />
                                    <span className='max-sm:hidden'>Sign in using Google</span>
                                    <span className='sm:hidden'>Google</span>
                                </>
                            )}
                        </button>
                    </div>

                    {/* Phone OTP */}
                    <div className="flex justify-between items-center">
                        <button
                            type="button"
                            className="bg-gray-900 hover:bg-gray-700 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2 cursor-pointer"
                            onClick={(e) => {
                                e.preventDefault()
                                setPhoneloginredirection(true)
                                window.location.href = "/otp-login"
                            }}
                            disabled={phoneloginredirection}
                        >
                            {phoneloginredirection ? (
                                <p className='text-white'>
                                    <Loader2 className='animate-spin' />
                                </p>
                            ) : (
                                <>
                                    <MdOutlinePhoneIphone />
                                    <span className='max-sm:hidden'>Sign in using OTP</span>
                                    <span className='sm:hidden'>OTP</span>
                                </>
                            )}
                        </button>
                    </div>
                </div>
                <Toaster />
            </div>
        )
    );
}
