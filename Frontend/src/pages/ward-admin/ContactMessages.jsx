import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  Mail,
  User,
  MapPin,
  Clock,
  CheckCircle,
  AlertCircle,
  Loader2,
  RefreshCw,
  Filter,
  Eye,
  Play,
  CheckSquare,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { apiService } from "@/services/apiService";
import { useToast } from "@/hooks/use-toast";

const WardAdminContactMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [updatingStatus, setUpdatingStatus] = useState(null);

  useEffect(() => {
    fetchMessages();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await apiService.getWardAdminContactMessages(params);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch assigned messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (ticketId, newStatus) => {
    try {
      setUpdatingStatus(ticketId);
      const response = await apiService.updateContactMessageStatus(ticketId, newStatus);
      if (response.success) {
        toast({
          title: "Success",
          description: `Status updated to ${newStatus}`,
        });
        fetchMessages();
      }
    } catch (error) {
      console.error("Error updating status:", error);
      toast({
        title: "Error",
        description: "Failed to update status",
        variant: "destructive",
      });
    } finally {
      setUpdatingStatus(null);
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "assigned":
        return "bg-blue-100 text-blue-800 border-blue-200";
      case "in-progress":
        return "bg-purple-100 text-purple-800 border-purple-200";
      case "resolved":
        return "bg-green-100 text-green-800 border-green-200";
      default:
        return "bg-gray-100 text-gray-800 border-gray-200";
    }
  };

  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="mb-8"
      >
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold text-gray-900">My Assigned Messages</h1>
            <p className="text-gray-500 mt-1">
              Manage and resolve citizen support requests assigned to you
            </p>
          </div>
          <Button
            variant="outline"
            onClick={fetchMessages}
            disabled={loading}
            className="flex items-center gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? "animate-spin" : ""}`} />
            Refresh
          </Button>
        </div>
      </motion.div>

      {/* Stats Cards */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6"
      >
        {[
          { label: "Assigned", count: messages.filter((m) => m.status === "assigned").length, color: "bg-blue-50 text-blue-600" },
          { label: "In Progress", count: messages.filter((m) => m.status === "in-progress").length, color: "bg-purple-50 text-purple-600" },
          { label: "Resolved", count: messages.filter((m) => m.status === "resolved").length, color: "bg-green-50 text-green-600" },
        ].map((stat, index) => (
          <Card key={index} className="border-0 shadow-sm">
            <CardContent className="p-4">
              <div className={`text-2xl font-bold ${stat.color.split(" ")[1]}`}>
                {stat.count}
              </div>
              <div className="text-sm text-gray-500">{stat.label}</div>
            </CardContent>
          </Card>
        ))}
      </motion.div>

      {/* Filters */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex flex-col sm:flex-row gap-4 mb-6"
      >
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-gray-500" />
          <span className="text-sm text-gray-500">Filter by status:</span>
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="All Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="assigned">Assigned</SelectItem>
            <SelectItem value="in-progress">In Progress</SelectItem>
            <SelectItem value="resolved">Resolved</SelectItem>
          </SelectContent>
        </Select>
      </motion.div>

      {/* Messages Table */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
      >
        <Card>
          <CardHeader>
            <CardTitle>Support Requests</CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
              </div>
            ) : messages.length === 0 ? (
              <div className="text-center py-12">
                <Mail className="h-12 w-12 text-gray-300 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900">No assigned messages</h3>
                <p className="text-gray-500">
                  Messages assigned to you will appear here
                </p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-gray-200">
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ticket ID</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Name</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Subject</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Ward</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {messages.map((message) => (
                      <tr
                        key={message.ticketId}
                        className="border-b border-gray-100 hover:bg-gray-50 transition-colors"
                      >
                        <td className="py-3 px-4 font-mono text-sm text-gray-600">
                          {message.ticketId}
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <div className="font-medium text-gray-900">{message.name}</div>
                            <div className="text-sm text-gray-500">{message.email}</div>
                          </div>
                        </td>
                        <td className="py-3 px-4 max-w-xs">
                          <div className="truncate text-gray-700" title={message.subject}>
                            {message.subject}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-1 text-gray-600">
                            <MapPin className="h-3 w-3" />
                            {message.ward}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={`${getStatusColor(message.status)} capitalize`}>
                            {message.status}
                          </Badge>
                        </td>
                        <td className="py-3 px-4 text-sm text-gray-500">
                          {formatDate(message.createdAt)}
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setSelectedMessage(message)}
                                >
                                  <Eye className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="max-w-2xl">
                                <DialogHeader>
                                  <DialogTitle>Message Details</DialogTitle>
                                </DialogHeader>
                                <div className="space-y-4 mt-4">
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm text-gray-500">Ticket ID</label>
                                      <div className="font-mono text-sm">{message.ticketId}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-500">Status</label>
                                      <div>
                                        <Badge className={getStatusColor(message.status)}>
                                          {message.status}
                                        </Badge>
                                      </div>
                                    </div>
                                  </div>
                                  <div className="grid grid-cols-2 gap-4">
                                    <div>
                                      <label className="text-sm text-gray-500">From</label>
                                      <div className="font-medium">{message.name}</div>
                                      <div className="text-sm text-gray-500">{message.email}</div>
                                    </div>
                                    <div>
                                      <label className="text-sm text-gray-500">Ward</label>
                                      <div>{message.ward}</div>
                                    </div>
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-500">Subject</label>
                                    <div className="font-medium">{message.subject}</div>
                                  </div>
                                  <div>
                                    <label className="text-sm text-gray-500">Message</label>
                                    <div className="p-3 bg-gray-50 rounded-lg text-gray-700 whitespace-pre-wrap">
                                      {message.message}
                                    </div>
                                  </div>
                                </div>
                                <DialogFooter className="mt-4 gap-2">
                                  {message.status === "assigned" && (
                                    <Button
                                      onClick={() => {
                                        handleStatusUpdate(message.ticketId, "in-progress");
                                        setSelectedMessage(null);
                                      }}
                                      disabled={updatingStatus === message.ticketId}
                                    >
                                      <Play className="h-4 w-4 mr-1" />
                                      Start Working
                                    </Button>
                                  )}
                                  {message.status === "in-progress" && (
                                    <Button
                                      onClick={() => {
                                        handleStatusUpdate(message.ticketId, "resolved");
                                        setSelectedMessage(null);
                                      }}
                                      disabled={updatingStatus === message.ticketId}
                                      variant="success"
                                    >
                                      <CheckSquare className="h-4 w-4 mr-1" />
                                      Mark Resolved
                                    </Button>
                                  )}
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>

                            {/* Quick Actions */}
                            {message.status === "assigned" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(message.ticketId, "in-progress")}
                                disabled={updatingStatus === message.ticketId}
                              >
                                <Play className="h-4 w-4 mr-1" />
                                Start
                              </Button>
                            )}
                            {message.status === "in-progress" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleStatusUpdate(message.ticketId, "resolved")}
                                disabled={updatingStatus === message.ticketId}
                                className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              >
                                <CheckSquare className="h-4 w-4 mr-1" />
                                Resolve
                              </Button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </CardContent>
        </Card>
      </motion.div>
    </div>
  );
};

export default WardAdminContactMessages;
