"use strict";

module.exports = {
  up: function up(queryInterface, Sequelize) {
    return queryInterface.addColumn('transactions', 'bridgeId', {
      type: Sequelize.BIGINT,
      references: {
        model: 'bridges',
        key: 'id'
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL'
    });
  },
  down: function down(queryInterface, Sequelize) {
    return queryInterface.removeColumn('transactions', 'bridgeId');
  }
};