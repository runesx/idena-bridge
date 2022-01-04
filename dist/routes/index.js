"use strict";

var _walletNotify = _interopRequireDefault(require("../controllers/walletNotify"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

// const express = require('express');
// const routerExpress = express.Router();
var uuid = require('uuid');

var _require = require('sequelize'),
    Sequelize = _require.Sequelize,
    Transaction = _require.Transaction,
    Op = _require.Op;

var _require2 = require('ethers'),
    utils = _require2.utils;

var _require3 = require('ethers'),
    ethers = _require3.ethers;

var BigNumber = require('bignumber.js');

var db = require('../models');

var bsc = require('../bsc');

var logger = require('../logger').child({
  component: "api"
});

var _require4 = require('../runebase/calls'),
    startRunebaseEnv = _require4.startRunebaseEnv,
    waitRunebaseNodeSync = _require4.waitRunebaseNodeSync,
    getNewAddress = _require4.getNewAddress,
    isRunebaseAddress = _require4.isRunebaseAddress,
    isRunebaseConnected = _require4.isRunebaseConnected;

var router = function router(app, io) {
  app.post('/api/rpc/walletnotify', _walletNotify["default"], function (req, res) {
    console.log('afterWalletNotify');

    if (res.locals.error) {
      console.log(res.locals.error);
    } else if (!res.locals.error && res.locals.transaction) {
      if (res.locals.activity) {
        if (onlineUsers[res.locals.userId.toString()]) {
          onlineUsers[res.locals.userId.toString()].emit('insertTransaction', {
            transaction: res.locals.transaction
          });
        }

        io.emit('Activity', res.locals.activity);
      }

      console.log('end insert');
    }

    res.sendStatus(200);
  }); // IMPORTANT: Make sure this endpoint is only accessible by Runebase Node

  function latest(_x, _x2) {
    return _latest.apply(this, arguments);
  }

  function _latest() {
    _latest = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(req, res) {
      var reqInfo, result;
      return regeneratorRuntime.wrap(function _callee6$(_context6) {
        while (1) {
          switch (_context6.prev = _context6.next) {
            case 0:
              reqInfo = req.path;
              logger.debug("Got ".concat(reqInfo));
              _context6.next = 4;
              return db.bridges.findAll({
                where: {
                  userId: req.user.id
                },
                limit: 50,
                order: [['time', 'DESC']],
                attributes: ['address', 'depositAddress', 'type', 'amount', 'status', 'time']
              });

            case 4:
              result = _context6.sent;

              if (!result.length) {
                _context6.next = 9;
                break;
              }

              logger.debug("Completed ".concat(reqInfo));
              res.status(200).json({
                result: result
              });
              return _context6.abrupt("return");

            case 9:
              res.sendStatus(500);

            case 10:
            case "end":
              return _context6.stop();
          }
        }
      }, _callee6);
    }));
    return _latest.apply(this, arguments);
  }

  app.get('/latest', /*#__PURE__*/function () {
    var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(req, res) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.prev = 0;
              console.log('latest');
              _context.next = 4;
              return latest(req, res);

            case 4:
              _context.next = 10;
              break;

            case 6:
              _context.prev = 6;
              _context.t0 = _context["catch"](0);
              logger.error("Failed ".concat(req.path, ": ").concat(_context.t0));
              res.sendStatus(500);

            case 10:
            case "end":
              return _context.stop();
          }
        }
      }, _callee, null, [[0, 6]]);
    }));

    return function (_x3, _x4) {
      return _ref.apply(this, arguments);
    };
  }());

  function info(_x5, _x6) {
    return _info.apply(this, arguments);
  }

  function _info() {
    _info = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(req, res) {
      var reqInfo, bridge, transactions;
      return regeneratorRuntime.wrap(function _callee7$(_context7) {
        while (1) {
          switch (_context7.prev = _context7.next) {
            case 0:
              reqInfo = req.path;
              logger.debug("Got ".concat(reqInfo));
              console.log('infocalled'); // console.log(req.params);

              if (uuid.validate(req.params.uuid)) {
                _context7.next = 7;
                break;
              }

              logger.debug("Bad request ".concat(reqInfo));
              res.sendStatus(400);
              return _context7.abrupt("return");

            case 7:
              _context7.next = 9;
              return db.bridges.findOne({
                where: {
                  uuid: req.params.uuid
                }
              });

            case 9:
              bridge = _context7.sent;
              _context7.next = 12;
              return db.transactions.findAll({
                order: [['id', 'DESC']],
                include: [{
                  where: {
                    uuid: req.params.uuid
                  },
                  model: db.bridges,
                  as: 'bridge',
                  required: true
                }]
              });

            case 12:
              transactions = _context7.sent;
              console.log(bridge);

              if (!(!bridge || !transactions)) {
                _context7.next = 18;
                break;
              }

              logger.debug("Not found ".concat(reqInfo));
              res.sendStatus(404);
              return _context7.abrupt("return");

            case 18:
              if (bridge && transactions) {
                logger.debug("Completed ".concat(reqInfo));
                res.status(200).json({
                  bridge: bridge,
                  transactions: transactions
                });
              }

            case 19:
            case "end":
              return _context7.stop();
          }
        }
      }, _callee7);
    }));
    return _info.apply(this, arguments);
  }

  app.get('/info/:uuid', /*#__PURE__*/function () {
    var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(req, res) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.prev = 0;
              _context2.next = 3;
              return info(req, res);

            case 3:
              _context2.next = 9;
              break;

            case 5:
              _context2.prev = 5;
              _context2.t0 = _context2["catch"](0);
              logger.error("Failed ".concat(req.path, ": ").concat(_context2.t0));
              res.sendStatus(500);

            case 9:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2, null, [[0, 5]]);
    }));

    return function (_x7, _x8) {
      return _ref2.apply(this, arguments);
    };
  }());

  function fetchTransactions(_x9, _x10) {
    return _fetchTransactions.apply(this, arguments);
  }

  function _fetchTransactions() {
    _fetchTransactions = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8(req, res) {
      var result;
      return regeneratorRuntime.wrap(function _callee8$(_context8) {
        while (1) {
          switch (_context8.prev = _context8.next) {
            case 0:
              _context8.next = 2;
              return db.transactions.findAll({
                order: [['id', 'DESC']],
                include: [{
                  model: db.bridges,
                  as: 'bridge'
                }]
              });

            case 2:
              result = _context8.sent;

              if (result) {
                _context8.next = 7;
                break;
              }

              logger.debug("Not found");
              res.sendStatus(404);
              return _context8.abrupt("return");

            case 7:
              if (result) {
                logger.debug("Completed");
                console.log("Completed");
                res.status(200).json({
                  result: result
                });
              }

            case 8:
            case "end":
              return _context8.stop();
          }
        }
      }, _callee8);
    }));
    return _fetchTransactions.apply(this, arguments);
  }

  app.get('/transactions', /*#__PURE__*/function () {
    var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res) {
      return regeneratorRuntime.wrap(function _callee3$(_context3) {
        while (1) {
          switch (_context3.prev = _context3.next) {
            case 0:
              _context3.prev = 0;
              _context3.next = 3;
              return fetchTransactions(req, res);

            case 3:
              _context3.next = 9;
              break;

            case 5:
              _context3.prev = 5;
              _context3.t0 = _context3["catch"](0);
              logger.error("Failed ".concat(req.path, ": ").concat(_context3.t0));
              res.sendStatus(500);

            case 9:
            case "end":
              return _context3.stop();
          }
        }
      }, _callee3, null, [[0, 5]]);
    }));

    return function (_x11, _x12) {
      return _ref3.apply(this, arguments);
    };
  }());

  function assign(_x13, _x14) {
    return _assign.apply(this, arguments);
  }

  function _assign() {
    _assign = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee9(req, res) {
      var reqInfo, reject, bridge, actualAmount, newTransaction, updatedBridge, transactions;
      return regeneratorRuntime.wrap(function _callee9$(_context9) {
        while (1) {
          switch (_context9.prev = _context9.next) {
            case 0:
              reject = function _reject(err) {
                console.log('rejected');
                logger.error("Failed ".concat(reqInfo, ": ").concat(err));
                res.sendStatus(500);
              };

              console.log('start assign function');
              reqInfo = "".concat(req.path, " (uuid=").concat(req.body.uuid, ", tx=").concat(req.body.tx, ")");
              logger.debug("Got ".concat(reqInfo));

              if (uuid.validate(req.body.uuid)) {
                _context9.next = 9;
                break;
              }

              console.log('uid not valid');
              logger.debug("Bad request ".concat(reqInfo));
              res.sendStatus(400);
              return _context9.abrupt("return");

            case 9:
              console.log('assign checkpoint 1');
              _context9.next = 12;
              return db.bridges.findOne({
                where: {
                  uuid: req.body.uuid
                },
                include: [{
                  model: db.transactions,
                  as: 'transactions',
                  required: false
                }]
              });

            case 12:
              bridge = _context9.sent;
              // console.log(bridge);
              console.log('assign checkpoint 2');

              if (!bridge) {
                _context9.next = 18;
                break;
              }

              console.log('found bridge');
              _context9.next = 22;
              break;

            case 18:
              console.log('unable to find bridge');
              logger.debug("unable to find bridge ".concat(reqInfo));
              res.sendStatus(400);
              return _context9.abrupt("return");

            case 22:
              // console.log(req.body);
              console.log(req.body.txid.length);
              console.log(bridge.type);
              console.log(bridge.transactions);
              console.log(ethers.utils.isHexString(req.body.txid));
              console.log(req.body.txid.length);
              console.log(bridge.transactions.length);
              console.log('assign checkpoint 3');

              if (!(bridge && bridge.type === 1 && bridge.transactions.length < 1 && ethers.utils.isHexString(req.body.txid) && req.body.txid.length === 66)) {
                _context9.next = 58;
                break;
              }

              console.log('888');
              _context9.next = 33;
              return bsc.isTxExist(req.body.txid, bridge.chainId);

            case 33:
              if (!_context9.sent) {
                _context9.next = 58;
                break;
              }

              console.log('999');
              actualAmount = new BigNumber(bridge.amount).div(1e8).times(1e18);
              console.log(actualAmount);
              _context9.next = 39;
              return bsc.isValidBurnTx(req.body.txid, bridge.depositAddress, actualAmount, bridge.time, bridge.chainId);

            case 39:
              _context9.t0 = _context9.sent;

              if (!_context9.t0) {
                _context9.next = 44;
                break;
              }

              _context9.next = 43;
              return bsc.isNewTx(req.body.txid);

            case 43:
              _context9.t0 = _context9.sent;

            case 44:
              if (!_context9.t0) {
                _context9.next = 58;
                break;
              }

              console.log('insert new transaction');
              _context9.next = 48;
              return db.transactions.create({
                bridgeId: bridge.id,
                bsc_tx: req.body.txid,
                amount: bridge.amount
              });

            case 48:
              newTransaction = _context9.sent;
              _context9.next = 51;
              return db.bridges.findOne({
                where: {
                  id: bridge.id
                },
                include: [{
                  model: db.transactions,
                  as: 'transactions',
                  required: false
                }]
              });

            case 51:
              updatedBridge = _context9.sent;
              _context9.next = 54;
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

            case 54:
              transactions = _context9.sent;
              console.log(newTransaction);

              if (newTransaction) {
                logger.debug("Completed ".concat(reqInfo));
                console.log("Completed ".concat(reqInfo));
                res.status(200).json({
                  bridge: updatedBridge,
                  transactions: transactions
                }); // res.sendStatus(200);
              }

              if (!newTransaction) {
                logger.debug("Bad request ".concat(reqInfo));
                res.sendStatus(400);
              }

            case 58:
            case "end":
              return _context9.stop();
          }
        }
      }, _callee9);
    }));
    return _assign.apply(this, arguments);
  }

  app.post('/assign', /*#__PURE__*/function () {
    var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(req, res) {
      return regeneratorRuntime.wrap(function _callee4$(_context4) {
        while (1) {
          switch (_context4.prev = _context4.next) {
            case 0:
              console.log('route /assign');
              _context4.prev = 1;
              _context4.next = 4;
              return assign(req, res);

            case 4:
              _context4.next = 10;
              break;

            case 6:
              _context4.prev = 6;
              _context4.t0 = _context4["catch"](1);
              logger.error("Failed ".concat(req.path, " (uuid=").concat(req.body.uuid, "): ").concat(_context4.t0));
              res.sendStatus(500);

            case 10:
            case "end":
              return _context4.stop();
          }
        }
      }, _callee4, null, [[1, 6]]);
    }));

    return function (_x15, _x16) {
      return _ref4.apply(this, arguments);
    };
  }());

  function create(_x17, _x18) {
    return _create.apply(this, arguments);
  }

  function _create() {
    _create = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee11(req, res) {
      var isItConnected, reqInfo, type, amount, RunebaseAddress, existDestination, amounte, newUUID;
      return regeneratorRuntime.wrap(function _callee11$(_context11) {
        while (1) {
          switch (_context11.prev = _context11.next) {
            case 0:
              _context11.next = 2;
              return isRunebaseConnected();

            case 2:
              isItConnected = _context11.sent;
              console.log(isItConnected);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);
              console.log(req.body);

              if (isItConnected) {
                _context11.next = 19;
                break;
              }

              console.log("Unable to connect to Runebase Node");
              logger.debug("Unable to connect to Runebase Node");
              res.status(500).send({
                error: 'Unable to connect to Runebase Node'
              });
              return _context11.abrupt("return");

            case 19:
              if (!(req.body.chainId !== parseInt(process.env.BSC_NETWORK, 10) && req.body.chainId !== parseInt(process.env.MATIC_NETWORK, 10))) {
                _context11.next = 24;
                break;
              }

              console.log("Invalid Network");
              logger.debug("Invalid Network");
              res.status(500).send({
                error: 'Invalid Network'
              });
              return _context11.abrupt("return");

            case 24:
              reqInfo = "".concat(req.path, " (type=").concat(req.body.type, ", address=").concat(req.body.destinationAddress, ")");
              logger.debug("Got ".concat(reqInfo));
              type = parseInt(req.body.type, 10); // console.log(type);

              amount = parseFloat(req.body.amount);

              if (!isNaN(amount)) {
                _context11.next = 33;
                break;
              }

              console.log("Amount is not a number ".concat(reqInfo));
              logger.debug("Amount is not a number ".concat(reqInfo));
              res.status(500).send({
                error: 'Amount is not a number'
              });
              return _context11.abrupt("return");

            case 33:
              if (!(type === 0)) {
                _context11.next = 40;
                break;
              }

              _context11.next = 36;
              return db.bridges.findOne({
                where: {
                  address: req.body.destinationAddress,
                  // destination address
                  chainId: parseInt(req.body.chainId, 10),
                  status: 'Pending'
                }
              });

            case 36:
              existDestination = _context11.sent;

              if (!existDestination) {
                _context11.next = 40;
                break;
              }

              res.status(200).json({
                result: {
                  uuid: existDestination.uuid
                }
              });
              return _context11.abrupt("return");

            case 40:
              console.log('not exist');

              if (!(type === 0)) {
                _context11.next = 46;
                break;
              }

              _context11.next = 44;
              return getNewAddress();

            case 44:
              RunebaseAddress = _context11.sent;
              console.log(RunebaseAddress);

            case 46:
              if (!(type === 0 && !RunebaseAddress)) {
                _context11.next = 51;
                break;
              }

              console.log("Unable to generate Runebase Address ".concat(reqInfo));
              logger.debug("Unable to generate Runebase Address  ".concat(reqInfo));
              res.status(500).send({
                error: 'Unable to generate Runebase Address'
              });
              return _context11.abrupt("return");

            case 51:
              console.log('beforeisrunebaseaddress');

              if (!(type === 1 && !isRunebaseAddress(req.body.destinationAddress))) {
                _context11.next = 57;
                break;
              }

              console.log("Invalid Runebase Address ".concat(reqInfo));
              logger.debug("Invalid Runebase Address ".concat(reqInfo));
              res.status(500).send({
                error: 'Invalid Runebase Address'
              });
              return _context11.abrupt("return");

            case 57:
              console.log('afterisrunebaseaddress');

              if (!(!utils.isAddress(req.body.destinationAddress) && type === 0)) {
                _context11.next = 63;
                break;
              }

              console.log("Invalid BSC/MATIC Address ".concat(reqInfo));
              logger.debug("Invalid BSC/MATIC Address ".concat(reqInfo));
              res.status(500).send({
                error: 'Invalid BSC/MATIC Address'
              });
              return _context11.abrupt("return");

            case 63:
              if (!(type !== 0 && type !== 1)) {
                _context11.next = 68;
                break;
              }

              console.log('Invalid Type');
              logger.debug("Invalid Type ".concat(reqInfo));
              res.status(500).send({
                error: 'Invalid Type'
              });
              return _context11.abrupt("return");

            case 68:
              if (!(type === 1 && amount <= 100)) {
                _context11.next = 73;
                break;
              }

              console.log('bad request');
              logger.debug("Bad request ".concat(reqInfo));
              res.status(500).send({
                error: 'Invalid Amount'
              });
              return _context11.abrupt("return");

            case 73:
              amounte = new BigNumber(amount).times(1e8);
              newUUID = uuid.v4();
              _context11.next = 77;
              return db.sequelize.transaction({
                isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
              }, /*#__PURE__*/function () {
                var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee10(t) {
                  var newBridge;
                  return regeneratorRuntime.wrap(function _callee10$(_context10) {
                    while (1) {
                      switch (_context10.prev = _context10.next) {
                        case 0:
                          _context10.next = 2;
                          return db.bridges.create({
                            uuid: newUUID,
                            amount: Math.trunc(amounte),
                            address: req.body.destinationAddress,
                            depositAddress: type === 0 && RunebaseAddress ? RunebaseAddress : req.body.address,
                            type: type,
                            chainId: parseInt(req.body.chainId, 10)
                          }, {
                            transaction: t,
                            lock: t.LOCK.UPDATE
                          });

                        case 2:
                          newBridge = _context10.sent;
                          console.log(newBridge);
                          t.afterCommit(function () {
                            logger.debug("Completed ".concat(reqInfo, ": ").concat(newUUID));
                            res.status(200).json({
                              result: {
                                uuid: newUUID
                              }
                            });
                          });

                        case 5:
                        case "end":
                          return _context10.stop();
                      }
                    }
                  }, _callee10);
                }));

                return function (_x21) {
                  return _ref6.apply(this, arguments);
                };
              }())["catch"](function (err) {
                console.log("Failed to handle request '/create': ".concat(err.message));
                logger.error("Failed to handle request '/create': ".concat(err.message));
                res.sendStatus(500);
              });

            case 77:
            case "end":
              return _context11.stop();
          }
        }
      }, _callee11);
    }));
    return _create.apply(this, arguments);
  }

  app.post('/create', /*#__PURE__*/function () {
    var _ref5 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5(req, res) {
      return regeneratorRuntime.wrap(function _callee5$(_context5) {
        while (1) {
          switch (_context5.prev = _context5.next) {
            case 0:
              _context5.prev = 0;
              console.log('Create Bridge');
              _context5.next = 4;
              return create(req, res);

            case 4:
              _context5.next = 10;
              break;

            case 6:
              _context5.prev = 6;
              _context5.t0 = _context5["catch"](0);
              logger.error("Failed ".concat(req.path, " (type=").concat(req.body.type, ", amount=").concat(req.body.amount, ", address=").concat(req.body.address, "): ").concat(_context5.t0));
              res.sendStatus(500);

            case 10:
            case "end":
              return _context5.stop();
          }
        }
      }, _callee5, null, [[0, 6]]);
    }));

    return function (_x19, _x20) {
      return _ref5.apply(this, arguments);
    };
  }()); // async function calculateFees(req, res) {
  //  const reqInfo = req.path;
  //  logger.debug(`Got ${reqInfo}`);
  //  if (!uuid.validate(req.params.uuid)) {
  //    logger.debug(`Bad request ${reqInfo}`);
  //    res.sendStatus(400);
  //    return;
  //  }
  //  const sql = "SELECT address, amount FROM `swaps` WHERE `uuid` = ? LIMIT 1;";
  //  db.promise().execute(sql, [req.params.uuid])
  //    .then(async ([data, fields]) => {
  //     if (!data[0]) {
  //        logger.debug(`Not found ${reqInfo}`);
  //        res.sendStatus(404);
  //        return;
  //      }
  //      logger.debug(`Completed ${reqInfo}`);
  //      res.status(200).json({
  //       result: await bsc.calculateFees(data[0].address, data[0].amount),
  //      });
  //    })
  //    .catch((err) => {
  //      logger.error(`Failed ${reqInfo}: ${err}`);
  //      res.sendStatus(500);
  //    });
  // }
  // app.get('/calculateFees/:uuid', async (req, res) => {
  //  try {
  //    await calculateFees(req, res);
  //  } catch (error) {
  //    logger.error(`Failed ${req.path}: ${error}`);
  //    res.sendStatus(500);
  //  }
  // });
};

module.exports = router;