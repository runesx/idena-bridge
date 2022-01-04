"use strict";

function _toConsumableArray(arr) { return _arrayWithoutHoles(arr) || _iterableToArray(arr) || _unsupportedIterableToArray(arr) || _nonIterableSpread(); }

function _nonIterableSpread() { throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method."); }

function _unsupportedIterableToArray(o, minLen) { if (!o) return; if (typeof o === "string") return _arrayLikeToArray(o, minLen); var n = Object.prototype.toString.call(o).slice(8, -1); if (n === "Object" && o.constructor) n = o.constructor.name; if (n === "Map" || n === "Set") return Array.from(o); if (n === "Arguments" || /^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)) return _arrayLikeToArray(o, minLen); }

function _iterableToArray(iter) { if (typeof Symbol !== "undefined" && iter[Symbol.iterator] != null || iter["@@iterator"] != null) return Array.from(iter); }

function _arrayWithoutHoles(arr) { if (Array.isArray(arr)) return _arrayLikeToArray(arr); }

function _arrayLikeToArray(arr, len) { if (len == null || len > arr.length) len = arr.length; for (var i = 0, arr2 = new Array(len); i < len; i++) { arr2[i] = arr[i]; } return arr2; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } }

function _defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } }

function _createClass(Constructor, protoProps, staticProps) { if (protoProps) _defineProperties(Constructor.prototype, protoProps); if (staticProps) _defineProperties(Constructor, staticProps); return Constructor; }

var keccak256 = require('js-sha3').keccak256;

var messages = require('./proto/models_pb');

var secp256k1 = require('secp256k1');

exports.privateKeyToAddress = function (privateKey) {
  var pubKey = Buffer.from(secp256k1.publicKeyCreate(hexToUint8Array(privateKey), false));
  return toHexString(keccak256.array(pubKey.slice(1)).slice(12), true);
};

function isHexPrefixed(str) {
  return str.slice(0, 2) === '0x';
}

function stripHexPrefix(str) {
  if (typeof str !== 'string') {
    return str;
  }

  return isHexPrefixed(str) ? str.slice(2) : str;
}

function toHexString(byteArray, withPrefix) {
  return (withPrefix ? '0x' : '') + Array.from(byteArray, function (_byte) {
    return "0".concat((_byte & 0xff).toString(16)).slice(-2);
  }).join('');
}

function intToHex(integer) {
  if (integer < 0) {
    throw new Error('Invalid integer as argument, must be unsigned!');
  }

  var hex = integer.toString(16);
  return hex.length % 2 ? '0' + hex : hex;
}

function padToEven(a) {
  return a.length % 2 ? '0' + a : a;
}

function bufferToInt(buf) {
  if (!buf || !buf.length) {
    return 0;
  }

  return parseInt(Buffer.from(buf).toString('hex'), 16);
}

function intToBuffer(integer) {
  var hex = intToHex(integer);
  return Buffer.from(hex, 'hex');
}

function toBuffer(v) {
  if (!Buffer.isBuffer(v)) {
    if (typeof v === 'string') {
      if (isHexPrefixed(v)) {
        return Buffer.from(padToEven(stripHexPrefix(v)), 'hex');
      } else {
        return Buffer.from(v);
      }
    } else if (typeof v === 'number') {
      if (!v) {
        return Buffer.from([]);
      } else {
        return intToBuffer(v);
      }
    } else if (v === null || v === undefined) {
      return Buffer.from([]);
    } else if (v instanceof Uint8Array) {
      return Buffer.from(v);
    } else {
      throw new Error('invalid type');
    }
  }

  return v;
}

function hexToUint8Array(hexString) {
  var str = stripHexPrefix(hexString);
  var arrayBuffer = new Uint8Array(str.length / 2);

  for (var i = 0; i < str.length; i += 2) {
    var byteValue = parseInt(str.substr(i, 2), 16);

    if (isNaN(byteValue)) {
      throw 'Invalid hexString';
    }

    arrayBuffer[i / 2] = byteValue;
  }

  return arrayBuffer;
}

exports.toHex = function (string) {
  return toHexString(toBuffer(string), true);
};

exports.Transaction = /*#__PURE__*/function () {
  function _class(nonce, epoch, type, to, amount, maxFee, tips, payload, signature) {
    _classCallCheck(this, _class);

    this.nonce = nonce || 0;
    this.epoch = epoch || 0;
    this.type = type || 0;
    this.to = to;
    this.amount = amount || 0;
    this.maxFee = maxFee || 0;
    this.tips = tips || 0;
    this.payload = payload || '0x';
    this.signature = signature || null;
  }

  _createClass(_class, [{
    key: "toJson",
    value: function toJson() {
      var obj = {
        nonce: this.nonce,
        epoch: this.epoch,
        type: this.type,
        to: this.to,
        amount: this.amount,
        maxFee: this.maxFee,
        tips: this.tips,
        payload: this.payload,
        signature: this.signature
      };
      return JSON.stringify(obj);
    }
  }, {
    key: "fromHex",
    value: function fromHex(hex) {
      return this.fromBytes(hexToUint8Array(hex));
    }
  }, {
    key: "fromBytes",
    value: function fromBytes(bytes) {
      var protoTx = messages.ProtoTransaction.deserializeBinary(bytes);
      var protoTxData = protoTx.getData();
      this.nonce = protoTxData.getNonce();
      this.epoch = protoTxData.getEpoch();
      this.type = protoTxData.getType();
      this.to = toHexString(protoTxData.getTo(), true);
      this.amount = bufferToInt(protoTxData.getAmount());
      this.maxFee = bufferToInt(protoTxData.getMaxfee());
      this.tips = bufferToInt(protoTxData.getTips());
      this.payload = protoTxData.getPayload();
      this.signature = protoTx.getSignature();
      return this;
    }
  }, {
    key: "sign",
    value: function sign(key) {
      var hash = keccak256.array(this._createProtoTxData().serializeBinary());

      var _secp256k1$ecdsaSign = secp256k1.ecdsaSign(new Uint8Array(hash), hexToUint8Array(key)),
          signature = _secp256k1$ecdsaSign.signature,
          recid = _secp256k1$ecdsaSign.recid;

      this.signature = Buffer.from([].concat(_toConsumableArray(signature), [recid]));
      return this;
    }
  }, {
    key: "toBytes",
    value: function toBytes() {
      var transaction = new messages.ProtoTransaction();
      transaction.setData(this._createProtoTxData());

      if (this.signature) {
        transaction.setSignature(toBuffer(this.signature));
      }

      return Buffer.from(transaction.serializeBinary());
    }
  }, {
    key: "toHex",
    value: function toHex() {
      return "0x" + this.toBytes().toString('hex');
    }
  }, {
    key: "_createProtoTxData",
    value: function _createProtoTxData() {
      var data = new messages.ProtoTransaction.Data();
      data.setNonce(this.nonce).setEpoch(this.epoch).setType(this.type);

      if (this.to) {
        data.setTo(toBuffer(this.to));
      }

      if (this.amount) {
        data.setAmount(toBuffer(this.amount));
      }

      if (this.maxFee) {
        data.setMaxfee(toBuffer(this.maxFee));
      }

      if (this.tips) {
        data.setTips(toBuffer(this.tips));
      }

      if (this.payload) {
        data.setPayload(toBuffer(this.payload));
      }

      return data;
    }
  }]);

  return _class;
}();