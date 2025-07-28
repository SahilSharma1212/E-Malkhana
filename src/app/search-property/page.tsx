"use client";
import { Search, X } from 'lucide-react';
import React, { useState } from 'react';

export default function Page() {
  const [searchCategory, setSearchCategory] = useState("property");
  const [searchValue, setSearchValue] = useState("");

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim() === "") return alert("Please enter a value to search.");
    console.log("🔍 Searching:", { searchCategory, searchValue });
    // TODO: Add API/filter logic here
  };

  return (
    <div className='flex items-center justify-center h-screen w-screen bg-blue-100'>
      <div className='bg-white h-[95%] w-[95%] rounded-md p-2 flex flex-col gap-3 '>

        {/* Search Bar */}
        <form
          className='bg-blue-500 h-12 rounded-sm px-4 py-1 flex items-center justify-start gap-5 max-md:flex-wrap'
          onSubmit={handleSearch}
        >

          <div className='flex gap-2'>

          {/* Search Category */}
          <div className='flex items-center gap-2 '>
            <label htmlFor="searchCategory" className='text-white font-semibold'>Search By</label>
            <select
              name='searchCategory'
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none'
            >
              <option value="property">Property</option>
              <option value="fir">FIR</option>
            </select>
          </div>

          {/* Search Input */}
          <div className='flex items-center gap-2'>
            <label htmlFor="searchValue" className='text-white font-semibold'>Search Value</label>
            <input
              type="text"
              name='searchValue'
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none'
              placeholder='Enter...'
            />
          </div>

          </div>

<div className='flex gap-2'>


          {/* Search Button */}
          <button
            type='submit'
            className='bg-white py-1 rounded-sm px-4 outline-none flex justify-center items-center gap-3 hover:bg-blue-100 max-md:px-2'
          >
            <p className='max-lg:hidden'>Search</p>
            <Search className='text-blue-300' />
          </button>

          {/* Back Button (Optional logic) */}
          <button
            type='button'
            className='bg-white py-1 rounded-sm px-4 outline-none flex justify-center items-center gap-3 hover:bg-red-100 max-md:px-2'
            onClick={() => {
              setSearchValue("");
              console.log("🔙 Back pressed");
            }}
          >
            <p className='max-lg:hidden'>Back</p>
            <X className='text-red-300' />
          </button>
</div>

        </form>

        {/* Table Section */}
        <div className='overflow-auto'>
          <table className='min-w-full border border-gray-300 text-sm text-left rounded-md'>
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
              {/* Add more rows dynamically */}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
