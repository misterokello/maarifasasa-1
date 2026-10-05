import { useEffect, useState } from "react";
import QRCode from "qrcode";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Copy, Download } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  code: string;
  label?: string | null;
}

export function DiscountShareDialog({ open, onOpenChange, code, label }: Props) {
  const [qr, setQr] = useState<string | null>(null);
  const link = `${window.location.origin}/?dc=${encodeURIComponent(code)}`;

  useEffect(() => {
    if (!open) return;
    QRCode.toDataURL(link, { width: 512, margin: 2 })
      .then(setQr)
      .catch(() => setQr(null));
  }, [open, link]);

  const copy = async (value: string, what: string) => {
    await navigator.clipboard.writeText(value);
    toast.success(`${what} copied`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Share {code}</DialogTitle>
        </DialogHeader>
        <div className="space-y-4">
          {label && <p className="text-sm text-muted-foreground">{label}</p>}

          <div className="space-y-2">
            <Label>Referral link</Label>
            <div className="flex gap-2">
              <Input readOnly value={link} />
              <Button variant="outline" size="icon" onClick={() => copy(link, "Link")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Code</Label>
            <div className="flex gap-2">
              <Input readOnly value={code} />
              <Button variant="outline" size="icon" onClick={() => copy(code, "Code")}>
                <Copy className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {qr && (
            <div className="space-y-2 text-center">
              <img src={qr} alt={`QR code for referral link ${code}`} className="mx-auto h-48 w-48 rounded-md border" />
              <Button variant="outline" size="sm" asChild>
                <a href={qr} download={`${code}-qr.png`}>
                  <Download className="h-4 w-4 mr-2" />
                  Download QR
                </a>
              </Button>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}