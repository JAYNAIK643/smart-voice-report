import { createRoot } from "react-dom/client";
import App from "./App.jsx";
import "./index.css";

// Add global error handler
window.onerror = function(msg, url, line, col, error) {
  console.error('🚨 Global Error:', { msg, url, line, col, error });
  return false;
};

window.onunhandledrejection = function(event) {
  console.error('🚨 Unhandled Promise Rejection:', event.reason);
};

const root = document.getElementById("root");
console.log('🔍 Root element found:', !!root);

try {
  createRoot(root).render(<App />);
  console.log('✅ App rendered successfully');
} catch (error) {
  console.error('🚨 Failed to render App:', error);
}
