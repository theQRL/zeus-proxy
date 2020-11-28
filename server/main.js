import { Meteor } from 'meteor/meteor'
import QrlNode from './qrlNode'

const ipTestnet = 'testnet-1.automated.theqrl.org'
const ipMainnet = '95.179.131.134'
const port = '19009'
const testnet = new QrlNode(ipTestnet, port)
const mainnet = new QrlNode(ipMainnet, port)

const checkConnectionStatus = () => {
  if (mainnet.connection === true) {
    console.log('Mainnet is connected OKAY')
  } else {
    console.log('ERROR: Mainnet is not connected')
  }
  if (testnet.connection === true) {
    console.log('Testnet is connected OKAY')
  } else {
    console.log('ERROR: Testnet is not connected')
  }
}

Meteor.startup(() => {
  // Enable cross origin requests for all endpoints

  // Preflight
  WebApp.rawConnectHandlers.use(function (req, res, next) {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader('Access-Control-Allow-Headers', 'Authorization,Content-Type')
    return next()
  })

  const headers = {
    'Cache-Control': 'no-store',
    Pragma: 'no-cache',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, PUT, POST, DELETE, OPTIONS',
    'Access-Control-Allow-Headers':
      'Content-Type, Authorization, X-Requested-With',
  }

  JsonRoutes.Middleware.use(function (req, res, next) {
    const originalUrl = req.originalUrl
    const apiCall = req.originalUrl.split('/')
    if (
      apiCall[2] !== 'mainnet' &&
      apiCall[2] !== 'testnet' &&
      originalUrl !== '/'
    ) {
      console.log(
        'ERROR: [invalid route] ' +
          req.connection.remoteAddress +
          ' -> ' +
          originalUrl
      )
      JsonRoutes.sendResult(res, {
        code: 401,
        data: {
          result: 'ERROR: Invalid API call',
          invalid_route: originalUrl,
        },
        headers,
      })
    } else {
      next()
    }
  })

  // TESTNET
  testnet.connect().then(() => {
    console.log('Connection attempt to Testnet')
    console.log('Mainnet connection status: ' + testnet.connection)
    // Routes - get
    JsonRoutes.add('get', '/grpc/testnet/:request', function (req, res, next) {
      const id = req.params.request
      mainnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        })
      })
    })
    // Routes - post
    JsonRoutes.add('post', '/grpc/testnet/:request', function (req, res, next) {
      const id = req.params.request
      const options = req.body
      if (options.address) {
        options.address = Buffer.from(options.address.substring(1), 'hex')
      }
      if (parseInt(options.query, 10).toString() === options.query) {
        // block query
        options.query = Buffer.from(options.query)
      } else {
        if (options.query) {
          if (options.query[0].toLowerCase() === 'q') {
            options.query = Buffer.from(options.query.substring(1), 'hex')
          } else {
            options.query = Buffer.from(options.query, 'hex')
          }
        }
      }
      console.log(req.connection.remoteAddress + ' -> [GRPC/Testnet] ' + id)
      testnet
        .api(id, options)
        .then((result) => {
          JsonRoutes.sendResult(res, {
            data: result,
            headers,
          })
        })
        .catch((error) => {
          JsonRoutes.sendResult(res, {
            data: error,
            headers,
          })
        })
    })
  })
  // end TESTNET

  // MAINNET
  mainnet.connect().then(() => {
    console.log('Connection attempt to Mainnet')
    console.log('Mainnet connection status: ' + mainnet.connection)
    // Routes - get
    JsonRoutes.add('get', '/grpc/mainnet/:request', function (req, res, next) {
      const id = req.params.request
      mainnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        })
      })
    })
    // Routes - post
    JsonRoutes.add('post', '/grpc/mainnet/:request', function (req, res, next) {
      const id = req.params.request
      const options = req.body
      if (options.address) {
        options.address = Buffer.from(options.address.substring(1), 'hex')
      }
      if (parseInt(options.query, 10).toString() === options.query) {
        // block query
        options.query = Buffer.from(options.query)
      } else {
        if (options.query) {
          if (options.query[0].toLowerCase() === 'q') {
            options.query = Buffer.from(options.query.substring(1), 'hex')
          } else {
            options.query = Buffer.from(options.query, 'hex')
          }
        }
      }
      console.log(req.connection.remoteAddress + ' -> [GRPC/Mainnet] ' + id)
      mainnet
        .api(id, options)
        .then((result) => {
          JsonRoutes.sendResult(res, {
            data: result,
            headers,
          })
        })
        .catch((error) => {
          JsonRoutes.sendResult(res, {
            data: error,
            headers,
          })
        })
    })
  })
  // end MAINNET

  Meteor.setInterval(() => {
    checkConnectionStatus()
  }, 60000)
})
