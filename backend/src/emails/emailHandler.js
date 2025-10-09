import { resendClient, sender } from "../utils/resend.js";
import { createWelcomeEmailTemplate } from "./emailTemplates.js";
import { log } from "../utils/logger.util.js";

export const sendWelcomeEmail = async (email, name, clientURL) => {
  const { data, error } = await resendClient.emails.send({
    from: `${sender.name} <${sender.email}>`,
    to: email,
    subject: "Welcome to Chatify App!",
    html: createWelcomeEmailTemplate(name, clientURL),
  });

  if (error) {
    log.error("Error sending welcome email", error?.message || error);
    console.error(error);
    throw new Error("Failed to send welcome email");
  }

  log.success("Welcome Email sent successfully", "emailHandler.js");
  console.log(data);
};
