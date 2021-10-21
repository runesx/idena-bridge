module.exports = (sequelize, DataTypes) => {
    // 1: The model schema.
    const modelDefinition = {
      id: {
        type: DataTypes.BIGINT,
        allowNull: false,
        primaryKey: true,
        autoIncrement: true,
      },
      runebase_tx: {
        type: DataTypes.STRING(64),
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
      fail_reason: {
        type: DataTypes.STRING(255),
        allowNull: true,
      },   
    };
  
    // 2: The model options.
    const modelOptions = {
      freezeTableName: true,
    };
  
    // 3: Define the Wallet model.
    const TransactionModel = sequelize.define('transactions', modelDefinition, modelOptions);
  
    TransactionModel.associate = (model) => {
        TransactionModel.belongsTo(model.instances);
    };
  
    return TransactionModel;
  };