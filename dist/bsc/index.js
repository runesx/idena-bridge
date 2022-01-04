"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

var _require = require('axios'),
    axios = _require["default"];

var ethers = require('ethers');

var InputDataDecoder = require('ethereum-input-data-decoder');

var abiDecoder = require('abi-decoder');

var abi = require('./abi');

var db = require('../models');

require('dotenv').config();

var logger = require('../logger').child({
  component: "bsc"
});

abiDecoder.addABI(abi);

exports.mint = /*#__PURE__*/function () {
  var _ref = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(address, amount, network) {
    var rpcUrl, myContract, newAmount, provider, signer, contract, minted;
    return regeneratorRuntime.wrap(function _callee$(_context) {
      while (1) {
        switch (_context.prev = _context.next) {
          case 0:
            rpcUrl = '';
            myContract = '';

            if (network === parseInt(process.env.BSC_NETWORK, 10)) {
              console.log('its a binance transaction');
              rpcUrl = process.env.BSC_RPC;
              myContract = process.env.BSC_CONTRACT;
            }

            if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
              console.log('its a matic transaction');
              rpcUrl = process.env.MATIC_RPC;
              myContract = process.env.MATIC_CONTRACT;
            }

            console.log('rpcUrl');
            console.log(rpcUrl);
            console.log(myContract); // const networkId = '';

            console.log('checkpoint1');
            _context.prev = 8;
            newAmount = ethers.utils.parseEther(parseFloat(amount).toString());
            console.log(rpcUrl);
            provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
            signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider);
            console.log('before contract');
            contract = new ethers.Contract(myContract, abi, signer);
            console.log(address);
            console.log(newAmount);
            console.log(newAmount.toString()); // console.log(contract);

            console.log('before minting');
            _context.next = 21;
            return contract.mint(address, newAmount);

          case 21:
            minted = _context.sent;
            console.log(minted);
            console.log('checkpoint2'); // let fees = ethers.utils.parseUnits((await provider.getGasPrice() * await contract.estimateGas.mint(address, amount) / idenaPrice).toString(), 'ether').div(ethers.BigNumber.from(100)).mul(ethers.BigNumber.from(process.env.BSC_FEES));

            return _context.abrupt("return", {
              hash: minted.hash,
              fees: 100 // parseFloat(fees / 10 ** 18)

            });

          case 27:
            _context.prev = 27;
            _context.t0 = _context["catch"](8);
            console.log("Failed to mint: ".concat(_context.t0));
            logger.error("Failed to mint: ".concat(_context.t0));
            return _context.abrupt("return", null);

          case 32:
          case "end":
            return _context.stop();
        }
      }
    }, _callee, null, [[8, 27]]);
  }));

  return function (_x, _x2, _x3) {
    return _ref.apply(this, arguments);
  };
}();

exports.isValidBurnTx = /*#__PURE__*/function () {
  var _ref2 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(txHash, address, amount, date, network) {
    var extractDestAddress, rpcUrl, myContract, provider, contract, txReceipt, tx, destAddress, method, value, from, to, block, blockDate;
    return regeneratorRuntime.wrap(function _callee2$(_context2) {
      while (1) {
        switch (_context2.prev = _context2.next) {
          case 0:
            extractDestAddress = function _extractDestAddress(inputData) {
              try {
                if (!inputData) {
                  return false;
                }

                var inputDataDecoder = new InputDataDecoder(abi);
                var result = inputDataDecoder.decodeData(inputData);

                if (!result || !result.inputs || result.inputs.length < 2) {
                  return false;
                }

                return result.inputs[1];
              } catch (error) {
                logger.error("Failed to extract dest address: ".concat(error));
                return false;
              }
            };

            _context2.prev = 1;
            rpcUrl = '';
            myContract = '';

            if (network === parseInt(process.env.BSC_NETWORK, 10)) {
              rpcUrl = process.env.BSC_RPC;
              myContract = process.env.BSC_CONTRACT;
            }

            if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
              rpcUrl = process.env.MATIC_RPC;
              myContract = process.env.MATIC_CONTRACT;
            }

            provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
            contract = new ethers.Contract(myContract, abi);
            _context2.next = 10;
            return provider.getTransactionReceipt(txHash);

          case 10:
            txReceipt = _context2.sent;
            console.log(txReceipt);
            console.log('wtf');

            if (!(txReceipt.status !== 1)) {
              _context2.next = 17;
              break;
            }

            logger.info("Wrong status, actual: ".concat(txReceipt.status, ", expected: 1"));
            console.log("Wrong status, actual: ".concat(txReceipt.status, ", expected: 1"));
            return _context2.abrupt("return", false);

          case 17:
            if (!(txReceipt.logs.length === 0)) {
              _context2.next = 21;
              break;
            }

            logger.info("No logs");
            console.log("No logs");
            return _context2.abrupt("return", false);

          case 21:
            if (!(txReceipt.to.toLowerCase() !== myContract.toLowerCase())) {
              _context2.next = 25;
              break;
            }

            logger.info("Wrong recipient, actual: ".concat(txReceipt.to, ", expected: ").concat(myContract));
            console.log("Wrong recipient, actual: ".concat(txReceipt.to, ", expected: ").concat(myContract));
            return _context2.abrupt("return", false);

          case 25:
            _context2.next = 27;
            return provider.getTransaction(txHash);

          case 27:
            tx = _context2.sent;
            destAddress = tx && extractDestAddress(tx.data);

            if (!(destAddress.toLowerCase() !== address.toLowerCase().slice(2))) {
              _context2.next = 33;
              break;
            }

            logger.info("Wrong dest address, actual: ".concat(destAddress, ", expected: ").concat(address));
            console.log("Wrong dest address, actual: ".concat(destAddress, ", expected: ").concat(address));
            return _context2.abrupt("return", false);

          case 33:
            method = contract["interface"].parseLog(txReceipt.logs[0]).name;

            if (!(method !== "Transfer")) {
              _context2.next = 38;
              break;
            }

            logger.info("Wrong method, actual: ".concat(method, ", expected: Transfer"));
            console.log("Wrong method, actual: ".concat(method, ", expected: Transfer"));
            return _context2.abrupt("return", false);

          case 38:
            value = contract["interface"].parseLog(txReceipt.logs[0]).args.value;
            console.log('value');
            console.log(value);
            console.log(amount); // console.log(ethers.utils.parseEther(amount.toString()));

            console.log('numbemr Values');
            console.log(Number(value));
            console.log(Number(amount)); // console.log(Number(ethers.utils.parseEther(amount.toString())));

            if (value >= amount) {
              _context2.next = 49;
              break;
            }

            logger.info("Wrong value, actual: ".concat(value, ", expected: at least ").concat(amount));
            console.log("Wrong value, actual: ".concat(value, ", expected: at least ").concat(amount));
            return _context2.abrupt("return", false);

          case 49:
            console.log('321');
            from = contract["interface"].parseLog(txReceipt.logs[0]).args.from;

            if (!(from.toLowerCase() !== tx.from.toLowerCase())) {
              _context2.next = 55;
              break;
            }

            logger.info("Wrong sender, actual: ".concat(from, ", expected: ").concat(tx.from));
            console.log("Wrong sender, actual: ".concat(from, ", expected: ").concat(tx.from));
            return _context2.abrupt("return", false);

          case 55:
            console.log('321-1');
            to = contract["interface"].parseLog(txReceipt.logs[0]).args.to;

            if (!(to.toLowerCase() !== "0x0000000000000000000000000000000000000000")) {
              _context2.next = 61;
              break;
            }

            logger.info("Wrong recipient, actual: ".concat(to, ", expected: 0x0000000000000000000000000000000000000000"));
            console.log("Wrong recipient, actual: ".concat(to, ", expected: 0x0000000000000000000000000000000000000000"));
            return _context2.abrupt("return", false);

          case 61:
            console.log('323');
            _context2.next = 64;
            return provider.getBlock(tx.blockHash);

          case 64:
            block = _context2.sent;
            blockDate = new Date(block.timestamp * 1000);
            console.log('3666');

            if (!(blockDate.getTime() < date.getTime())) {
              _context2.next = 71;
              break;
            }

            logger.info("Tx is not actual");
            console.log("Tx is not actual");
            return _context2.abrupt("return", false);

          case 71:
            return _context2.abrupt("return", true);

          case 74:
            _context2.prev = 74;
            _context2.t0 = _context2["catch"](1);
            logger.error("Failed to check if burn tx is valid: ".concat(_context2.t0));
            return _context2.abrupt("return", false);

          case 78:
          case "end":
            return _context2.stop();
        }
      }
    }, _callee2, null, [[1, 74]]);
  }));

  return function (_x4, _x5, _x6, _x7, _x8) {
    return _ref2.apply(this, arguments);
  };
}();

exports.isTxExist = /*#__PURE__*/function () {
  var _ref3 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee3(txHash, network) {
    var rpcUrl, provider, tx;
    return regeneratorRuntime.wrap(function _callee3$(_context3) {
      while (1) {
        switch (_context3.prev = _context3.next) {
          case 0:
            _context3.prev = 0;
            rpcUrl = '';

            if (network === parseInt(process.env.BSC_NETWORK, 10)) {
              rpcUrl = process.env.BSC_RPC;
            }

            if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
              rpcUrl = process.env.MATIC_RPC;
            }

            console.log(process.env.BSC_RPC);
            console.log(process.env.BSC_NETWORK);
            console.log(txHash);
            provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
            _context3.next = 10;
            return provider.getTransactionReceipt(txHash);

          case 10:
            tx = _context3.sent;
            console.log('isTxExist tx');
            console.log(tx);

            if (!tx) {
              _context3.next = 15;
              break;
            }

            return _context3.abrupt("return", true);

          case 15:
            return _context3.abrupt("return", false);

          case 18:
            _context3.prev = 18;
            _context3.t0 = _context3["catch"](0);
            logger.error("Failed to check if tx exists: ".concat(_context3.t0));
            return _context3.abrupt("return", false);

          case 22:
          case "end":
            return _context3.stop();
        }
      }
    }, _callee3, null, [[0, 18]]);
  }));

  return function (_x9, _x10) {
    return _ref3.apply(this, arguments);
  };
}();

exports.isTxConfirmed = /*#__PURE__*/function () {
  var _ref4 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee4(txHash, network) {
    var rpcUrl, provider, tx;
    return regeneratorRuntime.wrap(function _callee4$(_context4) {
      while (1) {
        switch (_context4.prev = _context4.next) {
          case 0:
            _context4.prev = 0;
            rpcUrl = '';

            if (network === parseInt(process.env.BSC_NETWORK, 10)) {
              rpcUrl = process.env.BSC_RPC;
            }

            if (network === parseInt(process.env.MATIC_NETWORK, 10)) {
              rpcUrl = process.env.MATIC_RPC;
            }

            console.log('isTxConfirmed');
            provider = new ethers.providers.JsonRpcProvider(rpcUrl, network);
            _context4.next = 8;
            return provider.getTransactionReceipt(txHash);

          case 8:
            tx = _context4.sent;

            if (!tx) {
              _context4.next = 11;
              break;
            }

            return _context4.abrupt("return", tx.confirmations >= process.env.BSC_CONFIRMATIONS_BLOCKS);

          case 11:
            return _context4.abrupt("return", false);

          case 14:
            _context4.prev = 14;
            _context4.t0 = _context4["catch"](0);
            logger.error("Failed to check if tx is confirmed: ".concat(_context4.t0));
            return _context4.abrupt("return", false);

          case 18:
          case "end":
            return _context4.stop();
        }
      }
    }, _callee4, null, [[0, 14]]);
  }));

  return function (_x11, _x12) {
    return _ref4.apply(this, arguments);
  };
}();

exports.getWalletAddress = /*#__PURE__*/_asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee5() {
  var signer;
  return regeneratorRuntime.wrap(function _callee5$(_context5) {
    while (1) {
      switch (_context5.prev = _context5.next) {
        case 0:
          signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY);
          _context5.next = 3;
          return signer.getAddress();

        case 3:
          return _context5.abrupt("return", _context5.sent);

        case 4:
        case "end":
          return _context5.stop();
      }
    }
  }, _callee5);
}));

exports.getContractAddress = function () {
  return process.env.BSC_CONTRACT;
};

function getIdenaPrice() {
  return _getIdenaPrice.apply(this, arguments);
}

function _getIdenaPrice() {
  _getIdenaPrice = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee8() {
    var resp;
    return regeneratorRuntime.wrap(function _callee8$(_context8) {
      while (1) {
        switch (_context8.prev = _context8.next) {
          case 0:
            _context8.next = 2;
            return axios.get("https://api.coingecko.com/api/v3/simple/price?ids=idena&vs_currencies=bnb");

          case 2:
            resp = _context8.sent;

            if (!(resp.status === 200 && resp.data.idena.bnb)) {
              _context8.next = 5;
              break;
            }

            return _context8.abrupt("return", ethers.utils.parseEther(resp.data.idena.bnb.toString()));

          case 5:
            return _context8.abrupt("return", 0);

          case 6:
          case "end":
            return _context8.stop();
        }
      }
    }, _callee8);
  }));
  return _getIdenaPrice.apply(this, arguments);
}

exports.isNewTx = /*#__PURE__*/function () {
  var _ref6 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee6(tx) {
    var transaction;
    return regeneratorRuntime.wrap(function _callee6$(_context6) {
      while (1) {
        switch (_context6.prev = _context6.next) {
          case 0:
            console.log('isnewtx');
            console.log(tx);
            _context6.prev = 2;
            _context6.next = 5;
            return db.transactions.findOne({
              where: {
                bsc_tx: tx.toString(),
                minted: true
              }
            });

          case 5:
            transaction = _context6.sent;
            console.log(transaction);

            if (!transaction) {
              _context6.next = 10;
              break;
            }

            console.log('transaction found');
            return _context6.abrupt("return", false);

          case 10:
            if (transaction) {
              _context6.next = 13;
              break;
            }

            console.log('transaction not found');
            return _context6.abrupt("return", true);

          case 13:
            _context6.next = 20;
            break;

          case 15:
            _context6.prev = 15;
            _context6.t0 = _context6["catch"](2);
            logger.error("Failed to check if tx is new: ".concat(_context6.t0));
            console.log("Failed to check if tx is new: ".concat(_context6.t0));
            return _context6.abrupt("return", false);

          case 20:
          case "end":
            return _context6.stop();
        }
      }
    }, _callee6, null, [[2, 15]]);
  }));

  return function (_x13) {
    return _ref6.apply(this, arguments);
  };
}();

exports.calculateFees = /*#__PURE__*/function () {
  var _ref7 = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee7(address, amount) {
    var provider, signer, contract, idenaPrice, fees;
    return regeneratorRuntime.wrap(function _callee7$(_context7) {
      while (1) {
        switch (_context7.prev = _context7.next) {
          case 0:
            _context7.prev = 0;
            amount = ethers.utils.parseEther(parseFloat(amount).toString());
            provider = new ethers.providers.JsonRpcProvider(process.env.BSC_RPC, parseInt(process.env.BSC_NETWORK));
            signer = new ethers.Wallet(process.env.BSC_PRIVATE_KEY, provider);
            contract = new ethers.Contract(process.env.BSC_CONTRACT, abi, signer);
            _context7.next = 7;
            return getIdenaPrice();

          case 7:
            idenaPrice = _context7.sent;

            if (!(idenaPrice == 0)) {
              _context7.next = 10;
              break;
            }

            return _context7.abrupt("return", null);

          case 10:
            _context7.t0 = ethers.utils;
            _context7.next = 13;
            return provider.getGasPrice();

          case 13:
            _context7.t1 = _context7.sent;
            _context7.next = 16;
            return contract.estimateGas.mint(address, amount);

          case 16:
            _context7.t2 = _context7.sent;
            _context7.t3 = _context7.t1 * _context7.t2;
            _context7.t4 = idenaPrice;
            _context7.t5 = (_context7.t3 / _context7.t4).toString();
            fees = _context7.t0.parseUnits.call(_context7.t0, _context7.t5, 'ether').div(ethers.BigNumber.from(100)).mul(ethers.BigNumber.from(process.env.BSC_FEES));
            return _context7.abrupt("return", parseFloat(fees / Math.pow(10, 18)));

          case 24:
            _context7.prev = 24;
            _context7.t6 = _context7["catch"](0);
            logger.error("Failed to calculate fees: ".concat(_context7.t6));
            return _context7.abrupt("return", null);

          case 28:
          case "end":
            return _context7.stop();
        }
      }
    }, _callee7, null, [[0, 24]]);
  }));

  return function (_x14, _x15) {
    return _ref7.apply(this, arguments);
  };
}();