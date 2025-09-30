import React, { useEffect, useRef, useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from 'sonner';
import { QrCode, Check, X, List, Loader2 } from 'lucide-react';
import { scanTicketAtomic } from '@/services/ticketService';
import { useAuth } from '@/providers/AuthProvider';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface TicketScannerProps {
  eventId: string;
  onTicketValidated?: (ticketId: string) => void | undefined;
}

interface ScanResult {
  ticketId: string | null;
  success: boolean;
  message: string;
}

const TicketScanner: React.FC<TicketScannerProps> = ({ eventId, onTicketValidated }) => {
  const [scanMode, setScanMode] = useState<'manual' | 'camera'>('manual');
  const [ticketCode, setTicketCode] = useState('');
  const [scanning, setScanning] = useState(false);
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [showValidationDialog, setShowValidationDialog] = useState(false);
  const { user } = useAuth();

  const inputRef = useRef<HTMLInputElement>(null);

  const resetScan = () => {
    setScanResult(null);
    setTicketCode('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
  };

  const handleManualSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();

    if (!ticketCode.trim()) {
      toast.error('Please enter a ticket code');
      return;
    }

    setScanning(true);
    try {
      const res = await scanTicketAtomic({ code: ticketCode.trim(), eventId });
      if (res.success) {
        setScanResult({
          ticketId: res.ticket?.id || ticketCode.trim(),
          success: true,
          message: res.message || 'Valid ticket',
        });
        setShowValidationDialog(true);
      } else {
        setScanResult({
          ticketId: ticketCode.trim(),
          success: false,
          message: res.message || 'Invalid or already used ticket',
        });
        toast.error(res.message || 'Invalid ticket');
      }
    } catch (error) {
      setScanResult({
        ticketId: null,
        success: false,
        message: 'Failed to verify ticket',
      });
      toast.error('Failed to verify ticket');
    } finally {
      setScanning(false);
    }
  };

  const handleQRScan = (data: string | null) => {
    if (data) {
      try {
        // New secure flow: QR should contain only a signed token string
        // If JSON is provided, fall back to extracting known fields
        const parsed = JSON.parse(data) as any;
        if (parsed?.token) {
          // Trigger atomic scan with token
          void handleTokenScan(parsed.token);
          return;
        }
        if (parsed?.ticketCode || parsed?.id) {
          setTicketCode(parsed.ticketCode || parsed.id);
          void handleManualSubmit();
          return;
        }
      } catch {
        // Not JSON: treat as token by default
        void handleTokenScan(data);
      }
    }
  };

  const handleTokenScan = async (token: string) => {
    setScanning(true);
    try {
      const res = await scanTicketAtomic({ token, eventId });
      if (res.success) {
        setScanResult({
          ticketId: res.ticket?.id || null,
          success: true,
          message: res.message || 'Valid ticket',
        });
        setShowValidationDialog(true);
      } else {
        setScanResult({
          ticketId: null,
          success: false,
          message: res.message || 'Invalid or already used ticket',
        });
        toast.error(res.message || 'Invalid ticket');
      }
    } catch (e) {
      toast.error('Failed to verify ticket');
    } finally {
      setScanning(false);
    }
  };

  const handleValidateTicket = async () => {
    if (!user) return;
    // For atomic endpoint, manual validation is already done in handleManualSubmit/handleTokenScan
    // This confirm action simply closes the dialog
    setShowValidationDialog(false);
    if (scanResult?.ticketId && onTicketValidated) onTicketValidated(scanResult.ticketId);
    resetScan();
  };

  // Role-gated UI: allow camera only for staff/organizer/admin
  const canScan = (() => {
    const roles: string[] =
      // try both user_metadata and app_metadata patterns
      ((user as any)?.user_metadata?.roles as string[]) ||
      ((user as any)?.app_metadata?.roles as string[]) ||
      [];

    return roles?.some(r => ['admin', 'organizer', 'staff'].includes(String(r).toLowerCase()));
  })();

  // Camera QR scanning via BarcodeDetector with fallback
  const videoRef = useRef<HTMLVideoElement>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [barcodeSupported, setBarcodeSupported] = useState<boolean>(false);

  useEffect(() => {
    // initialize support flag
    // @ts-ignore
    setBarcodeSupported(typeof window !== 'undefined' && 'BarcodeDetector' in window);
  }, []);

  useEffect(() => {
    let stream: MediaStream | null = null;
    let raf = 0;
    let detector: any;

    const start = async () => {
      try {
        // @ts-ignore
        if (!('BarcodeDetector' in window)) return;
        // @ts-ignore
        detector = new window.BarcodeDetector({ formats: ['qr_code'] });
        setBarcodeSupported(true);
        stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment' },
        });
        if (!videoRef.current) return;
        videoRef.current.srcObject = stream;
        await videoRef.current.play();

        const scan = async () => {
          if (!videoRef.current) return;
          try {
            const barcodes = await detector.detect(videoRef.current);
            if (barcodes && barcodes.length > 0) {
              const raw = barcodes[0].rawValue as string;
              cancelAnimationFrame(raf);
              await handleQRScan(raw);
              return;
            }
          } catch {}
          raf = requestAnimationFrame(scan);
        };
        raf = requestAnimationFrame(scan);
      } catch (e: any) {
        setCameraError(e?.message || 'Camera access failed');
      }
    };

    if (scanMode === 'camera' && canScan) start();
    return () => {
      if (raf) cancelAnimationFrame(raf);
      if (stream) stream.getTracks().forEach(t => t.stop());
    };
  }, [scanMode, canScan]);

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle className='text-lg flex items-center'>
            <QrCode className='mr-2 h-5 w-5' />
            Ticket Scanner
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className='flex justify-center mb-4'>
            <div className='inline-flex rounded-md shadow-sm'>
              <Button
                variant={scanMode === 'manual' ? 'default' : 'outline'}
                className='rounded-r-none'
                onClick={() => setScanMode('manual')}
              >
                <List className='mr-2 h-4 w-4' />
                Manual Entry
              </Button>
              <Button
                variant={scanMode === 'camera' ? 'default' : 'outline'}
                className='rounded-l-none'
                onClick={() => setScanMode('camera')}
                disabled={!canScan}
              >
                <QrCode className='mr-2 h-4 w-4' />
                QR Scanner
              </Button>
            </div>
          </div>

          {scanMode === 'manual' ? (
            <form onSubmit={handleManualSubmit} className='space-y-4'>
              <div>
                <Input
                  ref={inputRef}
                  type='text'
                  placeholder='Enter ticket code'
                  value={ticketCode}
                  onChange={e => setTicketCode((e.target as HTMLInputElement).value)}
                  autoComplete='off'
                  className='text-center text-lg tracking-wider'
                  disabled={scanning}
                />
              </div>

              <Button type='submit' className='w-full' disabled={scanning || !ticketCode.trim()}>
                {scanning ? (
                  <>
                    <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                    Checking...
                  </>
                ) : (
                  'Verify Ticket'
                )}
              </Button>
            </form>
          ) : (
            <div className='space-y-3'>
              {!canScan && (
                <p className='text-center text-sm text-muted-foreground'>
                  You don't have permission to use camera scanning.
                </p>
              )}
              {canScan && (
                <div className='relative border rounded-md overflow-hidden'>
                  <video ref={videoRef} className='w-full h-64 object-cover' muted playsInline />
                  {!barcodeSupported && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm'>
                      BarcodeDetector not supported. Use manual entry.
                    </div>
                  )}
                  {cameraError && (
                    <div className='absolute inset-0 flex items-center justify-center bg-black/40 text-white text-sm'>
                      {cameraError}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {scanResult && !showValidationDialog && (
            <div
              className={`mt-6 p-4 rounded-lg text-center ${
                scanResult.success
                  ? 'bg-green-50 border border-green-200'
                  : 'bg-red-50 border border-red-200'
              }`}
            >
              {scanResult.success ? (
                <>
                  <div className='flex items-center justify-center text-green-700 mb-2'>
                    <Check className='h-6 w-6' />
                    <span className='font-medium ml-2'>Valid Ticket</span>
                  </div>
                  <p className='text-sm text-green-600'>Ticket ID: {scanResult.ticketId}</p>
                </>
              ) : (
                <>
                  <div className='flex items-center justify-center text-red-700 mb-2'>
                    <X className='h-6 w-6' />
                    <span className='font-medium ml-2'>Invalid Ticket</span>
                  </div>
                  <p className='text-sm text-red-600'>{scanResult.message}</p>
                </>
              )}

              <Button onClick={resetScan} variant='outline' className='mt-2'>
                Scan Another
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showValidationDialog} onOpenChange={setShowValidationDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Confirm Ticket Validation</DialogTitle>
          </DialogHeader>

          {scanResult && (
            <div className='space-y-4'>
              <div className='rounded-lg bg-green-50 border border-green-200 p-4'>
                <div className='flex items-center justify-center text-green-700 mb-2'>
                  <Check className='h-6 w-6' />
                  <span className='font-medium ml-2'>Valid Ticket Found</span>
                </div>

                <div className='space-y-2 mt-4'>
                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Ticket ID:</span>
                    <span className='font-medium'>{scanResult.ticketId}</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Event ID:</span>
                    <span className='font-medium'>{eventId}</span>
                  </div>

                  <div className='flex justify-between'>
                    <span className='text-muted-foreground'>Status:</span>
                    <span className='font-medium text-green-600'>Ready to scan</span>
                  </div>
                </div>
              </div>

              <div className='flex justify-end space-x-2'>
                <Button variant='outline' onClick={() => setShowValidationDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={handleValidateTicket} disabled={scanning}>
                  {scanning ? (
                    <>
                      <Loader2 className='mr-2 h-4 w-4 animate-spin' />
                      Processing...
                    </>
                  ) : (
                    'Mark as Used'
                  )}
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};

export default TicketScanner;
