import admin from "../firebase";

/**
 * Sends notifications to multiple Firebase device tokens using FCM.
 *
 * @param {string[]} firebaseTokens - Array of Firebase device tokens to send notifications.
 * @param {Object} payload - Notification payload containing title, body, sound, click action, icon, and data.
 * @param {string} payload.title - Notification title.
 * @param {string} payload.body - Notification body.
 * @param {string} [payload.sound="default"] - Sound to play for the notification.
 * @param {string} payload.click_action - URL or intent to open on click.
 * @param {string} payload.icon - Icon URL for the notification.
 * @param {Object} [payload.data] - Additional data to send with the notification.
 * @returns {Promise<Object|null>} - Returns the Firebase response or null if third-party auth error occurs.
 */
export const sendNotification = async (firebaseTokens, payload) => {
  try {
    // Validate input
    if (!Array.isArray(firebaseTokens) || firebaseTokens.length === 0) {
      throw new Error("firebaseTokens must be a non-empty array.");
    }
    if (!payload || !payload.title || !payload.body) {
      throw new Error("Payload must include at least 'title' and 'body'.");
    }

    const message = {
      tokens: firebaseTokens,
      notification: {
        title: payload.title,
        body: payload.body,
        sound: payload.sound || "default",
        click_action: payload.click_action,
        icon: payload.icon,
      },
      data: payload.data || {},
    };

    // Send notifications via FCM
    const response = await admin.messaging().sendMulticast(message);
    console.log("🚀 ~ Notification Response:", response);
    return response;
  } catch (error) {
    console.error("🚀 ~ sendNotification Error:", error);

    // Handle Firebase-specific errors
    if (error.code === "messaging/third-party-auth-error") {
      console.warn("Firebase third-party auth error, returning null.");
      return null;
    }

    // Rethrow other unexpected errors
    throw new Error(error.message);
  }
};
