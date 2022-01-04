"use strict";

function _defineProperty(obj, key, value) { if (key in obj) { Object.defineProperty(obj, key, { value: value, enumerable: true, configurable: true, writable: true }); } else { obj[key] = value; } return obj; }

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var BigNumber = require("bignumber.js");

var _require = require('./calls'),
    sendToAddress = _require.sendToAddress;

var BN = BigNumber.clone({
  DECIMAL_PLACES: 8
});

function construct(_x) {
  return _construct.apply(this, arguments);
}

function _construct() {
  _construct = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(_ref) {
    var client, maximumAmount, limit, feeRate, unspent, inputsTotal, amount, fee, hex, vsize, start, end, sliceTo, success, res, unspentSlice, inputs, outputs, fR, amountOutput;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            client = _ref.client, maximumAmount = _ref.maximumAmount, limit = _ref.limit, feeRate = _ref.feeRate;
            _context.next = 3;
            return client.listUnspent(1, 9999999, []);

          case 3:
            unspent = _context.sent;
            //unspent = unspent.filter(function( obj ) {
            //    return obj.address !== process.env.RUNEBASE_PROOF_OF_RESERVE;
            //  });
            console.log(unspent);
            console.log('listUnspend');
            inputsTotal = unspent.length;

            if (!(unspent.length === 1 && unspent[0].address !== process.env.RUNEBASE_PROOF_OF_RESERVE)) {
              _context.next = 10;
              break;
            }

            sendToAddress(process.env.RUNEBASE_PROOF_OF_RESERVE, unspent[0].amount, '', '', true);
            return _context.abrupt("return");

          case 10:
            if (!(unspent.length < 2)) {
              _context.next = 13;
              break;
            }

            console.log('Not Enough Unspent Transaction to consolidate');
            return _context.abrupt("return");

          case 13:
            console.log('Done');

            if (limit) {
              unspent = unspent.slice(0, limit);
            }

            console.log("Output address:", process.env.RUNEBASE_PROOF_OF_RESERVE);
            start = 0;
            end = unspent.length;
            sliceTo = end;
            success = false;
            console.info("Picking up maximum number of inputs...");

          case 21:
            if (success) {
              _context.next = 66;
              break;
            }

            res = void 0;
            console.info(" trying:", sliceTo);
            unspentSlice = unspent.slice(0, sliceTo);
            inputs = unspentSlice.map(function (u) {
              return {
                txid: u.txid,
                vout: u.vout
              };
            });
            amount = unspentSlice.reduce(function (prev, _ref3) {
              var amount = _ref3.amount;
              return prev.plus(amount);
            }, new BN(0)).toNumber();
            outputs = [_defineProperty({}, process.env.RUNEBASE_PROOF_OF_RESERVE, amount)];
            _context.prev = 28;
            fR = new BN(feeRate).times(1024).div(1e8).toNumber();
            _context.next = 32;
            return client.walletCreateFundedPsbt(inputs, outputs, 0, {
              subtractFeeFromOutputs: [0],
              feeRate: fR
            });

          case 32:
            res = _context.sent;
            _context.next = 43;
            break;

          case 35:
            _context.prev = 35;
            _context.t0 = _context["catch"](28);

            if (!(_context.t0.message === "Transaction too large")) {
              _context.next = 41;
              break;
            }

            end = sliceTo;
            sliceTo = start + Math.floor((end - start) / 2);
            return _context.abrupt("continue", 21);

          case 41:
            console.error(_context.t0);
            throw _context.t0;

          case 43:
            fee = res.fee; // signing psbt

            _context.next = 46;
            return client.walletProcessPsbt(res.psbt);

          case 46:
            res = _context.sent;

            if (res.complete) {
              _context.next = 49;
              break;
            }

            throw new Error("Error during walletprocesspsbt");

          case 49:
            _context.next = 51;
            return client.finalizePsbt(res.psbt);

          case 51:
            res = _context.sent;

            if (res.complete) {
              _context.next = 54;
              break;
            }

            throw new Error("Error during finalizePsbt");

          case 54:
            hex = res.hex; // checking tx vsize show be below 100000

            _context.next = 57;
            return client.decodeRawTransaction(hex);

          case 57:
            res = _context.sent;
            vsize = res.vsize;

            if (!(vsize > 100000)) {
              _context.next = 63;
              break;
            }

            end = sliceTo;
            sliceTo = start + Math.floor((end - start) / 2);
            return _context.abrupt("continue", 21);

          case 63:
            if (sliceTo === end || end - start <= 1) {
              console.log(" success");
              success = true;
            } else {
              start = sliceTo;
              sliceTo = start + Math.floor((end - start) / 2);
            }

            _context.next = 21;
            break;

          case 66:
            console.log("Transaction created");
            amountOutput = new BN(amount).minus(fee).toNumber();
            return _context.abrupt("return", {
              address: process.env.RUNEBASE_PROOF_OF_RESERVE,
              amountInput: amount,
              amountOutput: amountOutput,
              fee: fee,
              hex: hex,
              inputsUsed: sliceTo,
              inputsTotal: inputsTotal
            });

          case 69:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[28, 35]]);
  }));
  return _construct.apply(this, arguments);
}

function broadcast(_x2) {
  return _broadcast.apply(this, arguments);
}

function _broadcast() {
  _broadcast = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(_ref2) {
    var client, hex, txid;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            client = _ref2.client, hex = _ref2.hex;
            console.log("Broadcasting transaction...");
            _context2.next = 4;
            return client.sendRawTransaction(hex);

          case 4:
            txid = _context2.sent;
            console.log("Done!");
            return _context2.abrupt("return", txid);

          case 7:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2);
  }));
  return _broadcast.apply(this, arguments);
}

module.exports = {
  construct: construct,
  broadcast: broadcast
};