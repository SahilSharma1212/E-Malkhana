import { NextRequest, NextResponse } from "next/server";
import supabase from "@/config/supabaseConnect";

export async function GET() {
  try {
    console.log("🧪 Testing table structure and data");
    
    // Test 1: Check if table exists and get all data
    const { data: allData, error: allError } = await supabase
      .from("thana_rack_box_table")
      .select("*");
      
    console.log("📊 All data from thana_rack_box_table:", allData);
    console.log("❌ Any errors:", allError);
    
    // Test 2: Get unique thana values and sample racks/boxes
    const { data: thanaData } = await supabase
      .from("thana_rack_box_table")
      .select("thana, racks, boxes");
      
    const uniqueThanas = thanaData ? [...new Set(thanaData.map(item => item.thana))] : [];
    
    // For arrays, we need to flatten them first
    const allRacks = thanaData ? thanaData.flatMap(item => item.racks || []) : [];
    const allBoxes = thanaData ? thanaData.flatMap(item => item.boxes || []) : [];
    
    const sampleRacks = [...new Set(allRacks)].filter(Boolean).slice(0, 5);
    const sampleBoxes = [...new Set(allBoxes)].filter(Boolean).slice(0, 5);
    
    console.log("📍 Available thanas:", uniqueThanas);
    console.log("📦 All racks found:", allRacks);
    console.log("📦 All boxes found:", allBoxes);
    console.log("📦 Sample unique racks:", sampleRacks);
    console.log("📦 Sample unique boxes:", sampleBoxes);
    
    return NextResponse.json({
      success: true,
      tableExists: !allError,
      totalRecords: allData?.length || 0,
      availableThanas: uniqueThanas,
      sampleRacks: sampleRacks,
      sampleBoxes: sampleBoxes,
      sampleData: allData?.slice(0, 3) || [], // First 3 records
      error: allError?.message
    });
    
  } catch (err) {
    console.log("❌ Test error:", err);
    return NextResponse.json({
      success: false,
      error: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}