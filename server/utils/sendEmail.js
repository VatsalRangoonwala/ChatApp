import dotenv from "dotenv";
import { Resend } from "resend";

dotenv.config();


const resend = new Resend(process.env.RESEND_API_KEY);

const sendEmail = async ({ to, subject, text }) => {
  await resend.emails.send({
  from: process.env.EMAIL_USER,
  to: to,
  subject: subject,
  text: text,
});
}

export default sendEmail;
