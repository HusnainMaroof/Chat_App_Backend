import * as sib from "@getbrevo/brevo";
import { config } from "./EnvConfig.js";
import dotenv from "dotenv";
dotenv.config();
const apiInstance = new sib.TransactionalEmailsApi();

const apiKey = apiInstance.authentications["apiKey"];
apiKey.apiKey = config.EMAIL_CONFIG.BREVO_SMTP_SDK_KEY;

// console.log(` smpt key  ${config.EMAIL_CONFIG.BREVO_SMTP_SDK_KEY}`);

export const sendEmail = async ({ to, subject, templet }) => {
  //configration for brevo
  const sendMail = new sib.SendSmtpEmail();
  sendMail.subject = subject;
  sendMail.to = [{ email: to }];
  sendMail.htmlContent = templet;
  sendMail.sender = {
    email: config.EMAIL_CONFIG.EMAIL_FROM,

    name: "ChatNow",
  };

  try {
    const data = await apiInstance.sendTransacEmail(sendMail);
    return { success: true, messageId: data.body.messageId };
  } catch (error) {
    console.error("Brevo API Error Details:", error);
    throw new Error(error.response?.body?.message || "Email failed to send");
  }
};
