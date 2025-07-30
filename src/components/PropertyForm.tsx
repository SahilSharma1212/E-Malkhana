"use client";
import React, { useRef, useState, useEffect } from "react";
import supabase from "@/supabaseConfig/supabaseConnect";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

export default function PropertyForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const qrId = searchParams.get("qrId");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uuid, setUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    propertyNumber: "",
    courtName: "",
    firNumber: "",
    offenceCategory: "",
    section: "",
    seizureDate: "",
    description1: "",
    ioName: "",
    caseStatus: "",
    updationDate: "",
    propertyTag: "",
    propertyLocation: "",
    rackNumber: "",
    boxNumber: "",
    remarks: "",
    policeStation: "",
  });
  let PropID: string;

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validNewFiles = files.filter(
      file => validTypes.includes(file.type) && file.size <= maxSize
    );

    const invalidFiles = files.filter(
      file => !validTypes.includes(file.type) || file.size > maxSize
    );

    if (invalidFiles.length > 0) {
      toast.error('Some files are invalid. Only PNG, JPEG under 5MB allowed.');
    }

    const totalFiles = selectedFiles.length + validNewFiles.length;
    if (totalFiles > 10) {
      toast.error("You can upload a maximum of 10 images.");
      return;
    }

    const newPreviews = validNewFiles.map(file => URL.createObjectURL(file));

    setSelectedFiles(prev => [...prev, ...validNewFiles]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];

    newFiles.splice(indexToRemove, 1);
    URL.revokeObjectURL(newPreviews[indexToRemove]);
    newPreviews.splice(indexToRemove, 1);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };



  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    if (!qrId) {
      toast.error("Invalid QR ID in URL.");
      return;
    }

    const requiredFields = [
      formData.propertyNumber,
      formData.courtName,
      formData.firNumber,
      formData.offenceCategory,
      formData.section,
      formData.seizureDate,
      formData.description1,
      formData.ioName,
      formData.caseStatus,
      formData.updationDate,
      formData.propertyTag,
      formData.propertyLocation,
      formData.rackNumber,
      formData.boxNumber,
      formData.remarks,
      formData.policeStation,
    ];

    const isEmpty = requiredFields.some(field => !field || field.trim?.() === '');
    if (isEmpty || selectedFiles.length === 0) {
      toast.error("Please fill all fields and select at least one image before submitting.");
      return;
    }

    setUploading(true);

    try {
      // Upload images
      const uploadPromises = selectedFiles.map(async (file) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        const filePath = `image-proof/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from('property-images')
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`Image upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from('property-images')
          .getPublicUrl(filePath);

        return urlData.publicUrl;
      });

      const imageUrls = await Promise.all(uploadPromises);
      const newPropertyId = uuidv4();
      PropID = newPropertyId;

      // Update existing row with qr_id == url
      const { error: updateError } = await supabase
        .from("property_table")
        .update({
          property_id: newPropertyId,
          property_number: formData.propertyNumber,
          name_of_court: formData.courtName,
          fir_number: formData.firNumber,
          category_of_offence: formData.offenceCategory,
          under_section: formData.section,
          date_of_seizure: formData.seizureDate,
          description: formData.description1,
          name_of_io: formData.ioName,
          case_status: formData.caseStatus,
          updation_date: formData.updationDate,
          property_tag: formData.propertyTag,
          location_of_property: formData.propertyLocation,
          rack_number: formData.rackNumber,
          box_number: formData.boxNumber,
          remarks: formData.remarks,
          police_station: formData.policeStation,
          image_url: imageUrls,
        })
        .eq("qr_id", window.location.href);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Error updating property.");
        setUploading(false);
        return;
      }

      // Insert into status_logs_table as before
      const { error: statusError } = await supabase
        .from("status_logs_table")
        .insert([
          {
            property_id: PropID,
            status: "Initial entry of the item",
            status_remarks: formData.remarks,
            handling_officer: formData.ioName,
            location: formData.propertyLocation,
            updated_by: formData.ioName,
            time_of_event: new Date().toISOString(),
          },
        ]);

      if (statusError) {
        toast.error("Couldn't create initial status log");
        setUploading(false);
        return;
      }

      setIsSubmitted(true);
      setUuid(PropID); // show this as confirmation
      toast.success("Property updated successfully!");
      toast.success("Initial status updated");

    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };


  const handleReset = () => {
    setFormData({
      propertyNumber: "",
      courtName: "",
      firNumber: "",
      offenceCategory: "",
      section: "",
      seizureDate: "",
      description1: "",
      ioName: "",
      caseStatus: "",
      updationDate: "",
      propertyTag: "",
      propertyLocation: "",
      rackNumber: "",
      boxNumber: "",
      remarks: "",
      policeStation: "",
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };


  return (
    <>
      {isSubmitted && uuid ? (
        <div
          className={`transition-all duration-300 ease-in-out ${isSubmitted ? "flex" : "hidden"} flex-col items-center justify-center w-[80%] max-lg:w-full bg-white rounded-xl shadow-lg p-6 gap-4 pt-5`}
        >
          <h2 className="text-3xl font-bold text-green-600">Form Submitted Sucessfully !</h2>
          <p className="text-gray-700 font-medium text-center">
            Your unique property ID is shown below:
          </p>
          <div className="flex flex-col items-center gap-2">

            <div className="flex items-center gap-2 mt-2 bg-gray-100 px-4 py-2 rounded-md">
              <span className="font-mono text-sm text-gray-800">{uuid}</span>
              <button
                onClick={() => {
                  navigator.clipboard.writeText(PropID || "");
                  toast.success("QR ID copied");
                }}
                className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 text-xs rounded-md font-semibold"
              >
                Copy
              </button>
            </div>
          </div>
          <p className="text-sm text-gray-500 mt-2 text-center">
            Save this ID to retrieve your property information later.
          </p>
          <button
            onClick={() => {
              setIsSubmitted(false);
              setUuid(null);
              handleReset();
              router.push(`/search-property/${PropID}`)
            }}
            className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
          >
            View Logs
          </button>
        </div>
      ) : (
        <div className={`flex items-center justify-around bg-white w-[80%] max-lg:w-[100%] max-lg:flex-col ${isSubmitted ? "hidden" : "flex"} max-sm:scale-95`}>
          <div className="min-h-150 w-[75%] flex lg:flex-wrap max-lg:w-full max-lg:flex-col max-md:flex-col max-md:min-h-280 max-md:align-top">
            <form
              onSubmit={handleSubmit}
              onReset={handleReset}
              className="w-full h-full flex items-center justify-start px-2 py-4 pl-4 gap-3 lg:flex-wrap max-lg:w-full max-md:flex-col max-md:min-h-180 max-md:pt-8 max-lg:flex-wrap"
            >
              {/* Property Number */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Property Number:</label>
                <input
                  name="propertyNumber"
                  type="text"
                  placeholder="Property Number"
                  className="text-input flex-1"
                  value={formData.propertyNumber}
                  onChange={handleChange}
                />
              </div>
              {/* Name of Court */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Name of Court:</label>
                <input
                  name="courtName"
                  type="text"
                  placeholder="Name of Court"
                  className="text-input flex-1"
                  value={formData.courtName}
                  onChange={handleChange}
                />
              </div>
              {/* FIR Number */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">FFIR Number:</label>
                <input
                  name="firNumber"
                  type="text"
                  placeholder="FIR Number"
                  className="text-input flex-1"
                  value={formData.firNumber}
                  onChange={handleChange}
                />
              </div>
              {/* Category of Offence */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Category of Offence:</label>
                <input
                  name="offenceCategory"
                  type="text"
                  placeholder="Category of Offence"
                  className="text-input flex-1"
                  value={formData.offenceCategory}
                  onChange={handleChange}
                />
              </div>
              {/* Under Section */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Under Section:</label>
                <input
                  name="section"
                  type="text"
                  placeholder="Under Section"
                  className="text-input flex-1"
                  value={formData.section}
                  onChange={handleChange}
                />
              </div>
              {/* Date of Seizure */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Date of Seizure:</label>
                <input
                  name="seizureDate"
                  type="date"
                  className="text-input flex-1"
                  value={formData.seizureDate}
                  onChange={handleChange}
                />
              </div>
              {/* Description and IO Details */}
              <div className="flex w-full gap-4 max-md:flex-col items-center">
                <div className="flex items-start w-[48%] max-md:w-[80%] max-sm:w-[90%] flex-col">
                  <div className="flex items-start w-full">
                    <label className="max-md:text-sm w-48 max-md:w-36 pt-2 font-semibold text-gray-700">Description:</label>
                    <textarea
                      name="description1"
                      placeholder="Description of Property"
                      className="flex-1 h-35 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                      value={formData.description1}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex flex-col gap-3 w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Name of IO:</label>
                    <input
                      name="ioName"
                      type="text"
                      placeholder="Name of IO"
                      className="text-input flex-1"
                      value={formData.ioName}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Case Status:</label>
                    <input
                      name="caseStatus"
                      type="text"
                      placeholder="Status of Case Property"
                      className="text-input flex-1"
                      value={formData.caseStatus}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Updation Date:</label>
                    <input
                      name="updationDate"
                      type="date"
                      placeholder="Enter Name"
                      className="text-input flex-1"
                      value={formData.updationDate}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              {/* Property Location details */}
              <div className="flex w-full gap-4 max-md:flex-col items-center">
                <div className="flex flex-col gap-3 w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Property Tag:</label>
                    <input
                      name="propertyTag"
                      type="text"
                      placeholder="Tag"
                      className="text-input flex-1"
                      value={formData.propertyTag}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Location of Property:</label>
                    <input
                      name="propertyLocation"
                      type="text"
                      placeholder="Location"
                      className="text-input flex-1"
                      value={formData.propertyLocation}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-end gap-2 flex-wrap max-xl:flex-col max-xl:items-end max-md:items-end max-md:h-20 max-xl:h-18 max-md:flex-row">
                    <input
                      name="rackNumber"
                      type="text"
                      placeholder="Rack No."
                      className="w-100 h-10 text-black rounded-lg px-3 border border-gray-400 max-lg:w-64 max-md:text-sm flex-1 max-xl:w-44 max-md:w-60 max-sm:w-28"
                      value={formData.rackNumber}
                      onChange={handleChange}
                    />
                    <input
                      name="boxNumber"
                      type="text"
                      placeholder="Box No."
                      className="w-100 h-10 text-black rounded-lg px-3 border border-gray-400 max-lg:w-64 max-md:text-sm flex-1 max-xl:w-44 max-sm:w-28"
                      value={formData.boxNumber}
                      onChange={handleChange}
                    />
                  </div>
                </div>
                <div className="flex items-start justify-between gap-2 w-[48%] max-md:w-[80%] max-sm:w-[90%] flex-col">
                  <div className="flex items-start w-full">
                    <label className="max-md:text-sm w-48 max-md:w-36 pt-2 font-semibold text-gray-700">Remarks:</label>
                    <textarea
                      name="remarks"
                      placeholder="Remarks about Property"
                      className="flex-1 h-20 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>
                  <div className="flex items-center max-sm:items-start justify-between">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700 max-sm:max-w-32 max-xl:w-38 max-lg:w-48 max-md:w-48 max-2xl:w-38">Police Station:</label>
                    <input
                      name="policeStation"
                      type="text"
                      placeholder="Name of Police Station"
                      className="max-sm:text-xs w-58 h-10 text-black rounded-lg px-3 border border-gray-400 max-xl:w-44 max-2xl:w-50 flex-1 max-lg:w-48 max-md:w-64 max-sm:w-full"
                      value={formData.policeStation}
                      onChange={handleChange}
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-center gap-3 w-full mt-4">
                <button
                  type="submit"
                  disabled={uploading}
                  className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 active:bg-blue-600 disabled:bg-gray-400"
                >
                  {uploading ? 'Submitting...' : 'Submit'}
                </button>
                <button
                  type="reset"
                  className="text-blue-700 border-blue-500 border px-4 py-2 rounded-md font-semibold hover:bg-gray-200"
                >
                  Reset
                </button>
              </div>
            </form>
          </div>
          {/* Image Upload Area */}
          <div className="flex items-center justify-evenly flex-col h-full bg-gray-100 w-[25%] rounded-r-lg p-4 max-lg:w-full max-lg:rounded-lg max-lg:mt-4">
            <Image height={84} width={54} src={'/e-malkhana.png'} alt="E-Malkhana Logo" />

            <input
              type="file"
              accept="image/png,image/jpeg,image/jpg"
              ref={fileInputRef}
              onChange={handleFileChange}
              multiple
              className="hidden"
            />
            <button
              onClick={() => fileInputRef.current?.click()}
              className="mt-2 bg-blue-600 text-white text-sm px-3 py-1 rounded hover:bg-blue-700"
            >
              Choose Images
            </button>
            {previewUrls.length > 0 ? (
              <div className="mt-4 grid grid-cols-2 gap-2">
                {previewUrls.map((url, index) => (
                  <div key={index} className="relative w-[60px] h-[60px]">
                    <Image
                      src={url}
                      alt={`Preview ${index + 1}`}
                      width={60}
                      height={60}
                      className="rounded-md border border-gray-300 shadow"
                    />
                    <button
                      onClick={() => handleRemoveFile(index)}
                      className="absolute -top-2 -right-2 bg-red-600 text-white rounded-full w-4 h-4 text-xs flex items-center justify-center hover:bg-red-700"
                      title="Remove"
                      type="button"
                    >
                      X
                    </button>
                  </div>
                ))}

              </div>
            ) : (
              <div className="mt-4 w-[160px] h-[160px] border border-dashed border-gray-400 rounded-md flex items-center justify-center text-sm text-gray-500">
                No images selected
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}