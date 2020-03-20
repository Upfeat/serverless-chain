import { Expo } from 'expo-server-sdk';

// Create a new Expo SDK client
let expo = new Expo();

exports = ({ title, body }, pushTokens = []) => {
  let notifications = [];
  for (let pushToken of pushTokens) {
    if (!Expo.isExpoPushToken(pushToken)) {
      console.error(`Push token ${pushToken} is not a valid Expo push token`);
      continue;
    }

    notifications.push({
      to: pushToken,
      sound: "default",
      title: title,
      body: body,
      data: { body }
    });
  }

  let chunks = expo.chunkPushNotifications(notifications);
  // we may want to keep track of notification receipts and later check on their status
  let receipts = [];
  (async () => {
    for (let chunk of chunks) {
      try {
        let receiptChunk = await expo.sendPushNotificationsAsync(chunk);
        console.log(receiptChunk);
        receipts.push(...receiptChunk);
        // NOTE: If a receipt contains an error code in receipt.details.error, you
        // must handle it appropriately. The error codes are listed in the Expo
        // documentation:
        // https://docs.expo.io/versions/latest/guides/push-notifications#response-format
      } catch (error) {
        console.error(error);
      }
    }
  })();
  return receipts;
};
