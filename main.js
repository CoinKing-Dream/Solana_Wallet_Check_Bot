const 
    config = require("./config/config"),
    express = require('express'),
    cors = require('cors'),
    { createServer } = require('http'),
    { ShyftSdk, Network } = require("@shyft-to/js"),

    TelegramBot = require('node-telegram-bot-api'),
    axios = require("axios");
    // bot = new TelegramBot(TOKEN, {polling: true});

const solPriceAPI = "https://price.jup.ag/v4/price?ids=SOL";
// const walletAddress = "5D6UYcnKqSHhYZUcezDaykATzu573bRM2QRurEUqQJp6";
const walletAddress = "5Sw3PQZyzPBYvqfor1orKFPdctpVPSBkm6Q6ECHjByno";
const shyft = new ShyftSdk({
    apiKey: 'A8R0rXh47xQVD7VF',
    network: Network.Mainnet
});

let solPrice, solBalance, solBalanceInUsd, PL0, PL7, PL30, WR0, WR7, WR30, RoI0, RoI7, RoI30;

const app = express();
app.use(cors());

function getResult() {
    console.log("Sol Price: ", solPrice);
    console.log("Sol Balance of Wallet: ", solBalance);
    console.log("Sol Balance of Wallet in USD: ", solBalanceInUsd);

    console.log("PnL0d:", PL0);
    console.log("PnL7d:", PL7);
    console.log("PnL30d:", PL30);

    console.log("WR0d:", WR0);
    console.log("WR7d:", WR7);
    console.log("WR30d:", WR30);

    console.log("RoI0d:", RoI0);
    console.log("RoI7d:", RoI7);
    console.log("RoI30d:", RoI30);
    
}

function calculatePL(res) {
    if (res.pnl) PL0 = res.pnl;
    else PL0 = 0;

    if (res.pnl_7d) PL7 = res.pnl_7d;
    else PL7 = 0;

    if (res.pnl_30d) PL30 = res.pnl_30d;
    else PL30 = 0;
}

function calculateWR(res) {
    const totalTrade0 = ((res.buy) ? res.buy : 0) + ((res.sell) ? res.sell : 0);
    const WinningTrade0 = ((res.buy) ? res.buy : 0) - ((res.sell) ? res.sell : 0);
    if (!totalTrade0) {
        WR0 = 0;
    } else {
        WR0 = WinningTrade0 / totalTrade0 * 100;
    }

    const totalTrade7 = ((res.buy_7d) ? res.buy_7d : 0) + ((res.sell_7d) ? res.sell_7d : 0);
    const WinningTrade7 = ((res.buy_7d) ? res.buy_7d : 0) - ((res.sell_7d) ? res.sell_7d : 0);
    if (!totalTrade7) {
        WR7 = 0;
    } else {
        WR7 = WinningTrade7 / totalTrade7 * 100;
    }

    const totalTrade30 = ((res.buy_30) ? res.buy_30 : 0) + ((res.sell_30) ? res.sell_30 : 0);
    const WinningTrade30 = ((res.buy_30) ? res.buy_30 : 0) - ((res.sell_30) ? res.sell_30 : 0);
    if (!totalTrade30) {
        WR30 = 0;
    } else {
        WR30 = WinningTrade30 / totalTrade30 * 100;
    }
}

function calculateRoI(res) {
    const initialValueInvestment0  = (res.sol_balance) ? res.sol_balance : 0 ;
    const finalValueInvestment0  = (res.realized_profit) ? res.realized_profit : 0;
    if (finalValueInvestment0) {
        RoI0 = (finalValueInvestment0 - initialValueInvestment0) / finalValueInvestment0 * 100;
    } else {
        RoI0 = 0;
    }

    const initialValueInvestment7  = (res.sol_balance) ? res.sol_balance : 0 ;
    const finalValueInvestment7  = (res.realized_profit_7d) ? res.realized_profit_7d : 0;
    if (finalValueInvestment7) {
        RoI7 = (finalValueInvestment7 - initialValueInvestment7) / finalValueInvestment7 * 100;
    } else  {
        RoI7 = 0;
    }

    const initialValueInvestment30  = (res.sol_balance) ? res.sol_balance : 0 ;
    const finalValueInvestment30  = (res.realized_profit_30d) ? res.realized_profit_30d : 0;
    if (finalValueInvestment30) {
        RoI30 = (finalValueInvestment30 - initialValueInvestment30) / finalValueInvestment30 * 100;
    } else {
        RoI30 = 0;
    }
}

async function fetchData() {
    try {
        const res = await axios.get(solPriceAPI);
        if (!res.data || !res.data.data.SOL || !res.data.data.SOL.price) {
            console.error(`No Sol Price while Fetching`);
        } else {
            solPrice = res.data.data.SOL.price;
        }
    } catch (e) {
        console.error(`Error Fetching Sol Price: ${e.message}`);
    }

    try {
        solBalance = await shyft.wallet.getBalance({
            wallet: walletAddress
        });
        
        if (solBalance == NaN) {
            console.error('Error Sol Balance of Wallet');
        } else  {
            solBalanceInUsd = solBalance * solPrice;
        }
    } catch (e) {
        console.error('Error Fetching Sol Balance of Wallet: ', e.message);
    }

    try {
        let res = await axios.get(`https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${walletAddress}`);
        res = res.data.data;
        console.log(res);

        if (!res) {
            console.error("No Metric Data");
        } else {
            calculatePL(res);
            calculateWR(res);
            calculateRoI(res);
        }
        
    } catch (e) {
        console.error("Error Fetching Metric Data", e.message);
    }
}

const server = createServer(app);

server.listen(config.PORT, async () => {
    console.log('server is listening');

    await fetchData();
    await getResult();
});


// bot.on('message', async msg => {
//     try {
//       const chatId = msg.chat.id;
//       const userId = msg.from.id;
      
//       const { text } = msg;
//       const COMMANDS = text.toUpperCase();
      
//       if (!text) return;
  
//       switch (COMMANDS) {
//         case '/START':
//           bot.sendMessage(
//             chatId,
//             `Let's get started!\n\nWhat is your RuneForce username?`,
//             {
//               parse_mode: 'HTML',
//             }
//           );
//           break;
//         default:
//           handleUsername(bot, chatId, userId, text);
//       }
//     } catch (err) {
//       console.error(err);
//     }
//   })