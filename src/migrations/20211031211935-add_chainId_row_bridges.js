module.exports = {
  up: async (queryInterface, DataTypes) => {
    await queryInterface.addColumn(
      'bridges', // name of Target model
      'chainId', // name of the key we're adding
      {
        type: DataTypes.BIGINT,
        allowNull: false,
        defaultValue: 56,
      },
    );
  },
  down: async (queryInterface, DataTypes) => {
    await queryInterface.removeColumn('bridges', 'chainId');
  },
};
