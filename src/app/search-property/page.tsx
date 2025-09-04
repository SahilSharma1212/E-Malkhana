"use client";
import { Ban, Database, Logs, Search, ChevronLeft, ChevronRight } from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
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

interface RackBoxData {
  racks: string[];
  boxes: string[];
}

export default function Page() {
  const router = useRouter();
  const [searchCategory, setSearchCategory] = useState("property");
  const [searchValue, setSearchValue] = useState("");
  const [rackBoxType, setRackBoxType] = useState("rack");
  const [propertyData, setPropertyData] = useState<DataInterface[]>([]);
  const [rackBoxData, setRackBoxData] = useState<RackBoxData[]>([]);
  const [rackBoxLoading, setRackBoxLoading] = useState(false);
  const [rackBoxError, setRackBoxError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 60;
  
  const [userData, setUserData] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
  });

  let column = "property_id";

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
    case "rackbox":
      column = rackBoxType === "rack" ? "rack_number" : "box_number";
      break;
    case "created_at":
      column = "created_at";
      break;
    case "seizuredate":
      column = "date_of_seizure";
      break;
    case "offence":
    case "io":
      break;
  }

  // Pagination calculations
  const totalPages = Math.ceil(propertyData.length / itemsPerPage);
  const startIndex = (currentPage - 1) * itemsPerPage;
  const endIndex = startIndex + itemsPerPage;
  
  // Get current page data
  const currentPageData = useMemo(() => {
    return propertyData.slice(startIndex, endIndex);
  }, [propertyData, startIndex, endIndex]);

  // Reset to first page when data changes
  useEffect(() => {
    setCurrentPage(1);
  }, [propertyData]);

  // Pagination handlers
  const goToPage = (page: number) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  const goToFirstPage = () => setCurrentPage(1);
  const goToLastPage = () => setCurrentPage(totalPages);
  const goToPreviousPage = () => setCurrentPage(Math.max(1, currentPage - 1));
  const goToNextPage = () => setCurrentPage(Math.min(totalPages, currentPage + 1));

  // Generate page numbers for pagination controls
  const getPageNumbers = () => {
    const pages = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pages.push(i);
      }
    } else {
      if (currentPage <= 3) {
        for (let i = 1; i <= 5; i++) {
          pages.push(i);
        }
      } else if (currentPage >= totalPages - 2) {
        for (let i = totalPages - 4; i <= totalPages; i++) {
          pages.push(i);
        }
      } else {
        for (let i = currentPage - 2; i <= currentPage + 2; i++) {
          pages.push(i);
        }
      }
    }
    
    return pages;
  };

  // Fetch rack and box data
  const fetchRackBoxData = async () => {
    if (!userData.thana) {
      console.log("⚠️ No thana available yet, skipping rack/box fetch");
      return;
    }

    setRackBoxLoading(true);
    setRackBoxError(null);
    
    try {
      console.log("🔍 Fetching rack/box data for thana:", userData.thana);
      
      const response = await axios.post("/api/fetch-rack-box", {
        thana: userData.thana,
      });

      console.log("📊 Rack/Box API response:", response.data);

      if (response.data?.data) {
        setRackBoxData(response.data.data);
        console.log("✅ Rack/Box data set:", response.data.data);
        console.log("📊 Total records:", response.data.data.length);
      } else {
        console.error("❌ Error:", response.data?.error || "Unknown error");
        setRackBoxError(response.data?.error || "Unknown error");
        
        console.log("🧪 Adding test data for debugging");
        setRackBoxData([
          { racks: ["R001", "R002", "R003"], boxes: ["B001", "B002", "B003"] },
          { racks: ["R004", "R005"], boxes: ["B004", "B005", "B006"] },
        ]);
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
      if (axios.isAxiosError(error)) {
        console.error("❌ Response data:", error.response?.data);
        console.error("❌ Response status:", error.response?.status);
        setRackBoxError(error.response?.data?.error || error.message);
      } else {
        setRackBoxError("Network error");
      }
      
      console.log("🧪 Adding test data due to error");
      setRackBoxData([
        { racks: ["R001", "R002", "R003"], boxes: ["B001", "B002", "B003"] },
        { racks: ["R004", "R005"], boxes: ["B004", "B005", "B006"] },
      ]);
    } finally {
      setRackBoxLoading(false);
    }
  };

  // Fetch all properties
  const fetchAllProperties = async () => {
    setLoading(true);

    try {
      const response = await axios.post("/api/fetch-properties-search", {
        role: userData.role,
        thana: userData.thana,
      });

      if (response.data?.data) {
        setPropertyData(response.data.data);
      } else {
        console.error("❌ Error:", response.data?.error || "Unknown error");
      }
    } catch (error) {
      console.error("❌ Request failed:", error);
    }

    setLoading(false);
  };

  // Fetch user data from token
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
        });
      } catch (err) {
        console.log(err);
      }
    }
    checkAuth();
  }, []);

  // Fetch rack/box data when userData.thana is available
  useEffect(() => {
    if (userData.thana) {
      fetchRackBoxData();
    }
  }, [userData.thana]);

  // Reset search value when category changes
  useEffect(() => {
    setSearchValue("");
    if (searchCategory === "rackbox") {
      setRackBoxType("rack");
    }
  }, [searchCategory]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();

    if (searchValue.trim() === "") {
      alert("Please enter a value to search.");
      return;
    }

    setLoading(true);

    try {
      const response = await fetch("/api/handle-search-property", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          searchValue,
          searchCategory,
          column,
          userData,
          rackBoxType: searchCategory === "rackbox" ? rackBoxType : undefined,
        }),
      });

      const result = await response.json();

      if (!response.ok) {
        console.error("❌ API error:", result.error);
      } else {
        setPropertyData(result.data);
      }
    } catch (err) {
      console.error("❌ Network error:", err);
    }

    setLoading(false);
  };

  const handleReset = async () => {
    setSearchValue("");
    setPropertyData([]);
    setCurrentPage(1);
  };

  // Get unique rack numbers and box numbers from arrays
  const uniqueRackNumbers = [...new Set(
    rackBoxData.flatMap(item => item.racks || [])
  )].filter(Boolean);
  
  const uniqueBoxNumbers = [...new Set(
    rackBoxData.flatMap(item => item.boxes || [])
  )].filter(Boolean);

  console.log("🔍 Debug Info:", {
    rackBoxDataLength: rackBoxData.length,
    rawRackBoxData: rackBoxData,
    uniqueRackNumbers,
    uniqueBoxNumbers,
    rackBoxLoading,
    rackBoxError,
    userThana: userData.thana
  });

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
                <option value="rackbox">Rack / Box</option>
                <option value="offence">Category of Offence</option>
                <option value="io">Name of IO</option>
                <option value="created_at">Created At</option>
                <option value="seizuredate">Date of Seizure</option>
              </select>
            </div>

            {/* Rack/Box Type Selection */}
            {searchCategory === "rackbox" && (
              <div className='flex items-center gap-2 max-sm:w-full'>
                <label htmlFor="rackBoxType" className='text-white font-semibold max-sm:text-sm'>Type</label>
                <select
                  name='rackBoxType'
                  value={rackBoxType}
                  onChange={(e) => {
                    setRackBoxType(e.target.value);
                    setSearchValue("");
                  }}
                  className='bg-white h-8 w-32 rounded-sm px-2 outline-none max-md:w-full'
                >
                  <option value="rack">Rack</option>
                  <option value="box">Box</option>
                </select>
              </div>
            )}

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
            ) : searchCategory === "rackbox" ? (
              <select
                name='searchValue'
                value={searchValue}
                onChange={(e) => setSearchValue(e.target.value)}
                className='bg-white h-8 w-44 max-lg:w-32 rounded-sm px-2 outline-none max-md:w-full'
                disabled={rackBoxLoading}
              >
                <option value="">
                  {rackBoxLoading 
                    ? "Loading..." 
                    : rackBoxError 
                    ? "Error loading data" 
                    : `Select ${rackBoxType === "rack" ? "Rack" : "Box"}`
                  }
                </option>
                <option value="Special Place">Special Place</option>
                {!rackBoxLoading && !rackBoxError && (
                  rackBoxType === "rack" 
                    ? uniqueRackNumbers.map((rack, index) => (
                        <option key={index} value={rack}>{rack}</option>
                      ))
                    : uniqueBoxNumbers.map((box, index) => (
                        <option key={index} value={box}>{box}</option>
                      ))
                )}
                {rackBoxError && (
                  <option value="" disabled>
                    Error: {rackBoxError}
                  </option>
                )}
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
              <Ban className='text-red-300' />
              <p className='max-lg:hidden max-md:visible'>Reset</p>
            </button>
            <button
              type='button'
              className='bg-white py-1 rounded-sm px-2 outline-none flex justify-center items-center gap-2 hover:bg-emerald-100 max-md:px-2'
              onClick={fetchAllProperties}
              disabled={loading}
            >
              <Database className='text-emerald-600' size={20} />
              <p className='max-lg:hidden max-md:visible'>Load All</p>
            </button>
          </div>
        </form>

        {/* Results Info and Pagination Controls */}
        {propertyData.length > 0 && (
          <div className='flex justify-between items-center px-4 py-2 bg-gray-50 rounded-sm text-sm'>
            <div className='text-gray-600'>
              Showing {startIndex + 1} to {Math.min(endIndex, propertyData.length)} of {propertyData.length} results
            </div>
            
            {totalPages > 1 && (
              <div className='flex items-center gap-2 max-sm:hidden'>
                <button
                  onClick={goToFirstPage}
                  disabled={currentPage === 1}
                  className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  First
                </button>
                
                <button
                  onClick={goToPreviousPage}
                  disabled={currentPage === 1}
                  className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
                >
                  <ChevronLeft size={16} />
                  Prev
                </button>
                
                <div className='flex gap-1'>
                  {getPageNumbers().map(pageNum => (
                    <button
                      key={pageNum}
                      onClick={() => goToPage(pageNum)}
                      className={`px-3 py-1 rounded border ${
                        currentPage === pageNum
                          ? 'bg-blue-500 text-white border-blue-500'
                          : 'bg-white hover:bg-gray-50'
                      }`}
                    >
                      {pageNum}
                    </button>
                  ))}
                </div>
                
                <button
                  onClick={goToNextPage}
                  disabled={currentPage === totalPages}
                  className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1'
                >
                  Next
                  <ChevronRight size={16} />
                </button>
                
                <button
                  onClick={goToLastPage}
                  disabled={currentPage === totalPages}
                  className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed'
                >
                  Last
                </button>
              </div>
            )}
          </div>
        )}

        {/* Table Section */}
        <div className='overflow-auto flex-1'>
          <table className='min-w-full border border-gray-300 text-sm text-left rounded-md'>
            <thead className='bg-gray-100 text-gray-700 font-semibold sticky top-0'>
              <tr>
                <th className='px-3 py-2 border'>S.No</th>
                <th className='px-3 py-2 border'>Property Number</th>
                <th className='px-3 py-2 border'>FIR Number</th>
                <th className='px-3 py-2 border'>Register Number</th>
                <th className='px-3 py-2 border'>Under Section</th>
                <th className='px-3 py-2 border'>Offence Category</th>
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
              {currentPageData.length === 0 ? (
                <tr>
                  <td colSpan={17} className='text-center py-4 text-gray-500 max-sm:text-start px-3'>
                    {loading ? "Loading..." : "Search properties using parameters"}
                  </td>
                </tr>
              ) : (
                currentPageData.map((item, index) => (
                  <tr key={item.id || index} className='hover:bg-gray-50'>
                    <td className='px-3 py-2 border' title={item.description}>{startIndex + index + 1}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.property_id}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.fir_number}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.serial_number_from_register}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.under_section}</td>
                    <td className='px-3 py-2 border' title={item.description}>{item.category_of_offence}</td>
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
                        className='bg-white text-blue-500 p-1 hover:bg-blue-100 flex items-center gap-1 border-blue-500 rounded-sm h-full w-full border'
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

        {/* Bottom Pagination */}
        {propertyData.length > 0 && totalPages > 1 && (
          <div className='flex justify-center items-center py-2 bg-gray-50 rounded-sm'>
            <div className='flex items-center gap-2'>
              <button
                onClick={goToFirstPage}
                disabled={currentPage === 1}
                className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
              >
                First
              </button>
              
              <button
                onClick={goToPreviousPage}
                disabled={currentPage === 1}
                className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm'
              >
                <ChevronLeft size={14} />
                Prev
              </button>
              
              <div className='flex gap-1'>
                {getPageNumbers().map(pageNum => (
                  <button
                    key={pageNum}
                    onClick={() => goToPage(pageNum)}
                    className={`px-2 py-1 rounded border text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-500 text-white border-blue-500'
                        : 'bg-white hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                ))}
              </div>
              
              <button
                onClick={goToNextPage}
                disabled={currentPage === totalPages}
                className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1 text-sm'
              >
                Next
                <ChevronRight size={14} />
              </button>
              
              <button
                onClick={goToLastPage}
                disabled={currentPage === totalPages}
                className='px-2 py-1 rounded bg-white border hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed text-sm'
              >
                Last
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}