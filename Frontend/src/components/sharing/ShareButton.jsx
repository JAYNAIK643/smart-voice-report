import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Share2, X, MessageCircle, Mail, Copy, Check, Smartphone } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useShare, isNativeShareSupported } from '@/utils/shareUtils';
import { vibrate } from '@/utils/haptics';

/**
 * ShareButton Component - Mobile Experience Enhancement
 * Unified share button with multiple sharing options
 * 
 * Features:
 * - Native share API (if supported)
 * - WhatsApp, SMS, Email fallbacks
 * - QR code generation
 * - Copy to clipboard
 * - Haptic feedback
 */

const ShareButton = ({
  data,
  variant = 'default',
  size = 'default',
  className = '',
  showLabel = true,
  children
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [copied, setCopied] = useState(false);
  const { nativeShare, shareViaWhatsApp, shareViaSMS, shareViaEmail, copyToClipboard, generateQRCode } = useShare();

  const hasNativeShare = isNativeShareSupported();

  const handleNativeShare = async () => {
    vibrate('light');
    const success = await nativeShare(data);
    if (success) {
      setIsOpen(false);
    }
  };

  const handleWhatsAppShare = () => {
    vibrate('light');
    shareViaWhatsApp(data);
    setIsOpen(false);
  };

  const handleSMSShare = () => {
    vibrate('light');
    shareViaSMS(data);
    setIsOpen(false);
  };

  const handleEmailShare = () => {
    vibrate('light');
    shareViaEmail(data);
    setIsOpen(false);
  };

  const handleCopyLink = async () => {
    vibrate('light');
    const success = await copyToClipboard(data.url || window.location.href);
    if (success) {
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const qrCodeUrl = generateQRCode(data.url || window.location.href, 200);

  // If native share is supported, use it directly
  if (hasNativeShare && !isOpen) {
    return (
      <Button
        variant={variant}
        size={size}
        className={className}
        onClick={handleNativeShare}
      >
        <Share2 className="w-4 h-4 mr-2" />
        {showLabel && 'Share'}
      </Button>
    );
  }

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>
        <Button
          variant={variant}
          size={size}
          className={className}
          onClick={() => vibrate('light')}
        >
          <Share2 className="w-4 h-4 mr-2" />
          {showLabel && 'Share'}
        </Button>
      </DialogTrigger>
      
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share</DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          {/* Native share option (if available) */}
          {hasNativeShare && (
            <Button
              variant="outline"
              className="w-full justify-start gap-3"
              onClick={handleNativeShare}
            >
              <Share2 className="w-5 h-5" />
              <span>Share via device</span>
            </Button>
          )}
          
          {/* Sharing options */}
          <div className="grid grid-cols-2 gap-3">
            <Button
              variant="outline"
              className="justify-start gap-3"
              onClick={handleWhatsAppShare}
            >
              <MessageCircle className="w-5 h-5 text-green-500" />
              <span>WhatsApp</span>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-3"
              onClick={handleSMSShare}
            >
              <Smartphone className="w-5 h-5 text-blue-500" />
              <span>SMS</span>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-3"
              onClick={handleEmailShare}
            >
              <Mail className="w-5 h-5 text-red-500" />
              <span>Email</span>
            </Button>
            
            <Button
              variant="outline"
              className="justify-start gap-3"
              onClick={handleCopyLink}
            >
              {copied ? (
                <Check className="w-5 h-5 text-green-500" />
              ) : (
                <Copy className="w-5 h-5" />
              )}
              <span>{copied ? 'Copied!' : 'Copy link'}</span>
            </Button>
          </div>
          
          {/* QR Code */}
          <div className="pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground mb-3 text-center">
              Or scan this QR code
            </p>
            <div className="flex justify-center">
              <img
                src={qrCodeUrl}
                alt="QR Code"
                className="w-40 h-40 rounded-lg border border-border"
              />
            </div>
          </div>
          
          {/* Preview */}
          <div className="pt-4 border-t border-border">
            <p className="text-xs text-muted-foreground mb-2">Preview:</p>
            <div className="p-3 bg-muted rounded-lg">
              <p className="font-medium text-sm">{data.title}</p>
              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                {data.text}
              </p>
            </div>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default ShareButton;
