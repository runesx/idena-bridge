"use strict";

Object.defineProperty(exports, "__esModule", {
  value: true
});
exports["default"] = void 0;

var _rclient = require("../runebase/rclient");

var _models = _interopRequireDefault(require("../models"));

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { "default": obj }; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('sequelize'),
    Sequelize = _require.Sequelize,
    Transaction = _require.Transaction,
    Op = _require.Op;
/**
 * Notify New Block From Runebase Node
 */


var walletNotify = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(req, res, next) {
    var txId, transaction;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            txId = req.body.payload;
            _context3.next = 3;
            return (0, _rclient.getInstance)().getTransaction(txId);

          case 3:
            transaction = _context3.sent;
            console.log(transaction); // const testt = await getInstance().utils.toUtf8(transaction.hex);
            // console.log(testt);

            _context3.next = 7;
            return _models["default"].sequelize.transaction({
              isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE
            }, /*#__PURE__*/function () {
              var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(t) {
                return regeneratorRuntime.wrap(function _callee2$(_context2) {
                  while (1) {
                    switch (_context2.prev = _context2.next) {
                      case 0:
                        console.log(transaction.txid);
                        _context2.next = 3;
                        return Promise.all(transaction.details.map( /*#__PURE__*/function () {
                          var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(detail) {
                            var address, activity;
                            return regeneratorRuntime.wrap(function _callee$(_context) {
                              while (1) {
                                switch (_context.prev = _context.next) {
                                  case 0:
                                    if (!(detail.category === 'receive')) {
                                      _context.next = 23;
                                      break;
                                    }

                                    console.log(detail);
                                    console.log(detail.address);
                                    _context.next = 5;
                                    return _models["default"].address.findOne({
                                      where: {
                                        address: detail.address
                                      },
                                      include: [{
                                        model: _models["default"].wallet,
                                        as: 'wallet'
                                      }],
                                      transaction: t,
                                      lock: t.LOCK.UPDATE
                                    });

                                  case 5:
                                    address = _context.sent;
                                    console.log(address);
                                    res.locals.userId = address.wallet.userId;
                                    _context.next = 10;
                                    return _models["default"].transaction.findOrCreate({
                                      where: {
                                        txid: transaction.txid,
                                        type: detail.category
                                      },
                                      defaults: {
                                        txid: txId,
                                        addressId: address.id,
                                        phase: 'confirming',
                                        type: detail.category,
                                        amount: detail.amount * 1e8
                                      },
                                      transaction: t,
                                      lock: t.LOCK.UPDATE
                                    });

                                  case 10:
                                    res.locals.transaction = _context.sent;
                                    console.log(res.locals.transaction);
                                    console.log(res.locals.transaction[1]);
                                    console.log('111111111111111111112222222222222222222222222222222222');

                                    if (!res.locals.transaction[1]) {
                                      _context.next = 23;
                                      break;
                                    }

                                    _context.next = 17;
                                    return _models["default"].activity.findOrCreate({
                                      where: {
                                        txid: res.locals.transaction[0].id
                                      },
                                      defaults: {
                                        earnerId: res.locals.userId,
                                        type: 'depositAccepted',
                                        amount: detail.amount * 1e8,
                                        txId: res.locals.transaction[0].id
                                      },
                                      transaction: t,
                                      lock: t.LOCK.UPDATE
                                    });

                                  case 17:
                                    activity = _context.sent;
                                    console.log('2111111111111111111112222222222222222222222222222222222');
                                    _context.next = 21;
                                    return _models["default"].activity.findOne({
                                      where: {
                                        txId: res.locals.transaction[0].id
                                      },
                                      attributes: ['createdAt', 'type', 'amount'],
                                      include: [{
                                        model: _models["default"].user,
                                        as: 'earner',
                                        required: false,
                                        attributes: ['username']
                                      }, {
                                        model: _models["default"].transaction,
                                        as: 'txActivity',
                                        required: false,
                                        attributes: ['txid']
                                      }],
                                      transaction: t,
                                      lock: t.LOCK.UPDATE
                                    });

                                  case 21:
                                    res.locals.activity = _context.sent;
                                    console.log('3111111111111111111112222222222222222222222222222222222');

                                  case 23:
                                  case "end":
                                    return _context.stop();
                                }
                              }
                            }, _callee);
                          }));

                          return function (_x5) {
                            return _ref3.apply(this, arguments);
                          };
                        }()));

                      case 3:
                        t.afterCommit(function () {
                          next();
                          console.log('commited');
                        });

                      case 4:
                      case "end":
                        return _context2.stop();
                    }
                  }
                }, _callee2);
              }));

              return function (_x4) {
                return _ref2.apply(this, arguments);
              };
            }());

          case 7:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3);
  }));

  return function walletNotify(_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

var _default = walletNotify;
exports["default"] = _default;