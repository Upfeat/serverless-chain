const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

exports.pushNotifications = (req, res) => {
  if (req.method !== 'POST') {
    res.status(404).end();
  }

  switch (req.get('content-type')) {
    // '{"name":"John"}'
    case 'application/json':
      // ({name} = req.body);
      break;
    // 'name=John' in the body of a POST request (not the URL)
    case 'application/x-www-form-urlencoded':
      // ({name} = req.body);
      break;
    default:
      return res.status(503).end();
  }

  const receipts = handlePushTokens(req.body);
  console.log(`Received message, with title: ${req.body.title}`);

  res.status(200).json({receipts: receipts});
};

const handlePushTokens = ({ title, body, pushTokens = []}) => {
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
