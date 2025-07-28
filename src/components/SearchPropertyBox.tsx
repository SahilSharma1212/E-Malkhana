"use client";
import { Search } from 'lucide-react';
import React, { useState } from 'react';

export default function SearchPropertyBox() {
  const [searchTerm, setSearchTerm] = useState("");

  const searchPropertyFunction = (e: React.FormEvent) => {
    e.preventDefault(); 
    if (searchTerm.trim() === "") return alert("Please enter a search term.");
    console.log("🔍 Searching for:", searchTerm);
    // TODO: Add your search logic here (e.g. filter from DB, API call)
  };

  return (
    <div className='h-full w-full bg-white rounded-md p-2 flex flex-col'>
      {/* Search bar parent */}
      <div className='w-full h-12 bg-blue-500 rounded-md flex items-center justify-between px-3 mb-4'>

        {/* Left buttons */}
        <div className='flex items-center gap-2 max-lg:hidden'>
          <button className='bg-white text-blue-700 border border-blue-500 rounded-sm px-3 py-1 font-semibold'>Edit</button>
          <button className='bg-red-500 text-white rounded-sm px-3 py-1'>Close</button>
        </div>

        {/* Center search box */}
        <form
          className='flex items-center gap-2 bg-white pr-2 rounded-sm'
          onSubmit={searchPropertyFunction}
        >
          <p className='text-blue-700 font-semibold px-2 max-lg:hidden'>Search FIR or Property</p>
          <p className='text-blue-700 font-semibold px-2 lg:hidden max-sm:hidden'>FIR / Property</p>
          <input
            type="text"
            className='bg-white text-black px-3 py-1 rounded-sm max-md:w-32 outline-none'
            placeholder='Enter search term...'
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <button
            className='decoration-none text-gray-500 h-full hover:bg-gray-300 px-2 py-1 rounded-sm'
            type='submit'
          >
            <Search size={20} />
          </button>
        </form>

        {/* Right buttons */}
        <div className='flex items-center gap-2'>
          <button className='bg-white text-blue-700 border border-blue-500 rounded-sm px-3 py-1 font-semibold'>Latest Update</button>
          <button className='bg-red-500 text-white rounded-sm px-3 py-1'>List Data</button>
        </div>
      </div>

      {/* Table Section */}
      <div className='overflow-auto'>
        <table className='min-w-full border border-gray-300 text-sm text-left'>
          <thead className='bg-gray-100 text-gray-700 font-semibold'>
            <tr>
              <th className='px-3 py-2 border'>S.No</th>
              <th className='px-3 py-2 border'>Property Number</th>
              <th className='px-3 py-2 border'>FIR Number</th>
              <th className='px-3 py-2 border'>Under Section</th>
              <th className='px-3 py-2 border'>Property Tags</th>
              <th className='px-3 py-2 border'>Date of Seizure</th>
              <th className='px-3 py-2 border'>Name of IO</th>
              <th className='px-3 py-2 border'>Status of Property</th>
              <th className='px-3 py-2 border'>Submitted By</th>
              <th className='px-3 py-2 border'>Submitted On</th>
              <th className='px-3 py-2 border'>Status Date</th>
            </tr>
          </thead>
          <tbody>
            {/* You can map rows from props/data */}
            <tr className='hover:bg-gray-50'>
              <td className='px-3 py-2 border'>1</td>
              <td className='px-3 py-2 border'>PN-123</td>
              <td className='px-3 py-2 border'>FIR-456</td>
              <td className='px-3 py-2 border'>IPC 420</td>
              <td className='px-3 py-2 border'>Jewelry, Electronics</td>
              <td className='px-3 py-2 border'>2024-05-01</td>
              <td className='px-3 py-2 border'>Inspector R.K.</td>
              <td className='px-3 py-2 border'>Seized</td>
              <td className='px-3 py-2 border'>SHO Central</td>
              <td className='px-3 py-2 border'>2024-05-02</td>
              <td className='px-3 py-2 border'>2024-05-10</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}
