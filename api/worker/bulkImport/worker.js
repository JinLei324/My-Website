const logger = require("winston");
const rabbitMq = require("../../library/rabbitMq");
const db = require("../../library/mongodb");
const bulkUpload = require("../../web/routes/admin/childProducts/add/post");
const elasticDb = require("../../models/elasticSearch");

rabbitMq.connect(() => {
  db.connect(() => {
    elasticDb.connect(() => {
      prepareConsumer(rabbitMq.getChannel(), rabbitMq.QueueBulkimportInsert, rabbitMq.get());
    });
  });
});

function prepareConsumer(channel, queue, amqpConn) {
  logger.info(queue.name + " worker started");
  let count = 0;
  channel.assertQueue(queue.name, queue.options, function (err, amqpQueue) {
    if (err) {
      process.exit();
    } else {
      channel.consume(queue.name, function (msg) {
        if (msg) {
          count++;
        }
        var data = JSON.parse(msg.content.toString());
        var req = {
          payload: data
        };

        bulkUpload.handlerNew(req, function (err, res) {
          // rabbitMq.sendToQueue(rabbitMq.QueueBulkimportResponse, res, (err, doc) => {
          // });
        });
      }, { noAck: true }, function (err, ok) {
        //To check if need to exit worker
      });
    }
  });
}