// SMS notification service
// TODO: Uncomment Twilio block and add credentials to .env when ready:
// TWILIO_ACCOUNT_SID=your_sid
// TWILIO_AUTH_TOKEN=your_token
// TWILIO_PHONE=+1234567890

export async function notifyTicketCalled(phone, ticketNumber, counterLabel) {
  const msg = `CQAMS: Your ticket ${ticketNumber} is now called. Please go to ${counterLabel}.`;
  console.log(`[SMS] → ${phone}: ${msg}`);
  
  /*
  try {
    const twilio = (await import('twilio')).default;
    const client = twilio(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);
    await client.messages.create({ to: phone, from: process.env.TWILIO_PHONE, body: msg });
  } catch (err) {
    console.error('Twilio Error:', err.message);
  }
  */
}

export async function notifyAppointmentConfirmed(phone, serviceName, scheduledAt) {
  const msg = `CQAMS: Your appointment for ${serviceName} is confirmed at ${scheduledAt}.`;
  console.log(`[SMS] → ${phone}: ${msg}`);
}
