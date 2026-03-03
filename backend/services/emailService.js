const nodemailer = require('nodemailer');
const logger = require('../utils/logger');

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

// Email templates
const emailTemplates = {
  bookingApproved: (data) => ({
    subject: '🎉 Booking Approved - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Booking Approved!</h2>
        <p>Dear ${data.residentName},</p>
        <p>Great news! Your booking has been approved.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Booking Details:</h3>
          <p><strong>Hostel:</strong> ${data.hostelName}</p>
          <p><strong>Room:</strong> ${data.roomNumber}</p>
          <p><strong>Check-in:</strong> ${new Date(data.checkIn).toLocaleDateString()}</p>
          <p><strong>Check-out:</strong> ${new Date(data.checkOut).toLocaleDateString()}</p>
          <p><strong>Price:</strong> ₹${data.price}</p>
        </div>
        <p>We look forward to welcoming you!</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  billGenerated: (data) => ({
    subject: '💰 New Bill Generated - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #FF9800;">New Bill Generated</h2>
        <p>Dear ${data.residentName},</p>
        <p>A new bill has been generated for your hostel stay.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Bill Details:</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
          <p><strong>Billing Period:</strong> ${data.month}/${data.year}</p>
        </div>
        <p>Please make the payment before the due date to avoid late fees.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  billOverdue: (data) => ({
    subject: '⚠️ Bill Overdue - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">Bill Overdue Reminder</h2>
        <p>Dear ${data.residentName},</p>
        <p>This is a reminder that your bill is overdue.</p>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F44336;">
          <h3>Overdue Bill:</h3>
          <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
          <p><strong>Amount:</strong> ₹${data.amount}</p>
          <p><strong>Due Date:</strong> ${new Date(data.dueDate).toLocaleDateString()}</p>
          <p><strong>Days Overdue:</strong> ${data.daysOverdue}</p>
        </div>
        <p>Please make the payment as soon as possible.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  maintenanceAssigned: (data) => ({
    subject: '🔧 Maintenance Request Assigned - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Maintenance Request Assigned</h2>
        <p>Dear ${data.staffName},</p>
        <p>A maintenance request has been assigned to you.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Priority:</strong> ${data.priority}</p>
          <p><strong>Room:</strong> ${data.roomNumber}</p>
          <p><strong>Description:</strong> ${data.description}</p>
        </div>
        <p>Please address this request at your earliest convenience.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  maintenanceResolved: (data) => ({
    subject: '✅ Maintenance Request Resolved - Hostel Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Maintenance Request Resolved</h2>
        <p>Dear ${data.residentName},</p>
        <p>Your maintenance request has been resolved.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Request Details:</h3>
          <p><strong>Category:</strong> ${data.category}</p>
          <p><strong>Resolution:</strong> ${data.resolution}</p>
          <p><strong>Resolved By:</strong> ${data.staffName}</p>
        </div>
        <p>Thank you for your patience!</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  ownerApproved: (data) => ({
    subject: '🎉 Owner Application Approved - Hostel Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Congratulations! Your Owner Application is Approved</h2>
        <p>Dear ${data.ownerName},</p>
        <p>Great news! Your application to become a hostel owner has been approved.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Application Details:</h3>
          <p><strong>Business Name:</strong> ${data.businessName}</p>
          <p><strong>Status:</strong> <span style="color: #4CAF50; font-weight: bold;">APPROVED</span></p>
        </div>
        <p>You can now:</p>
        <ul>
          <li>Create and manage your hostels</li>
          <li>Add rooms to your hostels</li>
          <li>Create staff accounts</li>
          <li>Manage bookings and approvals</li>
        </ul>
        <p>Login to your account to get started!</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  ownerRejected: (data) => ({
    subject: '❌ Owner Application Status - Hostel Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #F44336;">Owner Application Update</h2>
        <p>Dear ${data.ownerName},</p>
        <p>Thank you for your interest in becoming a hostel owner on our platform.</p>
        <div style="background: #ffebee; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #F44336;">
          <h3>Application Status: Rejected</h3>
          <p><strong>Reason:</strong></p>
          <p>${data.rejectionReason}</p>
        </div>
        <p>If you have any questions or would like to reapply in the future, please contact our support team.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  staffCreated: (data) => ({
    subject: '👤 Staff Account Created - Hostel Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2196F3;">Welcome to the Team!</h2>
        <p>Dear ${data.staffName},</p>
        <p>A staff account has been created for you by ${data.ownerName}.</p>
        <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3>Login Credentials:</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Temporary Password:</strong> ${data.tempPassword}</p>
          <p style="color: #F44336;"><strong>Important:</strong> Please change your password after first login.</p>
        </div>
        <p>You can now login and access the staff dashboard to manage maintenance requests and assist with hostel operations.</p>
        <p style="color: #666; font-size: 12px;">This is an automated email. Please do not reply.</p>
      </div>
    `
  }),

  emailVerification: (data) => ({
    subject: '✉️ Verify Your Email - Hostel Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Verify Your Email</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p>Dear ${data.name},</p>
          <p>Thank you for registering! Please verify your email address to complete your registration and unlock all features.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.verificationUrl}" style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Verify My Email</a>
          </div>
          <p style="color: #666; font-size: 13px;">Or copy and paste this link in your browser:</p>
          <p style="color: #764ba2; font-size: 12px; word-break: break-all;">${data.verificationUrl}</p>
          <p style="color: #999; font-size: 12px; margin-top: 20px;"><strong>This link expires in 24 hours.</strong> If you did not create an account, please ignore this email.</p>
        </div>
      </div>
    `
  }),

  passwordReset: (data) => ({
    subject: '🔐 Password Reset Request - Hostel Management Platform',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; background: #f9f9f9; padding: 20px; border-radius: 12px;">
        <div style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); padding: 30px; border-radius: 12px 12px 0 0; text-align: center;">
          <h1 style="color: white; margin: 0; font-size: 24px;">Reset Your Password</h1>
        </div>
        <div style="background: white; padding: 30px; border-radius: 0 0 12px 12px;">
          <p>Dear ${data.name},</p>
          <p>We received a request to reset your password. Click the button below to set a new password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${data.resetUrl}" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%); color: white; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-weight: bold; font-size: 16px; display: inline-block;">Reset Password</a>
          </div>
          <p style="color: #666; font-size: 13px;">Or copy and paste this link in your browser:</p>
          <p style="color: #f5576c; font-size: 12px; word-break: break-all;">${data.resetUrl}</p>
          <div style="background: #fff3cd; padding: 12px; border-radius: 8px; margin-top: 20px;">
            <p style="color: #856404; margin: 0; font-size: 13px;">⚠️ <strong>This link expires in 30 minutes.</strong> If you didn't request this, please ignore this email. Your password won't change.</p>
          </div>
        </div>
      </div>
    `
  })
};

// Send email function
const sendEmail = async (to, template, data) => {
  try {
    const emailContent = emailTemplates[template](data);

    const mailOptions = {
      from: `"Hostel Management System" <${process.env.EMAIL_USER}>`,
      to,
      subject: emailContent.subject,
      html: emailContent.html
    };

    const info = await transporter.sendMail(mailOptions);
    logger.info('Email sent', { to, template, messageId: info.messageId });
    return { success: true, messageId: info.messageId };
  } catch (error) {
    logger.error('Email send failed', error, { to, template });
    return { success: false, error: error.message };
  }
};

// Convenience functions for specific emails
const sendOwnerApprovalEmail = async (to, ownerName, businessName) => {
  return sendEmail(to, 'ownerApproved', { ownerName, businessName });
};

const sendOwnerRejectionEmail = async (to, ownerName, rejectionReason) => {
  return sendEmail(to, 'ownerRejected', { ownerName, rejectionReason });
};

const sendStaffCreatedEmail = async (to, staffName, email, tempPassword, ownerName) => {
  return sendEmail(to, 'staffCreated', { staffName, email, tempPassword, ownerName });
};

module.exports = {
  sendEmail,
  sendOwnerApprovalEmail,
  sendOwnerRejectionEmail,
  sendStaffCreatedEmail
};
