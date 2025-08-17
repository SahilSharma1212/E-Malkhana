// File: /pages/api/fetch-io-names.ts
// This is a COMPLETELY NEW FILE - create this file

import { NextApiRequest, NextApiResponse } from 'next';
import supabase from '@/config/supabaseConnect';

interface RequestBody {
  thana: string;
  role: string;
}

interface IoNameRecord {
  name_of_io: string;
}

interface ApiResponse {
  data?: IoNameRecord[];
  error?: string;
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<ApiResponse>
) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { thana, role }: RequestBody = req.body;

    if (!thana || !role) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    let query = supabase
      .from('properties')
      .select('name_of_io')
      .not('name_of_io', 'is', null)
      .not('name_of_io', 'eq', '');

    // Apply role-based filtering if needed
    if (role !== 'admin') {
      query = query.eq('police_station', thana);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Supabase error:', error);
      return res.status(500).json({ error: error.message });
    }

    res.status(200).json({ data: data as IoNameRecord[] });
  } catch (error) {
    console.error('API error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}