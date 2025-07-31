import React from 'react';
import { FaGoogle } from "react-icons/fa";
export default function Page() {
    return (
        <div className=" min-h-150 flex items-center justify-center px-4">
            <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
                <h1 className="text-3xl font-semibold text-gray-900 text-center">Sign In</h1>
                <form action="" className="space-y-4">
                    <div className="flex flex-col gap-1">
                        <label htmlFor="username" className="text-sm font-medium text-gray-700">
                            Username
                        </label>
                        <input
                            type="text"
                            id="username"
                            placeholder="Enter username"
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 border-gray-300"
                        />
                    </div>

                    <div className="flex flex-col gap-1">
                        <label htmlFor="password" className="text-sm font-medium text-gray-700">
                            Password
                        </label>
                        <input
                            type="password"
                            id="password"
                            placeholder="Enter password"
                            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500/30 border-gray-300"
                        />
                    </div>

                    <div className="flex justify-between items-center pt-4">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-full flex justify-center items-center gap-2"
                        >
                            <FaGoogle />
                            <p className='text-white max-sm:hidden'>
                            Sign Up using Google
                            </p>

                            <p className='text-white sm:hidden'>
                            Google
                            </p>
                        </button>

                

                    </div>                    

                    <div className="flex justify-between items-center pt-4">
                        <button
                            type="submit"
                            className="bg-blue-500 hover:bg-blue-700 text-white font-medium px-5 py-2 rounded-md transition-all duration-200 w-[45%] max-sm:text-sm"
                        >
                            Sign Up
                        </button>
                            <span className='text-blue-500'>|</span>
                        <button
                            type="submit"
                            className="bg-blue-50 hover:bg-blue-100 text-blue-700 font-medium px-5 py-2 rounded-md transition-all duration-200 w-[45%]
                            border border-blue-500 max-sm:text-sm"
                        >
                            Sign In
                        </button>

                    </div>
                </form>
            </div>
        </div>
    );
}