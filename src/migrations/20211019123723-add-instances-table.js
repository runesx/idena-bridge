module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.createTable('instances', {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      address: {
        type: DataTypes.STRING(42),
        allowNull: true,
      },
      depositAddress: {
        type: DataTypes.STRING(42),
        allowNull: true,
      },
      amount: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: true,
      },
      fees: {
        type: DataTypes.DECIMAL(36, 18),
        allowNull: true,
      },
      uuid: {
        type: DataTypes.STRING(36),
        allowNull: true,
      },
      time: {
        type: DataTypes.DATE,
        allowNull: true,
        defaultValue: new Date(Date.now()),
      },
      status: {
        type: DataTypes.STRING(20),
        allowNull: false,
        defaultValue: 'Pending',
      },
      type: {
        type: DataTypes.INTEGER(1),
        allowNull: false,
        defaultValue: 0,
      },
      mined: {
        type: DataTypes.INTEGER(1),
        allowNull: true,
      },
      fail_reason: {
        type: DataTypes.STRING(255),
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
    await queryInterface.dropTable('instances');
  },
};