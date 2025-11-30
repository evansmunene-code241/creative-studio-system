module.exports = {
  PORT: process.env.PORT || 3000,
  JWT_SECRET: process.env.JWT_SECRET || 'your_jwt_secret_key_change_this',
  JWT_EXPIRE: '7d',
  
  // Email configuration
  EMAIL_HOST: process.env.EMAIL_HOST || 'smtp.gmail.com',
  EMAIL_PORT: process.env.EMAIL_PORT || 587,
  EMAIL_USER: process.env.EMAIL_USER || 'your_email@gmail.com',
  EMAIL_PASSWORD: process.env.EMAIL_PASSWORD || 'your_app_password',
  EMAIL_FROM: process.env.EMAIL_FROM || 'noreply@creativestudio.com',
  
  // File upload settings
  MAX_FILE_SIZE: 50 * 1024 * 1024, // 50MB
  UPLOAD_DIR: './uploads',
  BACKUP_DIR: './backups',
  
  // Backup schedule
  BACKUP_SCHEDULE: '0 2 * * *' // 2 AM daily
};
