import { Injectable } from '@nestjs/common';
import * as twilio from 'twilio';
import * as nodemailer from 'nodemailer';

@Injectable()
export class NotificationService {
  private twilioClient = twilio(
    process.env.TWILIO_ACCOUNT_SID,
    process.env.TWILIO_AUTH_TOKEN
  );

  private mailTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASSWORD,
    },
  });
  

  // ✅ Envoi du code de vérification par SMS
  async sendVerificationSMS(phoneNumber: string, code: string) {
    try {
      await this.twilioClient.messages.create({
        body: `Votre code de vérification est : ${code}`,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log(`SMS envoyé à ${phoneNumber}`);
    } catch (error) {
      console.error('Erreur en envoyant le SMS:', error);
    }
  }

  // ✅ Envoi du lien d'activation par email
  async sendVerificationEmail(email: string, verificationLink: string) {
    try {
      await this.mailTransporter.sendMail({
        from: `"Njureel" <${process.env.SMTP_USER}>`,
        to: email,
        subject: 'Activation de votre compte',
        text: `Cliquez sur ce lien pour activer votre compte : ${verificationLink}`,
        html: `<p>Cliquez sur ce lien pour activer votre compte : <a href="${verificationLink}">${verificationLink}</a></p>`,
      });
      console.log(`Email envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur en envoyant l\'email:', error);
    }
  }

  async sendGenericSMS(phoneNumber: string, message: string) {
    try {
      await this.twilioClient.messages.create({
        body: message,
        from: process.env.TWILIO_PHONE_NUMBER,
        to: phoneNumber,
      });
      console.log(`SMS envoyé à ${phoneNumber}`);
    } catch (error) {
      console.error('Erreur en envoyant le SMS:', error);
    }
  }

  async sendGenericEmail(email: string, subject: string, htmlContent: string) {
    try {
      await this.mailTransporter.sendMail({
        from: `"Njureel" <${process.env.EMAIL_USER}>`,
        to: email,
        subject,
        html: htmlContent,
      });
      console.log(`Email envoyé à ${email}`);
    } catch (error) {
      console.error('Erreur en envoyant l\'email:', error);
    }
  }

}
