module.exports = (sequelize, DataTypes) => {
    // 1: The model schema.
    const modelDefinition = {
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
    };
  
    // 2: The model options.
    const modelOptions = {
      freezeTableName: true,
    };
  
    // 3: Define the Wallet model.
    const UsedTxsModel = sequelize.define('used_txs', modelDefinition, modelOptions);
  
    UsedTxsModel.associate = (model) => {
      //ActiveModel.belongsTo(model.group);
      //ActiveModel.belongsTo(model.user);
    };
  
    return UsedTxsModel;
  };