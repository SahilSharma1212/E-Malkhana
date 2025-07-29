"use client";
import supabase from "@/supabaseConfig/supabaseConnect";
import { Copy, Plus } from "lucide-react";
import React, { useState, useEffect, FormEvent, use } from "react";
import toast, { Toaster } from "react-hot-toast";
import QRCode from "react-qr-code";

// Define interfaces
interface StatusLog {
  qr_id: string;
  status: string;
  created_at: string;
  handling_officer: string;
  status_remarks: string;
  location: string;
  time_of_event: string;
  updated_by: string;
}

interface PropertyDetails {
  id: string;
  created_at: string;
  property_number: string;
  fir_number: string;
  under_section: string;
  description: string;
  property_tag: string;
  location_of_property: string;
  rack_number: string;
  box_number: string;
  name_of_court: string;
  category_of_offence: string;
  date_of_seizure: string;
  name_of_io: string;
  case_status: string;
  remarks: string;
  image_url: string;
  qr_id: string;
  police_station: string;
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
  const propertyQRId = statusLogsId;

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        // Fetch Property Details
        const { data: property, error: propertyError } = await supabase
          .from("property_table")
          .select("*")
          .eq("qr_id", propertyQRId)
          .single();

        if (propertyError) {
          console.error("❌ Property fetch error:", propertyError.message);
          toast.error("Error Fetching Property Details");
          return;
        }
        setPropertyDetails(property);

        // Fetch Status Logs
        const { data: logs, error: logsError } = await supabase
          .from("status_logs_table")
          .select("*")
          .eq("qr_id", propertyQRId);

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

    if (propertyQRId) {
      fetchData();
    }
  }, [propertyQRId]);

  const handleCopyQRId = async () => {
    try {
      await navigator.clipboard.writeText(propertyQRId);
      toast.success("QR ID copied");
    } catch (error) {
      console.log(error);
      toast.error("Failed to copy QR ID");
    }
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newLog: StatusLog = {
      qr_id: propertyQRId,
      status: formData.get("status") as string,
      status_remarks: formData.get("status_remarks") as string,
      handling_officer: formData.get("handling_officer") as string,
      updated_by: formData.get("updated_by") as string,
      time_of_event: formData.get("time_of_event") as string,
      location: formData.get("location") as string,
      created_at: new Date().toISOString(),
    };

    try {
      const { error } = await supabase.from("status_logs_table").insert([newLog]);

      if (error) {
        console.error("Insert error", error.message);
        toast.error("Failed to add log");
        return;
      }

      toast.success("Log added successfully");
      setStatusLogs((prev) => [...prev, newLog]);
      setAddingLogs(false);
    } catch (error) {
      console.error("Unexpected error:", error);
      toast.error("Failed to add log");
    }
  };

  return (
    <div className="bg-blue-100 p-2 min-h-screen">
      <div className="p-3 bg-white rounded-md pl-8 pt-7">
        {loading && <div className="text-center">Loading...</div>}

        {!loading && propertyDetails && (
          <div className="mb-6 bg-blue-100 p-4 rounded shadow-sm flex flex-col items-center">
            <h2 className="text-3xl font-bold mb-4 text-center">Property Details</h2>
            <div className="flex flex-wrap w-full h-full items-center max-lg:flex-col max-lg:items-center max-sm:items-start gap-5">
              <div className="flex flex-col items-center gap-6 w-[18%] max-md:w-full h-full mb-8 border py-8 rounded-sm border-gray-600 bg-white max-lg:w-70">
                <QRCode value={propertyQRId} className="h-32 w-32" />
                <div className="flex items-center gap-2 bg-blue-100 px-2 py-1 rounded-sm max-w-64 overflow-x-auto">
                  <h2 className="text-sm font-semibold whitespace-nowrap">QR ID:</h2>
                  <p className="text-sm text-gray-700 break-all select-all">
                    {propertyQRId.slice(0, 10) + "..."}
                  </p>
                  <button
                    onClick={handleCopyQRId}
                    title="Copy QR ID"
                    className="hover:text-blue-600"
                    type="button"
                  >
                    <Copy size={15} />
                  </button>
                </div>
              </div>

              {/* Data */}
              <div className="flex justify-justify gap-5 text-sm w-[78%] max-md:w-[100%] h-full max-md:justify-center flex-wrap max-lg:w-[98%]">
                {[
                  { label: "Property Number", value: propertyDetails.property_number },
                  { label: "FIR Number", value: propertyDetails.fir_number },
                  { label: "Under Section", value: propertyDetails.under_section },
                  { label: "Description", value: propertyDetails.description },
                  { label: "Property Tag", value: propertyDetails.property_tag },
                  { label: "Location", value: propertyDetails.location_of_property },
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
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>


        <div className="p-4 bg-white rounded-md mt-3 flex items-center justify-center flex-col">
          <button
            className={`inline-flex items-center justify-center gap-2 bg-green-500 text-white py-2 px-3 rounded-sm hover:bg-green-700 ${addingLogs ? "hidden" : ""}`}
            onClick={() => setAddingLogs(!addingLogs)}
            type="button"
          >
            <p>Add Logs</p>
            <Plus />
          </button>

          {addingLogs && (
            <form onSubmit={handleSubmit} className="mt-4 w-full flex flex-wrap gap-4">
              {[
                { name: "status", label: "Status", placeholder: "Eg. In Forensics" },
                { name: "status_remarks", label: "Remarks", placeholder: "Optional remarks" },
                { name: "handling_officer", label: "Handling Officer", placeholder: "Officer name" },
                { name: "updated_by", label: "Updated By", placeholder: "Username" },
                { name: "location", label: "Location", placeholder: "Eg. Forensics Lab Rajnandgao" },
              ].map((field) => (
                <div key={field.name} className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                  <label htmlFor={field.name} className="font-medium">{field.label}</label>
                  <input
                    name={field.name}
                    required
                    placeholder={field.placeholder}
                    className="border p-2 rounded-sm"
                    type={field.name === "time_of_event" ? "date" : "text"}
                  />
                </div>
              ))}
              <div className="flex flex-col w-[30%] max-md:w-[40%] max-sm:w-[75%]">
                <label htmlFor="time_of_event" className="font-medium">Time of Event</label>
                <input
                  type="date"
                  name="time_of_event"
                  required
                  className="border p-2 rounded-sm"
                />
              </div>
              <div className="flex gap-3 w-full justify-center">
                <button type="submit" className="bg-blue-600 text-white py-2 px-4 rounded-sm hover:bg-blue-700">
                  Submit
                </button>
                <button
                  type="button"
                  onClick={() => setAddingLogs(false)}
                  className="py-2 px-4 rounded-sm border hover:bg-gray-100"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}
        </div>
        <Toaster />
      </div>
    </div>
  );
}