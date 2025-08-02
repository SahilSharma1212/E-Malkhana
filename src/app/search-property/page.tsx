"use client";
import { ChevronLeft, Logs, Search } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import supabase from '@/config/supabaseConnect';
import { useRouter } from 'next/navigation';
import axios from 'axios';

interface DataInterface {
  box_number: string;
  case_status: string;
  category_of_offence: string;
  created_at: Date;
  date_of_seizure: Date;
  description: string;
  fir_number: string;
  id: number;
  image_url: null;
  location_of_property: string;
  name_of_court: string;
  name_of_io: string;
  police_station: string;
  property_number: string;
  property_tag: string;
  property_id: string;
  rack_number: string;
  under_section: string;
  serial_number_from_register: string;
  type_of_seizure: string;
  place_of_seizure: string;
}

export default function Page() {
  const router = useRouter();
  const [searchCategory, setSearchCategory] = useState("property");
  const [searchValue, setSearchValue] = useState("");
  const [propertyData, setPropertyData] = useState<DataInterface[]>([]);
  const [loading, setLoading] = useState(false);
  const [userData, setUserData] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
  })

  let column = "property_id"; // default

  switch (searchCategory) {
    case "property":
      column = "property_id";
      break;
    case "fir":
      column = "fir_number";
      break;
    case "court":
      column = "name_of_court";
      break;
    case "rack":
      column = "rack_number";
      break;
    case "box":
      column = "box_number";
      break;
    case "created_at":
      column = "created_at";
      break;
    case "seizuredate":
      column = "date_of_seizure";
      break;
    case "offence":
    case "io":
      // Handled separately in handleSearch
      break;
  }

  // use effect to fetch the properties
  useEffect(() => {
    if (userData.role) {
      fetchAllProperties();
    }
  }, [userData.role]);

  // inotial fetch function
  const fetchAllProperties = async () => {
    setLoading(true);
    let query = supabase
      .from("property_table")
      .select("*")
      .not("property_id", "is", null)
      .neq("property_id", "");

    // Apply access control if role is 'viewer'
    if (userData.role === "viewer" || userData.role === "thana admin") {
      query = query.eq("police_station", userData.thana);
    }

    const { data, error } = await query.order("created_at", { ascending: true });

    if (error) {
      console.error("❌ Error fetching all data:", error.message);
    } else {
      setPropertyData(data);
    }

    setLoading(false);
  };


  // use effect to get data from token
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });

        console.log("Auth API response:", res.data);
        setUserData({
          email: res.data.user.email,
          name: res.data.user.name,
          role: res.data.user.role,
          thana: res.data.user.thana,
        })

      } catch (err) {
        console.log(err)
      }
    }
    checkAuth()
  }, [])

  const handleSearch = async (e: React.FormEvent) => {
  e.preventDefault();
  if (searchValue.trim() === "") return alert("Please enter a value to search.");
  setLoading(true);

  let query = supabase.from("property_table").select("*")
    .not("property_id", "is", null)
    .neq("property_id", "");

  if (searchCategory === "offence") {
    if (searchValue === "other") {
      query = query
        .not("category_of_offence", "in", ["body offence", "property offence", "offence related to c/w"])
        .neq("category_of_offence", "");
    } else {
      query = query.eq("category_of_offence", searchValue);
    }
  }

  else if (searchCategory === "io") {
    query = query.ilike("name_of_io", `%${searchValue}%`);
  }

  else if (searchCategory === "created_at" || searchCategory === "seizuredate") {
    const from = new Date(searchValue);
    const to = new Date(searchValue);
    to.setDate(to.getDate() + 1);
    query = query
      .gte("created_at", from.toISOString())
      .lt("created_at", to.toISOString());
  }

  else {
    // property, fir, court, rack, box
    query = query.eq(column, searchValue.trim());
  }

  // 🔐 Access control: restrict to viewer's thana
  if (userData.role === "viewer" || userData.role === "thana admin") {
    query = query.eq("police_station", userData.thana);
  }

  const { data, error } = await query;

  if (error) {
    console.error("❌ Error fetching search data:", error.message);
  } else {
    setPropertyData(data);
  }

  setLoading(false);
};


  const handleReset = async () => {
    setSearchValue("");
    fetchAllProperties();
  };

  return (
    <div className='flex items-center justify-center h-screen w-screen bg-blue-100'>
      <div className='bg-white h-[95%] w-[95%] rounded-md p-2 flex flex-col gap-3'>
        {/* Search Bar */}
        <form
          className='bg-blue-500 py-2 rounded-sm px-4 flex items-center justify-start gap-5 max-md:flex-wrap'
          onSubmit={handleSearch}
        >
          <div className='flex gap-2 flex-wrap items-center justify-between'>
            {/* Search Category */}
            <div className='flex items-center gap-2 max-sm:w-full'>
              <label htmlFor="searchCategory" className='text-white font-semibold max-sm:text-sm'>Search By</label>
              <select
                name='searchCategory'
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none max-md:w-full'
              >
                <option value="property">Property Number</option>
                <option value="fir">FIR Number</option>
                <option value="court">Name of Court</option>
                <option value="rack">Rack Number</option>
                <option value="box">Box Number</option>
                <option value="offence">Category of Offence</option>
                <option value="io">Name of IO</option>
                <option value="created_at">Created At</option>
                <option value="seizuredate">Date of Seizure</option>
              </select>
            </div>

            {/* Search Value */}
            {searchCategory === "offence" ? (
              <select
                name='searchValue'
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none max-md:w-full'
              >
                <option value="">Select Offence</option>
                <option value="body offence">Body Offence</option>
                <option value="property offence">Property Offence</option>
                <option value="offence related to c/w">Offence related to C/W</option>
                <option value="other">Other</option>
              </select>
            ) : searchCategory === "created_at" || searchCategory === "seizuredate" ? (
              <input
                type="date"
                name="searchValue"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-white h-8 w-44 max-lg:w-32 rounded-l-sm px-2 outline-none max-md:w-full"
              />
            ) : (
              <input
                type="text"
                name="searchValue"
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className="bg-white h-8 w-44 max-lg:w-32 rounded-l-sm px-2 outline-none max-md:w-full"
                placeholder="Enter..."
              />
            )}
          </div>

          {/* Search Buttons */}
          <div className='flex gap-2'>
            <button
              type='submit'
              className='bg-white py-1 rounded-sm px-2 outline-none flex justify-center items-center gap-2 hover:bg-blue-100 max-md:px-2'
              disabled={loading}
            >
              <Search className='text-blue-500' />
              <p className='max-lg:hidden max-md:visible'>Search</p>
            </button>
            <button
              type='button'
              className='bg-white py-1 rounded-sm px-2 outline-none flex justify-center items-center gap-2 hover:bg-red-100 max-md:px-2'
              onClick={handleReset}
              disabled={loading}
            >
              <ChevronLeft className='text-red-300' />
              <p className='max-lg:hidden max-md:visible'>Reset</p>
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
                <th className='px-3 py-2 border'>Register Number</th>
                <th className='px-3 py-2 border'>Under Section</th>
                <th className='px-3 py-2 border'>Date of Seizure</th>
                <th className='px-3 py-2 border'>Type of Seizure</th>
                <th className='px-3 py-2 border'>Place of Seizure</th>
                <th className='px-3 py-2 border'>Name of Court</th>
                <th className='px-3 py-2 border'>Name of IO</th>
                <th className='px-3 py-2 border'>Police Station</th>
                <th className='px-3 py-2 border'>Rack Number</th>
                <th className='px-3 py-2 border'>Box Number</th>
                <th className='px-3 py-2 border'>Created at</th>
                <th className='px-3 py-2 border'>Status of Property</th>
                <th className='px-3 py-2 border'>Logs</th>
              </tr>
            </thead>

            <tbody>
              {propertyData.length === 0 ? (
                <tr>
                  <td colSpan={16} className='text-center py-4 text-gray-500'>
                    {loading ? "Loading..." : "No records found"}
                  </td>
                </tr>
              ) : (
                propertyData.map((item, index) => (
                  <tr key={item.id || index} className='hover:bg-gray-50'>
                    <td className='px-3 py-2 border' title={item.description}>{index + 1}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.property_id}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.fir_number}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.serial_number_from_register}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.under_section}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.date_of_seizure ? new Date(item.date_of_seizure).toLocaleDateString() : "N/A"}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.type_of_seizure}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.place_of_seizure}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.name_of_court}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.name_of_io}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.police_station}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.rack_number}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.box_number}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.case_status}</td>
                    <td className='px-3 py-2 flex gap-2 justify-center items-center h-full border' title="Add Logs">
                      <button
                        className='bg-white text-blue-500 p-1 rounded-b-xs hover:bg-blue-100 flex items-center gap-1 border-blue-500 rounded-sm h-full w-full'
                        onClick={() => router.push(`/search-property/${item.property_id}`)}
                      >
                        <Logs className='text-blue-500' />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>

          </table>
        </div>
      </div>
    </div>
  );
}