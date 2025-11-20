# SMS/Text Messaging Setup Guide

## Current Solution: Copy & Paste
The app now supports SMS functionality through a simple copy-and-paste workflow:
1. Select "SMS/Text Only" or "Both Email & SMS" when creating an assessment
2. Enter the patient's phone number
3. Click "Generate SMS Link"
4. Copy the pre-formatted message
5. Paste into your phone's messaging app or any SMS service

## Future Enhancement: Automated SMS with Twilio

If you want to send SMS messages automatically (without copy-paste), you can integrate Twilio:

### Prerequisites
- Twilio account (https://www.twilio.com/try-twilio)
- Twilio phone number
- API credentials (Account SID and Auth Token)

### Setup Steps

1. **Install Twilio SDK**
   ```bash
   npm install twilio
   ```

2. **Add Environment Variables**
   Add to your `.env.local` and Vercel:
   ```env
   TWILIO_ACCOUNT_SID=your_account_sid
   TWILIO_AUTH_TOKEN=your_auth_token
   TWILIO_PHONE_NUMBER=+1234567890
   ```

3. **Create SMS Service** (lib/sms.ts)
   ```typescript
   import twilio from 'twilio'

   const client = twilio(
     process.env.TWILIO_ACCOUNT_SID,
     process.env.TWILIO_AUTH_TOKEN
   )

   export async function sendSMS(to: string, message: string) {
     try {
       const result = await client.messages.create({
         body: message,
         from: process.env.TWILIO_PHONE_NUMBER,
         to: to
       })
       return { success: true, messageId: result.sid }
     } catch (error) {
       console.error('SMS send error:', error)
       return { success: false, error: error.message }
     }
   }
   ```

4. **Update API Route**
   In `/api/send-questionnaire-link/route.ts`, add SMS sending:
   ```typescript
   if (send_method === 'sms' || send_method === 'both') {
     const smsMessage = formatSmsMessage(patient_name, questionnaire_link)
     const smsResult = await sendSMS(phone_number, smsMessage)
     // Handle result...
   }
   ```

### HIPAA Compliance Notes
- Twilio offers HIPAA-compliant services with a BAA (Business Associate Agreement)
- Required for production healthcare use
- Contact Twilio sales for healthcare-specific plans

### Cost Considerations
- SMS costs ~$0.0079 per message (US)
- Monthly phone number fee: ~$1-2
- Consider volume-based pricing for high usage

### Alternative SMS Providers
- **TextMagic**: Simple API, HIPAA compliant
- **SimpleTexting**: Healthcare-focused features
- **TigerConnect**: Designed for healthcare
- **Bandwidth**: Enterprise-level, HIPAA compliant

## Current Manual Workflow Benefits
- No additional costs
- No API setup required
- Works with any SMS service you already use
- Full control over when/how messages are sent
- Can use secure messaging apps if preferred

---
*The current copy-paste solution is fully functional and may be all you need. Automated SMS is optional for convenience.*