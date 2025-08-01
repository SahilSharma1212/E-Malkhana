"use client";
import supabase from "@/config/supabaseConnect";
import axios from "axios";
import { Copy, FileText, FolderUp, Plus, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, FormEvent, useRef, use } from "react";
import toast, { Toaster } from "react-hot-toast";
import QRCode from "react-qr-code";

// Define interfaces
interface StatusLog {
  property_id: string;
  status: string;
  created_at: string;
  handling_officer: string;
  status_remarks: string;
  reason: string;
  time_of_event: string;
  updated_by: string;
  pdf_url: string;
}

interface PropertyDetails {
  id: string;
  created_at: string;
  fir_number: string;
  under_section: string;
  description: string;
  property_tag: string;
  rack_number: string;
  box_number: string;
  name_of_court: string;
  category_of_offence: string;
  date_of_seizure: string;
  name_of_io: string;
  case_status: string;
  remarks: string;
  image_url: [];
  qr_id: string;
  police_station: string;
  property_id: string;
}

interface PageProps {
  params: Promise<{
    statusLogsId: string;
  }>;
}

export default function Page({ params }: PageProps) {
  const { statusLogsId } = use(params);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingLogs, setAddingLogs] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false); // New state for access control
  const propertyId = statusLogsId;
  const [pdfFile, setPdfFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const [reason, setReason] = useState<string>("");
  const [customReason, setCustomReason] = useState<string>("");
  const [user, setUser] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
  });

  // Fetch property details and status logs
  useEffect(() => {
  const init = async () => {
    try {
      setLoading(true);

      // 1. Get user info
      const res = await axios.get('/api/get-token', { withCredentials: true });
      const userData = res.data.user;

      if (!userData) {
        setHasAccess(false);
        setLoading(false);
        return;
      }

      const tempUser = {
        email: userData.email,
        name: userData.name,
        role: userData.role,
        thana: userData.thana,
      };

      setUser(tempUser);

      // 2. Fetch property first to check which police station it belongs to
      const { data: property, error: propertyError } = await supabase
        .from("property_table")
        .select("*")
        .eq("property_id", propertyId)
        .single();

      if (propertyError) {
        console.error("❌ Property fetch error:", propertyError.message);
        toast.error("Error Fetching Property Details");
        setHasAccess(false);
        setLoading(false);
        return;
      }

      // 3. Check access logic
      const sameThana = property.police_station === tempUser.thana;

      let allowed = false;
      if (["admin", "super admin"].includes(tempUser.role)) {
        allowed = true;
      } else if (tempUser.role === "thana admin" && sameThana) {
        allowed = true;
      } else if (tempUser.role === "viewer" && sameThana) {
        allowed = true;
      }

      setHasAccess(allowed);

      if (!allowed) {
        setLoading(false);
        return;
      }

      // 4. Only fetch logs if allowed
      setPropertyDetails(property);

      const { data: logs, error: logsError } = await supabase
        .from("status_logs_table")
        .select("*")
        .eq("property_id", propertyId);

      if (logsError) {
        console.error("❌ Logs fetch error:", logsError.message);
        toast.error("Error Fetching Logs");
        return;
      }

      setStatusLogs(logs || []);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("An unexpected error occurred");
    } finally {
      setLoading(false);
    }
  };

  if (propertyId) {
    init();
  }
}, [propertyId]);


  // Fetch user data and determine access
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', {
          withCredentials: true,
        });

        console.log("Auth API response:", res.data);

        const userData = res.data.user;

        if (userData) {
          setUser({
            email: userData.email,
            name: userData.name,
            role: userData.role,
            thana: userData.thana,
          });

          // Determine access based on role and thana
          if (userData.role === "viewer") {
            // Viewer only has access if their thana matches property's police station
            setHasAccess(propertyDetails?.police_station === userData.thana);
          } else if (userData.role === "thana admin") {
            // Thana admin can view all properties
            setHasAccess(propertyDetails?.police_station === userData.thana);
          } else if (["admin", "super admin"].includes(userData.role)) {
            // Admin and super admin have full access
            setHasAccess(true);
          } else {
            setHasAccess(false);
          }
        }
      } catch (err) {
        console.error("Auth check failed:", err);
        setHasAccess(false);
      }
    }

    if (propertyDetails) {
      checkAuth();
    }
  }, [propertyDetails]);

  const handleCopyQRId = async () => {
    try {
      await navigator.clipboard.writeText(propertyDetails!.qr_id);
      toast.success("QR ID copied");
    } catch (error) {
      console.error(error);
      toast.error("Failed to copy QR ID");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);

    const formData = new FormData(e.currentTarget);
    const status = formData.get("status") as string | null;
    const status_remarks = formData.get("status_remarks") as string | null;
    const handling_officer = formData.get("handling_officer") as string | null;
    const updated_by = user.name as string | null;
    const time_of_event = formData.get("time_of_event") as string | null;
    const reasonFinal = reason === "Other" ? customReason : reason;

    if (!status || !handling_officer || !updated_by || !time_of_event || !reason) {
      toast.error("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    let pdfUrl = null;

    try {
      if (pdfFile) {
        if (pdfFile.size > 5 * 1024 * 1024) {
          toast.error("PDF file size must be less than 5MB");
          setSubmitting(false);
          return;
        }

        const fileName = `pdf_reports/${Date.now()}_${pdfFile.name}`;
        const { error: uploadError } = await supabase.storage
          .from("property-images")
          .upload(fileName, pdfFile);

        if (uploadError) {
          toast.error("PDF upload failed");
          setSubmitting(false);
          return;
        }

        const { data: urlData } = supabase.storage
          .from("property-images")
          .getPublicUrl(fileName);
        pdfUrl = urlData.publicUrl;
      }

      const newLog: StatusLog = {
        property_id: propertyId,
        status,
        status_remarks: status_remarks || "",
        handling_officer,
        updated_by: user.name,
        time_of_event,
        reason: reasonFinal,
        created_at: new Date().toISOString(),
        pdf_url: pdfUrl || "",
      };

      const { error } = await supabase.from("status_logs_table").insert([newLog]);

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }

      toast.success("Log added successfully");
      if (pdfUrl) {
        toast.success("PDF added");
      }

      setPdfFile(null);
      if (fileInputRef.current) {
        fileInputRef.current.value = "";
      }
      if (formRef.current) {
        formRef.current.reset();
      }
      setStatusLogs((prev) => [...prev, newLog]);
      setAddingLogs(false);
    } catch (error) {
      console.error("Error in handleSubmit:", error);
      toast.error("Failed to add log");
    } finally {
      setSubmitting(false);
    }
  };

  const handleCancel = () => {
    setPdfFile(null);
    setAddingLogs(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
    if (formRef.current) {
      formRef.current.reset();
    }
  };

  // Check if user can add logs
  const canAddLogs = () => {
    if (["admin", "super admin"].includes(user.role)) {
      return true;
    }
    if (user.role === "thana admin" && user.thana === propertyDetails?.police_station) {
      return true;
    }
    return false;
  };

  return (
    <div className="bg-blue-100 p-2 min-h-screen">
      <div className="p-3 bg-white rounded-md pl-8 pt-7">
        {loading && <div className="text-center">Loading...</div>}

        {!loading && !hasAccess && (
          <div className="text-center text-red-600 font-semibold">
            You don&apos;t have access to property of other thana, only thana admins have this access.
          </div>
        )}

        {!loading && hasAccess && propertyDetails && (
          <div className="mb-6 bg-blue-100 p-4 rounded shadow-sm flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-4 text-center">Property Details</h2>
            <div className="flex flex-wrap w-full h-full items-center max-lg:flex-col max-lg:items-center max-sm:items-start gap-5">
              <div className="flex flex-col items-center gap-6 w-[18%] max-md:w-full h-full mb-8 border py-8 rounded-sm border-gray-600 bg-white max-lg:w-70">
                <QRCode value={propertyDetails.qr_id} className="h-32 w-32" />
                <div className="flex items-center gap-2 bg-blue-100 px-2 py-1 rounded-sm max-w-64 overflow-x-auto">
                  <p className="text-sm font-bold text-gray-700 break-all select-all">
                    Copy Unique Qr
                  </p>
                  <button
                    onClick={handleCopyQRId}
                    title="Copy QR ID"
                    className="hover:text-blue-600"
                    type="button"
                    aria-label="Copy QR ID"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              <div className="flex justify-justify gap-5 text-sm w-[78%] max-md:w-[100%] h-full max-md:justify-center flex-wrap max-lg:w-[98%]">
                {[
                  { label: "Property Number", value: propertyDetails.property_id },
                  { label: "FIR Number", value: propertyDetails.fir_number },
                  {
                    value: Array.isArray(propertyDetails.under_section)
                      ? propertyDetails.under_section.join(", ")
                      : propertyDetails.under_section
                  },
                  { label: "Description", value: propertyDetails.description },
                  { label: "Rack Number", value: propertyDetails.rack_number },
                  { label: "Box Number", value: propertyDetails.box_number },
                  { label: "Court Name", value: propertyDetails.name_of_court },
                  { label: "Offence Category", value: propertyDetails.category_of_offence },
                  { label: "Seizure Date", value: new Date(propertyDetails.date_of_seizure).toLocaleString() },
                  { label: "Investigating Officer", value: propertyDetails.name_of_io },
                  { label: "Case Status", value: propertyDetails.case_status },
                  { label: "Remarks", value: propertyDetails.remarks },
                  { label: "Created At", value: new Date(propertyDetails.created_at).toLocaleString() },
                  { label: "Police Station", value: propertyDetails.police_station },
                ].map((item, index) => (
                  <div key={index} className="flex flex-col h-full justify-start gap-5 w-[22%] max-md:w-[30%] max-sm:w-10/12 mb-2.5">
                    <p>
                      <strong>{item.label}:</strong>{" "}
                      <span className="text-gray-800">{item.value}</span>
                    </p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {!loading && hasAccess && propertyDetails?.image_url && propertyDetails.image_url.length > 0 && (
          <div className="mb-8 bg-blue-50 rounded-md p-4 shadow-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Property Images</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {propertyDetails.image_url.map((url, idx) => (
                <div key={idx} className="w-60 h-60 overflow-hidden rounded border border-gray-300 shadow-sm">
                  <Image
                    src={url}
                    alt={`Property Image ${idx + 1}`}
                    width={240}
                    height={240}
                    className="object-cover w-full h-full transition-transform hover:scale-105 duration-300"
                    unoptimized
                  />
                </div>
              ))}
            </div>
          </div>
        )}

        {!loading && hasAccess && (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Status Logs</h1>
            {statusLogs.length === 0 ? (
              <p className="italic text-gray-600">No logs found.</p>
            ) : (
              <div className="w-full overflow-x-auto max-w-full">
                <table className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left font-semibold text-gray-700">
                      <th className="border px-4 py-2">Remarks</th>
                      <th className="border px-4 py-2">Officer</th>
                      <th className="border px-4 py-2">Updated By</th>
                      <th className="border px-4 py-2">Event Date</th>
                      <th className="border px-4 py-2">Created At</th>
                      <th className="border px-4 py-2">Status</th>
                      <th className="border px-4 py-2">Log Report</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLogs.map((log, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="border px-4 py-2">{log.status_remarks}</td>
                        <td className="border px-4 py-2">{log.handling_officer}</td>
                        <td className="border px-4 py-2">{log.updated_by}</td>
                        <td className="border px-4 py-2">
                          {new Date(log.time_of_event).toLocaleDateString()}
                        </td>
                        <td className="border px-4 py-2">
                          {new Date(log.created_at).toLocaleString()}
                        </td>
                        <td className="border px-4 py-2">{log.status}</td>
                        <td className="border px-4 py-2 flex justify-center" title={log.pdf_url ? "View PDF" : "No PDF Uploaded"}>
                          {log.pdf_url ? (
                            <Link href={log.pdf_url} target="_blank" aria-label="View PDF">
                              <FileText className="text-blue-600" strokeWidth={2} />
                            </Link>
                          ) : (
                            <FolderUp className="text-gray-500" aria-label="No PDF" />
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {!loading && hasAccess && canAddLogs() && (
          <div className="p-4 bg-white rounded-md mt-3 flex items-start justify-center flex-col">
            <button
              className={`inline-flex items-center justify-center gap-2 text-white py-2 px-3 rounded-sm hover:bg-green-700 ${addingLogs ? "bg-red-500 hover:bg-red-700" : "bg-green-500 hover:bg-green-700"}`}
              onClick={() => setAddingLogs(!addingLogs)}
              type="button"
              aria-label={addingLogs ? "Cancel adding log" : "Add new log"}
            >
              {addingLogs ? <p>Cancel</p> : <p>Add Logs</p>}
              {addingLogs ? <X /> : <Plus />}
            </button>
            {addingLogs && (
              <form ref={formRef} onSubmit={handleSubmit} className="mt-4 w-full flex flex-wrap gap-4">
                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="status" className="font-medium">
                    Status
                  </label>
                  <select
                    id="status"
                    name="status"
                    required
                    className="border p-2 rounded-sm"
                  >
                    <option value="Entry">Entry of item</option>
                    <option value="Departure">Departure of item</option>
                  </select>
                </div>
                {[
                  { name: "status_remarks", label: "Remarks", placeholder: "Optional remarks", required: false },
                  { name: "handling_officer", label: "Handling Officer", placeholder: "Officer name", required: true },
                ].map((field) => (
                  <div key={field.name} className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                    <label htmlFor={field.name} className="font-medium">
                      {field.label}
                    </label>
                    <input
                      id={field.name}
                      name={field.name}
                      required={field.required}
                      placeholder={field.placeholder}
                      className="border p-2 rounded-sm"
                      type="text"
                    />
                  </div>
                ))}
                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="time_of_event" className="font-medium">
                    Time of Event
                  </label>
                  <input
                    id="time_of_event"
                    type="date"
                    name="time_of_event"
                    required
                    className="border p-2 rounded-sm"
                  />
                </div>
                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="reason" className="font-medium">
                    Reason
                  </label>
                  {reason === "Other" ? (
                    <div className="flex justify-between">
                      <input
                        type="text"
                        name="reason"
                        id="reason"
                        required
                        value={customReason}
                        onChange={(e) => setCustomReason(e.target.value)}
                        className="border p-2 rounded-sm w-[80%]"
                      />
                      <button
                        className="w-[15%] h-full bg-gray-50 hover:bg-gray-200 rounded-md"
                        onClick={() => {
                          setCustomReason("");
                          setReason("FSL");
                        }}
                      >
                        X
                      </button>
                    </div>
                  ) : (
                    <select
                      id="reason"
                      name="reason"
                      required
                      value={reason}
                      onChange={(e) => {
                        const selected = e.target.value;
                        setReason(selected);
                        if (selected === "Other") {
                          setCustomReason("Other - ");
                        }
                      }}
                      className="border p-2 rounded-sm"
                    >
                      <option value="FSL">FSL</option>
                      <option value="Court Hearing">Court Hearing</option>
                      <option value="Mulajhma">Mulajhma</option>
                      <option value="Destruction">Destruction</option>
                      <option value="Sutranama">Sutranama</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="pdf-upload" className="font-medium">
                    Upload PDF Report (optional)
                  </label>
                  <div className="relative flex items-center gap-2 mt-1">
                    <input
                      type="file"
                      id="pdf-upload"
                      accept="application/pdf"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setPdfFile(file);
                      }}
                      className="absolute inset-0 w-0 h-0 opacity-0 cursor-pointer"
                      ref={fileInputRef}
                      aria-label="Upload PDF Report"
                    />
                    <button
                      type="button"
                      className="bg-blue-50 text-blue-700 border border-blue-600 py-1 px-4 rounded-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose File
                    </button>
                    <span className="text-sm text-gray-600 truncate max-w-[150px]">
                      {pdfFile ? pdfFile.name : "No file chosen"}
                    </span>
                    {pdfFile && (
                      <button
                        type="button"
                        className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={() => {
                          setPdfFile(null);
                          if (fileInputRef.current) {
                            fileInputRef.current.value = "";
                          }
                        }}
                        aria-label="Clear selected PDF"
                      >
                        <X size={16} />
                      </button>
                    )}
                  </div>
                </div>
                <div className="flex gap-3 w-full justify-start">
                  <button
                    type="submit"
                    className="bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700 disabled:bg-blue-400"
                    disabled={submitting}
                  >
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  <button
                    type="button"
                    className="bg-red-500 text-white py-2 px-4 rounded-sm hover:bg-red-700 disabled:bg-red-400"
                    onClick={handleCancel}
                    disabled={submitting}
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        )}

        <Toaster />
      </div>
    </div>
  );
}