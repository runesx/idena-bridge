module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('used_txs', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      blockchain: {
        type: DataTypes.STRING(5),
        allowNull: true,
      },
      tx_hash: {
        type: DataTypes.STRING(66),
        allowNull: false,
      },
      createdAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
      updatedAt: {
        allowNull: false,
        type: DataTypes.DATE,
      },
    });
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.dropTable('used_txs');
  },
};