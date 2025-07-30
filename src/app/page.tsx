'use client';

import PropertyForm from '@/components/PropertyForm';
import { QrCode, X } from 'lucide-react';
import Image from 'next/image';
import { useSearchParams, useRouter } from 'next/navigation';
import React, { Suspense, useEffect, useRef, useState } from 'react';
import { Toaster } from 'react-hot-toast';
import { Html5Qrcode } from 'html5-qrcode';

export default function Page() {
  const searchParams = useSearchParams();
  const qrId = searchParams.get('qrId');
  const router = useRouter();
  const [scanning, setScanning] = useState(false);
  const scannerRef = useRef<HTMLDivElement>(null);
  const qrCodeScannerRef = useRef<Html5Qrcode | null>(null);

  const startScan = async () => {
    setScanning(true);
    const html5QrCode = new Html5Qrcode('qr-reader');
    qrCodeScannerRef.current = html5QrCode;

    try {
      const devices = await Html5Qrcode.getCameras();
      if (devices.length === 0) throw new Error('No camera found');

      const config = { fps: 10, qrbox: 250 };

      await html5QrCode.start(
        { facingMode: 'environment' }, // rear camera
        config,
        (decodedText) => {
          html5QrCode.stop().then(() => {
            setScanning(false);
            router.push(`/property?qrId=${decodedText}`);
          });
        },
        (error) => {
          // handle decode failure (optional)
        }
      );
    } catch (err) {
      console.error('QR scan error:', err);
      setScanning(false);
    }
  };

  const stopScan = async () => {
    if (qrCodeScannerRef.current) {
      await qrCodeScannerRef.current.stop();
      qrCodeScannerRef.current.clear();
      qrCodeScannerRef.current = null;
    }
    setScanning(false);
  };

  useEffect(() => {
    if (scanning) {
      startScan();
    }
    // Clean up on unmount
    return () => {
      stopScan();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [scanning]);

  return (
    <Suspense fallback={<div>Loading...</div>}>
      {qrId === null || qrId.trim() === '' ? (
        <div className="flex justify-center items-center h-120 px-4">
          <div className="w-full max-w-md px-6 py-6 bg-white text-red-800 rounded-xl shadow-md text-center flex flex-col items-center gap-5">
            <h2 className="text-xl sm:text-2xl font-bold">QR ID Missing</h2>
            <p className="text-sm sm:text-base font-medium text-black">
              No QR ID was found in the URL. Please scan a valid QR code or check the link.
            </p>

            {!scanning && (
              <button
                onClick={() => setScanning(true)}
                className="inline-flex items-center px-4 py-2 bg-blue-50 text-black border border-blue-500 rounded-lg gap-3 hover:bg-blue-100 transition"
              >
                <QrCode className="w-5 h-5" />
                <span className="text-sm font-medium">Scan again</span>
              </button>
            )}

            {scanning && (
              <>
                <div className="mt-4 w-full">
                  <div ref={scannerRef} id="qr-reader" className="w-full h-64 border" />
                </div>
                <button
                  onClick={stopScan}
                  className="mt-4 inline-flex items-center px-3 py-1.5 text-sm bg-red-50 border border-red-500 text-red-700 rounded-md hover:bg-red-100"
                >
                  <X className="w-4 h-4 mr-2" />
                  Cancel Scan
                </button>
              </>
            )}
          </div>
        </div>
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
