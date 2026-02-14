/**
 * Optional: create an admin user. Run with: node src/scripts/seedAdmin.js
 * Requires MONGODB_URI and optionally ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME in env.
 */
import 'dotenv/config';
import mongoose from 'mongoose';
import { User } from '../models/User.js';

const email = process.env.ADMIN_EMAIL || 'admin@campusconnect.test';
const password = process.env.ADMIN_PASSWORD || 'admin123';
const name = process.env.ADMIN_NAME || 'Admin';

async function seed() {
  await mongoose.connect(process.env.MONGODB_URI);
  const existing = await User.findOne({ email });
  if (existing) {
    existing.role = 'admin';
    await existing.save();
    console.log('Updated existing user to admin:', email);
  } else {
    await User.create({ name, email, password, role: 'admin' });
    console.log('Created admin user:', email);
  }
  await mongoose.disconnect();
}

seed().catch((err) => {
  console.error(err);
  process.exit(1);
});
