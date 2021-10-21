module.exports = {
  up: (queryInterface, Sequelize) => queryInterface.addColumn(
    'transactions',
    'instanceId',
    {
      type: Sequelize.BIGINT,
      references: {
        model: 'transactions',
        key: 'id',
      },
      onUpdate: 'CASCADE',
      onDelete: 'SET NULL',
    },
  ),

  down: (queryInterface, Sequelize) => queryInterface.removeColumn(
    'transactions',
    'instanceId',
  ),
};