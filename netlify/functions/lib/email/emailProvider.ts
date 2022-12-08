import { createTransport } from "nodemailer";
import Mail from "nodemailer/lib/mailer";
import { env } from "process";
import { ENV_VARIABLES } from "../configs/envVariables";

class GenericEmail {
  private SMTP_USERNAME: string;
  private SMTP_PASSWORD: string;
  private SMTP_HOST: string;
  private SMTP_PORT: number;
  private SMTP_FROM: string;

  constructor(
    smtpUsername: string,
    smtpPassword: string,
    smtpHost: string,
    smtpPort: number,
    smtpFrom: string
  ) {
    this.SMTP_USERNAME = smtpUsername;
    this.SMTP_PASSWORD = smtpPassword;
    this.SMTP_HOST = smtpHost;
    this.SMTP_PORT = smtpPort;
    this.SMTP_FROM = smtpFrom;
  }

  async sendEmail(to: string, subject: string, html: string): Promise<void> {
    const transporter = createTransport({
      host: this.SMTP_HOST,
      port: this.SMTP_PORT,
      secure: true,
      auth: {
        user: this.SMTP_USERNAME,
        pass: this.SMTP_PASSWORD,
      },
    });

    const mailOptions: Mail.Options = {
      from: this.SMTP_FROM,
      to,
      subject,
      html,
    };

    await transporter.sendMail(mailOptions);
  }
}

// Corresponding to contact@appsforchat.com
export const getZohoContactMailer = () => {
  // verify if environment variables are set

  if (
    !ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL ||
    !ENV_VARIABLES.CONTACT_APPSFORCHAT_MEMBER_MAIL ||
    !env.CONTACT_APPSFORCHAT_MEMBER_PASSWORD ||
    !ENV_VARIABLES.ZOHO_SMTP_HOST ||
    !ENV_VARIABLES.ZOHO_SMTP_PORT
  ) {
    throw new Error(
      "Error! one or more of these environment variables is/are not set - CONTACT_APPSFORCHAT_FROM_MAIL, CONTACT_APPSFORCHAT_MEMBER_MAIL, CONTACT_APPSFORCHAT_MEMBER_PASSWORD, ZOHO_SMTP_HOST, ZOHO_SMTP_PORT"
    );
  }

  return new GenericEmail(
    ENV_VARIABLES.CONTACT_APPSFORCHAT_MEMBER_MAIL,
    env.CONTACT_APPSFORCHAT_MEMBER_PASSWORD,
    ENV_VARIABLES.ZOHO_SMTP_HOST,
    Number(ENV_VARIABLES.ZOHO_SMTP_PORT),
    ENV_VARIABLES.CONTACT_APPSFORCHAT_FROM_MAIL
  );
};
