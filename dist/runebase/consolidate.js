#!/usr/bin/env node
"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.consolidate = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

require('dotenv').config();

var Client = require("bitcoin-core");

var _require = require("./cutxo"),
    construct = _require.construct,
    broadcast = _require.broadcast;

var consolidate = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    var client, tx, txid;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            client = new Client({
              port: 9432,
              username: process.env.RPC_USER,
              password: process.env.RPC_PASS
            });
            _context.prev = 1;
            _context.next = 4;
            return client.ping();

          case 4:
            _context.next = 10;
            break;

          case 6:
            _context.prev = 6;
            _context.t0 = _context["catch"](1);
            console.log('Unable to ping node');
            return _context.abrupt("return");

          case 10:
            _context.prev = 10;
            _context.next = 13;
            return construct({
              client: client,
              maximumAmount: 1000,
              limit: 50,
              feeRate: 1000
            });

          case 13:
            tx = _context.sent;
            _context.next = 21;
            break;

          case 16:
            _context.prev = 16;
            _context.t1 = _context["catch"](10);
            console.error("Constructing transaction error");
            console.error(_context.t1.toString());
            return _context.abrupt("return");

          case 21:
            if (!tx) {
              _context.next = 38;
              break;
            }

            console.log("Number of inputs:", tx.inputsUsed);
            console.log("Inputs total amount:", tx.amountInput);
            console.log("Output amount:", tx.amountOutput);
            console.log("Fee:", tx.fee);
            console.log("Output address:", tx.address);
            _context.prev = 27;
            _context.next = 30;
            return broadcast({
              client: client,
              hex: tx.hex
            });

          case 30:
            txid = _context.sent;
            console.info(txid);
            _context.next = 38;
            break;

          case 34:
            _context.prev = 34;
            _context.t2 = _context["catch"](27);
            console.error("Broadcasting transaction error");
            console.error(_context.t2.toString());

          case 38:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[1, 6], [10, 16], [27, 34]]);
  }));

  return function consolidate() {
    return _ref.apply(this, arguments);
  };
}();

exports.consolidate = consolidate;