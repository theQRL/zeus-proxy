import { Meteor } from 'meteor/meteor'
import QrlNode from './qrlNode'

const ipTestnet = 'testnet-4.automated.theqrl.org'
const ipMainnet = 'mainnet-1.automated.theqrl.org'
const portMainnet = '19009'
const portTestnet = '29009'
const testnet = new QrlNode(ipTestnet, portTestnet)
const mainnet = new QrlNode(ipMainnet, portMainnet)

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
    'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  }

  JsonRoutes.Middleware.use(function (req, res, next) {
    const originalUrl = req.originalUrl
    const apiCall = req.originalUrl.split('/')
    if (apiCall[2] !== 'mainnet' && apiCall[2] !== 'testnet' && originalUrl !== '/') {
      console.log('ERROR: [invalid route] ' + req.connection.remoteAddress + ' -> ' + originalUrl)
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
      console.log(req.connection.remoteAddress + ' -> GET [Grpc/Testnet] ' + id)
      testnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        })
      })
    })
    JsonRoutes.add('get', '/util/testnet/unconfirmedTxCount', function (req, res, next) {
      console.log(req.connection.remoteAddress + ' -> [Util/Testnet] unconfirmedTxCount')
      testnet
        .api('getLatestData', {
          filter: 'TRANSACTIONS_UNCONFIRMED',
          offset: 0,
          quantity: 50,
        })
        .then((result) => {
          const unconfirmedTxCount = { unconfirmedTransactionCount: result.transactions_unconfirmed.length }
          JsonRoutes.sendResult(res, {
            data: unconfirmedTxCount,
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
      console.log(req.connection.remoteAddress + ' -> POST [Grpc/Testnet] ' + id)
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
      console.log(req.connection.remoteAddress + ' -> GET [Grpc/Mainnet] ' + id)
      mainnet.api(id).then((result) => {
        JsonRoutes.sendResult(res, {
          data: result,
          headers,
        })
      })
    })
    JsonRoutes.add('get', '/util/mainnet/unconfirmedTxCount', function (req, res, next) {
      console.log(req.connection.remoteAddress + ' -> [Util/Mainnet] unconfirmedTxCount')
      mainnet
        .api('getLatestData', {
          filter: 'TRANSACTIONS_UNCONFIRMED',
          offset: 0,
          quantity: 50,
        })
        .then((result) => {
          const unconfirmedTxCount = { unconfirmedTransactionCount: result.transactions_unconfirmed.length }
          JsonRoutes.sendResult(res, {
            data: unconfirmedTxCount,
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
      console.log(req.connection.remoteAddress + ' -> POST [Grpc/Mainnet] ' + id)
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
