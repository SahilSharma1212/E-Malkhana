"use client";
import { Ban, Database, Logs, Search, ChevronLeft, ChevronRight, Loader2 } from 'lucide-react';
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import axios from 'axios';
import toast from 'react-hot-toast';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/ui/badge';

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

const selectClass =
  "h-9 w-44 max-lg:w-32 max-md:w-full rounded-sm border border-border bg-card px-2 text-sm text-foreground outline-none transition-colors focus:border-ring focus:ring-2 focus:ring-ring/30";

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
  const [hasSearched, setHasSearched] = useState(false);

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
      column = "category_of_offence";
      break;
    case "io":
      column = "name_of_io";
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
  const fetchRackBoxData = useCallback(async () => {
    if (!userData.thana) return;

    setRackBoxLoading(true);
    setRackBoxError(null);

    try {
      const response = await axios.post("/api/fetch-rack-box", {
        thana: userData.thana,
      });

      if (response.data?.data) {
        setRackBoxData(response.data.data);
      } else {
        setRackBoxError(response.data?.error || "Unknown error");
        setRackBoxData([]);
        toast.error("Could not load rack/box options");
      }
    } catch (error) {
      if (axios.isAxiosError(error)) {
        setRackBoxError(error.response?.data?.error || error.message);
      } else {
        setRackBoxError("Network error");
      }
      setRackBoxData([]);
      toast.error("Could not load rack/box options");
    } finally {
      setRackBoxLoading(false);
    }
  }, [userData.thana]);

  // Fetch all properties
  const fetchAllProperties = async () => {
    setLoading(true);

    try {
      const response = await axios.post("/api/fetch-properties-search", {
        role: userData.role,
        thana: userData.thana,
      });

      setPropertyData(Array.isArray(response.data?.data) ? response.data.data : []);
    } catch (error) {
      console.error("Request failed:", error);
      toast.error("Could not load records");
      setPropertyData([]);
    }

    setHasSearched(true);
    setLoading(false);
  };

  // Fetch user data from token
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });
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
  }, [userData.thana, fetchRackBoxData]);

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
      toast.error("Please enter a value to search.");
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
        console.error("API error:", result.error);
        toast.error(result.error || "Search failed");
        setPropertyData([]);
      } else {
        setPropertyData(Array.isArray(result.data) ? result.data : []);
      }
    } catch (err) {
      console.error("Network error:", err);
      toast.error("Network error");
      setPropertyData([]);
    }

    setHasSearched(true);
    setLoading(false);
  };

  const handleReset = async () => {
    setSearchValue("");
    setPropertyData([]);
    setCurrentPage(1);
    setHasSearched(false);
  };

  // Get unique rack numbers and box numbers from arrays
  const uniqueRackNumbers = [...new Set(
    rackBoxData.flatMap(item => item.racks || [])
  )].filter(Boolean);

  const uniqueBoxNumbers = [...new Set(
    rackBoxData.flatMap(item => item.boxes || [])
  )].filter(Boolean);

  const PaginationBar = ({ compact = false }: { compact?: boolean }) => (
    <div className="flex items-center gap-1.5">
      <Button variant="outline" size="sm" onClick={goToFirstPage} disabled={currentPage === 1}>
        First
      </Button>
      <Button variant="outline" size="sm" onClick={goToPreviousPage} disabled={currentPage === 1}>
        <ChevronLeft size={14} /> {compact ? "" : "Prev"}
      </Button>
      <div className="flex gap-1">
        {getPageNumbers().map((pageNum) => (
          <Button
            key={pageNum}
            variant={currentPage === pageNum ? "signal" : "outline"}
            size="sm"
            onClick={() => goToPage(pageNum)}
          >
            {pageNum}
          </Button>
        ))}
      </div>
      <Button variant="outline" size="sm" onClick={goToNextPage} disabled={currentPage === totalPages}>
        {compact ? "" : "Next"} <ChevronRight size={14} />
      </Button>
      <Button variant="outline" size="sm" onClick={goToLastPage} disabled={currentPage === totalPages}>
        Last
      </Button>
    </div>
  );

  return (
    <div className="flex flex-col gap-4">
      {/* Page header */}
      <div>
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Evidence Console
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Search Records
        </h1>
      </div>

      {/* Search toolbar */}
      <form
        className="flex flex-wrap items-center gap-4 rounded-md border border-border bg-card p-3 shadow-sm"
        onSubmit={handleSearch}
      >
        <div className="flex flex-wrap items-center gap-3">
          {/* Search Category */}
          <div className="flex items-center gap-2 max-sm:w-full">
            <label htmlFor="searchCategory" className="text-sm font-medium text-muted-foreground max-sm:text-sm">
              Search by
            </label>
            <select
              name="searchCategory"
              value={searchCategory}
              onChange={(e) => setSearchCategory(e.target.value)}
              className={selectClass}
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
            <div className="flex items-center gap-2 max-sm:w-full">
              <label htmlFor="rackBoxType" className="text-sm font-medium text-muted-foreground max-sm:text-sm">
                Type
              </label>
              <select
                name="rackBoxType"
                value={rackBoxType}
                onChange={(e) => {
                  setRackBoxType(e.target.value);
                  setSearchValue("");
                }}
                className={`${selectClass} w-32`}
              >
                <option value="rack">Rack</option>
                <option value="box">Box</option>
              </select>
            </div>
          )}

          {/* Search Value */}
          {searchCategory === "offence" ? (
            <select
              name="searchValue"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={selectClass}
            >
              <option value="">Select Offence</option>
              <option value="body offence">Body Offence</option>
              <option value="property offence">Property Offence</option>
              <option value="offence related to c/w">Offence related to C/W</option>
              <option value="other">Other</option>
            </select>
          ) : searchCategory === "rackbox" ? (
            <select
              name="searchValue"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={selectClass}
              disabled={rackBoxLoading}
            >
              <option value="">
                {rackBoxLoading
                  ? "Loading..."
                  : rackBoxError
                  ? "Error loading data"
                  : `Select ${rackBoxType === "rack" ? "Rack" : "Box"}`}
              </option>
              <option value="Special Place">Special Place</option>
              {!rackBoxLoading && !rackBoxError &&
                (rackBoxType === "rack"
                  ? uniqueRackNumbers.map((rack, index) => (
                      <option key={index} value={rack}>
                        {rack}
                      </option>
                    ))
                  : uniqueBoxNumbers.map((box, index) => (
                      <option key={index} value={box}>
                        {box}
                      </option>
                    )))}
            </select>
          ) : searchCategory === "created_at" || searchCategory === "seizuredate" ? (
            <input
              type="date"
              name="searchValue"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={selectClass}
            />
          ) : (
            <input
              type="text"
              name="searchValue"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              className={selectClass}
              placeholder="Enter..."
            />
          )}
        </div>

        {/* Search Buttons */}
        <div className="flex gap-2">
          <Button type="submit" variant="signal" disabled={loading}>
            {loading ? <Loader2 className="size-4 animate-spin" /> : <Search className="size-4" />}
            <span className="max-lg:hidden max-md:inline">Search</span>
          </Button>
          <Button type="button" variant="outline" onClick={handleReset} disabled={loading}>
            <Ban className="size-4" />
            <span className="max-lg:hidden max-md:inline">Reset</span>
          </Button>
          <Button type="button" variant="secondary" onClick={fetchAllProperties} disabled={loading}>
            <Database className="size-4" />
            <span className="max-lg:hidden max-md:inline">Load All</span>
          </Button>
        </div>
      </form>

      {/* Results Info and Pagination Controls */}
      {propertyData.length > 0 && (
        <div className="flex items-center justify-between rounded-sm border border-border bg-secondary px-4 py-2 text-sm">
          <div className="text-muted-foreground">
            Showing {startIndex + 1} to {Math.min(endIndex, propertyData.length)} of{" "}
            <span className="font-medium text-foreground">{propertyData.length}</span> records
          </div>

          {totalPages > 1 && (
            <div className="max-sm:hidden">
              <PaginationBar />
            </div>
          )}
        </div>
      )}

      {/* Table Section */}
      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        <div className="max-h-[65vh] overflow-auto">
          <table className="min-w-[1400px] w-full text-left text-sm">
            <thead className="sticky top-0 z-10 bg-secondary text-foreground">
              <tr className="[&>th]:whitespace-nowrap [&>th]:border-b [&>th]:border-border [&>th]:px-3 [&>th]:py-2.5 [&>th]:text-xs [&>th]:font-semibold [&>th]:uppercase [&>th]:tracking-wide">
                <th>S.No</th>
                <th>Property Number</th>
                <th>FIR Number</th>
                <th>Register Number</th>
                <th>Under Section</th>
                <th>Offence Category</th>
                <th>Date of Seizure</th>
                <th>Type of Seizure</th>
                <th>Place of Seizure</th>
                <th>Name of Court</th>
                <th>Name of IO</th>
                <th>Police Station</th>
                <th>Rack Number</th>
                <th>Box Number</th>
                <th>Created at</th>
                <th>Status</th>
                <th>Logs</th>
              </tr>
            </thead>
            <tbody className="[&>tr]:border-b [&>tr]:border-border">
              {currentPageData.length === 0 ? (
                <tr>
                  <td colSpan={17} className="px-3 py-10 text-center text-muted-foreground">
                    {loading ? (
                      <span className="inline-flex items-center gap-2">
                        <Loader2 className="size-4 animate-spin text-signal" /> Loading…
                      </span>
                    ) : hasSearched ? (
                      "No records match your search"
                    ) : (
                      "Search records using the parameters above, or Load All"
                    )}
                  </td>
                </tr>
              ) : (
                currentPageData.map((item, index) => (
                  <tr key={item.id || index} className="transition-colors hover:bg-accent">
                    <td className="px-3 py-2 tabular-nums text-muted-foreground">{startIndex + index + 1}</td>
                    <td className="px-3 py-2 mono-id font-medium" title={item.description}>{item.property_id}</td>
                    <td className="px-3 py-2 mono-id" title={item.description}>{item.fir_number}</td>
                    <td className="px-3 py-2 mono-id" title={item.description}>{item.serial_number_from_register}</td>
                    <td className="px-3 py-2" title={item.description}>{item.under_section}</td>
                    <td className="px-3 py-2" title={item.description}>{item.category_of_offence}</td>
                    <td className="px-3 py-2 whitespace-nowrap" title={item.description}>{item.date_of_seizure ? new Date(item.date_of_seizure).toLocaleDateString() : "N/A"}</td>
                    <td className="px-3 py-2" title={item.description}>{item.type_of_seizure}</td>
                    <td className="px-3 py-2" title={item.description}>{item.place_of_seizure}</td>
                    <td className="px-3 py-2" title={item.description}>{item.name_of_court}</td>
                    <td className="px-3 py-2" title={item.description}>{item.name_of_io}</td>
                    <td className="px-3 py-2 capitalize" title={item.description}>{item.police_station}</td>
                    <td className="px-3 py-2" title={item.description}>{item.rack_number}</td>
                    <td className="px-3 py-2" title={item.description}>{item.box_number}</td>
                    <td className="px-3 py-2 whitespace-nowrap" title={item.description}>{item.created_at ? new Date(item.created_at).toLocaleDateString() : "N/A"}</td>
                    <td className="px-3 py-2"><StatusBadge status={item.case_status} /></td>
                    <td className="px-3 py-2" title="View Logs">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => router.push(`/search-property/${item.property_id}`)}
                      >
                        <Logs className="size-4" />
                      </Button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bottom Pagination */}
      {propertyData.length > 0 && totalPages > 1 && (
        <div className="flex items-center justify-center rounded-sm border border-border bg-secondary py-2">
          <PaginationBar compact />
        </div>
      )}
    </div>
  );
}
