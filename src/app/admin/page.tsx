'use client';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import supabase from '@/config/supabaseConnect';
import toast, { Toaster } from 'react-hot-toast';
import { Ban, Loader2, Logs } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { Document, Page as PDFPage, StyleSheet, View, Image as PDFImage, pdf, Text } from '@react-pdf/renderer';

const styles = StyleSheet.create({
  page: {
    padding: 40,
  },
  qrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  qrCell: {
    width: "45%",
    height: 180,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 130,
    height: 130,
  },
  heading: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
});

const getQRImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=150x150`;

const QRCodePDF = ({ qrCodes, heading, thana }: { qrCodes: string[], heading: string[], thana:string }) => {
  const pages = [];
  for (let i = 0; i < qrCodes.length; i += 6) {
    const chunk = qrCodes.slice(i, i + 6);
    pages.push(
      <PDFPage key={i} size="A4" style={styles.page}>
        <Text style={styles.heading}>QR ID: ({heading[i]} to {heading[i + 6]}) , Thana:{thana}</Text>

        <View style={styles.qrGrid}>
          {chunk.map((qr, idx) => (
            <View key={idx} style={styles.qrCell}>
              <PDFImage src={getQRImageUrl(qr)} style={styles.qrImage} />
            </View>
          ))}
        </View>
      </PDFPage>
    );
  }

  return <Document>{pages}</Document>;
};

export default function Page() {
  const [qrLoading, setQRLoading] = useState(false);
  const [user, setUser] = useState({
    email: '',
    name: '',
    role: '',
    thana: '',
    created_at: '',
    phone: '',
  });
  const [accessUpdate, setAccessUpdate] = useState({
    identifier: '',
    newRole: '',
  });
  const [newUserGeneration, setNewUserGeneration] = useState({
    newusername: '',
    newuserRole: 'viewer',
    newuserEmail: '',
    newuserPhone: '',
    newuserThana: '',
  });
  const [selectedThana, setSelectedThana] = useState('');
  const [availableThanas, setAvailableThanas] = useState<string[]>([]);
  const [rackInput, setRackInput] = useState('');
  const [boxInput, setBoxInput] = useState('');
  const [propertyDetails, setPropertyDetails] = useState<
    {
      property_id: string;
      name_of_io: string;
      created_at: string;
      date_of_seizure: string;
      category_of_offence: string;
      type_of_seizure: string;
      fir_number: string;
      place_of_seizure: string;
      rack_number: string;
      box_number: string;
      serial_number_from_register: string;
    }[]
  >([]);

  useEffect(() => {
    const handleViewData = async () => {
      if (!user.thana) return;

      try {
        const { data, error } = await supabase
          .from('property_table')
          .select('property_id, name_of_io, created_at, date_of_seizure, category_of_offence, type_of_seizure, fir_number, place_of_seizure, rack_number, box_number, serial_number_from_register')
          .eq('police_station', user.thana)
          .neq('property_id', '');

        if (error) {
          console.error('Error fetching property data:', error.message);
          toast.error('Failed to fetch property items.');
          return;
        }

        if (!data || data.length === 0) {
          toast.error('No property items found.');
          return;
        }

        setPropertyDetails(data);
      } catch (err) {
        console.error('Unexpected error:', err);
        toast.error('An unexpected error occurred.');
      }
    };

    handleViewData();
  }, [user.thana]);

  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });

        const userData = res.data.user;
        if (userData) {
          const User = {
            email: userData.email || '',
            name: userData.name || '',
            role: userData.role || '',
            thana: userData.thana || '',
            created_at: userData.created_at || '',
            phone: userData.phone || '',
          };

          setUser(User);
          setNewUserGeneration((prev) => ({
            ...prev,
            newuserThana: User.thana || '',
          }));

          if (User.role === 'admin' || User.role === 'super admin') {
            const { data, error } = await supabase
              .from('thana_rack_box_table')
              .select('thana');

            if (error) {
              console.error('Error fetching thanas:', error.message);
              toast.error('Failed to fetch thanas.');
            } else if (data) {
              const uniqueThanas = [...new Set(data.map((d) => d.thana))];
              setAvailableThanas(uniqueThanas);
            }
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        toast.error('Failed to authenticate user.');
      }
    }

    checkAuth();
  }, []);

  const handleRackGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!rackInput.trim() || !policeStation) {
      toast.error('Please fill the rack name and select thana.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('thana_rack_box_table')
        .select('racks')
        .eq('thana', policeStation)
        .single();

      if (error || !data) {
        console.error('Fetch rack error:', error?.message);
        toast.error('Thana not found.');
        return;
      }

      const normalizedInput = rackInput.trim().toLowerCase();
      const existingRacks = (data.racks || []).map((r: string) => r.trim().toLowerCase());

      if (existingRacks.includes(normalizedInput)) {
        toast.error('Rack already exists.');
        return;
      }

      const updatedRacks = [...(data.racks || []), rackInput.trim()];

      const { error: updateError } = await supabase
        .from('thana_rack_box_table')
        .update({ racks: updatedRacks })
        .eq('thana', policeStation);

      if (updateError) {
        console.error('Update rack error:', updateError.message);
        toast.error('Failed to update rack.');
      } else {
        toast.success('Rack added successfully.');
        setRackInput('');
        setSelectedThana('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleBoxGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!boxInput.trim() || !policeStation) {
      toast.error('Please fill the box name and select thana.');
      return;
    }

    try {
      const { data, error } = await supabase
        .from('thana_rack_box_table')
        .select('boxes')
        .eq('thana', policeStation)
        .single();

      if (error || !data) {
        console.error('Fetch box error:', error?.message);
        toast.error('Thana not found.');
        return;
      }

      const normalizedInput = boxInput.trim().toLowerCase();
      const existingBoxes = (data.boxes || []).map((b: string) => b.trim().toLowerCase());

      if (existingBoxes.includes(normalizedInput)) {
        toast.error('Box already exists.');
        return;
      }

      const updatedBoxes = [...(data.boxes || []), boxInput.trim()];

      const { error: updateError } = await supabase
        .from('thana_rack_box_table')
        .update({ boxes: updatedBoxes })
        .eq('thana', policeStation);

      if (updateError) {
        console.error('Update box error:', updateError.message);
        toast.error('Failed to update box.');
      } else {
        toast.success('Box added successfully.');
        setBoxInput('');
        setSelectedThana('');
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    }
  };

  const handleQRGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setQRLoading(true);

    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!policeStation) {
      toast.error('Please select a police station.');
      setQRLoading(false);
      return;
    }

    try {
      const entries = Array.from({ length: 90 }, () => ({
        qr_id: `https://e-malkhana-smoky.vercel.app/?qrId=${uuidv4()}`,
        police_station: policeStation,
        qr_generated_by: user.name,
      }));

      const { data, error } = await supabase.from('property_table').insert(entries).select("id");;

      if (error) {
        console.error('Insert failed:', error.message);
        toast.error('Failed to push QRs to database.');
        setQRLoading(false);
        return;
      }
      const ids: string[] = data.map((item) => String(item.id));

      toast.success('New QRs pushed to database.');

      const qrCodes = entries.map((entry) => entry.qr_id);
      const blob = await pdf(<QRCodePDF qrCodes={qrCodes} heading={ids} thana={user.thana}/>).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-codes.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSelectedThana('');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to generate QR codes.');
    } finally {
      setQRLoading(false);
    }
  };

  const handleUserGeneration = async (e: React.FormEvent) => {
    e.preventDefault();

    const { newusername, newuserEmail, newuserRole, newuserPhone, newuserThana } = newUserGeneration;

    if (!newusername || !newuserEmail || !newuserRole || !newuserPhone || !newuserThana) {
      toast.error('Please fill all fields.');
      return;
    }

    try {
      const { data: existingUsers, error: checkError } = await supabase
        .from('officer_table')
        .select('*')
        .or(`email_id.eq.${newuserEmail},phone.eq.${newuserPhone}`);

      if (checkError) {
        console.error('Error checking existing user:', checkError.message);
        toast.error('Something went wrong. Try again.');
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        toast.error('A user with this email or phone already exists.');
        return;
      }

      const { error } = await supabase.from('officer_table').insert([
        {
          officer_name: newusername,
          email_id: newuserEmail,
          phone: newuserPhone,
          role: newuserRole,
          thana: newuserThana,
        },
      ]);

      if (error) {
        console.error('User creation failed:', error.message);
        toast.error('Failed to create user.');
      } else {
        toast.success('User created successfully.');
        setNewUserGeneration({
          newusername: '',
          newuserRole: 'viewer',
          newuserEmail: '',
          newuserPhone: '',
          newuserThana: user.thana || '',
        });
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong.');
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6 space-y-8">
      <Toaster position="top-center" />

      {/* Admin Profile Section */}
      <div className="w-full bg-white shadow-md rounded-xl p-6 flex flex-col md:flex-row items-start gap-6">
        <div className="relative w-28 h-28 md:w-32 md:h-32">
          <Image
            src="/e-malkhana.png"
            alt="Admin Avatar"
            fill
            className="rounded-xl object-cover border p-3 border-gray-500"
          />
        </div>
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 max-sm:w-full">
          <div>
            <p className="font-semibold text-gray-900">Name</p>
            <p className="break-words">{user.name || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Email</p>
            <p className="break-words">{user.email || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Role</p>
            <p className="break-words">{user.role || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Status</p>
            <p>Active</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Joined</p>
            <p className="break-words">{user.created_at || 'N/A'}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Phone No.</p>
            <p>{user.phone || 'N/A'}</p>
          </div>
        </div>
      </div>

      {/* Table Section */}
      <div className="overflow-x-auto mt-6 bg-white shadow-md rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">
          Seized Property Items: {user.thana || 'N/A'}
        </h2>
        <table className="min-w-full border text-sm text-left text-gray-700">
          <thead className="bg-gray-100 text-xs uppercase text-gray-600">
            <tr>
              <th className="px-4 py-2">Property ID</th>
              <th className="px-4 py-2">Name of IO</th>
              <th className="px-4 py-2">Created At</th>
              <th className="px-4 py-2">Date of Seizure</th>
              <th className="px-4 py-2">Category</th>
              <th className="px-4 py-2">Type</th>
              <th className="px-4 py-2">FIR Number</th>
              <th className="px-4 py-2">Place</th>
              <th className="px-4 py-2">Rack</th>
              <th className="px-4 py-2">Box</th>
              <th className="px-4 py-2">Serial No.</th>
              <th className="px-4 py-2">Logs</th>
            </tr>
          </thead>
          <tbody>
            {propertyDetails.map((item, index) => (
              <tr
                key={index}
                className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}
              >
                <td className="px-4 py-2">{item.property_id}</td>
                <td className="px-4 py-2">{item.name_of_io}</td>
                <td className="px-4 py-2">{new Date(item.created_at).toLocaleDateString()}</td>
                <td className="px-4 py-2">{item.date_of_seizure}</td>
                <td className="px-4 py-2">{item.category_of_offence}</td>
                <td className="px-4 py-2">{item.type_of_seizure}</td>
                <td className="px-4 py-2">{item.fir_number}</td>
                <td className="px-4 py-2">{item.place_of_seizure}</td>
                <td className="px-4 py-2">{item.rack_number}</td>
                <td className="px-4 py-2">{item.box_number}</td>
                <td className="px-4 py-2">{item.serial_number_from_register}</td>
                <td className="px-4 py-2" title='View Logs'>
                  <Link
                    href={`/search-property/${item.property_id}`}
                    className="bg-white text-blue-500 p-1 rounded-sm hover:bg-blue-100 flex items-center gap-1 border border-blue-500"
                  >
                    <Logs className="text-blue-500" size={16} />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {['admin', 'thana admin', 'super admin'].includes(user.role) ? (
        <>
          {/* Forms Section */}
          <div className="w-full flex flex-col md:flex-row gap-6 flex-wrap">
            {/* Create New User */}
            <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>
              <form className="space-y-3" onSubmit={handleUserGeneration}>
                <input
                  type="text"
                  placeholder="Username"
                  value={newUserGeneration.newusername}
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  onChange={(e) =>
                    setNewUserGeneration({ ...newUserGeneration, newusername: e.target.value })
                  }
                />
                <input
                  type="email"
                  placeholder="Email"
                  value={newUserGeneration.newuserEmail}
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  onChange={(e) =>
                    setNewUserGeneration({ ...newUserGeneration, newuserEmail: e.target.value })
                  }
                />
                <input
                  type="text"
                  placeholder="Phone no."
                  value={newUserGeneration.newuserPhone}
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  onChange={(e) =>
                    setNewUserGeneration({ ...newUserGeneration, newuserPhone: e.target.value })
                  }
                />
                {user.role === 'admin' || user.role === 'super admin' ? (
                  <select
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    value={newUserGeneration.newuserThana}
                    onChange={(e) =>
                      setNewUserGeneration({ ...newUserGeneration, newuserThana: e.target.value })
                    }
                  >
                    <option value="">Select Police Station</option>
                    {availableThanas.map((thana) => (
                      <option key={thana} value={thana}>
                        {thana}
                      </option>
                    ))}
                  </select>
                ) : (
                  <div className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700">
                    {user.thana}
                  </div>
                )}
                <select
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  value={newUserGeneration.newuserRole}
                  onChange={(e) =>
                    setNewUserGeneration({ ...newUserGeneration, newuserRole: e.target.value })
                  }
                >
                  <option value="viewer">Viewer</option>
                  {(user.role === 'admin' || user.role === 'super admin') && (
                    <option value="thana admin">Thana Admin</option>
                  )}
                  {user.role === 'super admin' && (
                    <>
                      <option value="admin">Admin</option>
                      <option value="super admin">Super Admin</option>
                    </>
                  )}
                </select>
                <button
                  type="submit"
                  className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-all"
                >
                  Create User
                </button>
              </form>
            </div>

            {/* Change User Access */}
            {(user.role === 'admin' || user.role === 'super admin') ? (
              <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Change User Access</h2>
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();

                    if (!accessUpdate.identifier || !accessUpdate.newRole) {
                      toast.error('Please fill all fields.');
                      return;
                    }

                    if (
                      user.role === 'admin' &&
                      (accessUpdate.newRole === 'admin' || accessUpdate.newRole === 'super admin')
                    ) {
                      toast.error('You are not authorized to assign this role.');
                      return;
                    }

                    try {
                      const { data: existing, error: fetchError } = await supabase
                        .from('officer_table')
                        .select('*')
                        .or(`email_id.eq.${accessUpdate.identifier},phone.eq.${accessUpdate.identifier}`);

                      if (fetchError) {
                        console.error('Fetch error:', fetchError.message);
                        toast.error('Could not find user.');
                        return;
                      }

                      if (!existing || existing.length === 0) {
                        toast.error('No user found with that email or phone.');
                        return;
                      }

                      const userToUpdate = existing[0];

                      const { error: updateError } = await supabase
                        .from('officer_table')
                        .update({ role: accessUpdate.newRole })
                        .eq('id', userToUpdate.id);

                      if (updateError) {
                        console.error('Update error:', updateError.message);
                        toast.error('Role update failed.');
                      } else {
                        toast.success('User access updated.');
                        setAccessUpdate({ identifier: '', newRole: '' });
                      }
                    } catch (err) {
                      console.error('Unexpected error:', err);
                      toast.error('Something went wrong.');
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="User Email / Phone no."
                    value={accessUpdate.identifier}
                    onChange={(e) =>
                      setAccessUpdate({ ...accessUpdate, identifier: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                  />
                  <select
                    value={accessUpdate.newRole}
                    onChange={(e) =>
                      setAccessUpdate({ ...accessUpdate, newRole: e.target.value })
                    }
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                  >
                    <option value="">Select New Role</option>
                    <option value="viewer">Viewer</option>
                    {(user.role === 'admin' || user.role === 'super admin') && (
                      <option value="thana admin">Thana Admin</option>
                    )}
                    {user.role === 'super admin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  <button
                    type="submit"
                    className="w-full bg-yellow-500 text-white py-2 rounded-md hover:bg-yellow-600 transition-all"
                  >
                    Update Access
                  </button>
                </form>
              </div>
            ) : (
              <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4 flex flex-col items-center justify-center">
                <Ban size={100} className="text-gray-500" />
                <p className="text-center text-base">
                  Can&apos;t change access as a Thana Admin, but you can create a viewer.
                </p>
              </div>
            )}

            {/* Generate QR IDs */}
            <div className="flex-1 w-full bg-white shadow-md rounded-xl p-6 space-y-4 flex-col items-center">
              <h2 className="text-xl font-semibold text-gray-800">Generate QR IDs</h2>
              {qrLoading ? (
                <div className='flex items-center justify-center p-3'>
                  <div className='flex py-3 flex-col gap-3 justify-center items-center bg-red-50 rounded-md pt-2'>
                    <p className='text-base font-medium text-center'>Please wait while we process QR generation</p>
                    <Loader2 className="text-xl animate-spin text-gray-700" />
                  </div>
                </div>
              ) : (
                <form className="space-y-4" onSubmit={handleQRGeneration}>
                  <div className="flex flex-col">
                    <label htmlFor="thana" className="text-sm text-gray-600 mb-1">
                      Select Police Thana
                    </label>
                    {user.role === 'admin' || user.role === 'super admin' ? (
                      <select
                        value={selectedThana}
                        onChange={(e) => setSelectedThana(e.target.value)}
                        className="border border-gray-300 rounded p-2 w-full"
                      >
                        <option value="">Select Police Station</option>
                        {availableThanas.map((thana) => (
                          <option key={thana} value={thana}>
                            {thana}
                          </option>
                        ))}
                      </select>
                    ) : (
                      <div className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700">
                        {user.thana}
                      </div>
                    )}
                  </div>
                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 rounded-md font-medium hover:bg-green-700 transition-all duration-200"
                  >
                    Generate QR IDs
                  </button>
                </form>
              )}
            </div>
          </div>

          {/* Rack and Box Forms */}
          <div className="flex gap-6 max-sm:flex-col">
            <form onSubmit={handleRackGeneration} className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 text-center">Add a Rack</h2>
              {user.role === 'admin' || user.role === 'super admin' ? (
                <select
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  value={selectedThana}
                  onChange={(e) => setSelectedThana(e.target.value)}
                >
                  <option value="">Select Police Station</option>
                  {availableThanas.map((thana) => (
                    <option key={thana} value={thana}>
                      {thana}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700">
                  {user.thana}
                </div>
              )}
              <input
                type="text"
                placeholder="Rack Name"
                className="w-full px-4 py-2 border rounded-md border-gray-300"
                value={rackInput}
                onChange={(e) => setRackInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-all"
              >
                Add Rack
              </button>
            </form>

            <form onSubmit={handleBoxGeneration} className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
              <h2 className="text-lg font-semibold text-gray-800 text-center">Add a Box</h2>
              {user.role === 'admin' || user.role === 'super admin' ? (
                <select
                  className="w-full px-4 py-2 border rounded-md border-gray-300"
                  value={selectedThana}
                  onChange={(e) => setSelectedThana(e.target.value)}
                >
                  <option value="">Select Police Station</option>
                  {availableThanas.map((thana) => (
                    <option key={thana} value={thana}>
                      {thana}
                    </option>
                  ))}
                </select>
              ) : (
                <div className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700">
                  {user.thana}
                </div>
              )}
              <input
                type="text"
                placeholder="Box Name"
                className="w-full px-4 py-2 border rounded-md border-gray-300"
                value={boxInput}
                onChange={(e) => setBoxInput(e.target.value)}
              />
              <button
                type="submit"
                className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-all"
              >
                Add Box
              </button>
            </form>
          </div>
        </>
      ) : (
        <div className="py-10 flex flex-col items-center gap-4">
          <p className="text-red-700 font-semibold text-2xl text-center">
            Data manipulation features denied
          </p>
          <p className="text-center">
            We limit certain features only to admins. You can only see your details here.
          </p>
          <span className="px-3 py-1 rounded-sm bg-gray-300 text-center max-sm:scale-90">
            Your role: {user.role}
          </span>
        </div>
      )}
    </div>
  );
}