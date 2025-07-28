"use client";

import React, { useRef, useState } from "react";
import supabase from "@/supabaseConfig/supabaseConnect";

import { v4 as uuidv4 } from "uuid";
import QRCode from "react-qr-code";
import Image from "next/image";

export default function PropertyForm() {

  const [isSubmitted, setIsSubmitted] = useState(false);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleUploadClick = () => {
    fileInputRef.current?.click();
  };

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      console.log("Selected file:", file.name);
      // You can add preview or upload logic here
    }
  };

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
    extraInfo: "",
    propertyTag: "",
    propertyLocation: "",
    rackNumber: "",
    boxNumber: "",
    remarks: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };


  const handleSubmit = async(e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const newUuid = uuidv4();
    setUuid(newUuid);

    const { data, error } = await supabase
    .from("Property_table")
    .insert([
      {
        property_number: formData.propertyNumber,
        name_of_court: formData.courtName,
        fir_number: formData.firNumber,
        category_of_offence: formData.offenceCategory,
        under_section: formData.section,
        date_of_seizure: formData.seizureDate,
        description: formData.description1,
        name_of_io: formData.ioName,
        case_status: formData.caseStatus,
        extra_info: formData.extraInfo,
        property_tag: formData.propertyTag,
        location_of_property: formData.propertyLocation,
        rack_number: formData.rackNumber,
        box_number: formData.boxNumber,
        remarks: formData.remarks,
        qr_id: newUuid,
      },
    ]);

  if (error) {
    console.error("Insert error:", error);
    return;
  }
    setIsSubmitted(true);
    console.log("📝 Submitted Form Data:", data);
    console.log("🔑 Generated UUID:", newUuid);
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
      extraInfo: "",
      propertyTag: "",
      propertyLocation: "",
      rackNumber: "",
      boxNumber: "",
      remarks: "",
    });
  };

  return (

    <>

      {
        isSubmitted && uuid ? (
          <div
            className={`transition-all duration-300 ease-in-out ${isSubmitted ? "flex" : "hidden"
              } flex-col items-center justify-center w-[80%] max-lg:w-full bg-white rounded-xl shadow-lg p-6 gap-4 pt-5`}
          >
            <h2 className="text-3xl font-bold text-green-600">Form Submitted!</h2>
            <p className="text-gray-700 font-medium text-center">
              Your unique property ID is shown below:
            </p>

            <div className="flex flex-col items-center gap-2">
              <QRCode value={uuid} size={160} bgColor="#ffffff" fgColor="#000000" />
              <div className="flex items-center gap-2 mt-2 bg-gray-100 px-4 py-2 rounded-md">
                <span className="font-mono text-sm text-gray-800">{uuid}</span>
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(uuid || "");
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
              }}
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md font-semibold"
            >
              Reset
            </button>
          </div>

        ) : (
          <div className={`flex items-center justify-around bg-white w-[80%] max-lg:w-[100%] ${isSubmitted ? "hidden" : "flex"}`}>

            <div className="min-h-130 w-[75%] flex flex-wrap">
              <form
                onSubmit={handleSubmit}
                onReset={handleReset}
                className="w-full h-full flex flex-wrap items-center justify-start px-2 pl-4 gap-3"
              >
                {/* Property Number */}
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">Property Number:</label>
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
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">Name of Court:</label>
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
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">FIR Number:</label>
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
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">Category of Offence:</label>
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
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">Under Section:</label>
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
                <div className="flex items-center w-[48%]">
                  <label className="w-48 font-semibold text-gray-700">Date of Seizure:</label>
                  <input
                    name="seizureDate"
                    type="date"
                    className="text-input flex-1"
                    value={formData.seizureDate}
                    onChange={handleChange}
                  />
                </div>

                {/* Description and IO Details */}
                <div className="flex w-full gap-4">
                  <div className="flex items-start w-[48%] flex-col">
                    <div className="flex items-start w-full">
                      <label className="w-48 pt-2 font-semibold text-gray-700">Description:</label>
                      <textarea
                        name="description1"
                        placeholder="Description of Property"
                        className="flex-1 h-35 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                        value={formData.description1}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-3 w-[48%]">
                    <div className="flex items-center">
                      <label className="w-48 font-semibold text-gray-700">Name of IO:</label>
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
                      <label className="w-48 font-semibold text-gray-700">Case Status:</label>
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
                      <label className="w-48 font-semibold text-gray-700">Extra Info:</label>
                      <input
                        name="extraInfo"
                        type="text"
                        placeholder="Enter Name"
                        className="text-input flex-1"
                        value={formData.extraInfo}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                </div>

                {/* Property Location details */}
                <div className="flex w-full gap-4">
                  <div className="flex flex-col gap-3 w-[48%]">
                    <div className="flex items-center">
                      <label className="w-48 font-semibold text-gray-700">Property Tag:</label>
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
                      <label className="w-48 font-semibold text-gray-700">Location of Property:</label>
                      <input
                        name="propertyLocation"
                        type="text"
                        placeholder="Location"
                        className="text-input flex-1"
                        value={formData.propertyLocation}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        name="rackNumber"
                        type="text"
                        placeholder="Rack No."
                        className="text-input flex-1"
                        value={formData.rackNumber}
                        onChange={handleChange}
                      />
                      <input
                        name="boxNumber"
                        type="text"
                        placeholder="Box No."
                        className="text-input flex-1"
                        value={formData.boxNumber}
                        onChange={handleChange}
                      />
                    </div>
                  </div>

                  {/* Right-side textarea + buttons */}
                  <div className="flex items-start w-[48%] flex-col">
                    <div className="flex items-start w-full">
                      <label className="w-48 pt-2 font-semibold text-gray-700">Remarks:</label>
                      <textarea
                        name="remarks"
                        placeholder="Remarks about Property"
                        className="flex-1 h-20 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                        value={formData.remarks}
                        onChange={handleChange}
                      />
                    </div>
                    <div className="flex justify-end gap-2 w-full mt-4">
                      <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold hover:bg-blue-600 active:bg-blue-600" onClick={() => handleSubmit}>
                        Submit
                      </button>
                      <button type="reset" className="text-blue-700 border-blue-500 border px-4 py-2 rounded-md font-semibold">
                        Reset
                      </button>
                    </div>
                  </div>
                </div>
              </form>
            </div>
            <div className='flex items-center justify-evenly flex-col h-full bg-gray-400 w-[25%] rounded-r-lg p-4'>
              <Image height={84} width={54} src={'/e-malkhana.png'} alt='E-Malkhana Image' />

              <p className='text-gray-700 font-semibold mt-4'>Upload Image</p>

              {/* Hidden input */}
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleFileChange}
                className="hidden"
              />

              {/* Custom button */}
              <button
                onClick={handleUploadClick}
                className="mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
              >
                Choose Image
              </button>
            </div>
          </div>
        )
      }

    </>

  );
}
