import { Meteor } from 'meteor/meteor';

Meteor.startup(() => {
  JsonRoutes.add("get", "/grpc/:request", function (req, res, next) {
  var id = req.params.request;

  JsonRoutes.sendResult(res, {
    data: `Here will be data back from ${id} request`
  });
});
});
