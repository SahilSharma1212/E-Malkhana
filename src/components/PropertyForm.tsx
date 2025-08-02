"use client";
import React, { useRef, useState, useEffect } from "react";
import supabase from "@/config/supabaseConnect";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";

type PropertyFormData = {
  courtName: string;
  firNumber: string;
  offenceCategory: string;
  section: string[];
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
  const [placeOfSeizure, setPlaceOfSeizure] = useState<string>("Place Of Incident");
  const [customplaceOfSeizure, setCustomPlaceOfSeizure] = useState<string>("");
  const [typeOfSeizure, setTypeOfSeizure] = useState<string>("unclaimed");
  const [customTypeOfSeizure, setCustomTypeOfSeizure] = useState<string>("");
  const [offenceCategory, setOffenceCategory] = useState<string>("Body Offence");
  const [customOffenceCategory, setCustomOffenceCategory] = useState<string>("");
  const [sectionInput, setSectionInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<File[]>([]);
  const [previewUrls, setPreviewUrls] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uuid, setUuid] = useState<string | null>(null);
  const [user, setUser] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
  });
  const [thanaData, setThanaData] = useState<{ thana: string; racks: string[]; boxes: string[] }[]>([]);
  const [racks, setRacks] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);

  const [formData, setFormData] = useState<PropertyFormData>({
    courtName: "",
    firNumber: "",
    offenceCategory: "body offence",
    section: [],
    seizureDate: "",
    description1: "",
    ioName: "",
    caseStatus: "",
    rackNumber: "",
    boxNumber: "",
    remarks: "s",
    policeStation: user.thana,
    placeOfSeizure: "police station",
    registerSerialNumber: "",
    typeOfSeizure: "unclaimed",
  });

  let PropId: string
  // Cleanup preview URLs to prevent memory leaks
  useEffect(() => {
    return () => {
      previewUrls.forEach(url => URL.revokeObjectURL(url));
    };
  }, [previewUrls]);

  // Fetch user data from token
  useEffect(() => {
    async function checkAuth() {
      try {
        const res = await axios.get("/api/get-token", {
          withCredentials: true,
        });

        if (res.data.authenticated) {
          const { name, email, role, thana } = res.data.user;
          setUser({ name, email, role, thana });
          console.log("✅ Set user:", { name, email, role, thana });
          // Set policeStation for thana admin
          if (role === "thana admin") {
            setFormData(prev => ({ ...prev, policeStation: thana }));
          }
        }
      } catch (error) {
        console.error("❌ Auth error:", error);
      }
    }

    checkAuth();
  }, []);

  // Fetch thanas, racks, and boxes on initial load for admin and super admin
  useEffect(() => {
    const fetchThanaData = async () => {
      if (user.role !== "admin" && user.role !== "super admin") return;

      const { data, error } = await supabase
        .from("thana_rack_box_table")
        .select("thana, racks, boxes");

      if (error) {
        console.error("Error fetching thana data:", error.message);
        toast.error("Failed to load thana data");
        return;
      }

      setThanaData(data);
      const uniqueThanas = [...new Set(data.map((item) => item.thana))];
      setThanas(uniqueThanas);
    };

    if (user.role) {
      fetchThanaData();
    }
  }, [user.role]);

  // Update racks and boxes based on selected police station
  useEffect(() => {
    const selectedThana = user.role === "thana admin" ? user.thana : formData.policeStation;
    if (!selectedThana) {
      setRacks([]);
      setBoxes([]);
      return;
    }

    const selectedData = thanaData.find(item => item.thana === selectedThana);
    if (selectedData) {
      setRacks(selectedData.racks || []);
      setBoxes(selectedData.boxes || []);
      setFormData((prev) => ({
        ...prev,
        rackNumber: (selectedData.racks && selectedData.racks[0]) || "",
        boxNumber: (selectedData.boxes && selectedData.boxes[0]) || "",
      }));
    } else {
      setRacks([]);
      setBoxes([]);
    }
  }, [formData.policeStation, user.thana, user.role, thanaData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
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
    console.log(formData);

    if (user.name === "") {
      toast.error("Not logged in");
      return;
    }

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
      user.name,
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
      PropId = newPropertyId;
      setUuid(newPropertyId); // Set uuid state immediately

      const finalDataToPush = {
        
      }

      // Update existing row with qr_id
      const { error: updateError } = await supabase
        .from("property_table")
        .update({
          property_id: newPropertyId.toLowerCase(),
        name_of_court: formData.courtName.toLowerCase(),
        fir_number: formData.firNumber.toLowerCase(),
        category_of_offence: finalOffenceCategory.toLowerCase(),
        under_section: formData.section.map((item) => item.toLowerCase()),
        date_of_seizure: formData.seizureDate.toLowerCase(),
        description: formData.description1.toLowerCase(),
        name_of_io: formData.ioName.toLowerCase(),
        case_status: formData.caseStatus.toLowerCase(),
        rack_number: formData.rackNumber.toLowerCase(),
        box_number: formData.boxNumber.toLowerCase(),
        remarks: formData.remarks.toLowerCase(),
        police_station: formData.policeStation.toLowerCase(),
        image_url: imageUrls,
        place_of_seizure: finalPlaceOfSeizure.toLowerCase(),
        serial_number_from_register: formData.registerSerialNumber.toLowerCase(),
        type_of_seizure: finalTypeOfSeizure.toLowerCase(),
        updated_by: user.name.toLowerCase(),
        })
        .eq("qr_id", window.location.href);

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Error updating property.");
        setUploading(false);
        return;
      }

      // Insert into status_logs_table
      const { error: statusError } = await supabase
        .from("status_logs_table")
        .insert([
          {
            property_id: newPropertyId, // Use newPropertyId consistently
            status: "Entry of item",
            status_remarks: formData.remarks,
            handling_officer: formData.ioName,
            reason: "Other - Initial Confestication",
            updated_by: user.name,
            time_of_event: new Date().toISOString(),
          },
        ]);

      if (statusError) {
        toast.error("Couldn't create initial status log");
        setUploading(false);
        return;
      }

      setIsSubmitted(true);
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
      policeStation: user.thana,
      placeOfSeizure: "Police Station",
      registerSerialNumber: "",
      typeOfSeizure: "unclaimed",
    });
    setSelectedFiles([]);
    setPreviewUrls([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      {["admin", "thana admin", "super admin"].includes(user.role) ? (
        isSubmitted && uuid ? (
          <div
            className={`transition-all duration-300 ease-in-out ${isSubmitted ? "flex" : "hidden"} flex-col items-center justify-center w-[80%] max-lg:w-full bg-white rounded-xl shadow-lg p-6 gap-4 pt-5`}
          >
            <h2 className="text-3xl font-bold text-green-600">Form Submitted Successfully !</h2>
            <p className="text-gray-700 font-medium text-center">
              Your unique property ID is shown below:
            </p>
            <div className="flex flex-col items-center gap-2">
              <div className="flex items-center gap-2 mt-2 bg-gray-100 px-4 py-2 rounded-md">
                <span className="font-mono text-sm text-gray-800">{uuid}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uuid || "");
                    toast.success("Property ID copied");
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
                router.push(`/search-property/${uuid}`); // Use uuid state
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
            >
              View Logs
            </button>
          </div>
        ) : (
          <div className={`flex items-center justify-around bg-white w-[80%] max-lg:w-[100%] max-lg:flex-col ${isSubmitted ? "hidden" : "flex"} max-sm:scale-95`}>
            <div className="min-h-150 max-lg:h-180 w-[75%] flex lg:flex-wrap max-lg:w-full max-lg:flex-col max-md:flex-col max-md:min-h-280 max-md:align-top">
              <form
                onSubmit={handleSubmit}
                onReset={handleReset}
                className="w-full h-full flex items-center justify-start px-2 py-4 pl-4 gap-3 lg:flex-wrap max-lg:w-full max-md:flex-col max-md:min-h-180 max-md:pt-8 max-lg:flex-wrap"
              >
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className="max-md:text-sm w-48 max-sm:w-70 font-semibold text-gray-700">Police Station:</label>
                  {user.role === "thana admin" ? (
                    <div className="w-58 h-10 text-black/75 rounded-lg px-3 max-md:px-2 border border-gray-400 max-lg:w-58 max-md:w-80 max-sm:w-full max-md:text-sm max-xl:text-sm max-sm:text-xs flex items-center bg-gray-200 cursor-not-allowed">{user.thana}</div>
                  ) : (
                    <select
                      name="policeStation"
                      className="text-input flex-1"
                      value={formData.policeStation}
                      onChange={handleChange}
                    >
                      <option value="">Select Police Station</option>
                      {thanas.map((thana, idx) => (
                        <option key={idx} value={thana}>{thana}</option>
                      ))}
                    </select>
                  )}
                </div>
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
                      <button
                        className="w-[20%] hover:bg-gray-100 h-full rounded-r-md bg-gray-50"
                        type="button"
                        onClick={() => {
                          setPlaceOfSeizure("Police Station");
                          setCustomPlaceOfSeizure("");
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
                      <option value="police station">Police Station</option>
                      <option value="place of incident">Place Of Incident</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
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
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className="max-md:text-sm w-48 font-semibold text-gray-700">Category of Offence:</label>
                  {offenceCategory === "Other" ? (
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
                      <button
                        className="w-[20%] hover:bg-gray-100 h-full rounded-r-md"
                        type="button"
                        onClick={() => {
                          setOffenceCategory("body offence");
                          setCustomOffenceCategory("");
                        }}
                      >
                        X
                      </button>
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
                      <option value="body offence">Body Offence</option>
                      <option value="property offence">Property Offence</option>
                      <option value="offence related to c/w">Offence Related to C/W</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
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
                          <button
                            className="w-[20%] hover:bg-gray-100 h-full rounded-r-md"
                            type="button"
                            onClick={() => {
                              setTypeOfSeizure("");
                              setCustomTypeOfSeizure("");
                            }}
                          >
                            X
                          </button>
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
                          <option value="unclaimed">Unclaimed</option>
                          <option value="memorendum">Memorendum</option>
                          <option value="police station">Police Station</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex w-full gap-4 max-md:flex-col items-center">
                  <div className="flex flex-col gap-3 w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                    <div className="flex items-center">
                      <label className="max-md:text-sm w-48 font-semibold text-gray-700">Rack Number:</label>
                      <select
                        name="rackNumber"
                        className="text-input flex-1"
                        value={formData.rackNumber}
                        onChange={(e) => { handleChange(e); console.log(e.target.value) }}
                      >
                        {racks.map((rack, index) => (
                          <option key={index} value={rack} className="text-black w-full">{rack}</option>
                        ))}
                      </select>
                    </div>
                    <div className="flex items-center">
                      <label className="max-md:text-sm w-48 font-semibold text-gray-700">Box Number:</label>
                      <select
                        name="boxNumber"
                        className="text-input flex-1"
                        value={formData.boxNumber}
                        onChange={(e) => { handleChange(e); console.log(e.target.value) }}
                      >
                        {boxes.map((box, index) => (
                          <option key={index} value={box} className="text-black w-full">{box}</option>
                        ))}
                      </select>
                    </div>
                  </div>
                  <div className="flex items-start justify-between gap-2 w-[48%] max-md:w-[80%] max-sm:w-[90%] flex-col">
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
        )
      ) : (
        <div className="h-150 p-5 justify-center items-center">
          <div className="rounded-lg bg-white py-5 max-w-100 px-8 flex flex-col items-center gap-8 shadow-lg h-full transition-all">
            <h1 className="text-red-700 font-bold text-3xl text-center transition-all">Access Denied</h1>
            <p className="text-center font-medium transition-all">We are really sorry, you dont have access to adding new properties.</p>
            <p className="text-center text-sm text-red-700 transition-all">The rights are strictly under Thana Admin / Admin</p>
            <p className="bg-gray-300 p-2 rounded-md transition-all">Your role : {user.role}</p>
            <div className="bg-gray-300 h-0.5 text-gray-300 w-full" />
            <p className="text-center font-medium transition-all">However you can still look for properties</p>
            <button
              className="bg-blue-700 p-1 px-3 text-white rounded-md transition-all hover:bg-blue-500"
              onClick={() => { router.push("/search-property") }}
            >
              Search
            </button>
          </div>
        </div>
      )}
    </>
  );
}