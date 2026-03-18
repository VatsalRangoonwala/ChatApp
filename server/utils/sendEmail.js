import nodemailer from "nodemailer";
import dotenv from "dotenv";

dotenv.config();

const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 456,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
  family: 4,
});

const sendEmail = async ({ to, subject, html }) => {
  await transporter
    .verify()
    .then(() => console.log("SMTP Ready"))
    .catch((err) => console.log("SMTP Error:", err));
    
  await transporter.sendMail({
    from: process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export default sendEmail;
