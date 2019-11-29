const express = require('express');
const redis = require('redis');
const http = require('http');
const bodyParser = require('body-parser');
const api = require('./api');
var winston = require('winston');
var expressWinston = require('express-winston');

/**
 * Connect to the redis server using default connection parametrs from environment variables
 */
function connectToRedis() {
  // get hostname of the redis server, which defaults to localhost which is fine for Openshift deployments
  // where all contains will run within the same pod
  const REDIS_SERVER = process.env.REDIS_SERVER || 'localhost';
  const REDIS_PORT = process.env.REDIS_PORT || 6379;

  // create redis redisClient and connect to the redis server
  const redisClientOptions = { host: REDIS_SERVER, port: REDIS_PORT };
  if (process.env.REDIS_PASSWORD) {
    redisClientOptions.password = process.env.REDIS_PASSWORD;
  }

  // connect to redis server
  const client = redis.createClient(redisClientOptions);

  // setup an error method so that we see connection failures immediately when the driver detects them and not only
  // when a method fails.
  client.on('error', function(err) {
    console.log(err);
  });

  return client;
}

/**
 * Sets the initial vote count to 0, if not present
 */
function initRedis(redisClient) {
  redisClient.get(process.env.VOTE_VALUE_1, function(err, reply) {
    if (!reply) {
      redisClient.set(process.env.VOTE_VALUE_1, 0);
    }
  });

  redisClient.get(process.env.VOTE_VALUE_2, function(err, reply) {
    if (!reply) {
      redisClient.set(process.env.VOTE_VALUE_2, 0);
    }
  });
}

function start(options) {
  var redisClient = (options && options.client) || connectToRedis();
  initRedis(redisClient);

  var app = express();

  app.use(bodyParser.urlencoded({ extended: true }));

  // Enable winston logging for requests and responses
  app.use(
    expressWinston.logger({
      transports: [new winston.transports.Console()],
      format: winston.format.json()
    })
  );

  // Enable logging of the body
  expressWinston.requestWhitelist.push('body');
  expressWinston.responseWhitelist.push('body');

  api.register(app, redisClient);

  app.use(express.static(__dirname + '/public'));

  return startServer(app);
}

/** startup the server on the default port or environment variable */
function startServer(app) {
  const serverPort = process.env.SERVER_PORT || 8080;
  const serverTimeout = parseInt(process.env.SERVER_TIMEOUT) || 10000;

  var httpServer = http.createServer(app);
  httpServer.listen(serverPort);
  httpServer.setTimeout(serverTimeout, null);

  console.log('Express started on port ' + serverPort);

  return httpServer;
}

function stop(httpServer) {
  httpServer.close();
}

module.exports.start = start;
