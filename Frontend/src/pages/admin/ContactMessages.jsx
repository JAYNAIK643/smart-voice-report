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
  Send,
  Filter,
  ChevronDown,
  ChevronUp,
  MoreHorizontal,
  UserCheck,
} from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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

const ContactMessages = () => {
  const { toast } = useToast();
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState("all");
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [wardAdmins, setWardAdmins] = useState([]);
  const [assigningMessage, setAssigningMessage] = useState(null);
  const [selectedWardAdmin, setSelectedWardAdmin] = useState("");

  useEffect(() => {
    fetchMessages();
    fetchWardAdmins();
  }, [statusFilter]);

  const fetchMessages = async () => {
    try {
      setLoading(true);
      const params = statusFilter !== "all" ? { status: statusFilter } : {};
      const response = await apiService.getContactMessages(params);
      if (response.success) {
        setMessages(response.data.messages);
      }
    } catch (error) {
      console.error("Error fetching messages:", error);
      toast({
        title: "Error",
        description: "Failed to fetch contact messages",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchWardAdmins = async () => {
    try {
      const response = await apiService.getWardAdminsForAssignment();
      if (response.success) {
        setWardAdmins(response.data);
      }
    } catch (error) {
      console.error("Error fetching ward admins:", error);
    }
  };

  const handleAssign = async (ticketId) => {
    if (!selectedWardAdmin) {
      toast({
        title: "Error",
        description: "Please select a ward admin",
        variant: "destructive",
      });
      return;
    }

    try {
      const response = await apiService.assignContactMessage(ticketId, selectedWardAdmin);
      if (response.success) {
        toast({
          title: "Success",
          description: "Message assigned successfully",
        });
        setAssigningMessage(null);
        setSelectedWardAdmin("");
        fetchMessages();
      }
    } catch (error) {
      console.error("Error assigning message:", error);
      toast({
        title: "Error",
        description: "Failed to assign message",
        variant: "destructive",
      });
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case "pending":
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
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
            <h1 className="text-3xl font-bold text-gray-900">Contact Messages</h1>
            <p className="text-gray-500 mt-1">
              Manage citizen support requests and queries
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
        className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6"
      >
        {[
          { label: "Total", count: messages.length, color: "bg-blue-50 text-blue-600" },
          { label: "Pending", count: messages.filter((m) => m.status === "pending").length, color: "bg-yellow-50 text-yellow-600" },
          { label: "Assigned", count: messages.filter((m) => m.status === "assigned" || m.status === "in-progress").length, color: "bg-purple-50 text-purple-600" },
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
            <SelectItem value="pending">Pending</SelectItem>
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
                <h3 className="text-lg font-medium text-gray-900">No messages found</h3>
                <p className="text-gray-500">Contact messages will appear here</p>
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
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Assigned To</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                      <th className="text-left py-3 px-4 font-medium text-gray-700">Action</th>
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
                        <td className="py-3 px-4">
                          {message.assignedTo ? (
                            <div className="text-sm">
                              <div className="font-medium text-gray-700">
                                {message.assignedTo.name}
                              </div>
                              <div className="text-gray-500">{message.assignedTo.ward}</div>
                            </div>
                          ) : (
                            <span className="text-gray-400 text-sm">Not assigned</span>
                          )}
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
                                  {message.assignedTo && (
                                    <div>
                                      <label className="text-sm text-gray-500">Assigned To</label>
                                      <div className="text-sm">
                                        {message.assignedTo.name} ({message.assignedTo.ward})
                                      </div>
                                    </div>
                                  )}
                                </div>
                              </DialogContent>
                            </Dialog>

                            {message.status === "pending" && (
                              <Dialog
                                open={assigningMessage?.ticketId === message.ticketId}
                                onOpenChange={(open) =>
                                  !open && setAssigningMessage(null)
                                }
                              >
                                <DialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setAssigningMessage(message)}
                                  >
                                    <UserCheck className="h-4 w-4 mr-1" />
                                    Assign
                                  </Button>
                                </DialogTrigger>
                                <DialogContent>
                                  <DialogHeader>
                                    <DialogTitle>Assign to Ward Admin</DialogTitle>
                                  </DialogHeader>
                                  <div className="space-y-4 mt-4">
                                    <div>
                                      <label className="text-sm text-gray-500">Select Ward Admin</label>
                                      <Select
                                        value={selectedWardAdmin}
                                        onValueChange={setSelectedWardAdmin}
                                      >
                                        <SelectTrigger className="mt-2">
                                          <SelectValue placeholder="Choose ward admin" />
                                        </SelectTrigger>
                                        <SelectContent>
                                          {wardAdmins.map((admin) => (
                                            <SelectItem key={admin._id} value={admin._id}>
                                              {admin.name} - {admin.ward}
                                            </SelectItem>
                                          ))}
                                        </SelectContent>
                                      </Select>
                                    </div>
                                  </div>
                                  <DialogFooter className="mt-4">
                                    <Button
                                      variant="outline"
                                      onClick={() => {
                                        setAssigningMessage(null);
                                        setSelectedWardAdmin("");
                                      }}
                                    >
                                      Cancel
                                    </Button>
                                    <Button
                                      onClick={() => handleAssign(message.ticketId)}
                                      disabled={!selectedWardAdmin}
                                    >
                                      Assign
                                    </Button>
                                  </DialogFooter>
                                </DialogContent>
                              </Dialog>
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

export default ContactMessages;
