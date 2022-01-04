"use strict";

function asyncGeneratorStep(gen, resolve, reject, _next, _throw, key, arg) { try { var info = gen[key](arg); var value = info.value; } catch (error) { reject(error); return; } if (info.done) { resolve(value); } else { Promise.resolve(value).then(_next, _throw); } }

function _asyncToGenerator(fn) { return function () { var self = this, args = arguments; return new Promise(function (resolve, reject) { var gen = fn.apply(self, args); function _next(value) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "next", value); } function _throw(err) { asyncGeneratorStep(gen, resolve, reject, _next, _throw, "throw", err); } _next(undefined); }); }; }

module.exports = {
  up: function () {
    var _up = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee(queryInterface, DataTypes) {
      return regeneratorRuntime.wrap(function _callee$(_context) {
        while (1) {
          switch (_context.prev = _context.next) {
            case 0:
              _context.next = 2;
              return queryInterface.createTable('bridges', {
                id: {
                  type: DataTypes.BIGINT,
                  allowNull: false,
                  primaryKey: true,
                  autoIncrement: true
                },
                blockchain: {
                  type: DataTypes.STRING(6),
                  allowNull: false,
                  defaultValue: 'BSC'
                },
                address: {
                  type: DataTypes.STRING(42),
                  allowNull: true
                },
                depositAddress: {
                  type: DataTypes.STRING(42),
                  allowNull: true
                },
                amount: {
                  type: DataTypes.BIGINT,
                  allowNull: true
                },
                fees: {
                  type: DataTypes.DECIMAL(36, 18),
                  allowNull: true
                },
                uuid: {
                  type: DataTypes.STRING(36),
                  allowNull: true
                },
                time: {
                  type: DataTypes.DATE,
                  allowNull: true,
                  defaultValue: new Date(Date.now())
                },
                status: {
                  type: DataTypes.STRING(20),
                  allowNull: false,
                  defaultValue: 'Pending'
                },
                type: {
                  type: DataTypes.INTEGER(1),
                  allowNull: false,
                  defaultValue: 0
                },
                mined: {
                  type: DataTypes.INTEGER(1),
                  allowNull: true
                },
                fail_reason: {
                  type: DataTypes.STRING(255),
                  allowNull: true
                },
                createdAt: {
                  allowNull: false,
                  type: DataTypes.DATE
                },
                updatedAt: {
                  allowNull: false,
                  type: DataTypes.DATE
                }
              });

            case 2:
            case "end":
              return _context.stop();
          }
        }
      }, _callee);
    }));

    function up(_x, _x2) {
      return _up.apply(this, arguments);
    }

    return up;
  }(),
  down: function () {
    var _down = _asyncToGenerator( /*#__PURE__*/regeneratorRuntime.mark(function _callee2(queryInterface, DataTypes) {
      return regeneratorRuntime.wrap(function _callee2$(_context2) {
        while (1) {
          switch (_context2.prev = _context2.next) {
            case 0:
              _context2.next = 2;
              return queryInterface.dropTable('bridges');

            case 2:
            case "end":
              return _context2.stop();
          }
        }
      }, _callee2);
    }));

    function down(_x3, _x4) {
      return _down.apply(this, arguments);
    }

    return down;
  }()
};