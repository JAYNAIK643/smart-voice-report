const Grievance = require("../models/Grievance");
const User = require("../models/User");

/**
 * Smart Routing Service - Phase 3
 * Emergency detection, auto-assignment, and priority-based routing
 */

// Emergency keywords for automatic detection
const EMERGENCY_KEYWORDS = [
  "emergency", "urgent", "critical", "dangerous", "life threatening",
  "fire", "accident", "flood", "collapse", "explosion", "gas leak",
  "electrical hazard", "structural damage", "trapped", "injury", "death"
];

// Priority routing configuration
const PRIORITY_ROUTING = {
  high: {
    targetResponseTime: 4, // hours
    escalationLevel: 2,
    autoAssign: true,
    notifySupervisor: true
  },
  medium: {
    targetResponseTime: 24,
    escalationLevel: 1,
    autoAssign: true,
    notifySupervisor: false
  },
  low: {
    targetResponseTime: 72,
    escalationLevel: 0,
    autoAssign: false,
    notifySupervisor: false
  }
};

/**
 * Detect if complaint is an emergency
 */
async function detectEmergency(complaintData) {
  const { title, description } = complaintData;
  const combinedText = `${title} ${description}`.toLowerCase();
  
  const detectedKeywords = EMERGENCY_KEYWORDS.filter(keyword => 
    combinedText.includes(keyword.toLowerCase())
  );
  
  const isEmergency = detectedKeywords.length > 0;
  
  return {
    isEmergency,
    severity: isEmergency ? (detectedKeywords.length >= 2 ? 'critical' : 'high') : 'normal',
    detectedKeywords,
    recommendation: isEmergency 
      ? "Immediate attention required - route to emergency response team"
      : "Standard processing"
  };
}

/**
 * Auto-assign nearest officer to complaint based on ward
 */
async function autoAssignOfficer(ward, category) {
  try {
    // Find available ward admin for the ward
    const officer = await User.findOne({
      role: 'ward_admin',
      ward: ward,
      isActive: true
    }).select('name email ward');

    if (officer) {
      return {
        assigned: true,
        officer: {
          id: officer._id,
          name: officer.name,
          email: officer.email,
          ward: officer.ward
        },
        method: 'ward_admin'
      };
    }

    // Fallback: Find any available admin
    const admin = await User.findOne({
      role: 'admin',
      isActive: true
    }).select('name email');

    if (admin) {
      return {
        assigned: true,
        officer: {
          id: admin._id,
          name: admin.name,
          email: admin.email,
          ward: 'All'
        },
        method: 'admin_fallback'
      };
    }

    return {
      assigned: false,
      officer: null,
      method: 'none',
      reason: 'No available officers found'
    };
  } catch (error) {
    console.error("Auto-assign error:", error);
    return { assigned: false, error: error.message };
  }
}

/**
 * Determine priority-based routing
 */
async function determineRouting(complaintData) {
  const { priority, category, ward } = complaintData;
  
  const routingConfig = PRIORITY_ROUTING[priority] || PRIORITY_ROUTING.low;
  
  // Get department based on category
  const departmentMap = {
    'Water Supply': 'Water Works Department',
    'Road Maintenance': 'Public Works Department',
    'Garbage Collection': 'Sanitation Department',
    'Street Lighting': 'Electrical Department',
    'Electricity': 'Electrical Department',
    'Sewage': 'Sanitation Department',
    'Public Safety': 'Municipal Security Department',
    'Parks & Recreation': 'Parks & Horticulture Department',
    'Other': 'General Administration'
  };
  
  const department = departmentMap[category] || departmentMap['Other'];
  
  // Auto-assign officer for high priority
  let assignment = null;
  if (routingConfig.autoAssign) {
    assignment = await autoAssignOfficer(ward, category);
  }
  
  return {
    priority,
    department,
    ward,
    targetResponseTime: `${routingConfig.targetResponseTime} hours`,
    escalationLevel: routingConfig.escalationLevel,
    notifySupervisor: routingConfig.notifySupervisor,
    autoAssigned: assignment,
    routingTimestamp: new Date().toISOString()
  };
}

/**
 * Complete smart routing analysis
 */
async function analyzeSmartRouting(complaintData) {
  try {
    const emergencyResult = await detectEmergency(complaintData);
    
    // Override priority for emergencies
    let priority = complaintData.priority;
    if (emergencyResult.isEmergency && priority !== 'high') {
      priority = 'high';
    }
    
    const routingResult = await determineRouting({
      ...complaintData,
      priority
    });
    
    return {
      success: true,
      emergency: emergencyResult,
      routing: routingResult,
      finalPriority: priority,
      actionRequired: emergencyResult.isEmergency || routingResult.notifySupervisor
    };
  } catch (error) {
    console.error("Smart routing error:", error);
    return {
      success: false,
      error: error.message
    };
  }
}

module.exports = {
  detectEmergency,
  autoAssignOfficer,
  determineRouting,
  analyzeSmartRouting,
  EMERGENCY_KEYWORDS,
  PRIORITY_ROUTING
};