const express = require('express'),
    router = express.Router();
const uuid = require('uuid');
const idena = require('../idena');
const { Rweb3 } = require('rweb3');
const db = require('../models');
    const { Sequelize, Transaction, Op } = require('sequelize');
    import walletNotify from '../controllers/walletNotify';
const bsc = require('../bsc');
const {
    utils
} = require('ethers');
const {
    ethers
} = require('ethers');
const logger = require('../logger').child({
    component: "api"
})
const rweb3 = new Rweb3('http://runebaseinfo:runebaseinfo@localhost:9432');

router.post('/api/rpc/walletnotify',
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
    }); // IMPORTANT: Make sure this endpoint is only accessible by Runebase Node

router.get('/latest', async function (req, res) {
    try {
        console.log('latest');
        await latest(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function latest(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`);
    const result = await db.instances.findAll({
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
        logger.debug(`Completed ${reqInfo}`)
        res.status(200).json({
            result,
        });
        return;
    }
    res.sendStatus(500);
    return;
}

router.get('/info/:uuid', async function (req, res) {
    console.log(req);
    try {
        await info(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function info(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`);
    console.log('infocalled');
    console.log(req.params);
    if (!uuid.validate(req.params.uuid)) {
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }
    const result = await db.instances.findOne({
        where: {
            uuid: req.params.uuid,
        },
        include: [
            {
              model: db.transactions,
              as: 'transactions',
            },
          ],
    })
    console.log(result);
    if (!result) {
        logger.debug(`Not found ${reqInfo}`)
        res.sendStatus(404);
                return;
    }
    if (result) {
        logger.debug(`Completed ${reqInfo}`)
        res.status(200).json({
            result
        })
    }
}

router.post('/assign', async function (req, res) {
    console.log('route /assign');
    try {
        await assign(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path} (uuid=${req.body.uuid}): ${error}`)
        res.sendStatus(500)
    }
});

async function assign(req, res) {
    console.log('start assign function');
    const reqInfo = `${req.path} (uuid=${req.body.uuid}, tx=${req.body.tx})`
    logger.debug(`Got ${reqInfo}`)
    if (!uuid.validate(req.body.uuid)) {
        console.log('uid not valid');
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }

    function reject(err) {
        console.log('rejected');
        logger.error(`Failed ${reqInfo}: ${err}`)
        res.sendStatus(500);
    }
    
    const instance = await db.instances.findOne({
        where: {
            uuid: req.body.uuid,
        },
        include: [
            {
              model: db.transactions,
              as: 'transactions',
            },
          ],
    });
    console.log(instance);

    if (instance) {
        console.log('found bridge');        
    } else {
        console.log('unable to find bridge');
        logger.debug(`unable to find bridge ${reqInfo}`)
        res.sendStatus(400);
        return
    }

    console.log(req.body);

    if (instance && instance.type === 0 && !(instance.idena_tx) && req.body.txid.length === 64) {
        console.log('if data');        
    }
    if 
    (
        instance 
        && instance.type === 1 
        && !(instance.transactions) 
        && ethers.utils.isHexString(req.body.txid) 
        && req.body.txid.length === 66
    ) 
    {
        console.log('888');
        if (await bsc.isTxExist(req.body.txid)) {
            console.log('999');
            if (
                await bsc.isValidBurnTx(
                    req.body.txid, 
                    instance.depositAddress, 
                    instance.amount, 
                    instance.time
                ) 
                && await bsc.isNewTx(req.body.txid)
                ) 
                {
                    console.log('insert new transaction');
                    const newTransaction = await db.transactions.create({
                    instanceId: instance.id,
                    bsc_tx: req.body.txid,
                    amount: instance.amount,
                    });
                    console.log(newTransaction);
                    if (newTransaction) {
                        logger.debug(`Completed ${reqInfo}`);
                        console.log(`Completed ${reqInfo}`);
                        res.sendStatus(200);
                    }
                    if (!newTransaction) {
                        logger.debug(`Bad request ${reqInfo}`)
                        res.sendStatus(400);
                        return
                    }                
                }

        }
    }
}

router.post('/create', async function (req, res) {
    console.log(req.body);
    try {
        console.log('create');
        await create(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path} (type=${req.body.type}, amount=${req.body.amount}, address=${req.body.address}): ${error}`)
        res.sendStatus(500)
    }
});

async function isConnected() {
    return await rweb3.isConnected();
  }
  async function isRunebaseAddress(address) {
    return await rweb3.utils.isRunebaseAddress(address);
  }
  async function getNewAddress() {
    return await rweb3.getNewAddress();
  }

async function create(req, res) {
    const isItConnected = await isConnected();
    if(!isItConnected) {
        logger.debug(`Unable to connect to Runebase Node`)
        res.sendStatus(400);
        return;
    }
    const reqInfo = `${req.path} (type=${req.body.type}, address=${req.body.destinationAddress})`;
    console.log(reqInfo);
    logger.debug(`Got ${reqInfo}`);
    console.log('type:');
    let type = parseInt(req.body.type);
    console.log(type);
    let amount = parseFloat(req.body.amount);
    let RunebaseAddress;
    if(isNaN(amount)){
        console.log(`Amount is not a number ${reqInfo}`);
        logger.debug(`Amount is not a number ${reqInfo}`);
        res.status(500).send({
            error: 'Amount is not a number',
          });
        return;
    }

    if (type === 0 ) { // destination already exist
        const existDestination = await db.instances.findOne({
            where: {
                address:  req.body.destinationAddress, //destination address
            },
        });
        if (existDestination) {
            res.status(200).json({
                result: {
                    "uuid": existDestination.uuid,
                }
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

    if (!isRunebaseAddress(req.body.destinationAddress) && type === 1) {
        console.log(`Invalid Runebase Address ${reqInfo}`);
        logger.debug(`Invalid Runebase Address ${reqInfo}`);
        res.status(500).send({
            error: 'Invalid Runebase Address',
          });
        return;
    }
    console.log('check1');
    console.log(req.body.destinationAddress);
    console.log(type);

    if (!utils.isAddress(req.body.destinationAddress) && type === 0) {
        console.log(`Invalid BSC Address ${reqInfo}`);
        logger.debug(`Invalid BSC Address ${reqInfo}`);
        res.status(500).send({
            error: 'Invalid BSC Address',
          });
        return;
    }

    if (type !== 0 && (type !== 1)) {
        console.log('Invalid Type');
        logger.debug(`Invalid Type ${reqInfo}`)
        res.status(500).send({
            error: 'Invalid Type',
          });
        return
    }

    //if (type === 0 && (amount <= process.env.MIN_SWAP)) {
    //    console.log('bad request');
    //    logger.debug(`Bad request ${reqInfo}`)
    //    res.status(500).send({
    //        error: 'Invalid Amount',
    //      });
    //    return
    // }

    if (type === 1 && (amount <= 100)) {
        console.log('bad request');
        logger.debug(`Bad request ${reqInfo}`)
        res.status(500).send({
            error: 'Invalid Amount',
          });
        return
    }

    console.log(req.body);

    console.log('insert swap');
    let newUUID = uuid.v4();
    await db.sequelize.transaction({
        isolationLevel: Transaction.ISOLATION_LEVELS.SERIALIZABLE,
      }, async (t) => {
        const activity = await db.instances.create({
            uuid: newUUID,
            amount: amount.toFixed(8),
            address: req.body.destinationAddress,
            depositAddress: type === 0 && RunebaseAddress ? RunebaseAddress : req.body.address,
            type,
          }, {
            transaction: t,
            lock: t.LOCK.UPDATE,
          });
        t.afterCommit(() => {
            logger.debug(`Completed ${reqInfo}: ${newUUID}`)
            res.status(200).json({
                result: {
                    "uuid": newUUID,
                }
            });
        });
      }).catch((err) => {
        console.log(`Failed to handle request '/create': ${err.message}`)
        logger.error(`Failed to handle request '/create': ${err.message}`)
        res.sendStatus(500);
        return;
      });
}

router.get('/calculateFees/:uuid', async function (req, res) {
    try {
        await calculateFees(req, res)
    } catch (error) {
        logger.error(`Failed ${req.path}: ${error}`)
        res.sendStatus(500)
    }
});

async function calculateFees(req, res) {
    const reqInfo = req.path
    logger.debug(`Got ${reqInfo}`)
    if (!uuid.validate(req.params.uuid)) {
        logger.debug(`Bad request ${reqInfo}`)
        res.sendStatus(400);
        return
    }
    let sql = "SELECT address, amount FROM `swaps` WHERE `uuid` = ? LIMIT 1;";
    db.promise().execute(sql, [req.params.uuid])
        .then(async ([data, fields]) => {
            if (!data[0]) {
                logger.debug(`Not found ${reqInfo}`)
                res.sendStatus(404);
                return
            }
            logger.debug(`Completed ${reqInfo}`)

            res.status(200).json({
                result: await bsc.calculateFees(data[0].address, data[0].amount)
            })
        })
        .catch(err => {
            logger.error(`Failed ${reqInfo}: ${err}`)
            res.sendStatus(500);
        });
}

module.exports = router;