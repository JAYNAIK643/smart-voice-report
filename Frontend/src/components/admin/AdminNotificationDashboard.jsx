import { useState, useEffect } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Bell, 
  AlertTriangle, 
  Mail, 
  MessageSquare, 
  Smartphone, 
  BarChart3, 
  Clock, 
  CheckCircle,
  XCircle,
  AlertCircle,
  Send,
  Eye,
  Trash2
} from 'lucide-react';
// NOTE: Supabase removed - using mock data for now
// TODO: Implement backend API for admin notifications if needed
import { useAuth } from '@/context/auth-context';
import { toast } from 'sonner';

const AdminNotificationDashboard = () => {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('overview');
  const [stats, setStats] = useState({
    totalNotifications: 0,
    pending: 0,
    delivered: 0,
    failed: 0,
    today: 0
  });
  const [broadcasts, setBroadcasts] = useState([]);
  const [templates, setTemplates] = useState([]);
  const [deliveries, setDeliveries] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    try {
      setLoading(true);
      
      // Load notification statistics
      await loadNotificationStats();
      
      // Load emergency broadcasts
      await loadBroadcasts();
      
      // Load templates
      await loadTemplates();
      
      // Load recent deliveries
      await loadRecentDeliveries();
      
    } catch (error) {
      console.error('Error loading dashboard data:', error);
      toast.error('Failed to load dashboard data');
    } finally {
      setLoading(false);
    }
  };

  const loadNotificationStats = async () => {
    try {
      // TODO: Replace with backend API call when available
      // For now, use mock statistics
      setStats({
        totalNotifications: 0,
        pending: 0,
        delivered: 0,
        failed: 0,
        today: 0
      });
    } catch (error) {
      console.error('Error loading stats:', error);
    }
  };

  const loadBroadcasts = async () => {
    try {
      // TODO: Replace with backend API call when available
      // For now, return empty array
      setBroadcasts([]);
    } catch (error) {
      console.error('Error loading broadcasts:', error);
    }
  };

  const loadTemplates = async () => {
    try {
      // TODO: Replace with backend API call when available
      // For now, return empty array
      setTemplates([]);
    } catch (error) {
      console.error('Error loading templates:', error);
    }
  };

  const loadRecentDeliveries = async () => {
    try {
      // TODO: Replace with backend API call when available
      // For now, return empty array
      setDeliveries([]);
    } catch (error) {
      console.error('Error loading deliveries:', error);
    }
  };

  const getStatusBadge = (status) => {
    const variants = {
      'draft': 'secondary',
      'processing': 'default',
      'completed': 'success',
      'failed': 'destructive',
      'cancelled': 'outline'
    };
    
    const icons = {
      'draft': <Clock className="w-3 h-3" />,
      'processing': <Bell className="w-3 h-3 animate-pulse" />,
      'completed': <CheckCircle className="w-3 h-3" />,
      'failed': <XCircle className="w-3 h-3" />,
      'cancelled': <AlertCircle className="w-3 h-3" />
    };

    return (
      <Badge variant={variants[status] || 'secondary'} className="gap-1">
        {icons[status]}
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  const getSeverityBadge = (severity) => {
    const variants = {
      'critical': 'destructive',
      'high': 'default',
      'medium': 'secondary',
      'low': 'outline'
    };

    return (
      <Badge variant={variants[severity] || 'secondary'}>
        {severity.charAt(0).toUpperCase() + severity.slice(1)}
      </Badge>
    );
  };

  const handleRefresh = () => {
    loadDashboardData();
    toast.success('Dashboard refreshed');
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Notification Dashboard</h1>
          <p className="text-muted-foreground">Monitor and manage system notifications</p>
        </div>
        <Button onClick={handleRefresh}>
          <BarChart3 className="w-4 h-4 mr-2" />
          Refresh Data
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Notifications</CardTitle>
            <Bell className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalNotifications.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">+{stats.today} today</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pending</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.pending.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Awaiting delivery</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Delivered</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{stats.delivered.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Successfully sent</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Failed</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{stats.failed.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">Delivery failures</p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="broadcasts">Emergency Broadcasts</TabsTrigger>
          <TabsTrigger value="templates">Templates</TabsTrigger>
          <TabsTrigger value="deliveries">Delivery Logs</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {broadcasts.slice(0, 5).map(broadcast => (
                  <div key={broadcast.id} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <AlertTriangle className={`w-5 h-5 ${
                        broadcast.severity === 'critical' ? 'text-red-500' : 'text-yellow-500'
                      }`} />
                      <div>
                        <h3 className="font-medium">{broadcast.title}</h3>
                        <p className="text-sm text-muted-foreground">
                          Sent to {broadcast.total_recipients || 0} users
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusBadge(broadcast.status)}
                      {getSeverityBadge(broadcast.severity)}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Broadcasts Tab */}
        <TabsContent value="broadcasts" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-500" />
                Emergency Broadcasts
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">Title</th>
                      <th className="text-left py-3 px-4">Severity</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Recipients</th>
                      <th className="text-left py-3 px-4">Created</th>
                      <th className="text-left py-3 px-4">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {broadcasts.map(broadcast => (
                      <tr key={broadcast.id} className="border-b hover:bg-muted/50">
                        <td className="py-3 px-4">{broadcast.title}</td>
                        <td className="py-3 px-4">{getSeverityBadge(broadcast.severity)}</td>
                        <td className="py-3 px-4">{getStatusBadge(broadcast.status)}</td>
                        <td className="py-3 px-4">{broadcast.total_recipients || 0}</td>
                        <td className="py-3 px-4">
                          {new Date(broadcast.created_at).toLocaleDateString()}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex gap-2">
                            <Button size="sm" variant="outline">
                              <Eye className="w-4 h-4" />
                            </Button>
                            {broadcast.status === 'processing' && (
                              <Button size="sm" variant="destructive">
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Templates Tab */}
        <TabsContent value="templates" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Mail className="w-5 h-5" />
                Notification Templates
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map(template => (
                  <Card key={template.id} className="hover:shadow-md transition-shadow">
                    <CardHeader>
                      <CardTitle className="text-base flex items-center gap-2">
                        {template.channel === 'email' && <Mail className="w-4 h-4" />}
                        {template.channel === 'sms' && <MessageSquare className="w-4 h-4" />}
                        {template.channel === 'push' && <Smartphone className="w-4 h-4" />}
                        {template.name}
                      </CardTitle>
                      <Badge variant="secondary">{template.type}</Badge>
                    </CardHeader>
                    <CardContent>
                      <p className="text-sm text-muted-foreground mb-2">
                        Language: {template.language}
                      </p>
                      <div className="flex justify-between items-center">
                        <Badge variant={template.is_active ? 'success' : 'secondary'}>
                          {template.is_active ? 'Active' : 'Inactive'}
                        </Badge>
                        <Button size="sm" variant="outline">
                          <Send className="w-4 h-4 mr-1" />
                          Test
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Deliveries Tab */}
        <TabsContent value="deliveries" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Recent Delivery Attempts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-4">User</th>
                      <th className="text-left py-3 px-4">Broadcast</th>
                      <th className="text-left py-3 px-4">Channel</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Timestamp</th>
                    </tr>
                  </thead>
                  <tbody>
                    {deliveries.map(delivery => (
                      <tr key={delivery.id} className="border-b">
                        <td className="py-3 px-4">{delivery.user?.email || 'Unknown'}</td>
                        <td className="py-3 px-4">{delivery.broadcast?.title || 'N/A'}</td>
                        <td className="py-3 px-4 capitalize">{delivery.channel}</td>
                        <td className="py-3 px-4">
                          <Badge variant={
                            delivery.status === 'delivered' ? 'success' :
                            delivery.status === 'failed' ? 'destructive' : 'secondary'
                          }>
                            {delivery.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          {new Date(delivery.created_at).toLocaleString()}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AdminNotificationDashboard;