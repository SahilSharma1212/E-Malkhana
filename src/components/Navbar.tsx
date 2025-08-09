'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import React, { useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';
import axios from 'axios';
import { LogOut, QrCode, Search } from 'lucide-react';

export default function Navbar() {
  const [hasToken, setHasToken] = useState(false);
  const router = useRouter();

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });

        console.log("Auth API response:", res.data);

        setHasToken(res.data.authenticated); // ✅ set based on token validity
        // You can also store user info: res.data.user
      } catch (err) {
        console.error("Auth check failed:", err);
      }
    }

    checkAuth();
  }, []);


  // Handle sign-out
  const handleSignOut = async () => {
    try {
      const res = await axios.post('/api/sign-out', {}, {
        withCredentials: true,
      });

      if (res.data.success) {
        toast.success("Signed Out")
        setHasToken(false);
        router.push('/sign-in');
      }
    } catch (err) {
      console.error("Sign-out failed:", err);
    }
  };

  return (
    <nav className="w-full bg-blue-100 text-white shadow-md py-2 px-1.5">
      <div className="w-full mx-auto px-4 py-3 flex items-center justify-between bg-blue-500 rounded-sm pr-10 max-sm:pr-4">
        <Link href={'/admin'} className="flex justify-center gap-4 items-center">
          <div className="flex items-center justify-center">
            <Image
              src="/CG_POLICE_LOGO.png"
              alt="Logo"
              width={20}
              height={20}
              className="object-contain"
            />
          </div>

          {/* Logo / Title */}
          <div className="text-xl font-bold tracking-wide max-sm:hidden">
            E-Malkhana System
          </div>
          <div className="text-xl sm:hidden max-md:text-base font-bold tracking-wide max-sm:visible">
            Malkhana
          </div>
        </Link>

        {/* Navigation Links */}
        <div className="space-x-4 text-sm md:text-base max-md:text-sm flex items-center justify-center">
          {hasToken && (
            <>

              {/* scanner */}
              <button
                className="hover:underline text-sm md:text-base max-md:text-sm px-2 py-1 rounded-md  border-white text-white border hover:bg-blue-400 max-sm:scale-90 sm:border"
              >
                <Link href={"/scanner"} className="">
                  <QrCode strokeWidth={1} />
                </Link>
              </button>

              {/* search */}
              <button
                onClick={handleSignOut}
                className="hover:underline text-sm md:text-base max-md:text-sm px-2 py-1 rounded-md  border-white text-white border sm:hidden hover:bg-blue-400 max-sm:scale-90"
              >
                <LogOut strokeWidth={1} />
              </button>

              {/* signout */}
              <button
                onClick={handleSignOut}
                className="text-sm md:text-base max-md:text-sm px-3 py-1 rounded-md max-sm:hidden border-blue-300 text-white border font-medium  hover:bg-blue-400"
              >
                Sign Out
              </button>


            </>
          )}
          <Link href="/search-property" className="text-sm md:text-base max-md:text-sm px-3 py-1 rounded-md max-sm:hidden border-blue-300 text-white border font-medium  hover:bg-blue-400">
            Search
          </Link>
          <Link href="/search-property" className="px-2 py-1 hover:bg-blue-400 rounded-sm transition-all sm:hidden border border-white max-sm:scale-90">
            <Search strokeWidth={1} />
          </Link>

        </div>
      </div>
      <Toaster />
    </nav>
  );
}