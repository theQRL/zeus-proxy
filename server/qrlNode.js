require('@babel/polyfill')
const grpc = require('@grpc/grpc-js')
const protoLoader = require('@grpc/proto-loader')
const CryptoJS = require('crypto-js')
const { promisify } = require('util')
const { QRLPROTO_SHA256 } = require('@theqrl/qrl-proto-sha256')
const tmp = require('tmp')
const fs = require('fs')
const util = require('util')
const readFile = util.promisify(fs.readFile)
const writeFile = util.promisify(fs.writeFile)

const PROTO_PATH = Assets.absoluteFilePath('qrlbase.proto').split('qrlbase.proto')[0]

let qrlClient = null

// Every call gets a deadline so a dead connection fails the request instead of hanging it
const CALL_TIMEOUT_MS = 30000
const CONNECT_TIMEOUT_MS = 10000
const HEALTH_CHECK_TIMEOUT_MS = 10000
// Lower bound between reconnect attempts while the node is down
const MIN_RECONNECT_INTERVAL_MS = 5000

// Call failures that mean the node can't be reached, so the client is rebuilt
const NODE_DOWN_CODES = [grpc.status.UNAVAILABLE, grpc.status.DEADLINE_EXCEEDED]

function grpcError(code, details) {
  const error = new Error(details)
  error.code = code
  error.details = details
  return error
}

function closeClient(client) {
  try {
    client.close()
  } catch (error) {
    console.log('Unable to close client (' + error + ')')
  }
}

function clientGetNodeInfo(client) {
  return new Promise((resolve, reject) => {
    client.getNodeInfo({}, { deadline: Date.now() + CONNECT_TIMEOUT_MS }, (error, response) => {
      if (error) {
        reject(error)
        return
      }
      resolve(response)
    })
  })
}

function checkProtoHash(file) {
  return readFile(file).then((contents) => {
    // console.log(contents)
    const protoFileWordArray = CryptoJS.lib.WordArray.create(contents.toString())
    const calculatedProtoHash = CryptoJS.SHA256(protoFileWordArray).toString(CryptoJS.enc.Hex)
    let verified = false
    QRLPROTO_SHA256.forEach((value) => {
      if (value.protoHash) {
        if (value.protoHash === calculatedProtoHash) {
          verified = true
        }
      }
    })
    return verified
  })
}

function loadGrpcBaseProto(grpcEndpoint) {
  return protoLoader.load(`${PROTO_PATH}qrlbase.proto`, {}).then(async (packageDefinition) => {
    let client = null
    try {
      const packageObject = await grpc.loadPackageDefinition(packageDefinition)
      client = await new packageObject.qrl.Base(grpcEndpoint, grpc.credentials.createInsecure())
      // console.log(client)
      const res = await clientGetNodeInfo(client)
      const qrlProtoFilePath = tmp.fileSync({
        mode: '0644',
        prefix: 'qrl-',
        postfix: '.proto',
      }).name
      // must finish before checkProtoHash reads the file back
      await writeFile(qrlProtoFilePath, res.grpcProto)
      return qrlProtoFilePath
    } catch (error) {
      console.log('Unable to load grpc base proto (' + error + ')')
    } finally {
      if (client) {
        closeClient(client)
      }
    }
  })
}

async function loadGrpcProto(protofile, endpoint) {
  const options = {
    keepCase: true,
    longs: String,
    enums: String,
    defaults: true,
    oneofs: true,
    includeDirs: [PROTO_PATH],
  }
  const packageDefinition = await protoLoader.load(protofile, options)
  const grpcObject = grpc.loadPackageDefinition(packageDefinition)
  const grpcObjectString = JSON.stringify(grpcObject.qrl)
  const protoObjectWordArray = CryptoJS.lib.WordArray.create(grpcObjectString)
  const calculatedObjectHash = CryptoJS.SHA256(protoObjectWordArray).toString(CryptoJS.enc.Hex)
  let verified = false
  QRLPROTO_SHA256.forEach((value) => {
    if (value.objectHash) {
      if (value.objectHash === calculatedObjectHash) {
        verified = true
      }
    }
  })
  // If the grpc object shasum matches, establish the grpc connection.
  if (verified) {
    return new grpcObject.qrl.PublicAPI(endpoint, grpc.credentials.createInsecure())
  }
}

async function makeClient(grpcEndpoint) {
  let proto
  try {
    proto = await loadGrpcBaseProto(grpcEndpoint)
    if (proto) {
      const validHash = await checkProtoHash(proto)
      const client = validHash ? await loadGrpcProto(proto, grpcEndpoint) : null
      if (client) {
        return client
      }
      console.log('Proto from ' + grpcEndpoint + ' failed hash verification')
    }
    return null
  } catch (error) {
    console.log('Unable to make client (' + error + ')')
    return null
  } finally {
    if (proto) {
      fs.unlink(proto, () => {})
    }
  }
}

class QrlNode {
  constructor(ipAddress, port) {
    this.version = '0.6.0'
    this.connection = false
    this.client = null
    this.ipAddress = ipAddress
    this.port = port
    this.connecting = null
    this.lastConnectAttempt = 0
  }

  // Replace the client with a newly built one. Closing the old client first releases its connection
  // from grpc-js's shared pool, so the new client re-resolves DNS and opens a fresh connection, which
  // grpc-js won't do by itself for a connection that has silently died. Concurrent callers share the
  // same attempt.
  connect() {
    if (!this.connecting) {
      const endpoint = `${this.ipAddress}:${this.port}`
      this.lastConnectAttempt = Date.now()
      // requests made while the new client is built wait for it (see api) rather than use a bad connection
      this.disconnect()
      this.connecting = makeClient(endpoint)
        .then((client) => {
          this.client = client
          this.connection = client !== null
          console.log((this.connection ? 'Connected to ' : 'ERROR: Unable to connect to ') + endpoint)
          return client
        })
        .finally(() => {
          this.connecting = null
        })
    }
    return this.connecting
  }

  // connect(), unless an attempt is already running or one was made very recently
  reconnect() {
    if (this.connecting || Date.now() - this.lastConnectAttempt < MIN_RECONNECT_INTERVAL_MS) {
      return this.connecting || Promise.resolve(this.client)
    }
    return this.connect()
  }

  disconnect() {
    if (this.client) {
      // in-flight calls are allowed to finish
      closeClient(this.client)
    }
    this.client = null
    this.connection = false
  }

  // Run periodically so a lost connection is noticed and rebuilt even when no requests come in
  healthCheck() {
    if (!this.client) {
      return this.reconnect()
    }
    return this.api('GetNodeState', {}, HEALTH_CHECK_TIMEOUT_MS).catch(() => {})
  }

  // Only qrl service methods may be called; the client object also has methods
  // such as close() that must not be reachable from a URL
  validApi(apiCall, client = this.client) {
    try {
      if (client[apiCall].path.substr(0, 5) === '/qrl.') {
        return true
      }
      return false
    } catch (error) {
      return false
    }
  }

  async api(apiCall, request = {}, timeout = CALL_TIMEOUT_MS) {
    // without a client, wait for a (re)connect attempt rather than failing straight away
    const client = this.client || (await this.reconnect())
    return new Promise((resolve, reject) => {
      if (!client) {
        reject(grpcError(grpc.status.UNAVAILABLE, `Not connected to QRL node ${this.ipAddress}:${this.port}`))
        return
      }
      if (!this.validApi(apiCall, client)) {
        reject(grpcError(grpc.status.UNIMPLEMENTED, `Unknown API call ${apiCall}`))
        return
      }
      client[apiCall](request, { deadline: Date.now() + timeout }, (error, response) => {
        if (error) {
          // ignore failures from a client that has already been replaced
          if (NODE_DOWN_CODES.includes(error.code) && client === this.client) {
            console.log(`${apiCall} to ${this.ipAddress}:${this.port} failed (${error.details}), reconnecting`)
            this.reconnect()
          }
          reject(error)
          return
        }
        resolve(response)
      })
    })
  }
}

module.exports = QrlNode
