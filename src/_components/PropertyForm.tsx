"use client";

import React, { useState } from "react";

export default function PropertyForm() {
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
    description2: "",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    console.log("📝 Submitted Form Data:", formData);
    alert("Property Submitted Successfully!");
    // TODO: Send data to backend
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
      description2: "",
    });
  };

  return (
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
              <label className="w-48 pt-2 font-semibold text-gray-700">Description:</label>
              <textarea
                name="description2"
                placeholder="Description of Property"
                className="flex-1 h-20 w-48 rounded-md px-3 py-2 border border-gray-300 resize-none"
                value={formData.description2}
                onChange={handleChange}
              />
            </div>
            <div className="flex justify-end gap-2 w-full mt-4">
              <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded-md font-semibold">
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
  );
}
