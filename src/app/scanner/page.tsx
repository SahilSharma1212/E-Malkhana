'use client';

import React, { useRef, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import QrScanner from 'qr-scanner';
import { Check, Loader2, Upload, Camera, CameraOff, AlertTriangle, ScanLine } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function QRScanner() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const scannerRef = useRef<QrScanner | null>(null);
  const handledRef = useRef(false);
  const [result, setResult] = useState<string | null>(null);
  const [isRedirecting, setIsRedirecting] = useState(false);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [cameraOn, setCameraOn] = useState(false);
  const [scanFailed, setScanFailed] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  // Handle a decoded value exactly once so a QR held in frame can't queue
  // multiple redirects. Never navigate to the raw scanned URL — parse its qrId
  // and open the record in-app so a rogue QR can't redirect to an external page.
  const handleDecoded = (data: string) => {
    if (handledRef.current) return;
    handledRef.current = true;
    scannerRef.current?.stop();
    setCameraOn(false);

    let id: string | null = null;
    try {
      id = new URL(data).searchParams.get('qrId');
    } catch {
      id = null;
    }

    if (id) {
      setScanFailed(false);
      setResult(data);
      setIsRedirecting(true);
      setTimeout(() => router.push('/?qrId=' + encodeURIComponent(id)), 1200);
    } else {
      setScanFailed(true);
      setResult('QR not recognized — scan a valid evidence code.');
    }
  };

  useEffect(() => {
    if (!videoRef.current) return;

    const qrScanner = new QrScanner(
      videoRef.current,
      (r) => handleDecoded(r.data),
      {
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      }
    );
    scannerRef.current = qrScanner;

    qrScanner
      .start()
      .then(() => setCameraOn(true))
      .catch(() =>
        setCameraError(
          'Camera unavailable. Grant camera permission, or upload a QR image below.'
        )
      );

    // Fully release the camera, worker and stream on unmount.
    return () => {
      qrScanner.stop();
      qrScanner.destroy();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const startCamera = () => {
    setCameraError(null);
    scannerRef.current
      ?.start()
      .then(() => setCameraOn(true))
      .catch(() =>
        setCameraError(
          'Camera unavailable. Grant camera permission, or upload a QR image below.'
        )
      );
  };

  const stopCamera = () => {
    scannerRef.current?.stop();
    setCameraOn(false);
  };

  const handleUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const res = await QrScanner.scanImage(file, {
      returnDetailedScanResult: true,
    }).catch(() => null);
    if (res) handleDecoded(res.data);
    else {
      setScanFailed(true);
      setResult('No QR code found in that image.');
    }
    e.target.value = '';
  };

  return (
    <div className="mx-auto w-full max-w-xl">
      <div className="mb-5">
        <p className="text-[0.7rem] font-semibold uppercase tracking-[0.18em] text-muted-foreground">
          Evidence Console
        </p>
        <h1 className="mt-1 flex items-center gap-2 text-2xl font-semibold tracking-tight text-foreground">
          <ScanLine className="size-6 text-signal" strokeWidth={1.75} />
          QR Scanner
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Point the camera at an evidence QR to open its record, or upload a photo of the code.
        </p>
      </div>

      <div className="overflow-hidden rounded-md border border-border bg-card shadow-sm">
        {/* Camera / result stage — dark console framing */}
        <div className="relative aspect-square w-full bg-primary">
          <video
            ref={videoRef}
            className={`h-full w-full object-cover ${result ? 'hidden' : 'block'}`}
            muted
            playsInline
          />

          {!result && !cameraError && (
            <div className="pointer-events-none absolute inset-0 flex items-end justify-center p-4">
              <span className="inline-flex items-center gap-2 rounded-sm bg-black/50 px-3 py-1.5 text-xs font-medium text-white">
                {cameraOn ? (
                  <>
                    <span className="size-1.5 animate-pulse rounded-full bg-signal" />
                    Scanning…
                  </>
                ) : (
                  <>Camera stopped</>
                )}
              </span>
            </div>
          )}

          {cameraError && !result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-3 p-6 text-center">
              <AlertTriangle className="size-8 text-signal" />
              <p className="max-w-xs text-sm text-white/90">{cameraError}</p>
            </div>
          )}

          {result && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-4 p-6 text-center">
              {!scanFailed ? (
                <>
                  <span className="grid size-16 place-items-center rounded-full border-2 border-success text-success">
                    <Check className="size-8" />
                  </span>
                  <p className="text-lg font-semibold text-white">QR Found</p>
                  {isRedirecting && (
                    <div className="flex items-center gap-2 text-sm font-medium text-sidebar-foreground">
                      <Loader2 className="size-4 animate-spin" />
                      Opening record…
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="grid size-16 place-items-center rounded-full border-2 border-danger text-danger">
                    <AlertTriangle className="size-8" />
                  </span>
                  <p className="text-sm text-white/90">{result}</p>
                </>
              )}
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex flex-col gap-3 p-4">
          {!result && (
            <div className="flex gap-3">
              <Button
                type="button"
                variant={cameraOn ? 'outline' : 'signal'}
                className="flex-1"
                onClick={startCamera}
              >
                <Camera className="size-4" /> Start
              </Button>
              <Button
                type="button"
                variant="outline"
                className="flex-1"
                onClick={stopCamera}
              >
                <CameraOff className="size-4" /> Stop
              </Button>
            </div>
          )}

          <Button
            type="button"
            variant="secondary"
            className="w-full border border-dashed border-border"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="size-4" /> Upload QR image
          </Button>
          <input
            type="file"
            ref={fileInputRef}
            accept="image/*"
            onChange={handleUpload}
            className="hidden"
          />

          {result && !isRedirecting && (
            <Button
              type="button"
              variant="outline"
              className="w-full"
              onClick={() => {
                handledRef.current = false;
                setResult(null);
                setScanFailed(false);
                setIsRedirecting(false);
                startCamera();
              }}
            >
              Scan again
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
