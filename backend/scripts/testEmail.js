const dotenv = require('dotenv');
const { sendOTPEmail } = require('../utils/email');

dotenv.config();

async function testEmail() {
  try {
    console.log('Testing email configuration...');
    console.log('SMTP_HOST:', process.env.SMTP_HOST || 'Not set');
    console.log('SMTP_USER:', process.env.SMTP_USER || 'Not set');
    console.log('SMTP_PASS:', process.env.SMTP_PASS ? 'Set' : 'Not set');
    console.log('FROM_EMAIL:', process.env.FROM_EMAIL || 'Not set');
    
    const testOTP = '123456';
    const testEmail = 'ctfquest@gmail.com';
    
    console.log(`\nSending test OTP to ${testEmail}...`);
    await sendOTPEmail(testEmail, testOTP);
    console.log('✅ Email test completed');
    
  } catch (error) {
    console.error('❌ Email test failed:', error);
  } finally {
    process.exit(0);
  }
}

testEmail();