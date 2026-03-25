import { useState, useEffect } from "react";
import { useAuth } from "@/context/auth-context";
import { apiService } from "@/services/apiService";

const DebugUpvote = () => {
  const { user, isAuthenticated } = useAuth();
  const [debugInfo, setDebugInfo] = useState({});
  const [testResult, setTestResult] = useState(null);

  useEffect(() => {
    // Get debug information
    const authToken = localStorage.getItem("authToken");
    const storedUser = localStorage.getItem("user");
    
    setDebugInfo({
      isAuthenticated,
      user: user ? { id: user.id, name: user.name, email: user.email } : null,
      authTokenPresent: !!authToken,
      authToken: authToken ? authToken.substring(0, 20) + "..." : null,
      storedUser: storedUser ? JSON.parse(storedUser) : null,
      localStorageKeys: Object.keys(localStorage)
    });
  }, [user, isAuthenticated]);

  const testUpvote = async () => {
    try {
      setTestResult({ status: "loading", message: "Testing upvote..." });
      
      console.log("Making upvote request for CMP-019");
      const response = await apiService.upvoteGrievance("CMP-019");
      
      console.log("Upvote response:", response);
      setTestResult({ 
        status: "success", 
        message: "Upvote successful!", 
        data: response 
      });
    } catch (error) {
      console.error("Upvote error:", error);
      setTestResult({ 
        status: "error", 
        message: error.message,
        error: error 
      });
    }
  };

  const testAuthHeaders = () => {
    // Test what headers would be sent
    const token = localStorage.getItem("authToken");
    const headers = {
      "Content-Type": "application/json",
      ...(token && { Authorization: `Bearer ${token}` }),
    };
    
    console.log("Auth headers that would be sent:", headers);
    alert("Check console for auth headers");
  };

  return (
    <div className="min-h-screen bg-background p-8">
      <div className="max-w-4xl mx-auto">
        <h1 className="text-3xl font-bold mb-6">Upvote Debug Page</h1>
        
        <div className="bg-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Authentication Status</h2>
          <pre className="bg-muted p-4 rounded text-sm overflow-auto">
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>

        <div className="bg-card p-6 rounded-lg mb-6">
          <h2 className="text-xl font-semibold mb-4">Debug Actions</h2>
          <div className="flex gap-4">
            <button 
              onClick={testUpvote}
              className="px-4 py-2 bg-primary text-primary-foreground rounded hover:opacity-90"
            >
              Test Upvote CMP-019
            </button>
            <button 
              onClick={testAuthHeaders}
              className="px-4 py-2 bg-secondary text-secondary-foreground rounded hover:opacity-90"
            >
              Show Auth Headers
            </button>
          </div>
        </div>

        {testResult && (
          <div className={`bg-card p-6 rounded-lg ${
            testResult.status === 'success' ? 'border border-green-500' :
            testResult.status === 'error' ? 'border border-red-500' :
            'border border-blue-500'
          }`}>
            <h2 className="text-xl font-semibold mb-4">
              Test Result: {testResult.status.toUpperCase()}
            </h2>
            <p className="mb-2"><strong>Message:</strong> {testResult.message}</p>
            {testResult.data && (
              <div>
                <p className="mb-2"><strong>Response Data:</strong></p>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto">
                  {JSON.stringify(testResult.data, null, 2)}
                </pre>
              </div>
            )}
            {testResult.error && (
              <div>
                <p className="mb-2"><strong>Error Details:</strong></p>
                <pre className="bg-muted p-4 rounded text-sm overflow-auto text-red-500">
                  {JSON.stringify(testResult.error, null, 2)}
                </pre>
              </div>
            )}
          </div>
        )}

        <div className="bg-card p-6 rounded-lg mt-6">
          <h2 className="text-xl font-semibold mb-4">Instructions</h2>
          <ol className="list-decimal pl-6 space-y-2">
            <li>Check if you're logged in (isAuthenticated should be true)</li>
            <li>Verify auth token is present in localStorage</li>
            <li>Click "Test Upvote CMP-019" to try the upvote functionality</li>
            <li>Check browser console for detailed logs</li>
            <li>Open Network tab in DevTools to see the actual request/response</li>
          </ol>
        </div>
      </div>
    </div>
  );
};

export default DebugUpvote;