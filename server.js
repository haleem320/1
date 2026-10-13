/**
 * 🤖 د MEXC فیوچرز ۱۰۰٪ خوندي او پرمختللی اتوماتیک بوټ
 * 📈 ستراتیژي: EMA 50/200 + MACD + ATR
 * 🛡️ امنیتي سیسټم: د پرانیستلو معاملو چک کول + اتوماتیک سټاپ لاس او ټیک پرافټ په صرافۍ کې
 * 💵 مالي مدیریت: ۵ ډالر مارجن د ۱۲ایکس لیوریج سره (مجموعي معامله ۶۰ ډالره)
 */

const axios = require('axios');
const crypto = require('crypto');

// 🔐 د ریلوی د چاپیریال له لارې د حساسو کیلي ګانو لوستل
const API_KEY = process.env.MEXC_API_KEY;
const SECRET_KEY = process.env.MEXC_SECRET_KEY;
const BASE_URL = "https://mexc.com"; 

const SYMBOL = "BTC_USDT"; 
const LEVERAGE = 12;         // ⚡ ۱۲ ایکس لیوریج
const POSITION_VALUE = 60;   // 📊 د ۶۰ ډالرو مجموعي معامله (۵ ډالر مارجن * ۱۲)

if (!API_KEY || !SECRET_KEY) {
    console.error("❌ تېروتنه: مهرباني وکړئ په Railway کې MEXC_API_KEY او MEXC_SECRET_KEY تنظیم کړئ!");
    process.exit(1);
}

// 🛡️ د ډیجیټل امضا (Signature) جوړول
function generateSignature(timestamp, method, requestPath, queryString = "", body = "") {
    const message = timestamp + method + requestPath + queryString + body;
    return crypto.createHmac('sha256', SECRET_KEY).update(message).digest('hex');
}

// 🌐 صرافۍ ته د درخواست لیږلو خوندي فنکشن
async function sendPrivateRequest(method, path, data = {}) {
    const timestamp = Date.now().toString();
    let body = method === "POST" ? JSON.stringify(data) : "";
    let query = method === "GET" ? new URLSearchParams(data).toString() : "";
    
    const signature = generateSignature(timestamp, method, path, query, body);
    const url = BASE_URL + path + (query ? "?" + query : "");

    try {
        const response = await axios({
            method: method,
            url: url,
            data: method === "POST" ? body : null,
            headers: {
                'MX-API-KEY': API_KEY,
                'Request-Time': timestamp,
                'Signature': signature,
                'Content-Type': 'application/json'
            }
        });
        return response.data;
    } catch (error) {
        console.error(`❌ په API غوښتنه کې تېروتنه (${path}):`, error.response ? error.response.data : error.message);
        return null;
    }
}

// 🔍 د دې خبرې تایید چې ایا ستاسو په حساب کې د BTC خلاصه معامله شته که نه
async function hasOpenPosition() {
    const path = "/api/v1/private/position/open_positions";
    const result = await sendPrivateRequest("GET", path, { symbol: SYMBOL });
    
    if (result && result.success && result.data && result.data.length > 0) {
        const position = result.data.find(p => p.symbol === SYMBOL);
        if (position && parseFloat(position.holdVol) > 0) {
            return true;
        }
    }
    return false;
}

// 📊 د بازار د معلوماتو او انډیکیټرونو تحلیل
async function getMarketIndicators() {
    const path = "/api/v1/contract/kline/" + SYMBOL;
    const params = { interval: "Min15", limit: 300 }; 
    
    try {
        const url = BASE_URL + path + "?" + new URLSearchParams(params).toString();
        const response = await axios.get(url);
        if (!response.data || !response.data.success) return null;
        
        const klines = response.data.data;
        const closePrices = klines.map(k => parseFloat(k.close));

        const calculateEMA = (prices, period) => {
            let k = 2 / (period + 1);
            let ema = prices;
            for (let i = 1; i < prices.length; i++) {
                ema = prices[i] * k + ema * (1 - k);
            }
            return ema;
        };

        const ema50 = calculateEMA(closePrices, 50);
        const ema200 = calculateEMA(closePrices, 200);

        const ema12 = calculateEMA(closePrices, 12);
        const ema26 = calculateEMA(closePrices, 26);
        const macdLine = ema12 - ema26;
        const signalLine = calculateEMA([macdLine], 9); 

        let totalRange = 0;
        for (let i = klines.length - 14; i < klines.length; i++) {
            totalRange += (parseFloat(klines[i].high) - parseFloat(klines[i].low));
        }
        const atr = totalRange / 14;
        const currentPrice = closePrices[closePrices.length - 1];

        return { currentPrice, ema50, ema200, macdLine, signalLine, atr };
    } catch (error) {
        console.error("❌ د ډیټا په ترلاسه کولو کې تېروتنه:", error.message);
        return null;
    }
}

// ⚡ د ستراتیژۍ عملي کول او د غوښتل شوي حجم محاسبه
async function executeStrategy() {
    console.log(`🔄 [${new Date().toLocaleTimeString()}] د مارکیټ تحلیل په جریان کې دی...`);
    
    const isBusy = await hasOpenPosition();
    if (isBusy) {
        console.log("⏳ ستاسو په حساب کې له مخکې څخه د BTC معامله خلاصه ده. د نوې معاملې مخنیوی وشو.");
        return;
    }

    const data = await getMarketIndicators();
    if (!data) return;

    const { currentPrice, ema50, ema200, macdLine, signalLine, atr } = data;

    const isBullishTrend = currentPrice > ema200 && ema50 > ema200;
    const isBearishTrend = currentPrice < ema200 && ema50 < ema200;

    let calculatedVol = (POSITION_VALUE / currentPrice).toFixed(4); 
    const stopLossDistance = atr * 1.5; 

    // ↗️ د LONG پرانیستلو سیګنال
    if (isBullishTrend && macdLine > signalLine) {
        const stopLossPrice = (currentPrice - stopLossDistance).toFixed(2);
        const takeProfitPrice = (currentPrice + (stopLossDistance * 1.5)).toFixed(2);

        console.log(`🚀 د LONG معامله پرانیستل کیږي. حجم: ${calculatedVol} | SL: ${stopLossPrice} | TP: ${takeProfitPrice}`);
        
        const orderData = {
            symbol: SYMBOL,
            price: "0", 
            vol: calculatedVol, 
            leverage: LEVERAGE,
            side: 1,    
            type: 1,    
            openType: 1, 
            stopLoss: stopLossPrice,      
            takeProfit: takeProfitPrice   
        };

        await sendPrivateRequest("POST", "/api/v1/private/order/submit", orderData);
    } 
    // ↘️ د SHORT پرانیستلو سیګنال
    else if (isBearishTrend && macdLine < signalLine) {
        const stopLossPrice = (currentPrice + stopLossDistance).toFixed(2);
        const takeProfitPrice = (currentPrice - (stopLossDistance * 1.5)).toFixed(2);

        console.log(`📉 د SHORT معامله پرانیستل کیږي. حجم: ${calculatedVol} | SL: ${stopLossPrice} | TP: ${takeProfitPrice}`);
        
        const orderData = {
            symbol: SYMBOL,
            price: "0",
            vol: calculatedVol,
            leverage: LEVERAGE,
            side: 3,    
            type: 1,
            openType: 1,
            stopLoss: stopLossPrice,      
            takeProfit: takeProfitPrice   
        };

        await sendPrivateRequest("POST", "/api/v1/private/order/submit", orderData);
    } else {
        console.log("⏳ سیګنال شتون نلري، مارکیټ په ارامه بڼه څارل کېږي.");
    }
}

// بوټ په هرو ۵ دقیقو کې یو ځل بازار چک کوي
setInterval(executeStrategy, 5 * 60 * 1000);
executeStrategy();

const http = require('http');
http.createServer((req, res) => { res.end("🤖 بوټ فعال دی!"); }).listen(process.env.PORT || 3000);
