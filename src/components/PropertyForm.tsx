"use client";
import React, { useRef, useState, useEffect } from "react";
import supabase from "@/supabaseConfig/supabaseConnect";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";

type PropertyFormData = {
  courtName: string;
  firNumber: string;
  offenceCategory: string;
  section: string[]; // <-- Explicitly say it's string[]
  seizureDate: string;
  description1: string;
  ioName: string;
  caseStatus: string;
  rackNumber: string;
  boxNumber: string;
  remarks: string;
  policeStation: string;
  placeOfSeizure: string;
  registerSerialNumber: string;
  typeOfSeizure: string;
};


export default function PropertyForm() {

  const router = useRouter();
  const searchParams = useSearchParams();
  const qrId = searchParams.get("qrId");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [placeOfSeizure, setPlaceOfSeizure] = useState<string>("Place Of Incident"); // default empty or "FSL" if you want
  const [customplaceOfSeizure, setCustomPlaceOfSeizure] = useState<string>(""); // for "Other"

  const [typeOfSeizure, setTypeOfSeizure] = useState<string>("Unclaimed");
  const [customTypeOfSeizure, setCustomTypeOfSeizure] = useState<string>(""); // for "Other"

  const [offenceCategory, setOffenceCategory] = useState<string>("Body Offence")
  const [customOffenceCategory, setCustomOffenceCategory] = useState<string>("")

  const [sectionInput, setSectionInput] = useState("");

  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uuid, setUuid] = useState<string | null>(null);
  const [formData, setFormData] = useState<PropertyFormData>({
    courtName: "",
    firNumber: "",
    offenceCategory: "",
    section: [],
    seizureDate: "",
    description1: "",
    ioName: "",
    caseStatus: "",
    rackNumber: "",
    boxNumber: "",
    remarks: "",
    policeStation: "",
    placeOfSeizure: "",
    registerSerialNumber: "",
    typeOfSeizure: "",
  });
  let PropID: string;

  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
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

    console.log("Form Data Section:", formData.section);
    console.log(formData)


    if (placeOfSeizure === "Other" && !customplaceOfSeizure.trim()) {
      toast.error("Please enter a custom Place of Seizure.");
      return;
    }
    if (typeOfSeizure === "Other" && !customTypeOfSeizure.trim()) {
      toast.error("Please enter a custom Type of Seizure.");
      return;
    }

    if (offenceCategory === "Other" && !customOffenceCategory.trim()) {
      toast.error("Please enter a custom Offence Category.");
      return;
    }

    const finalPlaceOfSeizure = placeOfSeizure === "Other" ? customplaceOfSeizure : placeOfSeizure;
    const finalTypeOfSeizure = typeOfSeizure === "Other" ? customTypeOfSeizure : typeOfSeizure;
    const finalOffenceCategory = offenceCategory === "Other" ? customOffenceCategory : offenceCategory;


    if (!qrId) {
      toast.error("Invalid QR ID in URL.");
      return;
    }

    const requiredFields = [
      formData.courtName,
      formData.firNumber,
      finalOffenceCategory,
      formData.section.length === 0 ? "" : "valid",
      formData.seizureDate,
      formData.description1,
      formData.ioName,
      formData.caseStatus,
      formData.rackNumber,
      formData.boxNumber,
      formData.remarks,
      formData.policeStation,
      finalPlaceOfSeizure,
      formData.registerSerialNumber,
      finalTypeOfSeizure,
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
          name_of_court: formData.courtName,
          fir_number: formData.firNumber,
          category_of_offence: finalOffenceCategory,
          under_section: formData.section,
          date_of_seizure: formData.seizureDate,
          description: formData.description1,
          name_of_io: formData.ioName,
          case_status: formData.caseStatus,
          rack_number: formData.rackNumber,
          box_number: formData.boxNumber,
          remarks: formData.remarks,
          police_station: formData.policeStation,
          image_url: imageUrls,
          place_of_seizure: finalPlaceOfSeizure,
          serial_number_from_register: formData.registerSerialNumber,
          type_of_seizure: finalTypeOfSeizure,
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
            status: "Entry of item",
            status_remarks: formData.remarks,
            handling_officer: formData.ioName,
            reason: "Other - Initial Confestication",
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
      setUuid(PropID);
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
      courtName: "",
      firNumber: "",
      offenceCategory: "",
      section: [],
      seizureDate: "",
      description1: "",
      ioName: "",
      caseStatus: "",
      rackNumber: "",
      boxNumber: "",
      remarks: "",
      policeStation: "",
      placeOfSeizure: "Police Station",
      registerSerialNumber: "",
      typeOfSeizure: "Unclaimed"
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
          {/* Form */}
          <div className="min-h-150 max-lg:h-180 w-[75%] flex lg:flex-wrap max-lg:w-full max-lg:flex-col max-md:flex-col max-md:min-h-280 max-md:align-top">
            <form
              onSubmit={handleSubmit}
              onReset={handleReset}
              className="w-full h-full flex items-center justify-start px-2 py-4 pl-4 gap-3 lg:flex-wrap max-lg:w-full max-md:flex-col max-md:min-h-180 max-md:pt-8 max-lg:flex-wrap"
            >
              {/* Police Station */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Police Station:</label>
                <select
                  name="policeStation"
                  className="text-input flex-1"
                  value={formData.policeStation}
                  onChange={handleChange}
                >
                  <option value="Thana 1">Thana 1</option>
                  <option value="Thana 2">Thana 2</option>
                  <option value="Thana 3">Thana 3</option>
                  <option value="Thana 4">Thana 4</option>
                </select>
              </div>


              {/* Place of Seizure */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Place Of Seizure:</label>
                {placeOfSeizure === "Other" ? (
                  <div className="w-100 h-10 border border-gray-400 text-black rounded-lg max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden">
                    <input
                      type="text"
                      name="placeOfSeizure"
                      id="placeOfSeizure"
                      required
                      value={customplaceOfSeizure}
                      onChange={(e) => setCustomPlaceOfSeizure(e.target.value)}
                      className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                    />
                    <button className="w-[20%] hover:bg-gray-100 h-full rounded-r-md bg-gray-50"
                      type="button"
                      onClick={() => {
                        setPlaceOfSeizure("Police Station");
                        setCustomPlaceOfSeizure("");
                      }}>X</button>
                  </div>
                ) : (
                  <select
                    id="reason"
                    name="reason"
                    required
                    value={placeOfSeizure}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setPlaceOfSeizure(selected);
                      if (selected === "Other") {
                        setCustomPlaceOfSeizure("Other - ");
                      }
                    }}
                    className="text-input flex-1"
                  >
                    <option value="Police Station">Police Station</option>
                    <option value="Place Of Incident">Place Of Incident</option>
                    <option value="Other">Other</option>
                  </select>
                )}
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


              {/* Serial number from register */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">Sno. from register:</label>
                <input
                  name="registerSerialNumber"
                  type="text"
                  placeholder="Ex. 30023"
                  className="text-input flex-1"
                  value={formData.registerSerialNumber}
                  onChange={handleChange}
                />
              </div>

              {/* FIR Number */}
              <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                <label className="max-md:text-sm w-48 font-semibold text-gray-700">FIR Number:</label>
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
                {placeOfSeizure === "Other" ? (
                  <div className="w-100 h-10 border border-gray-400 text-black rounded-lg max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden">
                    <input
                      type="text"
                      name="offenceCategory"
                      id="offenceCategory"
                      required
                      value={customOffenceCategory}
                      onChange={(e) => setCustomOffenceCategory(e.target.value)}
                      className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                    />
                    <button className="w-[20%] hover:bg-gray-100 h-full rounded-r-md"
                      type="button"
                      onClick={() => {
                        setOffenceCategory("Body Offence");
                        setCustomOffenceCategory("");
                      }}>X</button>
                  </div>
                ) : (
                  <select
                    id="offenceCategory"
                    name="offenceCategory"
                    required
                    value={offenceCategory}
                    onChange={(e) => {
                      const selected = e.target.value;
                      setOffenceCategory(selected);
                      if (selected === "Other") {
                        setCustomOffenceCategory("Other - ");
                      }
                    }}
                    className="text-input flex-1"
                  >
                    <option value="Body Offence">Body Offence</option>
                    <option value="Property Offence">Property Offence</option>
                    <option value="Offence Related to C/W">Offence Related to C/W</option>
                    <option value={"Other"}>Other</option>
                  </select>
                )}
              </div>

              {/* Under Section */}
              <div className="flex flex-col gap-1 w-[48%] max-md:w-[80%] max-sm:w-[90%]">

                <div className="flex flex-row items-center w-full">

                  <label className="max-md:text-sm w-48 font-semibold text-gray-700">Under Section:</label>
                  <div className="w-100 h-10 text-black rounded-lg border border-gray-400 max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 flex items-center justify-between overflow-hidden">
                    <input
                      name="section"
                      type="text"
                      placeholder="e.g. 302"
                      className="h-full rounded-md px-1 w-[80%]"
                      value={sectionInput}
                      onChange={(e) => setSectionInput(e.target.value)}
                    />
                    <button
                      type="button"
                      className="h-full p-2 bg-gray-50 w-[15%]"
                      onClick={() => {
                        if (sectionInput.trim() === "") return;

                        const newSection = sectionInput.trim();

                        if (!formData.section.includes(newSection)) {
                          setFormData((prev) => ({
                            ...prev,
                            section: [...prev.section, newSection]
                          }));
                        }

                        setSectionInput("");
                      }}
                    >
                      +
                    </button>


                  </div>
                </div>

                <div className="w-100 text-white overflow-hidden max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-1 flex items-center justify-end ">
                  {formData.section.map((single, index) => (
                    <span
                      key={index}
                      className="bg-gray-700 text-white px-2 py-1 rounded-full flex items-center gap-1"
                    >
                      {single}
                      <button
                        onClick={() => {
                          setFormData(prev => ({
                            ...prev,
                            section: prev.section.filter((_, i) => i !== index)
                          }));
                        }}
                        className="text-red-400 hover:text-red-600 ml-1 font-bold"
                      >
                        &times;
                      </button>
                    </span>
                  ))}

                </div>


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

                {/* Name of IO */}
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
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Type of Seizure:</label>
                    {typeOfSeizure === "Other" ? (
                      <div className="w-100 h-10 border border-gray-400 text-black rounded-lg max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden">
                        <input
                          type="text"
                          name="typeOfSeizure"
                          id="typeOfSeizure"
                          required
                          value={customTypeOfSeizure}
                          onChange={(e) => setCustomTypeOfSeizure(e.target.value)}
                          className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                        />
                        <button className="w-[20%] hover:bg-gray-100 h-full rounded-r-md" onClick={() => {

                          setTypeOfSeizure(""); // or default value
                          setCustomTypeOfSeizure("");
                        }}>X</button>
                      </div>

                    ) : (
                      <select
                        id="typeOfSeizure"
                        name="typeOfSeizure"
                        required
                        value={typeOfSeizure}
                        onChange={(e) => {
                          const selected = e.target.value;
                          setTypeOfSeizure(selected);
                          if (selected === "Other") {
                            setCustomTypeOfSeizure("Other - ");
                          }
                        }}
                        className="text-input flex-1"
                      >
                        <option value="Unclaimed">Unclaimed</option>
                        <option value="Memorendum">Memorendum</option>
                        <option value="Police Station">Police Station</option>
                        <option value="Other">Other</option>
                      </select>
                    )}
                  </div>
                </div>
              </div>

              {/* Property Location details */}
              <div className="flex w-full gap-4 max-md:flex-col items-center">
                <div className="flex flex-col gap-3 w-[48%] max-md:w-[80%] max-sm:w-[90%]">

                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Rack Number:</label>
                    <input
                      name="rackNumber"
                      type="text"
                      placeholder="Rack Number"
                      className="text-input flex-1"
                      value={formData.rackNumber}
                      onChange={handleChange}
                    />
                  </div>

                  <div className="flex items-center">
                    <label className="max-md:text-sm w-48 font-semibold text-gray-700">Box Number:</label>
                    <input
                      name="boxNumber"
                      type="text"
                      placeholder="Box Number"
                      className="text-input flex-1"
                      value={formData.boxNumber}
                      onChange={handleChange}
                    />
                  </div>




                </div>
                <div className="flex items-start justify-between gap-2 w-[48%] max-md:w-[80%] max-sm:w-[90%] flex-col">
                  {/* Remarks */}
                  <div className="flex items-start w-full">
                    <label className="max-md:text-sm w-48 max-md:w-36 pt-2 font-semibold text-gray-700">Remarks:</label>
                    <textarea
                      name="remarks"
                      placeholder="Remarks about Property"
                      className="flex-1 h-35 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>

                </div>
              </div>

              {/* Submit and Reset buttons */}
              <div className="flex justify-center gap-3 w-full mt-4 max-lg:mt-0">
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