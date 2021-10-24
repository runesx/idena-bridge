module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'transactions',
    'bridgeId',
    {
      type: Sequelize.BIGINT,
      references: {
        model: 'bridges',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  ),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn(
    'transactions',
    'bridgeId',
  ),
};