import nodemailer from 'nodemailer';
import { User } from '../models/User.js';
import { getPeriodOverview } from './reportService.js';
import { formatMoney } from '../utils/currency.js';

/**
 * Configure Nodemailer Transporter
 */
const createTransporter = () => {
  const host = process.env.SMTP_HOST || 'smtp.gmail.com';
  const port = parseInt(process.env.SMTP_PORT) || 587;

  if (host.includes('gmail')) {
    return nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASS
      }
    });
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS
    }
  });
};

/**
 * Share Financial Report via Email.
 * Honors filters: month, dateFrom, dateTo, category, type.
 */
export const shareReportViaEmail = async (userId, targetEmail = null, filters = {}) => {
  const user = await User.findById(userId);
  if (!user) {
    const error = new Error('User not found');
    error.statusCode = 404;
    throw error;
  }

  const recipient = targetEmail || user.email;
  const summary = await getPeriodOverview(userId, filters || {});

  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 8px; overflow: hidden;">
      <div style="background-color: #4F46E5; padding: 20px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px;">Campus Coin Report</h1>
        <p style="margin: 5px 0 0 0; font-size: 14px;">Smart Spending Student Style</p>
      </div>
      <div style="padding: 20px; color: #1F2937;">
        <p>Hi <strong>${user.name}</strong>,</p>
        <p>Here is your financial summary report for <strong>${summary.periodLabel}</strong>:</p>
        
        <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
          <tr style="background-color: #F3F4F6;">
            <th style="padding: 10px; text-align: left;">Metric</th>
            <th style="padding: 10px; text-align: right;">Amount</th>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Total Income</td>
            <td style="padding: 10px; text-align: right; color: #10B981; font-weight: bold;">${formatMoney(summary.totals.income, user.currency)}</td>
          </tr>
          <tr>
            <td style="padding: 10px; border-bottom: 1px solid #E5E7EB;">Total Expense</td>
            <td style="padding: 10px; text-align: right; color: #EF4444; font-weight: bold;">${formatMoney(summary.totals.expense, user.currency)}</td>
          </tr>
          <tr style="font-weight: bold; background-color: #F9FAFB;">
            <td style="padding: 10px;">Net Savings / Balance</td>
            <td style="padding: 10px; text-align: right; color: #4F46E5;">${formatMoney(summary.totals.balance, user.currency)}</td>
          </tr>
        </table>

        ${
          summary.topCategory
            ? `<p>📌 <strong>Top Expense Category:</strong> ${summary.topCategory.name} (${formatMoney(summary.topCategory.amount, user.currency)})</p>`
            : ''
        }

        <p style="margin-top: 30px; font-size: 12px; color: #6B7280; text-align: center;">
          This email was generated automatically by Campus Coin Application.
        </p>
      </div>
    </div>
  `;

  // If SMTP user is not configured in .env, log preview to console for dev testing
  if (!process.env.SMTP_USER) {
    console.log(`[Email Service Dev Mode] Simulating sending report email to: ${recipient}`);
    return {
      message: `Report summary generated and simulated email send to ${recipient} (Configure SMTP in .env for live email).`,
      simulated: true,
      recipient
    };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@campuscoin.edu',
    to: recipient,
    subject: `Campus Coin - Financial Summary (${summary.periodLabel})`,
    html: htmlContent
  });

  console.log(`[Email Service] Sent report email to ${recipient}. MessageId: ${info.messageId}`);
  return {
    message: `Report summary emailed successfully to ${recipient}.`,
    messageId: info.messageId,
    response: info.response
  };
};

/**
 * Send Password Reset OTP Email.
 */
export const sendResetPasswordEmail = async (email, name, otpCode) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
      <div style="background-color: #DC2626; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Campus Coin</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Password Reset Verification</p>
      </div>
      <div style="padding: 28px; color: #1F2937;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4B5563;">You requested to reset your account password. Please use the following One-Time Password (OTP) to reset your password:</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #FEF2F2; border: 2px dashed #DC2626; border-radius: 12px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: 800; color: #DC2626; letter-spacing: 6px;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #6B7280; margin-top: 10px;">This OTP will expire in <strong>15 minutes</strong>.</p>
        </div>

        <p style="font-size: 13px; color: #6B7280;">If you did not request a password reset, please secure your account immediately or ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        
        <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Campus Coin. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (!process.env.SMTP_USER) {
    console.log(`[Email Service Dev Mode] Simulating sending reset password OTP email to: ${email}`);
    console.log(`[Email Service Dev Mode] Password Reset OTP Code: ${otpCode}`);
    return { simulated: true, otpCode };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@campuscoin.edu',
    to: email,
    subject: `Campus Coin - ${otpCode} is your Password Reset Code`,
    html: htmlContent
  });

  console.log(`[Email Service] Sent password reset OTP email to ${email}. MessageId: ${info.messageId}`);
  return info;
};


/**
 * Send Login 2FA OTP Email.
 */
export const sendLogin2FAOtpEmail = async (email, name, otpCode) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
      <div style="background-color: #0B3D2E; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Campus Coin</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Two-Factor Authentication</p>
      </div>
      <div style="padding: 28px; color: #1F2937;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4B5563;">We detected a login attempt on your Campus Coin account. Use this One-Time Password (OTP) to finish signing in:</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #ECFDF5; border: 2px dashed #0B3D2E; border-radius: 12px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: 800; color: #0B3D2E; letter-spacing: 6px;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #6B7280; margin-top: 10px;">This OTP will expire in <strong>10 minutes</strong>.</p>
        </div>

        <p style="font-size: 13px; color: #6B7280;">If you did not try to log in, secure your account and change your password immediately.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        
        <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Campus Coin. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (!process.env.SMTP_USER) {
    console.log(`[Email Service Dev Mode] Simulating sending login 2FA OTP email to: ${email}`);
    console.log(`[Email Service Dev Mode] Login 2FA OTP Code: ${otpCode}`);
    return { simulated: true, otpCode };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@campuscoin.edu',
    to: email,
    subject: `Campus Coin - ${otpCode} is your Login Verification Code`,
    html: htmlContent
  });

  console.log(`[Email Service] Sent login 2FA OTP email to ${email}. MessageId: ${info.messageId}`);
  return info;
};

/**
 * Send OTP for Registration Email Verification.
 */
export const sendRegistrationOtpEmail = async (email, name, otpCode) => {
  const htmlContent = `
    <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; border: 1px solid #E5E7EB; border-radius: 12px; overflow: hidden; background-color: #FFFFFF;">
      <div style="background-color: #4F46E5; padding: 24px; text-align: center; color: #FFFFFF;">
        <h1 style="margin: 0; font-size: 24px; font-weight: 800;">Campus Coin</h1>
        <p style="margin: 6px 0 0 0; font-size: 14px; opacity: 0.9;">Email Verification Code</p>
      </div>
      <div style="padding: 28px; color: #1F2937;">
        <p style="font-size: 16px;">Hi <strong>${name}</strong>,</p>
        <p style="font-size: 14px; color: #4B5563;">Thank you for registering with Campus Coin! Please use the following One-Time Password (OTP) to verify your email and complete your registration:</p>
        
        <div style="margin: 28px 0; text-align: center;">
          <div style="display: inline-block; background-color: #F3F4F6; border: 2px dashed #4F46E5; border-radius: 12px; padding: 16px 36px;">
            <span style="font-size: 32px; font-weight: 800; color: #4F46E5; letter-spacing: 6px;">${otpCode}</span>
          </div>
          <p style="font-size: 12px; color: #6B7280; margin-top: 10px;">This code will expire in <strong>10 minutes</strong>.</p>
        </div>

        <p style="font-size: 13px; color: #6B7280;">If you did not request this registration, please ignore this email.</p>
        
        <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 24px 0;" />
        
        <p style="font-size: 12px; color: #9CA3AF; text-align: center; margin: 0;">
          © ${new Date().getFullYear()} Campus Coin. All rights reserved.
        </p>
      </div>
    </div>
  `;

  if (!process.env.SMTP_USER) {
    console.log(`[Email Service Dev Mode] Simulating sending registration OTP email to: ${email}`);
    console.log(`[Email Service Dev Mode] OTP Code: ${otpCode}`);
    return { simulated: true, otpCode };
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from: process.env.FROM_EMAIL || process.env.SMTP_USER || 'noreply@campuscoin.edu',
    to: email,
    subject: `Campus Coin - ${otpCode} is your Verification Code`,
    html: htmlContent
  });

  console.log(`[Email Service] Sent registration OTP email to ${email}. MessageId: ${info.messageId}`);
  return info;
};

