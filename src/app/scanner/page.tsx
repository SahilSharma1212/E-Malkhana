'use client';

import React, { useRef, useEffect, useState } from 'react';
import QrScanner from 'qr-scanner';
import { Check, Loader2, Upload } from 'lucide-react';

QrScanner.WORKER_PATH = '/qr-scanner-worker.min.js';

export default function QRScanner() {
    const videoRef = useRef<HTMLVideoElement>(null);
    const [scanner, setScanner] = useState<QrScanner | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    useEffect(() => {
        if (videoRef.current) {
            const qrScanner = new QrScanner(
                videoRef.current,
                (r) => {
                    setResult(r.data);
                },
                {
                    highlightScanRegion: true,
                    returnDetailedScanResult: true,
                }
            );
            qrScanner.start();
            setScanner(qrScanner);

            return () => {
                qrScanner.stop();
            };
        }
    }, []);

    const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const result = await QrScanner.scanImage(file, { returnDetailedScanResult: true }).catch(() => null);
        if (result) setResult(result.data);
        else setResult('No QR code found.');
    };

    return (
        <div className="min-h-screen bg-gray-100 flex flex-col items-center justify-center p-4 max-sm:scale-90">
            <h1 className={`${result?"hidden":"text-2xl font-bold mb-2 text-center"}`}>QR Code Scanner</h1>

            <div className="bg-white shadow-lg rounded-xl p-4 w-full max-w-lg space-y-4">
                <video
                    ref={videoRef}
                    className={`w-full rounded-lg h-[500px] bg-black ${result?"hidden":"visible"}`}
                    muted
                    playsInline
                />

                <div className={`flex gap-3 ${result?"hidden":"visible"}`}>
                    <button
                        onClick={() => scanner?.start()}
                        className="flex-1 bg-blue-500 text-white py-2 px-4 rounded hover:bg-blue-700"
                    >
                        Start Camera
                    </button>
                    <button
                        onClick={() => scanner?.stop()}
                        className="flex-1 bg-red-600 text-white py-2 px-4 rounded hover:bg-red-700"
                    >
                        Stop Camera
                    </button>
                </div>

                <div className="flex w-full justify-between">
                    

                    <div className={` ${result?"hidden w-full":"visible w-[30%]"}`}>
                        <button
                            onClick={() => fileInputRef.current?.click()}
                            className="w-full bg-gray-50 text-black py-2 px-4 rounded hover:bg-gray-200 border-dashed border border-black"
                        >
                            
                            <div className=" px-2.5 flex justify-center"><Upload /></div>
                        </button>
                        <input
                            type="file"
                            ref={fileInputRef}
                            accept="image/*"
                            onChange={handleUpload}
                            className="hidden"
                        />
                    </div>

                    <div className={`${result?"w-full p-3":"w-[60%]"}`}>
                        <div className={`bg-gray-300 rounded text-gray-800 text-sm break-all flex flex-col items-center justify-center text-center ${result && "p-3"}`}>
                            {result ? (
                                <div className={`${result?"w-full flex flex-col justify-center items-center gap-3 text-lg font-medium text-green-500":""}`}>
                                <div className='flex justify-center items-center flex-col gap-4k'>
                                    <div className='text-2xl font-bold'>Qr Found</div> 
                                    
                                    <p className='p-1 border-3 border-green-500 rounded-full'><Check/></p>
                                    
                                    </div>
                                    
                                    {result.startsWith('http') && (
                                        <a
                                            href={result}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            className=" inline-block bg-blue-600 text-white py-2 px-3 rounded hover:bg-blue-700 w-full mt-2"
                                        >
                                            Open Link
                                        </a>
                                    )}
                                </div>
                            ) : (
                                <div className='flex justify-center items-center gap-3 py-2 text-base font-medium '>Scanning <Loader2 className="animate-spin ml-2" /></div>
                            )}
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
