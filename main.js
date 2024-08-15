const 
    { TOKEN, PORT } = require("./config/config"),
    express = require('express'),
    cors = require('cors'),
    { createServer } = require('http'),
    // { ShyftSdk, Network } = require("@shyft-to/js"),

    TelegramBot = require('node-telegram-bot-api'),
    axios = require("axios");
    bot = new TelegramBot(TOKEN, {polling: true});

const solPriceAPI = "https://price.jup.ag/v4/price?ids=SOL";
// const walletAddress = "4hBL4Z2Tvn2bCNqZniAxL82xviPJaTQeyKMdnLwsVt7L";
// const walletAddress = "5Sw3PQZyzPBYvqfor1orKFPdctpVPSBkm6Q6ECHjByno";
// const walletAddress = "EsYijj9xcWTiNmxeENQfhUf2p4TiKcgXS7yZgzFY2VmP";
let walletAddress;

let flagStart = false;

// const shyft = new ShyftSdk({
//     apiKey: 'A8R0rXh47xQVD7VF',
//     network: Network.Mainnet
// });

let solPrice, solBalance, solBalanceInUsd, WR, PL0, PL7, PL30, WR0, WR7, WR30, RoI0, RoI7, RoI30;
let pnl_lt_minus_dot5_num, pnl_minus_dot5_0x_num, pnl_lt_2x_num, pnl_2x_5x_num, pnl_gt_5x_num;
let last_active_timestamp;
let walletInfo = "";

const moneyBagEmoji = '\uD83C\uDF81'; // 💰
const gemEmoji = '\uD83D\uDC8E'; // 💎
const eyesEmoji = '\uD83D\uDC40'; // 👀
const rocketEmoji = '\uD83D\uDE80'; // 🚀

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

    walletInfo = "<code><b>" + walletAddress + "</b></code>";
    walletInfo += "\n\n";

    walletInfo += "- Wallet Details\n";
    walletInfo += "Sol Price: $" + solPrice + "\n";
    walletInfo += "Sol Balance: " + solBalance + ` ($${solBalanceInUsd}) \n`;
    walletInfo += "Win Rate: " + (WR * 100) + "%\n\n";

    walletInfo += "✅ Metric 1D\n";
    walletInfo += moneyBagEmoji + " P&L: " + "(+" + PL0 + "%)\n";
    walletInfo += gemEmoji + " RoI: " + "(+" + RoI0 + "%)\n\n";
    
    walletInfo += "✅ Metric 7D\n";
    walletInfo += moneyBagEmoji + " P&L: " + "(+" + PL7 + "%)\n";
    walletInfo += gemEmoji + " RoI: " + "(+" + RoI7 + "%)\n\n";
    
    walletInfo += "✅ Metric 30D\n";
    walletInfo += moneyBagEmoji + " P&L: " + "(+" + PL30 + "%)\n";
    walletInfo += gemEmoji + " RoI: " + "(+" + RoI30 + "%)\n\n";

    walletInfo += "✅ Wallet Activity/Volume\n";
    const dateTime = convertDateTime(last_active_timestamp);
    walletInfo += "Last Trade: " + dateTime + "\n\n";

    walletInfo += "✅ Tokens Result\n";
    walletInfo += " 🟢 "  + pnl_lt_minus_dot5_num;
    walletInfo += "    🔴 " + pnl_minus_dot5_0x_num;
    walletInfo += "    🎉 " + pnl_lt_2x_num;
    walletInfo += "    🔥 "  + pnl_2x_5x_num;
    walletInfo += "    🚀 " + pnl_gt_5x_num + "\n";
    walletInfo += "------------------------------------------------------\n";

    walletInfo += "  🟢 <code>[ ~ -50%]</code>\n";
    walletInfo += "  🔴 <code>[-50% ~ 0%]</code>\n";
    walletInfo += "  🎉 <code>[0% ~ 200%]</code>\n"; 
    walletInfo += "  🔥 <code>[200% ~ 500%]</code>\n"; 
    walletInfo += "  🚀 <code>[500% ~ ]</code>\n\n"; 

    walletInfo += "✅ Solscan\n";
    walletInfo += `  <a href="https://solscan.io/account/${walletAddress}">Solscan</a>\n\n`;
}

function calculatePriceAndBalance(res) {
    if (res.sol_balance) solBalance = res.sol_balance;
    else solBalance = "";

    solBalanceInUsd = solPrice * solBalance;
}

function calculatePL(res) {
    if (res.pnl) PL0 = res.pnl * 100;
    else PL0 = '';

    if (res.pnl_7d) PL7 = res.pnl_7d * 100;
    else PL7 = '';

    if (res.pnl_30d) PL30 = res.pnl_30d * 100;
    else PL30 = '';
}

function calculateWR(res) {
    WR = (res.winrate) ? res.winrate : "";

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

function calculateDistributions(res) {
    ({pnl_lt_minus_dot5_num, pnl_minus_dot5_0x_num, pnl_lt_2x_num, pnl_2x_5x_num, pnl_gt_5x_num, last_active_timestamp} = res);
}

function convertDateTime(ms) {
    const dateTime = new Date(ms);

    let day = String(dateTime.getUTCDate()).padStart(2, '0');
    let hours = String(dateTime.getUTCHours()).padStart(2, '0');
    let minutes = String(dateTime.getUTCMinutes()).padStart(2, '0');

    return day + "D " + hours + "H " + minutes + "M";
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
        let res = await axios.get(`https://gmgn.ai/defi/quotation/v1/smartmoney/sol/walletNew/${walletAddress}`);
        res = res.data.data;
        console.log(res);

        if (!res) {
            console.error("No API Data");
        } else {
            calculatePriceAndBalance(res);
            calculatePL(res);
            calculateWR(res);
            calculateRoI(res);
            calculateDistributions(res);
        }
    } catch (e) {
        console.error("Error Fetching Metric Data", e.message);
    }
}

const server = createServer(app);

server.listen(PORT, async () => {
    console.log('Server is listening');
});

async function getWalletInfo() {
    await fetchData();
    await getResult();
}

bot.on('message', async msg => {
    try {
      const chatId = msg.chat.id;
      
      const { text } = msg;
      const COMMANDS = text.toUpperCase();
        
      if (COMMANDS == "/START") {
            bot.sendMessage(
                chatId,
                "Please insert your wallet address.",
                {
                  parse_mode: 'HTML',
                }
            );
            flagStart = true;
        } else {
            if ( flagStart ) {
                flagStart = false;
                walletAddress = text.trim();

                bot.sendMessage(
                    chatId,
                    "Please wait for a sec",
                    {
                        parse_mode: 'HTML',
                    }
                );
                
                await getWalletInfo();
                
                bot.sendMessage(
                    chatId,
                    walletInfo,
                    {
                        parse_mode: 'HTML',
                    }
                );
            }
        }
    } catch (err) {
      console.error(err);
    }
  })