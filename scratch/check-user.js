import mongoose from 'mongoose';
import { User } from '../models/User.js';
import dotenv from 'dotenv';
dotenv.config();

async function run() {
  await mongoose.connect(process.env.MONGODB_URI);
  const user = await User.findOne({ email: 'student@campuscoin.com' });
  console.log("User currency:", user.currency);
  if (user.currency !== 'PKR') {
    user.currency = 'PKR';
    await user.save();
    console.log("Set currency to PKR");
  }
  process.exit();
}
run();
