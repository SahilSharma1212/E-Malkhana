'use client';
import { v4 as uuidv4 } from 'uuid';
import React, { useEffect, useState } from 'react';
import Image from 'next/image';
import supabase from '@/config/supabaseConnect';
import toast, { Toaster } from 'react-hot-toast';
import { Ban, Loader2, Logs, Boxes, LayoutGrid, QrCode, ShieldAlert, Trash2, UserPlus, KeyRound, Building2 } from 'lucide-react';
import axios from 'axios';
import Link from 'next/link';
import { Document, Page as PDFPage, StyleSheet, View, Image as PDFImage, pdf, Text } from '@react-pdf/renderer';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatTile } from '@/components/ui/stat-tile';

const styles = StyleSheet.create({
  page: {
    padding: 40,
  },
  qrGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
  },
  qrCell: {
    width: "45%",
    height: 180,
    marginBottom: 20,
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
  },
  qrImage: {
    width: 130,
    height: 130,
  },
  heading: {
    fontSize: 13,
    textAlign: "center",
    marginBottom: 20,
    fontWeight: "bold",
  },
});

const getQRImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=150x150`;

const QRCodePDF = ({ qrCodes, heading, thana }: { qrCodes: string[], heading: string[], thana: string }) => {
  const pages = [];
  for (let i = 0; i < qrCodes.length; i += 6) {
    const chunk = qrCodes.slice(i, i + 6);
    pages.push(
      <PDFPage key={i} size="A4" style={styles.page}>
        <Text style={styles.heading}>QR ID: ({heading[i]} to {heading[i + chunk.length - 1]}) , Thana:{thana}</Text>

        <View style={styles.qrGrid}>
          {chunk.map((qr, idx) => (
            <View key={idx} style={styles.qrCell}>
              <PDFImage src={getQRImageUrl(qr)} style={styles.qrImage} />
              <Text> {/*QR CODE VALUE HERE*/} </Text>
            </View>
          ))}
        </View>
      </PDFPage>
    );
  }

  return <Document>{pages}</Document>;
};

type courtSubmitableItemsType = {
  property_id: string;
  special_category_type: string;
  special_category_worth: number;
  description: string;
  case_status: string;
  updation_date: string;
  name_of_court: string;
}[]

type thanaListType = {
  thana: string;
}[]


export default function Page() {
  const [qrLoading, setQRLoading] = useState(false);
  const [user, setUser] = useState({
    email: '',
    name: '',
    role: '',
    thana: '',
    created_at: '',
    phone: '',
  });
  const [accessUpdate, setAccessUpdate] = useState({
    identifier: '',
    newRole: '',
  });
  const [newUserGeneration, setNewUserGeneration] = useState({
    newusername: '',
    newuserRole: 'viewer',
    newuserEmail: '',
    newuserPhone: '',
    newuserThana: '',
  });
  const [selectedThana, setSelectedThana] = useState('');
  const [availableThanas, setAvailableThanas] = useState<string[]>([]);
  const [rackInput, setRackInput] = useState('');
  const [boxInput, setBoxInput] = useState('');
  const [isAddingRack, setIsAddingRack] = useState(false);
  const [isAddingBox, setIsAddingBox] = useState(false);
  const [isCreatingUser, setIsCreatingUser] = useState(false);
  const [isUpdatingAccess, setIsUpdatingAccess] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [newThanaName, setNewThanaName] = useState("")
  const [propertyDetails, setPropertyDetails] = useState<
    {
      property_id: string;
      name_of_io: string;
      created_at: string;
      date_of_seizure: string;
      category_of_offence: string;
      type_of_seizure: string;
      fir_number: string;
      place_of_seizure: string;
      rack_number: string;
      box_number: string;
      serial_number_from_register: string;
    }[]
  >([]);

  const [isSubmitingThanaNameChange, setIsSubmittingThanaNameChange] = useState(false)

  const [isSubmittingNewThana, setIsSubmittingNewThana] = useState(false)

  const [newThanaCreateObj, setNewThanaCreateObj] = useState({
    name: "",
    district: "",
    pincode: "",
  })

  const [courtSubmitableItems, setCourtSubmitableItems] = useState<courtSubmitableItemsType>([])

  const [specialCategoryThana, setSpecialCategoryThana] = useState("")
  const [currentDate, setCurrentDate] = useState('');

  useEffect(() => {
    setCurrentDate(new Date().toLocaleString());
  }, []);

  const handleSpecialPropertyDataFetch = async () => {

    const { data, error } = await supabase
      .from("property_table")
      .select("property_id, description , case_status, updation_date, name_of_court, special_category_type, special_category_worth")
      .not("special_category_type", "is", null)
      .neq("property_id", "")
      .eq("police_station", specialCategoryThana)
       .eq("isDismantled", false);

    if (error) {
      console.error("Error fetching data:", error);
      return;
    }

    setCourtSubmitableItems(data);
  }

  const [ispropertyDetailsFetched, setIsPropertyDetailsFetched] = useState(true);

  const [newCredentialValueStyle, setNewCredentialValueStyle] = useState("")
  const [existingCredentialValue, setExistingCredentialValue] = useState("");
  const [newCredentialValue, setNewCredentialValue] = useState("")
  const [isCredentialsUpdating, setIsCredentialUpdating] = useState(false);

  const [propertyIdToBeDeleted, setPropertyIdToBeDeleted] = useState("");
  const [isSearchingDetails, setIsSearchingDetails] = useState(false)

  const [hasLoadedData, setHasLoadedData] = useState(false);
  const [thanaList, setThanaList] = useState<thanaListType>([{ thana: user.thana }])


  const handleViewData = async () => {
    setIsSearchingDetails(true)
    if (!user.thana) {
      setIsSearchingDetails(false)
      return
    };

    try {
      const response = await axios.get(`/api/fetch-property-data-admin`, {
        params: { thana: user.thana },
      });

      if (response.data.success) {
        setPropertyDetails(response.data.data);
        setHasLoadedData(true); // Add this line
        setIsSearchingDetails(false);
        return
      } else {
        toast.error(response.data.message);
        setIsPropertyDetailsFetched(false);
        setIsSearchingDetails(false)
        return;
      }
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error("An unexpected error occurred.");
      setIsPropertyDetailsFetched(false);
      setIsSearchingDetails(false)
      return;
    }
  };



  // Updated useEffect with proper logic
  useEffect(() => {
    // Combined auth check and thana fetching
    async function checkAuth() {
      try {
        const res = await axios.get('/api/get-token', { withCredentials: true });
        const userData = res.data.user;

        if (userData) {
          const User = {
            email: userData.email || '',
            name: userData.name || '',
            role: userData.role || '',
            thana: userData.thana || '',
            created_at: userData.created_at || '',
            phone: userData.phone || '',
          };

          setUser(User);

          // Set specialCategoryThana after user data is loaded
          setSpecialCategoryThana(User.thana);

          // Update newUserGeneration with the correct thana
          setNewUserGeneration((prev) => ({
            ...prev,
            newuserThana: User.thana || '',
          }));

          // Admin-only: fetch available thanas for dropdowns
          if (User.role === 'admin' || User.role === 'super admin') {
            try {
              const thanaRes = await axios.get('/api/fetch-thana-admin');
              if (thanaRes.data.success) {
                setAvailableThanas(thanaRes.data.thanas);
              } else {
                toast.error(thanaRes.data.message);
              }
            } catch (thanaErr) {
              console.error('Fetch thanas failed:', thanaErr);
              toast.error("Failed to fetch thanas.");
            }
          }

          // Now fetch thanas with the loaded user data
          if (User.thana) {
            await fetchThanas(User.thana);
          }
        }
      } catch (err) {
        console.error('Auth check failed:', err);
        toast.error('Failed to authenticate user.');
      }
    }

    checkAuth();
  }, []); // Empty dependency array - runs once on mount

  // Updated fetchThanas function
  async function fetchThanas(thanaName: string) {
    try {
      // If no thanaName provided, don't make the query
      if (!thanaName) {
        console.log("No thana name provided to fetchThanas");
        return;
      }

      const { data, error } = await supabase
        .from('thana_rack_box_table')
        .select('thana')

      if (error) {
        console.error("Supabase error:", error);
        toast.error("Unable to find thana details");
        return;
      }

      if (data && data.length > 0) {
        setThanaList(data);
        console.log("Thanas found:", data);
      } else {
        // If no data found, set the user's thana as default
        setThanaList([{ thana: thanaName }]);
        console.log("No thanas found in database, using user thana:", thanaName);
        // Remove the toast message since this might be expected behavior
      }
    } catch (err) {
      console.error("Unexpected error in fetchThanas:", err);
      toast.error("Something went wrong while fetching thanas");
    }
  }

  const handleRackGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingRack) return;
    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!rackInput.trim() || !policeStation) {
      toast.error('Please fill the rack name and select thana.');
      return;
    }

    try {
      setIsAddingRack(true);
      const response = await axios.post('/api/add-rack', {
        rackInput,
        policeStation,
        userName: user.name,
      });

      toast.success(response.data.message || 'Rack added successfully.');
      setRackInput('');
      setSelectedThana('');
    } catch (error) {
      console.error('Rack add error:', error);
      toast.error('Failed to add rack.');
    } finally {
      setIsAddingRack(false);
    }
  };

  const handleBoxGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isAddingBox) return;
    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!boxInput.trim() || !policeStation) {
      toast.error('Please fill the box name and select thana.');
      return;
    }

    try {
      setIsAddingBox(true);
      const response = await axios.post('/api/add-box', {
        boxInput,
        policeStation,
        userName: user.name,
      });

      toast.success(response.data.message || 'Box added successfully.');
      setBoxInput('');
      setSelectedThana('');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('An unexpected error occurred.');
    } finally {
      setIsAddingBox(false);
    }
  };

  const handleQRGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    setQRLoading(true);

    const policeStation = user.role === 'thana admin' ? user.thana : selectedThana;

    if (!policeStation) {
      toast.error('Please select a police station.');
      setQRLoading(false);
      return;
    }

    try {
      const entries = Array.from({ length: 90 }, () => ({
        qr_id: `https://e-malkhana-smoky.vercel.app/?qrId=${uuidv4()}`,
        police_station: policeStation,
        qr_generated_by: user.name,
      }));

      const { data, error } = await supabase.from('property_table').insert(entries).select("id");;

      if (error) {
        console.error('Insert failed:', error.message);
        toast.error('Failed to push QRs to database.');
        setQRLoading(false);
        return;
      }
      const ids: string[] = data.map((item) => String(item.id));

      toast.success('New QRs pushed to database.');

      const qrCodes = entries.map((entry) => entry.qr_id);
      const blob = await pdf(<QRCodePDF qrCodes={qrCodes} heading={ids} thana={policeStation} />).toBlob();
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = 'qr-codes.pdf';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setSelectedThana('');
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Failed to generate QR codes.');
    } finally {
      setQRLoading(false);
    }
  };

  const handleUserGeneration = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isCreatingUser) return;

    const { newusername, newuserEmail, newuserRole, newuserPhone, newuserThana } = newUserGeneration;

    if (!newusername || !newuserEmail || !newuserRole || !newuserPhone || !newuserThana) {
      toast.error('Please fill all fields.');
      return;
    }

    try {
      setIsCreatingUser(true);
      const response = await axios.post('/api/create-user', {
        newusername,
        newuserEmail,
        newuserRole,
        newuserPhone: "+91" + newuserPhone,
        newuserThana,
        updatedBy: user.name,
      });

      toast.success(response.data.message || 'User created successfully.');

      setNewUserGeneration({
        newusername: '',
        newuserRole: 'viewer',
        newuserEmail: '',
        newuserPhone: '',
        newuserThana: user.thana || '',
      });
    } catch (err) {
      console.error('Unexpected error:', err);
      toast.error('Something went wrong.');
    } finally {
      setIsCreatingUser(false);
    }
  };


  const handleThanaNameChange = async () => {
    setIsSubmittingThanaNameChange(true)

    if (selectedThana == "" || newThanaName == "") {
      toast.error("Please fill all the fields");
      setIsSubmittingThanaNameChange(false)
      return;
    }

    try {
      const res = await fetch("/api/update-thana-name", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          selectedThana,
          newThanaName,
          userName: user.name,
        }),
      });

      const result = await res.json();

      if (!result.success) {
        toast.error(result.message || "Update failed");
      } else {
        toast.success("Thana name updated successfully");
        window.location.reload();
      }

    } catch (err) {
      console.error(err);
      toast.error("Unexpected error occurred");
    }

    setIsSubmittingThanaNameChange(false);

  }

  const handleNewThanaCreation = async () => {

    setIsSubmittingNewThana(true)

    if (newThanaCreateObj.name.trim() == "" || newThanaCreateObj.district.trim() == "" || newThanaCreateObj.pincode.trim() == "") {
      toast.error("Fill all the fields")
      setIsSubmittingNewThana(false);


      return;
    }

    const { error } = await supabase.from("thana_rack_box_table").insert(
      {
        thana: newThanaCreateObj.name.toLowerCase(),
        racks: [],
        boxes: [],
        thana_name_updated_by: user.name,
        thana_created_by: user.name,
        district: newThanaCreateObj.district.toLowerCase(),
        pin_code: newThanaCreateObj.pincode.toLowerCase().trim(),
      }
    )

    if (error) {
      console.error(error)
      toast.error("Unable to create Thana")
      setIsSubmittingNewThana(false);
      return;
    }

    toast.success("Thana created successfully")
    setIsSubmittingNewThana(false);
    setNewThanaCreateObj({
      name: "",
      pincode: "",
      district: ""
    })
  }
  type APIResponse = {
    success: boolean;
    message: string;
  };

  const handleNewCredentialChange = async () => {
    setIsCredentialUpdating(true);

    if (
      newCredentialValue.trim() === "" ||
      newCredentialValueStyle.trim() === "" ||
      existingCredentialValue.trim() === ""
    ) {
      toast.error("Please fill all the fields");
      setIsCredentialUpdating(false);
      return;
    }

    try {
      // Prepend "+91" to newCredentialValue if the credential type is phone
      const updatedCredentialValue = newCredentialValueStyle === "phone" ? `+91${newCredentialValue}` : newCredentialValue;

      const response = await axios.post<APIResponse>("/api/update-credential", {
        existingCredentialValue,
        newCredentialValue: updatedCredentialValue,
        newCredentialValueStyle,
        updatedBy: user.name,
      });

      const { success, message } = response.data;

      if (success) {
        toast.success(message);
      } else {
        toast.error(message);
      }
    } catch (error: unknown) {
      if (axios.isAxiosError(error)) {
        const data = error.response?.data as APIResponse;
        toast.error(data?.message || "Server error occurred");
      } else {
        toast.error("Unexpected error occurred");
      }
    } finally {
      setIsCredentialUpdating(false);
    }
  };

  const clearPropertyRecords = async () => {
    // Input validation
    if (!propertyIdToBeDeleted.trim()) {
      toast.error("Cannot Delete Empty ID");
      return;
    }
    if (isDeleting) return;

    const propertyId = propertyIdToBeDeleted.trim().toLowerCase();

    try {
      setIsDeleting(true);
      // Step 1: Check if property exists and fetch file URLs
      const { data: propertyData, error: fetchError } = await supabase
        .from("property_table")
        .select("property_id, image_url, pdf_urls")
        .eq("property_id", propertyId)
        .single();

      if (fetchError) {
        if (fetchError.code === 'PGRST116') {
          toast.error("Property ID not found");
          return;
        }
        console.error("Error fetching property:", fetchError);
        toast.error("Error checking property existence");
        return;
      }

      if (!propertyData || !propertyData.property_id) {
        toast.error("Property ID not found or already deleted");
        return;
      }

      console.log("Property found:", propertyData);

      // Step 2: Extract file URLs from property table
      const allUrls = [];

      // Add image URLs if they exist
      if (propertyData.image_url && Array.isArray(propertyData.image_url)) {
        allUrls.push(...propertyData.image_url);
      }

      // Add PDF URLs if they exist
      if (propertyData.pdf_urls && Array.isArray(propertyData.pdf_urls)) {
        allUrls.push(...propertyData.pdf_urls);
      }

      // Step 3: Fetch and extract PDF URLs from status logs
      const { data: statusLogsData, error: statusFetchError } = await supabase
        .from("status_logs_table")
        .select("pdf_url")
        .eq("property_id", propertyId);

      if (statusFetchError) {
        console.error("Error fetching status logs:", statusFetchError);
        toast.error("Error fetching status logs for file deletion");
        return;
      }

      // Extract PDF URLs from all status log entries
      if (statusLogsData && statusLogsData.length > 0) {
        statusLogsData.forEach(statusLog => {
          if (statusLog.pdf_url && Array.isArray(statusLog.pdf_url)) {
            allUrls.push(...statusLog.pdf_url);
          }
        });
      }

      console.log("Total files to delete:", allUrls);
      console.log("Status logs found:", statusLogsData ? statusLogsData.length : 0);

      // Step 4: Delete files from Supabase Storage
      if (allUrls.length > 0) {
        const deletePromises = allUrls.map(async (fileUrl) => {
          try {
            // Extract file path from Supabase URL
            // URL format: https://[project].supabase.co/storage/v1/object/public/[bucket]/[path]
            const urlParts: string[] = fileUrl.split('/');
            const bucketIndex: number = urlParts.findIndex((part: string) => part === 'public') + 1;

            if (bucketIndex > 0 && bucketIndex < urlParts.length) {
              const bucket = urlParts[bucketIndex];
              const filePath = urlParts.slice(bucketIndex + 1).join('/');

              console.log(`Deleting file from bucket: ${bucket}, path: ${filePath}`);

              const { error: deleteError } = await supabase.storage
                .from(bucket)
                .remove([filePath]);

              if (deleteError) {
                console.error(`Error deleting file ${filePath}:`, deleteError);
                return { success: false, error: deleteError, filePath };
              }

              return { success: true, filePath };
            } else {
              console.warn(`Invalid file URL format: ${fileUrl}`);
              return { success: false, error: 'Invalid URL format', filePath: fileUrl };
            }
          } catch (error) {
            console.error(`Unexpected error deleting file ${fileUrl}:`, error);
            return { success: false, error, filePath: fileUrl };
          }
        });

        const deleteResults = await Promise.all(deletePromises);

        // Log results
        const successfulDeletions = deleteResults.filter(result => result.success);
        const failedDeletions = deleteResults.filter(result => !result.success);

        console.log(`Successfully deleted ${successfulDeletions.length} files`);
        if (failedDeletions.length > 0) {
          console.warn(`Failed to delete ${failedDeletions.length} files:`, failedDeletions);
          toast.error(`Warning: Some files could not be deleted (${failedDeletions.length}/${allUrls.length})`);
        }
      }

      // Step 5: Clear property record (set property_id to null)
      const { error: updateError } = await supabase
        .from("property_table")
        .update({
          property_id: null,
          // Optionally clear the file URLs as well
          image_url: null,
          pdf_urls: null,
          police_station: null,
          place_of_seizure: null,
          serial_number_from_register: null,
          type_of_seizure: null,
          under_section: null,
          io_batch_number: null
        })
        .eq("property_id", propertyId);

      if (updateError) {
        console.error("Error updating property record:", updateError);
        toast.error("Error clearing property record");
        return;
      }

      // Step 6: Delete related status logs 
      const { error: statusLogError } = await supabase
        .from("status_logs_table")
        .delete()
        .eq("property_id", propertyId);

      if (statusLogError) {
        console.warn("Error deleting status logs:", statusLogError);
        toast.error("Property cleared but status logs may remain");
      }

      // Success!
      toast.success("Property records and associated files cleared successfully");
      setPropertyIdToBeDeleted(""); // Clear the input

      // Refresh the property details table to reflect changes
      if (user.thana) {
        try {
          const response = await axios.get(`/api/fetch-property-data-admin`, {
            params: { thana: user.thana },
          });

          if (response.data.success) {
            setPropertyDetails(response.data.data);
          }
        } catch (err) {
          console.error('Error refreshing property data:', err);
        }
      }

    } catch (error) {
      console.error("Unexpected error in clearPropertyRecords:", error);
      toast.error("An unexpected error occurred while clearing property records");
    } finally {
      setIsDeleting(false);
      setConfirmDelete(false);
    }
  };


  const totalWorth = courtSubmitableItems.reduce(
    (sum, item) => sum + (Number(item.special_category_worth) || 0),
    0
  );

  return (
    <div className="space-y-6">
      <Toaster position="top-right" />

      {/* Page header */}
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
            Evidence Console
          </p>
          <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
            <LayoutGrid className="size-6 text-signal" strokeWidth={1.75} />
            Admin Dashboard
          </h1>
        </div>
        <span className="rounded-sm border border-border bg-card px-3 py-1 text-xs font-medium capitalize text-muted-foreground">
          {user.role || 'unknown'} · {user.thana || '—'}
        </span>
      </div>

      {/* Stat tiles */}
      <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
        <StatTile label="Station" value={<span className="capitalize">{user.thana || '—'}</span>} />
        <StatTile label="Seized Items Loaded" value={propertyDetails.length} />
        <StatTile label="Special-Category Items" value={courtSubmitableItems.length} />
        <StatTile
          label="Appx Worth (₹)"
          value={totalWorth.toLocaleString('en-IN')}
          accent
        />
      </div>

      {/* Officer Profile */}
      <Card>
        <CardContent className="flex flex-col items-start gap-6 pt-5 md:flex-row">
          <div className="relative size-24 shrink-0 md:size-28">
            <Image
              src="/e-malkhana.png"
              alt="Officer avatar"
              fill
              className="rounded-md border border-border bg-secondary object-contain p-3"
            />
          </div>
          <div className="grid flex-1 grid-cols-1 gap-4 text-sm sm:grid-cols-2 md:grid-cols-3 max-sm:w-full">
            {[
              { label: 'Name', value: user.name, className: 'capitalize' },
              { label: 'Email', value: user.email },
              { label: 'Role', value: user.role, className: 'capitalize' },
              { label: 'Status', value: 'Active' },
              { label: 'Joined', value: user.created_at },
              { label: 'Phone No.', value: user.phone },
            ].map((f) => (
              <div key={f.label}>
                <p className="text-[0.7rem] font-medium uppercase tracking-wider text-muted-foreground">
                  {f.label}
                </p>
                <p className={`mt-0.5 break-words text-foreground ${f.className || ''}`}>
                  {f.value || 'N/A'}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Seized Property Items */}
      <Card>
        <CardHeader className="flex-row items-center justify-between gap-3">
          <CardTitle className="capitalize">
            Seized Property Items · {user.thana || 'N/A'}
          </CardTitle>
          {!hasLoadedData && (
            <Button
              variant="signal"
              size="sm"
              disabled={isSearchingDetails}
              onClick={handleViewData}
            >
              {isSearchingDetails ? <Loader2 className="size-4 animate-spin" /> : 'Load details'}
            </Button>
          )}
        </CardHeader>

        <CardContent>
          {!ispropertyDetailsFetched && (
            <p className="pb-4 text-center text-sm text-danger">
              ( Try refreshing or logging in again! )
            </p>
          )}

          <div className="w-full overflow-x-auto scrollbar-hidden rounded-sm border border-border">
            <table className="min-w-[1200px] border-collapse text-left text-sm text-foreground">
              <thead className="sticky top-0 z-10 bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {['Property ID', 'Name of IO', 'Created At', 'Date of Seizure', 'Category', 'Type', 'FIR Number', 'Place', 'Rack', 'Box', 'Serial No.', 'Logs'].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-border px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {propertyDetails.map((item, index) => (
                  <tr key={index} className="border-b border-border transition-colors hover:bg-accent">
                    <td className="mono-id whitespace-nowrap px-4 py-2 text-xs">{item.property_id}</td>
                    <td className="whitespace-nowrap px-4 py-2 capitalize">{item.name_of_io}</td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">
                      {new Date(item.created_at).toLocaleDateString()}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">{item.date_of_seizure}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.category_of_offence}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.type_of_seizure}</td>
                    <td className="mono-id whitespace-nowrap px-4 py-2 text-xs">{item.fir_number}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.place_of_seizure}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.rack_number}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.box_number}</td>
                    <td className="mono-id whitespace-nowrap px-4 py-2 text-xs">{item.serial_number_from_register}</td>
                    <td className="whitespace-nowrap px-4 py-2" title="View Logs">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/search-property/${item.property_id}`}>
                          <Logs size={16} />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                {isSearchingDetails && (
                  <tr>
                    <td colSpan={12}>
                      <div className="flex items-center justify-center py-5">
                        <Loader2 className="size-5 animate-spin text-signal" />
                      </div>
                    </td>
                  </tr>
                )}
                {!isSearchingDetails && propertyDetails.length === 0 && hasLoadedData && (
                  <tr>
                    <td colSpan={12} className="py-8 text-center text-sm text-muted-foreground">
                      No property items found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>


      {/* Thana property worth */}
      <Card>
        <CardHeader className="flex-row flex-wrap items-center justify-between gap-3">
          <CardTitle>Thana Property Worth</CardTitle>
          <div className="flex flex-wrap items-center gap-2">
            {user.role === 'super admin' && (
              <select
                onChange={(e) => setSpecialCategoryThana(e.target.value)}
                className="text-input h-9 w-auto min-w-40"
                defaultValue={user.thana}
              >
                <option value={user.thana}>{user.thana}</option>
                {thanaList.map((item, index) => (
                  <option key={index} value={item.thana}>{item.thana}</option>
                ))}
              </select>
            )}
            <Button variant="outline" size="sm" onClick={handleSpecialPropertyDataFetch}>
              View Details
            </Button>
          </div>
        </CardHeader>

        <CardContent>
          <p className="mb-3 text-xs text-muted-foreground">As dated of: {currentDate}</p>
          <div className="w-full overflow-x-auto scrollbar-hidden rounded-sm border border-border">
            <table className="min-w-[800px] w-full border-collapse text-left text-sm text-foreground">
              <thead className="bg-secondary text-xs uppercase tracking-wide text-muted-foreground">
                <tr>
                  {['Property ID', 'Description', 'Case Status', 'Updated', 'Category Type', 'Appx Worth', 'Logs'].map((h) => (
                    <th key={h} className="whitespace-nowrap border-b border-border px-4 py-2.5 font-semibold">
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {courtSubmitableItems.map((item, index) => (
                  <tr key={index} className="border-b border-border transition-colors hover:bg-accent">
                    <td className="mono-id whitespace-nowrap px-4 py-2 text-xs">{item.property_id}</td>
                    <td className="px-4 py-2">{item.description}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.case_status}</td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">{item.updation_date}</td>
                    <td className="whitespace-nowrap px-4 py-2">{item.special_category_type}</td>
                    <td className="whitespace-nowrap px-4 py-2 tabular-nums">
                      {(Number(item.special_category_worth) || 0).toLocaleString('en-IN')}
                    </td>
                    <td className="whitespace-nowrap px-4 py-2">
                      <Button asChild variant="outline" size="sm">
                        <Link href={`/search-property/${item.property_id}`}>
                          <Logs size={16} />
                        </Link>
                      </Button>
                    </td>
                  </tr>
                ))}
                <tr className="bg-secondary/60 font-semibold">
                  <td colSpan={5} className="px-4 py-2.5">Total Appx Worth (₹)</td>
                  <td colSpan={2} className="px-4 py-2.5 tabular-nums">
                    {totalWorth.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {['admin', 'thana admin', 'super admin'].includes(user.role) ? (
        <>
          {/* Forms Section */}
          <div className="w-full flex flex-col md:flex-row gap-6 flex-wrap">
            {/* Create New User */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <UserPlus className="size-4 text-signal" /> Create New User
                </CardTitle>
              </CardHeader>
              <CardContent>
                <form className="space-y-3" onSubmit={handleUserGeneration}>
                  <input
                    type="text"
                    placeholder="Username"
                    value={newUserGeneration.newusername}
                    className="text-input w-full"
                    onChange={(e) =>
                      setNewUserGeneration({ ...newUserGeneration, newusername: e.target.value })
                    }
                  />
                  <input
                    type="email"
                    placeholder="Email"
                    value={newUserGeneration.newuserEmail}
                    className="text-input w-full"
                    onChange={(e) =>
                      setNewUserGeneration({ ...newUserGeneration, newuserEmail: e.target.value })
                    }
                  />
                  <input
                    type="text"
                    placeholder="Phone no."
                    value={newUserGeneration.newuserPhone}
                    className="text-input w-full"
                    onChange={(e) =>
                      setNewUserGeneration({ ...newUserGeneration, newuserPhone: e.target.value })
                    }
                  />
                  {user.role === 'admin' || user.role === 'super admin' ? (
                    <select
                      className="text-input w-full"
                      value={newUserGeneration.newuserThana}
                      onChange={(e) =>
                        setNewUserGeneration({ ...newUserGeneration, newuserThana: e.target.value })
                      }
                    >
                      <option value="">Select Police Station</option>
                      {availableThanas.map((thana) => (
                        <option key={thana} value={thana}>
                          {thana}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-sm border border-input bg-secondary px-3 py-2 text-sm capitalize text-muted-foreground">
                      {user.thana}
                    </div>
                  )}
                  <select
                    className="text-input w-full"
                    value={newUserGeneration.newuserRole}
                    onChange={(e) =>
                      setNewUserGeneration({ ...newUserGeneration, newuserRole: e.target.value })
                    }
                  >
                    <option value="viewer">Viewer</option>
                    {(user.role === 'admin' || user.role === 'super admin') && (
                      <option value="thana admin">Thana Admin</option>
                    )}
                    {user.role === 'super admin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  <Button type="submit" variant="signal" className="w-full" disabled={isCreatingUser}>
                    {isCreatingUser ? <Loader2 className="size-4 animate-spin" /> : 'Create User'}
                  </Button>
                </form>
              </CardContent>
            </Card>

            {/* Change User Access */}
            {(user.role === 'admin' || user.role === 'super admin') ? (
              <Card className="flex-1">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldAlert className="size-4 text-signal" /> Change User Access
                  </CardTitle>
                </CardHeader>
                <CardContent>
                <form
                  className="space-y-3"
                  onSubmit={async (e) => {
                    e.preventDefault();

                    if (!accessUpdate.identifier || !accessUpdate.newRole) {
                      toast.error('Please fill all fields.');
                      return;
                    }

                    if (
                      user.role === 'admin' &&
                      (accessUpdate.newRole === 'admin' || accessUpdate.newRole === 'super admin')
                    ) {
                      toast.error('You are not authorized to assign this role.');
                      return;
                    }

                    if (isUpdatingAccess) return;

                    try {
                      setIsUpdatingAccess(true);
                      // Parameterized lookups (email OR phone) so user input
                      // can't break out of a string-built PostgREST filter.
                      const identifier = accessUpdate.identifier.trim();
                      const [emailRes, phoneRes] = await Promise.all([
                        supabase.from('officer_table').select('*').eq('email_id', identifier),
                        supabase.from('officer_table').select('*').eq('phone', identifier),
                      ]);

                      if (emailRes.error || phoneRes.error) {
                        console.error('Fetch error:', emailRes.error?.message || phoneRes.error?.message);
                        toast.error('Could not find user.');
                        return;
                      }

                      const existing = [...(emailRes.data || []), ...(phoneRes.data || [])];

                      if (existing.length === 0) {
                        toast.error('No user found with that email or phone.');
                        return;
                      }

                      const userToUpdate = existing[0];

                      const { error: updateError } = await supabase
                        .from('officer_table')
                        .update({ role: accessUpdate.newRole, updated_by: user.name, updated_at: new Date().toISOString() })
                        .eq('id', userToUpdate.id);

                      if (updateError) {
                        console.error('Update error:', updateError.message);
                        toast.error('Role update failed.');
                      } else {
                        toast.success('User access updated.');
                        setAccessUpdate({ identifier: '', newRole: '' });
                      }
                    } catch (err) {
                      console.error('Unexpected error:', err);
                      toast.error('Something went wrong.');
                    } finally {
                      setIsUpdatingAccess(false);
                    }
                  }}
                >
                  <input
                    type="text"
                    placeholder="User Email / Phone no."
                    value={accessUpdate.identifier}
                    onChange={(e) =>
                      setAccessUpdate({ ...accessUpdate, identifier: e.target.value })
                    }
                    className="text-input w-full"
                  />
                  <select
                    value={accessUpdate.newRole}
                    onChange={(e) =>
                      setAccessUpdate({ ...accessUpdate, newRole: e.target.value })
                    }
                    className="text-input w-full"
                  >
                    <option value="">Select New Role</option>
                    <option value="viewer">Viewer</option>
                    {(user.role === 'admin' || user.role === 'super admin') && (
                      <option value="thana admin">Thana Admin</option>
                    )}
                    {user.role === 'super admin' && (
                      <>
                        <option value="admin">Admin</option>
                        <option value="super admin">Super Admin</option>
                      </>
                    )}
                  </select>
                  <Button type="submit" variant="signal" className="w-full" disabled={isUpdatingAccess}>
                    {isUpdatingAccess ? <Loader2 className="size-4 animate-spin" /> : 'Update Access'}
                  </Button>
                </form>
                </CardContent>
              </Card>
            ) : (
              <Card className="flex-1">
                <CardContent className="flex flex-col items-center justify-center gap-3 py-8">
                  <Ban size={72} className="text-muted-foreground" />
                  <p className="text-center text-sm text-muted-foreground">
                    Can&apos;t change access as a Thana Admin, but you can create a viewer.
                  </p>
                </CardContent>
              </Card>
            )}

            {/* Generate QR IDs */}
            <Card className="flex-1">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <QrCode className="size-4 text-signal" /> Generate QR IDs
                </CardTitle>
              </CardHeader>
              <CardContent>
                {qrLoading ? (
                  <div className="flex flex-col items-center justify-center gap-3 rounded-sm border border-border bg-secondary/60 py-6">
                    <p className="text-center text-sm font-medium text-muted-foreground">
                      Please wait while we generate a fresh QR batch…
                    </p>
                    <Loader2 className="size-5 animate-spin text-signal" />
                  </div>
                ) : (
                  <form className="space-y-4" onSubmit={handleQRGeneration}>
                    <div className="flex flex-col">
                      <label htmlFor="thana" className="mb-1 text-xs font-medium uppercase tracking-wider text-muted-foreground">
                        Select Police Thana
                      </label>
                      {user.role === 'admin' || user.role === 'super admin' ? (
                        <select
                          value={selectedThana}
                          onChange={(e) => setSelectedThana(e.target.value)}
                          className="text-input w-full"
                        >
                          <option value="">Select Police Station</option>
                          {availableThanas.map((thana) => (
                            <option key={thana} value={thana}>
                              {thana}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <div className="rounded-sm border border-input bg-secondary px-3 py-2 text-sm capitalize text-muted-foreground">
                          {user.thana}
                        </div>
                      )}
                    </div>
                    <Button type="submit" variant="signal" className="w-full">
                      Generate QR IDs
                    </Button>
                  </form>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Rack and Box Forms */}
          <div className="flex gap-6 max-sm:flex-col">
            <Card className="flex-1">
              <form onSubmit={handleRackGeneration}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="size-4 text-signal" /> Add a Rack
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.role === 'admin' || user.role === 'super admin' ? (
                    <select
                      className="text-input w-full"
                      value={selectedThana}
                      onChange={(e) => setSelectedThana(e.target.value)}
                    >
                      <option value="">Select Police Station</option>
                      {availableThanas.map((thana) => (
                        <option key={thana} value={thana}>
                          {thana}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-sm border border-input bg-secondary px-3 py-2 text-sm capitalize text-muted-foreground">
                      {user.thana}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Rack Name"
                    className="text-input w-full"
                    value={rackInput}
                    onChange={(e) => setRackInput(e.target.value)}
                  />
                  <Button type="submit" variant="signal" className="w-full" disabled={isAddingRack}>
                    {isAddingRack ? <Loader2 className="size-4 animate-spin" /> : 'Add Rack'}
                  </Button>
                </CardContent>
              </form>
            </Card>

            <Card className="flex-1">
              <form onSubmit={handleBoxGeneration}>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Boxes className="size-4 text-signal" /> Add a Box
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  {user.role === 'admin' || user.role === 'super admin' ? (
                    <select
                      className="text-input w-full"
                      value={selectedThana}
                      onChange={(e) => setSelectedThana(e.target.value)}
                    >
                      <option value="">Select Police Station</option>
                      {availableThanas.map((thana) => (
                        <option key={thana} value={thana}>
                          {thana}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <div className="rounded-sm border border-input bg-secondary px-3 py-2 text-sm capitalize text-muted-foreground">
                      {user.thana}
                    </div>
                  )}
                  <input
                    type="text"
                    placeholder="Box Name"
                    className="text-input w-full"
                    value={boxInput}
                    onChange={(e) => setBoxInput(e.target.value)}
                  />
                  <Button type="submit" variant="signal" className="w-full" disabled={isAddingBox}>
                    {isAddingBox ? <Loader2 className="size-4 animate-spin" /> : 'Add Box'}
                  </Button>
                </CardContent>
              </form>
            </Card>
          </div>
        </>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center gap-3 py-10">
            <ShieldAlert className="size-10 text-muted-foreground" />
            <p className="text-center text-xl font-semibold text-foreground">
              Data manipulation features denied
            </p>
            <p className="text-center text-sm text-muted-foreground">
              We limit certain features only to admins. You can only see your details here.
            </p>
            <span className="rounded-sm border border-border bg-secondary px-3 py-1 text-sm capitalize text-muted-foreground">
              Your role: {user.role}
            </span>
          </CardContent>
        </Card>
      )}



      {user.role === 'super admin' && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-border" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-muted-foreground">
              Super Admin Access
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {/* Section 1: Change Thana Name */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-signal" /> Change Thana Name
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Select Thana to change</label>
                <select
                  className="text-input w-full"
                  value={selectedThana}
                  onChange={(e) => setSelectedThana(e.target.value)}
                >
                  <option value="">Select Police Station</option>
                  {availableThanas.map((thana) => (
                    <option key={thana} value={thana}>
                      {thana}
                    </option>
                  ))}
                </select>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Enter new name</label>
                <input
                  type="text"
                  className="text-input w-full"
                  placeholder="Enter Thana Name"
                  onChange={(e) => setNewThanaName(e.target.value)}
                />
                <Button
                  variant="signal"
                  className="w-full"
                  disabled={isSubmitingThanaNameChange}
                  onClick={handleThanaNameChange}
                >
                  {isSubmitingThanaNameChange ? <Loader2 className="size-4 animate-spin" /> : 'Update'}
                </Button>
              </CardContent>
            </Card>

            {/* Section 2: Create New Thana */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="size-4 text-signal" /> Create New Thana
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Thana Name</label>
                <input
                  type="text"
                  className="text-input w-full"
                  value={newThanaCreateObj.name}
                  placeholder="Name"
                  onChange={(e) => setNewThanaCreateObj({ ...newThanaCreateObj, name: e.target.value })}
                />
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">District</label>
                <input
                  type="text"
                  className="text-input w-full"
                  value={newThanaCreateObj.district}
                  placeholder="District"
                  onChange={(e) => setNewThanaCreateObj({ ...newThanaCreateObj, district: e.target.value })}
                />
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">PIN Code</label>
                <input
                  type="text"
                  className="text-input w-full"
                  value={newThanaCreateObj.pincode}
                  placeholder="PIN Code"
                  onChange={(e) => setNewThanaCreateObj({ ...newThanaCreateObj, pincode: e.target.value })}
                />
                <Button
                  variant="signal"
                  className="w-full"
                  disabled={isSubmittingNewThana}
                  onClick={handleNewThanaCreation}
                >
                  {isSubmittingNewThana ? <Loader2 className="size-4 animate-spin" /> : 'Create Thana'}
                </Button>
              </CardContent>
            </Card>

            {/* Section 3: Change User Info */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <KeyRound className="size-4 text-signal" /> Change User Contact Info
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Choose credentials to update</label>
                <select
                  className="text-input w-full"
                  onChange={(e) => setNewCredentialValueStyle(e.target.value)}
                >
                  <option value="">Select</option>
                  <option value="email_id">Email Id</option>
                  <option value="phone">Phone</option>
                </select>
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Existing Value</label>
                <input
                  type="tel"
                  className="text-input w-full"
                  placeholder="Value"
                  value={existingCredentialValue}
                  onChange={(e) => setExistingCredentialValue(e.target.value)}
                />
                <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">Enter new value</label>
                <input
                  type="tel"
                  className="text-input w-full"
                  placeholder="Value"
                  value={newCredentialValue}
                  onChange={(e) => setNewCredentialValue(e.target.value)}
                />
                <Button
                  variant="signal"
                  className="w-full"
                  disabled={isCredentialsUpdating}
                  onClick={handleNewCredentialChange}
                >
                  {isCredentialsUpdating ? <Loader2 className="size-4 animate-spin" /> : 'Update Info'}
                </Button>
              </CardContent>
            </Card>
          </div>
        </>
      )}

      {(user.role == "admin" || user.role == "super admin") && (
        <>
          <div className="flex items-center gap-3 pt-2">
            <span className="h-px flex-1 bg-border" />
            <p className="text-xs font-semibold uppercase tracking-[0.18em] text-danger">
              Direct Deletion Access
            </p>
            <span className="h-px flex-1 bg-border" />
          </div>

          <Card className="mx-auto w-full max-w-md border-danger/40">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trash2 className="size-4 text-danger" /> Delete Property Records
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <label className="block text-xs font-medium uppercase tracking-wider text-muted-foreground">
                Property ID to be <span className="text-danger">deleted</span>
              </label>
              <input
                type="tel"
                className="text-input w-full"
                placeholder="Property ID"
                value={propertyIdToBeDeleted}
                onChange={(e) => setPropertyIdToBeDeleted(e.target.value)}
              />
              <Button
                variant="destructive"
                className="w-full"
                disabled={isDeleting}
                onClick={() => {
                  if (isDeleting) return;
                  if (!confirmDelete) {
                    if (!propertyIdToBeDeleted.trim()) {
                      toast.error("Cannot Delete Empty ID");
                      return;
                    }
                    setConfirmDelete(true);
                    setTimeout(() => setConfirmDelete(false), 4000);
                    return;
                  }
                  clearPropertyRecords();
                }}
              >
                {isDeleting ? (
                  <Loader2 className="size-4 animate-spin" />
                ) : confirmDelete ? (
                  'Click again to permanently delete'
                ) : (
                  'Delete Records'
                )}
              </Button>
              {confirmDelete && !isDeleting && (
                <p className="text-xs text-danger">This permanently clears the record, its files and all custody logs.</p>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}