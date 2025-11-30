const db = require('../config/database');

const getProfile = (req, res) => {
  const userId = req.user.id;

  db.get(
    'SELECT id, username, email, phone, address, city, country, bio, profilePic, status, createdAt FROM users WHERE id = ?',
    [userId],
    (err, user) => {
      if (err || !user) {
        return res.status(404).json({ error: 'User not found' });
      }
      res.json({ user });
    }
  );
};

const updateProfile = (req, res) => {
  const userId = req.user.id;
  const { username, phone, address, city, country, bio } = req.body;

  if (!username) {
    return res.status(400).json({ error: 'Username is required' });
  }

  db.run(
    'UPDATE users SET username = ?, phone = ?, address = ?, city = ?, country = ?, bio = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
    [username, phone || null, address || null, city || null, country || null, bio || null, userId],
    function(err) {
      if (err) {
        if (err.message.includes('UNIQUE')) {
          return res.status(409).json({ error: 'Username already taken' });
        }
        return res.status(500).json({ error: 'Failed to update profile' });
      }

      db.run('INSERT INTO auditLogs (userId, action, details) VALUES (?, ?, ?)',
        [userId, 'PROFILE_UPDATE', 'Updated profile information']);

      res.json({ 
        message: 'Profile updated successfully',
        user: { username, phone, address, city, country, bio }
      });
    }
  );
};

const changePassword = (req, res) => {
  const userId = req.user.id;
  const { currentPassword, newPassword, confirmPassword } = req.body;
  const bcrypt = require('bcryptjs');

  if (!currentPassword || !newPassword || !confirmPassword) {
    return res.status(400).json({ error: 'All fields required' });
  }

  if (newPassword !== confirmPassword) {
    return res.status(400).json({ error: 'New passwords do not match' });
  }

  db.get('SELECT password FROM users WHERE id = ?', [userId], (err, user) => {
    if (err || !user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const passwordMatch = bcrypt.compareSync(currentPassword, user.password);
    if (!passwordMatch) {
      return res.status(401).json({ error: 'Current password is incorrect' });
    }

    const hashedPassword = bcrypt.hashSync(newPassword, 10);
    db.run(
      'UPDATE users SET password = ?, updatedAt = CURRENT_TIMESTAMP WHERE id = ?',
      [hashedPassword, userId],
      function(err) {
        if (err) {
          return res.status(500).json({ error: 'Failed to change password' });
        }

        db.run('INSERT INTO auditLogs (userId, action, details) VALUES (?, ?, ?)',
          [userId, 'PASSWORD_CHANGE', 'Changed password']);

        res.json({ message: 'Password changed successfully' });
      }
    );
  });
};

module.exports = { getProfile, updateProfile, changePassword };
