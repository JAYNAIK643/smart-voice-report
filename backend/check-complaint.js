require('dotenv').config();
const mongoose = require('mongoose');

mongoose.connect(process.env.MONGODB_URI).then(async () => {
  const Grievance = require('./src/models/Grievance');
  
  // Check if CMP-019 exists
  const complaint = await Grievance.findOne({ complaintId: 'CMP-019' });
  console.log('CMP-019 exists:', !!complaint);
  if (complaint) {
    console.log('Complaint details:');
    console.log('  ID:', complaint.complaintId);
    console.log('  Status:', complaint.status);
    console.log('  Title:', complaint.title);
    console.log('  Created:', complaint.createdAt);
  }
  
  // Check all complaint IDs starting with CMP-
  const allComplaints = await Grievance.find({ complaintId: /^CMP-/ })
    .select('complaintId status title createdAt')
    .sort({ createdAt: -1 })
    .limit(20);
    
  console.log('\nAll CMP complaints:');
  allComplaints.forEach(c => {
    console.log(`  ${c.complaintId} - ${c.status} - ${c.title}`);
  });
  
  mongoose.connection.close();
});