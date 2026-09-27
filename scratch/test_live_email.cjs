const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

dotenv.config({ path: path.join(__dirname, '../.env') });

async function runLiveEmailTest() {
  console.log('--- SMTP Configuration Audit ---');
  console.log('SMTP_HOST:', process.env.SMTP_HOST || '(not set)');
  console.log('SMTP_PORT:', process.env.SMTP_PORT || '(not set)');
  console.log('SMTP_USER:', process.env.SMTP_USER ? `${process.env.SMTP_USER.slice(0, 3)}***` : '(NOT SET)');
  console.log('SMTP_PASS:', process.env.SMTP_PASS ? '****** (SET)' : '(NOT SET)');
  console.log('FROM_EMAIL:', process.env.FROM_EMAIL || '(not set)');
  console.log('--------------------------------\n');

  const mongoUri = process.env.MONGODB_URI || 'mongodb://127.0.0.1:27017/campuscoin';
  console.log('Connecting to MongoDB:', mongoUri);
  await mongoose.connect(mongoUri);

  const { User } = await import('file://' + path.join(__dirname, '../models/User.js').replace(/\\/g, '/'));
  const emailService = await import('file://' + path.join(__dirname, '../services/emailService.js').replace(/\\/g, '/'));

  const student = await User.findOne({ role: 'student' });
  if (!student) {
    console.error('No student user found in database!');
    await mongoose.disconnect();
    return;
  }

  console.log(`Found student: ${student.name} <${student.email}>`);

  // TEST 1: Forgot Password Email
  console.log('\n--- TEST 1: Sending Forgot Password Email ---');
  try {
    const res1 = await emailService.sendResetPasswordEmail(
      student.email,
      student.name,
      'http://localhost:5173/reset-password?token=test_live_token_123'
    );
    console.log('TEST 1 SUCCESS!');
    console.log('Nodemailer Response:', res1);
  } catch (err) {
    console.error('TEST 1 FAILED!');
    console.error('Error Code/Message:', err.code, err.message);
    if (err.response) console.error('SMTP Response:', err.response);
  }

  // TEST 2: Share Report Email
  console.log('\n--- TEST 2: Sending Share Report Email ---');
  try {
    const res2 = await emailService.shareReportViaEmail(student._id, student.email);
    console.log('TEST 2 SUCCESS!');
    console.log('Report Email Response:', res2);
  } catch (err) {
    console.error('TEST 2 FAILED!');
    console.error('Error Code/Message:', err.code, err.message);
    if (err.response) console.error('SMTP Response:', err.response);
  }

  await mongoose.disconnect();
  console.log('\n--- Test Execution Complete ---');
}

runLiveEmailTest().catch((err) => {
  console.error('Fatal Test Error:', err);
  process.exit(1);
});
