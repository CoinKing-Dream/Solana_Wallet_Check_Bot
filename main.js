const 
    config = require("./config/config"),
    express = require('express'),
    cors = require('cors'),
    http = require('http'),
    TelegramBot = require('node-telegram-bot-api'),
    axios = require("axios");
    // bot = new TelegramBot(TOKEN, {polling: true});
const solPriceAPI = "https://api.coingecko.com/api/v3/simple/price?ids=solana&vs_currencies=usd";
let solPrice;

const app = express();
app.use(cors());

async function fetchData() {
    solPrice = (await axios.get(solPriceAPI)).data.solana.usd;

    console.log(config.TOKEN);
    console.log(solPrice);
}
fetchData();

const server = http.createServer(app);
server.listen(process.env.PORT, () => {
    console.log('server is listening');
});
