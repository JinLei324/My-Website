"use strict";

const postLogs = require("./postLogs");
const errorMsg = require("../../../../locales");
const headerValidator = require("../../../middleware/validator");

module.exports = [
  {
    method: "POST",
    path: "/driver/locationLogs",
    handler: postLogs.handler,
    config: {
      tags: ["api", "location"],
      description: errorMsg["apiDescription"]["providerPostLocationLogs"],
      notes: errorMsg["apiDescription"]["providerPostLocationLogs"],
      auth: "driverJWT",
      validate: {
        headers: headerValidator.headerAuthValidator,
        payload: postLogs.payload,
        failAction: (req, reply, source, error) => {
          return reply({ message: error.output.payload.message }).code(error.output.statusCode);
        }
      }
    }
  }
];
