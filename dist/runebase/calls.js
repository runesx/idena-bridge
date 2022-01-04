"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.waitRunebaseNodeSync = exports.startRunebaseEnv = exports.sendToAddress = exports.listUnspentForAddress = exports.listUnspent = exports.listTransactions = exports.isRunebaseConnected = exports.isRunebaseAddress = exports.getNewAddress = void 0;

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('./rclient'),
    getInstance = _require.getInstance;

var _require2 = require('./rclientConfig'),
    setRunebaseEnv = _require2.setRunebaseEnv;

var startRunebaseEnv = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            _context.next = 2;
            return setRunebaseEnv('Mainnet', process.env.RUNEBASE_ENV_PATH);

          case 2:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));

  return function startRunebaseEnv() {
    return _ref.apply(this, arguments);
  };
}();

exports.startRunebaseEnv = startRunebaseEnv;

var isRunebaseConnected = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2() {
    var blockchainInfo;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.next = 2;
            return getInstance().getBlockchainInfo();

          case 2:
            blockchainInfo = _context2.sent;
            return _context2.abrupt("return", blockchainInfo);

          case 4:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));

  return function isRunebaseConnected() {
    return _ref2.apply(this, arguments);
  };
}();

exports.isRunebaseConnected = isRunebaseConnected;

var listUnspentForAddress = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3() {
    var blockchainInfo;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.next = 2;
            return getInstance().listUnspent();

          case 2:
            blockchainInfo = _context3.sent;
            return _context3.abrupt("return", blockchainInfo);

          case 4:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function listUnspentForAddress() {
    return _ref3.apply(this, arguments);
  };
}();

exports.listUnspentForAddress = listUnspentForAddress;

var listUnspent = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4() {
    var unspent;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return getInstance().listUnspent();

          case 2:
            unspent = _context4.sent;
            return _context4.abrupt("return", unspent);

          case 4:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));

  return function listUnspent() {
    return _ref4.apply(this, arguments);
  };
}();

exports.listUnspent = listUnspent;

var sendToAddress = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(address, amount) {
    var comment,
        commentTo,
        subtractFeeFromAmount,
        unspent,
        _args5 = arguments;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            comment = _args5.length > 2 && _args5[2] !== undefined ? _args5[2] : '';
            commentTo = _args5.length > 3 && _args5[3] !== undefined ? _args5[3] : '';
            subtractFeeFromAmount = _args5.length > 4 && _args5[4] !== undefined ? _args5[4] : false;
            console.log('senttoaddress;');
            console.log(address);
            console.log(amount);
            _context5.next = 8;
            return getInstance().sendToAddress(address, amount, comment, commentTo, subtractFeeFromAmount);

          case 8:
            unspent = _context5.sent;
            console.log(unspent);
            return _context5.abrupt("return", unspent);

          case 11:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5);
  }));

  return function sendToAddress(_x, _x2) {
    return _ref5.apply(this, arguments);
  };
}();

exports.sendToAddress = sendToAddress;

var delay = function delay(ms) {
  return new Promise(function (res) {
    return setTimeout(res, ms);
  });
}; // 1. Create a new function that returns a promise


var waitRunebaseNodeSync = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7() {
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            return _context7.abrupt("return", new Promise( /*#__PURE__*/function () {
              var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(resolve, reject) {
                var result, blockchainInfo;
                return regeneratorRuntime.wrap(function _callee6$(_context6) {
                  while (1) {
                    switch (_context6.prev = _context6.next) {
                      case 0:
                        result = null;

                      case 1:
                        if (!(result >= 0.999)) {
                          _context6.next = 11;
                          break;
                        }

                        _context6.next = 4;
                        return getInstance().getBlockchainInfo();

                      case 4:
                        blockchainInfo = _context6.sent;
                        result = blockchainInfo.verificationprogress;
                        console.log("Node Sync value: ".concat(result));
                        _context6.next = 9;
                        return delay(3000);

                      case 9:
                        _context6.next = 1;
                        break;

                      case 11:
                        console.log('Runebase Node Fully Synced');
                        resolve(true);

                      case 13:
                      case "end":
                        return _context6.stop();
                    }
                  }
                }, _callee6);
              }));

              return function (_x3, _x4) {
                return _ref7.apply(this, arguments);
              };
            }()));

          case 1:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7);
  }));

  return function waitRunebaseNodeSync() {
    return _ref6.apply(this, arguments);
  };
}();

exports.waitRunebaseNodeSync = waitRunebaseNodeSync;

var listTransactions = /*#__PURE__*/function () {
  var _ref8 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(number) {
    var transactions;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return getInstance().listTransactions(number);

          case 2:
            transactions = _context8.sent;
            return _context8.abrupt("return", transactions);

          case 4:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));

  return function listTransactions(_x5) {
    return _ref8.apply(this, arguments);
  };
}();

exports.listTransactions = listTransactions;

var isRunebaseAddress = /*#__PURE__*/function () {
  var _ref9 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(address) {
    var addressX;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            console.log('address');
            console.log(address);
            _context9.prev = 2;
            _context9.next = 5;
            return getInstance().isRunebaseAddress(address);

          case 5:
            addressX = _context9.sent;
            return _context9.abrupt("return", addressX);

          case 9:
            _context9.prev = 9;
            _context9.t0 = _context9["catch"](2);
            console.log(_context9.t0);

          case 12:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[2, 9]]);
  }));

  return function isRunebaseAddress(_x6) {
    return _ref9.apply(this, arguments);
  };
}();

exports.isRunebaseAddress = isRunebaseAddress;

var getNewAddress = /*#__PURE__*/function () {
  var _ref10 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10() {
    var address;
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.next = 2;
            return getInstance().getNewAddress();

          case 2:
            address = _context10.sent;
            return _context10.abrupt("return", address);

          case 4:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10);
  }));

  return function getNewAddress() {
    return _ref10.apply(this, arguments);
  };
}();

exports.getNewAddress = getNewAddress;