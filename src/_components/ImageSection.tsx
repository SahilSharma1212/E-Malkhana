"use client";
import Image from 'next/image';
import React, { useRef } from 'react';

export default function ImageSection() {
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleButtonClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      // You can add preview or upload logic here
    }
  };

  return (
    // This is the div for uploading the image feature 
    <div className='flex items-center justify-evenly flex-col h-full bg-gray-400 w-[25%] rounded-r-lg p-4'>
      <Image height={84} width={54} src={'/e-malkhana.png'} alt='E-Malkhana Image' />
      
      <p className='text-gray-700 font-semibold mt-4'>Upload Image</p>

      {/* Hidden input */}
      <input
        type="file"
        accept="image/*"
        ref={fileInputRef}
        onChange={handleFileChange}
        className="hidden"
      />

      {/* Custom button */}
      <button
        onClick={handleButtonClick}
        className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
      >
        Choose Image
      </button>
    </div>
  );
}
