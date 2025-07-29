"use client";
import { Eye, Plus, Search, X } from 'lucide-react';
import React, { useState, useEffect } from 'react';
import supabase from '@/supabaseConfig/supabaseConnect'; // adjust if your path is different


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
  qr_id: string;
  rack_number: string;
  remarks: string;
  swdfgb: string;
  under_section: string;
  updation_date: Date;
}

export default function Page() {
  const [searchCategory, setSearchCategory] = useState("property");
  const [searchValue, setSearchValue] = useState("");
  const [propertyData, setPropertyData] = useState<DataInterface[]>([]);
  const [loading, setLoading] = useState(false);

  // Fetch all properties on initial load
  useEffect(() => {
    fetchAllProperties();
  }, []);

  const fetchAllProperties = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("Property_table")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("❌ Error fetching all data:", error.message);
    } else {
      console.log("✅ All properties fetched successfully:", data);
      setPropertyData(data);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim() === "") return alert("Please enter a value to search.");

    setLoading(true);

    let column = "propertyNumber";
    if (searchCategory === "fir") column = "firNumber";

    const { data, error } = await supabase
      .from("Property_table")
      .select("*")
      .ilike(column, `%${searchValue}%`);

    if (error) {
      console.error("❌ Error searching:", error.message);
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
          className='bg-blue-500 h-12 rounded-sm px-4 py-1 flex items-center justify-start gap-5 max-md:flex-wrap'
          onSubmit={handleSearch}
        >
          <div className='flex gap-2'>
            {/* Search Category */}
            <div className='flex items-center gap-2'>
              <label htmlFor="searchCategory" className='text-white font-semibold'>Search By</label>
              <select
                name='searchCategory'
                value={searchCategory}
                onChange={(e) => setSearchCategory(e.target.value)}
                className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none'
              >
                <option value="property">Property Number</option>
                <option value="fir">FIR Number</option>
                <option value={"section"}>Under Section</option>
                <option value={"court"}>Name of Court</option>
                <option value={"io"}>Name of IO</option>
                <option value={"submitted"}>Submitted On</option>
                <option value={"police"}>Police Station</option>
                <option value={"rack"}>Rack Number</option>
                <option value={"box"}>Box Number</option>
                <option value={"updation"}>Updation Date</option>
                <option value={"status"}>Status of Property</option>

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
              disabled={loading}
            >
              <p className='max-lg:hidden'>Search</p>
              <Search className='text-blue-300' />
            </button>

            {/* Back Button */}
            <button
              type='button'
              className='bg-white py-1 rounded-sm px-4 outline-none flex justify-center items-center gap-3 hover:bg-red-100 max-md:px-2'
              onClick={handleReset}
              disabled={loading}
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
                <th className='px-3 py-2 border'>Name of Court</th>
                <th className='px-3 py-2 border'>Name of IO</th>
                <th className='px-3 py-2 border'>Submitted On</th>
                <th className='px-3 py-2 border'>Police Station</th>
                <th className='px-3 py-2 border'>Rack Number</th>
                <th className='px-3 py-2 border'>Box Number</th>
                <th className='px-3 py-2 border'>Updation Date</th>
                <th className='px-3 py-2 border'>Status of Property</th>
                <th className='px-3 py-2 border'>Logs</th>
              </tr>
            </thead>
            <tbody>
              {propertyData.length === 0 ? (
                <tr>
                  <td colSpan={13} className='text-center py-4 text-gray-500'>
                    {loading ? "Loading..." : "No records found"}
                  </td>
                </tr>
              ) : (
                propertyData.map((item, index) => (
                  <tr key={item.id || index} className='hover:bg-gray-50'>
                    <td className='px-3 py-2 border'>{index + 1}</td>
                    <td className='px-3 py-2 border'>{item.property_number}</td>
                    <td className='px-3 py-2 border'>{item.fir_number}</td>
                    <td className='px-3 py-2 border'>{item.under_section}</td>
                    <td className='px-3 py-2 border'>{item.property_tag}</td>
                    <td className='px-3 py-2 border'>{item.date_of_seizure ? new Date(item.date_of_seizure).toLocaleDateString():"N/A"}</td>
                    <td className='px-3 py-2 border'>{item.name_of_court}</td>
                    <td className='px-3 py-2 border'>{item.name_of_io}</td>
                    <td className='px-3 py-2 border'>{item.created_at ? new Date(item.created_at).toLocaleDateString().split("T")[0] : "N/A"}</td>
                    <td className='px-3 py-2 border'>{item.police_station}</td>
                    <td className='px-3 py-2 border'>{item.rack_number}</td>
                    <td className='px-3 py-2 border'>{item.box_number}</td>
                    <td className='px-3 py-2 border'>{item.updation_date ? new Date(item.updation_date).toLocaleDateString() : "N/A"}</td>
                    <td className='px-3 py-2 border'>{item.case_status}</td>
                    <td className='px-3 py-2 flex gap-2 justify-center'>

                      <button className='bg-green-500 text-white px-2 py-1 rounded-sm hover:bg-green-600 flex items-center gap-1'>
                        Add
                        <Plus className='text-white' />
                      </button>

                      <button className='bg-blue-500 text-white px-2 py-1 rounded-sm hover:bg-blue-600 flex items-center gap-1'>
                        <Eye className='text-white' />
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
