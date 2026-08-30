// @ts-nocheck
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY || 're_dummy_key');

export const sendConfirmationEmail = async (email: string, teamName: string, tournamentTitle: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Skipping email send: RESEND_API_KEY not set.');
    return;
  }
  
  try {
    await resend.emails.send({
      from: 'NexArena <onboarding@resend.dev>', // Free tier requires using resend.dev or verified domain
      to: email,
      subject: `Registration Received: ${tournamentTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 12px;">
          <h1 style="color: #9333ea; margin-bottom: 20px;">NexArena Registration</h1>
          <p style="font-size: 16px;">Hello Team <strong>${teamName}</strong>,</p>
          <p style="font-size: 16px;">We have successfully received your registration for <strong>${tournamentTitle}</strong>.</p>
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #333;">
            <h3 style="margin-top: 0; color: #10b981;">Status: Payment Under Review</h3>
            <p style="margin-bottom: 0;">Our admin team is currently verifying your payment screenshot and UTR number. You will receive another email with your Room ID and Password once your payment is confirmed.</p>
          </div>
          <p style="font-size: 14px; color: #888;">If you have any questions, feel free to reply to this email or reach out on our WhatsApp group.</p>
          <p style="font-size: 14px; color: #888;">GLHF,<br/>The NexArena Team</p>
        </div>
      `,
    });
    console.log(`Confirmation email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send email:', error);
  }
};

export const sendRoomDetailsEmail = async (email: string, teamName: string, tournamentTitle: string, roomId: string, roomPass: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Skipping room email send: RESEND_API_KEY not set.');
    return;
  }
  
  try {
    await resend.emails.send({
      from: 'NexArena <onboarding@resend.dev>',
      to: email,
      subject: `Room Details: ${tournamentTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 12px;">
          <h1 style="color: #10b981; margin-bottom: 20px;">Room Details Are Live!</h1>
          <p style="font-size: 16px;">Hello Team <strong>${teamName}</strong>,</p>
          <p style="font-size: 16px;">The room for <strong>${tournamentTitle}</strong> has been created. Here are your credentials:</p>
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #333;">
            <h2 style="margin-top: 0; color: #9333ea;">Room ID: ${roomId}</h2>
            <h2 style="margin-bottom: 0; color: #9333ea;">Password: ${roomPass}</h2>
          </div>
          <p style="font-size: 14px; color: #888;">Please join the room 10 minutes before the match starts. Do not share these details with anyone outside your squad.</p>
          <p style="font-size: 14px; color: #888;">GLHF,<br/>The NexArena Team</p>
        </div>
      `,
    });
    console.log(`Room details email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send room email:', error);
  }
};

export const sendApprovalEmail = async (email: string, teamName: string, tournamentTitle: string) => {
  if (!process.env.RESEND_API_KEY) {
    console.log('Skipping email send: RESEND_API_KEY not set.');
    return;
  }
  
  try {
    await resend.emails.send({
      from: 'NexArena <onboarding@resend.dev>',
      to: email,
      subject: `Registration Confirmed: ${tournamentTitle}`,
      html: `
        <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; background-color: #000; color: #fff; padding: 40px; border-radius: 12px;">
          <h1 style="color: #10b981; margin-bottom: 20px;">Registration Confirmed!</h1>
          <p style="font-size: 16px;">Hello Team <strong>${teamName}</strong>,</p>
          <p style="font-size: 16px;">Your payment for <strong>${tournamentTitle}</strong> has been successfully verified.</p>
          <div style="background-color: #1a1a1a; padding: 20px; border-radius: 8px; margin: 30px 0; border: 1px solid #333;">
            <h3 style="margin-top: 0; color: #10b981;">Status: Squad Locked In</h3>
            <p style="margin-bottom: 0;">You are officially registered. The Room ID and Password will be sent to this email address automatically 15 minutes before the match starts.</p>
          </div>
          <p style="font-size: 14px; color: #888;">If you have any questions, feel free to reply to this email or reach out on our WhatsApp group.</p>
          <p style="font-size: 14px; color: #888;">GLHF,<br/>The NexArena Team</p>
        </div>
      `,
    });
    console.log(`Approval email sent to ${email}`);
  } catch (error) {
    console.error('Failed to send approval email:', error);
  }
};
