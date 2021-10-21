module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('transactions', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      runebase_tx: {
        type: DataTypes.STRING(42),
        allowNull: true,
      },
      bsc_tx: {
        type: DataTypes.STRING(66),
        allowNull: true,
      },
      confirmations: {
        type: DataTypes.INTEGER,
        allowNull: true,
      },
      amount: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      minted: {
        type: DataTypes.BOOLEAN,
        defaultValue: false,
      },
      collectedRunebaseFee: {
        type: DataTypes.BIGINT,
        allowNull: true,
      },
      spendBscFee: {
        type: DataTypes.BIGINT,
        allowNull: true,
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
    await queryInterface.dropTable('transactions');
  },
};