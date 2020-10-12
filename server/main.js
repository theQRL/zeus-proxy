import { Meteor } from 'meteor/meteor'
import QrlNode from '@theqrl/node-helpers'

const ip = 'testnet-1.automated.theqrl.org'
const port = '19009'
const testnet = new QrlNode(ip, port)

Meteor.startup(() => {
  testnet.connect().then(() => {
    console.log('Connected to Testnet')

    // Routes - get
    JsonRoutes.add("get", "/grpc/:request", function (req, res, next) {
      const id = req.params.request
      testnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
        })  
      })        
    })

    // Routes - post
    JsonRoutes.add("post", "/grpc/:request", function (req, res, next) {
      const id = req.params.request
      const options = req.body
      
      try {
        console.log('options.address', options.address)
        options.address = Buffer.from(options.address.substring(1), 'hex')
      } catch (e) {
        // no need to throw anything
      }
      try {
        if (parseInt(options.query, 10).toString() === options.query) {
          // block query
          options.query = Buffer.from(options.query)
        } else {
          // hex query
          // drop initial Q if QRL address
          if (options.query[0].toLowerCase() === 'q') {
            options.query = Buffer.from(options.query.substring(1), 'hex')
          } else {
            options.query = Buffer.from(options.query, 'hex')
          }
        }
      } catch (e) {
        // no need to throw anything
      }

      testnet.api(id, options).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
        })  
      }).catch(error => {
        JsonRoutes.sendResult(res, {
          data: error,
        })
      })

    })
  })
})
