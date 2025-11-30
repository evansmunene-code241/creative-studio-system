const express = require('express');
const router = express.Router();
const { verifyToken, isAdmin } = require('../middleware/auth');
const {
  getPendingUsers,
  approveUser,
  rejectUser,
  getAllUsers,
  deleteUser,
  getBackupLogs,
  getAuditLogs,
  getStorageStats
} = require('../controllers/adminController');

// All admin routes require admin verification
router.use(verifyToken, isAdmin);

router.get('/pending-users', getPendingUsers);
router.post('/approve-user', approveUser);
router.post('/reject-user', rejectUser);
router.get('/all-users', getAllUsers);
router.post('/delete-user', deleteUser);
router.get('/backup-logs', getBackupLogs);
router.get('/audit-logs', getAuditLogs);
router.get('/storage-stats', getStorageStats);

module.exports = router;
