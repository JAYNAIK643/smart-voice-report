import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { 
  Bell, Mail, Smartphone, Volume2, ArrowLeft, User, Shield, 
  Settings2, Trophy, FileText, LogOut, ChevronRight, Sparkles,
  Clock, CheckCircle2, AlertCircle, Loader2
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { useNotifications } from "@/context/notifications-context";
import { usePushNotifications } from "@/hooks/usePushNotifications";
import { useBadges } from "@/context/badges-context";
import { useAuth } from "@/context/auth-context";
import { useComplaints } from "@/context/complaints-context";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import BadgesSection from "@/components/BadgesSection";
import { apiService } from "@/services/apiService";
import VoiceResponse from "@/components/voice/VoiceResponse";
import TwoFactorSetup from "@/components/security/TwoFactorSetup";

const UserSettings = () => {
  const { preferences, updatePreference } = useNotifications();
  const { permission, requestPermission, isSupported } = usePushNotifications();
  const { earnedBadges, availableBadges } = useBadges();
  const { user, signOut } = useAuth();
  const { complaints } = useComplaints();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [userStats, setUserStats] = useState(null);
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);
  const [smsPreferences, setSmsPreferences] = useState({
    sms_enabled: false,
    email_enabled: true,
    phone: "",
    preferred_language: "en"
  });
  const [isUpdating, setIsUpdating] = useState(false);
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [twoFactorStatus, setTwoFactorStatus] = useState(null);

  useEffect(() => {
    document.title = "Settings | SmartCity";
    fetchUserData();
    fetch2FAStatus();
  }, []);

  // Auto-refresh user stats when complaints change
  useEffect(() => {
    if (complaints.length > 0) {
      fetchUserData();
    }
  }, [complaints]);

  const fetchUserData = async () => {
    try {
      setLoading(true);
      const [profileResponse, statsResponse, activityResponse] = await Promise.all([
        apiService.getUserProfile(),
        apiService.getUserStats(),
        apiService.getRecentActivity(5)
      ]);
      
      if (profileResponse.success) {
        // Set SMS preferences from user profile
        setSmsPreferences({
          sms_enabled: profileResponse.data.user.smsEnabled || false,
          email_enabled: profileResponse.data.user.emailEnabled !== false,
          phone: profileResponse.data.user.phone || "",
          preferred_language: profileResponse.data.user.preferredLanguage || "en"
        });
      } else {
        console.warn("User profile not available:", profileResponse);
      }
      
      if (statsResponse.success) {
        setUserStats(statsResponse.data);
      } else {
        console.warn("User stats not available:", statsResponse);
      }
      
      if (activityResponse.success) {
        setRecentActivity(activityResponse.data);
      } else {
        console.warn("Recent activity not available:", activityResponse);
      }
    } catch (error) {
      console.error("Error fetching user data:", error);
      // Don't show error toast - it's not critical and might block 2FA section
      // User can still access settings even if stats fail to load
    } finally {
      setLoading(false);
    }
  };

  const fetch2FAStatus = async () => {
    try {
      const token = localStorage.getItem("authToken");
      if (!token) {
        console.log("No auth token found for 2FA status check");
        setTwoFactorStatus({ enabled: false });
        return;
      }

      const response = await fetch("http://localhost:3000/api/auth/2fa/status", {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });

      const data = await response.json();
      console.log("2FA status response:", data);
      if (data.success) {
        setTwoFactorStatus(data.data);
      } else {
        setTwoFactorStatus({ enabled: false });
      }
    } catch (error) {
      console.error("Error fetching 2FA status:", error);
      setTwoFactorStatus({ enabled: false });
    }
  };

  const handlePushToggle = async (enabled) => {
    if (enabled && permission !== 'granted') {
      const result = await requestPermission();
      if (result === 'granted') {
        await updatePreference('push_enabled', true);
        toast.success('Push notifications enabled');
      } else if (result === 'denied') {
        toast.error('Permission denied', {
          description: 'Please enable notifications in your browser settings.'
        });
      }
    } else {
      await updatePreference('push_enabled', enabled);
      toast.success(enabled ? 'Push notifications enabled' : 'Push notifications disabled');
    }
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
    toast.success('Signed out successfully');
  };

  const handleUpdatePreferences = async (updates) => {
    try {
      setIsUpdating(true);
      const newPrefs = { ...smsPreferences, ...updates };
      
      // Validate phone number if SMS is being enabled
      if (updates.sms_enabled === true || (newPrefs.sms_enabled && updates.phone)) {
        if (!newPrefs.phone || newPrefs.phone.trim() === '') {
          toast.error("Please add a phone number before enabling SMS notifications");
          setIsUpdating(false);
          return;
        }
        
        // Basic phone number validation (international format)
        const phoneRegex = /^\+[1-9]\d{1,14}$/;
        if (!phoneRegex.test(newPrefs.phone.trim())) {
          toast.error("Please enter a valid phone number in international format (e.g., +1234567890)");
          setIsUpdating(false);
          return;
        }
      }
      
      setSmsPreferences(newPrefs);
      
      const response = await apiService.updateNotificationPreferences({
        smsEnabled: newPrefs.sms_enabled,
        emailEnabled: newPrefs.email_enabled,
        phone: newPrefs.phone.trim(),
        preferredLanguage: newPrefs.preferred_language
      });

      if (response.success) {
        toast.success("Preferences updated successfully");
      } else {
        toast.error(response.message || "Failed to update preferences");
      }
    } catch (error) {
      console.error("Error updating preferences:", error);
      toast.error(error.message || "Failed to update preferences");
    } finally {
      setIsUpdating(false);
    }
  };

  // Use backend stats or fallback to local complaints
  const complaintsSubmitted = userStats?.complaintsSubmitted || complaints?.length || 0;
  const resolvedCount = userStats?.complaintsResolved || 0;
  const pendingCount = userStats?.complaintBreakdown?.pending || 0;
  const inProgressCount = userStats?.complaintBreakdown?.inProgress || 0;
  const activeCount = pendingCount + inProgressCount;
  
  const userInitials = user?.email?.substring(0, 2).toUpperCase() || 'U';
  const badgeProgress = availableBadges.length > 0 
    ? Math.round((earnedBadges.length / availableBadges.length) * 100) 
    : 0;

  const menuItems = [
    { id: "profile", label: "Profile", icon: User },
    { id: "badges", label: "Badges", icon: Trophy },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "privacy", label: "Privacy & Security", icon: Shield },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <div className="max-w-6xl mx-auto px-4 py-8 pt-24">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="icon"
                onClick={() => navigate(-1)}
                className="rounded-full"
              >
                <ArrowLeft className="h-5 w-5" />
              </Button>
              <div>
                <h1 className="text-3xl font-bold text-foreground flex items-center gap-2">
                  <Settings2 className="h-8 w-8 text-primary" />
                  Settings
                </h1>
                <p className="text-muted-foreground">Manage your account and preferences</p>
              </div>
            </div>
            <Button variant="outline" onClick={handleSignOut} className="gap-2">
              <LogOut className="h-4 w-4" />
              Sign Out
            </Button>
          </div>

          {/* Main Content */}
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
            {/* Sidebar */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24 border-border/50 bg-card/50 backdrop-blur-sm">
                <CardContent className="p-4">
                  {/* User Info */}
                  <div className="flex flex-col items-center text-center mb-6 pt-4">
                    <motion.div
                      whileHover={{ scale: 1.05 }}
                      className="relative"
                    >
                      <Avatar className="h-20 w-20 border-4 border-primary/20">
                        <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-xl font-bold">
                          {userInitials}
                        </AvatarFallback>
                      </Avatar>
                      <div className="absolute -bottom-1 -right-1 bg-green-500 h-5 w-5 rounded-full border-2 border-background" />
                    </motion.div>
                    <h3 className="mt-4 font-semibold text-foreground">{user?.email}</h3>
                    <Badge variant="secondary" className="mt-2">
                      <Sparkles className="h-3 w-3 mr-1" />
                      Active Citizen
                    </Badge>
                  </div>

                  <Separator className="mb-4" />

                  {/* Navigation */}
                  <nav className="space-y-1">
                    {menuItems.map((item) => (
                      <motion.button
                        key={item.id}
                        whileHover={{ x: 4 }}
                        whileTap={{ scale: 0.98 }}
                        onClick={() => setActiveTab(item.id)}
                        className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                          activeTab === item.id
                            ? 'bg-primary text-primary-foreground'
                            : 'text-muted-foreground hover:bg-muted hover:text-foreground'
                        }`}
                      >
                        <item.icon className="h-4 w-4" />
                        {item.label}
                        <ChevronRight className={`h-4 w-4 ml-auto transition-transform ${
                          activeTab === item.id ? 'rotate-90' : ''
                        }`} />
                      </motion.button>
                    ))}
                  </nav>

                  <Separator className="my-4" />

                  {/* Quick Stats */}
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
                      Your Activity
                    </h4>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-muted/50 rounded-lg p-2">
                        <p className="text-lg font-bold text-foreground">{complaintsSubmitted}</p>
                        <p className="text-[10px] text-muted-foreground">Total</p>
                      </div>
                      <div className="bg-amber-500/10 rounded-lg p-2">
                        <p className="text-lg font-bold text-amber-500">{activeCount}</p>
                        <p className="text-[10px] text-muted-foreground">Active</p>
                      </div>
                      <div className="bg-green-500/10 rounded-lg p-2">
                        <p className="text-lg font-bold text-green-500">{resolvedCount}</p>
                        <p className="text-[10px] text-muted-foreground">Resolved</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Main Content Area */}
            <div className="lg:col-span-3 space-y-6">
              <AnimatePresence mode="wait">
                {/* Profile Tab */}
                {activeTab === "profile" && (
                  <motion.div
                    key="profile"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                    className="space-y-6"
                  >
                    {/* Profile Overview Card */}
                    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50 overflow-hidden">
                      <div className="h-24 bg-gradient-to-r from-primary/20 via-primary/10 to-transparent" />
                      <CardContent className="-mt-12 px-6 pb-6">
                        <div className="flex items-end gap-4">
                          <Avatar className="h-24 w-24 border-4 border-background shadow-lg">
                            <AvatarFallback className="bg-gradient-to-br from-primary to-primary/60 text-white text-2xl font-bold">
                              {userInitials}
                            </AvatarFallback>
                          </Avatar>
                          <div className="flex-1 pb-2">
                            <h2 className="text-xl font-bold">{user?.email}</h2>
                            <p className="text-muted-foreground text-sm">Member since {new Date(user?.created_at || Date.now()).toLocaleDateString()}</p>
                          </div>
                        </div>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <FileText className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{complaintsSubmitted}</p>
                              <p className="text-xs text-muted-foreground">Complaints Filed</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                              <Trophy className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{earnedBadges.length}</p>
                              <p className="text-xs text-muted-foreground">Badges Earned</p>
                            </div>
                          </div>
                          <div className="flex items-center gap-3 p-4 rounded-xl bg-muted/30">
                            <div className="p-2 rounded-lg bg-green-500/10">
                              <CheckCircle2 className="h-5 w-5 text-green-500" />
                            </div>
                            <div>
                              <p className="text-2xl font-bold">{resolvedCount}</p>
                              <p className="text-xs text-muted-foreground">Issues Resolved</p>
                            </div>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    {/* Recent Activity */}
                    <Card className="border-border/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Clock className="h-5 w-5 text-primary" />
                          Recent Activity
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        {loading ? (
                          <div className="text-center py-8 text-muted-foreground">
                            <p>Loading...</p>
                          </div>
                        ) : recentActivity.length > 0 ? (
                          <div className="space-y-3">
                            {recentActivity.map((activity, index) => (
                              <motion.div
                                key={activity._id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                              >
                                <div className="flex items-center gap-3">
                                  <div className={`p-2 rounded-lg ${
                                    activity.status === 'resolved' ? 'bg-green-500/10' :
                                    activity.status === 'in-progress' ? 'bg-blue-500/10' :
                                    'bg-amber-500/10'
                                  }`}>
                                    {activity.status === 'resolved' ? (
                                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                                    ) : activity.status === 'in-progress' ? (
                                      <Clock className="h-4 w-4 text-blue-500" />
                                    ) : (
                                      <AlertCircle className="h-4 w-4 text-amber-500" />
                                    )}
                                  </div>
                                  <div>
                                    <p className="font-medium text-sm">{activity.title}</p>
                                    <p className="text-xs text-muted-foreground">{activity.complaintId}</p>
                                  </div>
                                </div>
                                <Badge variant={
                                  activity.status === 'resolved' ? 'default' :
                                  activity.status === 'in-progress' ? 'secondary' : 'outline'
                                }>
                                  {activity.status}
                                </Badge>
                              </motion.div>
                            ))}
                          </div>
                        ) : (
                          <div className="text-center py-8 text-muted-foreground">
                            <FileText className="h-12 w-12 mx-auto mb-3 opacity-50" />
                            <p>No complaints filed yet</p>
                            <Button 
                              variant="link" 
                              onClick={() => navigate('/submit')}
                              className="mt-2"
                            >
                              Submit your first complaint
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* Quick Actions */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card 
                          className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => navigate('/submit')}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-xl bg-primary/10">
                              <FileText className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Submit Complaint</h3>
                              <p className="text-sm text-muted-foreground">Report a new issue</p>
                            </div>
                            <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </motion.div>
                      <motion.div whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
                        <Card 
                          className="border-border/50 cursor-pointer hover:border-primary/50 transition-colors"
                          onClick={() => navigate('/track')}
                        >
                          <CardContent className="flex items-center gap-4 p-6">
                            <div className="p-3 rounded-xl bg-green-500/10">
                              <CheckCircle2 className="h-6 w-6 text-green-500" />
                            </div>
                            <div>
                              <h3 className="font-semibold">Track Complaints</h3>
                              <p className="text-sm text-muted-foreground">View your submissions</p>
                            </div>
                            <ChevronRight className="h-5 w-5 ml-auto text-muted-foreground" />
                          </CardContent>
                        </Card>
                      </motion.div>
                    </div>
                  </motion.div>
                )}

                {/* Badges Tab */}
                {activeTab === "badges" && (
                  <motion.div
                    key="badges"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <BadgesSection />
                  </motion.div>
                )}

                {/* Notifications Tab */}
                {activeTab === "notifications" && (
                  <motion.div
                    key="notifications"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Bell className="h-5 w-5 text-primary" />
                          Notification Preferences
                        </CardTitle>
                        <CardDescription>Choose how you want to be notified about updates</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        {/* In-App Notifications */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-primary/10">
                              <Bell className="h-5 w-5 text-primary" />
                            </div>
                            <div>
                              <Label className="font-medium">In-App Notifications</Label>
                              <p className="text-sm text-muted-foreground">Show toast notifications within the app</p>
                            </div>
                          </div>
                          <Switch 
                            checked={preferences.in_app_enabled} 
                            onCheckedChange={(v) => {
                              updatePreference('in_app_enabled', v);
                              toast.success(v ? 'In-app notifications enabled' : 'In-app notifications disabled');
                            }}
                          />
                        </motion.div>

                        {/* Email Notifications */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Mail className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Email Notifications</Label>
                              <p className="text-sm text-muted-foreground">Receive email alerts for important updates</p>
                            </div>
                          </div>
                          <Switch 
                            checked={smsPreferences.email_enabled} 
                            onCheckedChange={(v) => {
                              updatePreference('email_enabled', v);
                              handleUpdatePreferences({ email_enabled: v });
                            }}
                            disabled={isUpdating}
                          />
                        </motion.div>

                        {/* SMS Notifications (Independent Extension) */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="flex flex-col gap-4 p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-4">
                              <div className="p-2 rounded-lg bg-green-500/10">
                                <Smartphone className="h-5 w-5 text-green-500" />
                              </div>
                              <div>
                                <Label className="font-medium">SMS Notifications</Label>
                                <p className="text-sm text-muted-foreground">Receive text alerts on your phone</p>
                              </div>
                            </div>
                            <Switch 
                              checked={smsPreferences.sms_enabled} 
                              onCheckedChange={(v) => {
                                // If enabling SMS and no phone number exists, show guidance
                                if (v && (!smsPreferences.phone || smsPreferences.phone.trim() === '')) {
                                  toast.error("Please add your phone number below before enabling SMS notifications");
                                  return;
                                }
                                handleUpdatePreferences({ sms_enabled: v });
                              }}
                              disabled={isUpdating}
                            />
                          </div>
                          
                          {smsPreferences.sms_enabled && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="space-y-4 pt-2 border-t border-border/50"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="phone">Phone Number</Label>
                                <div className="flex gap-2">
                                  <input 
                                    id="phone"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={smsPreferences.phone}
                                    onChange={(e) => setSmsPreferences({...smsPreferences, phone: e.target.value})}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleUpdatePreferences({ phone: smsPreferences.phone })}
                                    disabled={isUpdating || !smsPreferences.phone || smsPreferences.phone.trim() === ''}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : 'Save'}
                                  </Button>
                                </div>
                                {!smsPreferences.phone && (
                                  <p className="text-sm text-yellow-600 dark:text-yellow-400">
                                    ⚠️ Please add your phone number to receive SMS notifications
                                  </p>
                                )}
                              </div>
                              
                              <div className="space-y-2">
                                <Label htmlFor="language">Preferred Language</Label>
                                <select 
                                  id="language"
                                  value={smsPreferences.preferred_language}
                                  onChange={(e) => handleUpdatePreferences({ preferred_language: e.target.value })}
                                  disabled={isUpdating}
                                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
                                >
                                  <option value="en">English</option>
                                  <option value="hi">Hindi (हिंदी)</option>
                                  <option value="mr">Marathi (मराठी)</option>
                                </select>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Show phone number input even when SMS is disabled, but in a collapsed state */}
                          {!smsPreferences.sms_enabled && !smsPreferences.phone && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="pt-2 border-t border-border/50"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="phone-add">Add Phone Number</Label>
                                <p className="text-sm text-muted-foreground">
                                  Add your phone number now to enable SMS notifications later
                                </p>
                                <div className="flex gap-2">
                                  <input 
                                    id="phone-add"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={smsPreferences.phone}
                                    onChange={(e) => setSmsPreferences({...smsPreferences, phone: e.target.value})}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleUpdatePreferences({ phone: smsPreferences.phone })}
                                    disabled={isUpdating || !smsPreferences.phone || smsPreferences.phone.trim() === ''}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                          
                          {/* Show existing phone number when SMS is disabled but phone exists */}
                          {!smsPreferences.sms_enabled && smsPreferences.phone && (
                            <motion.div 
                              initial={{ opacity: 0, height: 0 }}
                              animate={{ opacity: 1, height: 'auto' }}
                              className="pt-2 border-t border-border/50"
                            >
                              <div className="space-y-2">
                                <Label htmlFor="phone-disabled">Phone Number (for future SMS)</Label>
                                <div className="flex gap-2">
                                  <input 
                                    id="phone-disabled"
                                    type="tel"
                                    placeholder="+1234567890"
                                    value={smsPreferences.phone}
                                    onChange={(e) => setSmsPreferences({...smsPreferences, phone: e.target.value})}
                                    className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                                  />
                                  <Button 
                                    size="sm" 
                                    onClick={() => handleUpdatePreferences({ phone: smsPreferences.phone })}
                                    disabled={isUpdating || !smsPreferences.phone || smsPreferences.phone.trim() === ''}
                                  >
                                    {isUpdating ? (
                                      <>
                                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                        Saving...
                                      </>
                                    ) : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </motion.div>
                          )}
                        </motion.div>

                        {/* Push Notifications */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-purple-500/10">
                              <Smartphone className="h-5 w-5 text-purple-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Push Notifications</Label>
                              <p className="text-sm text-muted-foreground">
                                {!isSupported 
                                  ? 'Not supported in this browser' 
                                  : permission === 'denied'
                                    ? 'Blocked - enable in browser settings'
                                    : 'Desktop browser push notifications'}
                              </p>
                            </div>
                          </div>
                          <Switch 
                            checked={preferences.push_enabled && permission === 'granted'} 
                            onCheckedChange={handlePushToggle}
                            disabled={!isSupported || permission === 'denied'}
                          />
                        </motion.div>

                        {/* Voice Response - NEW */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-4 mb-4">
                            <div className="p-2 rounded-lg bg-orange-500/10">
                              <Volume2 className="h-5 w-5 text-orange-500" />
                            </div>
                            <div className="flex-1">
                              <Label className="font-medium">Voice Responses</Label>
                              <p className="text-sm text-muted-foreground">Audio feedback for status updates and notifications</p>
                            </div>
                          </div>
                          <VoiceResponse />
                        </motion.div>

                        {/* Sound Notifications */}
                        <motion.div 
                          whileHover={{ scale: 1.01 }}
                          className="flex items-center justify-between p-4 rounded-xl bg-muted/30 border border-transparent hover:border-border/50 transition-all"
                        >
                          <div className="flex items-center gap-4">
                            <div className="p-2 rounded-lg bg-amber-500/10">
                              <Volume2 className="h-5 w-5 text-amber-500" />
                            </div>
                            <div>
                              <Label className="font-medium">Notification Sounds</Label>
                              <p className="text-sm text-muted-foreground">Play a chime sound when notifications arrive</p>
                            </div>
                          </div>
                          <Switch 
                            checked={preferences.sound_enabled} 
                            onCheckedChange={(v) => {
                              updatePreference('sound_enabled', v);
                              toast.success(v ? 'Notification sounds enabled' : 'Notification sounds disabled');
                            }}
                          />
                        </motion.div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}

                {/* Privacy Tab */}
                {activeTab === "privacy" && (
                  <motion.div
                    key="privacy"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.2 }}
                  >
                    <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
                      <CardHeader>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="h-5 w-5 text-primary" />
                          Privacy & Security
                        </CardTitle>
                        <CardDescription>Manage your account security and privacy settings</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-6">
                        <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                          <div className="flex items-center gap-3">
                            <CheckCircle2 className="h-5 w-5 text-green-500" />
                            <div>
                              <p className="font-medium text-green-700 dark:text-green-400">Account Secured</p>
                              <p className="text-sm text-green-600 dark:text-green-500">Your account is protected with email authentication</p>
                            </div>
                          </div>
                        </div>

                        <div className="space-y-4">
                          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                            <div>
                              <p className="font-medium">Email Address</p>
                              <p className="text-sm text-muted-foreground">{user?.email}</p>
                            </div>
                            <Badge variant="secondary">Verified</Badge>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                            <div>
                              <p className="font-medium">Account Created</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(user?.created_at || Date.now()).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric'
                                })}
                              </p>
                            </div>
                          </div>

                          <div className="flex items-center justify-between p-4 rounded-xl bg-muted/30">
                            <div>
                              <p className="font-medium">Last Sign In</p>
                              <p className="text-sm text-muted-foreground">
                                {new Date(user?.last_sign_in_at || Date.now()).toLocaleDateString('en-US', {
                                  year: 'numeric',
                                  month: 'long',
                                  day: 'numeric',
                                  hour: '2-digit',
                                  minute: '2-digit'
                                })}
                              </p>
                            </div>
                          </div>
                        </div>

                        <Separator />

                        {/* Two-Factor Authentication */}
                        <div className="space-y-4">
                          <div className="flex items-center gap-3">
                            <div className="p-2 rounded-lg bg-blue-500/10">
                              <Shield className="h-5 w-5 text-blue-500" />
                            </div>
                            <div>
                              <h4 className="font-medium">Two-Factor Authentication (2FA)</h4>
                              <p className="text-sm text-muted-foreground">Enhance your account security with two-factor authentication</p>
                            </div>
                          </div>
                          
                          {twoFactorStatus === null ? (
                            <div className="p-4 rounded-xl bg-muted/30">
                              <p className="text-sm text-muted-foreground">Loading 2FA status...</p>
                            </div>
                          ) : twoFactorStatus?.enabled ? (
                            <div className="p-4 rounded-xl bg-green-500/10 border border-green-500/20">
                              <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                  <CheckCircle2 className="h-5 w-5 text-green-500" />
                                  <div>
                                    <p className="font-medium text-green-700 dark:text-green-400">2FA Enabled</p>
                                    <p className="text-sm text-green-600 dark:text-green-500">
                                      Enabled on {new Date(twoFactorStatus.enabledAt).toLocaleDateString()}
                                    </p>
                                  </div>
                                </div>
                                <Button 
                                  variant="outline" 
                                  size="sm"
                                  className="border-red-500/50 text-red-600 hover:bg-red-500/10"
                                  onClick={async () => {
                                    const password = prompt("Enter your password to disable 2FA:");
                                    if (!password) return;
                                    
                                    const token = prompt("Enter your authenticator code:");
                                    if (!token) return;

                                    try {
                                      const authToken = localStorage.getItem("authToken");
                                      const response = await fetch("http://localhost:3000/api/auth/2fa/disable", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${authToken}`
                                        },
                                        body: JSON.stringify({ password, token })
                                      });

                                      const data = await response.json();
                                      if (data.success) {
                                        toast.success("2FA disabled successfully");
                                        fetch2FAStatus();
                                      } else {
                                        toast.error(data.message || "Failed to disable 2FA");
                                      }
                                    } catch (error) {
                                      toast.error("Error disabling 2FA");
                                    }
                                  }}
                                >
                                  Disable 2FA
                                </Button>
                              </div>
                              <div className="mt-3 pt-3 border-t border-green-500/20">
                                <Button 
                                  variant="link" 
                                  size="sm"
                                  className="text-green-700 dark:text-green-400 p-0 h-auto"
                                  onClick={async () => {
                                    const password = prompt("Enter your password to regenerate backup codes:");
                                    if (!password) return;

                                    try {
                                      const authToken = localStorage.getItem("authToken");
                                      const response = await fetch("http://localhost:3000/api/auth/2fa/regenerate-backup-codes", {
                                        method: "POST",
                                        headers: {
                                          "Content-Type": "application/json",
                                          Authorization: `Bearer ${authToken}`
                                        },
                                        body: JSON.stringify({ password })
                                      });

                                      const data = await response.json();
                                      if (data.success) {
                                        const codes = data.data.backupCodes.join("\n");
                                        alert(`New backup codes (save these securely):\n\n${codes}`);
                                        toast.success("Backup codes regenerated");
                                      } else {
                                        toast.error(data.message || "Failed to regenerate backup codes");
                                      }
                                    } catch (error) {
                                      toast.error("Error regenerating backup codes");
                                    }
                                  }}
                                >
                                  Regenerate backup codes
                                </Button>
                              </div>
                            </div>
                          ) : (
                            <div className="p-6 rounded-xl bg-muted/30 border border-border/50">
                              <div className="flex items-center justify-between">
                                <div>
                                  <p className="font-medium text-lg">Enable Two-Factor Authentication</p>
                                  <p className="text-sm text-muted-foreground mt-1">
                                    Add an extra layer of security to your account
                                  </p>
                                </div>
                                <Button 
                                  onClick={() => setShow2FASetup(true)}
                                  size="lg"
                                  className="bg-blue-600 hover:bg-blue-700 text-white"
                                >
                                  Enable Two-Factor Authentication
                                </Button>
                              </div>
                            </div>
                          )}
                        </div>

                        {/* 2FA Setup Modal */}
                        {show2FASetup && (
                          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <motion.div
                              initial={{ opacity: 0, scale: 0.95 }}
                              animate={{ opacity: 1, scale: 1 }}
                              className="bg-card border border-border rounded-2xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto"
                            >
                              <div className="p-6">
                                <TwoFactorSetup 
                                  onSetupComplete={() => {
                                    setShow2FASetup(false);
                                    fetch2FAStatus();
                                    toast.success("2FA enabled successfully! Save your backup codes.");
                                  }}
                                />
                                <Button 
                                  variant="outline" 
                                  className="w-full mt-4"
                                  onClick={() => setShow2FASetup(false)}
                                >
                                  Cancel
                                </Button>
                              </div>
                            </motion.div>
                          </div>
                        )}

                        <Separator />

                        <div className="space-y-3">
                          <h4 className="font-medium text-destructive">Danger Zone</h4>
                          <Button variant="outline" className="border-destructive/50 text-destructive hover:bg-destructive/10">
                            Delete Account
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default UserSettings;
