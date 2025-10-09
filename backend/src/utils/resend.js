import { Resend } from "resend";
import "dotenv/config";

//Using this to send emails
export const resendClient = new Resend(process.env.RESEND_API);

//Sender information
export const sender = {
  email: process.env.EMAIL_FROM,
  name: process.env.EMAIL_FROM_NAME,
};
