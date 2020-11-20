import { Meteor } from 'meteor/meteor'
import QrlNode from '@theqrl/node-helpers'

const ip = 'testnet-1.automated.theqrl.org'
const ip_mainnet = 'mainnet-1.automated.theqrl.org'
const port = '19009'
const testnet = new QrlNode(ip, port)
const mainnet = new QrlNode(ip_mainnet, port)

Meteor.startup(() => {

  // Enable cross origin requests for all endpoints
  JsonRoutes.setResponseHeaders({
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  });

  // TESTNET
  testnet.connect().then(() => {
    console.log('Connected to Testnet')

    // Routes - get
    JsonRoutes.add("get", "/grpc/testnet/:request", function (req, res, next) {
      const id = req.params.request
      testnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
        })  
      })        
    })

    // Routes - post
    JsonRoutes.add("post", "/grpc/testnet/:request", function (req, res, next) {
      const id = req.params.request
      const options = req.body
      
      try {
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

// MAINNET
mainnet.connect().then(() => {
  console.log('Connected to Mainnet')

  // Routes - get
  JsonRoutes.add("get", "/grpc/mainnet/:request", function (req, res, next) {
    const id = req.params.request
    mainnet.api(id).then((result) => {
      JsonRoutes.sendResult(res, {
        data: result,
      })  
    })        
  })

  // Routes - post
  JsonRoutes.add("post", "/grpc/mainnet/:request", function (req, res, next) {
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

    mainnet.api(id, options).then((result) => {
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
