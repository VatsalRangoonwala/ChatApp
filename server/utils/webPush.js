import webpush from "web-push";
import dotenv from "dotenv";
import { logger } from "./logger.js";

dotenv.config();

const isWebPushConfigured = () => {
  return Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);
};

if (isWebPushConfigured()) {
  webpush.setVapidDetails(
    process.env.VAPID_CONTACT_EMAIL || "mailto:no-reply@example.com",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY,
  );
} else {
  logger.warn("Web push is not configured. Push notifications are disabled.");
}

export const sendPushNotification = async (subscription, payload) => {
  if (!isWebPushConfigured() || !subscription) {
    return;
  }

  try {
    await webpush.sendNotification(subscription, payload);
  } catch (error) {
    logger.error("Push notification failed", {
      statusCode: error.statusCode,
      message: error.message,
    });
  }
};

export default webpush;
