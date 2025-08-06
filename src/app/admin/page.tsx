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

const QRCodePDF = ({ qrCodes, heading, thana }: { qrCodes: string[], heading: string[], thana: string }) => {
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
  const [newThanaName, setNewThanaName] = useState("")
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

  const [isSubmitingThanaNameChange, setIsSubmittingThanaNameChange] = useState(false)

  const [isSubmittingNewThana, setIsSubmittingNewThana] = useState(false)

  const [newThanaCreateObj, setNewThanaCreateObj] = useState({
    name: "",
    district: "",
    pincode: "",
  })

  const [ispropertyDetailsFetched, setIsPropertyDetailsFetched] = useState(true);

  const [newCredentialValueStyle, setNewCredentialValueStyle] = useState("")
  const [existingCredentialValue, setExistingCredentialValue] = useState("");
  const [newCredentialValue, setNewCredentialValue] = useState("")
  const [isCredentialsUpdating, setIsCredentialUpdating] = useState(false);

  useEffect(() => {
    const handleViewData = async () => {
      if (!user.thana) return;

      try {
        const response = await axios.get(`/api/fetch-property-data-admin`, {
          params: { thana: user.thana },
        });

        if (response.data.success) {
          setPropertyDetails(response.data.data);
        } else {
          toast.error(response.data.message);
          setIsPropertyDetailsFetched(false);
        }
      } catch (err) {
        console.error('Unexpected error:', err);
        toast.error("An unexpected error occurred.");
        setIsPropertyDetailsFetched(false);
      }
    };

    handleViewData();
  }, [user.thana]);


  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', { withCredentials: true });
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

          // Admin-only: fetch thanas
          if (User.role === 'admin' || User.role === 'super admin') {
            try {
              const thanaRes = await axios.get('/api/fetch-thana-admin');
              if (thanaRes.data.success) {
                setAvailableThanas(thanaRes.data.thanas);
              } else {
                toast.error(thanaRes.data.message);
              }
            } catch (thanaErr) {
              console.error('Fetch thanas failed:', thanaErr);
              toast.error("Failed to fetch thanas.");
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
      const response = await axios.post('/api/add-rack', {
        rackInput,
        policeStation,
        userName: user.name,
      });

      toast.success(response.data.message || 'Rack added successfully.');
      setRackInput('');
      setSelectedThana('');
    } catch (error) {
      console.error('Rack add error:', error);
      toast.error('Failed to add rack.');
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
      const response = await axios.post('/api/add-box', {
        boxInput,
        policeStation,
        userName: user.name,
      });

      toast.success(response.data.message || 'Box added successfully.');
      setBoxInput('');
      setSelectedThana('');
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
      const blob = await pdf(<QRCodePDF qrCodes={qrCodes} heading={ids} thana={user.thana} />).toBlob();
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
      const response = await axios.post('/api/create-user', {
        newusername,
        newuserEmail,
        newuserRole,
        newuserPhone,
        newuserThana,
        updatedBy: user.name,
      });

      toast.success(response.data.message || 'User created successfully.');

      setNewUserGeneration({
        newusername: '',
        newuserRole: 'viewer',
        newuserEmail: '',
        newuserPhone: '',
        newuserThana: user.thana || '',
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong.');
    }
  };


  const handleThanaNameChange = async () => {
    setIsSubmittingThanaNameChange(true)

    if (selectedThana == "" || newThanaName == "") {
      toast.error("Please fill all the fields");
      setIsSubmittingThanaNameChange(false)
      return;
    }

    try {
      const res = await fetch("/api/update-thana-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedThana,
          newThanaName,
          userName: user.name,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Update failed");
      } else {
        toast.success("Thana name updated successfully");
        window.location.reload();
      }

    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred");
    }

    setIsSubmittingThanaNameChange(false);

  }

  const handleNewThanaCreation = async () => {

    setIsSubmittingNewThana(true)

    if (newThanaCreateObj.name.trim() == "" || newThanaCreateObj.district.trim() == "" || newThanaCreateObj.pincode.trim() == "") {
      toast.error("Fill all the fields")
      setIsSubmittingNewThana(false);


      return;
    }

    const { error } = await supabase.from("thana_rack_box_table").insert(
      {
        thana: newThanaCreateObj.name.toLowerCase(),
        racks: [],
        boxes: [],
        thana_name_updated_by: user.name,
        thana_created_by: user.name,
        district: newThanaCreateObj.district.toLowerCase(),
        pin_code: newThanaCreateObj.pincode.toLowerCase().trim(),
      }
    )

    if (error) {
      console.error(error)
      toast.error("Unable to create Thana")
      setIsSubmittingNewThana(false);
      return;
    }

    toast.success("Thana created successfully")
    setIsSubmittingNewThana(false);
    setNewThanaCreateObj({
      name: "",
      pincode: "",
      district: ""
    })
  }
  type APIResponse = {
    success: boolean;
    message: string;
  };

  const handleNewCredentialChange = async () => {
    setIsCredentialUpdating(true);

    if (
      newCredentialValue.trim() === "" ||
      newCredentialValueStyle.trim() === "" ||
      existingCredentialValue.trim() === ""
    ) {
      toast.error("Please fill all the fields");
      setIsCredentialUpdating(false);
      return;
    }

    try {
      const response = await axios.post<APIResponse>("/api/update-credential", {
        existingCredentialValue,
        newCredentialValue,
        newCredentialValueStyle,
        updatedBy: user.name,
      });

      const { success, message } = response.data;

      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as APIResponse;
        toast.error(data?.message || "Server error occurred");
      } else {
        toast.error("Unexpected error occurred");
      }
    } finally {
      setIsCredentialUpdating(false);
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

        {ispropertyDetailsFetched ? "" : <p className='flex items-center justify-center text-center pb-5 text-red-700'>( Try refreshing or logging in again ! )</p>}
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
                        .update({ role: accessUpdate.newRole, updated_by: user.name, updated_at: new Date().toISOString() })
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
                className="w-full bg-blue-500 text-white py-2 rounded-md hover:bg-blue-700 transition-all"
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



      {user.role === 'super admin' && (
        <>
          <p className="text-center px-5 text-2xl font-semibold text-gray-600">Super Admin Access</p>

          <div className="flex gap-6 items-start justify-start p-4 max-lg:flex-wrap min-h-100 max-sm:flex-col">

            {/* Section 1: Change Thana Name */}
            <div className="bg-white p-6 rounded-xl w-full max-lg:w-[48%] max-w-md shadow h-full max-sm:w-full">
              <p className="text-lg font-semibold mb-4 text-center">Change Thana name</p>
              <label className="block mb-1">Select Thana to change</label>

              <select
                className="w-full px-4 py-2 border rounded-md border-gray-300 mb-3"
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
              <label className='block mb-1'>Enter new name</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mb-3" placeholder="Enter Thana Name"
                onChange={(e) => setNewThanaName(e.target.value)}
              />
              <button
                disabled={isSubmitingThanaNameChange}
                className="bg-blue-500 text-white w-full py-2 rounded hover:bg-blue-700 flex justify-center items-center"
                onClick={handleThanaNameChange}
              >{isSubmitingThanaNameChange ? <Loader2 className='animate-spin' /> : "Update"}</button>

            </div>

            {/* Section 2: Create New Thana */}
            <div className="bg-white p-6 rounded-xl w-full max-w-md max-lg:w-[48%] shadow max-sm:w-full">
              <p className="text-lg font-semibold mb-4 text-center">Create New Thana with Details</p>
              <label className="block mb-1">Thana Name</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mb-3"
                value={newThanaCreateObj.name}
                placeholder="Name"
                onChange={(e) => {
                  setNewThanaCreateObj({
                    ...newThanaCreateObj,
                    name: e.target.value
                  });
                }}
              />

              <label className="block mb-1">District</label>
              <input
                type="text"
                className="w-full border px-3 py-2 rounded mb-3"
                value={newThanaCreateObj.district}
                placeholder="District"
                onChange={(e) => {
                  setNewThanaCreateObj({
                    ...newThanaCreateObj,
                    district: e.target.value
                  });
                }}
              />
              <label className="block mb-1">PIN Code</label>
              <input type="text"
                className="w-full border px-3 py-2 rounded mb-3"
                value={newThanaCreateObj.pincode}
                placeholder="PIN Code"
                onChange={(e) => {
                  setNewThanaCreateObj({
                    ...newThanaCreateObj,
                    pincode: e.target.value
                  });
                }}
              />

              <button
                disabled={isSubmittingNewThana}
                className="bg-green-500 text-white w-full py-2 rounded hover:bg-green-700 flex items-center justify-center"
                onClick={handleNewThanaCreation}
              >{isSubmittingNewThana ? <Loader2 className='animate-spin' /> : "Create Thana"}</button>
            </div>

            {/* Section 3: Change User Info */}
            <div className="bg-white p-6 rounded-xl w-full max-w-md shadow max-sm:w-full max-lg:w-[48%]">
              <p className="text-lg font-semibold mb-4 text-center">Change User Contact Info</p>
              <label className="block mb-1">Choose credentials to update</label>
              <select
                className="w-full border px-3 py-2 rounded mb-3"
                onChange={(e) => setNewCredentialValueStyle(e.target.value)}
              >
                <option value="">Select</option>
                <option value="email_id">Email Id</option>
                <option value="phone">Phone</option>
              </select>
              <label className="block mb-1">Existing Value</label>
              <input
                type="tel"
                className="w-full border px-3 py-2 rounded mb-3"
                placeholder="Value"
                value={existingCredentialValue}
                onChange={(e) => setExistingCredentialValue(e.target.value)}
              />


              <label className="block mb-1">Enter new value</label>
              <input
                type="tel"
                className="w-full border px-3 py-2 rounded mb-3"
                placeholder="Value"
                value={newCredentialValue}
                onChange={(e) => setNewCredentialValue(e.target.value)}
              />
              <button
                disabled={isCredentialsUpdating}
                className="bg-yellow-600 text-white w-full py-2 rounded hover:bg-yellow-700 flex items-center justify-center"
                onClick={handleNewCredentialChange}
              >{isCredentialsUpdating ? <Loader2 className='animate-spin' /> : "Update Info"}</button>
            </div>

          </div>
        </>
      )}

    </div>
  );
}