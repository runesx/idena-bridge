module.exports = (sequelize, DataTypes) => {
    // 1: The model schema.
    const modelDefinition = {
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
      idena_tx: {
        type: DataTypes.STRING(66),
        allowNull: true,
      },
      bsc_tx: {
        type: DataTypes.STRING(66),
        allowNull: true,
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
    };
  
    // 2: The model options.
    const modelOptions = {
      freezeTableName: true,
    };
  
    // 3: Define the Wallet model.
    const SwapsModel = sequelize.define('swaps', modelDefinition, modelOptions);
  
    SwapsModel.associate = (model) => {
      //ActiveModel.belongsTo(model.group);
      //ActiveModel.belongsTo(model.user);
    };
  
    return SwapsModel;
  };