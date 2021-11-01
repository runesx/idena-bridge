# wRUNES Bridge

### Runebase Node
```
testnet
bin/runebased --datadir=/home/app/aarunebase

//start runebase node

bin/runebased --datadir=/home/app/bridgeRunebaseDate &
runebase/src/runebased --datadir=/home/bago/bridgeRunebaseData &

//stop runebase node

//copy runebase.conf

bin/runebased --datadir=/home/app/bridgeRunebaseDate
```

### installation 
create .env file and fill these values
```
BSC_PRIVATE_KEY="" # The bridge wallet's privateKey in BSC blockchain
BSC_RPC="https://data-seed-prebsc-1-s1.binance.org:8545"  # the BSC RPC ( this one for testnet) -- for more rpc > https://docs.binance.org/smart-chain/developer/rpc.html
BSC_NETWORK=  # the BSC RPC
BSC_CONTRACT=""  # contract address
BSC_CONFIRMATIONS_BLOCKS=3 # confirmations required
BSC_FEES=150  # the fee percent of the real fees --  if BSC gonna charge 1 idna in USD then the bridge will substract 1.5 iDNA  before minting -- only applied for swaps type 0 
IDENA_PROVIDER="" # a private or public node can be used -- this field for the rpc url
IDENA_API_KEY=""  # the rpc key
IDENA_PRIVATE_KEY="" # The bridge wallet's privateKey in Idena blockchain
MIN_SWAP=10 # Min amount that can be swapped
IDENA_CONFIRMATIONS_BLOCKS=3 # confirmations required
IDENA_FIXED_FEES=1 # Fixed fees in iDNA ( this only gets applied for type 1 > from BSC to IDENA)
CHECKING_DELAY=5000 # the delay between each checking (a function checks if there is a pending Swaps ...)
# mysql db configuration
DB_HOST=""
DB_NAME=""
DB_PASS=""
DB_HOST=""
DB_USERNAME=""
```

Then execute ```node install.js```
This will recreate the db table

This can be skipped if u already created the db table 

To start the bridge backend execute this ```npm start```
Notice : start only 1 instance and do not use pm2 ( because of the checker function)


This bridge allows swapping from Idena blockchain to BSC and the opposite
It Checks every specified time if there is a pending swaps and then it checks what happened to it's Tx
see index.js > checkSwaps function

Features list :
1. local nonce for idena blockchain wallet
2. Dynamic fees for Bsc Txs and preset fees for idena 
3. Checking for most of the parameters that the user can send to the API
4. Creating Txs locally instead of using an idena node rpc directly for sending
5. Many more that are not written here :)
