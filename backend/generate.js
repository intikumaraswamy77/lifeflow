const fs = require('fs');
const path = require('path');
const crypto = require('crypto');

// Generate a secure 256-bit secret key
const jwtSecret = crypto.randomBytes(32).toString('hex');

// Replace with your actual MongoDB details
const mongoUsername = 'your-username';
const mongoPassword = 'your-password';
const mongoCluster = 'your-cluster.mongodb.net';

const envContent = `
PORT=5000
MONGODB_URI=mongodb+srv://${mongoUsername}:${mongoPassword}@${mongoCluster}/blood-donation
JWT_SECRET=${jwtSecret}
NODE_ENV=development
`.trim();

const backendEnvPath = path.join(__dirname, '.env');

fs.writeFileSync(backendEnvPath, envContent);
console.log(`✅ Backend .env file generated at: ${backendEnvPath}`);
console.log(`🔐 JWT_SECRET: ${jwtSecret}`);
