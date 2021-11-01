const express = require('express');

const app = express();
// const mysql = require('mysql2');
const cors = require('cors');
const bodyParser = require('body-parser');

const {
  formatUnits,
  parseUnits,
} = require("@ethersproject/units");

const { createServer } = require("http");
const io = require('socket.io');
// const idena = require('./idena');

const router = require('./routes');
const {
  startRunebaseEnv,
  waitRunebaseNodeSync,
  // listTransactions,
  // listUnspent,
  // sendToAddress,
} = require('./runebase/calls');

const {
  consolidate,
} = require('./runebase/consolidate');

app.use(cors());
app.use(bodyParser.json());

const httpServer = createServer(app);
const ioSocket = io(httpServer, {
  path: '/socket.io',
});

const sockets = {};

ioSocket.on("connection", async (socket) => {
  if (socket.handshake.query.customId) {
    sockets[socket.handshake.query.customId] = socket;
  }
  socket.on("disconnect", () => {
    delete sockets[socket.handshake.query.customId];
    console.log("Client disconnected");
  });
});

router(app, ioSocket);

const {
  patchRunebaseTransactions,
  checkSwaps,
} = require('./helpers/syncTransactions');

async function loopRunebaseTransactions() {
  await patchRunebaseTransactions(ioSocket, sockets);
  setTimeout(loopRunebaseTransactions, parseInt(process.env.CHECKING_DELAY, 10));
}

async function consolidateRunebase() {
  const consolidateNow = await consolidate();
}

async function loopConsolidateRunebase() {
  // console.log('loopcheckswapsstart');
  await consolidateRunebase();
  setTimeout(loopConsolidateRunebase, parseInt(process.env.CHECKING_DELAY, 10));
}

async function loopCheckSwaps() {
  // console.log('loopcheckswapsstart');
  await checkSwaps(ioSocket, sockets);
  setTimeout(loopCheckSwaps, parseInt(process.env.CHECKING_DELAY, 10));
}

async function start() {
  await startRunebaseEnv();
  await waitRunebaseNodeSync();
  loopCheckSwaps();
  loopRunebaseTransactions();
  loopConsolidateRunebase();
  const port = 8000;
  httpServer.listen(port, () => console.log(`Server started, listening on port: ${port}`));
}

start();
