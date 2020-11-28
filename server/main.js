import { Meteor } from "meteor/meteor";
import QrlNode from "./qrlNode";

const ip = "testnet-1.automated.theqrl.org";
const ip_mainnet = "95.179.131.134";
const port = "19009";
const testnet = new QrlNode(ip, port);
const mainnet = new QrlNode(ip_mainnet, port);

Meteor.startup(() => {
  // Enable cross origin requests for all endpoints

  // Preflight
  WebApp.rawConnectHandlers.use(function (req, res, next) {
    res.setHeader("Access-Control-Allow-Origin", "*");
    res.setHeader("Access-Control-Allow-Headers", "Authorization,Content-Type");
    return next();
  });

  const headers = {
    "Cache-Control": "no-store",
    Pragma: "no-cache",
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, PUT, POST, DELETE, OPTIONS",
    "Access-Control-Allow-Headers":
      "Content-Type, Authorization, X-Requested-With",
  };

  // TESTNET
  testnet.connect().then(() => {
    console.log("Connection attempt to Testnet");
    console.log("Mainnet connection status: " + testnet.connection);
    // Routes - get
    JsonRoutes.add("get", "/grpc/testnet/:request", function (req, res, next) {
      const id = req.params.request;
      mainnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        });
      });
    });
    // Routes - post
    JsonRoutes.add("post", "/grpc/testnet/:request", function (req, res, next) {
      const id = req.params.request;
      const options = req.body;
      if (options.address) {
        options.address = Buffer.from(options.address.substring(1), "hex");
      }
      if (parseInt(options.query, 10).toString() === options.query) {
        // block query
        options.query = Buffer.from(options.query);
      } else {
        if (options.query) {
          if (options.query[0].toLowerCase() === "q") {
            options.query = Buffer.from(options.query.substring(1), "hex");
          } else {
            options.query = Buffer.from(options.query, "hex");
          }
        }
      }
      console.log(req.connection.remoteAddress + " -> [GRPC/Testnet] " + id);
      testnet
        .api(id, options)
        .then((result) => {
          JsonRoutes.sendResult(res, {
            data: result,
            headers,
          });
        })
        .catch((error) => {
          JsonRoutes.sendResult(res, {
            data: error,
            headers,
          });
        });
    });
  });
  // end TESTNET

  // MAINNET
  mainnet.connect().then(() => {
    console.log("Connection attempt to Mainnet");
    console.log("Mainnet connection status: " + mainnet.connection);
    // Routes - get
    JsonRoutes.add("get", "/grpc/mainnet/:request", function (req, res, next) {
      const id = req.params.request;
      mainnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        });
      });
    });
    // Routes - post
    JsonRoutes.add("post", "/grpc/mainnet/:request", function (req, res, next) {
      const id = req.params.request;
      const options = req.body;
      if (options.address) {
        options.address = Buffer.from(options.address.substring(1), "hex");
      }
      if (parseInt(options.query, 10).toString() === options.query) {
        // block query
        options.query = Buffer.from(options.query);
      } else {
        if (options.query) {
          if (options.query[0].toLowerCase() === "q") {
            options.query = Buffer.from(options.query.substring(1), "hex");
          } else {
            options.query = Buffer.from(options.query, "hex");
          }
        }
      }
      console.log(req.connection.remoteAddress + " -> [GRPC/Mainnet] " + id);
      mainnet
        .api(id, options)
        .then((result) => {
          JsonRoutes.sendResult(res, {
            data: result,
            headers,
          });
        })
        .catch((error) => {
          JsonRoutes.sendResult(res, {
            data: error,
            headers,
          });
        });
    });
  });
  // end MAINNET
});
