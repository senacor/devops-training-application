function register(app, client) {
  app.post('/vote', (request, response) => castVote(client, request, response));
  app.get('/vote', (request, response) => getVotes(client, request, response));
}

/**
 * Increments the counter for the casted votes and returns the current vote count.
 */
function castVote(redisClient, request, response) {
  redisClient.incr(request.body.vote, function(err, reply) {
    if (err) {
      console.log(err);
    } else {
      getVotes(redisClient, request, response);
    }
  });
}

/**
 * Retrieves the current vote count from redis and returns it.
 */
function getVotes(redisClient, request, response) {
  redisClient.mget([process.env.VOTE_VALUE_1, process.env.VOTE_VALUE_2], function(err, reply) {
    if (err) {
      console.log(err);
    } else {
      var result = {};
      result[process.env.VOTE_VALUE_1] = reply[0];
      result[process.env.VOTE_VALUE_2] = reply[1];
      response.send(result);
    }
  });
}

module.exports.register = register;
