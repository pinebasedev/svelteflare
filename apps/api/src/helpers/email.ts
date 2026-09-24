import { EmailMessage } from "cloudflare:email";
import { createMimeMessage } from "mimetext";
import type { AppBindings } from "../types";

const sendEmail = async (
  env: AppBindings,
  {
    to,
    subject,
    text
  }: {
    to: string;
    subject: string;
    text: string;
  }
) => {
  // No `EMAIL` binding on stages without Email Routing (workers.dev).
  if (!env.EMAIL) {
    console.warn(
      JSON.stringify({ type: "email_skipped", level: "warn", to, subject })
    );
    return;
  }

  const from = env.EMAIL_FROM_ADDRESS;

  const msg = createMimeMessage();
  msg.setSender({ name: env.EMAIL_FROM_NAME, addr: from });
  msg.setRecipient(to);
  msg.setSubject(subject);
  msg.addMessage({ contentType: "text/plain", data: text });

  try {
    const message = new EmailMessage(from, to, msg.asRaw());
    await env.EMAIL.send(message);
  } catch (err) {
    console.error(
      JSON.stringify({
        type: "email_send_error",
        level: "error",
        to,
        subject,
        error:
          err instanceof Error
            ? { name: err.name, message: err.message }
            : { value: String(err) }
      })
    );
  }
};

export const sendVerificationOtpEmail = async (
  env: AppBindings,
  email: string,
  otp: string
) => {
  await sendEmail(env, {
    to: email,
    subject: "Your verification code",
    text: `Your verification code is ${otp}. It expires in 15 minutes.`
  });
};

export const sendResetEmail = async (
  env: AppBindings,
  name: string,
  email: string,
  url: string
) => {
  await sendEmail(env, {
    to: email,
    subject: "Reset your password",
    text: `Hi ${name},\n\nUse this link to reset your password:\n${url}\n\nIf you didn't request this, you can ignore this email.`
  });
};
