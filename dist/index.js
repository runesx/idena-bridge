"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var express = require('express');

var app = express(); // const mysql = require('mysql2');

var cors = require('cors');

var bodyParser = require('body-parser');

var _require = require("@ethersproject/units"),
    formatUnits = _require.formatUnits,
    parseUnits = _require.parseUnits;

var _require2 = require("http"),
    createServer = _require2.createServer;

var io = require('socket.io'); // const idena = require('./idena');


var router = require('./routes');

var _require3 = require('./runebase/calls'),
    startRunebaseEnv = _require3.startRunebaseEnv,
    waitRunebaseNodeSync = _require3.waitRunebaseNodeSync;

var _require4 = require('./runebase/consolidate'),
    consolidate = _require4.consolidate;

app.use(cors());
app.use(bodyParser.json());
var httpServer = createServer(app);
var ioSocket = io(httpServer, {
  path: '/socket.io'
});
var sockets = {};
ioSocket.on("connection", /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(socket) {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            if (socket.handshake.query.customId) {
              sockets[socket.handshake.query.customId] = socket;
            }

            socket.on("disconnect", function () {
              delete sockets[socket.handshake.query.customId];
              console.log("Client disconnected");
            });

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function (_x) {
    return _ref.apply(this, arguments);
  };
}());
router(app, ioSocket);

var _require5 = require('./helpers/syncTransactions'),
    patchRunebaseTransactions = _require5.patchRunebaseTransactions,
    checkSwaps = _require5.checkSwaps;

function loopRunebaseTransactions() {
  return _loopRunebaseTransactions.apply(this, arguments);
}

function _loopRunebaseTransactions() {
  _loopRunebaseTransactions = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return patchRunebaseTransactions(ioSocket, sockets);

          case 2:
            setTimeout(loopRunebaseTransactions, parseInt(process.env.CHECKING_DELAY, 10));

          case 3:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _loopRunebaseTransactions.apply(this, arguments);
}

function consolidateRunebase() {
  return _consolidateRunebase.apply(this, arguments);
}

function _consolidateRunebase() {
  _consolidateRunebase = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var consolidateNow;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return consolidate();

          case 2:
            consolidateNow = _context3.sent;

          case 3:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));
  return _consolidateRunebase.apply(this, arguments);
}

function loopConsolidateRunebase() {
  return _loopConsolidateRunebase.apply(this, arguments);
}

function _loopConsolidateRunebase() {
  _loopConsolidateRunebase = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return consolidateRunebase();

          case 2:
            setTimeout(loopConsolidateRunebase, parseInt(process.env.CHECKING_DELAY, 10));

          case 3:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _loopConsolidateRunebase.apply(this, arguments);
}

function loopCheckSwaps() {
  return _loopCheckSwaps.apply(this, arguments);
}

function _loopCheckSwaps() {
  _loopCheckSwaps = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            _context5.next = 2;
            return checkSwaps(ioSocket, sockets);

          case 2:
            setTimeout(loopCheckSwaps, parseInt(process.env.CHECKING_DELAY, 10));

          case 3:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));
  return _loopCheckSwaps.apply(this, arguments);
}

function start() {
  return _start.apply(this, arguments);
}

function _start() {
  _start = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6() {
    var port;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.next = 2;
            return startRunebaseEnv();

          case 2:
            _context6.next = 4;
            return waitRunebaseNodeSync();

          case 4:
            loopCheckSwaps();
            loopRunebaseTransactions();
            loopConsolidateRunebase();
            port = 8005;
            httpServer.listen(port, function () {
              return console.log("Server started, listening on port: ".concat(port));
            });

          case 9:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6);
  }));
  return _start.apply(this, arguments);
}

start();