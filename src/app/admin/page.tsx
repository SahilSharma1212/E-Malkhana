'use client';
import { v4 as uuidv4 } from 'uuid';
import React, { useState } from 'react';
import Image from 'next/image';
import supabase from '@/supabaseConfig/supabaseConnect';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Loader2 } from 'lucide-react';

export default function Page() {


  const [qrLoading, setQRLoading] = useState(false)
  const handleQRGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setQRLoading(true)

    const entries = Array.from({ length: 10 }, () => ({
      qr_id: `https://e-malkhana-smoky.vercel.app/?qrId=${uuidv4()}`,
    }))

    const { data, error } = await supabase
      .from("property_table")
      .insert(entries)

    if (error) {
      console.error('Insert failed:', error.message)
    } else {
      toast.success("New QRs have been generated nd pushed to database")
      console.log('Inserted:', data)
    }

    setQRLoading(false)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      {/* Admin Profile Section */}
      <div className="w-full bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row items-start gap-6">
        {/* Admin Image */}
        <div className="relative w-28 h-28 md:w-32 md:h-32">
          <Image
            src="/e-malkhana.png"
            alt="Admin Avatar"
            fill
            className="rounded-xl object-cover border p-3 border-gray-500"
          />
        </div>

        {/* Admin Info Grid */}
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700">
          <div>
            <p className="font-semibold text-gray-900">Name</p>
            <p>Admin Name</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Email</p>
            <p>admin@example.com</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Role</p>
            <p>Super Admin</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Status</p>
            <p>Active</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Joined</p>
            <p>Jan 2024</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Last Login</p>
            <p>July 30, 2025</p>
          </div>
        </div>
      </div>

      {/* Forms Row */}
      <div className="w-full flex flex-col md:flex-row gap-6">
        {/* Create New User */}
        <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>
          <form className="space-y-3">
            <input
              type="text"
              placeholder="Username"
              className="w-full px-4 py-2 border rounded-md border-gray-300"
            />
            <input
              type="email"
              placeholder="Email"
              className="w-full px-4 py-2 border rounded-md border-gray-300"
            />
            <select className="w-full px-4 py-2 border rounded-md border-gray-300">
              <option value="user">User</option>
              <option value="Thana Admin">Thana Admin</option>
              <option value="admin">Admin</option>
            </select>
            <button className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600">
              Create User
            </button>
          </form>
        </div>

        {/* Change User Access */}
        <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
          <h2 className="text-lg font-semibold text-gray-800">Change User Access</h2>
          <form className="space-y-3">
            <input
              type="email"
              placeholder="User Email"
              className="w-full px-4 py-2 border rounded-md border-gray-300"
            />
            <select className="w-full px-4 py-2 border rounded-md border-gray-300">
              <option value="user">User</option>
              <option value="Thana Admin">Thana Admin</option>
              <option value="admin">Admin</option>
            </select>
            <button className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600">
              Update Access
            </button>
          </form>
        </div>

        {/* Generate QR IDs */}
        <div className="flex-1 w-full bg-white shadow-md rounded-xl p-6 space-y-4 flex-col items-center">
          <h2 className="text-xl font-semibold text-gray-800">Generate QR IDs</h2>
          {qrLoading ? <Loader2 className='text-xl animate-spin text-gray-700'/> : <form className="space-y-4" onSubmit={handleQRGeneration}>
            <div className="flex flex-col">
              <label htmlFor="thana" className="text-sm text-gray-600 mb-1">
                Select Police Thana
              </label>
              <select
                id="thana"
                className="w-full px-4 py-2 border rounded-md border-gray-300 focus:outline-none focus:ring-2 focus:ring-green-500"
                onChange={(e) => { console.log(e.target.value) }}
                defaultValue={"Police Thana 1"}
              >
                <option>Police Thana 1</option>
                <option>Police Thana 2</option>
                <option>Police Thana 3</option>
                <option>Police Thana 4</option>
              </select>
            </div>

            <button
              type="submit"
              className="w-full bg-green-600 text-white py-2 rounded-md font-medium hover:bg-green-700 transition duration-200"
            >
              Generate QR IDs
            </button>
          </form>}

        </div>

      </div>
      <Toaster />
    </div>
  );
}
