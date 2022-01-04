"use strict";

module.exports = function (sequelize, DataTypes) {
  // 1: The model schema.
  var modelDefinition = {
    id: {
      type: DataTypes.BIGINT,
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    blockchain: {
      type: DataTypes.STRING(5),
      allowNull: true
    },
    tx_hash: {
      type: DataTypes.STRING(66),
      allowNull: false
    }
  }; // 2: The model options.

  var modelOptions = {
    freezeTableName: true
  }; // 3: Define the Wallet model.

  var UsedTxsModel = sequelize.define('used_txs', modelDefinition, modelOptions);

  UsedTxsModel.associate = function (model) {//ActiveModel.belongsTo(model.group);
    //ActiveModel.belongsTo(model.user);
  };

  return UsedTxsModel;
};