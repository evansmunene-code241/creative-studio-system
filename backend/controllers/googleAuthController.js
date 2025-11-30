const jwt = require('jsonwebtoken');
const db = require('../config/database');
const config = require('../config/env');

const googleSignIn = (req, res) => {
  const { googleId, email, name, profilePic } = req.body;

  if (!googleId || !email) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  // Check if user exists by Google ID
  db.get('SELECT * FROM users WHERE googleId = ? OR email = ?', [googleId, email], (err, user) => {
    if (err) {
      return res.status(500).json({ error: 'Database error' });
    }

    if (user) {
      // User exists - just login
      if (user.status !== 'approved') {
        return res.status(403).json({ error: 'Account not approved yet' });
      }

      // Update profile pic if changed
      if (profilePic && profilePic !== user.profilePic) {
        db.run('UPDATE users SET profilePic = ? WHERE id = ?', [profilePic, user.id]);
      }

      const isAdmin = user.email === 'liza@gmail.com';
      const role = isAdmin ? 'admin' : 'user';

      const token = jwt.sign(
        { id: user.id, role, email: user.email },
        config.JWT_SECRET,
        { expiresIn: config.JWT_EXPIRE }
      );

      return res.json({
        message: 'Login successful',
        token,
        user: { 
          id: user.id, 
          username: user.username, 
          email: user.email,
          profilePic: user.profilePic,
          role 
        }
      });
    }

    // New user - register with Google
    const username = name || email.split('@')[0];

    db.run(
      'INSERT INTO users (username, email, googleId, profilePic, status) VALUES (?, ?, ?, ?, ?)',
      [username, email, googleId, profilePic, 'pending'],
      function(err) {
        if (err) {
          if (err.message.includes('UNIQUE')) {
            return res.status(409).json({ error: 'Email already registered' });
          }
          return res.status(500).json({ error: 'Registration failed' });
        }

        res.status(201).json({
          message: 'Registration successful. Please wait for admin approval.',
          user: { id: this.lastID, username, email, profilePic }
        });
      }
    );
  });
};

module.exports = { googleSignIn };
