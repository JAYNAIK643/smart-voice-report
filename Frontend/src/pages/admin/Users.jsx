import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";
import { Shield, UserPlus, UserMinus, ToggleLeft, ToggleRight, UserCheck, UserX, MapPin, Mail, MoreVertical, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filterRole, setFilterRole] = useState("all");
  const [isInviteModalOpen, setIsInviteModalOpen] = useState(false);
  const [inviteForm, setInviteForm] = useState({
    name: "",
    email: "",
    ward: ""
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const navigate = useNavigate();
  const { isAuthenticated, isAdmin } = useAuth();
  const { toast } = useToast();

  const fetchUsers = async () => {
    try {
      setLoading(true);
      // Backend now returns only SUPER_ADMIN and WARD_ADMIN users
      const response = isAdmin 
        ? await apiService.getAllUsers(filterRole === "all" ? null : filterRole)
        : await fetch("http://localhost:3000/api/users/admin/all", {
            headers: {
              "Authorization": `Bearer ${localStorage.getItem("authToken")}`,
              "Content-Type": "application/json"
            }
          }).then(res => res.json());
      
      if (response.success && Array.isArray(response.data)) {
        setUsers(response.data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    document.title = "Admin Users Management | SmartCity Admin";
    fetchUsers();
  }, [isAdmin, filterRole]);

  const handleToggleStatus = async (userId) => {
    try {
      const response = await apiService.toggleUserStatus(userId);
      if (response.success) {
        toast({ title: "Success", description: response.message });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleRoleChange = async (userId, newRole, ward = "Ward 1") => {
    try {
      const response = await apiService.assignUserRole(userId, newRole, ward);
      if (response.success) {
        toast({ title: "Success", description: response.message });
        fetchUsers();
      }
    } catch (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    }
  };

  const handleInviteSubmit = async (e) => {
    e.preventDefault();
    
    // Validate form
    if (!inviteForm.name.trim() || !inviteForm.email.trim() || !inviteForm.ward) {
      toast({ title: "Error", description: "Please fill all fields", variant: "destructive" });
      return;
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(inviteForm.email)) {
      toast({ title: "Error", description: "Please enter a valid email address", variant: "destructive" });
      return;
    }

    setIsSubmitting(true);
    
    try {
      const token = localStorage.getItem("authToken");
      const response = await fetch(`${import.meta.env.VITE_BACKEND_URL}/api/ward-admin/invite`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(inviteForm)
      });

      const data = await response.json();
      
      if (data.success) {
        toast({ title: "Success", description: "Ward Admin invitation sent successfully!" });
        setIsInviteModalOpen(false);
        setInviteForm({ name: "", email: "", ward: "" });
        fetchUsers(); // Refresh the user list
      } else {
        toast({ title: "Error", description: data.message, variant: "destructive" });
      }
    } catch (error) {
      toast({ title: "Error", description: "Failed to send invitation", variant: "destructive" });
      console.error("Invite error:", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFormChange = (field, value) => {
    setInviteForm(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const getAvatarColor = (index) => {
    const colors = [
      "bg-blue-500",
      "bg-purple-500",
      "bg-pink-500",
      "bg-green-500",
      "bg-orange-500",
    ];
    return colors[index % colors.length];
  };

  const handleWardClick = (wardName) => {
    if (!isAuthenticated) {
      navigate("/admin-login", { state: { from: `/admin/complaints?ward=${wardName}` } });
      return;
    }
    navigate(`/admin/complaints?ward=${wardName}`);
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1">Admin Users Management</h1>
          <p className="text-sm text-muted-foreground">Loading admin users...</p>
        </div>
        <div className="text-center py-12">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground mb-1 bg-blue-400">Admin Users Management</h1>
          <p className="text-sm text-muted-foreground">
            Manage administrator accounts and permissions
          </p>
          <p className="text-xs text-muted-foreground mt-1">Showing {users.length} admin users</p>
        </div>

        {isAdmin && (
          <div className="flex items-center gap-3">
            <label className="text-sm font-medium text-foreground whitespace-nowrap">Filter by Role:</label>
            <select 
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-48 px-4 py-2.5 bg-background border border-input rounded-lg text-foreground text-sm focus:ring-2 focus:ring-primary focus:outline-none transition-all duration-200 hover:border-primary/50 appearance-none cursor-pointer"
            >
              <option value="all">All Admin Roles</option>
              <option value="ward_admin">Ward Admins</option>
              <option value="admin">Super Admins</option>
            </select>
            <Dialog open={isInviteModalOpen} onOpenChange={setIsInviteModalOpen}>
              <DialogTrigger asChild>
                <Button className="bg-primary hover:bg-primary/90">
                  <Plus className="w-4 h-4 mr-2" />
                  Add New Ward Admin
                </Button>
              </DialogTrigger>
              <DialogContent className="sm:max-w-md">
                <DialogHeader>
                  <DialogTitle className="text-xl font-bold">Create Ward Admin</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleInviteSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="name">Full Name</Label>
                    <Input
                      id="name"
                      value={inviteForm.name}
                      onChange={(e) => handleFormChange("name", e.target.value)}
                      placeholder="Enter full name"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address</Label>
                    <Input
                      id="email"
                      type="email"
                      value={inviteForm.email}
                      onChange={(e) => handleFormChange("email", e.target.value)}
                      placeholder="Enter email address"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ward">Assigned Ward</Label>
                    <Select value={inviteForm.ward} onValueChange={(value) => handleFormChange("ward", value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a ward" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Ward 1">Ward 1 (Wagholi)</SelectItem>
                        <SelectItem value="Ward 2">Ward 2 (Kharadi)</SelectItem>
                        <SelectItem value="Ward 3">Ward 3 (Hadapsar)</SelectItem>
                        <SelectItem value="Ward 4">Ward 4 (Baner)</SelectItem>
                        <SelectItem value="Ward 5">Ward 5 (Hinjewadi)</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="pt-4 border-t border-border">
                    <p className="text-sm text-muted-foreground">
                      An invitation email will be sent to the provided email address with instructions to create their account.
                    </p>
                  </div>
                  <div className="flex justify-end gap-3 pt-4">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setIsInviteModalOpen(false)}
                      disabled={isSubmitting}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={isSubmitting}>
                      {isSubmitting ? (
                        <>
                          <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin mr-2" />
                          Sending...
                        </>
                      ) : (
                        "Send Invitation"
                      )}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        )}
      </div>

      {users.length === 0 ? (
        <Card className="border-border/50 bg-card">
          <CardContent className="text-center py-12">
            <div className="text-gray-400 mb-4">
              <svg className="w-16 h-16 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
            <h3 className="text-lg font-medium text-foreground mb-1">No admin users found</h3>
            <p className="text-sm text-muted-foreground">Admin users will appear here once created</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {users.map((user, index) => (
            <Card 
              key={user.id} 
              onClick={() => handleWardClick(user.ward)}
              className="hover:shadow-lg transition-all duration-300 overflow-hidden group"
            >
              <CardContent className="p-5">
                <div className="flex items-start gap-4 mb-4">
                  <div className={`w-14 h-14 rounded-full ${getAvatarColor(index)} flex items-center justify-center text-white font-semibold group-hover:scale-105 transition-transform`}>
                    {user.avatar}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-lg text-foreground truncate">{user.name}</h3>
                    <div className="flex flex-wrap gap-2 mt-2">
                      {/* Role Badge */}
                      {user.role === "admin" && (
                        <Badge className="bg-purple-100 text-purple-800 border-purple-200">
                          <Shield className="w-3 h-3 mr-1" />
                          Super Admin
                        </Badge>
                      )}
                      {user.role === "ward_admin" && (
                        <Badge className="bg-blue-100 text-blue-800 border-blue-200">
                          <UserCheck className="w-3 h-3 mr-1" />
                          Ward Admin
                        </Badge>
                      )}
                      
                      {/* Status Badge */}
                      {user.isActive !== false ? (
                        <Badge variant="outline" className="border-success text-success-foreground">
                          Active
                        </Badge>
                      ) : (
                        <Badge variant="outline" className="border-destructive text-destructive-foreground">
                          Disabled
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
                
                <div className="space-y-3 border-t border-border pt-4">
                  <div className="flex items-center gap-3 text-sm text-muted-foreground">
                    <Mail className="w-4 h-4 flex-shrink-0" />
                    <span className="truncate">{user.email}</span>
                  </div>
                  
                  {user.role === "ward_admin" && (
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <MapPin className="w-4 h-4 flex-shrink-0" />
                      <span>{user.ward}</span>
                    </div>
                  )}
                  
                  {isAdmin && (
                    <div className="pt-4 space-y-4 border-t border-border">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Account Status</span>
                        <Button 
                          onClick={(e) => { e.stopPropagation(); handleToggleStatus(user._id || user.id); }}
                          variant="outline"
                          size="sm"
                          className={`h-7 text-xs ${user.isActive !== false ? "text-success border-success hover:bg-success/10" : "text-destructive border-destructive hover:bg-destructive/10"}`}
                        >
                          {user.isActive !== false ? <ToggleRight className="w-3 h-3 mr-1" /> : <ToggleLeft className="w-3 h-3 mr-1" />}
                          {user.isActive !== false ? "Active" : "Disabled"}
                        </Button>
                      </div>

                      <div className="space-y-3">
                        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wide">Management</span>
                        <div className="space-y-2">
                          {user.role === "admin" ? (
                            <div className="text-xs text-muted-foreground italic">
                              Super Admin accounts cannot be modified
                            </div>
                          ) : user.role === "ward_admin" ? (
                            <Button 
                              onClick={(e) => { e.stopPropagation(); handleRoleChange(user._id || user.id, "user"); }}
                              variant="outline"
                              className="w-full text-destructive hover:text-destructive hover:bg-destructive/10"
                            >
                              <UserMinus className="w-4 h-4 mr-2" />
                              Demote to Citizen
                            </Button>
                          ) : null}
                        </div>
                      </div>
                    </div>
                  )}

                  {user.role === "ward_admin" && (
                    <div className="pt-3 border-t border-border">
                      <span className="text-sm text-muted-foreground">Ward Complaints: <span className="font-semibold text-foreground">{user.complaints || 0}</span></span>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
};

export default Users;