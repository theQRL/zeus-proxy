import { Meteor } from 'meteor/meteor';
import QrlNode from '@theqrl/node-helpers';

const ip = 'testnet-1.automated.theqrl.org'
const port = '19009'
const testnet = new QrlNode(ip, port)

Meteor.startup(() => {
  testnet.connect().then(() => {
    // Routes - get
    JsonRoutes.add("get", "/grpc/:request", function (req, res, next) {
      const id = req.params.request;
      if (id === 'GetStats') {
        testnet.api('GetStats').then((result) => {
          console.log(result)
          JsonRoutes.sendResult(res, {
            data: result,
          });  
        })        
      } else {
      JsonRoutes.sendResult(res, {
        data: `Here will be data back from ${id} request GET`
      });  
      }
    });
    // Routes - post
    JsonRoutes.add("post", "/grpc/:request", function (req, res, next) {
      const id = req.params.request;
      JsonRoutes.sendResult(res, {
        data: `Here will be data back from ${id} request POST`
      });
    });
  });
});
