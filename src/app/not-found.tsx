'use client';

import { motion } from 'framer-motion';
import { Home } from 'lucide-react';
import Link from 'next/link';

export default function NotFound() {
    return (
        <div className="relative w-full h-150 bg-blue-50 flex flex-col items-center justify-center px-4">




            {/* Text Content */}
            <motion.div
                className="text-center p-5 rounded-md shadow-md backdrop-blur-sm bg-white/70 px-10"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.6 }}
            >
                <h1 className="text-6xl text-blue-700 font-extrabold mb-4">404</h1>
                <p className="text-xl text-blue-700 mb-2 p-5 pt-4">Page Not Found</p>
                <Link
                    href="/"
                    className="inline-flex bg-blue-100 text-blue-800 px-6 py-2 rounded-md hover:bg-blue-200 transition justify-center items-center gap-2"
                >
                    <p>Go Back Home</p>
                    <Home strokeWidth={1}/>
                </Link>

                <div className='flex justify-center items-center gap-3 pt-10 py-5'>


                    {
                        [1, 2, 3].map((index) => (
                            <motion.div
                                key={index}
                                className="bg-blue-700 h-4 w-4 rounded-full"
                                animate={{ opacity: [0.3, 1, 0.3] }}
                                transition={{
                                    repeat: Infinity,
                                    duration: 1.2,
                                    ease: "easeInOut",
                                    delay: index * 0.2, // staggered delay
                                }}
                            />
                        ))
                    }


                </div>
            </motion.div>
        </div>
    );
}
