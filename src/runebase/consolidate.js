#!/usr/bin/env node
require('dotenv').config();
const Client = require("bitcoin-core");

const { construct, broadcast } = require("./cutxo");

export const consolidate = async () => {    
    const client = new Client({
        port: 9432,
        username: process.env.RPC_USER,
        password: process.env.RPC_PASS,
    });
    try {
        await client.ping();
    } catch (e) {
        console.log('Unable to ping node');
        return;
    }
    let tx;
        
    try {
        tx = await construct({
            client,
            maximumAmount: 1000,
            limit: 50,
            feeRate: 1000,
        });
    } catch (e) {
        console.error("Constructing transaction error");
        console.error(e.toString());
        return;
    }

    if (tx) {
        console.log("Number of inputs:", tx.inputsUsed);
        console.log("Inputs total amount:", tx.amountInput);
        console.log("Output amount:", tx.amountOutput);
        console.log("Fee:", tx.fee);
        console.log("Output address:", tx.address);

        try {
            const txid = await broadcast({ client, hex: tx.hex });
            console.info(txid);
        } catch (e) {
            console.error("Broadcasting transaction error");
            console.error(e.toString());
        }
    }   
};

