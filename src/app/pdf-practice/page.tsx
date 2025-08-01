"use client";
import React, { useState, useRef } from "react";
import QRCode from "react-qr-code";
import { v4 as uuidv4 } from "uuid";
import { jsPDF } from "jspdf";
import html2canvas from "html2canvas";

export default function Page() {
    const [qrCodes, setQrCodes] = useState<string[]>([]);
    const qrRefs = useRef<(HTMLDivElement | null)[]>([]);

    const generateQRs = () => {
        const newCodes = Array.from({ length: 6 }, () => uuidv4());
        setQrCodes(newCodes);
        qrRefs.current = new Array(newCodes.length).fill(null); // Initialize refs
    };

    const downloadPDF = async () => {
        if (qrCodes.length === 0) return; // Prevent PDF generation if no QR codes

        const pdf = new jsPDF({
            orientation: "portrait",
            unit: "px",
            format: "a4",
        });

        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        const chunks = [];
        for (let i = 0; i < qrCodes.length; i += 6) {
            chunks.push(qrRefs.current.slice(i, i + 6));
        }

        for (let pageIndex = 0; pageIndex < chunks.length; pageIndex++) {
            const chunk = chunks[pageIndex];

            const container = document.createElement("div");
            container.style.width = `${pageWidth}px`;
            container.style.height = `${pageHeight}px`;
            container.style.display = "grid";
            container.style.gridTemplateColumns = "repeat(3, 1fr)";
            container.style.gridAutoRows = "1fr";
            container.style.gap = "16px";
            container.style.padding = "32px";
            container.style.backgroundColor = "#ffffff"; // Explicit hex color
            container.style.color = "#000000"; // Explicitly set text color to avoid lab()
            container.style.setProperty("color", "#000000", "important"); // Override any inherited color

            chunk.forEach((qr, idx) => {
                if (qr) {
                    const clone = qr.cloneNode(true) as HTMLElement;
                    // Reset potentially problematic styles
                    clone.style.all = "initial"; // Reset all styles to avoid inherited lab() colors
                    clone.style.padding = "16px";
                    clone.style.backgroundColor = "#ffffff";
                    clone.style.borderRadius = "8px";
                    clone.style.textAlign = "center";
                    clone.style.color = "#000000";
                    clone.style.setProperty("color", "#000000", "important");
                    // Reapply QR code styles
                    const qrCode = clone.querySelector("svg"); // Assuming QRCode renders an SVG
                    if (qrCode) {
                        qrCode.style.backgroundColor = "#ffffff";
                        qrCode.style.color = "#000000";
                    }
                    // Add QR code ID
                    const idText = document.createElement("div");
                    idText.textContent = qrCodes[pageIndex * 6 + idx].slice(0, 8);
                    idText.style.fontSize = "12px";
                    idText.style.color = "#000000";
                    idText.style.setProperty("color", "#000000", "important");
                    idText.style.marginTop = "8px";
                    clone.appendChild(idText);
                    container.appendChild(clone);
                }
            });

            document.body.appendChild(container);
            const canvas = await html2canvas(container, {
                scale: 2,
                backgroundColor: "#ffffff", // Explicit hex color
                useCORS: true,
            });
            const imgData = canvas.toDataURL("image/png");
            if (pageIndex > 0) pdf.addPage();
            pdf.addImage(imgData, "PNG", 0, 0, pageWidth, pageHeight);
            document.body.removeChild(container);
        }

        pdf.save("qr-codes.pdf");
    };

    return (
        <div className="p-6 space-y-4 max-w-7xl mx-auto">
            <div className="space-x-4">
                <button
                    onClick={generateQRs}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
                >
                    Generate QR Codes
                </button>
                <button
                    onClick={downloadPDF}
                    disabled={qrCodes.length === 0}
                    className={`px-4 py-2 rounded text-white transition-colors ${qrCodes.length === 0
                        ? "bg-gray-400 cursor-not-allowed"
                        : "bg-green-600 hover:bg-green-700"
                        }`}
                >
                    Download PDF
                </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mt-4">
                {qrCodes.map((qr, idx) => (
                    <div
                        key={idx}
                        ref={(el) => (qrRefs.current[idx] = el)}
                        className="flex flex-col items-center p-4 bg-white border rounded shadow"
                        style={{ backgroundColor: "#ffffff" }} // Explicit hex color
                    >
                        <QRCode value={qr} size={128} bgColor="#ffffff" fgColor="#000000" />
                        <span style={{ fontSize: "12px", color: "#000000", marginTop: "8px" }}>
                            {qr.slice(0, 8)}
                        </span>
                    </div>
                ))}
            </div>
        </div>
    );
}