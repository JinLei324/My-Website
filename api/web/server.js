// var ENVMODULE = require("node-env-file");

const logger = require("winston");
const express = require("express");
// const trace = require("node-trace");
const trace = require("./middleware/node-trace");

//cluster
const cluster = require("cluster");
const numCPUs = require("os").cpus().length;
const ipc = require("node-ipc");
const fork = require("child_process").fork;
const psList = require("ps-list");
//Salesforce library
const salesforceAUTH = require("../library/salesforce");
var corsHeaders = require("hapi-cors-headers");

if (cluster.isMaster) {
  //const pubsub = require('../library/pubsub');
  const redisEvent = require("../trigger/redisEventListner");
  logger.info(`Master ${process.pid} is running`);
  const db = require("../library/mongodb");
  const elasticDb = require("../models/elasticSearch");
  db.connect(() => {
    elasticDb.connect(() => {
      const workingHour = require("./commonModels/workingHour");
      workingHour.syncStores();
    }); //create a connection to elasticsearch
  });
  // Fork workers.
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
    logger.info(`Forking process number ${i}...`);
  }
  // logger.warn(cluster.workers)

  var metricsServer = express();
  metricsServer.listen(3002, () => {
  });
  metricsServer.use('', trace.MetricsNotCluster(metricsServer, express));
  metricsServer.use('', trace.SnapshotExpress(metricsServer, express));

  // Listen for dying workers
  cluster.on("exit", function (worker) {
    // Replace the dead worker,
    // we're not sentimental
    logger.info(`worker ${worker.process.pid} died`);
    //  process.kill(worker.process.pid);
    cluster.fork();
  });

  psList().then(data => {
    // kill child processes while starting server
    for (let i = 0; i < data.length; i++) {
      if (data[i].name == "node") {
        let str = data[i].cmd;
        if (data[i].cmd.match(/worker/g)) {
          logger.warn("Old workers removing in progress: " + JSON.stringify(data[i].cmd));
          process.kill(data[i].pid);
        }
      }
    }
  });
} else {
  const Hapi = require("hapi");
  const Server = new Hapi.Server();

  const config = require("./config");
  const db = require("../library/mongodb");

  const middleware = require("./middleware");
  const amqpConn = require("../library/rabbitMq");
  const redis = require("../library/redis");
  const elasticDb = require("../models/elasticSearch");
  const worker = require("../library/rabbitMq/worker");

  Server.connection({
    port: config.port,
    host: "0.0.0.0",
    routes: {
      cors: {
        origin: ["*"],
        additionalHeaders: ["cache-control", "x-requested-with", "authorization"]
      }
    }
  });

  Server.ext("onPreResponse", corsHeaders);
  /* +_+_+_+_+_+_+_+_+_+_+ Plugins / Middlewares +_+_+_+_+_+_+_+_+_+_+ */
  Server.register(
    [
      middleware.good,
      middleware.swagger.inert,
      middleware.swagger.vision,
      middleware.swagger.swagger,
      middleware.auth.HAPI_AUTH_JWT,
      middleware.localization.i18n
    ],
    err => {
      if (err) Server.log(["error"], "hapi-swagger load error: " + err);
      else
        Server.views({
          engines: {
            html: require("handlebars")
          }
        });
      Server.log(["start"], "hapi-swagger interface loaded");
    }
  );

  /* +_+_+_+_+_+_+_+_+_+_+_+_+_+_+ AUTH STRATEGIES +_+_+_+_+_+_+_+_+_+_+_+_+ */

  Server.auth.strategy("auth", "jwt", middleware.auth.authJWT); //strategy to validate authJWT tokens
  Server.auth.strategy("customerJWT", "jwt", middleware.auth.customerJWT); //strategy to customerJWT slave tokens
  Server.auth.strategy("managerJWT", "jwt", middleware.auth.managerJWT); //strategy to customerJWT slave tokens
  Server.auth.strategy("guestJWT", "jwt", middleware.auth.guestJWT); //strategy to validate guestJWT tokens
  Server.auth.strategy("refJwt", "jwt", middleware.auth.refreshJWT); //strategy to validate refreshJWT tokens
  Server.auth.strategy("AdminJWT", "jwt", middleware.auth.AdminJWT); //strategy to validate AdminJWT tokens
  Server.auth.strategy("storeAdminJWT", "jwt", middleware.auth.storeAdminJWT); //strategy to validate AdminJWT tokens
  Server.auth.strategy("franchiseAdminJWT", "jwt", middleware.auth.franchiseAdminJWT); //strategy to validate AdminJWT tokens
  Server.auth.strategy("driverJWT", "jwt", middleware.auth.driverJWT); //strategy to validate driverJWT tokens
  Server.auth.strategy("basicChatModule", "jwt", middleware.auth.basicChatModule); //strategy to validate driverJWT tokens
  Server.auth.strategy("dispatcher", "jwt", middleware.auth.dispatcherJWT); //strategy to dispatcher authJWT tokens

  Server.route(require("./routes")); //import the routes
  Server.route(require("../library/twilio/webhook"));
  Server.route(require("../library/mailgun/webhook"));

  const trace_endpoint = trace.Endpoint;

  Server.on("response", req => {
    // console.log("response for api : ", req.route.path, " : ", JSON.stringify(req.response.source));
    let reqTime = req.info.responded - req.info.received;
    trace_endpoint.onComplete(req.info.received, req.route.method.toUpperCase(), req.route.path, req.response.statusCode)
  });


  Server.start(() => {
    logger.info(`Server is listening on port ${config.port}`);
    db.connect(() => { }); //create a connection to mongodb
    //Salesforce Inititilaization
    salesforceAUTH.login(() => { });
    elasticDb.connect(() => { }); //create a connection to elasticsearch
    amqpConn.connect(() => { });
    worker.startWorker();
  }); // Add the route
}
