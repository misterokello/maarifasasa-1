
import React, { useState, useEffect } from "react";
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Loader2, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface AdminUser {
  id: string;
  user_id: string;
  email: string;
  created_at: string;
  lastSignIn: string | null;
}

const AdminUsersList = () => {
  const [adminUsers, setAdminUsers] = useState<AdminUser[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleting, setDeleting] = useState<string | null>(null);

  const fetchAdminUsers = async () => {
    setLoading(true);
    try {
      // Use the edge function with GET method to get admin users
      const { data, error } = await supabase.functions.invoke('get-admin-users', {
        method: 'GET'
      });

      if (error) {
        throw error;
      }

      setAdminUsers(data || []);
    } catch (error) {
      console.error('Error fetching admin users:', error);
      toast.error('Failed to load admin users');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteAdmin = async (id: string, userId: string) => {
    if (!window.confirm('Are you sure you want to remove this admin user? This action cannot be undone.')) {
      return;
    }

    setDeleting(id);
    try {
      // Use the edge function to remove admin user
      const { data, error } = await supabase.functions.invoke('remove-admin-user', {
        method: 'POST',
        body: { adminId: id }
      });

      if (error) {
        throw error;
      }

      if (!data.success) {
        throw new Error(data.error || 'Failed to remove admin user');
      }

      toast.success('Admin user removed successfully');
      fetchAdminUsers();
    } catch (error: any) {
      console.error('Error removing admin user:', error);
      toast.error(error.message || 'Failed to remove admin user');
    } finally {
      setDeleting(null);
    }
  };

  useEffect(() => {
    fetchAdminUsers();
  }, []);

  return (
    <div className="space-y-4">
      {loading ? (
        <div className="flex justify-center items-center py-8">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Added On</TableHead>
              <TableHead>Last Sign In</TableHead>
              <TableHead className="w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {adminUsers.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                  No admin users found
                </TableCell>
              </TableRow>
            ) : (
              adminUsers.map((admin) => (
                <TableRow key={admin.id}>
                  <TableCell>{admin.email}</TableCell>
                  <TableCell>{new Date(admin.created_at).toLocaleDateString()}</TableCell>
                  <TableCell>
                    {admin.lastSignIn === 'Never' 
                      ? 'Never' 
                      : admin.lastSignIn ? new Date(admin.lastSignIn).toLocaleDateString() : 'Never'}
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => handleDeleteAdmin(admin.id, admin.user_id)}
                      disabled={deleting === admin.id}
                    >
                      {deleting === admin.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Trash2 className="h-4 w-4" />
                      )}
                    </Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      )}
    </div>
  );
};

export default AdminUsersList;
