import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Linkedin, Github, Twitter } from "lucide-react";

interface SocialLinksSectionProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const SocialLinksSection = ({ formData, setFormData }: SocialLinksSectionProps) => {
  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Social Links</h3>
      
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="linkedin_url" className="flex items-center gap-2">
            <Linkedin className="h-4 w-4" />
            LinkedIn
          </Label>
          <Input
            id="linkedin_url"
            type="url"
            value={formData.linkedin_url}
            onChange={(e) => setFormData({ ...formData, linkedin_url: e.target.value })}
            placeholder="https://linkedin.com/in/username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="github_url" className="flex items-center gap-2">
            <Github className="h-4 w-4" />
            GitHub
          </Label>
          <Input
            id="github_url"
            type="url"
            value={formData.github_url}
            onChange={(e) => setFormData({ ...formData, github_url: e.target.value })}
            placeholder="https://github.com/username"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="twitter_url" className="flex items-center gap-2">
            <Twitter className="h-4 w-4" />
            Twitter/X
          </Label>
          <Input
            id="twitter_url"
            type="url"
            value={formData.twitter_url}
            onChange={(e) => setFormData({ ...formData, twitter_url: e.target.value })}
            placeholder="https://twitter.com/username"
          />
        </div>
      </div>
    </div>
  );
};
