const nodemailer = require('nodemailer')

// Create transporter (using Gmail - you can change)
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER || 'your-email@gmail.com',
    pass: process.env.EMAIL_PASS || 'your-app-password'
  }
})

/**
 * Send signing invitation email
 */
async function sendSigningInvitation(recipientEmail, recipientName, signingLink, senderName, documentName) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'DocSign <noreply@docsign.app>',
    to: recipientEmail,
    subject: `${senderName} has requested your signature`,
    html: `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8f9fa; padding: 30px; border-radius: 0 0 10px 10px; }
          .button { display: inline-block; background: #667eea; color: white; padding: 14px 28px; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
          .footer { text-align: center; color: #888; font-size: 12px; margin-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>📝 Signature Request</h1>
          </div>
          <div class="content">
            <p>Hello <strong>${recipientName}</strong>,</p>
            <p><strong>${senderName}</strong> has requested your signature on the following document:</p>
            <p style="background: white; padding: 15px; border-left: 4px solid #667eea; margin: 20px 0;">
              📄 <strong>${documentName}</strong>
            </p>
            <p>Please click the button below to review and sign the document:</p>
            <center>
              <a href="${signingLink}" class="button">Review and Sign Document</a>
            </center>
            <p style="font-size: 12px; color: #888; margin-top: 30px;">
              This link will expire in 15 days. If you have any questions, please contact ${senderName}.
            </p>
          </div>
          <div class="footer">
            <p>Sent via DocSign - Digital Signature Platform</p>
          </div>
        </div>
      </body>
      </html>
    `
  }

  try {
    const info = await transporter.sendMail(mailOptions)
    console.log('✅ Email sent:', info.messageId)
    return { success: true, messageId: info.messageId }
  } catch (error) {
    console.error('❌ Email send failed:', error)
    
    // FALLBACK: Just log the link for testing
    console.log('\n📧 ===== EMAIL MOCK (Nodemailer not configured) =====')
    console.log(`To: ${recipientEmail}`)
    console.log(`Subject: ${senderName} has requested your signature`)
    console.log(`Signing Link: ${signingLink}`)
    console.log('=========================================\n')
    
    return { success: false, error: error.message, signingLink }
  }
}

/**
 * Send document completion notification
 */
async function sendCompletionNotification(ownerEmail, ownerName, documentName, signedPdfUrl) {
  const mailOptions = {
    from: process.env.EMAIL_USER || 'DocSign <noreply@docsign.app>',
    to: ownerEmail,
    subject: `Document "${documentName}" has been signed`,
    html: `
      <!DOCTYPE html>
      <html>
      <body style="font-family: Arial, sans-serif; padding: 20px;">
        <h2>✅ Document Signed!</h2>
        <p>Hello <strong>${ownerName}</strong>,</p>
        <p>Good news! Your document <strong>${documentName}</strong> has been successfully signed.</p>
        <p><a href="${signedPdfUrl}" style="background: #10b981; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; display: inline-block; margin: 10px 0;">Download Signed Document</a></p>
      </body>
      </html>
    `
  }

  try {
    await transporter.sendMail(mailOptions)
    console.log('✅ Completion email sent to:', ownerEmail)
  } catch (error) {
    console.log('⚠️ Completion email failed (will continue):', error.message)
  }
}

module.exports = {
  sendSigningInvitation,
  sendCompletionNotification
}

