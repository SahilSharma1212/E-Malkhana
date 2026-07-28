"use client";
import React, { useRef, useState, useEffect } from "react";
import supabase from "@/config/supabaseConnect";
import toast from "react-hot-toast";
import { v4 as uuidv4 } from "uuid";
import Image from "next/image";
import { useRouter, useSearchParams } from "next/navigation";
import axios from "axios";
import { ArrowRightLeft, Eye, EyeClosed, Pen, X, Check, Copy, Loader2, Upload, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";

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
  batchNumber: string;
};

type SpecialCategoryDetailsType = {
  itemWorth: number,
  specialCategoryType: string
}

type dataBeforeUpdate = {
  property_id: string,
  name_of_court: string,
  fir_number: string,
  category_of_offence: string,
  under_section: string[],
  date_of_seizure: string,
  description: string,
  name_of_io: string,
  case_status: string,
  rack_number: string,
  box_number: string,
  remarks: string,
  police_station: string,
  image_url: string[],
  pdf_urls: string[],
  place_of_seizure: string,
  serial_number_from_register: string,
  type_of_seizure: string,
  updated_by: string,
  io_batch_number: string,
  property_actually_added_at: string,
  updation_date: string,
  special_category_type?: string,
  special_category_worth?: number,
}

export default function PropertyForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const qrId = searchParams.get("qrId");

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [placeOfSeizure, setPlaceOfSeizure] = useState<string>("");
  const [customplaceOfSeizure, setCustomPlaceOfSeizure] = useState<string>("");
  const [typeOfSeizure, setTypeOfSeizure] = useState<string>("");
  const [customTypeOfSeizure, setCustomTypeOfSeizure] = useState<string>("");
  const [offenceCategory, setOffenceCategory] = useState<string>("");
  const [customOffenceCategory, setCustomOffenceCategory] = useState<string>("");
  const [sectionInput, setSectionInput] = useState("");
  const [selectedFiles, setSelectedFiles] = useState<{ file: File; type: string }[]>([]);
  const [previewUrls, setPreviewUrls] = useState<{ url: string; type: string }[]>([]);
  const [uploading, setUploading] = useState(false);
  const [uuid, setUuid] = useState<string | null>(null);
  const [routingUUID, setRoutingUUID] = useState("")
  const [user, setUser] = useState({
    email: "",
    name: "",
    role: "",
    thana: "",
  });
  const [showSections, setShowSections] = useState(false);

  const [thanaData, setThanaData] = useState<{ thana: string; racks: string[]; boxes: string[] }[]>([]);
  const [racks, setRacks] = useState<string[]>([]);
  const [boxes, setBoxes] = useState<string[]>([]);
  const [thanas, setThanas] = useState<string[]>([]);
  const [specialPlace, setSpecialPlace] = useState<string>("");
  const [isSpecialPlace, setIsSpecialPlace] = useState<boolean>(false);
  const [fileType, setFileType] = useState<string>("image");

  const [isSpecialDivVisible, setIsSpecialDivVisible] = useState(false)
  const [specialCategoryDetails, setSpecialCategoryDetails] = useState<SpecialCategoryDetailsType>({
    specialCategoryType: "",
    itemWorth: 0
  })
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
    policeStation: user.thana,
    placeOfSeizure: "",
    registerSerialNumber: "",
    typeOfSeizure: "",
    batchNumber: ""
  });

  const [isSpecialProperty, setIsSpecialProperty] = useState(false)

  // Keep a ref of the latest preview URLs so we can revoke them on unmount
  // without revoking still-displayed URLs every time the list changes.
  const previewUrlsRef = useRef(previewUrls);
  useEffect(() => {
    previewUrlsRef.current = previewUrls;
  }, [previewUrls]);
  useEffect(() => {
    return () => {
      previewUrlsRef.current.forEach(({ url, type }) => {
        if (type === "image") URL.revokeObjectURL(url);
      });
    };
  }, []);

  // Fetch user + thana data once on mount. We rely on the freshly fetched role
  // (not the closure `user.role`, which is still empty on the first run) and
  // never depend on the state this effect sets, so it can't loop.
  useEffect(() => {
    async function fetchInitialData() {
      let fetchedRole = "";

      try {
        const res = await axios.get("/api/get-token", { withCredentials: true });
        if (res.data.authenticated) {
          const { name, email, role, thana } = res.data.user;
          fetchedRole = role;
          setUser({ name, email, role, thana });
          if (role === "thana admin" && thana) {
            setFormData(prev => ({ ...prev, policeStation: thana }));
          }
        } else {
          toast.error("User not authenticated");
        }
      } catch (error) {
        console.error("❌ Auth error:", error);
        toast.error("Failed to authenticate user");
      }

      try {
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
        if ((fetchedRole === "admin" || fetchedRole === "super admin") && data.length > 0) {
          // Default admins/super-admins to the first thana only if none is set.
          setFormData(prev => (prev.policeStation ? prev : { ...prev, policeStation: data[0].thana }));
        }
      } catch (error) {
        console.error("Error fetching thana data:", error);
        toast.error("Failed to load thana data");
      }
    }

    fetchInitialData();
  }, []);

  // Update racks and boxes based on selected police station
  useEffect(() => {
    const fetchRacksAndBoxes = async () => {
      console.log("Fetching racks and boxes for policeStation:", formData.policeStation);
      console.log("Thana data:", thanaData);

      if (!formData.policeStation || thanaData.length === 0) {
        console.log("Skipping fetch: policeStation or thanaData not available");
        setRacks([]);
        setBoxes([]);
        setFormData(prev => ({ ...prev, rackNumber: "", boxNumber: "" }));
        return;
      }

      const selected = thanaData.find(item => item.thana === formData.policeStation);
      if (!selected) {
        console.log("No matching thana found for:", formData.policeStation);
        setRacks([]);
        setBoxes([]);
        setFormData(prev => ({ ...prev, rackNumber: "", boxNumber: "" }));
        toast.error("No racks or boxes available for the selected police station");
        return;
      }

      if (!selected.racks || !selected.boxes || selected.racks.length === 0 || selected.boxes.length === 0) {
        console.log("Invalid racks or boxes data:", selected);
        setRacks([]);
        setBoxes([]);
        setFormData(prev => ({ ...prev, rackNumber: "", boxNumber: "" }));
        toast.error("No racks or boxes available for the selected police station");
        return;
      }

      console.log("Setting racks:", selected.racks, "boxes:", selected.boxes);
      setRacks(selected.racks);
      setBoxes(selected.boxes);
      setFormData(prev => ({
        ...prev,
        rackNumber: selected.racks[0] || "",
        boxNumber: selected.boxes[0] || "",
      }));
    };

    fetchRacksAndBoxes();
  }, [formData.policeStation, thanaData, user.thana]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;

    // Normalize the text to handle Unicode properly (important for Hindi)
    const normalizedValue = value.normalize('NFC');

    setFormData((prev) => ({
      ...prev,
      [name]: normalizedValue
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    const validImageTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    const validPdfType = 'application/pdf';
    const maxSize = 5 * 1024 * 1024; // 5MB

    const validNewFiles = files.filter(file => {
      if (fileType === 'image') {
        return validImageTypes.includes(file.type) && file.size <= maxSize;
      } else {
        return file.type === validPdfType && file.size <= maxSize;
      }
    });

    const invalidFiles = files.filter(file => {
      if (fileType === 'image') {
        return !validImageTypes.includes(file.type) || file.size > maxSize;
      } else {
        return file.type !== validPdfType || file.size > maxSize;
      }
    });

    if (invalidFiles.length > 0) {
      toast.error(`Invalid files detected. ${fileType === 'image' ? 'Only PNG, JPEG, JPG' : 'Only PDF'} files under 5MB are allowed.`);
    }

    // Fill up to the 10-file limit instead of dropping the whole batch.
    const remaining = 10 - selectedFiles.length;
    if (remaining <= 0) {
      toast.error("You can upload a maximum of 10 files (images and PDFs combined).");
      return;
    }

    const filesToAdd = validNewFiles.slice(0, remaining);
    const skipped = validNewFiles.length - filesToAdd.length;
    if (skipped > 0) {
      toast.error(`Only ${remaining} more file(s) allowed (max 10). ${skipped} file(s) skipped.`);
    }

    const newFilesWithType = filesToAdd.map(file => ({ file, type: fileType }));
    const newPreviews = filesToAdd.map(file => ({
      url: fileType === 'image' ? URL.createObjectURL(file) : file.name,
      type: fileType
    }));

    setSelectedFiles(prev => [...prev, ...newFilesWithType]);
    setPreviewUrls(prev => [...prev, ...newPreviews]);
    if (filesToAdd.length > 0) {
      toast.success(`${filesToAdd.length} ${fileType === 'image' ? 'image(s)' : 'PDF(s)'} selected.`);
    }
  };

  const handleRemoveFile = (indexToRemove: number) => {
    const newFiles = [...selectedFiles];
    const newPreviews = [...previewUrls];

    if (newPreviews[indexToRemove].type === 'image') {
      URL.revokeObjectURL(newPreviews[indexToRemove].url);
    }

    newFiles.splice(indexToRemove, 1);
    newPreviews.splice(indexToRemove, 1);

    setSelectedFiles(newFiles);
    setPreviewUrls(newPreviews);
  };

  const handleSubmit = async (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default form submission if event exists
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Submit button clicked - Form Data Section:", formData.section);
    console.log("Complete form data:", formData);

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

    // Special category validation
    if (isSpecialProperty) {
      if (!specialCategoryDetails.specialCategoryType.trim()) {
        toast.error("Please select a Special Category Type.");
        return;
      }
      if (specialCategoryDetails.itemWorth <= 0) {
        toast.error("Please enter a valid worth amount for the special category item.");
        return;
      }
    }

    if (isSpecialPlace) {
      if (!specialPlace.trim()) {
        toast.error("Please enter the Special Place");
        return;
      }
    } else {
      if (!formData.rackNumber.trim() || !formData.boxNumber.trim()) {
        toast.error("Please enter Rack and Box numbers");
        return;
      }
    }

    const finalPlaceOfSeizure = placeOfSeizure === "Other"
      ? `other - ${customplaceOfSeizure}`
      : placeOfSeizure;

    const finalTypeOfSeizure = typeOfSeizure === "Other"
      ? `other - ${customTypeOfSeizure}`
      : typeOfSeizure;

    const finalOffenceCategory = offenceCategory === "Other"
      ? `other - ${customOffenceCategory}`
      : offenceCategory;

    if (!qrId) {
      toast.error("Invalid QR ID in URL.");
      return;
    }

    // Enhanced field validation with specific field names and Hindi support
    const fieldValidation = [
      { value: formData.courtName, name: "Name of Court" },
      { value: formData.firNumber, name: "FIR Number" },
      {
        value: offenceCategory === "Other" ? customOffenceCategory : offenceCategory,
        name: "Category of Offence"
      },
      { value: formData.section.length === 0 ? "" : "valid", name: "Under Section" },
      { value: formData.seizureDate, name: "Date of Seizure" },
      { value: formData.description1, name: "Description" },
      { value: formData.ioName, name: "Name of IO" },
      { value: formData.caseStatus, name: "Case Status" },
      { value: formData.remarks, name: "Remarks" },
      { value: formData.policeStation, name: "Police Station" },
      {
        value: placeOfSeizure === "Other" ? customplaceOfSeizure : placeOfSeizure,
        name: "Place Of Seizure"
      },
      { value: formData.registerSerialNumber, name: "Serial Number from Register" },
      {
        value: typeOfSeizure === "Other" ? customTypeOfSeizure : typeOfSeizure,
        name: "Type of Seizure"
      },
      { value: user.name, name: "User Authentication" },
    ];

    // Find missing fields with better Unicode handling
    const missingFields = fieldValidation.filter(field => {
      if (!field.value) return true;
      const normalizedValue = field.value.toString().normalize('NFC').trim();
      return normalizedValue === '';
    });

    // Check for missing files - only images are required, PDFs are optional
    const imageFiles = selectedFiles.filter(f => f.type === 'image');
    const missingFiles = imageFiles.length === 0;

    // Show specific error messages
    if (missingFields.length > 0 || missingFiles) {
      let errorMessage = "";

      if (missingFields.length === 1) {
        errorMessage = `Please fill the "${missingFields[0].name}" field`;
      } else if (missingFields.length > 1) {
        errorMessage = `Please fill the "${missingFields[0].name}" field (and ${missingFields.length - 1} other field${missingFields.length - 1 > 1 ? 's' : ''})`;
      }

      if (missingFiles) {
        if (errorMessage) {
          errorMessage += " and select at least one image";
        } else {
          errorMessage = "Please select at least one image";
        }
      }

      errorMessage += " before submitting.";
      toast.error(errorMessage);
      return;
    }

    setUploading(true);

    try {
      // Upload files
      const STORAGE_BUCKET = 'property-images';
      const uploadPromises = selectedFiles.map(async ({ file, type }) => {
        const fileExt = file.name.split('.').pop();
        const fileName = `${Date.now()}-${Math.random().toString(36).substring(2, 15)}.${fileExt}`;
        // Bucket name must not contain a slash — the folder is part of the
        // object path instead.
        const folder = type === 'image' ? 'image_proof' : 'pdf_reports';
        const filePath = `${folder}/${fileName}`;

        const { error: uploadError } = await supabase.storage
          .from(STORAGE_BUCKET)
          .upload(filePath, file);

        if (uploadError) {
          throw new Error(`File upload failed: ${uploadError.message}`);
        }

        const { data: urlData } = supabase.storage
          .from(STORAGE_BUCKET)
          .getPublicUrl(filePath);

        return { url: urlData.publicUrl, type };
      });

      const uploadedFiles = await Promise.all(uploadPromises);
      const imageUrls = uploadedFiles.filter((f: { url: string; type: string }) => f.type === 'image').map((f: { url: string; type: string }) => f.url);
      const pdfUrls = uploadedFiles.filter((f: { url: string; type: string }) => f.type !== 'image').map((f: { url: string; type: string }) => f.url);

      const newPropertyId = uuidv4();
      // The retrievable identifier is the property_id, not the FIR number.
      setUuid(newPropertyId);
      setRoutingUUID(newPropertyId);

      // Normalize all text data before saving to ensure proper Unicode encoding
      const normalizeText = (text: string) => text.normalize('NFC').trim();

      // Prepare the update data object
      const updateData: dataBeforeUpdate = {
        property_id: newPropertyId.toLowerCase(),
        name_of_court: normalizeText(formData.courtName.toLowerCase()),
        fir_number: normalizeText(formData.firNumber.toLowerCase()),
        category_of_offence: normalizeText(finalOffenceCategory.toLowerCase()),
        under_section: formData.section.map((item) => normalizeText(item.toLowerCase())),
        date_of_seizure: formData.seizureDate.toLowerCase(),
        description: normalizeText(formData.description1.toLowerCase()),
        name_of_io: normalizeText(formData.ioName.toLowerCase()),
        case_status: normalizeText(formData.caseStatus.toLowerCase()),
        rack_number: isSpecialPlace ? "Special Place - " + normalizeText(specialPlace) : formData.rackNumber.toLowerCase(),
        box_number: isSpecialPlace ? "Special Place - " + normalizeText(specialPlace) : formData.boxNumber.toLowerCase(),
        remarks: normalizeText(formData.remarks.toLowerCase()),
        police_station: normalizeText(formData.policeStation.toLowerCase()),
        image_url: imageUrls,
        pdf_urls: pdfUrls,
        place_of_seizure: normalizeText(finalPlaceOfSeizure.toLowerCase()),
        serial_number_from_register: normalizeText(formData.registerSerialNumber.toLowerCase()),
        type_of_seizure: normalizeText(finalTypeOfSeizure.toLowerCase()),
        updated_by: normalizeText(user.name.toLowerCase()),
        io_batch_number: formData.batchNumber ? normalizeText(formData.batchNumber.toLowerCase()) : "",
        property_actually_added_at: new Date().toISOString(),
        updation_date: new Date().toISOString(),
      };

      // Add special category fields if applicable
      if (isSpecialProperty) {
        updateData.special_category_type = normalizeText(specialCategoryDetails.specialCategoryType.toLowerCase());
        updateData.special_category_worth = specialCategoryDetails.itemWorth;
      }



      // Update the row for this QR, matching on the unique qrId value (works
      // across localhost/preview/production). `.select()` lets us confirm a row
      // was actually matched — a zero-match update returns error: null, which
      // would otherwise be a silent no-op reported as success.
      const { data: updatedRows, error: updateError } = await supabase
        .from("property_table")
        .update(updateData)
        .ilike("qr_id", `%qrId=${qrId}`)
        .select("property_id");

      if (updateError) {
        console.error("Update error:", updateError);
        toast.error("Error updating property.");
        setUploading(false);
        return;
      }

      if (!updatedRows || updatedRows.length === 0) {
        toast.error("Couldn't find the property for this QR code. Nothing was saved.");
        setUploading(false);
        return;
      }

      // Insert into status_logs_table - with proper Unicode handling
      const { error: statusError } = await supabase
        .from("status_logs_table")
        .insert([
          {
            property_id: newPropertyId,
            status: "entry of item",
            status_remarks: normalizeText(formData.remarks.toLowerCase()),
            handling_officer: normalizeText(formData.ioName.toLowerCase()),
            reason: "Other - Initial Confiscation",
            updated_by: normalizeText(user.name),
            time_of_event: new Date().toISOString(),
            pdf_url: pdfUrls
          },
        ]);

      if (statusError) {
        toast.error("Couldn't create initial status log");
        setUploading(false);
        return;
      }

      setIsSubmitted(true);
      toast.success("Property updated successfully!");
      if (isSpecialProperty) {
        toast.success("Special category details saved!");
      }
      toast.success("Initial status updated");
    } catch (err) {
      toast.error("An unexpected error occurred.");
      console.error(err);
    } finally {
      setUploading(false);
    }
  };

  // Fixed handleReset with better mobile compatibility
  const handleReset = (e?: React.MouseEvent<HTMLButtonElement>) => {
    // Prevent default form submission if event exists
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }

    console.log("Reset button clicked");

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
      placeOfSeizure: "",
      registerSerialNumber: "",
      typeOfSeizure: "",
      batchNumber: ""
    });
    setPlaceOfSeizure("");
    setTypeOfSeizure("");
    setOffenceCategory("");

    // Reset custom input values
    setCustomPlaceOfSeizure("");
    setCustomTypeOfSeizure("");
    setCustomOffenceCategory("");

    // Reset section input
    setSectionInput("");

    // Reset special category fields
    setIsSpecialProperty(false);
    setSpecialCategoryDetails({
      specialCategoryType: "",
      itemWorth: 0
    });
    setIsSpecialDivVisible(false);

    setSelectedFiles([]);
    setPreviewUrls(prev => {
      prev.forEach(({ url, type }) => {
        if (type === 'image') URL.revokeObjectURL(url);
      });
      return [];
    });
    setFileType("image");
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
    toast.success("Form reset successfully");
  };

  return (
    <>
      {["admin", "thana admin", "super admin"].includes(user.role) ? (
        isSubmitted && uuid ? (
          <div className="mx-auto flex w-full max-w-lg flex-col items-center justify-center gap-4 rounded-md border border-border bg-card p-8 shadow-sm">
            <span className="grid size-14 place-items-center rounded-full border-2 border-success text-success">
              <Check className="size-7" />
            </span>
            <h2 className="text-2xl font-semibold tracking-tight text-foreground">Record saved</h2>
            <p className="text-center text-sm text-muted-foreground">
              Property registered successfully. This is its unique property ID:
            </p>
            <div className="flex items-center gap-2 rounded-sm border border-border bg-secondary px-3 py-2">
              <span className="mono-id text-sm text-foreground">{uuid}</span>
              <Button
                variant="outline"
                size="sm"
                onClick={() => {
                  navigator.clipboard.writeText(uuid || "");
                  toast.success("Property ID copied");
                }}
              >
                <Copy className="size-3.5" /> Copy
              </Button>
            </div>
            <p className="text-center text-xs text-muted-foreground">
              Save this ID to retrieve the record later.
            </p>
            <Button
              variant="signal"
              className="mt-2"
              onClick={() => {
                setIsSubmitted(false);
                setUuid(null);
                handleReset();
                router.push(`/search-property/${routingUUID}`);
              }}
            >
              View custody logs
            </Button>
          </div>
        ) : (
          <div className={`w-full overflow-hidden rounded-md border border-border bg-card shadow-sm ${isSubmitted ? "hidden" : "flex"} flex-col lg:flex-row`}>
            <div className="flex-1 flex flex-col">
              <div className="border-b border-border px-5 py-4">
                <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">New Custody Record</p>
                <h1 className="mt-1 text-xl font-semibold tracking-tight text-foreground">Register Seized Property</h1>
              </div>
              <div
                className="w-full h-auto flex items-center justify-start px-4 py-5 gap-3 md:flex-wrap max-md:flex-col"
              >
                {/* police station */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 max-sm:w-70 font-semibold text-foreground">Police Station:</label>
                  {user.role === "thana admin" ? (
                    <div className="w-58 h-10 text-foreground/75 rounded-sm px-3 max-md:px-2 border border-input max-lg:w-58 max-md:w-80 max-sm:w-full max-md:text-sm max-xl:text-sm max-sm:text-xs flex items-center bg-secondary cursor-not-allowed">{user.thana}</div>
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
                {/* place of seizure */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground max-sm:w-30">Place Of Seizure:</label>
                  {placeOfSeizure === "Other" ? (
                    <div className="w-48 h-10 border border-input text-foreground rounded-sm max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden">
                      <input
                        type="text"
                        name="placeOfSeizure"
                        id="placeOfSeizure"
                        placeholder="Place of Seizure"
                        required
                        value={customplaceOfSeizure}
                        onChange={(e) => setCustomPlaceOfSeizure(e.target.value)}
                        className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                      />
                      <button
                        className="w-[20%] hover:bg-accent h-full rounded-r-md bg-secondary"
                        type="button"
                        onClick={() => {
                          setPlaceOfSeizure("");
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
                          setCustomPlaceOfSeizure("");
                        }
                      }}
                      className="text-input flex-1"
                    >
                      <option value="">-- Select Place --</option>
                      <option value="police station">Police Station</option>
                      <option value="place of incident">Place Of Incident</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                {/* name of court */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Name of Court:</label>
                  <input
                    name="courtName"
                    type="text"
                    placeholder="Name of Court"
                    className="text-input flex-1"
                    value={formData.courtName}
                    onChange={handleChange}
                    lang="hi"
                    autoComplete="off"
                    spellCheck="false"
                  />
                </div>
                {/* sno from register */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Sno. from register:</label>
                  <input
                    name="registerSerialNumber"
                    type="text"
                    placeholder="Ex. 30023"
                    className="text-input flex-1"
                    value={formData.registerSerialNumber}
                    onChange={handleChange}
                  />
                </div>
                {/* fir number */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">FIR Number:</label>
                  <input
                    name="firNumber"
                    type="text"
                    placeholder="FIR Number"
                    className="text-input flex-1"
                    value={formData.firNumber}
                    onChange={handleChange}
                  />
                </div>
                {/* category of offence */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground max-sm:w-30">Offence Category:</label>
                  {offenceCategory === "Other" ? (
                    <div className="w-100 h-10 border border-input text-foreground rounded-sm max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden max-sm:w-[40%]">
                      <input
                        type="text"
                        name="offenceCategory"
                        id="offenceCategory"
                        placeholder="Offence Category"
                        required
                        value={customOffenceCategory}
                        onChange={(e) => setCustomOffenceCategory(e.target.value)}
                        className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                      />
                      <button
                        className="w-[20%] hover:bg-accent h-full rounded-r-md"
                        type="button"
                        onClick={() => {
                          setOffenceCategory("");
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
                          setCustomOffenceCategory("");
                        }
                      }}
                      className="text-input flex-1"
                    >
                      <option value="">-- Offence Category --</option>
                      <option value="body offence">Body Offence</option>
                      <option value="property offence">Property Offence</option>
                      <option value="offence related to c/w">Offence Related to C/W</option>
                      <option value="Other">Other</option>
                    </select>
                  )}
                </div>
                {/* name of io */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Name of IO:</label>
                  <input
                    name="ioName"
                    type="text"
                    placeholder="Name of IO"
                    className="text-input flex-1"
                    value={formData.ioName}
                    onChange={handleChange}
                  />
                </div>
                {/* Under section */}
                <div className="flex flex-col gap-1 w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <div className="flex flex-row items-center w-full">
                    <label className="max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground max-sm:w-[40%]">
                      Under Section:
                    </label>
                    <div className="w-100 h-10 text-foreground rounded-sm border border-input max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 flex items-center justify-between overflow-hidden max-sm:w-[50%]">
                      <input
                        name="section"
                        type="text"
                        placeholder="e.g. 302"
                        className="h-full rounded-l-md px-1 w-[85%] pl-3"
                        value={sectionInput}
                        onChange={(e) => setSectionInput(e.target.value)}
                      />
                      <button
                        type="button"
                        className="h-full p-2 bg-secondary w-[15%] max-sm:w-[25%] hover:bg-accent"
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

                  {/* Eye button + floating sections */}
                  <div className="flex justify-end items-center relative gap-2">
                    <p className={`text-sm ${formData.section.length > 0 ? "text-success" : "text-muted-foreground"}`}>Total : {formData.section.length}</p>
                    <button
                      type="button"
                      onClick={() => setShowSections((prev) => !prev)}
                      className="p-1 text-muted-foreground hover:text-foreground"
                    >
                      {showSections ? <Eye /> : <EyeClosed />}

                    </button>

                    {showSections && (
                      <div className="absolute bottom-full mb-2 right-0 bg-card border border-border rounded-md shadow-lg p-2 z-50 max-w-xs">
                        {formData.section.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {formData.section.map((single, index) => (
                              <span
                                key={index}
                                className="bg-secondary text-secondary-foreground px-2 py-1 rounded-sm flex items-center gap-1 mono-id text-xs"
                              >
                                {single}
                                <button
                                  onClick={() => {
                                    setFormData(prev => ({
                                      ...prev,
                                      section: prev.section.filter((_, i) => i !== index)
                                    }));
                                  }}
                                  className="text-danger hover:opacity-80 ml-1 font-bold"
                                >
                                  &times;
                                </button>
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-muted-foreground text-sm">No sections added</p>
                        )}
                      </div>
                    )}
                  </div>
                </div>
                {/* batch number */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Batch No <span className="text-muted-foreground text-xs">(Optional)</span>:</label>
                  <input
                    name="batchNumber"
                    type="text"
                    className="text-input flex-1"
                    value={formData.batchNumber}
                    onChange={handleChange}
                    placeholder="(optional)"
                  />
                </div>
                {/* Special Category */}
                <div className="flex items-center w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                  <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">
                    Special Category?
                  </label>
                  <input
                    type="checkbox"
                    checked={isSpecialProperty}
                    onChange={(e) => {
                      setIsSpecialProperty(e.target.checked);
                      if (!e.target.checked) {
                        // Reset special category details when unchecked
                        setSpecialCategoryDetails({
                          specialCategoryType: "",
                          itemWorth: 0
                        });
                        setIsSpecialDivVisible(false);
                      }
                    }}
                    style={{ accentColor: 'var(--signal)' }}
                    className="size-4"
                  />

                  {
                    isSpecialProperty && (
                      <div className="relative inline">
                        <button
                          type="button"
                          className={`flex rounded-sm border gap-2 items-center px-2 ml-2 ${isSpecialDivVisible ? "border-success/60 bg-success/15 text-[color:var(--success)]" : "border-border bg-secondary text-foreground"}`}
                          onClick={() => setIsSpecialDivVisible(!isSpecialDivVisible)}
                        >
                          <p className="text-sm">{isSpecialDivVisible ? "Done" : "Edit"}</p>
                          {isSpecialDivVisible ? <X size={10} /> : <Pen size={10} />}
                        </button>
                        {isSpecialDivVisible && (
                          <div className="absolute max-w-64 p-4 bg-card border border-border rounded shadow-lg bottom-full right-0 mb-2 text-wrap wrap-break-word flex flex-col items-center justify-center gap-3 z-50">
                            <div>
                              <p className="text-foreground text-sm pb-2 font-semibold">Category <span className="text-danger">*</span></p>
                              <select
                                className="px-2 py-1 rounded-sm focus:border-gray-800 focus:border border border-input w-54"
                                value={specialCategoryDetails.specialCategoryType}
                                onChange={(e) => {
                                  setSpecialCategoryDetails({
                                    ...specialCategoryDetails,
                                    specialCategoryType: e.target.value
                                  });
                                }}
                              >
                                <option value="">Select category</option>
                                <option value="cash">Cash</option>
                                <option value="jewellery">Jewellery</option>
                                <option value="other">Other</option>
                              </select>
                            </div>

                            <div>
                              <p className="text-foreground text-sm pb-2 font-semibold">Appx Worth <span className="font-normal text-sm">in Rs</span> <span className="text-danger">*</span></p>
                              <input
                                className="px-2 py-1 rounded-sm focus:border-gray-800 focus:border border border-input w-54"
                                type="number"
                                placeholder="Ex. 3000"
                                min="1"
                                value={specialCategoryDetails.itemWorth || ''}
                                onChange={(e) => {
                                  const value = parseFloat(e.target.value) || 0;
                                  setSpecialCategoryDetails({
                                    ...specialCategoryDetails,
                                    itemWorth: value
                                  });
                                }}
                              />
                            </div>
                          </div>
                        )}
                      </div>
                    )
                  }
                </div>

                {/* description , name of io , case status , type of seizure */}
                <div className="flex w-full gap-4 max-md:flex-col items-center">
                  {/* description */}
                  <div className="flex items-start w-[48%] max-md:w-[80%] max-sm:w-[90%] flex-col">
                    <div className="flex items-start w-full">
                      <label className=" max-sm:text-xs max-md:text-sm w-48 max-md:w-36 pt-2 font-semibold text-foreground">Description:</label>
                      <textarea
                        name="description1"
                        placeholder="Description of Property"
                        className="flex-1 h-35 w-48 rounded-md px-3 py-2 border border-border resize-none"
                        value={formData.description1}
                        onChange={handleChange}
                      />
                    </div>
                  </div>
                  {/* date of seizure and case status , type of seizure */}
                  <div className="flex flex-col gap-3 w-[48%] max-md:w-[80%] max-sm:w-[90%]">
                    {/* date of seizure */}
                    <div className="flex items-center">
                      <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Date of Seizure:</label>
                      <input
                        name="seizureDate"
                        type="date"
                        className="text-input flex-1"
                        value={formData.seizureDate}
                        onChange={handleChange}
                      />
                    </div>
                    {/* case status */}
                    <div className="flex items-center">
                      <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground">Case Status:</label>
                      <input
                        name="caseStatus"
                        type="text"
                        placeholder="Status of Case Property"
                        className="text-input flex-1"
                        value={formData.caseStatus}
                        onChange={handleChange}
                      />
                    </div>
                    {/* type of seizure */}
                    <div className="flex items-center">
                      <label className=" max-sm:text-xs max-md:text-sm w-48 font-semibold text-foreground max-sm:w-30">Type of Seizure:</label>
                      {typeOfSeizure === "Other" ? (
                        <div className="w-100 h-10 border border-input text-foreground rounded-sm max-lg:w-64 max-md:text-sm max-xl:text-sm max-sm:text-xs flex-1 gap-2 max-sm:gap-0 items-center overflow-hidden">
                          <input
                            type="text"
                            name="typeOfSeizure"
                            id="typeOfSeizure"
                            placeholder="Type of Seizure"
                            required
                            value={customTypeOfSeizure}
                            onChange={(e) => setCustomTypeOfSeizure(e.target.value)}
                            className="focus:border-none border-white/0 border h-full px-2 max-sm:px-0.5 w-[80%]"
                          />
                          <button
                            className="w-[20%] hover:bg-accent h-full rounded-r-md"
                            type="button"
                            onClick={() => {
                              setTypeOfSeizure(""); // Reset to default
                              setCustomTypeOfSeizure(""); // Clear custom input
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
                              setCustomTypeOfSeizure("");
                            }
                          }}
                          className="text-input flex-1"
                        >
                          <option value="">-- Type of Seizure --</option>
                          <option value="unclaimed">Unclaimed</option>
                          <option value="memorendum">Memorendum</option>
                          <option value="police station">Police Station</option>
                          <option value="Other">Other</option>
                        </select>
                      )}
                    </div>
                  </div>
                </div>


                {/* rack number and box number */}
                <div className="flex w-full gap-4 max-md:flex-col items-start px-5 max-sm:px-2">
                  <div className="flex flex-col w-full max-md:w-full lg:w-[48%] h-full justify-between items-end gap-4 relative">
                    {/* rack */}
                    <div className={`${isSpecialPlace ? "hidden" : "flex items-center w-full"}`}>
                      <label className="max-sm:text-xs max-md:text-sm w-48 max-sm:w-32 font-semibold text-foreground">Rack Number:</label>
                      <select
                        name="rackNumber"
                        className="flex-1 h-10 text-foreground rounded-sm px-3 max-md:px-2 border border-input max-md:text-sm max-xl:text-sm max-sm:text-xs"
                        value={formData.rackNumber}
                        onChange={handleChange}
                      >
                        {racks.length === 0 ? (
                          <option value="" disabled>No racks available</option>
                        ) : (
                          racks.map((rack, index) => (
                            <option key={index} value={rack}>{rack}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* box */}
                    <div className={`${isSpecialPlace ? "hidden" : "flex items-center w-full"}`}>
                      <label className="max-sm:text-xs max-md:text-sm w-48 max-sm:w-32 font-semibold text-foreground">Box Number:</label>
                      <select
                        name="boxNumber"
                        className="flex-1 h-10 text-foreground rounded-sm px-3 max-md:px-2 border border-input max-md:text-sm max-xl:text-sm max-sm:text-xs"
                        value={formData.boxNumber}
                        onChange={handleChange}
                      >
                        {boxes.length === 0 ? (
                          <option value="" disabled>No boxes available</option>
                        ) : (
                          boxes.map((box, index) => (
                            <option key={index} value={box}>{box}</option>
                          ))
                        )}
                      </select>
                    </div>

                    {/* specialPlace */}
                    <div className={`${isSpecialPlace ? "flex items-center w-full" : "hidden"}`}>
                      <label className="max-sm:text-xs max-md:text-sm w-48 max-sm:w-32 font-semibold text-foreground">Location Info:</label>
                      <textarea
                        name="boxNumber"
                        className="flex-1 h-22 text-foreground rounded-sm px-3 max-md:px-2 border border-border max-md:text-sm max-xl:text-sm max-sm:text-xs py-2"
                        placeholder="Describe the location"
                        value={specialPlace}
                        onChange={(e) => { setSpecialPlace(e.target.value) }}
                      />
                    </div>

                    {/* Toggle button */}
                    <div className="h-10 w-40 max-sm:w-32 bg-secondary rounded-sm flex items-center justify-center gap-2 max-sm:gap-1 text-secondary-foreground hover:bg-accent cursor-pointer transition-all border-border border text-sm max-sm:text-xs"
                      onClick={() => setIsSpecialPlace(!isSpecialPlace)}>
                      <p>{isSpecialPlace ? "Rack n Box" : "Special Place"}</p>
                      <ArrowRightLeft className="w-4 h-4" />
                    </div>
                  </div>

                  {/* Remarks section - Fixed structure */}
                  <div className="flex w-full max-md:flex-row lg:w-[48%] justify-around">
                    <label className="max-sm:text-xs max-md:text-sm font-semibold text-foreground max-md:w-[40%] md:w-48">Remarks:</label>
                    <textarea
                      name="remarks"
                      placeholder="Remarks about Property"
                      className="w-full h-24 max-sm:h-20 rounded-md px-3 py-2 border border-border resize-none max-sm:text-xs max-md:w-[60%]"
                      value={formData.remarks}
                      onChange={handleChange}
                    />
                  </div>
                </div>

                {/* Desktop Submit and Reset buttons */}
                <div className="hidden md:flex justify-center gap-3 w-full px-5 max-sm:px-2 lg:mt-6">
                  <Button type="button" variant="signal" size="lg" disabled={uploading} onClick={handleSubmit}>
                    {uploading && <Loader2 className="size-4 animate-spin" />}
                    {uploading ? 'Submitting…' : 'Register property'}
                  </Button>
                  <Button type="button" variant="outline" size="lg" onClick={handleReset}>
                    Reset
                  </Button>
                </div>
              </div>
            </div>
            {/* file uploads section */}
            <div className="flex items-center justify-evenly flex-col h-full bg-secondary/50 w-full lg:w-72 lg:border-l border-border p-4 max-lg:border-t max-lg:mt-0">
              <div className="flex flex-col gap-2 w-full">
                <label className="text-sm font-semibold text-foreground">File Type:</label>
                <select
                  value={fileType}
                  onChange={(e) => setFileType(e.target.value)}
                  className="w-full h-10 text-foreground rounded-sm px-3 border border-input text-sm"
                >
                  <option value="image">Image (Required)</option>
                  <option value="general diary entry">General Diary Entry (Optional)</option>
                  <option value="duty certificate">Duty Certificate (Optional)</option>
                  <option value="report">Report (Optional)</option>
                  <option value="screwtany">Screwtany (Optional)</option>
                  <option value="supplementary report">Supplementary Report (Optional)</option>
                  <option value="other">Other (Optional)</option>
                </select>
              </div>
              <input
                type="file"
                accept={fileType === 'image' ? 'image/png,image/jpeg,image/jpg' : 'application/pdf'}
                ref={fileInputRef}
                onChange={handleFileChange}
                multiple
                className="hidden"
              />
              <Button
                type="button"
                variant="signal"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
                className="mt-3 w-full"
              >
                <Upload className="size-4" />
                Choose {fileType === 'image' ? 'Images (Required)' : 'PDFs (Optional)'} ({selectedFiles.length}/10)
              </Button>
              {previewUrls.length > 0 ? (
                <div className="mt-4 grid grid-cols-2 gap-2 w-full">
                  {previewUrls.map(({ url, type }, index) => (
                    <div key={index} className="relative w-[60px] h-[60px]">
                      {type === 'image' ? (
                        <Image
                          src={url}
                          alt={`Preview ${index + 1}`}
                          width={60}
                          height={60}
                          className="rounded-md border border-border shadow"
                        />
                      ) : (
                        <div className="flex items-center justify-center w-[60px] h-[60px] bg-secondary rounded-sm border border-border shadow-sm text-xs text-muted-foreground truncate p-1">
                          {url}
                        </div>
                      )}
                      <button
                        type="button"
                        onClick={() => handleRemoveFile(index)}
                        className="absolute -top-2 -right-2 bg-danger text-white rounded-full w-4 h-4 text-xs flex items-center justify-center hover:opacity-90 touch-manipulation"
                        title="Remove"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="mt-4 w-[160px] h-[160px] border border-dashed border-input rounded-md flex items-center justify-center text-sm text-muted-foreground text-center">
                  {fileType === 'image' ? (
                    <div > <p>No images selected</p>
                      <p className="text-xs text-danger">(Required)</p>
                    </div>
                  ) : (
                    <div > <p>No PDFs selected</p>
                      <p className="text-xs text-success">(Optional)</p>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Mobile Submit and Reset buttons - Fixed positioning and functionality */}
            <div className="flex md:hidden justify-center gap-3 w-full px-5 max-sm:px-2 py-5 bg-transparent">
              <Button
                type="button"
                variant="signal"
                disabled={uploading}
                onClick={handleSubmit}
                className="min-h-[44px]"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                {uploading && <Loader2 className="size-4 animate-spin" />}
                {uploading ? 'Submitting…' : 'Register'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={handleReset}
                className="min-h-[44px]"
                style={{ WebkitTapHighlightColor: 'transparent' }}
              >
                Reset
              </Button>
            </div>
          </div >
        )
      ) : (

        // access denied
        <div className="flex min-h-[60vh] items-center justify-center p-5">
          <div className="flex w-full max-w-md flex-col items-center gap-5 rounded-md border border-border bg-card px-8 py-8 text-center shadow-sm">
            <span className="grid size-12 place-items-center rounded-full border-2 border-danger text-danger">
              <ShieldAlert className="size-6" />
            </span>
            <h1 className="text-2xl font-semibold tracking-tight text-foreground">Access denied</h1>
            <p className="text-sm text-muted-foreground">
              You don&apos;t have permission to add new property records. This is restricted to Thana Admin / Admin.
            </p>
            <span className="rounded-sm bg-secondary px-3 py-1 text-sm capitalize text-secondary-foreground">Your role: {user.role || "unknown"}</span>
            <div className="h-px w-full bg-border" />
            <p className="text-sm text-muted-foreground">You can still search existing records.</p>
            <Button variant="signal" onClick={() => { router.push("/search-property"); }}>
              Search records
            </Button>
          </div>
        </div>
      )
      }
    </>
  );
}