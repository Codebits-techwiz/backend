import mongoose from 'mongoose';
import dotenv from 'dotenv';
import { CURRENCIES } from '../config/constants.js';
import { User } from '../models/User.js';
dotenv.config();

mongoose.connect(process.env.MONGODB_URI)
  .then(async () => {
    console.log('Connected to DB');
    const result = await User.updateMany(
      { currency: { $ne: CURRENCIES.PKR } },
      { $set: { currency: CURRENCIES.PKR } }
    );
    console.log(`Updated ${result.modifiedCount} accounts to PKR.`);
    process.exit(0);
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
