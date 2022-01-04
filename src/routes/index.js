import walletNotify from '../controllers/walletNotify';

// const express = require('express');

// const routerExpress = express.Router();
const uuid = require('uuid');
const { Sequelize, Transaction, Op } = require('sequelize');
const {
  utils,
} = require('ethers');
const {
  ethers,
} = require('ethers');
const BigNumber = require('bignumber.js');
const db = require('../models');

const bsc = require('../bsc');
const logger = require('../logger').child({
  component: "api",
});
const {
  startRunebaseEnv,
  waitRunebaseNodeSync,
  getNewAddress,
  isRunebaseAddress,
  isRunebaseConnected,
} = require('../runebase/calls');

const router = (app, io) => {
  app.post('/api/rpc/walletnotify',
    walletNotify,
    (req, res) => {
      console.log('afterWalletNotify');
      if (res.locals.error) {
        console.log(res.locals.error);
      } else if (!res.locals.error && res.locals.transaction) {
        if (res.locals.activity) {
          if (onlineUsers[res.locals.userId.toString()]) {
            onlineUsers[res.locals.userId.toString()].emit('insertTransaction', { transaction: res.locals.transaction });
          }
          io.emit('Activity', res.locals.activity);
        }
        console.log('end insert');
      }
      res.sendStatus(200);
    }); // IMPORTANT: Make sure this endpoint is only accessible by Runebase Node

  async function latest(req, res) {
    const reqInfo = req.path;
    logger.debug(`Got ${reqInfo}`);
    const result = await db.bridges.findAll({
      where: {
        userId: req.user.id,
      },
      limit: 50,
      order: [['time', 'DESC']],
      attributes: [
        'address',
        'depositAddress',
        'type',
        'amount',
        'status',
        'time',
      ],
    });
    if (result.length) {
      logger.debug(`Completed ${reqInfo}`);
      res.status(200).json({
        result,
      });
      return;
    }
    res.sendStatus(500);
  }

  app.get('/latest', async (req, res) => {
    try {
      console.log('latest');
      await latest(req, res);
    } catch (error) {
      logger.error(`Failed ${req.path}: ${error}`);
      res.sendStatus(500);
    }
  });

  async function info(req, res) {
    const reqInfo = req.path;
    logger.debug(`Got ${reqInfo}`);
    console.log('infocalled');
    // console.log(req.params);
    if (!uuid.validate(req.params.uuid)) {
      logger.debug(`Bad request ${reqInfo}`);
      res.sendStatus(400);
      return;
    }
    const bridge = await db.bridges.findOne({
      where: {
        uuid: req.params.uuid,
      },
    });
    const transactions = await db.transactions.findAll({
      order: [
        ['id', 'DESC'],
      ],
      include: [
        {
          where: {
            uuid: req.params.uuid,
          },
          model: db.bridges,
          as: 'bridge',
          required: true,
        },
      ],
    });
    console.log(bridge);
    if (!bridge || !transactions) {
      logger.debug(`Not found ${reqInfo}`);
      res.sendStatus(404);
      return;
    }
    if (bridge && transactions) {
      logger.debug(`Completed ${reqInfo}`);
      res.status(200).json({
        bridge,
        transactions,
      });
    }
  }

  app.get('/info/:uuid', async (req, res) => {
    // console.log(req);
    try {
      await info(req, res);
    } catch (error) {
      logger.error(`Failed ${req.path}: ${error}`);
      res.sendStatus(500);
    }
  });

  async function fetchTransactions(req, res) {
    const result = await db.transactions.findAll({
      order: [
        ['id', 'DESC'],
      ],
      include: [
        {
          model: db.bridges,
          as: 'bridge',
        },
      ],
    });
    if (!result) {
      logger.debug(`Not found`);
      res.sendStatus(404);
      return;
    }
    if (result) {
      logger.debug(`Completed`);
      console.log(`Completed`);
      res.status(200).json({ result });
    }
  }

  app.get('/transactions', async (req, res) => {
    try {
      await fetchTransactions(req, res);
    } catch (error) {
      logger.error(`Failed ${req.path}: ${error}`);
      res.sendStatus(500);
    }
  });

  async function assign(req, res) {
    console.log('start assign function');
    const reqInfo = `${req.path} (uuid=${req.body.uuid}, tx=${req.body.tx})`;
    logger.debug(`Got ${reqInfo}`);
    if (!uuid.validate(req.body.uuid)) {
      console.log('uid not valid');
      logger.debug(`Bad request ${reqInfo}`);
      res.sendStatus(400);
      return;
    }

    function reject(err) {
      console.log('rejected');
      logger.error(`Failed ${reqInfo}: ${err}`);
      res.sendStatus(500);
    }

    console.log('assign checkpoint 1');

    const bridge = await db.bridges.findOne({
      where: {
        uuid: req.body.uuid,
      },
      include: [
        {
          model: db.transactions,
          as: 'transactions',
          required: false,
        },
      ],
    });
    // console.log(bridge);

    console.log('assign checkpoint 2');

    if (bridge) {
      console.log('found bridge');
    } else {
      console.log('unable to find bridge');
      logger.debug(`unable to find bridge ${reqInfo}`);
      res.sendStatus(400);
      return;
    }

    // console.log(req.body);
    console.log(req.body.txid.length);
    console.log(bridge.type);
    console.log(bridge.transactions);
    console.log(ethers.utils.isHexString(req.body.txid));
    console.log(req.body.txid.length);
    console.log(bridge.transactions.length);
    console.log('assign checkpoint 3');

    if
      (
      bridge
      && bridge.type === 1
      && bridge.transactions.length < 1
      && ethers.utils.isHexString(req.body.txid)
      && req.body.txid.length === 66
    ) {
      console.log('888');
      if (await bsc.isTxExist(req.body.txid, bridge.chainId)) {
        console.log('999');
        const actualAmount = new BigNumber(bridge.amount).div(1e8).times(1e18);
        console.log(actualAmount);
        if (
          await bsc.isValidBurnTx(
            req.body.txid,
            bridge.depositAddress,
            actualAmount,
            bridge.time,
            bridge.chainId,
          )
          && await bsc.isNewTx(req.body.txid)
        ) {
          console.log('insert new transaction');
          const newTransaction = await db.transactions.create({
            bridgeId: bridge.id,
            bsc_tx: req.body.txid,
            amount: bridge.amount,
          });
          const updatedBridge = await db.bridges.findOne({
            where: {
              id: bridge.id,
            },
            include: [
              {
                model: db.transactions,
                as: 'transactions',
                required: false,
              },
            ],
          });
          const transactions = await db.transactions.findAll({
            order: [
              ['id', 'DESC'],
            ],
            include: [
              {
                where: {
                  id: bridge.id,
                },
                model: db.bridges,
                as: 'bridge',
                required: true,
              },
            ],
          });
          console.log(newTransaction);
          if (newTransaction) {
            logger.debug(`Completed ${reqInfo}`);
            console.log(`Completed ${reqInfo}`);
            res.status(200).json({
              bridge: updatedBridge,
              transactions,
            });
            // res.sendStatus(200);
          }
          if (!newTransaction) {
            logger.debug(`Bad request ${reqInfo}`);
            res.sendStatus(400);
          }
        }
      }
    }
  }

  app.post('/assign', async (req, res) => {
    console.log('route /assign');
    try {
      await assign(req, res);
    } catch (error) {
      logger.error(`Failed ${req.path} (uuid=${req.body.uuid}): ${error}`);
      res.sendStatus(500);
    }
  });

  async function create(req, res) {
    const isItConnected = await isRunebaseConnected();
    console.log(isItConnected);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);
    console.log(req.body);

    if (!isItConnected) {
      console.log(`Unable to connect to Runebase Node`);
      logger.debug(`Unable to connect to Runebase Node`);
      res.status(500).send({
        error: 'Unable to connect to Runebase Node',
      });
      return;
    }
    if (
      req.body.chainId !== parseInt(process.env.BSC_NETWORK, 10)
      && req.body.chainId !== parseInt(process.env.MATIC_NETWORK, 10)
    ) {
      console.log(`Invalid Network`);
      logger.debug(`Invalid Network`);
      res.status(500).send({
        error: 'Invalid Network',
      });
      return;
    }
    const reqInfo = `${req.path} (type=${req.body.type}, address=${req.body.destinationAddress})`;
    logger.debug(`Got ${reqInfo}`);
    const type = parseInt(req.body.type, 10);
    // console.log(type);
    const amount = parseFloat(req.body.amount);
    let RunebaseAddress;

    if (isNaN(amount)) {
      console.log(`Amount is not a number ${reqInfo}`);
      logger.debug(`Amount is not a number ${reqInfo}`);
      res.status(500).send({
        error: 'Amount is not a number',
      });
      return;
    }

    if (type === 0) { // destination already exist
      const existDestination = await db.bridges.findOne({
        where: {
          address: req.body.destinationAddress, // destination address
          chainId: parseInt(req.body.chainId, 10),
          status: 'Pending',
        },
      });
      if (existDestination) {
        res.status(200).json({
          result: {
            uuid: existDestination.uuid,
          },
        });
        return;
      }
    }

    console.log('not exist');

    if (type === 0) {
      RunebaseAddress = await getNewAddress();
      console.log(RunebaseAddress);
    }

    if (type === 0 && !RunebaseAddress) {
      console.log(`Unable to generate Runebase Address ${reqInfo}`);
      logger.debug(`Unable to generate Runebase Address  ${reqInfo}`);
      res.status(500).send({
        error: 'Unable to generate Runebase Address',
      });
      return;
    }

    console.log('beforeisrunebaseaddress');

    if (type === 1 && !isRunebaseAddress(req.body.destinationAddress)) {
      console.log(`Invalid Runebase Address ${reqInfo}`);
      logger.debug(`Invalid Runebase Address ${reqInfo}`);
      res.status(500).send({
        error: 'Invalid Runebase Address',
      });
      return;
    }

    console.log('afterisrunebaseaddress');

    if (!utils.isAddress(req.body.destinationAddress) && type === 0) {
      console.log(`Invalid BSC/MATIC Address ${reqInfo}`);
      logger.debug(`Invalid BSC/MATIC Address ${reqInfo}`);
      res.status(500).send({
        error: 'Invalid BSC/MATIC Address',
      });
      return;
    }

    if (type !== 0 && (type !== 1)) {
      console.log('Invalid Type');
      logger.debug(`Invalid Type ${reqInfo}`);
      res.status(500).send({
        error: 'Invalid Type',
      });
      return;
    }

    // if (type === 0 && (amount <= process.env.MIN_SWAP)) {
    //    console.log('bad request');
    //    logger.debug(`Bad request ${reqInfo}`)
    //    res.status(500).send({
    //        error: 'Invalid Amount',
    //      });
    //    return
    // }

    if (type === 1 && (amount <= 100)) {
      console.log('bad request');
      logger.debug(`Bad request ${reqInfo}`);
      res.status(500).send({
        error: 'Invalid Amount',
      });
      return;
    }

    const amounte = new BigNumber(amount).times(1e8);
    const newUUID = uuid.v4();

    await db.sequelize.transaction({
      isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
    }, async (t) => {
      // console.log(parseUnits(amount, 18));
      const newBridge = await db.bridges.create({
        uuid: newUUID,
        amount: Math.trunc(amounte),
        address: req.body.destinationAddress,
        depositAddress: type === 0 && RunebaseAddress ? RunebaseAddress : req.body.address,
        type,
        chainId: parseInt(req.body.chainId, 10),
      }, {
        transaction: t,
        lock: t.LOCK.UPDATE,
      });
      console.log(newBridge);
      t.afterCommit(() => {
        logger.debug(`Completed ${reqInfo}: ${newUUID}`);
        res.status(200).json({
          result: {
            uuid: newUUID,
          },
        });
      });
    }).catch((err) => {
      console.log(`Failed to handle request '/create': ${err.message}`);
      logger.error(`Failed to handle request '/create': ${err.message}`);
      res.sendStatus(500);
    });
  }

  app.post('/create', async (req, res) => {
    // console.log(req.body);
    try {
      console.log('Create Bridge');
      await create(req, res);
    } catch (error) {
      logger.error(`Failed ${req.path} (type=${req.body.type}, amount=${req.body.amount}, address=${req.body.address}): ${error}`);
      res.sendStatus(500);
    }
  });

  // async function calculateFees(req, res) {
  //  const reqInfo = req.path;
  //  logger.debug(`Got ${reqInfo}`);
  //  if (!uuid.validate(req.params.uuid)) {
  //    logger.debug(`Bad request ${reqInfo}`);
  //    res.sendStatus(400);
  //    return;
  //  }
  //  const sql = "SELECT address, amount FROM `swaps` WHERE `uuid` = ? LIMIT 1;";
  //  db.promise().execute(sql, [req.params.uuid])
  //    .then(async ([data, fields]) => {
  //     if (!data[0]) {
  //        logger.debug(`Not found ${reqInfo}`);
  //        res.sendStatus(404);
  //        return;
  //      }
  //      logger.debug(`Completed ${reqInfo}`);

  //      res.status(200).json({
  //       result: await bsc.calculateFees(data[0].address, data[0].amount),
  //      });
  //    })
  //    .catch((err) => {
  //      logger.error(`Failed ${reqInfo}: ${err}`);
  //      res.sendStatus(500);
  //    });
  // }

  // app.get('/calculateFees/:uuid', async (req, res) => {
  //  try {
  //    await calculateFees(req, res);
  //  } catch (error) {
  //    logger.error(`Failed ${req.path}: ${error}`);
  //    res.sendStatus(500);
  //  }
  // });
};

module.exports = router;
