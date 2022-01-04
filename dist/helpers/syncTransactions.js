"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports.checkSwaps = checkSwaps;
exports.patchRunebaseTransactions = patchRunebaseTransactions;

function _createForOfIteratorHelper(o, allowArrayLike) { var it = typeof Symbol !== "undefined" && o[Symbol.iterator] || o["@@iterator"]; if (!it) { if (Array.isArray(o) || (it = _unsupportedIterableToArray(o)) || allowArrayLike && o && typeof o.length === "number") { if (it) o = it; var i = 0; var F = function F() {}; return { s: F, n: function n() { if (i >= o.length) return { done: true }; return { done: false, value: o[i++] }; }, e: function e(_e) { throw _e; }, f: F }; } throw new TypeError("Invalid attempt to iterate non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); } var normalCompletion = true, didErr = false, err; return { s: function s() { it = it.call(o); }, n: function n() { var step = it.next(); normalCompletion = step.done; return step; }, e: function e(_e2) { didErr = true; err = _e2; }, f: function f() { try { if (!normalCompletion && it["return"] != null) it["return"](); } finally { if (didErr) throw err; } } }; }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

/* eslint-disable no-restricted-syntax */

/* eslint-disable no-await-in-loop */
var BigNumber = require('bignumber.js');

var moment = require('moment');

var _require = require('sequelize'),
    Sequelize = _require.Sequelize,
    Transaction = _require.Transaction,
    Op = _require.Op;

var db = require('../models');

var bsc = require('../bsc');

var logger = require('../logger').child({
  component: "processing"
});

var _require2 = require('../runebase/calls'),
    listTransactions = _require2.listTransactions,
    sendToAddress = _require2.sendToAddress;

function handleBscToRunebaseSwap(_x, _x2, _x3) {
  return _handleBscToRunebaseSwap.apply(this, arguments);
}

function _handleBscToRunebaseSwap() {
  _handleBscToRunebaseSwap = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(swap, logger, sockets) {
    var parsedAmount, sendAmount, hash, updateswap, finalizeTransaction, updatedBridge, updatedTransactions;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            parsedAmount = Number(new BigNumber(swap.amount).div(1e8).times(1e18));
            sendAmount = Number(new BigNumber(swap.amount).div(1e8));
            console.log(parsedAmount);
            _context.next = 5;
            return bsc.isValidBurnTx(swap.transactions[0].bsc_tx, swap.depositAddress, parsedAmount, swap.time, swap.chainId);

          case 5:
            if (_context.sent) {
              _context.next = 12;
              break;
            }

            // not valid
            logger.info("BSC tx is invalid");
            console.log("BSC tx is invalid");
            _context.next = 10;
            return swap.update({
              status: 'Fail',
              mined: 2,
              fail_reason: 'Not Valid'
            });

          case 10:
            _context.next = 12;
            return swap.transaction[0].update({
              minted: true,
              fail_reason: 'Not Valid'
            });

          case 12:
            console.log('handleBscToRunebaseSwap 1');
            _context.next = 15;
            return bsc.isNewTx(swap.transactions[0].bsc_tx);

          case 15:
            if (_context.sent) {
              _context.next = 22;
              break;
            }

            // not new
            logger.info("BSC tx already used");
            console.log("BSC tx already used");
            _context.next = 20;
            return swap.update({
              status: 'Fail',
              mined: 2,
              fail_reason: 'Not Valid'
            });

          case 20:
            _context.next = 22;
            return swap.transaction[0].update({
              minted: true,
              fail_reason: 'Not Valid'
            });

          case 22:
            _context.next = 24;
            return bsc.isTxConfirmed(swap.transactions[0].bsc_tx, swap.chainId);

          case 24:
            if (_context.sent) {
              _context.next = 27;
              break;
            }

            console.log('faiil');
            return _context.abrupt("return");

          case 27:
            _context.next = 29;
            return sendToAddress(swap.address, sendAmount);

          case 29:
            hash = _context.sent;
            console.log(hash);

            if (hash) {
              _context.next = 38;
              break;
            }

            // const reason = errorMessage ? errorMessage : 'Unknown';
            // logger.error(`Unable to send idena tx: ${reason}`);
            console.log("Unable to send runebase tx");
            _context.next = 35;
            return swap.update({
              status: 'Fail',
              mined: 1,
              fail_reason: 'Unknown'
            });

          case 35:
            _context.next = 37;
            return swap.transaction[0].update({
              minted: true,
              fail_reason: 'Unknown'
            });

          case 37:
            return _context.abrupt("return");

          case 38:
            logger.info("Swap completed, runebase tx hash: ".concat(hash));
            console.log("Swap completed, runebase tx hash: ".concat(hash));
            _context.next = 42;
            return swap.update({
              status: 'Success',
              mined: 1
            });

          case 42:
            updateswap = _context.sent;
            _context.next = 45;
            return swap.transaction[0].update({
              minted: true,
              runebase_tx: hash
            });

          case 45:
            finalizeTransaction = _context.sent;
            _context.next = 48;
            return db.bridges.findOne({
              where: {
                id: swap.id
              }
            });

          case 48:
            updatedBridge = _context.sent;
            _context.next = 51;
            return db.transactions.findAll({
              order: [['id', 'DESC']],
              include: [{
                where: {
                  id: swap.id
                },
                model: db.bridges,
                as: 'bridge',
                required: true
              }]
            });

          case 51:
            updatedTransactions = _context.sent;
            console.log('emit2');

            if (sockets[updatedBridge.uuid]) {
              sockets[updatedBridge.uuid].emit('updateBridge', {
                bridge: updatedBridge,
                transactions: updatedTransactions
              });
            } // console.log(finalizeTransaction);


          case 54:
          case "end":
            return _context.stop();
        }
      }
    }, _callee);
  }));
  return _handleBscToRunebaseSwap.apply(this, arguments);
}

function handleSwap(_x4, _x5, _x6) {
  return _handleSwap.apply(this, arguments);
}

function _handleSwap() {
  _handleSwap = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(swap, logger, sockets) {
    var date;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            date = new Date(swap.time);
            date.setDate(date.getDate() + 1);

            if (!(swap.type === 1 && swap.transactions[0].bsc_tx && moment(date).unix() > moment(Date.now()).unix())) {
              _context2.next = 6;
              break;
            }

            _context2.next = 5;
            return handleBscToRunebaseSwap(swap, logger, sockets);

          case 5:
            return _context2.abrupt("return");

          case 6:
            if (!(date < Date.now())) {
              _context2.next = 12;
              break;
            }

            logger.info("Swap is outdated");
            _context2.next = 10;
            return swap.update({
              mined: 2,
              status: 'Fail',
              fail_reason: 'Time'
            });

          case 10:
            _context2.next = 12;
            return swap.transactions[0].update({
              minted: true,
              fail_reason: 'Time'
            });

          case 12:
            logger.trace("Swap skipped");

          case 13:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _handleSwap.apply(this, arguments);
}

function checkSwaps(_x7, _x8) {
  return _checkSwaps.apply(this, arguments);
}

function _checkSwaps() {
  _checkSwaps = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(io, sockets) {
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.next = 2;
            return db.sequelize.transaction({
              isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
            }, /*#__PURE__*/function () {
              var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(t) {
                var pending, _iterator, _step, swap, swapLogger;

                return regeneratorRuntime.wrap(function _callee3$(_context3) {
                  while (1) {
                    switch (_context3.prev = _context3.next) {
                      case 0:
                        _context3.next = 2;
                        return db.bridges.findAll({
                          where: {
                            status: 'pending',
                            type: 1
                          },
                          include: [{
                            model: db.transactions,
                            as: 'transactions'
                          }]
                        });

                      case 2:
                        pending = _context3.sent;

                        if (pending.length) {
                          _context3.next = 5;
                          break;
                        }

                        return _context3.abrupt("return");

                      case 5:
                        _iterator = _createForOfIteratorHelper(pending);
                        _context3.prev = 6;

                        _iterator.s();

                      case 8:
                        if ((_step = _iterator.n()).done) {
                          _context3.next = 21;
                          break;
                        }

                        swap = _step.value;
                        swapLogger = logger.child({
                          swapId: swap.uuid
                        });
                        _context3.prev = 11;
                        _context3.next = 14;
                        return handleSwap(swap, swapLogger, sockets);

                      case 14:
                        _context3.next = 19;
                        break;

                      case 16:
                        _context3.prev = 16;
                        _context3.t0 = _context3["catch"](11);
                        swapLogger.error("Failed to handle swap: ".concat(_context3.t0));

                      case 19:
                        _context3.next = 8;
                        break;

                      case 21:
                        _context3.next = 26;
                        break;

                      case 23:
                        _context3.prev = 23;
                        _context3.t1 = _context3["catch"](6);

                        _iterator.e(_context3.t1);

                      case 26:
                        _context3.prev = 26;

                        _iterator.f();

                        return _context3.finish(26);

                      case 29:
                        t.afterCommit(function () {// next();
                        });

                      case 30:
                      case "end":
                        return _context3.stop();
                    }
                  }
                }, _callee3, null, [[6, 23, 26, 29], [11, 16]]);
              }));

              return function (_x11) {
                return _ref.apply(this, arguments);
              };
            }())["catch"](function (err) {
              console.log(err.message);
              logger.error("Failed to load pending swaps: ".concat(err.message));
            });

          case 2:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4);
  }));
  return _checkSwaps.apply(this, arguments);
}

function patchRunebaseTransactions(_x9, _x10) {
  return _patchRunebaseTransactions.apply(this, arguments);
}

function _patchRunebaseTransactions() {
  _patchRunebaseTransactions = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(io, sockets) {
    var transactions, _iterator2, _step2, _loop;

    return regeneratorRuntime.wrap(function _callee7$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return listTransactions(100);

          case 2:
            transactions = _context8.sent;

            if (!transactions) {
              _context8.next = 20;
              break;
            }

            // eslint-disable-next-line no-restricted-syntax
            _iterator2 = _createForOfIteratorHelper(transactions);
            _context8.prev = 5;
            _loop = /*#__PURE__*/regeneratorRuntime.mark(function _loop() {
              var transaction, bridge, dbTransaction, amounte, newTransaction, updatedBridge, updatedTransactions, _yield$bsc$mint, hash, fees, updateTransaction, _updatedBridge, _updatedTransactions, _updatedBridge2, _updatedTransactions2;

              return regeneratorRuntime.wrap(function _loop$(_context7) {
                while (1) {
                  switch (_context7.prev = _context7.next) {
                    case 0:
                      transaction = _step2.value;

                      if (!(transaction.category === "receive")) {
                        _context7.next = 70;
                        break;
                      }

                      if (!transaction.address) {
                        _context7.next = 70;
                        break;
                      }

                      _context7.next = 5;
                      return db.bridges.findOne({
                        where: {
                          depositAddress: transaction.address,
                          status: 'pending'
                        }
                      });

                    case 5:
                      bridge = _context7.sent;

                      if (bridge) {
                        _context7.next = 10;
                        break;
                      }

                      console.log('bridge not found');
                      _context7.next = 70;
                      break;

                    case 10:
                      _context7.next = 12;
                      return db.transactions.findOne({
                        where: {
                          runebase_tx: transaction.txid
                        },
                        include: [{
                          model: db.bridges,
                          as: 'bridge'
                        }]
                      });

                    case 12:
                      dbTransaction = _context7.sent;

                      if (dbTransaction) {
                        _context7.next = 29;
                        break;
                      }

                      if (!(transaction.amount > Number(process.env.RUNEBASE_MIN_SWAP))) {
                        _context7.next = 27;
                        break;
                      }

                      amounte = new BigNumber(transaction.amount).times(1e8); // console.log(transaction);

                      _context7.next = 18;
                      return db.transactions.create({
                        runebase_tx: transaction.txid,
                        confirmations: transaction.confirmations,
                        amount: Math.trunc(amounte),
                        collectedRunebaseFee: parseInt(process.env.RUNEBASE_FIXED_FEE, 10),
                        bridgeId: bridge.id,
                        from: transaction.from
                      });

                    case 18:
                      newTransaction = _context7.sent;
                      _context7.next = 21;
                      return db.bridges.findOne({
                        where: {
                          id: bridge.id
                        }
                      });

                    case 21:
                      updatedBridge = _context7.sent;
                      _context7.next = 24;
                      return db.transactions.findAll({
                        order: [['id', 'DESC']],
                        include: [{
                          where: {
                            id: bridge.id
                          },
                          model: db.bridges,
                          as: 'bridge',
                          required: true
                        }]
                      });

                    case 24:
                      updatedTransactions = _context7.sent;
                      console.log('emit3');

                      if (sockets[updatedBridge.uuid]) {
                        sockets[updatedBridge.uuid].emit('updateBridge', {
                          bridge: updatedBridge,
                          transactions: updatedTransactions
                        });
                      }

                    case 27:
                      _context7.next = 70;
                      break;

                    case 29:
                      if (!(!dbTransaction.minted && dbTransaction.confirmations >= 6)) {
                        _context7.next = 55;
                        break;
                      }

                      if (!(dbTransaction.bridge.chainId === parseInt(process.env.BSC_NETWORK, 10) || dbTransaction.bridge.chainId === parseInt(process.env.MATIC_NETWORK, 10))) {
                        _context7.next = 53;
                        break;
                      }

                      _context7.next = 33;
                      return bsc.mint(dbTransaction.bridge.address, dbTransaction.amount / 1e8, dbTransaction.bridge.chainId);

                    case 33:
                      _yield$bsc$mint = _context7.sent;
                      hash = _yield$bsc$mint.hash;
                      fees = _yield$bsc$mint.fees;

                      if (hash) {
                        _context7.next = 42;
                        break;
                      }

                      logger.log("Unable to mint bsc coins");
                      logger.error("Unable to mint bsc coins");
                      _context7.next = 41;
                      return dbTransaction.update({
                        confirmations: transaction.confirmations,
                        fail_reason: 'bsc.mint function failed',
                        minted: true
                      });

                    case 41:
                      updateTransaction = _context7.sent;

                    case 42:
                      if (!hash) {
                        _context7.next = 53;
                        break;
                      }

                      _context7.next = 45;
                      return db.sequelize.transaction({
                        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
                      }, /*#__PURE__*/function () {
                        var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(t) {
                          var updateTransaction;
                          return regeneratorRuntime.wrap(function _callee5$(_context5) {
                            while (1) {
                              switch (_context5.prev = _context5.next) {
                                case 0:
                                  _context5.next = 2;
                                  return dbTransaction.update({
                                    confirmations: transaction.confirmations,
                                    bsc_tx: hash,
                                    minted: true,
                                    spendBscFee: fees
                                  }, {
                                    transaction: t
                                  });

                                case 2:
                                  updateTransaction = _context5.sent;
                                  t.afterCommit(function () {
                                    console.log("Swap completed, bsc tx hash: ".concat(hash, ", fees: ").concat(fees));
                                    console.info("Swap completed, bsc tx hash: ".concat(hash, ", fees: ").concat(fees));
                                  });

                                case 4:
                                case "end":
                                  return _context5.stop();
                              }
                            }
                          }, _callee5);
                        }));

                        return function (_x12) {
                          return _ref2.apply(this, arguments);
                        };
                      }())["catch"](function (err) {
                        console.log(err.message);
                        logger.error("Failed to load pending swaps: ".concat(err.message));
                      });

                    case 45:
                      _context7.next = 47;
                      return db.bridges.findOne({
                        where: {
                          id: dbTransaction.bridgeId
                        }
                      });

                    case 47:
                      _updatedBridge = _context7.sent;
                      _context7.next = 50;
                      return db.transactions.findAll({
                        order: [['id', 'DESC']],
                        include: [{
                          where: {
                            id: dbTransaction.bridgeId
                          },
                          model: db.bridges,
                          as: 'bridge',
                          required: true
                        }]
                      });

                    case 50:
                      _updatedTransactions = _context7.sent;
                      console.log('emit6');

                      if (sockets[_updatedBridge.uuid]) {
                        sockets[_updatedBridge.uuid].emit('updateBridge', {
                          bridge: _updatedBridge,
                          transactions: _updatedTransactions
                        });
                      }

                    case 53:
                      _context7.next = 70;
                      break;

                    case 55:
                      if (!(!dbTransaction.minted && dbTransaction.confirmations < 6)) {
                        _context7.next = 70;
                        break;
                      }

                      _context7.next = 58;
                      return db.sequelize.transaction({
                        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
                      }, /*#__PURE__*/function () {
                        var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(t) {
                          var updateTransaction;
                          return regeneratorRuntime.wrap(function _callee6$(_context6) {
                            while (1) {
                              switch (_context6.prev = _context6.next) {
                                case 0:
                                  _context6.next = 2;
                                  return dbTransaction.update({
                                    confirmations: transaction.confirmations
                                  });

                                case 2:
                                  updateTransaction = _context6.sent;
                                  t.afterCommit(function () {// next();
                                  });

                                case 4:
                                case "end":
                                  return _context6.stop();
                              }
                            }
                          }, _callee6);
                        }));

                        return function (_x13) {
                          return _ref3.apply(this, arguments);
                        };
                      }())["catch"](function (err) {
                        console.log(err.message);
                        logger.error("Failed to load pending swaps: ".concat(err.message));
                      });

                    case 58:
                      _context7.next = 60;
                      return db.bridges.findOne({
                        where: {
                          id: dbTransaction.bridgeId
                        }
                      });

                    case 60:
                      _updatedBridge2 = _context7.sent;
                      console.log('emit1');
                      console.log(sockets[_updatedBridge2.uuid]);

                      if (!sockets[_updatedBridge2.uuid]) {
                        _context7.next = 70;
                        break;
                      }

                      console.log('inside emitter');
                      _context7.next = 67;
                      return db.transactions.findAll({
                        order: [['id', 'DESC']],
                        include: [{
                          where: {
                            id: dbTransaction.bridgeId
                          },
                          model: db.bridges,
                          as: 'bridge',
                          required: true
                        }]
                      });

                    case 67:
                      _updatedTransactions2 = _context7.sent;
                      console.log('before emitting');

                      sockets[_updatedBridge2.uuid].emit('updateBridge', {
                        bridge: _updatedBridge2,
                        transactions: _updatedTransactions2
                      });

                    case 70:
                    case "end":
                      return _context7.stop();
                  }
                }
              }, _loop);
            });

            _iterator2.s();

          case 8:
            if ((_step2 = _iterator2.n()).done) {
              _context8.next = 12;
              break;
            }

            return _context8.delegateYield(_loop(), "t0", 10);

          case 10:
            _context8.next = 8;
            break;

          case 12:
            _context8.next = 17;
            break;

          case 14:
            _context8.prev = 14;
            _context8.t1 = _context8["catch"](5);

            _iterator2.e(_context8.t1);

          case 17:
            _context8.prev = 17;

            _iterator2.f();

            return _context8.finish(17);

          case 20:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee7, null, [[5, 14, 17, 20]]);
  }));
  return _patchRunebaseTransactions.apply(this, arguments);
}