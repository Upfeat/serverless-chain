const { Expo } = require('expo-server-sdk');

// Create a new Expo SDK client
let expo = new Expo();

exports.notificationReceipts = (req, res) => {
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

  const receipts = checkReceipts(req.body);
  res.status(200).json({receipts: receipts});
};

const checkReceipts = ({tickets = []}) => {
  // Later, after the Expo push notification service has delivered the
  // notifications to Apple or Google (usually quickly, but allow the the service
  // up to 30 minutes when under load), a "receipt" for each notification is
  // created. The receipts will be available for at least a day; stale receipts
  // are deleted.
  //
  // The ID of each receipt is sent back in the response "ticket" for each
  // notification. In summary, sending a notification produces a ticket, which
  // contains a receipt ID you later use to get the receipt.
  //
  // The receipts may contain error codes to which you must respond. In
  // particular, Apple or Google may block apps that continue to send
  // notifications to devices that have blocked notifications or have uninstalled
  // your app. Expo does not control this policy and sends back the feedback from
  // Apple and Google so you can handle it appropriately.
  let receiptIds = [];
  for (let ticket of tickets) {
    // NOTE: Not all tickets have IDs; for example, tickets for notifications
    // that could not be enqueued will have error information and no receipt ID.
    if (ticket.id) {
      receiptIds.push(ticket.id);
    }
  }

  let receiptIdChunks = expo.chunkPushNotificationReceiptIds(receiptIds);
  let allReceipts = {};
  (async () => {
    // Like sending notifications, there are different strategies you could use
    // to retrieve batches of receipts from the Expo service.
    for (let chunk of receiptIdChunks) {
      try {
        let receipts = await expo.getPushNotificationReceiptsAsync(chunk);
        console.log(receipts);
        // allReceipts = Object.assign({}, allReceipts, receipts);

        // The receipts specify whether Apple or Google successfully received the
        // notification and information about an error, if one occurred.
        for (const receiptId in receipts) {
          const {status, message, details} = receipts[receiptId];
          if (status === "ok") {
            // do something?
            continue;
          } else if (status === "error") {
            console.error(
              `There was an error sending a notification: ${message}`
            );
            if (details && details.error) {
              // The error codes are listed in the Expo documentation:
              // https://docs.expo.io/versions/latest/guides/push-notifications/#individual-errors
              // You must handle the errors appropriately.
              console.error(`The error code is ${details.error}`);
            }
          }
        }
      } catch (error) {
        console.error(error);
      }
    }
  })();
  return allReceipts;
};