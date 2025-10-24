// backend/src/config/email.js
const nodemailer = require('nodemailer');

// Create reusable transporter object using SMTP transport
const createTransporter = () => {
    // For Gmail, you'll need to use an App Password, not your regular password
    // Go to Google Account settings > Security > 2-Step Verification > App passwords
    return nodemailer.createTransport({
        service: 'gmail',
        auth: {
            user: process.env.EMAIL_USER || 'fixitfast.contact@gmail.com',
            pass: process.env.EMAIL_PASS  // You'll need to replace this with actual app password
        }
    });
};

// Send email function
const sendEmail = async (to, subject, text, html) => {
    try {
        const transporter = createTransporter();
        
        const mailOptions = {
            from: process.env.EMAIL_USER || 'fixitfast.contact@gmail.com',
            to: to,
            subject: subject,
            text: text,
            html: html
        };

        const info = await transporter.sendMail(mailOptions);
        console.log('✅ Email sent:', info.messageId);
        return { success: true, messageId: info.messageId };
    } catch (error) {
        console.error('❌ Email sending failed:', error);
        return { success: false, error: error.message };
    }
};

// Send contact form notification email
const sendContactNotification = async (contactData) => {
    const subject = `New Contact Form Submission from ${contactData.name}`;
    
    const text = `
New contact form submission received:

Name: ${contactData.name}
Email: ${contactData.email}
Submitted: ${new Date(contactData.createdAt).toLocaleString('en-IN')}

Message:
${contactData.message}

---
This email was sent automatically from the FixItFast contact form.
    `;

    const html = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background-color: #f9f9f9;">
            <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px; text-align: center; margin-bottom: 30px;">
                <h1 style="color: white; margin: 0; font-size: 28px;">📧 New Contact Message</h1>
                <p style="color: #e3f2fd; margin: 10px 0 0 0;">FixItFast Contact Form</p>
            </div>
            
            <div style="background: white; padding: 30px; border-radius: 10px; box-shadow: 0 4px 6px rgba(0,0,0,0.1);">
                <h2 style="color: #333; margin-top: 0;">Contact Details</h2>
                
                <div style="margin: 20px 0; padding: 15px; background: #f0f4f8; border-left: 4px solid #667eea; border-radius: 4px;">
                    <p style="margin: 5px 0;"><strong>👤 Name:</strong> ${contactData.name}</p>
                    <p style="margin: 5px 0;"><strong>📧 Email:</strong> <a href="mailto:${contactData.email}" style="color: #667eea; text-decoration: none;">${contactData.email}</a></p>
                    <p style="margin: 5px 0;"><strong>📅 Submitted:</strong> ${new Date(contactData.createdAt).toLocaleString('en-IN')}</p>
                </div>
                
                <h3 style="color: #333; margin-top: 30px;">💬 Message</h3>
                <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; border: 1px solid #e9ecef;">
                    <p style="margin: 0; line-height: 1.6; color: #333;">${contactData.message}</p>
                </div>
                
                <div style="margin-top: 30px; padding: 20px; background: #e8f5e8; border-radius: 8px; border: 1px solid #d4edda;">
                    <p style="margin: 0; color: #155724; font-size: 14px;">
                        <strong>📝 Next Steps:</strong><br>
                        • Reply to this email to respond directly to the user<br>
                        • Check the admin dashboard for more contact message management options<br>
                        • Consider the urgency and category of this message for priority handling
                    </p>
                </div>
            </div>
            
            <div style="text-align: center; margin-top: 30px; color: #666; font-size: 12px;">
                <p>This email was sent automatically from the FixItFast contact form.</p>
                <p style="margin: 5px 0;">🌐 <a href="http://localhost:5173" style="color: #667eea; text-decoration: none;">Visit FixItFast</a></p>
            </div>
        </div>
    `;

    const targetEmail = process.env.NOTIFICATION_EMAIL || 'fixitfast.contact@gmail.com';
    return await sendEmail(targetEmail, subject, text, html);
};

module.exports = {
    sendEmail,
    sendContactNotification,
};