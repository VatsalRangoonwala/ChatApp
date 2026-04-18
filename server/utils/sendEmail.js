import nodemailer from "nodemailer";
import dotenv from "dotenv";
import AppError from "./appError.js";
import { logger } from "./logger.js";

dotenv.config();

const getTransporter = () => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    throw new AppError(
      "Email transport is not configured. Set EMAIL_USER and EMAIL_PASS.",
      500,
    );
  }

  const port = Number(process.env.EMAIL_PORT || 465);
  const secure = process.env.EMAIL_SECURE
    ? process.env.EMAIL_SECURE === "true"
    : port === 465;

  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE || "gmail",
    host: process.env.EMAIL_HOST || "smtp.gmail.com",
    port,
    secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    family: 4,
  });
};

const transporter = getTransporter();
let transportReadyPromise;

const ensureTransportReady = async () => {
  if (!transportReadyPromise) {
    transportReadyPromise = transporter.verify().then(() => {
      logger.info("SMTP transport ready");
    });
  }

  return transportReadyPromise;
};

const sendEmail = async ({ to, subject, html }) => {
  await ensureTransportReady();

  await transporter.sendMail({
    from: process.env.EMAIL_FROM || process.env.EMAIL_USER,
    to,
    subject,
    html,
  });
};

export default sendEmail;
