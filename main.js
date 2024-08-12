const 
    config = require("./config/config"),
    express = require('express'),
    cors = require('cors'),
    {createServer} = require('http'),
    TelegramBot = require('node-telegram-bot-api'),
    axios = require("axios");
    // bot = new TelegramBot(TOKEN, {polling: true});
const solPriceAPI = "https://price.jup.ag/v4/price?ids=SOL";
let solPrice;

const app = express();
app.use(cors());

function getResult() {
    console.log("Sol Price: ", solPrice);
}

async function fetchData() {
    try {
        const res = await axios.get(solPriceAPI);
        if (!res.data || !res.data.data.SOL || !res.data.data.SOL.price) {
            console.error(`No Sol Price while Fetching: ${e.message}`);
        } else {
            solPrice = res.data.data.SOL.price;
        }
    } catch (e) {
        console.error(`Error Fetching Sol Price: ${e.message}`);
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