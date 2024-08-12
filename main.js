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
const walletAddress = "5D6UYcnKqSHhYZUcezDaykATzu573bRM2QRurEUqQJp6";
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
        const res = await axios.get(`https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${walletAddress}`);
        console.log(res.data);
        if (!res.data) {
            console.error("No Metric Data");
        } else {
            if (res.data.pnl) PL0 = res.data.pnl;
            else PL0 = 0;

            if (res.data.pnl_7d) PL7 = res.data.pnl_7d;
            else PL7 = 0;

            if (res.data.pnl_30d) PL30 = res.data.pnl_30d;
            else PL30 = 0;

            const totalTrade0 = ((res.data.buy) ? res.data.buy : 0) + ((res.data.sell) ? res.data.sell : 0);
            const WinningTrade0 = ((res.data.buy) ? res.data.buy : 0) - ((res.data.sell) ? res.data.sell : 0);
            if (!totalTrade0) {
                WR0 = 0;
            } else {
                WR0 = WinningTrade0 / totalTrade0 * 100;
            }

            const totalTrade7 = ((res.data.buy_7d) ? res.data.buy_7d : 0) + ((res.data.sell_7d) ? res.data.sell_7d : 0);
            const WinningTrade7 = ((res.data.buy_7d) ? res.data.buy_7d : 0) - ((res.data.sell_7d) ? res.data.sell_7d : 0);
            if (!totalTrade7) {
                WR7 = 0;
            } else {
                WR7 = WinningTrade7 / totalTrade7 * 100;
            }

            const totalTrade30 = ((res.data.buy_30) ? res.data.buy_30 : 0) + ((res.data.sell_30) ? res.data.sell_30 : 0);
            const WinningTrade30 = ((res.data.buy_30) ? res.data.buy_30 : 0) - ((res.data.sell_30) ? res.data.sell_30 : 0);
            if (!totalTrade30) {
                WR30 = 0;
            } else {
                WR30 = WinningTrade30 / totalTrade30 * 100;
            }
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