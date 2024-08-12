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
const walletAddress = "86xCnPeV69n6t3DnyGvkKobf9FdN2H9oiVDdaMpo2MMY";
const shyft = new ShyftSdk({
    apiKey: 'A8R0rXh47xQVD7VF',
    network: Network.Mainnet
});

let solPrice, solBalance, solBalanceInUsd;

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

    const temp = await axios.get(`https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${walletAddress}`, {
        "period": "7d"
    });
    console.log(temp);
    

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