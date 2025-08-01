"use client"
import React from 'react';
import { FaGoogle } from "react-icons/fa";
import { auth } from '@/config/firebaseConfig';
import {
  GoogleAuthProvider,
  signInWithPopup,
  signOut,
} from "firebase/auth";
import { useRouter } from "next/navigation";
import toast , {Toaster} from "react-hot-toast"
import { MdOutlinePhoneIphone } from "react-icons/md";
import axios from "axios"

export default function Page() {

    const router = useRouter();

    const handleGoogleSignIn = async () => {

    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);

      const email = result.user.email;

      const { data } = await axios.post("/api/verify-user", { email });

      if (data.allowed) {
        toast.success("Access granted");
        router.push("/admin");
      } else {
        await signOut(auth);
        toast.error("Access denied: not whitelisted");
      }
    } catch (err) {
      console.error(err);
      toast.error("Google Sign-in failed");
    }
  };

    return (
        <div className=" min-h-150 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
                <h1 className="text-3xl font-semibold text-gray-900 text-center">Sign In</h1>
                <p className='text-center'>Welcome to E Malkhana</p>
                
                   
                    {/* Google */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            className="bg-blue-500 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2"
                            onClick={handleGoogleSignIn}
                        >
                            <FaGoogle />
                            <p className='text-white max-sm:hidden'>
                                Sign in using Google
                            </p>

                            <p className='text-white sm:hidden'>
                                Google
                            </p>
                        </button>



                    </div>
                    {/* Phone OTP */}
                    <div className="flex justify-between items-center pt-4">
                        <button
                            className="bg-gray-900 hover:bg-gray-700 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2"
                            onClick={(e)=>{
                                e.preventDefault()
                                toast("Feature not added yet")
                            }}
                        >
                            <MdOutlinePhoneIphone />
                            <p className='text-white max-sm:hidden'>
                                Sign in using OTP
                            </p>

                            <p className='text-white sm:hidden'>
                                OTP
                            </p>
                        </button>



                    </div>

            
            </div>
            <Toaster/>
        </div>
    );
}
