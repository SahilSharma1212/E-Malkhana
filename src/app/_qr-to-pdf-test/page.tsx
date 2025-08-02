"use client";
import React from "react";
import { v4 as uuidv4 } from "uuid";
import {
  Document,
  Page as PDFPage,
  StyleSheet,
  View,
  Image,
  pdf,
  Text,
} from "@react-pdf/renderer";

// Generate QR image link
const getQRImageUrl = (value: string) =>
  `https://api.qrserver.com/v1/create-qr-code/?data=${encodeURIComponent(value)}&size=150x150`;

// PDF Component
const QRCodePDF = ({ qrCodes }: { qrCodes: string[] }) => {
  const pages = [];
  for (let i = 0; i < qrCodes.length; i += 6) {
    const chunk = qrCodes.slice(i, i + 6);
    pages.push(
      <PDFPage key={i} size="A4" style={styles.page}>
        <Text style={styles.heading}>Generated QR Codes</Text>
        <View style={styles.qrGrid}>
          {chunk.map((qr, idx) => (
            <View key={idx} style={styles.qrCell}>
              <Image src={getQRImageUrl(qr)} style={styles.qrImage} />
            </View>
          ))}
        </View>
      </PDFPage>
    );
  }

  return <Document>{pages}</Document>;
};



export default function Page() {


  const generateQRAndDownload = async () => {
  const qrs = Array.from({ length: 90 }, () => uuidv4());


  const doc = <QRCodePDF qrCodes={qrs} />;
  const blob = await pdf(doc).toBlob();
  const url = URL.createObjectURL(blob);

  const link = document.createElement("a");
  link.href = url;
  link.download = "qr_codes.pdf";
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};


  return (
    <div className="p-6">
      <button
        onClick={generateQRAndDownload}
        className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
      >
        Generate & Download QR PDF
      </button>
    </div>
  );
}

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
  fontSize: 18,
  textAlign: "center",
  marginBottom: 20,
  fontWeight: "bold",
},
});
