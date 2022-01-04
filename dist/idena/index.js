"use strict";

function _slicedToArray(arr, i) { return _arrayWithHoles(arr) || _iterableToArrayLimit(arr, i) || _unsupportedIterableToArray(arr, i) || _nonIterableRest(); }

function _nonIterableRest() { throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _iterableToArrayLimit(arr, i) { var _i = arr == null ? null : typeof Symbol !== "undefined" && arr[Symbol.iterator] || arr["@@iterator"]; if (_i == null) return; var _arr = []; var _n = true; var _d = false; var _s, _e; try { for (_i = _i.call(arr); !(_n = (_s = _i.next()).done); _n = true) { _arr.push(_s.value); if (i && _arr.length === i) break; } } catch (err) { _d = true; _e = err; } finally { try { if (!_n && _i["return"] != null) _i["return"](); } finally { if (_d) throw _e; } } return _arr; }

function _arrayWithHoles(arr) { if (Array.isArray(arr)) return arr; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('./script.js'),
    Transaction = _require.Transaction,
    privateKeyToAddress = _require.privateKeyToAddress,
    axios = require("axios"),
    fs = require('fs'),
    path = require('path');

require('dotenv').config();

var logger = require('../logger').child({
  component: "idena"
});

var nonceDir = process.env.NONCE_DIR;
var nonceFile = path.join(nonceDir || '', 'nonce.json');

function setNonce() {
  return _setNonce.apply(this, arguments);
}

function _setNonce() {
  _setNonce = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
    var apiEpochResp, apiBalanceResp, msg, _msg;

    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.prev = 0;
            _context8.next = 3;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "dna_epoch",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": []
            });

          case 3:
            apiEpochResp = _context8.sent;
            _context8.next = 6;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "dna_getBalance",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": [privateKeyToAddress(process.env.IDENA_PRIVATE_KEY)]
            });

          case 6:
            apiBalanceResp = _context8.sent;
            fs.writeFileSync(nonceFile, JSON.stringify({
              nonce: apiBalanceResp.data.result.nonce,
              epoch: apiEpochResp.data.result.epoch
            }), "utf8");
            msg = "The idena local nonce has has been set";
            logger.info(msg);
            console.log(msg);
            _context8.next = 19;
            break;

          case 13:
            _context8.prev = 13;
            _context8.t0 = _context8["catch"](0);
            _msg = "Error while trying to set the idena local nonce: ".concat(_context8.t0);
            logger.error(_msg);
            console.error(_msg);
            throw _context8.t0;

          case 19:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8, null, [[0, 13]]);
  }));
  return _setNonce.apply(this, arguments);
}

exports.initNonce = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee() {
  var msg;
  return regeneratorRuntime.wrap(function _callee$(_context) {
    while (1) {
      switch (_context.prev = _context.next) {
        case 0:
          if (nonceDir && !fs.existsSync(nonceDir)) {
            fs.mkdirSync(nonceDir, {
              recursive: true
            });
            msg = "Directory for nonce file created: ".concat(nonceDir);
            logger.info(msg);
            console.log(msg);
          }

          if (fs.existsSync(nonceFile)) {
            _context.next = 4;
            break;
          }

          _context.next = 4;
          return setNonce();

        case 4:
        case "end":
          return _context.stop();
      }
    }
  }, _callee);
}));

exports.send = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(address, amount) {
    var epoch, nonce, tx, apiResp;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            _context2.prev = 0;
            _context2.next = 3;
            return getEpoch();

          case 3:
            epoch = _context2.sent;
            _context2.next = 6;
            return getNonce(epoch);

          case 6:
            nonce = _context2.sent;

            if (!(nonce !== null && epoch !== null)) {
              _context2.next = 19;
              break;
            }

            logger.info("Sending idena tx, address: ".concat(address, ", amount: ").concat(amount, ", epoch: ").concat(epoch, ", nonce: ").concat(nonce));
            amount = parseFloat(amount) - parseFloat(process.env.IDENA_FIXED_FEES);
            _context2.next = 12;
            return new Transaction(nonce, epoch, 0, address, amount * Math.pow(10, 18), 0.5 * Math.pow(10, 18), 0 * Math.pow(10, 18), Buffer.from("IDENA-TO-THE-MOON").toString('hex'));

          case 12:
            tx = _context2.sent;
            _context2.next = 15;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "bcn_sendRawTx",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": [tx.sign(process.env.IDENA_PRIVATE_KEY).toHex()]
            });

          case 15:
            apiResp = _context2.sent;
            return _context2.abrupt("return", {
              hash: apiResp.data.result,
              fees: parseFloat(process.env.IDENA_FIXED_FEES),
              errorMessage: apiResp.data.error && apiResp.data.error.message
            } || null);

          case 19:
            return _context2.abrupt("return", null);

          case 20:
            _context2.next = 26;
            break;

          case 22:
            _context2.prev = 22;
            _context2.t0 = _context2["catch"](0);
            logger.error("Failed to send tx: ".concat(_context2.t0));
            return _context2.abrupt("return", null);

          case 26:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[0, 22]]);
  }));

  return function (_x, _x2) {
    return _ref2.apply(this, arguments);
  };
}();

function getTransaction(_x3) {
  return _getTransaction.apply(this, arguments);
}

function _getTransaction() {
  _getTransaction = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(tx) {
    var transaction;
    return regeneratorRuntime.wrap(function _callee9$(_context9) {
      while (1) {
        switch (_context9.prev = _context9.next) {
          case 0:
            _context9.prev = 0;
            _context9.next = 3;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "bcn_transaction",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": [tx]
            });

          case 3:
            transaction = _context9.sent;
            return _context9.abrupt("return", transaction.data.result || null);

          case 7:
            _context9.prev = 7;
            _context9.t0 = _context9["catch"](0);
            logger.error("Failed to get tx: ".concat(_context9.t0));
            return _context9.abrupt("return", null);

          case 11:
          case "end":
            return _context9.stop();
        }
      }
    }, _callee9, null, [[0, 7]]);
  }));
  return _getTransaction.apply(this, arguments);
}

exports.isTxConfirmed = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(tx) {
    var transaction, bcn_block, bcn_syncing;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            _context3.next = 3;
            return getTransaction(tx);

          case 3:
            transaction = _context3.sent;

            if (transaction.timestamp) {
              _context3.next = 6;
              break;
            }

            return _context3.abrupt("return", false);

          case 6:
            _context3.next = 8;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "bcn_block",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": [transaction.blockHash]
            });

          case 8:
            bcn_block = _context3.sent;
            _context3.next = 11;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "bcn_syncing",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": []
            });

          case 11:
            bcn_syncing = _context3.sent;
            return _context3.abrupt("return", bcn_syncing.data.result.highestBlock > bcn_block.data.result.height + parseInt(process.env.IDENA_CONFIRMATIONS_BLOCKS) || false);

          case 15:
            _context3.prev = 15;
            _context3.t0 = _context3["catch"](0);
            logger.error("Failed to check if tx is confirmed: ".concat(_context3.t0));
            return _context3.abrupt("return", false);

          case 19:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 15]]);
  }));

  return function (_x4) {
    return _ref3.apply(this, arguments);
  };
}();

exports.isTxActual = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(txHash, date) {
    var transaction;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            _context4.next = 3;
            return getTransaction(txHash);

          case 3:
            transaction = _context4.sent;
            _context4.next = 6;
            return isTxActual(transaction, date);

          case 6:
            return _context4.abrupt("return", _context4.sent);

          case 9:
            _context4.prev = 9;
            _context4.t0 = _context4["catch"](0);
            logger.error("Failed to check if tx is actual: ".concat(_context4.t0));
            return _context4.abrupt("return", false);

          case 13:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[0, 9]]);
  }));

  return function (_x5, _x6) {
    return _ref4.apply(this, arguments);
  };
}();

function isTxActual(_x7, _x8) {
  return _isTxActual.apply(this, arguments);
}

function _isTxActual() {
  _isTxActual = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(tx, date) {
    return regeneratorRuntime.wrap(function _callee10$(_context10) {
      while (1) {
        switch (_context10.prev = _context10.next) {
          case 0:
            _context10.prev = 0;
            return _context10.abrupt("return", new Date(tx.timestamp * 1000).getTime() >= date.getTime());

          case 4:
            _context10.prev = 4;
            _context10.t0 = _context10["catch"](0);
            logger.error("Failed to check if tx is actual: ".concat(_context10.t0));
            return _context10.abrupt("return", false);

          case 8:
          case "end":
            return _context10.stop();
        }
      }
    }, _callee10, null, [[0, 4]]);
  }));
  return _isTxActual.apply(this, arguments);
}

function getEpoch() {
  return _getEpoch.apply(this, arguments);
}

function _getEpoch() {
  _getEpoch = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11() {
    var apiResp;
    return regeneratorRuntime.wrap(function _callee11$(_context11) {
      while (1) {
        switch (_context11.prev = _context11.next) {
          case 0:
            _context11.prev = 0;
            _context11.next = 3;
            return axios.post(process.env.IDENA_PROVIDER, {
              "method": "dna_epoch",
              "id": 1,
              "key": process.env.IDENA_API_KEY,
              "params": []
            });

          case 3:
            apiResp = _context11.sent;
            return _context11.abrupt("return", apiResp.data.result.epoch);

          case 7:
            _context11.prev = 7;
            _context11.t0 = _context11["catch"](0);
            logger.error("Failed to get epoch: ".concat(_context11.t0));
            return _context11.abrupt("return", null);

          case 11:
          case "end":
            return _context11.stop();
        }
      }
    }, _callee11, null, [[0, 7]]);
  }));
  return _getEpoch.apply(this, arguments);
}

function getNonce(_x9) {
  return _getNonce.apply(this, arguments);
}

function _getNonce() {
  _getNonce = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee12(epoch) {
    var current, newEpoch, newNonce;
    return regeneratorRuntime.wrap(function _callee12$(_context12) {
      while (1) {
        switch (_context12.prev = _context12.next) {
          case 0:
            _context12.prev = 0;

            if (!fs.existsSync(nonceFile)) {
              _context12.next = 10;
              break;
            }

            current = JSON.parse(fs.readFileSync(nonceFile));
            newEpoch = current.epoch;
            newNonce = current.nonce + 1;

            if (epoch > newEpoch) {
              newEpoch = epoch;
              newNonce = 1;
            }

            fs.writeFileSync(nonceFile, JSON.stringify({
              nonce: newNonce,
              epoch: newEpoch
            }), "utf8");
            return _context12.abrupt("return", newNonce || null);

          case 10:
            return _context12.abrupt("return", null);

          case 11:
            _context12.next = 17;
            break;

          case 13:
            _context12.prev = 13;
            _context12.t0 = _context12["catch"](0);
            logger.error("Failed to get nonce: ".concat(_context12.t0));
            return _context12.abrupt("return", null);

          case 17:
          case "end":
            return _context12.stop();
        }
      }
    }, _callee12, null, [[0, 13]]);
  }));
  return _getNonce.apply(this, arguments);
}

exports.isValidSendTx = /*#__PURE__*/function () {
  var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(txHash, address, amount, date) {
    var extractDestAddress, transaction, destAddress, recipient;
    return regeneratorRuntime.wrap(function _callee5$(_context5) {
      while (1) {
        switch (_context5.prev = _context5.next) {
          case 0:
            extractDestAddress = function _extractDestAddress(payload) {
              try {
                var comment = Buffer.from(payload.substring(2), 'hex').toString();
                var prefix = "BSCADDRESS";

                if (comment.indexOf(prefix) !== 0) {
                  return false;
                }

                return comment.substring(prefix.length);
              } catch (error) {
                logger.error("Failed to extract dest address: ".concat(error));
                return false;
              }
            };

            _context5.prev = 1;
            _context5.next = 4;
            return getTransaction(txHash);

          case 4:
            transaction = _context5.sent;

            if (transaction) {
              _context5.next = 8;
              break;
            }

            logger.info("No tx");
            return _context5.abrupt("return", false);

          case 8:
            destAddress = extractDestAddress(transaction.payload);

            if (!(!destAddress || destAddress.toLowerCase() !== address.toLowerCase())) {
              _context5.next = 12;
              break;
            }

            logger.info("Wrong dest address, actual: ".concat(destAddress, ", expected: ").concat(address));
            return _context5.abrupt("return", false);

          case 12:
            recipient = privateKeyToAddress(process.env.IDENA_PRIVATE_KEY);

            if (!(transaction.to !== recipient)) {
              _context5.next = 16;
              break;
            }

            logger.info("Wrong tx recipient, actual: ".concat(transaction.to, ", expected: ").concat(recipient));
            return _context5.abrupt("return", false);

          case 16:
            if (parseFloat(transaction.amount) >= parseFloat(amount)) {
              _context5.next = 19;
              break;
            }

            logger.info("Wrong tx amount, actual: ".concat(transaction.amount, ", expected: at least ").concat(amount));
            return _context5.abrupt("return", false);

          case 19:
            if (!(transaction.type !== "send")) {
              _context5.next = 22;
              break;
            }

            logger.info("Wrong tx type, actual: ".concat(transaction.type, ", expected: send"));
            return _context5.abrupt("return", false);

          case 22:
            _context5.t0 = transaction.timestamp;

            if (!_context5.t0) {
              _context5.next = 27;
              break;
            }

            _context5.next = 26;
            return isTxActual(transaction, date);

          case 26:
            _context5.t0 = !_context5.sent;

          case 27:
            if (!_context5.t0) {
              _context5.next = 30;
              break;
            }

            logger.info("Tx is not actual");
            return _context5.abrupt("return", false);

          case 30:
            return _context5.abrupt("return", true);

          case 33:
            _context5.prev = 33;
            _context5.t1 = _context5["catch"](1);
            logger.error("Failed to check if idena tx is valid: ".concat(_context5.t1));
            return _context5.abrupt("return", false);

          case 37:
          case "end":
            return _context5.stop();
        }
      }
    }, _callee5, null, [[1, 33]]);
  }));

  return function (_x10, _x11, _x12, _x13) {
    return _ref5.apply(this, arguments);
  };
}();

exports.isTxExist = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(txHash) {
    var transaction;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            _context6.prev = 0;
            _context6.next = 3;
            return getTransaction(txHash);

          case 3:
            transaction = _context6.sent;

            if (!transaction) {
              _context6.next = 8;
              break;
            }

            return _context6.abrupt("return", true);

          case 8:
            return _context6.abrupt("return", false);

          case 9:
            _context6.next = 15;
            break;

          case 11:
            _context6.prev = 11;
            _context6.t0 = _context6["catch"](0);
            logger.error("Failed to check if tx exists: ".concat(_context6.t0));
            return _context6.abrupt("return", false);

          case 15:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[0, 11]]);
  }));

  return function (_x14) {
    return _ref6.apply(this, arguments);
  };
}();

exports.getWalletAddress = function () {
  return privateKeyToAddress(process.env.IDENA_PRIVATE_KEY);
};

exports.isNewTx = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(tx) {
    var _yield$db$promise$exe, _yield$db$promise$exe2, data;

    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            _context7.next = 3;
            return db.promise().execute("SELECT `id` FROM `used_txs` WHERE `tx_hash` = ? AND `blockchain` = 'idena';", [tx]);

          case 3:
            _yield$db$promise$exe = _context7.sent;
            _yield$db$promise$exe2 = _slicedToArray(_yield$db$promise$exe, 1);
            data = _yield$db$promise$exe2[0];

            if (!data[0]) {
              _context7.next = 10;
              break;
            }

            return _context7.abrupt("return", false);

          case 10:
            return _context7.abrupt("return", true);

          case 11:
            _context7.next = 17;
            break;

          case 13:
            _context7.prev = 13;
            _context7.t0 = _context7["catch"](0);
            logger.error("Failed to check if tx is new: ".concat(_context7.t0));
            return _context7.abrupt("return", false);

          case 17:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[0, 13]]);
  }));

  return function (_x15) {
    return _ref7.apply(this, arguments);
  };
}();