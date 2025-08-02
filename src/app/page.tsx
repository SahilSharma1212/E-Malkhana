'use client';

import PropertyForm from '@/components/PropertyForm';
import supabase from '@/config/supabaseConnect';
import { QrCode, Search, User } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import React, { Suspense, useEffect, useState } from 'react';
import toast, { Toaster } from 'react-hot-toast';

export default function Page() {
  const searchParams = useSearchParams();
  const qrId = searchParams?.get('qrId'); // safer access

  const [isValidQrId, setIsValidQrId] = useState<boolean | null>(null); // null = loading

  useEffect(() => {
    if (qrId === null) return; // wait until qrId is hydrated

    const validateQr = async () => {
      if (typeof qrId !== 'string' || qrId.trim() === '') {
        setIsValidQrId(false);
        return;
      }

      const { data, error } = await supabase
        .from('property_table')
        .select('*')
        .eq('qr_id', window.location.href)
        .maybeSingle();

      if (error) {
        toast.error("Couldn't find QR ID")
        setIsValidQrId(false)
      } else if (!data) {
        toast.error('Row does NOT exist');
        setIsValidQrId(false)
      } else {
        setIsValidQrId(true)
      }

    };



    validateQr();
  }, [qrId]);

  if (window.location.href == "http://localhost:3000/" || window.location.href == "https://e-malkhana-smoky.vercel.app/") {
    return (
      <div className='h-100 flex items-center justify-center'>
        <div className='flex items-center justify-center flex-col p-8 rounded-lg bg-white shadow-lg gap-3'>
          <p className='text-red-700 text-2xl font-bold text-center'>You dont have any valid QR ID</p>
          <p className='text-base text-center'>You can still continue to the app</p>
          <div className='flex items-center justify-center gap-3 mt-5 max-sm:flex-col w-full'>
            <button className='bg-blue-500 text-white px-3 py-1 hover:bg-blue-700 rounded-sm flex gap-1 items-center justify-center transition-all text-center max-sm:w-[80%] max-sm:gap-3'>
              <Link href="/search-property">Search</Link>
              <Search strokeWidth={1} />
            </button>

            <button className='bg-blue-500 text-white px-3 py-1 hover:bg-blue-700 rounded-sm flex gap-1 items-center justify-center transition-all text-center max-sm:w-[80%] max-sm:gap-3'>
              <Link href="/admin">Admin</Link>
              <User strokeWidth={1} />
            </button>
          </div>

        </div>
      </div>
    )
  } else {

    return (
      <Suspense fallback={<div>Loading...</div>}>
        {isValidQrId === false ? (
          <div className="flex justify-center items-center h-120 px-4">
            <div className="w-full max-w-md px-6 py-6 bg-white text-red-800 rounded-xl shadow-md text-center flex flex-col items-center gap-5">
              <h2 className="text-xl sm:text-2xl font-bold">QR ID Missing or Invalid</h2>
              <p className="text-sm sm:text-base font-medium text-black">
                No valid QR ID was found in the URL. Please scan a valid QR code or check the link.
              </p>
              <button
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-black border border-blue-500 rounded-lg gap-3 hover:bg-blue-100 transition"
                onClick={() => window.location.reload()}
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm font-medium">Scan again</span>
              </button>
            </div>
          </div>
        ) : isValidQrId === null ? (
          <div className="text-center text-gray-700 py-10">Validating QR ID...</div>
        ) : (
          <div className="flex flex-col items-center justify-start max-h-screen w-full overflow-x-hidden scrollbar-hidden">
            {/* Header with Logo and Title */}
            <div className="px-3 py-1 flex w-full justify-around shadow-md">
              <div className="w-[20%] bg-blue-500 flex flex-col items-center rounded-l-lg justify-evenly max-xl:hidden">
                <Image
                  src="/CG_POLICE_LOGO.png"
                  alt="Chhattisgarh Police Logo"
                  width={216}
                  height={336}
                  className="rounded-md object-contain"
                />
                <p className="text-3xl font-bold text-white text-center">Chhattisgarh Police</p>
                <p className="text-white text-lg w-[70%] text-center font-semibold max-xl:text-sm">
                  E Malkhana Management System
                </p>
              </div>

              {/* Main Property Form */}
              <PropertyForm />
            </div>

            <Toaster />
          </div>
        )}
      </Suspense>
    );
  }
}