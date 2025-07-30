'use client'

import supabase from '@/supabaseConfig/supabaseConnect'
import { Wand } from 'lucide-react'
import React, { useState } from 'react'
import QRCode from 'react-qr-code'
import { v4 as uuidv4 } from 'uuid'

export default function Page() {
    const [loading, setLoading] = useState(false)

    const handleGenerate = async () => {
        setLoading(true)

        // 👇 create array of 10 unique entries
        const entries = Array.from({ length: 10 }, () => ({
            qr_id: `https://e-malkhana-smoky.vercel.app/?qrId=${uuidv4()}`,
        }))

        const { data, error } = await supabase
            .from('property_table')
            .insert(entries)

        if (error) {
            console.error('Insert failed:', error.message)
        } else {
            console.log('Inserted:', data)
        }

        setLoading(false)
    }

    const [qrvalue,setQrvalue] = useState("")

    return (
        <div className='h-140 p-5 flex flex-col justify-center gap-10 items-center'>

            <div className='flex flex-col items-center justify-center gap-4 p-3 bg-white rounded-md w-50 py-5'>
                <p>Generate 10 QR IDs</p>
                <button
                    disabled={loading}
                    onClick={handleGenerate}
                    className='border-none outline-none rounded-sm bg-blue-500 text-white p-2 flex gap-2'
                >
                    <p>{loading ? 'Generating...' : 'Generate'}</p>
                    <Wand />
                </button>
            </div>

            <div className='flex flex-col items-center justify-center gap-4 p-3 bg-white rounded-md py-5'>
                <QRCode value={qrvalue} height={10} width={10}/>
                <input placeholder='qrval' value={qrvalue} onChange={(e)=>{setQrvalue(e.target.value)}}/>
            </div>
        </div>
    )
}
