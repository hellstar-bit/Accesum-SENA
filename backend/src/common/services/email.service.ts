// backend/src/common/services/email.service.ts
import { Injectable } from '@nestjs/common';
import * as nodemailer from 'nodemailer';

export interface EmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: nodemailer.Transporter;

  constructor() {
    this.createTransporter();
  }

  private createTransporter() {
    // Configuración para Gmail (más fácil para empezar)
    this.transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASSWORD, // App Password de Gmail
      },
    });

  }

  async sendEmail(options: EmailOptions): Promise<boolean> {
    try {
      console.log('📧 Enviando email a:', options.to);

      const mailOptions = {
        from: `"SENA - Sistema ACCESUM" <${process.env.EMAIL_USER}>`,
        to: options.to,
        subject: options.subject,
        html: options.html,
        text: options.text,
      };

      const result = await this.transporter.sendMail(mailOptions);
      console.log('✅ Email enviado exitosamente:', result.messageId);
      return true;

    } catch (error) {
      console.error('❌ Error enviando email:', error);
      return false;
    }
  }

  async sendPasswordResetEmail(email: string, firstName: string, resetToken: string): Promise<boolean> {
    const frontendUrl = process.env.FRONTEND_URL || 'https://acceso-sena.netlify.app';
    const resetUrl = `${frontendUrl}/reset-password/${resetToken}`;
    
    const html = this.generatePasswordResetTemplate(firstName, resetUrl, resetToken);
    
    return this.sendEmail({
      to: email,
      subject: '🔐 Recuperación de Contraseña - SENA ACCESUM',
      html,
      text: `Hola ${firstName}, has solicitado recuperar tu contraseña. Visita este enlace: ${resetUrl} (válido por 1 hora)`
    });
  }

  private generatePasswordResetTemplate(firstName: string, resetUrl: string, token: string): string {
    return `
    <!DOCTYPE html>
    <html lang="es">
    <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>Recuperación de Contraseña</title>
        <style>
            body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
            .container { max-width: 600px; margin: 0 auto; padding: 20px; }
            .header { background-color: #39A900; color: white; padding: 20px; text-align: center; border-radius: 8px 8px 0 0; }
            .content { background-color: #f9f9f9; padding: 30px; border-radius: 0 0 8px 8px; }
            .button { display: inline-block; background-color: #39A900; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
            .footer { text-align: center; margin-top: 20px; font-size: 12px; color: #666; }
            .warning { background-color: #fff3cd; border: 1px solid #ffeaa7; padding: 15px; border-radius: 5px; margin: 20px 0; }
        </style>
    </head>
    <body>
        <div class="container">
            <div class="header">
                <h1>🔐 Recuperación de Contraseña</h1>
                <p>Sistema ACCESUM - SENA</p>
            </div>
            
            <div class="content">
                <h2>Hola ${firstName},</h2>
                
                <p>Hemos recibido una solicitud para restablecer la contraseña de tu cuenta en el Sistema ACCESUM del SENA.</p>
                
                <p>Para crear una nueva contraseña, haz clic en el siguiente botón:</p>
                
                <div style="text-align: center;">
                    <a href="${resetUrl}" class="button">Restablecer Contraseña</a>
                </div>
                
                <div class="warning">
                    <strong>⚠️ Información importante:</strong>
                    <ul>
                        <li>Este enlace expira en <strong>1 hora</strong></li>
                        <li>Solo puedes usar este enlace <strong>una vez</strong></li>
                        <li>Si no solicitaste este cambio, ignora este email</li>
                    </ul>
                </div>
                
                <p>Si el botón no funciona, copia y pega este enlace en tu navegador:</p>
                <p style="word-break: break-all; background-color: #f0f0f0; padding: 10px; border-radius: 5px;">
                    ${resetUrl}
                </p>
                
                <p><strong>¿Necesitas ayuda?</strong><br>
                Si tienes problemas para restablecer tu contraseña, contacta al administrador del sistema.</p>
                
                <p>Saludos,<br>
                <strong>Equipo SENA - Sistema ACCESUM</strong></p>
            </div>
            
            <div class="footer">
                <p>Este es un email automático, por favor no respondas a este mensaje.</p>
                <p>SENA - Servicio Nacional de Aprendizaje</p>
                ${process.env.NODE_ENV === 'development' ? `<p style="color: #e74c3c;"><strong>DESARROLLO:</strong> Token: ${token}</p>` : ''}
            </div>
        </div>
    </body>
    </html>
    `;
  }

  async testConnection(): Promise<boolean> {
    try {
      await this.transporter.verify();
      console.log('✅ Conexión de email configurada correctamente');
      return true;
    } catch (error) {
      console.error('❌ Error en configuración de email:', error);
      return false;
    }
  }
}