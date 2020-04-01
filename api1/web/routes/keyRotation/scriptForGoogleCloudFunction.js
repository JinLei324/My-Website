var request = require("request");

/**
 * Triggered from a message on a Cloud Pub/Sub topic.
 *
 * @param {!Object} event Event payload.
 * @param {!Object} context Metadata for the event.
 */
exports.helloPubSub = (event, context) => {
  const pubsubMessageatt = event.attributes;
  const pubsubMessage = event.data;
  const pubsubData = JSON.parse(Buffer.from(pubsubMessage, 'base64').toString());
  const formatter = new Intl.NumberFormat('en-US', { style: 'currency', currency: 'INR', minimumFractionDigits: 2 })

  const costAmount = formatter.format(pubsubData.costAmount);
  const budgetAmount = formatter.format(pubsubData.budgetAmount);
  const budgetName = pubsubData.budgetDisplayName;
  const createdAt = new Date().toISOString();
  let threshold = (pubsubData.alertThresholdExceeded * 100).toFixed(0);

  if (!isFinite(threshold)) {
    threshold = 0;
  }

  console.log('costAmount', costAmount);
  console.log('budgetAmount', budgetAmount);
  console.log('threshold', threshold);

  if (costAmount >= budgetAmount) {

    var options = {
      method: 'POST',
      url: 'https://apidev.deliv-x.com/utility/keyRotationCloudFunction',
      headers:
      {
        'cache-control': 'no-cache',
        'Postman-Token': '0fcc8e32-f239-4f68-beeb-eaab07b5ba50,2075ba49-c679-46cf-8d8e-cdbdbcd62ebe',
        'Content-Type': 'application/json'
      },
      body: { 'billingAccountId': pubsubMessageatt.billingAccountId },
      json: true
    };

    request(options, function (error, response, body) {


      console.log(body);
    });

  }
};
