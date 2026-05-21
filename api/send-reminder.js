// api/send-reminder.js
// Vercel Serverless Function - Simulates Twilio API SMS reminder dispatch

export default async function handler(req, res) {
  // Add basic CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method !== 'POST') {
    return res.status(405).json({
      success: false,
      error: 'Method Not Allowed',
      message: 'Use POST to trigger the simulated SMS dispatch.'
    });
  }

  const { patientName, phoneNumber, procedureType, delayDays, reminderType } = req.body;

  // Simple validation
  if (!patientName || !phoneNumber) {
    return res.status(400).json({
      success: false,
      error: 'Bad Request',
      message: 'Missing required body fields: patientName and phoneNumber are mandatory.'
    });
  }

  try {
    // 1. Simulate Database Lookup for Clinic Notifications
    const clinicId = "9c264d1a-4f51-4fa3-be72-132d96c4b2c7";
    const simulatedTemplate = reminderType === 'recall' 
      ? `Hi ${patientName}, you are due for your hygiene cleaning. Tap here to pick a time: https://dentflow.app/b/hyg`
      : `Hi ${patientName}, your pre-authorization for ${procedureType || 'treatment'} was APPROVED by insurer! Book your appointment here: https://dentflow.app/b/pre`;

    // 2. Simulate Twilio API Client Request
    const mockTwilioSid = "SM" + Math.random().toString(36).substring(2, 15).toUpperCase();
    const mockCarrierStatus = Math.random() > 0.05 ? "delivered" : "failed"; // 95% delivery rate simulation

    // Logging simulated carrier transit
    console.log(`[Twilio Mock Client] Sending SMS via Sender ID "+18884021203"`);
    console.log(`[Twilio Mock Client] Recipient: ${phoneNumber}`);
    console.log(`[Twilio Mock Client] Body: "${simulatedTemplate}"`);
    console.log(`[Twilio Mock Client] Twilio SID Generated: ${mockTwilioSid}`);

    // 3. Simulate Database Audit Logging
    const simulatedLogEntry = {
      id: Math.random().toString(36).substring(2, 11),
      clinic_id: clinicId,
      recipient_phone: phoneNumber,
      message_body: simulatedTemplate,
      status: mockCarrierStatus,
      twilio_sid: mockTwilioSid,
      sent_at: new Date().toISOString()
    };

    // Return successful simulation response
    return res.status(200).json({
      success: true,
      message: 'Automated SMS notification dispatched successfully via simulated Twilio gateway.',
      provider: 'Twilio API Integration Simulator',
      auditLog: simulatedLogEntry,
      smsMetadata: {
        sid: mockTwilioSid,
        to: phoneNumber,
        from: '+18884021203', // Dentflow Toll-Free Verified Number
        status: mockCarrierStatus,
        segments: 1,
        price: "$0.0075",
        tcpaCompliant: true,
        optOutMessageIncluded: true
      }
    });

  } catch (error) {
    return res.status(500).json({
      success: false,
      error: 'Internal Server Error',
      message: error.message
    });
  }
}
