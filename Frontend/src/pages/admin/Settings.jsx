import { useEffect, useState } from "react";
import { useAuth } from "@/context/auth-context";
import { Input } from "@/components/ui/input";

const Settings = () => {
  const { user } = useAuth();
  const [fullName, setFullName] = useState("Admin User");
  const [email, setEmail] = useState("admin@smartcity.gov");
  const [phone, setPhone] = useState("+91 98765 43210");
  const [pushNotifications, setPushNotifications] = useState(true);
  const [emailAlerts, setEmailAlerts] = useState(true);

  useEffect(() => {
    document.title = "Settings | SmartCity Admin";
    if (user) {
      setFullName(user.name || "Admin User");
      setEmail(user.email || "admin@smartcity.gov");
    }
  }, [user]);

  const handleSaveProfile = (e) => {
    e.preventDefault();
    alert("Profile updated successfully!");
  };

  const handleUpdatePassword = (e) => {
    e.preventDefault();
    alert("Password updated successfully!");
  };

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-gray-900 mb-1">Settings</h1>
        <p className="text-sm text-gray-600">Manage your admin account and preferences</p>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">Profile Information</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Update your personal details</p>

        <form onSubmit={handleSaveProfile} className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
              <Input
                type="text"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                className="border-gray-300"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="border-gray-300"
              />
            </div>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Phone Number</label>
            <Input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              className="border-gray-300"
            />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Save Changes
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">Notification Preferences</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Manage how you receive notifications</p>

        <div className="space-y-4">
          <div className="flex items-center justify-between py-3 border-b border-gray-100">
            <div>
              <div className="text-sm font-medium text-gray-900">Push Notifications</div>
              <div className="text-xs text-gray-500">Receive push notifications for new complaints</div>
            </div>
            <button
              type="button"
              onClick={() => setPushNotifications(!pushNotifications)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                pushNotifications ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  pushNotifications ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>

          <div className="flex items-center justify-between py-3">
            <div>
              <div className="text-sm font-medium text-gray-900">Email Alerts</div>
              <div className="text-xs text-gray-500">Get email alerts for high-priority issues</div>
            </div>
            <button
              type="button"
              onClick={() => setEmailAlerts(!emailAlerts)}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                emailAlerts ? "bg-blue-600" : "bg-gray-300"
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  emailAlerts ? "translate-x-6" : "translate-x-1"
                }`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">Security</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Update your password and security settings</p>

        <form onSubmit={handleUpdatePassword} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Current Password</label>
            <Input type="password" placeholder="••••••••" className="border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">New Password</label>
            <Input type="password" placeholder="••••••••" className="border-gray-300" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Confirm New Password</label>
            <Input type="password" placeholder="••••••••" className="border-gray-300" />
          </div>
          <button
            type="submit"
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
          >
            Update Password
          </button>
        </form>
      </div>

      <div className="bg-white border border-gray-200 rounded-lg p-6">
        <div className="flex items-center gap-2 mb-6">
          <svg className="w-5 h-5 text-gray-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
          <h2 className="text-base font-semibold text-gray-900">System Preferences</h2>
        </div>
        <p className="text-sm text-gray-600 mb-4">Configure system-wide settings</p>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">Language</label>
          <select className="w-full h-10 px-3 border border-gray-300 rounded-lg text-sm">
            <option>English</option>
            <option>Hindi</option>
            <option>Marathi</option>
          </select>
        </div>
      </div>
    </div>
  );
};

export default Settings;
// import { useEffect, useState } from "react";
// import { gsap } from "gsap";
// import { Settings as SettingsIcon, Bell, Lock, User, Globe, Volume2, Mail, Smartphone } from "lucide-react";
// import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
// import { Input } from "@/components/ui/input";
// import { Label } from "@/components/ui/label";
// import { Button } from "@/components/ui/button";
// import { Switch } from "@/components/ui/switch";
// import { useNotifications } from "@/context/notifications-context";
// import { usePushNotifications } from "@/hooks/usePushNotifications";
// import { toast } from "sonner";

// const Settings = () => {
//   const { preferences, updatePreference } = useNotifications();
//   const { permission, requestPermission, isSupported } = usePushNotifications();
//   const [isRequestingPermission, setIsRequestingPermission] = useState(false);

//   useEffect(() => {
//     document.title = "Settings | SmartCity Admin";
    
//     gsap.fromTo(
//       ".settings-content",
//       { opacity: 0, y: 20 },
//       { opacity: 1, y: 0, duration: 0.6, ease: "power3.out" }
//     );
//   }, []);

//   const handlePushToggle = async (enabled) => {
//     if (enabled && permission !== 'granted') {
//       setIsRequestingPermission(true);
//       const result = await requestPermission();
//       setIsRequestingPermission(false);

//       if (result === 'granted') {
//         await updatePreference('push_enabled', true);
//         toast.success('Push notifications enabled');
//       } else if (result === 'denied') {
//         toast.error('Push notification permission denied', {
//           description: 'Please enable notifications in your browser settings.'
//         });
//       }
//     } else {
//       await updatePreference('push_enabled', enabled);
//       toast.success(enabled ? 'Push notifications enabled' : 'Push notifications disabled');
//     }
//   };

//   const handleEmailToggle = async (enabled) => {
//     await updatePreference('email_enabled', enabled);
//     toast.success(enabled ? 'Email notifications enabled' : 'Email notifications disabled');
//   };

//   const handleInAppToggle = async (enabled) => {
//     await updatePreference('in_app_enabled', enabled);
//     toast.success(enabled ? 'In-app notifications enabled' : 'In-app notifications disabled');
//   };

//   const handleSoundToggle = async (enabled) => {
//     await updatePreference('sound_enabled', enabled);
//     toast.success(enabled ? 'Notification sounds enabled' : 'Notification sounds disabled');
//   };

//   return (
//     <div className="settings-content">
//       <div className="mb-6">
//         <h1 className="text-3xl font-bold text-foreground mb-2">Settings</h1>
//         <p className="text-muted-foreground">Manage your admin account and preferences</p>
//       </div>

//       <div className="space-y-6">
//         <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <User className="h-5 w-5" />
//               Profile Information
//             </CardTitle>
//             <CardDescription>Update your personal details</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//               <div className="space-y-2">
//                 <Label htmlFor="name">Full Name</Label>
//                 <Input id="name" placeholder="Admin User" defaultValue="Admin User" />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="email">Email</Label>
//                 <Input id="email" type="email" placeholder="admin@smartcity.gov" defaultValue="admin@smartcity.gov" />
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="phone">Phone Number</Label>
//               <Input id="phone" placeholder="+91 98765 43210" defaultValue="+91 98765 43210" />
//             </div>
//             <Button>Save Changes</Button>
//           </CardContent>
//         </Card>

//         <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Bell className="h-5 w-5" />
//               Notification Preferences
//             </CardTitle>
//             <CardDescription>Control how and when you receive notifications</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-6">
//             {/* In-App Notifications */}
//             <div className="flex items-center justify-between">
//               <div className="space-y-0.5">
//                 <div className="flex items-center gap-2">
//                   <Bell className="h-4 w-4 text-muted-foreground" />
//                   <Label>In-App Notifications</Label>
//                 </div>
//                 <p className="text-sm text-muted-foreground">Show toast notifications in the app</p>
//               </div>
//               <Switch 
//                 checked={preferences.in_app_enabled} 
//                 onCheckedChange={handleInAppToggle}
//               />
//             </div>

//             {/* Email Notifications */}
//             <div className="flex items-center justify-between">
//               <div className="space-y-0.5">
//                 <div className="flex items-center gap-2">
//                   <Mail className="h-4 w-4 text-muted-foreground" />
//                   <Label>Email Notifications</Label>
//                 </div>
//                 <p className="text-sm text-muted-foreground">Receive email alerts for important updates</p>
//               </div>
//               <Switch 
//                 checked={preferences.email_enabled} 
//                 onCheckedChange={handleEmailToggle}
//               />
//             </div>

//             {/* Push Notifications */}
//             <div className="flex items-center justify-between">
//               <div className="space-y-0.5">
//                 <div className="flex items-center gap-2">
//                   <Smartphone className="h-4 w-4 text-muted-foreground" />
//                   <Label>Push Notifications</Label>
//                 </div>
//                 <p className="text-sm text-muted-foreground">
//                   {!isSupported 
//                     ? 'Not supported in this browser' 
//                     : permission === 'denied'
//                       ? 'Blocked - enable in browser settings'
//                       : 'Browser push notifications'}
//                 </p>
//               </div>
//               <Switch 
//                 checked={preferences.push_enabled && permission === 'granted'} 
//                 onCheckedChange={handlePushToggle}
//                 disabled={!isSupported || permission === 'denied' || isRequestingPermission}
//               />
//             </div>

//             {/* Sound Notifications */}
//             <div className="flex items-center justify-between">
//               <div className="space-y-0.5">
//                 <div className="flex items-center gap-2">
//                   <Volume2 className="h-4 w-4 text-muted-foreground" />
//                   <Label>Notification Sounds</Label>
//                 </div>
//                 <p className="text-sm text-muted-foreground">Play a sound when notifications arrive</p>
//               </div>
//               <Switch 
//                 checked={preferences.sound_enabled} 
//                 onCheckedChange={handleSoundToggle}
//               />
//             </div>
//           </CardContent>
//         </Card>

//         <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Lock className="h-5 w-5" />
//               Security
//             </CardTitle>
//             <CardDescription>Update your password and security settings</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="current-password">Current Password</Label>
//               <Input id="current-password" type="password" />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="new-password">New Password</Label>
//               <Input id="new-password" type="password" />
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="confirm-password">Confirm New Password</Label>
//               <Input id="confirm-password" type="password" />
//             </div>
//             <Button>Update Password</Button>
//           </CardContent>
//         </Card>

//         <Card className="border-border/50 bg-gradient-to-br from-card to-card/50">
//           <CardHeader>
//             <CardTitle className="flex items-center gap-2">
//               <Globe className="h-5 w-5" />
//               System Preferences
//             </CardTitle>
//             <CardDescription>Configure system-wide settings</CardDescription>
//           </CardHeader>
//           <CardContent className="space-y-4">
//             <div className="space-y-2">
//               <Label htmlFor="language">Language</Label>
//               <select
//                 id="language"
//                 className="w-full h-10 px-3 rounded-md border border-input bg-background"
//               >
//                 <option>English</option>
//                 <option>Hindi</option>
//                 <option>Tamil</option>
//               </select>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="timezone">Timezone</Label>
//               <select
//                 id="timezone"
//                 className="w-full h-10 px-3 rounded-md border border-input bg-background"
//               >
//                 <option>Asia/Kolkata (IST)</option>
//                 <option>Asia/Dubai (GST)</option>
//                 <option>UTC</option>
//               </select>
//             </div>
//             <Button>Save Preferences</Button>
//           </CardContent>
//         </Card>
//       </div>
//     </div>
//   );
// };

// export default Settings;
