"use client";
import React, { useState } from "react";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";

export default function Page() {
  const [qrGenerated, setQrGenerated] = useState<string[]>([]);

  const generateQRFunction = () => {
    const qrs = Array.from({ length: 10 }, () => uuidv4());
    setQrGenerated(qrs);
    console.log("Generated QR IDs:", qrs);
  };

  return (
    <div className="p-6 space-y-4">
      <button
        onClick={generateQRFunction}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate QR
      </button>

      <div className=" gap-4">
        {qrGenerated.map((qr, index) => (
          <div key={index} className="p-3 bg-gray-100 rounded shadow-sm text-sm">
            <QRCode value={qr}/>
          </div>
        ))}
      </div>
    </div>
  );
}
