"use client";
import Loading from "@/app/loading";
import supabase from "@/config/supabaseConnect";
import axios from "axios";
import { Copy, FileText, FolderUp, Loader2, Plus, Upload, X } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, FormEvent, useRef, use } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";

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
  io_batch_number: string;
  pdf_url: string[];
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
  image_url: string[];
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
  const [ioBatchnum, setIOBatchNum] = useState("")
  const { statusLogsId } = use(params);
  const [propertyDetails, setPropertyDetails] = useState<PropertyDetails | null>(null);
  const [statusLogs, setStatusLogs] = useState<StatusLog[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [addingLogs, setAddingLogs] = useState<boolean>(false);
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [hasAccess, setHasAccess] = useState<boolean>(false);
  const [propertyNotFound, setPropertyNotFound] = useState<boolean>(false);
  const propertyId = statusLogsId;
  const [pdfFiles, setPdfFiles] = useState<File[]>([]);
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
  const [newImages, setNewImages] = useState<File[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  const handleImageUpload = async (files: File[]) => {
    if (!propertyDetails) return;

    setUploadingImages(true);

    try {
      // Prepare files with type (following your existing structure)
      const selectedFiles = files.map(file => ({ file, type: 'image' }));

      const uploadPromises = selectedFiles.map(async ({ file, type }) => {
        // Validate file type
        if (!file.type.startsWith('image/')) {
          toast.error(`${file.name} is not an image file`);
          return null;
        }

        // Validate file size (5MB limit)
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`${file.name} is larger than 5MB`);
          return null;
        }

        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const bucket = type === 'image' ? 'property-images' : 'property-images';
        const filePath = `image_proof/property-images/image_proof/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(bucket)
          .upload(filePath, file);

        if (uploadError) {
          console.error(`Upload error for ${file.name}:`, uploadError);
          toast.error(`Failed to upload ${file.name}`);
          return null;
        }

        const { data: urlData } = supabase.storage
          .from(bucket)
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      // Wait for all uploads to complete
      const results = await Promise.all(uploadPromises);

      // Filter out failed uploads (null values)
      const successfulUrls = results.filter(url => url !== null) as string[];

      if (successfulUrls.length > 0) {
        // Update the property record in the database
        const updatedImageUrls = [...(propertyDetails.image_url || []), ...successfulUrls];

        const { error: updateError } = await supabase
          .from("property_table")
          .update({ image_url: updatedImageUrls })
          .eq("property_id", propertyDetails.property_id);

        if (updateError) {
          console.error("Database update error:", updateError);
          toast.error("Failed to update property images");
          return;
        }

        // Update local state
        setPropertyDetails(prev => prev ? {
          ...prev,
          image_url: updatedImageUrls
        } : null);

        toast.success(`${successfulUrls.length} image(s) uploaded successfully`);

        if (results.length > successfulUrls.length) {
          const failedCount = results.length - successfulUrls.length;
          toast.error(`${failedCount} image(s) failed to upload`);
        }

        setNewImages([]);
        if (imageInputRef.current) {
          imageInputRef.current.value = "";
        }
      }
    } catch (error) {
      console.error("Error uploading images:", error);
      toast.error("Failed to upload images");
    } finally {
      setUploadingImages(false);
    }
  };



  // Fetch property details and status logs
  useEffect(() => {
    const init = async () => {
      try {
        setLoading(true);
        setPropertyNotFound(false);

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

        // 2. Fetch property - handle non-existent properties properly
        const { data: propertyArray, error: propertyError } = await supabase
          .from("property_table")
          .select("*")
          .eq("property_id", propertyId);

        // Handle different error scenarios
        if (propertyError) {
          console.error("❌ Property fetch error:", propertyError.message);
          toast.error("Error fetching property details");
          setLoading(false);
          return;
        }

        // Check if property exists
        if (!propertyArray || propertyArray.length === 0) {
          console.log("❌ Property not found:", propertyId);
          setPropertyNotFound(true);
          setHasAccess(false);
          setLoading(false);
          return;
        }

        const property = propertyArray[0];

        // 3. Check access logic - now we know property exists
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

  // function to export to excel sheet
  const exportTableToExcel = () => {
    const table = document.getElementById('data-table');
    if (!table) return;

    const workbook = XLSX.utils.table_to_book(table, { sheet: 'Sheet1' });
    XLSX.writeFile(workbook, `property_logs_${propertyDetails?.id}.xlsx`);
  };

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
    const reasonFinal = reason === "other" ? customReason : reason;

    if (!status || !handling_officer || !updated_by || !time_of_event || !reason || !ioBatchnum) {
      toast.error("Please fill all required fields");
      setSubmitting(false);
      return;
    }

    const pdfUrls: string[] = [];

    try {
      if (pdfFiles.length > 0) {
        for (const file of pdfFiles) {
          if (file.size > 5 * 1024 * 1024) {
            toast.error(`File ${file.name} is larger than 5MB`);
            setSubmitting(false);
            return;
          }

          const fileName = `pdf_reports/${Date.now()}_${file.name}`;
          const { error: uploadError } = await supabase.storage
            .from("property-images")
            .upload(fileName, file);

          if (uploadError) {
            toast.error(`Failed to upload ${file.name}`);
            setSubmitting(false);
            return;
          }

          const { data: urlData } = supabase.storage
            .from("property-images")
            .getPublicUrl(fileName);
          pdfUrls.push(urlData.publicUrl);
        }
      }

      const newLog: StatusLog = {
        property_id: propertyId,
        status: status.toLowerCase(),
        status_remarks: status_remarks || "",
        handling_officer,
        updated_by: user.name,
        time_of_event,
        reason: reasonFinal.toLowerCase(),
        created_at: new Date().toISOString(),
        io_batch_number: ioBatchnum,
        pdf_url: pdfUrls,
      };

      const { error } = await supabase.from("status_logs_table").insert([newLog]);

      if (error) {
        throw new Error(`Insert error: ${error.message}`);
      }

      toast.success("Log added successfully");
      if (pdfUrls.length > 0) {
        toast.success(`${pdfUrls.length} PDF(s) added`);
      }

      setPdfFiles([]);
      setIOBatchNum("");
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
    setPdfFiles([]);
    setIOBatchNum("");
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
      <div className="p-3 bg-white rounded-md pl-8 max-sm:pl-4 pt-7">
        {loading && <div className="flex items-center justify-center text-blue-500"><Loader2 className="animate-spin" /></div>}

        {!loading && propertyNotFound && (
          <div className="text-center text-red-600 font-semibold">
            Property with ID &quot;{propertyId}&quot; not found. Please check the property ID and try again.
          </div>
        )}

        {!loading && !propertyNotFound && !hasAccess && (
          <div className="text-center text-red-600 font-semibold">
            You don&apos;t have access to property of other thana. Only thana admins and higher roles have this access.
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
                    label: "Under Section",
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
        {/* Rendering images if available... */}
        {!loading && hasAccess && propertyDetails?.image_url && propertyDetails.image_url.length > 0 && (
          // Replace the existing upload div with this enhanced version:
          <div className="mb-8 bg-blue-50 rounded-md p-4 shadow-sm w-full">
            <h2 className="text-2xl font-bold mb-4 text-center text-gray-700">Property Images</h2>
            <div className="flex flex-wrap justify-center gap-4">
              {propertyDetails.image_url && propertyDetails.image_url.length > 0 &&
                propertyDetails.image_url.map((url, idx) => (
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
                ))
              }

              {/* Enhanced Upload Area */}
              {canAddLogs() && (
                <>
                  <input
                    type="file"
                    accept="image/*"
                    multiple
                    onChange={(e) => {
                      const files = e.target.files ? Array.from(e.target.files) : [];
                      if (files.length > 0) {
                        setNewImages(files);
                      }
                    }}
                    className="hidden"
                    ref={imageInputRef}
                    disabled={uploadingImages}
                  />

                  <div
                    className="h-[240px] w-[240px] border border-dashed border-gray-700 rounded-xl bg-black/5 flex items-center justify-center flex-col gap-3 relative cursor-pointer hover:bg-black/10 transition-colors"
                    onClick={() => !uploadingImages && imageInputRef.current?.click()}
                  >
                    {uploadingImages ? (
                      <>
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-gray-700"></div>
                        <p className="text-sm">Uploading...</p>
                      </>
                    ) : (
                      <>
                        <Upload className="text-gray-600" size={32} />
                        <p className="text-gray-600 font-medium">Upload Images</p>
                        <p className="text-xs text-gray-500 text-center px-2">
                          Click to select multiple images
                          <br />
                          (Max 5MB each)
                        </p>
                      </>
                    )}
                  </div>
                </>
              )}
            </div>

            {/* Preview selected images before upload */}
            {newImages.length > 0 && (
              <div className="mt-4 p-4 bg-black/10 rounded border">
                <div className="flex justify-between items-center mb-3">
                  <h3 className="font-semibold">Selected Image</h3>
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleImageUpload(newImages)}
                      disabled={uploadingImages}
                      className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 disabled:bg-blue-400 text-sm"
                    >
                      {uploadingImages ? <Loader2 /> : "Upload"}
                    </button>
                    <button
                      onClick={() => {
                        setNewImages([]);
                        if (imageInputRef.current) imageInputRef.current.value = "";
                      }}
                      disabled={uploadingImages}
                      className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 disabled:bg-red-400 text-sm"
                    >
                      Cancel
                    </button>
                  </div>
                </div>

                <div className="flex items-center justify-center">
                  {newImages.map((file, idx) => (
                    <div key={idx} className="relative">
                      <div className="w-60 h-60 overflow-hidden rounded border border-gray-300 shadow-sm">
                        <Image
                          src={URL.createObjectURL(file)}
                          alt={`Preview ${idx + 1}`}
                          width={200}
                          height={200}
                          className="w-full h-full object-cover"
                          unoptimized
                        />
                      </div>
                      <button
                        onClick={() => setNewImages(prev => prev.filter((_, i) => i !== idx))}
                        className="absolute -top-1 right-0 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center text-xs hover:bg-red-600"
                        disabled={uploadingImages}
                      >
                        X
                      </button>
                      <p className="text-xs text-gray-600 mt-1 truncate">{file.name}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Logs */}
        {!loading && hasAccess && (
          <div className="flex flex-col items-center">
            <h1 className="text-3xl font-bold text-blue-700 mb-2">Status Logs</h1>
            {statusLogs.length === 0 ? (
              <p className="italic text-gray-600">No logs found.</p>
            ) : (
              <div className="w-full overflow-x-auto max-w-full">
                <table id="data-table" className="min-w-full border border-gray-300 text-sm">
                  <thead>
                    <tr className="bg-gray-100 text-left font-semibold text-gray-700">
                      <th className="border px-4 py-2">Remarks</th>
                      <th className="border px-4 py-2">Officer</th>
                      <th className="border px-4 py-2">Updated By</th>
                      <th className="border px-4 py-2">Event Date</th>
                      <th className="border px-4 py-2">Created At</th>
                      <th className="border px-4 py-2">Status</th>
                      <th className="border px-4 py-2">Reason</th>
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
                        <td className="border px-4 py-2">{log.reason}</td>
                        <td className="border px-4 py-2 flex justify-center" title={log.pdf_url.length > 0 ? "View PDFs" : "No PDFs Uploaded"}>
                          {log.pdf_url.length > 0 ? (
                            <div className="flex flex-wrap gap-1">
                              {log.pdf_url.map((url, idx) => (
                                <Link key={idx} href={url} target="_blank" aria-label={`View PDF ${idx + 1}`}>
                                  <FileText className="text-blue-600" strokeWidth={2} />
                                </Link>
                              ))}
                            </div>
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

            <div className="py-3 px-3 flex justify-end items-center w-full">
              <button
                className="border border-green-500 border-dashed px-3 py-2 bg-green-50 hover:bg-green-200 rounded-md flex items-center justify-center gap-2 text-green-700"
                onClick={exportTableToExcel}
              >
                <span>Export</span>
                <FaFileExcel />
              </button>
            </div>
          </div>
        )}
        {/* Adding Logs */}
        {!loading && hasAccess && canAddLogs() && (
          <div className="p-4 bg-white rounded-md mt-3 flex items-start justify-center flex-col">
            <button
              className={`inline-flex items-center justify-center gap-2 text-white py-2 px-3 rounded-sm hover:bg-green-700 ${addingLogs ? "bg-red-500 hover:bg-red-700" : "bg-blue-500 hover:bg-blue-700"}`}
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
                  {reason === "other" ? (
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
                        type="button"
                        className="w-[15%] h-full bg-gray-50 hover:bg-gray-200 rounded-md"
                        onClick={() => {
                          setCustomReason("");
                          setReason("fsl");
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
                        if (selected === "other") {
                          setCustomReason("other - ");
                        }
                      }}
                      className="border p-2 rounded-sm"
                    >
                      <option value="fsl">FSL</option>
                      <option value="court">Court</option>
                      <option value="mulaiza">Mulaiza</option>
                      <option value="medical unit">Medical Unit</option>
                      <option value="cyber lab">Cyber Lab</option>
                      <option value="destruction">Destruction</option>
                      <option value="sutranama">Sutranama</option>
                      <option value="other">other</option>
                    </select>
                  )}
                </div>

                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="ioBatchNum" className="font-medium">
                    IO Batch No.
                  </label>
                  <input
                    required
                    placeholder="Batch Number"
                    className="border p-2 rounded-sm"
                    type="text"
                    value={ioBatchnum}
                    onChange={(e) => setIOBatchNum(e.target.value)}
                  />
                </div>
                <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor="pdf-upload" className="font-medium">
                    Upload PDF Reports (optional)
                  </label>
                  <div className="relative flex flex-col gap-2 mt-1">
                    <input
                      type="file"
                      id="pdf-upload"
                      accept="application/pdf"
                      multiple
                      onChange={(e) => {
                        const files = e.target.files ? Array.from(e.target.files) : [];
                        setPdfFiles((prev) => [...prev, ...files]);
                      }}
                      className="hidden"
                      ref={fileInputRef}
                      aria-label="Upload PDF Reports"
                    />
                    <button
                      type="button"
                      className="bg-blue-50 text-blue-700 border border-blue-600 py-1 px-4 rounded-sm hover:bg-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 focus:ring-offset-2 transition-colors"
                      onClick={() => fileInputRef.current?.click()}
                    >
                      Choose Files
                    </button>
                    <div className="flex flex-col gap-1">
                      {pdfFiles.map((file, idx) => (
                        <div
                          key={idx}
                          className="flex items-center justify-between bg-gray-50 px-2 py-1 rounded border"
                        >
                          <span className="text-sm truncate">{file.name}</span>
                          <button
                            type="button"
                            className="text-red-600 hover:text-red-800 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                            onClick={() => setPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                            aria-label={`Remove ${file.name}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ))}
                    </div>
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