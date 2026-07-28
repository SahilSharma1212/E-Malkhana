"use client";
import supabase from "@/config/supabaseConnect";
import axios from "axios";
import {
  Copy,
  FileText,
  FolderUp,
  Loader2,
  Plus,
  Upload,
  X,
  ShieldAlert,
  Trash2,
} from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import React, { useState, useEffect, FormEvent, useRef, use } from "react";
import toast, { Toaster } from "react-hot-toast";
import { FaFileExcel } from "react-icons/fa";
import QRCode from "react-qr-code";
import * as XLSX from "xlsx";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { StatusBadge } from "@/components/ui/badge";

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
  special_category_type?: string;
  special_category_worth?: number;
  isDismantled: boolean;
}

interface PageProps {
  params: Promise<{
    statusLogsId: string;
  }>;
}

// Safe date formatter — returns "N/A" for missing/invalid timestamps rather
// than the 1970 epoch or "Invalid Date".
const formatDate = (value?: string | null, withTime = false) => {
  if (!value) return "N/A";
  const d = new Date(value);
  if (isNaN(d.getTime())) return "N/A";
  return withTime
    ? d.toLocaleString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      })
    : d.toLocaleDateString("en-IN", {
        day: "2-digit",
        month: "2-digit",
        year: "numeric",
      });
};

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
  const [authError, setAuthError] = useState<boolean>(false);
  const [isDismantling, setIsDismantling] = useState<boolean>(false);
  const [confirmDismantle, setConfirmDismantle] = useState<boolean>(false);
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
  const [imagePreviews, setImagePreviews] = useState<string[]>([]);
  const [uploadingImages, setUploadingImages] = useState<boolean>(false);
  const imageInputRef = useRef<HTMLInputElement>(null);

  // Create object URLs for the selected-but-not-yet-uploaded previews once per
  // selection change, and revoke them on change/unmount so blob URLs don't leak.
  useEffect(() => {
    const urls = newImages.map((f) => URL.createObjectURL(f));
    setImagePreviews(urls);
    return () => {
      urls.forEach((u) => URL.revokeObjectURL(u));
    };
  }, [newImages]);

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
        setAuthError(false);

        // 1. Get user info
        const res = await axios.get('/api/get-token', { withCredentials: true });
        const userData = res.data.user;

        if (!userData) {
          setAuthError(true);
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

        setStatusLogs(logs ?? []);
      } catch (error) {
        console.error("Unexpected error:", error);
        toast.error("An unexpected error occurred");
        setAuthError(true);
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
    if (statusLogs.length === 0) {
      toast.error("No logs to export");
      return;
    }
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

  const dismantleItem = async () => {
    if (isDismantling) return;
    try {
    setIsDismantling(true);

    const { error } = await supabase
      .from("property_table")
      .update({ isDismantled: true })
      .eq("property_id", propertyDetails?.property_id);

    if (error) {
      toast.error("Unable to dismantle");
      return;
    }

    toast.success("Dismantle Successful");

    // get the first log
    const { data: firstLog, error: firstLogError } = await supabase
      .from("status_logs_table")
      .select("id")
      .eq("property_id", propertyDetails?.property_id)
      .order("created_at", { ascending: true }) // order column
      .limit(1)
      .single();

    if (firstLogError) {
      toast.error("Unable to fetch first log");
      return;
    }

    //  deleting all logs except first log
    const { error: deleteError } = await supabase
      .from("status_logs_table")
      .delete()
      .eq("property_id", propertyDetails?.property_id)
      .neq("id", firstLog.id);

    if (deleteError) {
      toast.error("Unable to delete logs");
      return;
    }

    // inserting final log
    const { error: insertError } = await supabase
      .from("status_logs_table")
      .insert([
        {
          property_id: propertyDetails?.property_id,
          status: "DISMANTLED",  // <-- your custom log message/status
          status_remarks: "DISMANTLED",
          time_of_event: new Date().toISOString(),
          created_at: new Date().toISOString() // if you handle timestamps manually
        }
      ])
      .select()
      .single();

    if (insertError) {
      toast.error("Unable to create new log");
    } else {
      toast.success("New log created successfully");
    }

    // Reflect the change locally so the UI updates without a manual refresh:
    // hide the Eliminate button, refresh the (now trimmed) log list.
    setPropertyDetails((prev) => (prev ? { ...prev, isDismantled: true } : prev));

    const { data: refreshedLogs } = await supabase
      .from("status_logs_table")
      .select("*")
      .eq("property_id", propertyDetails?.property_id);
    setStatusLogs(refreshedLogs ?? []);
    setAddingLogs(false);
    } finally {
      setIsDismantling(false);
      setConfirmDismantle(false);
    }
  }

  const currentStatus = propertyDetails?.isDismantled
    ? "Dismantled"
    : propertyDetails?.case_status || "In custody";

  const facts = propertyDetails
    ? [
        { label: "FIR Number", value: propertyDetails.fir_number, mono: true },
        {
          label: "Under Section",
          value: Array.isArray(propertyDetails.under_section)
            ? propertyDetails.under_section.join(", ")
            : propertyDetails.under_section,
        },
        { label: "Description", value: propertyDetails.description },
        { label: "Rack Number", value: propertyDetails.rack_number, mono: true },
        { label: "Box Number", value: propertyDetails.box_number, mono: true },
        { label: "Court Name", value: propertyDetails.name_of_court },
        { label: "Offence Category", value: propertyDetails.category_of_offence },
        { label: "Seizure Date", value: formatDate(propertyDetails.date_of_seizure) },
        { label: "Investigating Officer", value: propertyDetails.name_of_io },
        { label: "Case Status", value: propertyDetails.case_status },
        { label: "Remarks", value: propertyDetails.remarks },
        { label: "Created At", value: formatDate(propertyDetails.created_at, true) },
        { label: "Police Station", value: propertyDetails.police_station },
      ]
    : [];

  return (
    <div className="mx-auto w-full max-w-6xl">
      {/* Page header */}
      <div className="mb-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Evidence Console
        </p>
        <h1 className="mt-1 text-2xl font-semibold tracking-tight text-foreground">
          Property Record
        </h1>
      </div>

      {loading && (
        <div className="flex items-center justify-center gap-2 py-16 text-muted-foreground">
          <Loader2 className="size-5 animate-spin" /> Loading record…
        </div>
      )}

      {!loading && propertyNotFound && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-danger">
              Property with ID &quot;{propertyId}&quot; was not found.
            </p>
            <p className="mt-1 text-sm text-muted-foreground">
              Check the property ID and try again.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && authError && (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10 text-center">
            <p className="font-semibold text-danger">Couldn&apos;t load this record</p>
            <p className="max-w-sm text-sm text-muted-foreground">
              Your session may have expired, or the record couldn&apos;t be reached. Sign in again or retry.
            </p>
            <div className="mt-1 flex gap-3">
              <a
                href="/sign-in"
                className="inline-flex items-center justify-center rounded-sm bg-signal px-4 py-2 text-sm font-semibold text-signal-foreground transition-colors hover:bg-signal/90"
              >
                Sign in
              </a>
              <Button variant="outline" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      {!loading && !authError && !propertyNotFound && !hasAccess && (
        <Card>
          <CardContent className="py-10 text-center">
            <p className="font-semibold text-danger">Access restricted</p>
            <p className="mt-1 text-sm text-muted-foreground">
              You don&apos;t have access to records of another thana. Only thana admins and higher roles can view these.
            </p>
          </CardContent>
        </Card>
      )}

      {!loading && hasAccess && propertyDetails && (
        <div className="space-y-6">
          {/* Record header */}
          <Card>
            <CardContent className="pt-5">
              <div className="flex flex-col gap-6 lg:flex-row">
                {/* QR block */}
                <div className="flex shrink-0 flex-col items-center gap-3 rounded-sm border border-border bg-secondary/50 p-5 lg:w-56">
                  <div className="rounded-sm bg-white p-2.5">
                    <QRCode value={propertyDetails.qr_id} className="h-32 w-32" />
                  </div>
                  <Button variant="outline" size="sm" onClick={handleCopyQRId}>
                    <Copy size={14} /> Copy QR value
                  </Button>
                </div>

                {/* Facts */}
                <div className="min-w-0 flex-1">
                  <div className="mb-4 flex flex-wrap items-center gap-3">
                    <span className="mono-id text-lg font-semibold text-foreground">
                      {propertyDetails.property_id}
                    </span>
                    <StatusBadge status={currentStatus} />
                    {propertyDetails.special_category_type ? (
                      <span className="rounded-sm border border-signal/40 bg-signal/10 px-2 py-0.5 text-xs font-medium text-[color:var(--warning)]">
                        Special · {propertyDetails.special_category_type} · Rs.{" "}
                        {propertyDetails.special_category_worth ?? 0}/-
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Not a special property</span>
                    )}
                  </div>

                  <dl className="grid grid-cols-2 gap-x-6 gap-y-3.5 text-sm md:grid-cols-3">
                    {facts.map((item, index) => (
                      <div key={index} className="min-w-0">
                        <dt className="text-[0.68rem] font-medium uppercase tracking-wide text-muted-foreground">
                          {item.label}
                        </dt>
                        <dd
                          className={`mt-0.5 break-words text-foreground ${item.mono ? "mono-id" : ""}`}
                        >
                          {item.value || "—"}
                        </dd>
                      </div>
                    ))}
                  </dl>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Property images */}
          {propertyDetails?.image_url && propertyDetails.image_url.length > 0 && (
            <Card>
              <CardContent className="pt-5">
                <h2 className="mb-4 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Property Images
                </h2>
                <div className="flex flex-wrap justify-center gap-4">
                  {propertyDetails.image_url.map((url, idx) => (
                    <div
                      key={idx}
                      className="h-56 w-56 overflow-hidden rounded-sm border border-border shadow-sm"
                    >
                      <Image
                        src={url}
                        alt={`Property Image ${idx + 1}`}
                        width={224}
                        height={224}
                        className="h-full w-full object-cover transition-transform duration-300 hover:scale-105"
                        unoptimized
                      />
                    </div>
                  ))}

                  {/* Image upload area */}
                  {canAddLogs() && (
                    <>
                      <input
                        type="file"
                        accept="image/*"
                        multiple
                        onChange={(e) => {
                          const files = e.target.files ? Array.from(e.target.files) : [];
                          if (files.length > 0) setNewImages(files);
                        }}
                        className="hidden"
                        ref={imageInputRef}
                        disabled={uploadingImages}
                      />
                      <div
                        className="flex h-56 w-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-sm border border-dashed border-border bg-secondary/40 transition-colors hover:bg-secondary"
                        onClick={() => !uploadingImages && imageInputRef.current?.click()}
                      >
                        {uploadingImages ? (
                          <>
                            <Loader2 className="size-7 animate-spin text-muted-foreground" />
                            <p className="text-sm text-muted-foreground">Uploading…</p>
                          </>
                        ) : (
                          <>
                            <Upload className="size-7 text-muted-foreground" />
                            <p className="text-sm font-medium text-foreground">Upload images</p>
                            <p className="px-2 text-center text-xs text-muted-foreground">
                              Click to select · max 5MB each
                            </p>
                          </>
                        )}
                      </div>
                    </>
                  )}
                </div>

                {/* Preview selected images before upload */}
                {newImages.length > 0 && (
                  <div className="mt-4 rounded-sm border border-border bg-secondary/40 p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <h3 className="text-sm font-semibold text-foreground">Selected images</h3>
                      <div className="flex gap-2">
                        <Button
                          variant="signal"
                          size="sm"
                          onClick={() => handleImageUpload(newImages)}
                          disabled={uploadingImages}
                        >
                          {uploadingImages ? <Loader2 className="size-4 animate-spin" /> : "Upload"}
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => {
                            setNewImages([]);
                            if (imageInputRef.current) imageInputRef.current.value = "";
                          }}
                          disabled={uploadingImages}
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-4">
                      {newImages.map((file, idx) => (
                        <div key={idx} className="relative">
                          <div className="h-40 w-40 overflow-hidden rounded-sm border border-border shadow-sm">
                            {imagePreviews[idx] && (
                              <Image
                                src={imagePreviews[idx]}
                                alt={`Preview ${idx + 1}`}
                                width={160}
                                height={160}
                                className="h-full w-full object-cover"
                                unoptimized
                              />
                            )}
                          </div>
                          <button
                            onClick={() => setNewImages((prev) => prev.filter((_, i) => i !== idx))}
                            className="absolute -right-1 -top-1 grid size-5 place-items-center rounded-full bg-destructive text-xs text-white hover:bg-destructive/90"
                            disabled={uploadingImages}
                            aria-label="Remove image"
                          >
                            <X size={12} />
                          </button>
                          <p className="mt-1 max-w-40 truncate text-xs text-muted-foreground">{file.name}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Chain of custody */}
          <Card>
            <CardContent className="pt-5">
              <div className="mb-4 flex items-center justify-between">
                <h2 className="text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Chain of Custody
                </h2>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportTableToExcel}
                  disabled={statusLogs.length === 0}
                >
                  <FaFileExcel /> Export
                </Button>
              </div>

              {statusLogs.length === 0 ? (
                <p className="py-6 text-center text-sm italic text-muted-foreground">
                  No custody logs recorded yet.
                </p>
              ) : (
                <ol className="relative ml-2 border-l border-border">
                  {statusLogs.map((log, index) => (
                    <li key={index} className="relative pb-6 pl-6 last:pb-0">
                      {/* Node dot on the rail */}
                      <span
                        className="absolute -left-[6.5px] top-1 size-3 rounded-full border-2 border-card bg-signal"
                        aria-hidden
                      />
                      <div className="flex flex-wrap items-center gap-2">
                        <StatusBadge status={log.status} />
                        <span className="mono-id text-xs text-muted-foreground">
                          {formatDate(log.time_of_event)}
                        </span>
                      </div>
                      <div className="mt-2 rounded-sm border border-border bg-card px-3.5 py-2.5">
                        <div className="grid grid-cols-2 gap-x-5 gap-y-1.5 text-sm md:grid-cols-4">
                          <div>
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Officer</span>
                            <span className="text-foreground">{log.handling_officer ?? "N/A"}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Updated by</span>
                            <span className="text-foreground">{log.updated_by ?? "N/A"}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Reason</span>
                            <span className="text-foreground">{log.reason ?? "N/A"}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Recorded</span>
                            <span className="text-foreground">{formatDate(log.created_at, true)}</span>
                          </div>
                          <div className="col-span-2 md:col-span-3">
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Remarks</span>
                            <span className="text-foreground">{log.status_remarks || "—"}</span>
                          </div>
                          <div>
                            <span className="block text-[0.65rem] uppercase tracking-wide text-muted-foreground">Report</span>
                            {log.pdf_url && log.pdf_url.length > 0 ? (
                              <div className="flex flex-wrap gap-1.5">
                                {log.pdf_url.map((url, idx) => (
                                  <Link key={idx} href={url} target="_blank" aria-label={`View PDF ${idx + 1}`}>
                                    <FileText className="size-4 text-primary" strokeWidth={2} />
                                  </Link>
                                ))}
                              </div>
                            ) : (
                              <FolderUp className="size-4 text-muted-foreground" aria-label="No PDF" />
                            )}
                          </div>
                        </div>
                      </div>
                    </li>
                  ))}
                </ol>
              )}

              {/* Hidden table kept in the DOM so Excel export can read it. */}
              {statusLogs.length > 0 && (
                <table id="data-table" className="sr-only">
                  <thead>
                    <tr>
                      <th>Remarks</th>
                      <th>Officer</th>
                      <th>Updated By</th>
                      <th>Event Date</th>
                      <th>Created At</th>
                      <th>Status</th>
                      <th>Reason</th>
                    </tr>
                  </thead>
                  <tbody>
                    {statusLogs.map((log, index) => (
                      <tr key={index}>
                        <td>{log.status_remarks ?? "N/A"}</td>
                        <td>{log.handling_officer ?? "N/A"}</td>
                        <td>{log.updated_by ?? "N/A"}</td>
                        <td>{formatDate(log.time_of_event)}</td>
                        <td>{formatDate(log.created_at, true)}</td>
                        <td>{log.status}</td>
                        <td>{log.reason}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </CardContent>
          </Card>

          {/* Special property dismantling */}
          {propertyDetails?.special_category_type != '' &&
            propertyDetails?.special_category_type != null &&
            propertyDetails?.special_category_type != undefined &&
            propertyDetails.isDismantled == false && (
              <Card>
                <CardContent className="flex flex-col items-center gap-4 py-4 sm:flex-row">
                  <ShieldAlert className="size-6 shrink-0 text-danger" />
                  <p className="flex-1 text-sm text-foreground">
                    This is a special property. If it has already been submitted / confiscated in
                    court, dismantle its records with the <strong>Eliminate</strong> action.
                  </p>
                  <Button
                    variant="destructive"
                    className="shrink-0"
                    disabled={isDismantling}
                    onClick={() => {
                      if (isDismantling) return;
                      if (!confirmDismantle) {
                        setConfirmDismantle(true);
                        setTimeout(() => setConfirmDismantle(false), 4000);
                        return;
                      }
                      dismantleItem();
                    }}
                  >
                    {isDismantling ? (
                      <Loader2 className="size-4 animate-spin" />
                    ) : (
                      <>
                        <Trash2 className="size-4" /> {confirmDismantle ? 'Confirm eliminate' : 'Eliminate'}
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            )}

          {/* Adding logs */}
          {propertyDetails?.isDismantled == false && canAddLogs() && (
            <Card>
              <CardContent className="pt-5">
                <Button
                  variant={addingLogs ? "outline" : "signal"}
                  onClick={() => setAddingLogs(!addingLogs)}
                  type="button"
                >
                  {addingLogs ? (
                    <>
                      Cancel <X className="size-4" />
                    </>
                  ) : (
                    <>
                      Add Log <Plus className="size-4" />
                    </>
                  )}
                </Button>

                {addingLogs && (
                  <form ref={formRef} onSubmit={handleSubmit} className="mt-4 flex flex-wrap gap-4">
                    <div className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                      <label htmlFor="status" className="text-sm font-medium">Status</label>
                      <select id="status" name="status" required className="text-input w-full">
                        <option value="Entry">Entry of item</option>
                        <option value="Departure">Departure of item</option>
                      </select>
                    </div>

                    {[
                      { name: "status_remarks", label: "Remarks", placeholder: "Optional remarks", required: false },
                      { name: "handling_officer", label: "Handling Officer", placeholder: "Officer name", required: true },
                    ].map((field) => (
                      <div key={field.name} className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                        <label htmlFor={field.name} className="text-sm font-medium">{field.label}</label>
                        <input
                          id={field.name}
                          name={field.name}
                          required={field.required}
                          placeholder={field.placeholder}
                          className="text-input w-full"
                          type="text"
                        />
                      </div>
                    ))}

                    <div className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                      <label htmlFor="time_of_event" className="text-sm font-medium">Time of Event</label>
                      <input id="time_of_event" type="date" name="time_of_event" required className="text-input w-full" />
                    </div>

                    <div className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                      <label htmlFor="reason" className="text-sm font-medium">Reason</label>
                      {reason === "other" ? (
                        <div className="flex gap-2">
                          <input
                            type="text"
                            name="reason"
                            id="reason"
                            required
                            value={customReason}
                            onChange={(e) => setCustomReason(e.target.value)}
                            className="text-input w-full flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="icon"
                            onClick={() => {
                              setCustomReason("");
                              setReason("fsl");
                            }}
                          >
                            <X className="size-4" />
                          </Button>
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
                            if (selected === "other") setCustomReason("other - ");
                          }}
                          className="text-input w-full"
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

                    <div className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                      <label htmlFor="ioBatchNum" className="text-sm font-medium">IO Batch No.</label>
                      <input
                        id="ioBatchNum"
                        required
                        placeholder="Batch Number"
                        className="text-input w-full"
                        type="text"
                        value={ioBatchnum}
                        onChange={(e) => setIOBatchNum(e.target.value)}
                      />
                    </div>

                    <div className="flex w-[30%] flex-col gap-1 max-md:w-[45%] max-sm:w-full">
                      <label htmlFor="pdf-upload" className="text-sm font-medium">Upload PDF Reports (optional)</label>
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
                      <Button type="button" variant="outline" onClick={() => fileInputRef.current?.click()}>
                        Choose files
                      </Button>
                      <div className="mt-1 flex flex-col gap-1">
                        {pdfFiles.map((file, idx) => (
                          <div
                            key={idx}
                            className="flex items-center justify-between rounded-sm border border-border bg-secondary/40 px-2 py-1"
                          >
                            <span className="truncate text-sm">{file.name}</span>
                            <button
                              type="button"
                              className="text-danger hover:opacity-80"
                              onClick={() => setPdfFiles((prev) => prev.filter((_, i) => i !== idx))}
                              aria-label={`Remove ${file.name}`}
                            >
                              <X size={14} />
                            </button>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="flex w-full justify-start gap-3">
                      <Button type="submit" variant="signal" disabled={submitting}>
                        {submitting ? (
                          <>
                            <Loader2 className="size-4 animate-spin" /> Submitting…
                          </>
                        ) : (
                          "Submit log"
                        )}
                      </Button>
                      <Button type="button" variant="outline" onClick={handleCancel} disabled={submitting}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
              </CardContent>
            </Card>
          )}

          {propertyDetails?.isDismantled == true && (
            <div className="rounded-sm border border-danger/30 bg-danger/5 px-4 py-3 text-center text-sm font-medium text-danger">
              This record has been dismantled / submitted to court.
            </div>
          )}
        </div>
      )}

      <Toaster position="top-right" />
    </div>
  );
}
