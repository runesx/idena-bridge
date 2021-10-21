const BigNumber = require("bignumber.js");

const BN = BigNumber.clone({ DECIMAL_PLACES: 8 });

async function construct({ client, maximumAmount, limit, feeRate }) {
    let unspent = await client.listUnspent(1, 9999999, []);
    //unspent = unspent.filter(function( obj ) {
    //    return obj.address !== process.env.RUNEBASE_PROOF_OF_RESERVE;
    //  });
    
    console.log(unspent);
    console.log('listUnspend');
    const inputsTotal = unspent.length;

    if (unspent.length < 2) {
        console.log('Not Enough Unspent Transaction to consolidate');
        return;       
    }
    console.log('Done');
    if (limit) {
        unspent = unspent.slice(0, limit);
    }

    console.log("Output address:", process.env.RUNEBASE_PROOF_OF_RESERVE);
    let amount;
    let fee;
    let hex;
    let vsize;
    let start = 0;
    let end = unspent.length;
    let sliceTo = end;
    let success = false;

    console.info("Picking up maximum number of inputs...");
    while (!success) {
        let res;
        console.info(" trying:", sliceTo);
        const unspentSlice = unspent.slice(0, sliceTo);
        const inputs = unspentSlice.map((u) => ({
            txid: u.txid,
            vout: u.vout,
        }));
        amount = unspentSlice
            .reduce((prev, { amount }) => prev.plus(amount), new BN(0))
            .toNumber();
        const outputs = [{ [process.env.RUNEBASE_PROOF_OF_RESERVE]: amount }];

        try {
            const fR = new BN(feeRate).times(1024).div(1e8).toNumber();
            res = await client.walletCreateFundedPsbt(inputs, outputs, 0, {
                subtractFeeFromOutputs: [0],
                feeRate: fR,
            });
        } catch (e) {
            if (e.message === "Transaction too large") {
                end = sliceTo;
                sliceTo = start + Math.floor((end - start) / 2);
                continue;
            }
            console.error(e);
            throw e;
        }
        fee = res.fee;

        // signing psbt
        res = await client.walletProcessPsbt(res.psbt);
        if (!res.complete) {
            throw new Error("Error during walletprocesspsbt");
        }

        // converting psbt to hex
        res = await client.finalizePsbt(res.psbt);
        if (!res.complete) {
            throw new Error("Error during finalizePsbt");
        }
        hex = res.hex

        // checking tx vsize show be below 100000
        res = await client.decodeRawTransaction(hex);
        vsize = res.vsize
        if (vsize > 100000) {
            end = sliceTo;
            sliceTo = start + Math.floor((end - start) / 2);
            continue;
        }

        if (sliceTo === end || end - start <= 1) {
            console.log(" success");
            success = true;
        } else {
            start = sliceTo;
            sliceTo = start + Math.floor((end - start) / 2);
        }
    }

    console.log("Transaction created");

    const amountOutput = new BN(amount).minus(fee).toNumber();

    return {
        address: process.env.RUNEBASE_PROOF_OF_RESERVE,
        amountInput: amount,
        amountOutput,
        fee,
        hex,
        inputsUsed: sliceTo,
        inputsTotal,
    };
}

async function broadcast({ client, hex }) {
    console.log("Broadcasting transaction...");
    const txid = await client.sendRawTransaction(hex);
    console.log("Done!");
    return txid;
}

module.exports = {
    construct,
    broadcast,
};