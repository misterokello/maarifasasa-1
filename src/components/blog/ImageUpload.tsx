import React, { useState, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Upload, X, Loader2, Link as LinkIcon } from 'lucide-react';
import { toast } from 'sonner';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface ImageUploadProps {
  value?: string;
  onChange: (url: string) => void;
  label?: string;
  /** Recommended width for helper text */
  recommendedWidth?: number;
  /** Recommended height for helper text */
  recommendedHeight?: number;
  /** Max width to resize uploaded images to (default: 1200) */
  maxWidth?: number;
  /** Max height to resize uploaded images to */
  maxHeight?: number;
  /** JPEG quality 0-1 (default: 0.82) */
  quality?: number;
}

const resizeImage = (
  file: File,
  maxW: number,
  maxH: number,
  quality: number
): Promise<Blob> =>
  new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      let { width, height } = img;
      if (width > maxW || height > maxH) {
        const ratio = Math.min(maxW / width, maxH / height);
        width = Math.round(width * ratio);
        height = Math.round(height * ratio);
      }
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);
      canvas.toBlob(
        (blob) => (blob ? resolve(blob) : reject(new Error('Canvas toBlob failed'))),
        'image/jpeg',
        quality
      );
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });

export const ImageUpload: React.FC<ImageUploadProps> = ({
  value,
  onChange,
  label = "Image",
  recommendedWidth,
  recommendedHeight,
  maxWidth = 1200,
  maxHeight,
  quality = 0.82,
}) => {
  const [uploading, setUploading] = useState(false);
  const [urlInput, setUrlInput] = useState(value || '');
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    try {
      const file = event.target.files?.[0];
      if (!file) return;

      if (!file.type.startsWith('image/')) {
        toast.error('Please select an image file');
        return;
      }

      if (file.size > 5 * 1024 * 1024) {
        toast.error('Image size must be less than 5MB');
        return;
      }

      setUploading(true);

      // Resize & compress
      const mH = maxHeight ?? Math.round(maxWidth * 0.75);
      const optimized = await resizeImage(file, maxWidth, mH, quality);

      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.jpg`;

      const { data, error } = await supabase.storage
        .from('blog-images')
        .upload(fileName, optimized, {
          cacheControl: '3600',
          upsert: false,
          contentType: 'image/jpeg',
        });

      if (error) {
        console.error('Upload error:', error);
        toast.error('Failed to upload image');
        return;
      }

      const { data: { publicUrl } } = supabase.storage
        .from('blog-images')
        .getPublicUrl(data.path);

      onChange(publicUrl);
      setUrlInput(publicUrl);
      toast.success('Image uploaded & optimized');
    } catch (error) {
      console.error('Error uploading image:', error);
      toast.error('Failed to upload image');
    } finally {
      setUploading(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleUrlChange = (url: string) => {
    setUrlInput(url);
    onChange(url);
  };

  const handleRemoveImage = () => {
    onChange('');
    setUrlInput('');
  };

  return (
    <div className="space-y-4">
      <Label>{label}</Label>
      {recommendedWidth && recommendedHeight && (
        <p className="text-xs text-muted-foreground">
          Recommended: {recommendedWidth} × {recommendedHeight}px. Images are auto-compressed on upload.
        </p>
      )}
      
      <Tabs defaultValue="upload" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="upload">Upload</TabsTrigger>
          <TabsTrigger value="url">URL</TabsTrigger>
        </TabsList>
        
        <TabsContent value="upload" className="space-y-4">
          <div className="flex items-center gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileUpload}
              className="hidden"
              id="image-upload"
            />
            <Button
              type="button"
              variant="outline"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploading}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Uploading...
                </>
              ) : (
                <>
                  <Upload className="mr-2 h-4 w-4" />
                  Choose Image
                </>
              )}
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            Upload an image from your computer (max 5MB)
          </p>
        </TabsContent>
        
        <TabsContent value="url" className="space-y-4">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <LinkIcon className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                type="url"
                placeholder="https://example.com/image.jpg"
                value={urlInput}
                onChange={(e) => handleUrlChange(e.target.value)}
                className="pl-9"
              />
            </div>
          </div>
          <p className="text-xs text-muted-foreground">
            Or paste an image URL
          </p>
        </TabsContent>
      </Tabs>

      {/* Image Preview */}
      {value && (
        <div className="relative inline-block">
          <img
            src={value}
            alt="Preview"
            className="max-w-full h-auto max-h-48 rounded-lg border"
            onError={(e) => {
              e.currentTarget.src = '/placeholder.svg';
            }}
          />
          <Button
            type="button"
            variant="destructive"
            size="icon"
            className="absolute -top-2 -right-2 h-6 w-6 rounded-full"
            onClick={handleRemoveImage}
          >
            <X className="h-3 w-3" />
          </Button>
        </div>
      )}
    </div>
  );
};
