const GatePass = require('../models/GatePass');

// Create a new gate pass request
exports.createGatePass = async (req, res) => {
  try {
    const { destination, reason, outDateTime, expectedReturnDateTime } = req.body;
    const userId = req.user.id; // from auth middleware

    if (!destination || !reason || !outDateTime || !expectedReturnDateTime) {
      return res.status(400).json({ success: false, error: { code: 'MISSING_FIELDS', message: 'All fields are required' } });
    }

    const gatePass = new GatePass({
      gatePassId: Date.now().toString(),
      studentId: userId,
      destination,
      reason,
      outDateTime,
      expectedReturnDateTime,
      status: 'pending_coordinator',
      coordinatorApproval: { status: 'pending' },
      wardenApproval: { status: 'pending' },
    });

    await gatePass.save();
    res.status(201).json({ success: true, data: gatePass, message: 'Gate pass created' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error creating gate pass' } });
  }
};

// Get all gate passes for logged-in student
exports.getGatePassesForStudent = async (req, res) => {
  try {
    const userId = req.user.id;
    const gatePasses = await GatePass.find({ studentId: userId }).sort({ createdAt: -1 });
    res.json({ success: true, data: gatePasses });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error fetching gate passes' } });
  }
};

// Coordinator approves/rejects a gate pass
exports.coordinatorApprove = async (req, res) => {
  try {
    const { gatePassId } = req.params;
    const { status, comment } = req.body; // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const gatePass = await GatePass.findById(gatePassId);
    if (!gatePass) return res.status(404).json({ message: 'Gate pass not found' });
    if (gatePass.status !== 'pending_coordinator') {
      return res.status(400).json({ message: 'Gate pass not in coordinator approval stage' });
    }

    gatePass.coordinatorApproval.status = status;
    gatePass.coordinatorApproval.comment = comment || '';
    gatePass.status = (status === 'approved') ? 'pending_warden' : 'rejected';

    await gatePass.save();
    res.json({ success: true, data: gatePass, message: 'Coordinator decision recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error processing coordinator approval' } });
  }
};

// Warden approves/rejects a gate pass
exports.wardenApprove = async (req, res) => {
  try {
    const { gatePassId } = req.params;
    const { status, comment } = req.body; // "approved" or "rejected"

    if (!['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ message: 'Invalid status' });
    }

    const gatePass = await GatePass.findById(gatePassId);
    if (!gatePass) return res.status(404).json({ message: 'Gate pass not found' });
    if (gatePass.status !== 'pending_warden') {
      return res.status(400).json({ message: 'Gate pass not in warden approval stage' });
    }

    gatePass.wardenApproval.status = status;
    gatePass.wardenApproval.comment = comment || '';
    gatePass.status = (status === 'approved') ? 'approved' : 'rejected';

    await gatePass.save();
    res.json({ success: true, data: gatePass, message: 'Warden decision recorded' });
  } catch (error) {
    res.status(500).json({ success: false, error: { code: 'SERVER_ERROR', message: 'Error processing warden approval' } });
  }
};
