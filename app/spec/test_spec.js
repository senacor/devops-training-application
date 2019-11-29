const redis = require('redis-mock');
const server = require('../index.js');
const request = require('request');

var base_url = 'http://localhost:8080';

describe('test application', function() {
  /**
   * Initialize by starting the service and filling some data
   */
  beforeAll(function() {
    var client = redis.createClient();

    client.set('DOGS', 10);
    client.set('CATS', 11);

    var options = { client: client };

    server.start(options);
  });

  it('GET / returns status code 200', function(done) {
    request.get(base_url + '/', function(error, response, body) {
      expect(response.statusCode).toBe(200);
      done();
    });
  });

  it('GET /vote returns vote count', function(done) {
    request.get(base_url + '/vote', function(error, response, body) {
      expect(response.statusCode).toBe(200);
      expect(body).not.toBeUndefined();
      body = JSON.parse(body);
      expect(body.CATS).toEqual('11');
      done();
    });
  });

  it('POST /vote increments vote count', function(done) {
    var options = {
      url: base_url + '/vote',
      body: 'vote=DOGS',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded'
      }
    };

    request.get(base_url + '/vote', function(error, response, body) {
      expect(response.statusCode).toBe(200);
      body = JSON.parse(body);
      var old_dog_votes = parseInt(body.DOGS);

      request.post(options, function(error, response, body) {
        body = JSON.parse(body);
        var new_dog_votes = parseInt(body.DOGS);
        expect(old_dog_votes + 1).toEqual(new_dog_votes);
        done();
      });
    });
  });
});
