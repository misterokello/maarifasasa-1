import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface NotificationSettingsProps {
  formData: any;
  setFormData: (data: any) => void;
}

export const NotificationSettings = ({ formData, setFormData }: NotificationSettingsProps) => {
  const updateNotificationPref = (key: string, value: boolean) => {
    setFormData({
      ...formData,
      notification_preferences: {
        ...formData.notification_preferences,
        [key]: value,
      },
    });
  };

  const prefs = formData.notification_preferences || {
    email_updates: true,
    course_updates: true,
    blog_updates: false,
  };

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold">Notification Preferences</h3>
      
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="email_updates">Email Updates</Label>
            <p className="text-sm text-muted-foreground">
              Receive general platform updates via email
            </p>
          </div>
          <Switch
            id="email_updates"
            checked={prefs.email_updates}
            onCheckedChange={(checked) => updateNotificationPref('email_updates', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="course_updates">Course Updates</Label>
            <p className="text-sm text-muted-foreground">
              Get notified about new courses and learning materials
            </p>
          </div>
          <Switch
            id="course_updates"
            checked={prefs.course_updates}
            onCheckedChange={(checked) => updateNotificationPref('course_updates', checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <Label htmlFor="blog_updates">Blog Updates</Label>
            <p className="text-sm text-muted-foreground">
              Receive notifications about new blog posts
            </p>
          </div>
          <Switch
            id="blog_updates"
            checked={prefs.blog_updates}
            onCheckedChange={(checked) => updateNotificationPref('blog_updates', checked)}
          />
        </div>
      </div>
    </div>
  );
};
