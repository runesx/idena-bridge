const {
        Transaction,
        privateKeyToAddress
    } = require('./script.js'),
    axios = require("axios"),
    fs = require('fs');
require('dotenv').config();

exports.send = async function (address, amount) {
    try {
        let epoch = await getEpoch();
        let nonce = await getNonce(epoch);
        if (nonce !== null && epoch !== null) {
            amount = parseFloat(amount) - parseFloat(process.env.IDENA_FIXED_FEES)
            const tx = await new Transaction(
                nonce,
                epoch,
                0,
                address,
                amount * 10 ** 18,
                0.5 * 10 ** 18,
                0 * 10 ** 18,
                Buffer.from("IDENA-TO-THE-MOON").toString('hex')
            );
            let apiResp = await axios.post(process.env.IDENA_PROVIDER, {
                "method": "bcn_sendRawTx",
                "id": 1,
                "key": process.env.IDENA_API_KEY,
                "params": [tx.sign(process.env.IDENA_PRIVATE_KEY).toHex()]
            })
            return {
                hash: apiResp.data.result,
                fees: parseFloat(process.env.IDENA_FIXED_FEES),
                errorMessage: apiResp.data.error && apiResp.data.error.message
            } || null;
        } else {
            return null
        }

    } catch (error) {
        console.log(error);
        return null
    }

}

async function getTransaction(tx) {
    try {
        let transaction = await axios.post(process.env.IDENA_PROVIDER, {
            "method": "bcn_transaction",
            "id": 1,
            "key": process.env.IDENA_API_KEY,
            "params": [tx]
        });
        return transaction.data.result || null
    } catch (error) {
        console.error("Failed to get idena transaction:", error);
        return null
    }
}

exports.isTxConfirmed = async function (tx) {
    try {
        let transaction = await getTransaction(tx);
        if (!transaction.timestamp) {
            return false
        }
        let bcn_block = await axios.post(process.env.IDENA_PROVIDER, {
            "method": "bcn_block",
            "id": 1,
            "key": process.env.IDENA_API_KEY,
            "params": [transaction.blockHash]
        })
        let bcn_syncing = await axios.post(process.env.IDENA_PROVIDER, {
            "method": "bcn_syncing",
            "id": 1,
            "key": process.env.IDENA_API_KEY,
            "params": []
        });
        return bcn_syncing.data.result.highestBlock > bcn_block.data.result.height + parseInt(process.env.IDENA_CONFIRMATIONS_BLOCKS) || false
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.isTxActual = async function (txHash, date) {
    try {
        const transaction = await getTransaction(txHash);
        return await isTxActual(transaction, date)
    } catch (error) {
        return false
    }
}

async function isTxActual(tx, date) {
    try {
        return new Date(tx.timestamp * 1000).getTime() >= date.getTime()
    } catch (error) {
        return false
    }
}

async function getEpoch() {
    try {
        let apiResp = await axios.post(process.env.IDENA_PROVIDER, {
            "method": "dna_epoch",
            "id": 1,
            "key": process.env.IDENA_API_KEY,
            "params": []
        })
        return apiResp.data.result.epoch;
    } catch (error) {
        return null
    }
}

async function getNonce(epoch) {
    try {
        if (fs.existsSync("./idena/nonce.json")) {
            const current = JSON.parse(fs.readFileSync('./idena/nonce.json'))
            let newEpoch = current.epoch
            let newNonce = current.nonce + 1;
            if (epoch > newEpoch) {
                newEpoch = epoch
                newNonce = 1
            }
            fs.writeFileSync("./idena/nonce.json", JSON.stringify({
                nonce: newNonce,
                epoch: newEpoch
            }), "utf8")
            return newNonce || null;
        } else {
            return null
        }
    } catch (error) {
        console.log(error);
        return null
    }
}

exports.isValidSendTx = async function (txHash, address, amount, date) {
    function extractDestAddress(payload) {
        try {
            const comment = Buffer.from(payload.substring(2), 'hex').toString()
            const prefix = "BSCADDRESS"
            if (comment.indexOf(prefix) !== 0) {
                return false
            }
            return comment.substring(prefix.length)
        } catch (error) {
            return false
        }
    }

    try {
        let transaction = await getTransaction(txHash);
        if (!transaction) {
            return false
        }
        const destAddress = extractDestAddress(transaction.payload)
        if (!destAddress || destAddress.toLowerCase() !== address.toLowerCase()) {
            return false
        }
        if (transaction.to !== privateKeyToAddress(process.env.IDENA_PRIVATE_KEY)) {
            return false
        }
        if (!(parseFloat(transaction.amount) >= parseFloat(amount))) {
            return false
        }
        if (transaction.type !== "send") {
            return false
        }
        if (transaction.timestamp && !await isTxActual(transaction, date)) {
            return false
        }
        return true
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.isTxExist = async function (txHash) {
    try {
        let transaction = await getTransaction(txHash);
        if (transaction) {
            return true
        } else {
            return false
        }
    } catch (error) {
        console.log(error);
        return false
    }
}

exports.getWalletAddress = function () {
    return privateKeyToAddress(process.env.IDENA_PRIVATE_KEY);
}
exports.isNewTx = async function (tx) {
    try {
        const [data] = await db.promise().execute("SELECT `id` FROM `used_txs` WHERE `tx_hash` = ? AND `blockchain` = 'idena';", [tx]);
        if (data[0]) {
            return false
        } else {
            return true
        }
    } catch (error) {
        return false
    }

}