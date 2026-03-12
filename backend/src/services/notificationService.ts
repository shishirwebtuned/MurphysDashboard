import twilioClient from '../config/twilio';
import transporter from '../config/nodemiller';
import dotenv from 'dotenv';
dotenv.config();

interface NotificationData {
  email?: string;
  phone?: string;
  clientName?: string;
  serviceName?: string;
  renewalLabel?: string;
  renewalDate?: string;
  renewalPrice?: number;
  daysUntilRenewal?: number;
}

export class NotificationService {
  /**
   * Send WhatsApp message using Twilio
   */
  static async sendWhatsApp(to: string, message: string): Promise<boolean> {
    try {
      if (!to) {
        console.error('Missing phone number for WhatsApp message');
        return false;
      }

      // Determine WhatsApp 'from' number. Prefer TWILIO_WHATSAPP_NUMBER, fall back to TWILIO_PHONE_NUMBER if available.
      const fromEnv = process.env.TWILIO_WHATSAPP_NUMBER || process.env.TWILIO_PHONE_NUMBER;
      if (!fromEnv) {
      
        return false;
      }
      if (!process.env.TWILIO_WHATSAPP_NUMBER && process.env.TWILIO_PHONE_NUMBER) {
        console.warn('TWILIO_WHATSAPP_NUMBER not set; using TWILIO_PHONE_NUMBER as WhatsApp sender. Ensure this number is WhatsApp-enabled in your Twilio account or use the sandbox number.');
        console.warn('💡 For testing, add to .env: TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886');
      }

      // Normalize phone number to E.164 (no spaces or punctuation)
      let normalized = to.trim();
      // Strip optional whatsapp: prefix for normalization
      if (normalized.startsWith('whatsapp:')) {
        normalized = normalized.slice('whatsapp:'.length);
      }

      // Remove all characters except digits and plus
      normalized = normalized.replace(/[^\d+]/g, '');

      // If multiple plus signs, reduce to single leading +
      normalized = normalized.replace(/\++/g, '+');
      if (normalized.indexOf('+') > 0) {
        // move plus to front if it's misplaced
        normalized = '+' + normalized.replace(/\+/g, '');
      }

      // If no leading +, try to apply default country code if available
      if (!normalized.startsWith('+')) {
        // remove leading zeros
        normalized = normalized.replace(/^0+/, '');
        if (process.env.DEFAULT_COUNTRY_CODE) {
          normalized = `+${process.env.DEFAULT_COUNTRY_CODE}${normalized}`;
        } else {
          // best-effort: prefix + if user supplied digits only
          normalized = `+${normalized}`;
        }
      }

      // Twilio WhatsApp format: whatsapp:+<number>

      const formattedTo = normalized.startsWith('whatsapp:') ? normalized : `whatsapp:${normalized}`;
      const formattedFrom = fromEnv.startsWith('whatsapp:') ? fromEnv : `whatsapp:${fromEnv}`;

      console.log(`📤 Attempting WhatsApp send: from=${formattedFrom}, to=${formattedTo}`);
      
      await twilioClient.messages.create({ body: message, from: formattedFrom, to: formattedTo });

      console.log(`✅ WhatsApp sent to ${formattedTo}`);
      return true;
    } catch (error) {
      console.error('WhatsApp send error:', error);
      return false;
    }
  }

  /**
   * Send Email
   */
  static async sendEmail(to: string, subject: string, html: string): Promise<boolean> {
    try {
      console.log(`📧 Attempting to send email to: ${to} | Subject: ${subject}`);
      
      await transporter.sendMail({
        from: `Murphys Client <${process.env.EMAIL_FROM}>`,
        to,
        subject,
        html
      });

      console.log(`✅ Email sent successfully to ${to}`);
      return true;
    } catch (error) {
      console.error(`❌ Email send error to ${to}:`, error);
      return false;
    }
  }

  /**
   * Send notification when new renewal is created
   */
  static async notifyNewRenewal(data: NotificationData): Promise<void> {
    const { email, phone, clientName, serviceName, renewalLabel, renewalDate, renewalPrice } = data;

    const displayClient = clientName || 'Valued Client';
    const displayService = serviceName || 'your service';
    const displayLabel = renewalLabel || 'Renewal';
    const displayDate = renewalDate ? new Date(renewalDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const displayPrice = typeof renewalPrice === 'number' ? renewalPrice : 0;

    // Email notification (only if email provided)
    if (email) {
      const emailSubject = `New Renewal Added - ${displayService}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #480082;">New Renewal Added</h2>
          <p>Dear ${displayClient},</p>
          <p>A new renewal has been added to your service <strong>${displayService}</strong>.</p>
          <div style="background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0;">
            <h3 style="margin-top: 0;">Renewal Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Label:</strong> ${displayLabel}</li>
              <li><strong>Date:</strong> ${displayDate}</li>
              <li><strong>Amount:</strong> $${displayPrice.toFixed(2)}</li>
            </ul>
          </div>
          <p>You will receive reminder notifications before the renewal date.</p>
          <p>Best regards,<br/>Murphys Team</p>
        </div>
      `;

      await this.sendEmail(email, emailSubject, emailHtml);
    }
  }

  /**
   * Send reminder notification (7, 3, or 1 day before)
   */
  static async notifyRenewalReminder(data: NotificationData): Promise<void> {
    const { email, phone, clientName, serviceName, renewalLabel, renewalDate, renewalPrice, daysUntilRenewal } = data;

    console.log(`📬 notifyRenewalReminder called for: ${renewalLabel} | Email: ${email}`);

    const displayClient = clientName || 'Valued Client';
    const displayService = serviceName || 'your service';
    const displayLabel = renewalLabel || 'Renewal';
    const displayDate = renewalDate ? new Date(renewalDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const displayPrice = typeof renewalPrice === 'number' ? renewalPrice : 0;
    const daysText = daysUntilRenewal === 1 ? 'tomorrow' : `in ${daysUntilRenewal} days`;

    // Email notification (only if email provided)
    if (email) {
      const emailSubject = `Reminder: Renewal Payment Due ${daysText} - ${displayService}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #ff6b00;">⏰ Renewal Reminder</h2>
          <p>Dear ${displayClient},</p>
          <p>This is a reminder that your renewal payment is due <strong>${daysText}</strong>.</p>
          <div style="background: #fff3e0; padding: 20px; border-left: 4px solid #ff6b00; margin: 20px 0;">
            <h3 style="margin-top: 0; color: #ff6b00;">Renewal Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Service:</strong> ${displayService}</li>
              <li><strong>Label:</strong> ${displayLabel}</li>
              <li><strong>Due Date:</strong> ${displayDate}</li>
              <li><strong>Amount:</strong> $${displayPrice.toFixed(2)}</li>
            </ul>
          </div>
          <p style="background: #ffebee; padding: 15px; border-radius: 5px; color: #c62828;">
            ⚠️ Please ensure payment is made before the due date to avoid service interruption.
          </p>
          <p>If you have already made the payment, please disregard this message.</p>
          <p>Best regards,<br/>Murphys Team</p>
        </div>
      `;

      const sent = await this.sendEmail(email, emailSubject, emailHtml);
      if (!sent) {
        console.error(`❌ Failed to send renewal reminder email to ${email} for ${displayLabel}`);
      }
    } else {
      console.warn(`⚠️ No email address provided for renewal reminder: ${displayLabel}`);
    }
  }

  /**
   * Send notification when renewal is paid
   */
  static async notifyRenewalPaid(data: NotificationData): Promise<void> {
    const { email, phone, clientName, serviceName, renewalLabel, renewalDate, renewalPrice } = data;

    const displayClient = clientName || 'Valued Client';
    const displayService = serviceName || 'your service';
    const displayLabel = renewalLabel || 'Renewal';
    const displayDate = renewalDate ? new Date(renewalDate).toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }) : 'N/A';
    const displayPrice = typeof renewalPrice === 'number' ? renewalPrice : 0;

    // Email notification (only if email provided)
    if (email) {
      const emailSubject = `Payment Received - ${displayLabel}`;
      const emailHtml = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2 style="color: #4caf50;">✅ Payment Received</h2>
          <p>Dear ${displayClient},</p>
          <p>Thank you! We have received your renewal payment.</p>
          <div style="background: #e8f5e9; padding: 20px; border-radius: 8px; margin: 20px 0; border-left: 4px solid #4caf50;">
            <h3 style="margin-top: 0; color: #2e7d32;">Payment Details:</h3>
            <ul style="list-style: none; padding: 0;">
              <li><strong>Service:</strong> ${displayService}</li>
              <li><strong>Renewal:</strong> ${displayLabel}</li>
              <li><strong>Date:</strong> ${displayDate}</li>
              <li><strong>Amount Paid:</strong> $${displayPrice.toFixed(2)}</li>
            </ul>
          </div>
          <p>Your service will continue without interruption. A receipt will be sent separately.</p>
          <p>Thank you for being a valued client!</p>
          <p>Best regards,<br/>Murphys Team</p>
        </div>
      `;

      await this.sendEmail(email, emailSubject, emailHtml);
    }
  }
}

export default NotificationService;
