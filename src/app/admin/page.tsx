'use client';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import supabase from '@/config/supabaseConnect';
import toast from 'react-hot-toast';
import { Toaster } from 'react-hot-toast';
import { Ban, Loader2, Logs } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';



export default function Page() {

  const [qrLoading, setQRLoading] = useState(false)
  const [user, setUser] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
    created_at: "",
    phone: ""
  })
  const [accessUpdate, setAccessUpdate] = useState({
    identifier: "", // email or phone
    newRole: "",
  });

  const [newUserGeneration, setNewUserGeneration] = useState<{ newusername: string, newuserRole: string, newuserEmail: string, newuserPhone: string, newuserThana: string }>({
    newusername: "",
    newuserRole: "",
    newuserEmail: "",
    newuserPhone: "",
    newuserThana: "",
  })
  const [selectedThana, setSelectedThana] = useState("");
  const [availableThanas, setAvailableThanas] = useState<string[]>([]);
  const [rackInput, setRackInput] = useState("");
  const [boxInput, setBoxInput] = useState("");



  const [propertyDetails, setPropertyDetails] = useState<{
    property_id: string,
    name_of_io: string,
    created_at: string,
    date_of_seizure: string,
    category_of_offence: string,
    type_of_seizure: string,
    fir_number: string,
    place_of_seizure: string,
    rack_number: string,
    box_number: string,
    serial_number_from_register: string
  }[]>([])

  useEffect(() => {

    const handleViewData = async () => {
      console.log("Display clicked");
      if (!user || !user.thana) return; // ✅ Wait until thana is ready

      try {
        console.log("Current thana:", user.thana);

        const { data, error } = await supabase
          .from("property_table")
          .select("property_id,name_of_io,created_at,date_of_seizure,category_of_offence,type_of_seizure,fir_number,place_of_seizure,rack_number,box_number,serial_number_from_register")
          .eq("police_station", user.thana)
          .neq("property_id", "")

        console.log("Fetched Data:", data);
        console.log("Error:", error);

        if (!data || data.length === 0) {
          toast.error("No property items found.");
          return;
        }

        setPropertyDetails(data);
      } catch (err) {
        console.log("Unexpected Error:", err);
      }
    };

    handleViewData()
  }, [user])


  const handleRackGeneration = async (e: React.FormEvent) => {
    e.preventDefault();

    const policeStation = user.role === "thana admin" ? user.thana : selectedThana;

    if (!rackInput.trim() || !policeStation) {
      toast.error("Please fill the rack name and select thana.");
      return;
    }

    const { data, error } = await supabase
      .from("thana_rack_box_table")
      .select("racks")
      .eq("thana", policeStation)
      .single();

    if (error || !data) {
      console.error("Fetch rack error:", error?.message);
      toast.error("Thana not found.");
      return;
    }

    const normalizedInput = rackInput.trim().toLowerCase();
    const existingRacks = (data.racks || []).map((r: string) => r.trim().toLowerCase());

    if (existingRacks.includes(normalizedInput)) {
      toast.error("Rack already exists");
      return;
    }

    const updatedRacks = [...data.racks, rackInput.trim()];

    const { error: updateError } = await supabase
      .from("thana_rack_box_table")
      .update({ racks: updatedRacks })
      .eq("thana", policeStation);

    if (updateError) {
      console.error("Update rack error:", updateError.message);
      toast.error("Failed to update rack");
    } else {
      toast.success("Rack added successfully");
      setRackInput("");
    }
  };

  const handleBoxGeneration = async (e: React.FormEvent) => {
    e.preventDefault();

    const policeStation = user.role === "thana admin" ? user.thana : selectedThana;

    if (!boxInput.trim() || !policeStation) {
      toast.error("Please fill the box name and select thana.");
      return;
    }

    const { data, error } = await supabase
      .from("thana_rack_box_table")
      .select("boxes")
      .eq("thana", policeStation)
      .single();

    if (error || !data) {
      console.error("Fetch box error:", error?.message);
      toast.error("Thana not found.");
      return;
    }

    const normalizedInput = boxInput.trim().toLowerCase();
    const existingBoxes = (data.boxes || []).map((b: string) => b.trim().toLowerCase());

    if (existingBoxes.includes(normalizedInput)) {
      toast.error("Box already exists");
      return;
    }

    const updatedBoxes = [...data.boxes, boxInput.trim()];

    const { error: updateError } = await supabase
      .from("thana_rack_box_table")
      .update({ boxes: updatedBoxes })
      .eq("thana", policeStation);

    if (updateError) {
      console.error("Update box error:", updateError.message);
      toast.error("Failed to update box");
    } else {
      toast.success("Box added successfully");
      setBoxInput("");
    }
  };



  // getting token from data for  updated by and role allocation
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });

        console.log("Auth API response:", res.data);

        const userData = res.data.user;
        if (res.data.user?.role === "admin" || res.data.user?.role === "super admin") {
          const { data, error } = await supabase
            .from("thana_rack_box_table")
            .select("thana");

          if (error) {
            console.error("Error fetching thanas:", error);
          } else if (data) {
            const uniqueThanas = [...new Set(data.map((d) => d.thana))];
            setAvailableThanas(uniqueThanas);
          }
        }


        if (userData) {


          const User = {
            email: userData.email,
            name: userData.name,
            role: userData.role,
            thana: userData.thana,
            created_at: userData.created_at,
            phone: userData.phone,
          };

          setUser(User);
          setNewUserGeneration((prev) => ({
            ...prev,
            newuserThana: User.thana,
            newuserRole: "viewer",
          }));

        }

      } catch (err) {
        console.error("Auth check failed:", err);
      }


    }

    checkAuth();
  }, []);


  const handleQRGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setQRLoading(true)
    const policeStation = user.role === "thana admin" ? user.thana : selectedThana;

    const entries = Array.from({ length: 10 }, () => ({
      qr_id: `https://e-malkhana-smoky.vercel.app/?qrId=${uuidv4()}`,
      police_station: policeStation,
      qr_generated_by: user.name
    }))

    const { data, error } = await supabase
      .from("property_table")
      .insert({ entries })

    if (error) {
      console.error('Insert failed:', error.message)
    } else {
      toast.success("New QRs have been generated nd pushed to database")
      console.log('Inserted:', data)
    }

    setQRLoading(false)
  }

  const handleUserGeneration = async (e: React.FormEvent) => {
    e.preventDefault();

    const { newusername, newuserEmail, newuserRole, newuserPhone, newuserThana } = newUserGeneration;

    if (!newusername || !newuserEmail || !newuserRole || !newuserPhone || !newuserThana) {
      toast.error("Please fill all fields");
      return;
    }

    try {
      // Step 1: Check for existing email or phone
      const { data: existingUsers, error: checkError } = await supabase
        .from("officer_table")
        .select("*")
        .or(`email_id.eq.${newuserEmail},phone.eq.${newuserPhone}`);

      if (checkError) {
        console.error("Error checking existing user:", checkError.message);
        toast.error("Something went wrong. Try again.");
        return;
      }

      if (existingUsers && existingUsers.length > 0) {
        toast.error("A user with this email or phone already exists.");
        return;
      }

      // Step 2: Insert new user
      const { data, error } = await supabase.from("officer_table").insert([
        {
          officer_name: newusername,
          email_id: newuserEmail,
          phone: newuserPhone,
          role: newuserRole,
          thana: newuserThana,
        },
      ]);
      console.log(data)

      if (error) {
        console.error("User creation failed:", error.message);
        toast.error("Failed to create user");
      } else {
        toast.success("User created successfully");
        setNewUserGeneration({
          newusername: "",
          newuserRole: "viewer",
          newuserEmail: "",
          newuserPhone: "",
          newuserThana: user.thana,
        });
      }
    } catch (err) {
      console.error("Unexpected error:", err);
      toast.error("Something went wrong");
    }
  };

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
        <div className="flex-1 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 text-sm text-gray-700 max-sm:w-full">
          <div>
            <p className="font-semibold text-gray-900">Name</p>
            <p className="break-words">{user.name}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Email</p>
            <p className="break-words">{user.email}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Role</p>
            <p className="break-words">{user.role}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Status</p>
            <p>Active</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Joined</p>
            <p className="break-words">{user.created_at}</p>
          </div>
          <div>
            <p className="font-semibold text-gray-900">Phone No.</p>
            <p>{user.phone}</p>
          </div>
        </div>
      </div>
      {/* table section */}
      <div className="overflow-x-auto mt-6 bg-white shadow-md rounded-xl p-4">
        <h2 className="text-xl font-semibold text-gray-800 mb-4 text-center">Seized Property Items : {user.thana}</h2>
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
              <th className='px-4 py-2'>Logs</th>
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
                <td className=''>
                  <button
                    className='bg-white text-blue-500 p-1 rounded-b-xs hover:bg-blue-100 flex items-center gap-1 border border-blue-500 rounded-sm'>
                    <Link href={`/search-property/${item.property_id}`}>
                      <Logs className='text-blue-500' />
                    </Link>
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>




      {
        ["admin", "thana admin", "super admin"].includes(user.role) ? (
          // all forms div
          <>
            {/* other access */}
            <div className="w-full flex flex-col md:flex-row gap-6 flex-wrap">

              {/* Create New User */}
              <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
                <h2 className="text-lg font-semibold text-gray-800">Create New User</h2>
                <form className="space-y-3">
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUserGeneration.newusername}
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    onChange={(e) => { setNewUserGeneration({ ...newUserGeneration, newusername: e.target.value }) }}
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserGeneration.newuserEmail}
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    onChange={(e) => { setNewUserGeneration({ ...newUserGeneration, newuserEmail: e.target.value }) }}
                  />
                  <input
                    type="text"
                    placeholder="Phone no."
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    value={newUserGeneration.newuserPhone}
                    onChange={(e) => { setNewUserGeneration({ ...newUserGeneration, newuserPhone: e.target.value }) }}
                  />
                  <select className="w-full px-4 py-2 border rounded-md border-gray-300"
                    value={newUserGeneration.newuserRole}
                    onChange={(e) => { setNewUserGeneration({ ...newUserGeneration, newuserRole: e.target.value }) }}
                  >
                    <option value="viewer">Viewer</option>
                    {
                      (user.role == "admin" || user.role == "super admin") && (
                        <>
                          <option value="thana admin">Thana Admin</option>
                          {
                            user.role == "super admin" && (
                              <>
                                <option value="admin">Admin</option>
                                <option value="super admin">Super Admin</option>
                              </>
                            )
                          }
                        </>
                      )
                    }


                  </select>



                  <button className="w-full bg-red-500 text-white py-2 rounded-md hover:bg-red-600 transition-all"
                    onClick={(e) => handleUserGeneration(e)}
                  >
                    Create User
                  </button>
                </form>
              </div>

              {/* Change User Access */}

              {(user.role == "admin" || user.role == "super admin") ? (
                <div className="flex-1 bg-white shadow-md rounded-xl p-6 space-y-4">
                  <h2 className="text-lg font-semibold text-gray-800">Change User Access</h2>
                  <form
                    className="space-y-3"
                    onSubmit={async (e) => {
                      e.preventDefault();

                      if (!accessUpdate.identifier || !accessUpdate.newRole) {
                        toast.error("Please fill all fields");
                        return;
                      }

                      // Prevent lower roles from changing access beyond their permission
                      if (
                        user.role === "admin" &&
                        (accessUpdate.newRole === "admin" || accessUpdate.newRole === "super admin")
                      ) {
                        toast.error("You are not authorized to assign this role.");
                        return;
                      }

                      if (user.role === "thana admin") {
                        toast.error("You are not allowed to change access.");
                        return;
                      }

                      const { data: existing, error: fetchError } = await supabase
                        .from("officer_table")
                        .select("*")
                        .or(`email_id.eq.${accessUpdate.identifier},phone.eq.${accessUpdate.identifier}`);

                      if (fetchError) {
                        console.error("Fetch error:", fetchError.message);
                        toast.error("Could not find user");
                        return;
                      }

                      if (!existing || existing.length === 0) {
                        toast.error("No user found with that email or phone.");
                        return;
                      }

                      const userToUpdate = existing[0];

                      const { error: updateError } = await supabase
                        .from("users")
                        .update({ role: accessUpdate.newRole })
                        .eq("id", userToUpdate.id);

                      if (updateError) {
                        console.error("Update error:", updateError.message);
                        toast.error("Role update failed.");
                      } else {
                        toast.success("User access updated.");
                        setAccessUpdate({ identifier: "", newRole: "" });
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

                      {/* Viewer is available to all roles above thana admin */}
                      <option value="viewer">Viewer</option>

                      {/* Admins and super admins can assign thana admin */}
                      {(user.role === "admin" || user.role === "super admin") && (
                        <option value="thana admin">Thana Admin</option>
                      )}

                      {/* Only super admin can assign admin or super admin */}
                      {user.role === "super admin" && (
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
                  <Ban size={100} className='text-gray-500' />
                  <p className='text-center text-base'>Can{"'"}t change access as a Thana Admin, but you can create a viewer.</p>
                </div>
              )
              }


              {/* Generate QR IDs */}
              <div className="flex-1 w-full bg-white shadow-md rounded-xl p-6 space-y-4 flex-col items-center">
                <h2 className="text-xl font-semibold text-gray-800">Generate QR IDs</h2>
                {qrLoading ? <Loader2 className='text-xl animate-spin text-gray-700' /> : <form className="space-y-4" onSubmit={handleQRGeneration}>
                  <div className="flex flex-col">
                    <label htmlFor="thana" className="text-sm text-gray-600 mb-1">
                      Select Police Thana
                    </label>
                    <div>
                      {user.role === "admin" || user.role === "super admin" ? (
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
                        <div className="p-2 border border-gray-300 rounded bg-gray-100 text-gray-700 transition-all">
                          {user.thana}
                        </div>
                      )}
                    </div>

                  </div>

                  <button
                    type="submit"
                    className="w-full bg-green-500 text-white py-2 rounded-md font-medium hover:bg-green-700 transition-all duration-200"
                  >
                    Generate QR IDs
                  </button>
                </form>}

              </div>




            </div>
            {/* rack and boxes */}
            <div className='flex gap-6 max-sm:flex-col'>
              {/* Add Rack */}
              <form onSubmit={handleRackGeneration} className='flex-1 bg-white shadow-md rounded-xl p-6 space-y-4'>
                <h2 className="text-lg font-semibold text-gray-800 text-center">Add a Rack</h2>

                {(user.role === "admin" || user.role === "super admin") ? (
                  <select
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    value={selectedThana}
                    onChange={(e) => setSelectedThana(e.target.value)}
                  >
                    <option value="">Select Police Station</option>
                    {availableThanas.map((thana) => (
                      <option key={thana} value={thana}>{thana}</option>
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

                <button type="submit" className="w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 transition-all">
                  Add Rack
                </button>
              </form>

              {/* Add Box */}
              <form onSubmit={handleBoxGeneration} className='flex-1 bg-white shadow-md rounded-xl p-6 space-y-4'>
                <h2 className="text-lg font-semibold text-gray-800 text-center">Add a Box</h2>

                {(user.role === "admin" || user.role === "super admin") ? (
                  <select
                    className="w-full px-4 py-2 border rounded-md border-gray-300"
                    value={selectedThana}
                    onChange={(e) => setSelectedThana(e.target.value)}
                  >
                    <option value="">Select Police Station</option>
                    {availableThanas.map((thana) => (
                      <option key={thana} value={thana}>{thana}</option>
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

                <button type="submit" className="w-full bg-purple-600 text-white py-2 rounded-md hover:bg-purple-700 transition-all">
                  Add Box
                </button>
              </form>

            </div>
          </>
        ) : (
          // if user is not an admin
          <div className='py-10 flex flex-col items-center gap-4'>
            <p className='text-red-700 font-semibold text-2xl text-center'>Data manipulation features denied</p>
            <p className='text-center'>We limit certain features only to admins. You can only see your details here.</p>
            <span className='px-3 py-1 rounded-sm bg-gray-300 text-center max-sm:scale-90'>Your role : {user.role}</span>
          </div>
        )
      }

      {/* Forms Row */}

      <Toaster />
    </div>
  );
}
