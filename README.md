# Creative Studio - Secure File Storage System

A comprehensive web application for secure user data storage with automated backups, user authentication, and admin management.

## Features

- **User Authentication**: Secure registration and login with admin approval
- **File Management**: Upload, download, and manage user files
- **Automated Backups**: Manual and scheduled file backups
- **Admin Dashboard**: Manage users, approve registrations, view logs
- **Audit Logging**: Track all user activities
- **Email Notifications**: Notify users of backup completion

## Tech Stack

- **Backend**: Node.js + Express
- **Frontend**: Vanilla HTML/CSS/JavaScript
- **Database**: SQLite
- **Authentication**: JWT (JSON Web Tokens)
- **Password Hashing**: bcryptjs

## Installation & Setup

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Start the server:
```bash
npm start
```

The server will run on `http://localhost:3000`

### Frontend Setup

The frontend is already served by the backend on `http://localhost:3000`.

## Project Structure

```
creative studio system/
├── backend/
│   ├── config/
│   │   ├── database.js      # SQLite database setup
│   │   └── env.js           # Configuration
│   ├── controllers/
│   │   ├── authController.js       # Authentication logic
│   │   ├── fileController.js       # File management
│   │   ├── adminController.js      # Admin operations
│   │   └── backupController.js     # Backup operations
│   ├── middleware/
│   │   └── auth.js          # JWT verification
│   ├── routes/
│   │   ├── auth.js          # Auth endpoints
│   │   ├── files.js         # File endpoints
│   │   ├── admin.js         # Admin endpoints
│   │   └── backups.js       # Backup endpoints
│   ├── uploads/             # User uploaded files
│   ├── backups/             # Backup files
│   ├── package.json
│   └── server.js            # Main server file
│
└── frontend/
    ├── css/
    │   └── style.css        # Main stylesheet
    ├── js/
    │   ├── auth.js          # Auth logic (register/login)
    │   ├── dashboard.js     # User dashboard
    │   └── admin.js         # Admin dashboard
    ├── index.html           # Login page
    ├── register.html        # Registration page
    ├── dashboard.html       # User dashboard
    └── admin_dashboard.html # Admin dashboard
```

## API Endpoints

### Authentication
- `POST /api/auth/register` - Register new user
- `POST /api/auth/login` - Login user

### File Management
- `POST /api/files/upload` - Upload file
- `GET /api/files/list` - Get user's files
- `GET /api/files/download/:id` - Download file
- `DELETE /api/files/:id` - Delete file

### Backups
- `GET /api/backups/history` - Get backup history
- `POST /api/backups/file/:id` - Backup a file

### Admin
- `GET /api/admin/pending-users` - Get pending approvals
- `POST /api/admin/approve-user` - Approve user
- `POST /api/admin/reject-user` - Reject user
- `GET /api/admin/all-users` - Get all approved users
- `POST /api/admin/delete-user` - Delete user
- `GET /api/admin/backup-logs` - View backup logs
- `GET /api/admin/audit-logs` - View audit logs

## Usage

### For Users

1. **Register**: Go to `/register.html` and create an account
2. **Wait for Approval**: Admin needs to approve your account
3. **Login**: Once approved, login with your credentials
4. **Upload Files**: Use the upload zone to add files
5. **Manage Files**: Download, backup, or delete your files
6. **View History**: Check your backup history

### For Admin

1. **Access Admin**: Navigate to `/admin_dashboard.html`
2. **Approve Users**: Review and approve pending registrations
3. **Manage Users**: View all users and delete if needed
4. **Monitor Activity**: Check backup and audit logs
5. **Activity Logs**: Track all system activities

## Default Admin Credentials

To create an admin account, edit the database initialization in `config/database.js` and add:

```javascript
db.run(
  'INSERT INTO users (username, email, password, status) VALUES (?, ?, ?, ?)',
  ['admin', 'admin@example.com', bcrypt.hashSync('admin123', 10), 'approved']
);
```

Then run the server once to create the admin user.

## Configuration

Edit `backend/config/env.js` to customize:
- JWT secret key
- Email settings
- File upload limits
- Backup schedule

## Security Features

- Password hashing with bcryptjs
- JWT token-based authentication
- CORS protection
- File size limits (50MB)
- Audit logging of all activities
- Admin verification for sensitive operations

## Next Steps / Enhancements

- [ ] Email notifications for backups
- [ ] Automatic scheduled backups
- [ ] File versioning
- [ ] Cloud storage integration
- [ ] User profile management
- [ ] Advanced search and filters
- [ ] Two-factor authentication
- [ ] Database backup functionality

## Troubleshooting

**Port already in use**: Change the PORT in `config/env.js`

**Database errors**: Delete `data.db` file to reset the database

**CORS errors**: Make sure frontend is being served from the same origin

## License

MIT
