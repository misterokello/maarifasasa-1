import React from 'react';
import { Button } from '@/components/ui/button';
import { Share2, Facebook, Linkedin, Twitter, MessageCircle, Link } from 'lucide-react';
import { toast } from 'sonner';

interface SocialShareProps {
  url: string;
  title: string;
  description?: string;
}

const SocialShare: React.FC<SocialShareProps> = ({ url, title, description }) => {
  const shareUrl = encodeURIComponent(url);
  const shareTitle = encodeURIComponent(title);
  const shareDescription = encodeURIComponent(description || '');

  const shareLinks = {
    twitter: `https://twitter.com/intent/tweet?url=${shareUrl}&text=${shareTitle}`,
    facebook: `https://www.facebook.com/sharer/sharer.php?u=${shareUrl}`,
    linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${shareUrl}`,
    whatsapp: `https://wa.me/?text=${shareTitle}%20${shareUrl}`,
  };

  const handleShare = (platform: keyof typeof shareLinks) => {
    window.open(shareLinks[platform], '_blank', 'width=600,height=400');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(url);
      toast.success('Link copied to clipboard!');
    } catch (error) {
      toast.error('Failed to copy link');
    }
  };

  return (
    <div className="flex flex-col gap-4 p-6 bg-gradient-to-br from-purple-50 to-blue-50 dark:from-purple-950/20 dark:to-blue-950/20 rounded-2xl border border-border/50">
      <div className="flex items-center gap-2 text-lg font-semibold">
        <Share2 className="h-5 w-5" />
        <span>Share this post</span>
      </div>
      
      <div className="flex flex-wrap gap-3">
        <Button
          variant="outline"
          size="lg"
          onClick={() => handleShare('twitter')}
          className="flex items-center gap-2 rounded-xl border-2 hover:bg-[#1DA1F2] hover:text-white hover:border-[#1DA1F2] transition-all"
        >
          <Twitter className="h-5 w-5" />
          <span>Twitter</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleShare('facebook')}
          className="flex items-center gap-2 rounded-xl border-2 hover:bg-[#1877F2] hover:text-white hover:border-[#1877F2] transition-all"
        >
          <Facebook className="h-5 w-5" />
          <span>Facebook</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleShare('linkedin')}
          className="flex items-center gap-2 rounded-xl border-2 hover:bg-[#0A66C2] hover:text-white hover:border-[#0A66C2] transition-all"
        >
          <Linkedin className="h-5 w-5" />
          <span>LinkedIn</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={() => handleShare('whatsapp')}
          className="flex items-center gap-2 rounded-xl border-2 hover:bg-[#25D366] hover:text-white hover:border-[#25D366] transition-all"
        >
          <MessageCircle className="h-5 w-5" />
          <span>WhatsApp</span>
        </Button>

        <Button
          variant="outline"
          size="lg"
          onClick={handleCopyLink}
          className="flex items-center gap-2 rounded-xl border-2 hover:bg-primary hover:text-primary-foreground hover:border-primary transition-all"
        >
          <Link className="h-5 w-5" />
          <span>Copy Link</span>
        </Button>
      </div>
    </div>
  );
};

export default SocialShare;
