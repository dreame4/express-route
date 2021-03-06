'use strict';

var express = require('express'),
    http    = require('http'),
    app     = express(),
    route   = require('../index');

var routesConfPath = __dirname + '/routesConfMock.js',
    routesConfDir  = __dirname + '/routes';

var user = { authorized: true };

route(app, routesConfPath, {
  sync: true,
  ensureRestriction: function (req, res, next) {
    if (!user.authorized) {
      res.status(403).end('Forbidden');
      return;
    }
    next();
  }
});

route(app, routesConfDir, {
  sync: true,
  ensureRestriction: function (req, res, next) {
    if (!user.authorized) {
      res.status(403).end('Forbidden');
      return;
    }
    next();
  }
});

app.get('*', function (req, res) {
  console.log('routes cannot handle', req.path);
  res.end();
});

app.listen(3456);
console.log('Start listening on port', 3456);

// Run Test

var assert = require("assert");

describe('route', function () {
  describe('test suite', function () {
    it('should handle simple request and response', function (done) {
      http.request({
        port: 3456,
        path: '/',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'index');
          done();
        });
      }).end();
    });
  });

  describe('route library', function () {
    it('should return status 403 if user is not authorized', function (done) {
      user.authorized = false;

      http.request({
        port: 3456,
        path: '/user',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 403);
          assert.equal(chunk, 'Forbidden');
          done();
        });
      }).end();
    });

    it('should return status 200 if user is authorized', function (done) {
      user.authorized = true;

      http.request({
        port: 3456,
        path: '/user',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'user');
          done();
        });
      }).end();
    });

    it('one route declaration should handle many HTTP methods', function (done) {
      var dones = 3;

      user.authorized = true;

      http.request({
        port: 3456,
        path: '/user/posts/1',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'method ' + 'GET' + ' post #' + 1);
          if (!--dones) {
            done();
          }
        });
      }).end();

      http.request({
        port: 3456,
        path: '/user/posts/1',
        method: 'POST'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'method ' + 'POST' + ' post #' + 1);
          if (!--dones) {
            done();
          }
        });
      }).end();

      http.request({
        port: 3456,
        path: '/user/posts/1',
        method: 'DELETE'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'method ' + 'DELETE' + ' post #' + 1);
          if (!--dones) {
            done();
          }
        });
      }).end();
    });

    it('should handle an array with the route definitions', function(done) {
      var dones = 2;

      http.request({
        port: 3456,
        path: '/user/categories',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'method GET');
          if (!--dones) {
            done();
          }
        });
      }).end();

      http.request({
        port: 3456,
        path: '/user/categories',
        method: 'POST'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, 'method POST');
          if (!--dones) {
            done();
          }
        });
      }).end();
    });

    it('appling routes from directory', function(done) {
      http.request({
        port: 3456,
        path: '/dir/home',
        method: 'GET'
      }, function (res) {
        res.setEncoding('utf8');
        res.on('data', function (chunk) {
          assert.equal(res.statusCode, 200);
          assert.equal(chunk, '/dir/home');
          done();
        });
      }).end();
    });

    // @TODO: needs more extensive tests
    it('router should emit loaded event', function(done) {
      // Loading routes from a directory with one file
      var router = route(app, routesConfDir, {
        sync: false,
        ensureRestriction: function (req, res, next) {
          if (!user.authorized) {
            res.status(403).end('Forbidden');
            return;
          }
          next();
        }
      });

      router.on('loaded', function() {
        done();
      });
    });
  });
});
