"use strict";
const joi = require("joi");
const moment = require("moment");
const logger = require("winston");
const configuration = require("../../configuration");
const config = require("../../config/components/fcm");
const FCM = require("fcm-push");
// const fcm = new FCM(config.FCM_SERVER_KEY);
const configEnv = process.env;
// const fcm = new FCM("AAAAmZKOLVU:APA91bG7K3a0KE1fhsEgSklsnMy2ca2s4MubLq4lOIF1P7WxOh81YGyHOn4XlIJm8s1eZmVCSFz1IZi2Z-_Ms7z0N0HLf9fCIibrmyFw_2-O4TnxrXWdozfpoo2zjsxivaCLJ34ZkVcn");
const fcm = new FCM(configEnv.FCM_SERVER_KEY);
const notifyFcmTopic = request => {
  var sound = "";

  if ("sound" in request) {
    sound = request.sound;
  } else {
    sound = "default";
  }
  let payload;
  let resData = {
    action: request.action || 1,
    pushType: request.pushType || 1,
    title: request.title || "",
    msg: request.msg || "",
    data: request.data || []
  };
  logger.warn("request for fcm:" + JSON.stringify(request));
  if (request.deviceType == 1) {
    payload = {
      to: "/topics/" + request.fcmTopic, // required fill with device token or topics
      collapse_key: "your_collapse_key",
      priority: "high",
      delay_while_idle: true,
      dry_run: false,
      time_to_live: 3600,
      content_available: true,
      badge: "1",
      data: resData
    };
    payload.notification = {
      title: request.title,
      body: request.msg,
      sound: sound
    };
    if (resData.action == 506) {
      payload.mutable_content = true;
      payload.content_available = true;
      payload.notification.sound = "";
    }
  } else if (request.deviceType == 2) {
    payload = {
      to: "/topics/" + request.fcmTopic, // required fill with device token or topics
      collapse_key: "your_collapse_key",
      priority: "high",
      delay_while_idle: true,
      dry_run: false,
      time_to_live: 3600,
      content_available: true,
      badge: "1",
      data: resData
    };
    // payload.notification = {
    //     title: request.title,
    //     body: request.msg,
    //     sound: "default"
    // };
    if (resData.action == 506) {
      payload.mutable_content = true;
      payload.content_available = true;
      payload.notification.sound = "";
    }
  } else {
    // return callback(false);
  }
  if (request.fcmTopic != "" || request.fcmTopic != null || request.fcmTopic != undefined) {
    logger.warn("payload for fcm:" + JSON.stringify(payload));
    fcm
      .send(payload)
      .then(function (response) {
        logger.warn("Successfully(fcm) sent with response ! " + JSON.stringify(response));
      })
      .catch(function (err) {
        logger.error("Something has gone wrong while sending fcm! " + JSON.stringify(err));
      });
  }
};

const notifyFcmTopicRichPush = request => {
  let payload;
  let resData = {
    action: request.action || 1,
    pushType: request.pushType || 1,
    title: request.title || "",
    msg: request.msg || "",
    data: request.data || []
  };
  if (request.deviceType == 1) {
    payload = {
      to: "/topics/" + request.fcmTopic, // required fill with device token or topics
      collapse_key: "your_collapse_key",
      priority: "high",
      delay_while_idle: true,
      dry_run: false,
      time_to_live: 3600,
      content_available: true,
      mutable_content: true,
      category: "booking",
      click_action: "booking",
      badge: "1",
      data: resData
    };

    payload.notification = {
      title: request.title,
      body: request.msg,
      sound: "default",
      click_action: "booking"
    };
  } else if (request.deviceType == 2) {
    payload = {
      to: "/topics/" + request.fcmTopic, // required fill with device token or topics
      collapse_key: "your_collapse_key",
      priority: "high",
      delay_while_idle: true,
      dry_run: false,
      time_to_live: 3600,
      content_available: true,
      mutable_content: true,
      category: "booking",
      badge: "1",
      data: resData
    };
  } else {
    // return callback(false);
  }

  //promise style
  fcm
    .send(payload)
    .then(function (response) {
      // return callback(true);
    })
    .catch(function (err) {
      console.error(err);
      // return callback(false);
    });
};
module.exports = { notifyFcmTopic, notifyFcmTopicRichPush };
