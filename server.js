const express = require("express");
const crypto = require("crypto");
const fs = require("fs");
const path = require("path");

const app = express();
app.use(express.json());

// ============================================================
// VERSION
// ============================================================
const BOT_VERSION = "34.9.2-robust-pullback-entry";

// ============================================================
// CORE CONFIG
// ============================================================
const PORT = Number(process.env.PORT || 8080);
const BOT_ADMIN_TOKEN = String(process.env.BOT_ADMIN_TOKEN || "").trim();
const BOT_STATE_FILE = process.env.BOT_STATE_FILE || path.join(process.env.RAILWAY_VOLUME_MOUNT_PATH || ".", "bot-state-v34.json");
const BOT_TIMEZONE = String(process.env.BOT_TIMEZONE || "Asia/Kabul");

const SMART_PULLBACK_PROFILE = String(process.env.SMART_PULLBACK_PROFILE ?? "true").toLowerCase() === "true";

const MIN_RISK_REWARD = Math.max(0.5, Number(process.env.MIN_RISK_REWARD || 1.05));
const MIN_SIGNAL_SCORE = Math.max(50, Math.min(100, Number(process.env.MIN_SIGNAL_SCORE || (SMART_PULLBACK_PROFILE ? 68 : 78))));
const MIN_SCORE_EDGE = Math.max(0, Number(process.env.MIN_SCORE_EDGE || (SMART_PULLBACK_PROFILE ? 3 : 8)));
const BASE_URL = "https://api.mexc.com";

const ACCESS_KEY = process.env.MEXC_ACCESS_KEY || "";
const SECRET_KEY = process.env.MEXC_SECRET_KEY || "";

const SYMBOL = process.env.DEFAULT_SYMBOL || "SOL_USDT";
const INTERVAL = process.env.INTERVAL || "Min15";
const MAX_ORDER_USDT = Number(process.env.MAX_ORDER_USDT || 5);
const ADAPTIVE_ORDER_SIZE = String(process.env.ADAPTIVE_ORDER_SIZE ?? "true").toLowerCase() === "true";
const ORDER_BALANCE_RESERVE_USDT = Math.max(0.05, Number(process.env.ORDER_BALANCE_RESERVE_USDT || 0.20));
const MIN_ADAPTIVE_ORDER_USDT = Math.max(0.50, Number(process.env.MIN_ADAPTIVE_ORDER_USDT || 1.50));

const FALLBACK_SYMBOLS = String(
  process.env.TRADING_SYMBOLS || "BTC_USDT,ETH_USDT,BNB_USDT,SOL_USDT,XRP_USDT"
).split(",").map(s => s.trim().toUpperCase()).filter(Boolean);
const CORE_SYMBOLS = Array.from(new Set(FALLBACK_SYMBOLS));

const SYMBOL_LIMIT = 0;

// SCAN_BATCH_SIZE = symbols deep-analyzed per cycle. List rotates; full
// active USDT-perp universe is covered over multiple cycles. Default 300
// so small universes fit entirely in one cycle.
const SCAN_BATCH_SIZE = Math.max(50, Math.min(2000, Number(process.env.SCAN_BATCH_SIZE || 300)));
const FAST_SCAN_CONCURRENCY = Math.max(4, Math.min(24, Number(process.env.FAST_SCAN_CONCURRENCY || 12)));
const DEEP_SCAN_CANDIDATES = Math.max(20, Math.min(120, Number(process.env.DEEP_SCAN_CANDIDATES || 60)));
const SCAN_SYMBOLS = SCAN_BATCH_SIZE;
const UNIVERSE_MIN_24H_USDT = Math.max(0, Number(process.env.UNIVERSE_MIN_24H_USDT || 0));
const UNIVERSE_REFRESH_TTL_MS = Math.max(60 * 1000, Number(process.env.UNIVERSE_REFRESH_TTL_MS || 5 * 60 * 1000));

const ADX_MIN = Math.max(10, Number(process.env.ADX_MIN || 18));
const VOLUME_MULTIPLIER = Math.max(0.75, Number(process.env.VOLUME_MULTIPLIER || 1.15));

const BREAKOUT_LOOKBACK = Math.max(5, Number(process.env.BREAKOUT_LOOKBACK || 20));
const BREAKOUT_BUFFER_PCT = Math.max(0, Number(process.env.BREAKOUT_BUFFER_PCT || 0.0005));
const BREAKOUT_VOLUME_MULTIPLIER = Math.max(1, Number(process.env.BREAKOUT_VOLUME_MULTIPLIER || (SMART_PULLBACK_PROFILE ? 1.08 : 1.5)));
const BREAKOUT_MIN_BODY_ATR = Math.max(0.05, Number(process.env.BREAKOUT_MIN_BODY_ATR || (SMART_PULLBACK_PROFILE ? 0.20 : 0.35)));
const BREAKOUT_MIN_BODY_RATIO = Math.max(0.20, Math.min(0.95, Number(process.env.BREAKOUT_MIN_BODY_RATIO || (SMART_PULLBACK_PROFILE ? 0.30 : 0.45))));
const BREAKOUT_CLOSE_LOCATION_MIN = Math.max(0.50, Math.min(0.98, Number(process.env.BREAKOUT_CLOSE_LOCATION_MIN || (SMART_PULLBACK_PROFILE ? 0.60 : 0.70))));
const BREAKOUT_MAX_EXTENSION_ATR = Math.max(0.25, Number(process.env.BREAKOUT_MAX_EXTENSION_ATR || (SMART_PULLBACK_PROFILE ? 1.25 : 0.75)));
const BREAKOUT_MIN_SCORE = Math.max(50, Math.min(100, Number(process.env.BREAKOUT_MIN_SCORE || (SMART_PULLBACK_PROFILE ? 65 : 70))));
const BREAKOUT_REQUIRE_VOLUME = String(process.env.BREAKOUT_REQUIRE_VOLUME ?? "true").toLowerCase() === "true";
const REQUIRE_BREAKOUT_RETEST = false;
const STRICT_BREAKOUT_RETEST_REQUIRED = false;

const EARLY_BREAKOUT_ENABLED = String(process.env.EARLY_BREAKOUT_ENABLED ?? "false").toLowerCase() === "true";
const EARLY_BREAKOUT_VOLUME_MULTIPLIER = Math.max(1, Number(process.env.EARLY_BREAKOUT_VOLUME_MULTIPLIER || 1.08));
const EARLY_BREAKOUT_MIN_BODY_ATR = Math.max(0.05, Number(process.env.EARLY_BREAKOUT_MIN_BODY_ATR || 0.15));
const EARLY_BREAKOUT_MIN_BODY_RATIO = Math.max(0.15, Math.min(0.90, Number(process.env.EARLY_BREAKOUT_MIN_BODY_RATIO || 0.25)));
const EARLY_BREAKOUT_CLOSE_LOCATION_MIN = Math.max(0.50, Math.min(0.95, Number(process.env.EARLY_BREAKOUT_CLOSE_LOCATION_MIN || 0.58)));
const EARLY_BREAKOUT_MAX_EXTENSION_ATR = Math.max(0.20, Number(process.env.EARLY_BREAKOUT_MAX_EXTENSION_ATR || 1.15));
const EARLY_BREAKOUT_MIN_SCORE = Math.max(50, Math.min(100, Number(process.env.EARLY_BREAKOUT_MIN_SCORE || 65)));

const ANALYSIS_TIMEFRAMES = ["Day1", "Hour8", "Hour6", "Hour4", "Min60", "Min15"];
const SR_LOOKBACK = Math.max(20, Number(process.env.SR_LOOKBACK || 50));

const NEWS_RISK_ENABLED = String(process.env.NEWS_RISK_ENABLED ?? "true").toLowerCase() === "true";
const NEWS_RISK_LOOKBACK_MINUTES = Math.max(15, Number(process.env.NEWS_RISK_LOOKBACK_MINUTES || 90));
const NEWS_BLOCK_RISK_SCORE = Math.max(1, Number(process.env.NEWS_BLOCK_RISK_SCORE || 2));
const NEWS_CACHE_TTL_MS = 5 * 60 * 1000;
const NEWS_FEEDS = (process.env.NEWS_RSS_FEEDS || "https://www.coindesk.com/arc/outboundfeeds/rss/|https://cointelegraph.com/rss")
  .split("|").map(s => s.trim()).filter(Boolean);
const NEWS_HIGH_RISK_TERMS = [
  "hack", "hacked", "exploit", "security breach", "bridge attack", "rug pull", "bankruptcy",
  "insolvency", "delisting", "delisted", "halt withdrawals", "withdrawals suspended", "frozen withdrawals",
  "liquidation", "liquidated", "lawsuit", "fraud", "stolen funds", "critical vulnerability", "depeg", "de-pegged"
];
const NEWS_MARKET_RISK_TERMS = ["exchange collapse", "exchange hacked", "market crash", "emergency halt", "trading suspended"];

const TARGET_LEVERAGE = Math.max(1, Math.min(12, Number(process.env.TARGET_LEVERAGE || 12)));
const CONFIGURED_OPEN_TYPE = Math.max(1, Math.min(2, Number(process.env.OPEN_TYPE || 1)));
const CONFIGURED_POSITION_MODE = Math.max(1, Math.min(2, Number(process.env.POSITION_MODE || 2)));
const STOP_LOSS_PCT = Number(process.env.STOP_LOSS_PCT || 0.02);
const CONFIGURED_TAKE_PROFIT_PCT = Number(process.env.TAKE_PROFIT_PCT || 0.02);
const FORCE_AUTO_STOP_LOSS = String(process.env.FORCE_AUTO_STOP_LOSS ?? "true").toLowerCase() === "true";
const MANUAL_STOP_LOSS = FORCE_AUTO_STOP_LOSS ? false : String(process.env.MANUAL_STOP_LOSS ?? "false").toLowerCase() === "true";
const TAKE_PROFIT_PCT = Math.max(0.02, Math.min(0.045, CONFIGURED_TAKE_PROFIT_PCT));
const ADAPTIVE_TP_ENABLED = String(process.env.ADAPTIVE_TP_ENABLED ?? "true").toLowerCase() === "true";
const ADAPTIVE_TP_START_PCT = TAKE_PROFIT_PCT;
const ADAPTIVE_TP_MAX_PCT = Math.max(TAKE_PROFIT_PCT, Math.min(0.15, Number(process.env.ADAPTIVE_TP_MAX_PCT || 0.15)));
const ADAPTIVE_TP_STEP_PCT = Math.max(0.005, Number(process.env.ADAPTIVE_TP_STEP_PCT || 0.02));
const ADAPTIVE_TP_EXTEND_TRIGGER_PCT = Math.max(0.015, Number(process.env.ADAPTIVE_TP_EXTEND_TRIGGER_PCT || 0.02));
const ADAPTIVE_TP_STRONG_ADX = Math.max(10, Number(process.env.ADAPTIVE_TP_STRONG_ADX || 20));
const ADAPTIVE_TP_STRONG_SLOPE_PCT = Math.max(0.0001, Number(process.env.ADAPTIVE_TP_STRONG_SLOPE_PCT || 0.0015));
const ADAPTIVE_TP_RSI_LONG_MAX = Math.min(90, Number(process.env.ADAPTIVE_TP_RSI_LONG_MAX || 76));
const ADAPTIVE_TP_RSI_SHORT_MIN = Math.max(10, Number(process.env.ADAPTIVE_TP_RSI_SHORT_MIN || 24));
const TARGET_FIRST_MIN_TP_PCT = ADAPTIVE_TP_START_PCT;
const TARGET_FIRST_MAX_TP_PCT = ADAPTIVE_TP_MAX_PCT;
const TARGET_FIRST_ATR_MULT = Math.max(0.25, Number(process.env.TARGET_FIRST_ATR_MULT || 1.00));

const REAL_TRADING_ENABLED = String(process.env.REAL_TRADING_ENABLED || "false").toLowerCase() === "true";
const AUTO_TRADING_ENABLED = String(process.env.AUTO_TRADING_ENABLED || "false").toLowerCase() === "true";

const AUTO_INTERVAL_MINUTES = Math.min(5, Math.max(1, Number(process.env.AUTO_INTERVAL_MINUTES || 5)));

const TRADE_MANAGER_ENABLED = String(process.env.TRADE_MANAGER_ENABLED ?? "true").toLowerCase() === "true";
const TRADE_MANAGER_INTERVAL_SECONDS = Math.max(5, Number(process.env.TRADE_MANAGER_INTERVAL_SECONDS || 10));
const AUTO_RUN_STALE_MS = Math.max(60 * 1000, Number(process.env.AUTO_RUN_STALE_MS || 8 * 60 * 1000));
const BREAK_EVEN_ENABLED = !MANUAL_STOP_LOSS && String(process.env.BREAK_EVEN_ENABLED ?? "true").toLowerCase() === "true";
const BREAK_EVEN_TRIGGER_PCT = Math.max(0, Number(process.env.BREAK_EVEN_TRIGGER_PCT || 0.020));
const BREAK_EVEN_OFFSET_PCT = Math.max(0, Number(process.env.BREAK_EVEN_OFFSET_PCT || 0.0015));
const TRAILING_STOP_ENABLED = !MANUAL_STOP_LOSS && String(process.env.TRAILING_STOP_ENABLED ?? "true").toLowerCase() === "true";
const TRAILING_TRIGGER_PCT = Math.max(0.02, Number(process.env.TRAILING_TRIGGER_PCT || 0.03));
const TRAILING_STOP_PCT = Math.max(0.001, Math.min(0.02, Number(process.env.TRAILING_STOP_PCT || 0.012)));
const MIN_STOP_DISTANCE_PCT = Math.max(0.0005, Number(process.env.MIN_STOP_DISTANCE_PCT || 0.001));

const POSITION_LIMIT_ENABLED = String(process.env.POSITION_LIMIT_ENABLED ?? "true").toLowerCase() === "true";
const MAX_OPEN_POSITIONS = Math.max(1, Math.min(3, Number(process.env.MAX_OPEN_POSITIONS || 3)));
const MAX_SAME_DIRECTION_POSITIONS = Math.max(1, Math.min(MAX_OPEN_POSITIONS, Number(process.env.MAX_SAME_DIRECTION_POSITIONS || 3)));
const MAX_PREFLIGHT_CANDIDATES = Math.max(5, Math.min(20, Number(process.env.MAX_PREFLIGHT_CANDIDATES || 15)));
const MAX_TRADES_PER_DAY = Math.max(1, Number(process.env.MAX_TRADES_PER_DAY || 50));
const ENTRY_COOLDOWN_MINUTES = 0;
const MAX_LOSS_STREAK = Math.max(1, Number(process.env.MAX_LOSS_STREAK || 3));
const LOSS_STREAK_COOLDOWN_MINUTES = 0;
const VOLATILITY_SPIKE_ATR_MULTIPLIER = Math.max(1.5, Number(process.env.VOLATILITY_SPIKE_ATR_MULTIPLIER || 2.5));
const LIQUIDITY_MIN_24H_USDT = Math.max(0, Number(process.env.LIQUIDITY_MIN_24H_USDT || 50000));
const MAX_SPREAD_PCT = Math.max(0.0001, Number(process.env.MAX_SPREAD_PCT || 0.003));

const ENTRY_SR_MIN_ROOM = Math.max(0.08, Math.min(0.50, Number(process.env.ENTRY_SR_MIN_ROOM || 0.20)));
const ENTRY_SR_BUFFER_ATR = Math.max(0.10, Number(process.env.ENTRY_SR_BUFFER_ATR || 0.25));
const ENTRY_MAX_DISTANCE_E21_ATR = Math.max(0.60, Number(process.env.ENTRY_MAX_DISTANCE_E21_ATR || 0.80));
const ENTRY_MIN_TP_ROOM_ATR = Math.max(0.10, Number(process.env.ENTRY_MIN_TP_ROOM_ATR || 0.25));
const PULLBACK_MAX_BARS_SINCE_TOUCH = Math.max(2, Number(process.env.PULLBACK_MAX_BARS_SINCE_TOUCH || 20));
const ENTRY_MAX_PULLBACK_DISTANCE_ATR = Math.max(0.25, Number(process.env.ENTRY_MAX_PULLBACK_DISTANCE_ATR || 1.50));
const ENTRY_MIN_PULLBACK_DEPTH_ATR = Math.max(0.30, Number(process.env.ENTRY_MIN_PULLBACK_DEPTH_ATR || 0.30));
const ENTRY_TRIGGER_MIN_PULLBACK_DEPTH_ATR = Math.max(0.25, Number(process.env.ENTRY_TRIGGER_MIN_PULLBACK_DEPTH_ATR || 0.30));
const ENTRY_TRIGGER_MAX_BARS = Math.max(2, Number(process.env.ENTRY_TRIGGER_MAX_BARS || (SMART_PULLBACK_PROFILE ? 10 : 20)));
const ENTRY_TRIGGER_MAX_DISTANCE_ATR = Math.max(0.25, Number(process.env.ENTRY_TRIGGER_MAX_DISTANCE_ATR || 0.90));
const ENTRY_TRIGGER_MIN_BODY_PCT = Math.max(0.10, Math.min(0.80, Number(process.env.ENTRY_TRIGGER_MIN_BODY_PCT || 0.15)));
const ENTRY_TRIGGER_MAX_WICK_PCT = Math.max(0.15, Math.min(0.80, Number(process.env.ENTRY_TRIGGER_MAX_WICK_PCT || 0.75)));
const ENTRY_MAX_IMPULSE_ATR = Math.max(1.5, Number(process.env.ENTRY_MAX_IMPULSE_ATR || 2.50));
const ENTRY_EXTREME_PROXIMITY_ATR = Math.max(0.25, Number(process.env.ENTRY_EXTREME_PROXIMITY_ATR || 0.60));
const ENTRY_MIN_REAL_PULLBACK_ATR = Math.max(0.30, Number(process.env.ENTRY_MIN_REAL_PULLBACK_ATR || 0.60));
const ENTRY_MAX_RETEST_AGE_BARS = Math.max(2, Number(process.env.ENTRY_MAX_RETEST_AGE_BARS || 6));
const REQUIRE_PULLBACK_ENTRY = false;
const ENTRY_SETUP_PULLBACK_MAX_BARS = Math.max(2, Number(process.env.ENTRY_SETUP_PULLBACK_MAX_BARS || 8));
const ENTRY_TRIGGER_PULLBACK_MAX_BARS = Math.max(2, Number(process.env.ENTRY_TRIGGER_PULLBACK_MAX_BARS || 6));
const ENTRY_PULLBACK_RECLAIM_BUFFER_PCT = Math.max(0.0002, Number(process.env.ENTRY_PULLBACK_RECLAIM_BUFFER_PCT || 0.0008));
const BREAKOUT_RETEST_LOOKBACK_5M = Math.max(2, Number(process.env.BREAKOUT_RETEST_LOOKBACK_5M || (SMART_PULLBACK_PROFILE ? 16 : 6)));
const BREAKOUT_RETEST_TOLERANCE_PCT = Math.max(0.001, Number(process.env.BREAKOUT_RETEST_TOLERANCE_PCT || (SMART_PULLBACK_PROFILE ? 0.0045 : 0.003)));
const PULLBACK_LOOKBACK = Math.max(6, Number(process.env.PULLBACK_LOOKBACK || 20));
const PULLBACK_TOUCH_TOLERANCE_PCT = Math.max(0.001, Number(process.env.PULLBACK_TOUCH_TOLERANCE_PCT || 0.012));
const PULLBACK_RECLAIM_BUFFER_PCT = Math.max(0.0001, Number(process.env.PULLBACK_RECLAIM_BUFFER_PCT || 0.0006));
const STRUCTURE_STOP_BUFFER_ATR = Math.max(0.05, Number(process.env.STRUCTURE_STOP_BUFFER_ATR || (SMART_PULLBACK_PROFILE ? 0.25 : 0.35)));
const STRUCTURE_STOP_MIN_PCT = Math.max(0.006, Number(process.env.STRUCTURE_STOP_MIN_PCT || (SMART_PULLBACK_PROFILE ? 0.008 : 0.01)));
const MAX_STRUCTURE_STOP_PCT = Math.max(STRUCTURE_STOP_MIN_PCT, Number(process.env.MAX_STRUCTURE_STOP_PCT || (SMART_PULLBACK_PROFILE ? 0.025 : 0.03)));
const PROTECTION_VERIFY_RETRIES = Math.max(4, Number(process.env.PROTECTION_VERIFY_RETRIES || 8));
const PROTECTION_VERIFY_DELAY_MS = Math.max(500, Number(process.env.PROTECTION_VERIFY_DELAY_MS || 1000));

// ============================================================
// MUTABLE STATE
// ============================================================
let ALLOWED_SYMBOLS = [...CORE_SYMBOLS];
let scanCursor = 0;
let scanCycle = 0;

let lastAutoRun = null;
let autoBusySince = 0;
let lastAutoResult = null;
let autoBusy = false;
const lastTradeSignalCandle = new Map();
let lastSuccessfulEntry = null;
let tradeManagerBusy = false;
let lastTradeManagerRun = null;
let lastTradeManagerResult = null;
let tradeManagerHistory = [];
let tradeRiskState = {
  day: "", tradesToday: 0, lastEntryAt: 0, lossStreak: 0, lastClosedAt: 0,
  lastObservedPositions: {}, countedClosedPositions: {}, startEquity: null, seeded: false
};
let stateLoaded = false;
let stateSaveTimer = null;
const btcHourlyCache = { time: 0, analysis: null };
let symbolUniverseCache = { time: 0, symbols: [], removed: [], source: "fallback", marketRanked: false };
let newsRiskCache = { time: 0, items: [], source: "rss", error: null };
let marketStatsCache = { time: 0, stats: {} };
let tradeStatsCache = { time: 0, key: "", value: null };
const TRADE_STATS_CACHE_TTL_MS = 60 * 1000;
const SYMBOL_UNIVERSE_TTL_MS = UNIVERSE_REFRESH_TTL_MS;

// ============================================================
// AUTH
// ============================================================
function authTokenFrom(req) {
  const header = String(req.get("x-bot-token") || "").trim();
  const auth = String(req.get("authorization") || "").trim();
  if (auth.toLowerCase().startsWith("bearer ")) return auth.slice(7).trim();
  return header;
}

function requireAdmin(req, res, next) {
  if (!BOT_ADMIN_TOKEN) {
    return res.status(503).json({ success: false, error: "BOT_ADMIN_TOKEN is required for protected trading actions" });
  }
  const supplied = authTokenFrom(req);
  const a = Buffer.from(supplied);
  const b = Buffer.from(BOT_ADMIN_TOKEN);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: "Unauthorized" });
  }
  next();
}

// ============================================================
// TIME
// ============================================================
function localDayKey(date = new Date()) {
  try {
    return new Intl.DateTimeFormat("en-CA", { timeZone: BOT_TIMEZONE, year: "numeric", month: "2-digit", day: "2-digit" }).format(date);
  } catch {
    return date.toISOString().slice(0, 10);
  }
}

// ============================================================
// PERSISTENT STATE
// ============================================================
function loadPersistentState() {
  if (stateLoaded) return;
  stateLoaded = true;
  try {
    if (!fs.existsSync(BOT_STATE_FILE)) return;
    const raw = JSON.parse(fs.readFileSync(BOT_STATE_FILE, "utf8"));
    if (raw && typeof raw === "object") tradeRiskState = { ...tradeRiskState, ...raw };
  } catch (e) {
    console.log("STATE LOAD WARNING", e.message);
  }
}

function savePersistentState() {
  loadPersistentState();
  clearTimeout(stateSaveTimer);
  stateSaveTimer = setTimeout(() => {
    try {
      fs.mkdirSync(path.dirname(path.resolve(BOT_STATE_FILE)), { recursive: true });
      const tmp = `${BOT_STATE_FILE}.tmp`;
      fs.writeFileSync(tmp, JSON.stringify(tradeRiskState, null, 2));
      fs.renameSync(tmp, BOT_STATE_FILE);
    } catch (e) {
      console.log("STATE SAVE WARNING", e.message);
    }
  }, 50);
}

function recordLoss() {
  resetDailyRiskState();
  tradeRiskState.lossStreak = Number(tradeRiskState.lossStreak || 0) + 1;
  tradeRiskState.lastClosedAt = Date.now();
  savePersistentState();
}

function recordWin() {
  resetDailyRiskState();
  tradeRiskState.lossStreak = 0;
  tradeRiskState.lastClosedAt = Date.now();
  savePersistentState();
}

// ============================================================
// UNIVERSE REFRESH
// ============================================================
async function refreshActiveSymbols(force = false) {
  if (!force && symbolUniverseCache.symbols.length && Date.now() - symbolUniverseCache.time < SYMBOL_UNIVERSE_TTL_MS) {
    return ALLOWED_SYMBOLS;
  }
  try {
    const [detailResult, tickerResult] = await Promise.allSettled([
      mexc("GET", "/api/v1/contract/detail", {}),
      mexc("GET", "/api/v1/contract/ticker", {})
    ]);
    const detailResp = detailResult.status === "fulfilled" ? detailResult.value : null;
    const tickerResp = tickerResult.status === "fulfilled" ? tickerResult.value : null;
    const rows = Array.isArray(detailResp?.data) ? detailResp.data : [];
    const tickers = Array.isArray(tickerResp?.data) ? tickerResp.data : [];

    marketStatsCache = {
      time: Date.now(),
      stats: Object.fromEntries(tickers.map(x => [String(x?.symbol || "").toUpperCase(), {
        amount24: num(x?.amount24) || 0,
        volume24: num(x?.volume24) || 0,
        lastPrice: num(x?.lastPrice) || 0,
        bid1: num(x?.bid1) || null,
        ask1: num(x?.ask1) || null,
        riseFallRate: num(x?.riseFallRate) || 0
      }]))
    };

    const activeSet = new Set(rows.filter(x => {
      const symbol = String(x?.symbol || "").toUpperCase();
      if (!symbol.endsWith("_USDT")) return false;
      const state = x?.state;
      return state === undefined || state === null || state === "" || Number(state) === 0;
    }).map(x => String(x.symbol).toUpperCase()));

    const tickerSymbols = tickers.map(x => String(x?.symbol || "").toUpperCase()).filter(s => s.endsWith("_USDT"));
    const universeSet = activeSet.size ? activeSet : new Set(tickerSymbols);

    const ranked = (tickers.length ? tickers : [...universeSet].map(symbol => ({ symbol })))
      .map(x => ({ symbol: String(x?.symbol || "").toUpperCase(), amount24: num(x?.amount24) || 0 }))
      .filter(x => universeSet.has(x.symbol))
      .filter(x => !UNIVERSE_MIN_24H_USDT || x.amount24 >= UNIVERSE_MIN_24H_USDT)
      .sort((a, b) => b.amount24 - a.amount24)
      .map(x => x.symbol);

    const next = ranked.length ? ranked : [...universeSet];
    if (next.length) {
      ALLOWED_SYMBOLS = next;
      scanCursor = scanCursor % ALLOWED_SYMBOLS.length;
      symbolUniverseCache = {
        time: Date.now(),
        symbols: ALLOWED_SYMBOLS,
        removed: CORE_SYMBOLS.filter(s => !universeSet.has(s)),
        source: "mexc-all-active-usdt-futures",
        marketRanked: true
      };
    }
    return ALLOWED_SYMBOLS.length ? ALLOWED_SYMBOLS : CORE_SYMBOLS;
  } catch (e) {
    return ALLOWED_SYMBOLS.length ? ALLOWED_SYMBOLS : CORE_SYMBOLS;
  }
}

// ============================================================
// NEWS
// ============================================================
function xmlEntities(text = "") {
  return String(text)
    .replace(/&amp;/g, "&").replace(/&lt;/g, "<").replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"').replace(/&#39;/g, "'");
}

function parseRssItems(xml) {
  const out = [];
  const blocks = String(xml).match(/<item[\s\S]*?<\/item>/gi) || [];
  for (const block of blocks) {
    const title = (block.match(/<title[\s\S]*?>([\s\S]*?)<\/title>/i)?.[1] || "").replace(/<!\[CDATA\[|\]\]>/g, "").trim();
    const pub = (block.match(/<(pubDate|published|updated)[^>]*>([\s\S]*?)<\/(pubDate|published|updated)>/i)?.[2] || "").trim();
    const link = (block.match(/<link[^>]*>([\s\S]*?)<\/link>/i)?.[1] || "").trim();
    const time = Date.parse(pub);
    if (title) out.push({ title: xmlEntities(title), link: xmlEntities(link), publishedAt: Number.isFinite(time) ? new Date(time).toISOString() : null, ts: Number.isFinite(time) ? time : Date.now() });
  }
  return out;
}

async function refreshNewsRisk(force = false) {
  if (!NEWS_RISK_ENABLED) return { riskScore: 0, items: [], blocked: false, enabled: false };
  if (!force && Date.now() - newsRiskCache.time < NEWS_CACHE_TTL_MS) return newsRiskCache;
  const items = [];
  let hadSuccess = false;
  for (const feed of NEWS_FEEDS) {
    try {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 7000);
      const res = await fetch(feed, { signal: controller.signal, headers: { "User-Agent": "MEXC-Futures-Bot-News-Risk/1.0" } });
      clearTimeout(timer);
      if (!res.ok) continue;
      const text = await res.text();
      items.push(...parseRssItems(text));
      hadSuccess = true;
    } catch {}
  }
  const cutoff = Date.now() - NEWS_RISK_LOOKBACK_MINUTES * 60 * 1000;
  const recent = items.filter(x => x.ts >= cutoff).slice(0, 80);
  let riskScore = 0;
  for (const item of recent) {
    const t = item.title.toLowerCase();
    if (NEWS_MARKET_RISK_TERMS.some(k => t.includes(k))) riskScore = Math.max(riskScore, 2);
    if (NEWS_HIGH_RISK_TERMS.some(k => t.includes(k))) riskScore = Math.max(riskScore, 2);
  }
  const result = {
    time: Date.now(), items: recent.slice(0, 30), riskScore, blocked: riskScore >= NEWS_BLOCK_RISK_SCORE,
    enabled: true, source: hadSuccess ? "rss" : "rss-unavailable",
    error: hadSuccess ? null : "No RSS feed could be read"
  };
  newsRiskCache = result;
  return result;
}

// ============================================================
// MEXC HTTP CLIENT
// ============================================================
function nowMs() { return Date.now(); }

const MEXC_MIN_REQUEST_GAP_MS = Math.max(40, Number(process.env.MEXC_MIN_REQUEST_GAP_MS || 110));
const MEXC_MAX_RETRIES = Math.max(1, Math.min(5, Number(process.env.MEXC_MAX_RETRIES || 4)));
let mexcRequestQueue = Promise.resolve();
let lastMexcRequestStart = 0;

function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function runMexcRequest(task) {
  const run = mexcRequestQueue.then(async () => {
    const wait = Math.max(0, MEXC_MIN_REQUEST_GAP_MS - (Date.now() - lastMexcRequestStart));
    if (wait) await sleep(wait);
    lastMexcRequestStart = Date.now();
    return task();
  });
  mexcRequestQueue = run.catch(() => {});
  return run;
}

const candleCache = new Map();
const CANDLE_CACHE_TTL_MS = { Min5: 15 * 1000, Min15: 10 * 60 * 1000, Min30: 15 * 60 * 1000, Min60: 30 * 60 * 1000, Hour4: 2 * 60 * 60 * 1000 };
const advancedSignalCache = new Map();
const ADVANCED_SIGNAL_CACHE_TTL_MS = 5 * 1000;

function sign(timestamp, params = "") {
  return crypto.createHmac("sha256", SECRET_KEY).update(ACCESS_KEY + String(timestamp) + params).digest("hex");
}

async function mexc(method, path, params = {}, privateReq = false) {
  let url = BASE_URL + path;
  let body = null;
  const headers = {};

  if (privateReq) {
    if (!ACCESS_KEY || !SECRET_KEY) throw new Error("MEXC API credentials are not configured");
    const timestamp = nowMs();
    let parameterString = "";
    if (method === "GET" || method === "DELETE") {
      const keys = Object.keys(params).sort();
      parameterString = keys
        .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== "")
        .map(k => `${k}=${params[k]}`).join("&");
      if (parameterString) url += "?" + parameterString;
    } else {
      parameterString = JSON.stringify(params);
      body = parameterString;
      headers["Content-Type"] = "application/json";
    }
    headers["ApiKey"] = ACCESS_KEY;
    headers["Request-Time"] = String(timestamp);
    headers["Signature"] = sign(timestamp, parameterString);
    headers["Recv-Window"] = "10000";
  } else if (method === "GET") {
    const qs = Object.keys(params)
      .filter(k => params[k] !== undefined && params[k] !== null && params[k] !== "")
      .map(k => `${encodeURIComponent(k)}=${encodeURIComponent(params[k])}`).join("&");
    if (qs) url += "?" + qs;
  }

  let lastError = null;
  for (let attempt = 0; attempt < MEXC_MAX_RETRIES; attempt++) {
    try {
      const res = await runMexcRequest(() => fetch(url, { method, headers, body }));
      const text = await res.text();
      let data;
      try { data = JSON.parse(text); } catch { data = { raw: text }; }

      const rateLimited = res.status === 429 || Number(data?.code) === 510 ||
        /requests are too frequent|rate limit|too many requests/i.test(String(data?.message || text));
      if (rateLimited) {
        lastError = new Error(`MEXC API rate limit (attempt ${attempt + 1}/${MEXC_MAX_RETRIES})`);
        if (attempt + 1 < MEXC_MAX_RETRIES) {
          await sleep(700 * (2 ** attempt) + Math.floor(Math.random() * 300));
          continue;
        }
        throw new Error(`MEXC API error code 510: Requests are too frequent after ${MEXC_MAX_RETRIES} retries`);
      }

      if (!res.ok || (data && data.success === false)) {
        const code = data?.code !== undefined ? ` code ${data.code}` : "";
        throw new Error(`MEXC API error${code}: ${data?.message || text}`);
      }
      return data;
    } catch (e) {
      lastError = e;
      if (attempt + 1 >= MEXC_MAX_RETRIES || !/rate limit|too frequent|429/i.test(String(e.message))) throw e;
      await sleep(700 * (2 ** attempt) + Math.floor(Math.random() * 300));
    }
  }
  throw lastError || new Error("MEXC API request failed");
}

// ============================================================
// CANDLES + INDICATORS
// ============================================================
function num(v) {
  const n = Number(v);
  return Number.isFinite(n) ? n : null;
}

function normalizeCandles(raw) {
  const data = raw?.data ?? raw;
  if (!data) return [];

  if (!Array.isArray(data) && typeof data === "object") {
    const times = data.time ?? data.t ?? data.timestamp ?? [];
    const opens = data.open ?? data.o ?? [];
    const highs = data.high ?? data.h ?? [];
    const lows = data.low ?? data.l ?? [];
    const closes = data.close ?? data.c ?? [];
    const volumes = data.vol ?? data.volume ?? data.v ?? [];
    if (Array.isArray(times) && Array.isArray(opens) && Array.isArray(highs) && Array.isArray(lows) && Array.isArray(closes)) {
      const n = Math.min(times.length, opens.length, highs.length, lows.length, closes.length);
      const out = [];
      for (let i = 0; i < n; i++) {
        const c = { time: num(times[i]), open: num(opens[i]), high: num(highs[i]), low: num(lows[i]), close: num(closes[i]), volume: num(volumes[i]) };
        if (c.open !== null && c.high !== null && c.low !== null && c.close !== null) out.push(c);
      }
      return out;
    }
  }

  if (!Array.isArray(data)) return [];
  return data.map(x => {
    if (Array.isArray(x)) {
      return { time: num(x[0]), open: num(x[1]), high: num(x[2]), low: num(x[3]), close: num(x[4]), volume: num(x[5]) };
    }
    return {
      time: num(x.time ?? x.t ?? x.timestamp),
      open: num(x.open ?? x.o),
      high: num(x.high ?? x.h),
      low: num(x.low ?? x.l),
      close: num(x.close ?? x.c),
      volume: num(x.volume ?? x.v)
    };
  }).filter(c => c.open !== null && c.high !== null && c.low !== null && c.close !== null);
}

function ema(values, period) {
  if (values.length < period) return null;
  const k = 2 / (period + 1);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  for (let i = period; i < values.length; i++) e = values[i] * k + e * (1 - k);
  return e;
}

function emaSeries(values, period) {
  if (values.length < period) return [];
  const k = 2 / (period + 1);
  const out = new Array(values.length).fill(null);
  let e = values.slice(0, period).reduce((a, b) => a + b, 0) / period;
  out[period - 1] = e;
  for (let i = period; i < values.length; i++) {
    e = values[i] * k + e * (1 - k);
    out[i] = e;
  }
  return out;
}

function rsi(values, period = 14) {
  if (values.length <= period) return null;
  let gains = 0, losses = 0;
  for (let i = 1; i <= period; i++) {
    const d = values[i] - values[i - 1];
    if (d >= 0) gains += d; else losses -= d;
  }
  let avgGain = gains / period, avgLoss = losses / period;
  for (let i = period + 1; i < values.length; i++) {
    const d = values[i] - values[i - 1];
    const gain = Math.max(d, 0);
    const loss = Math.max(-d, 0);
    avgGain = (avgGain * (period - 1) + gain) / period;
    avgLoss = (avgLoss * (period - 1) + loss) / period;
  }
  if (avgLoss === 0) return 100;
  return 100 - (100 / (1 + (avgGain / avgLoss)));
}

function atr(candles, period = 14) {
  if (candles.length <= period) return null;
  const trs = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
  }
  let a = trs.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < trs.length; i++) a = (a * (period - 1) + trs[i]) / period;
  return a;
}

function intervalMinutes(interval) {
  const text = String(interval || "Min5");
  const m = text.match(/Min(\d+)/i);
  if (m) return Number(m[1]);
  if (/^Hour4$/i.test(text)) return 240;
  if (/^Day1$/i.test(text)) return 1440;
  return 5;
}

function aggregateCandles(candles, minutes) {
  if (!Array.isArray(candles) || candles.length === 0 || !(minutes > 0)) return [];
  const bucketMs = minutes * 60 * 1000;
  const out = [];
  let cur = null;
  for (const raw of candles) {
    const t = Number(raw.time);
    if (!Number.isFinite(t)) continue;
    const bucket = Math.floor(t / bucketMs) * bucketMs;
    if (!cur || cur.time !== bucket) {
      cur = { time: bucket, open: Number(raw.open), high: Number(raw.high), low: Number(raw.low), close: Number(raw.close), volume: Number(raw.volume) || 0 };
      out.push(cur);
    } else {
      cur.high = Math.max(cur.high, Number(raw.high));
      cur.low = Math.min(cur.low, Number(raw.low));
      cur.close = Number(raw.close);
      cur.volume += Number(raw.volume) || 0;
    }
  }
  return out;
}

function higherTimeframeConsensus(biases) {
  const dirs = [biases.Day1, biases.Hour8, biases.Hour6, biases.Hour4];
  const long = dirs.filter(x => x === "LONG").length;
  const short = dirs.filter(x => x === "SHORT").length;
  if (long >= 3 && short === 0) return { direction: "LONG", aligned: long, opposite: short, score: long };
  if (short >= 3 && long === 0) return { direction: "SHORT", aligned: short, opposite: long, score: short };
  return { direction: "NEUTRAL", aligned: Math.max(long, short), opposite: Math.min(long, short), score: Math.max(long, short) };
}

async function getCandles(symbol = SYMBOL, interval = INTERVAL) {
  const key = `${symbol}:${interval}`;
  const ttl = CANDLE_CACHE_TTL_MS[interval] || 60 * 1000;
  const cached = candleCache.get(key);
  if (cached && Date.now() - cached.time < ttl) return cached.data;

  const mins = Math.max(1, intervalMinutes(interval));
  const end = Date.now();
  const bars = 500;
  const start = end - (bars + 10) * mins * 60 * 1000;
  const data = await mexc("GET", "/api/v1/contract/kline/" + symbol, {
    interval,
    start: Math.floor(start / 1000),
    end: Math.floor(end / 1000)
  });
  const candles = normalizeCandles(data).sort((a, b) => a.time - b.time);
  candleCache.set(key, { time: Date.now(), data: candles });
  return candles;
}

function sma(values, period) {
  if (values.length < period) return null;
  let sum = 0;
  for (let i = values.length - period; i < values.length; i++) sum += values[i];
  return sum / period;
}

function macd(values, fastPeriod = 12, slowPeriod = 26, signalPeriod = 9) {
  const ef = emaSeries(values, fastPeriod), es = emaSeries(values, slowPeriod);
  const line = values.map((_, i) => ef[i] !== null && es[i] !== null ? ef[i] - es[i] : null);
  const valid = line.filter(x => x !== null);
  if (valid.length < signalPeriod) return { line: null, signal: null, histogram: null };
  const sigSeries = emaSeries(valid, signalPeriod);
  const ml = line[line.length - 1];
  const sl = sigSeries[sigSeries.length - 1];
  return { line: ml, signal: sl, histogram: ml - sl };
}

function adx(candles, period = 14) {
  if (candles.length < period * 2 + 2) return null;
  const trs = [], plus = [], minus = [];
  for (let i = 1; i < candles.length; i++) {
    const c = candles[i], p = candles[i - 1];
    const up = c.high - p.high, down = p.low - c.low;
    trs.push(Math.max(c.high - c.low, Math.abs(c.high - p.close), Math.abs(c.low - p.close)));
    plus.push(up > down && up > 0 ? up : 0);
    minus.push(down > up && down > 0 ? down : 0);
  }
  let tr = trs.slice(0, period).reduce((a, b) => a + b, 0);
  let pd = plus.slice(0, period).reduce((a, b) => a + b, 0);
  let md = minus.slice(0, period).reduce((a, b) => a + b, 0);
  const dx = [];
  for (let i = period; i < trs.length; i++) {
    tr = tr - tr / period + trs[i];
    pd = pd - pd / period + plus[i];
    md = md - md / period + minus[i];
    const pdi = tr ? 100 * pd / tr : 0, mdi = tr ? 100 * md / tr : 0;
    dx.push((pdi + mdi) ? 100 * Math.abs(pdi - mdi) / (pdi + mdi) : 0);
  }
  if (dx.length < period) return null;
  let a = dx.slice(0, period).reduce((x, y) => x + y, 0) / period;
  for (let i = period; i < dx.length; i++) a = (a * (period - 1) + dx[i]) / period;
  return a;
}

function averageVolume(candles, period = 20) {
  const vols = candles.map(c => num(c.volume) || 0);
  return sma(vols, Math.min(period, vols.length));
}

function recentSupportResistance(candles, lookback = SR_LOOKBACK) {
  const n = Math.min(lookback, candles.length);
  const slice = candles.slice(-n);
  return { support: Math.min(...slice.map(c => c.low)), resistance: Math.max(...slice.map(c => c.high)) };
}

function basicDivergence(candles, period = 40) {
  const slice = candles.slice(-Math.min(period, candles.length));
  if (slice.length < 20) return { bullish: false, bearish: false };
  const closes = slice.map(c => c.close);
  const rsis = [];
  for (let i = 14; i < closes.length; i++) rsis.push(rsi(closes.slice(0, i + 1), 14));
  if (rsis.length < 8) return { bullish: false, bearish: false };
  const half = Math.floor(slice.length / 2);
  const oldPriceLow = Math.min(...closes.slice(0, half));
  const newPriceLow = Math.min(...closes.slice(half));
  const oldPriceHigh = Math.max(...closes.slice(0, half));
  const newPriceHigh = Math.max(...closes.slice(half));
  const oldRsi = sma(rsis.slice(0, Math.floor(rsis.length / 2)), Math.max(1, Math.floor(rsis.length / 2)));
  const newRsi = sma(rsis.slice(Math.floor(rsis.length / 2)), Math.max(1, rsis.length - Math.floor(rsis.length / 2)));
  return {
    bullish: newPriceLow < oldPriceLow && newRsi > oldRsi + 2,
    bearish: newPriceHigh > oldPriceHigh && newRsi < oldRsi - 2
  };
}

function slopePct(series, lookback = 5) {
  if (!Array.isArray(series) || series.length < lookback + 1) return null;
  const a = num(series[series.length - 1]);
  const b = num(series[series.length - 1 - lookback]);
  if (!(a > 0 && b > 0)) return null;
  return (a - b) / b;
}

function candleQuality(c) {
  if (!c) return { bodyPct: 0, upperWickPct: 0, lowerWickPct: 0, bullish: false, bearish: false };
  const range = Math.max(1e-12, c.high - c.low);
  const body = Math.abs(c.close - c.open);
  const upper = c.high - Math.max(c.open, c.close);
  const lower = Math.min(c.open, c.close) - c.low;
  return {
    bodyPct: body / range, upperWickPct: upper / range, lowerWickPct: lower / range,
    bullish: c.close > c.open, bearish: c.close < c.open
  };
}

// ============================================================
// CANDLESTICK PATTERNS
// ============================================================
function detectCandlestickPatterns(candles, direction) {
  const a = Array.isArray(candles) ? candles.filter(Boolean) : [];
  if (a.length < 5 || !["LONG", "SHORT"].includes(direction)) {
    return { confirmed: false, score: 0, patterns: [], primary: null, bullish: false, bearish: false, reason: "Not enough candles", matchingPatterns: [], oppositePatterns: [] };
  }
  const c = a[a.length - 1], p = a[a.length - 2], p2 = a[a.length - 3];
  const body = x => Math.abs(Number(x.close) - Number(x.open));
  const range = x => Math.max(1e-12, Number(x.high) - Number(x.low));
  const bullish = x => Number(x.close) > Number(x.open);
  const bearish = x => Number(x.close) < Number(x.open);
  const bodyPct = x => body(x) / range(x);
  const upper = x => Number(x.high) - Math.max(Number(x.open), Number(x.close));
  const lower = x => Math.min(Number(x.open), Number(x.close)) - Number(x.low);
  const closeLocLong = x => (Number(x.close) - Number(x.low)) / range(x);
  const closeLocShort = x => (Number(x.high) - Number(x.close)) / range(x);
  const pats = [];

  const engulfBull = bullish(c) && bearish(p) && Number(c.open) <= Number(p.close) && Number(c.close) >= Number(p.open) && body(c) >= body(p) * 1.05;
  const engulfBear = bearish(c) && bullish(p) && Number(c.open) >= Number(p.close) && Number(c.close) <= Number(p.open) && body(c) >= body(p) * 1.05;
  const hammer = bullish(c) && lower(c) >= body(c) * 1.8 && upper(c) <= Math.max(body(c) * 0.8, range(c) * 0.12) && closeLocLong(c) >= 0.62;
  const shooting = bearish(c) && upper(c) >= body(c) * 1.8 && lower(c) <= Math.max(body(c) * 0.8, range(c) * 0.12) && closeLocShort(c) >= 0.62;
  const bullHarami = bearish(p) && bullish(c) && Number(c.open) >= Math.min(Number(p.open), Number(p.close)) && Number(c.close) <= Math.max(Number(p.open), Number(p.close)) && body(c) <= body(p) * 0.65;
  const bearHarami = bullish(p) && bearish(c) && Number(c.open) >= Math.min(Number(p.open), Number(p.close)) && Number(c.close) <= Math.max(Number(p.open), Number(p.close)) && body(c) <= body(p) * 0.65;
  const tweezerBottom = Math.abs(Number(c.low) - Number(p.low)) / Math.max(1e-12, Number(p.low)) <= 0.0015 && bullish(c) && bearish(p);
  const tweezerTop = Math.abs(Number(c.high) - Number(p.high)) / Math.max(1e-12, Number(p.high)) <= 0.0015 && bearish(c) && bullish(p);
  const morningStar = bearish(p2) && bodyPct(p2) >= 0.45 && bodyPct(p) <= 0.35 && bullish(c) && Number(c.close) > (Number(p2.open) + Number(p2.close)) / 2;
  const eveningStar = bullish(p2) && bodyPct(p2) >= 0.45 && bodyPct(p) <= 0.35 && bearish(c) && Number(c.close) < (Number(p2.open) + Number(p2.close)) / 2;
  const threeWhite = bullish(p2) && bullish(p) && bullish(c) && Number(c.close) > Number(p.close) && Number(p.close) > Number(p2.close) && bodyPct(p2) >= 0.45 && bodyPct(p) >= 0.45 && bodyPct(c) >= 0.45;
  const threeBlack = bearish(p2) && bearish(p) && bearish(c) && Number(c.close) < Number(p.close) && Number(p.close) < Number(p2.close) && bodyPct(p2) >= 0.45 && bodyPct(p) >= 0.45 && bodyPct(c) >= 0.45;
  const insideBull = Number(c.high) <= Number(p.high) && Number(c.low) >= Number(p.low) && bullish(c) && Number(c.close) > Number(p.close);
  const insideBear = Number(c.high) <= Number(p.high) && Number(c.low) >= Number(p.low) && bearish(c) && Number(c.close) < Number(p.close);

  if (engulfBull) pats.push(["BULLISH_ENGULFING", 20]);
  if (engulfBear) pats.push(["BEARISH_ENGULFING", 20]);
  if (hammer) pats.push(["HAMMER_PIN_BAR", 18]);
  if (shooting) pats.push(["SHOOTING_STAR_PIN_BAR", 18]);
  if (morningStar) pats.push(["MORNING_STAR", 20]);
  if (eveningStar) pats.push(["EVENING_STAR", 20]);
  if (threeWhite) pats.push(["THREE_WHITE_SOLDIERS", 16]);
  if (threeBlack) pats.push(["THREE_BLACK_CROWS", 16]);
  if (bullHarami) pats.push(["BULLISH_HARAMI", 10]);
  if (bearHarami) pats.push(["BEARISH_HARAMI", 10]);
  if (tweezerBottom) pats.push(["TWEEZER_BOTTOM", 10]);
  if (tweezerTop) pats.push(["TWEEZER_TOP", 10]);
  if (insideBull) pats.push(["BULLISH_INSIDE_BAR", 9]);
  if (insideBear) pats.push(["BEARISH_INSIDE_BAR", 9]);

  const bullishNames = new Set(["BULLISH_ENGULFING", "HAMMER_PIN_BAR", "MORNING_STAR", "THREE_WHITE_SOLDIERS", "BULLISH_HARAMI", "TWEEZER_BOTTOM", "BULLISH_INSIDE_BAR"]);
  const bearishNames = new Set(["BEARISH_ENGULFING", "SHOOTING_STAR_PIN_BAR", "EVENING_STAR", "THREE_BLACK_CROWS", "BEARISH_HARAMI", "TWEEZER_TOP", "BEARISH_INSIDE_BAR"]);
  const matching = pats.filter(([name]) => direction === "LONG" ? bullishNames.has(name) : bearishNames.has(name));
  const opposite = pats.filter(([name]) => direction === "LONG" ? bearishNames.has(name) : bullishNames.has(name));
  const score = Math.min(100, matching.reduce((n, x) => n + x[1], 0));
  const confirmed = matching.length > 0;
  const primary = matching.slice().sort((x, y) => y[1] - x[1])[0]?.[0] || null;
  return {
    confirmed, score, patterns: pats.map(x => x[0]), matchingPatterns: matching.map(x => x[0]),
    oppositePatterns: opposite.map(x => x[0]), primary,
    bullish: matching.length > 0 && direction === "LONG",
    bearish: matching.length > 0 && direction === "SHORT",
    reason: confirmed ? `${direction} candlestick confirmation: ${primary}` : `${direction} no matching candlestick pattern`
  };
}

function wickDirectionalCheck(candle, direction) {
  if (!candle || !["LONG", "SHORT"].includes(direction)) {
    return { pass: false, score: 0, reason: "Missing candle for wick comparison" };
  }
  const body = Number(candle.bodyPct || 0);
  const upper = Number(candle.upperWickPct || 0);
  const lower = Number(candle.lowerWickPct || 0);
  const bullish = Boolean(candle.bullish);
  const bearish = Boolean(candle.bearish);
  const closeLocation = direction === "LONG"
    ? Number(candle.closeLocation ?? (1 - upper))
    : Number(candle.closeLocation ?? lower);

  if (direction === "LONG") {
    if (!bullish) return { pass: false, score: 0, reason: "LONG candle is not bullish" };
    const rejection = lower >= Math.max(0.12, upper * 1.05);
    const contradictory = upper >= 0.42 && upper > lower * 1.45 && closeLocation < 0.55;
    const cleanBody = body >= 0.62 && closeLocation >= 0.62;
    const pass = rejection || cleanBody;
    const score = Math.max(0, Math.min(100, 55 + (rejection ? 25 : 0) + (cleanBody ? 15 : 0) - (contradictory ? 45 : 0)));
    return { pass: pass && !contradictory, score, upperWickPct: upper, lowerWickPct: lower, bodyPct: body, closeLocation, reason: contradictory ? "LONG rejected: dominant upper wick" : (rejection ? "LONG lower-wick rejection confirmed" : "LONG clean bullish body confirmed") };
  }
  if (!bearish) return { pass: false, score: 0, reason: "SHORT candle is not bearish" };
  const rejection = upper >= Math.max(0.12, lower * 1.05);
  const contradictory = lower >= 0.42 && lower > upper * 1.45 && closeLocation > 0.45;
  const cleanBody = body >= 0.62 && closeLocation <= 0.38;
  const pass = rejection || cleanBody;
  const score = Math.max(0, Math.min(100, 55 + (rejection ? 25 : 0) + (cleanBody ? 15 : 0) - (contradictory ? 45 : 0)));
  return { pass: pass && !contradictory, score, upperWickPct: upper, lowerWickPct: lower, bodyPct: body, closeLocation, reason: contradictory ? "SHORT rejected: dominant lower wick" : (rejection ? "SHORT upper-wick rejection confirmed" : "SHORT clean bearish body confirmed") };
}

function trendStrength(direction, adxValue, slope21, slope50) {
  if (direction === "LONG") return (adxValue ?? 0) + Math.max(0, (slope21 ?? 0)) * 100 + Math.max(0, (slope50 ?? 0)) * 50;
  if (direction === "SHORT") return (adxValue ?? 0) + Math.max(0, -(slope21 ?? 0)) * 100 + Math.max(0, -(slope50 ?? 0)) * 50;
  return 0;
}

// ============================================================
// PULLBACK DETECTION
// ============================================================
function detectPullbackRetest(candles, ema21, ema50, atr14, direction) {
  const closed = Array.isArray(candles) ? candles : [];
  if (!Array.isArray(closed) || closed.length < 8 || !direction || direction === "NEUTRAL") {
    return { confirmed: false, type: null, level: null, pullbackLow: null, pullbackHigh: null, barsSinceTouch: null };
  }
  const current = closed[closed.length - 1];
  const prior = closed.slice(Math.max(0, closed.length - PULLBACK_LOOKBACK - 1), closed.length - 1);
  if (!current || prior.length < 4) return { confirmed: false, type: null, level: null, pullbackLow: null, pullbackHigh: null, barsSinceTouch: null };
  const atr = num(atr14) || 0;
  const touchTol = PULLBACK_TOUCH_TOLERANCE_PCT;
  const reclaim = PULLBACK_RECLAIM_BUFFER_PCT;

  if (direction === "LONG") {
    const levels = [num(ema21), num(ema50)].filter(x => x > 0);
    let touchIdx = -1, pullbackLow = null, touchLevel = null;
    for (let i = prior.length - 1; i >= 0; i--) {
      const c = prior[i];
      const hit = levels.some(level => Number(c.low) <= level * (1 + touchTol) && Number(c.high) >= level * (1 - touchTol));
      if (hit) {
        touchIdx = i; pullbackLow = Number(c.low);
        touchLevel = levels.find(level => Number(c.low) <= level * (1 + touchTol) && Number(c.high) >= level * (1 - touchTol)) || null;
        break;
      }
    }
    const emaPullback = touchIdx >= 0;
    const base = prior.slice(Math.max(0, prior.length - 8), Math.max(1, prior.length - 3));
    const localHigh = base.length ? Math.max(...base.map(c => Number(c.high))) : null;
    let breakoutIdx = -1;
    if (localHigh) {
      for (let i = 0; i < prior.length; i++) {
        if (Number(prior[i].close) > localHigh * (1 + reclaim)) { breakoutIdx = i; break; }
      }
    }
    let retest = false, retestLow = null, retestIdx = -1;
    if (breakoutIdx >= 0 && localHigh) {
      for (let i = breakoutIdx + 1; i < prior.length; i++) {
        if (Number(prior[i].low) <= localHigh * (1 + touchTol) && Number(prior[i].low) >= localHigh * (1 - Math.max(0.02, touchTol * 5))) {
          retest = true; retestLow = Number(prior[i].low); retestIdx = i; break;
        }
      }
    }
    const breakoutRetest = retest && localHigh;
    if (emaPullback || breakoutRetest) {
      const finalLow = Math.min(...[pullbackLow, retestLow].filter(x => Number.isFinite(x)));
      const impulseHigh = breakoutRetest && Number.isFinite(localHigh)
        ? Number(localHigh)
        : (touchIdx >= 0 ? Math.max(...prior.slice(0, touchIdx + 1).map(c => Number(c.high))) : Number(current.high));
      const pullbackDepthAtr = atr > 0 && Number.isFinite(finalLow) && Number.isFinite(impulseHigh)
        ? Math.max(0, (impulseHigh - finalLow) / atr) : 0;
      return {
        confirmed: true, type: breakoutRetest ? "BREAKOUT_RETEST" : "EMA_PULLBACK",
        level: breakoutRetest ? localHigh : touchLevel,
        pullbackLow: finalLow, pullbackHigh: Number(current.high), pullbackDepthAtr,
        barsSinceTouch: touchIdx >= 0 ? prior.length - 1 - touchIdx : (retest ? prior.length - 1 - retestIdx : null),
        atr14: atr
      };
    }
  }

  if (direction === "SHORT") {
    const levels = [num(ema21), num(ema50)].filter(x => x > 0);
    let touchIdx = -1, pullbackHigh = null, touchLevel = null;
    for (let i = prior.length - 1; i >= 0; i--) {
      const c = prior[i];
      const hit = levels.some(level => Number(c.high) >= level * (1 - touchTol) && Number(c.low) <= level * (1 + touchTol));
      if (hit) {
        touchIdx = i; pullbackHigh = Number(c.high);
        touchLevel = levels.find(level => Number(c.high) >= level * (1 - touchTol) && Number(c.low) <= level * (1 + touchTol)) || null;
        break;
      }
    }
    const emaPullback = touchIdx >= 0;
    const base = prior.slice(Math.max(0, prior.length - 8), Math.max(1, prior.length - 3));
    const localLow = base.length ? Math.min(...base.map(c => Number(c.low))) : null;
    let breakdownIdx = -1;
    if (localLow) {
      for (let i = 0; i < prior.length; i++) {
        if (Number(prior[i].close) < localLow * (1 - reclaim)) { breakdownIdx = i; break; }
      }
    }
    let retest = false, retestHigh = null, retestIdx = -1;
    if (breakdownIdx >= 0 && localLow) {
      for (let i = breakdownIdx + 1; i < prior.length; i++) {
        if (Number(prior[i].high) >= localLow * (1 - touchTol) && Number(prior[i].high) <= localLow * (1 + Math.max(0.02, touchTol * 5))) {
          retest = true; retestHigh = Number(prior[i].high); retestIdx = i; break;
        }
      }
    }
    const breakdownRetest = retest && localLow;
    if (emaPullback || breakdownRetest) {
      const finalHigh = Math.max(...[pullbackHigh, retestHigh].filter(x => Number.isFinite(x)));
      const impulseLow = breakdownRetest && Number.isFinite(localLow)
        ? Number(localLow)
        : (touchIdx >= 0 ? Math.min(...prior.slice(0, touchIdx + 1).map(c => Number(c.low))) : Number(current.low));
      const pullbackDepthAtr = atr > 0 && Number.isFinite(finalHigh) && Number.isFinite(impulseLow)
        ? Math.max(0, (finalHigh - impulseLow) / atr) : 0;
      return {
        confirmed: true, type: breakdownRetest ? "BREAKDOWN_RETEST" : "EMA_PULLBACK",
        level: breakdownRetest ? localLow : touchLevel,
        pullbackLow: Number(current.low), pullbackHigh: finalHigh, pullbackDepthAtr,
        barsSinceTouch: touchIdx >= 0 ? prior.length - 1 - touchIdx : (retest ? prior.length - 1 - retestIdx : null),
        atr14: atr
      };
    }
  }
  return { confirmed: false, type: null, level: null, pullbackLow: null, pullbackHigh: null, barsSinceTouch: null, atr14: atr };
}

function timeframeAnalysis(candles) {
  const closed = candles.slice(0, -1);
  const closes = closed.map(c => c.close);
  const i = closes.length - 1;
  const e9 = emaSeries(closes, 9), e21 = emaSeries(closes, 21), e50 = emaSeries(closes, 50), e200 = emaSeries(closes, 200);
  const r = rsi(closes, 14), a = atr(closed, 14), m = macd(closes), ad = adx(closed, 14);
  const av = averageVolume(closed, 20), cv = num(closed[i]?.volume) || 0;
  const sr = recentSupportResistance(closed.slice(0, -1));
  const div = basicDivergence(closed);
  const price = closes[i];
  const last = closed[i];
  const q = candleQuality(last);
  const slope9 = slopePct(e9, 5), slope21 = slopePct(e21, 5), slope50 = slopePct(e50, 5);
  const atrPct = (a && price > 0) ? a / price : null;
  const lastRange = last ? Math.max(0, Number(last.high) - Number(last.low)) : 0;
  const rangeAtrRatio = a && lastRange > 0 ? lastRange / a : 0;

  let direction = "NEUTRAL";
  if (e9[i] && e21[i] && e50[i] && e200[i]) {
    if (e9[i] > e21[i] && e21[i] > e50[i] && price > e200[i] && (slope21 === null || slope21 >= -0.003)) direction = "LONG";
    else if (e9[i] < e21[i] && e21[i] < e50[i] && price < e200[i] && (slope21 === null || slope21 <= 0.003)) direction = "SHORT";
  }

  const pullbackRetest = detectPullbackRetest(closed, e21[i], e50[i], a, direction);
  const srRange = Math.max(1e-12, sr.resistance - sr.support);
  const srPos = (price - sr.support) / srRange;
  const distE21 = a ? Math.abs(price - e21[i]) / a : null;
  const distE50 = a ? Math.abs(price - e50[i]) / a : null;
  const momentumSlope = slopePct(closes, 5);
  const nearE21 = distE21 !== null && distE21 <= 1.25;
  const nearE50 = distE50 !== null && distE50 <= 1.75;
  const breakoutLong = price > sr.resistance && q.bullish && q.bodyPct >= 0.45;
  const breakoutShort = price < sr.support && q.bearish && q.bodyPct >= 0.45;

  return {
    price, ema9: e9[i], ema21: e21[i], ema50: e50[i], ema200: e200[i],
    rsi14: r, atr14: a, atrPct, macd: m, adx14: ad, avgVolume20: av, currentVolume: cv,
    volumeRatio: av ? cv / av : null, support: sr.support, resistance: sr.resistance,
    rangeAtrRatio, divergence: div, direction, candleTime: closed[i]?.time,
    slope9, slope21, slope50, momentumSlope, candle: q,
    srPos, distE21, distE50, nearE21, nearE50, breakoutLong, breakoutShort,
    pullbackRetest,
    trendStrength: trendStrength(direction, ad, slope21, slope50)
  };
}

// ============================================================
// STRICT PULLBACK ENTRY (15m)
// ============================================================
function strict15mPullbackEntry(candles, direction) {
  const closed = Array.isArray(candles) ? candles.slice(0, -1) : [];
  if (closed.length < 25 || !["LONG", "SHORT"].includes(direction)) return null;
  const current = closed[closed.length - 1];
  const atr14 = num(atr(closed, 14));
  if (!(atr14 > 0)) return null;

  const maxBreakoutBarsAgo = Math.min(10, closed.length - 10);
  for (let barsAgo = 1; barsAgo <= maxBreakoutBarsAgo; barsAgo++) {
    const idx = closed.length - 1 - barsAgo;
    if (idx < 10) continue;
    const breakout = closed[idx];
    const prior = closed.slice(idx - 10, idx);
    if (prior.length < 10) continue;

    const level = direction === "LONG" ? Math.max(...prior.map(c => Number(c.high))) : Math.min(...prior.map(c => Number(c.low)));
    if (!(level > 0)) continue;

    const bq = candleQuality(breakout);
    const bRange = Math.max(1e-12, Number(breakout.high) - Number(breakout.low));
    const bCloseLoc = direction === "LONG"
      ? (Number(breakout.close) - Number(breakout.low)) / bRange
      : (Number(breakout.high) - Number(breakout.close)) / bRange;
    const priorVol = averageVolume(prior, Math.min(10, prior.length));
    const volumeRatio = priorVol > 0 ? Number(breakout.volume || 0) / priorVol : 1;
    const breakoutPass = direction === "LONG"
      ? Number(breakout.close) > level * (1 + BREAKOUT_BUFFER_PCT) && bq.bullish
      : Number(breakout.close) < level * (1 - BREAKOUT_BUFFER_PCT) && bq.bearish;
    if (!breakoutPass) continue;
    if (bq.bodyPct < 0.30 || bCloseLoc < 0.60) continue;
    if (BREAKOUT_REQUIRE_VOLUME && volumeRatio < BREAKOUT_VOLUME_MULTIPLIER * 0.80) continue;

    let retest = null;
    for (let j = idx + 1; j < closed.length - 1; j++) {
      const c = closed[j];
      const touched = direction === "LONG"
        ? Number(c.low) <= level * (1 + BREAKOUT_RETEST_TOLERANCE_PCT) && Number(c.low) >= level * (1 - 0.012)
        : Number(c.high) >= level * (1 - BREAKOUT_RETEST_TOLERANCE_PCT) && Number(c.high) <= level * (1 + 0.012);
      if (!touched) continue;
      const rq = candleQuality(c);
      const rRange = Math.max(1e-12, Number(c.high) - Number(c.low));
      const rCloseLoc = direction === "LONG"
        ? (Number(c.close) - Number(c.low)) / rRange
        : (Number(c.high) - Number(c.close)) / rRange;
      const rejection = direction === "LONG"
        ? (rq.lowerWickPct >= Math.max(0.10, rq.upperWickPct * 1.05) || (rq.bullish && rCloseLoc >= 0.65))
        : (rq.upperWickPct >= Math.max(0.10, rq.lowerWickPct * 1.05) || (rq.bearish && rCloseLoc >= 0.65));
      if (!rejection) continue;
      retest = { index: j, candle: c, extreme: direction === "LONG" ? Number(c.low) : Number(c.high) };
    }
    if (!retest) continue;

    const cq = candleQuality(current);
    const cRange = Math.max(1e-12, Number(current.high) - Number(current.low));
    const closeLocation = direction === "LONG"
      ? (Number(current.close) - Number(current.low)) / cRange
      : (Number(current.high) - Number(current.close)) / cRange;
    const wick = wickDirectionalCheck({ ...cq, closeLocation }, direction);
    const reclaim = direction === "LONG"
      ? Number(current.close) > level * (1 + ENTRY_PULLBACK_RECLAIM_BUFFER_PCT) && cq.bullish
      : Number(current.close) < level * (1 - ENTRY_PULLBACK_RECLAIM_BUFFER_PCT) && cq.bearish;
    if (!reclaim || !wick.pass) continue;
    if (cq.bodyPct < 0.22 || closeLocation < 0.60) continue;

    const extensionAtr = direction === "LONG"
      ? Math.max(0, (Number(current.close) - level) / atr14)
      : Math.max(0, (level - Number(current.close)) / atr14);
    if (extensionAtr > 1.00) continue;

    const depthAtr = direction === "LONG"
      ? Math.max(0, (level - retest.extreme) / atr14)
      : Math.max(0, (retest.extreme - level) / atr14);
    if (depthAtr < 0.45) continue;

    const swingWindow = closed.slice(Math.max(0, retest.index - 4), Math.min(closed.length, retest.index + 2));
    const swingLow = Math.min(...swingWindow.map(c => Number(c.low)));
    const swingHigh = Math.max(...swingWindow.map(c => Number(c.high)));
    let score = 78;
    if (volumeRatio >= BREAKOUT_VOLUME_MULTIPLIER) score += 6;
    if (bq.bodyPct >= 0.50) score += 4;
    if (closeLocation >= 0.80) score += 3;
    if (wick.score >= 80) score += 5;
    if (extensionAtr <= 0.50) score += 4;
    score = Math.min(100, score);

    return {
      signal: direction, direction, score,
      precisionScore: Math.min(100, score + (wick.score >= 85 ? 5 : 0)),
      price: Number(current.close), atr: atr14, volumeRatio, breakoutLevel: level,
      extensionAtr, bodyAtr: bq.bodyPct * (Number(breakout.high) - Number(breakout.low)) / atr14,
      bodyPct: cq.bodyPct, upperWickPct: cq.upperWickPct, lowerWickPct: cq.lowerWickPct,
      closeLocation, candleTime: current.time, breakoutCandleTime: breakout.time,
      resistance: direction === "LONG" ? level : swingHigh,
      support: direction === "SHORT" ? level : swingLow,
      swingLow, swingHigh,
      pullbackLow: direction === "LONG" ? retest.extreme : null,
      pullbackHigh: direction === "SHORT" ? retest.extreme : null,
      pullbackDepthAtr: depthAtr, retestCandleTime: retest.candle?.time ?? null,
      retestBarsAgo: Math.max(0, closed.length - 1 - retest.index),
      retestConfirmed: true, pullbackEntryPass: true, confirmed: true,
      wickCheck: wick, entryMode: "15M_BREAKOUT_PULLBACK_RETEST",
      reason: `${direction} 15m confirmed breakout → pullback/retest → wick rejection → reclaim`
    };
  }
  return null;
}

// ============================================================
// BALANCED EMA PULLBACK + WICK RECLAIM (15m)
// ============================================================
function balanced15mPullbackWickEntry(candles, direction) {
  const closed = Array.isArray(candles) ? candles.slice(0, -1) : [];
  if (closed.length < 55 || !["LONG", "SHORT"].includes(direction)) return null;
  const current = closed[closed.length - 1];
  const closes = closed.map(c => Number(c.close)).filter(Number.isFinite);
  if (closes.length < 55) return null;
  const ema21s = emaSeries(closes, 21);
  const ema50s = emaSeries(closes, 50);
  const ema21 = num(ema21s.at(-1)), ema50 = num(ema50s.at(-1));
  const atr14 = num(atr(closed, 14));
  if (!(ema21 > 0 && ema50 > 0 && atr14 > 0)) return null;

  const q = candleQuality(current);
  const range = Math.max(1e-12, Number(current.high) - Number(current.low));
  const closeLocation = direction === "LONG"
    ? (Number(current.close) - Number(current.low)) / range
    : (Number(current.high) - Number(current.close)) / range;
  const wick = wickDirectionalCheck({ ...q, closeLocation }, direction);
  if (!wick.pass) return null;

  const level = direction === "LONG" ? Math.max(ema21, ema50) : Math.min(ema21, ema50);
  const price = Number(current.close);
  const distanceAtr = Math.abs(price - level) / atr14;
  if (!(price > 0) || distanceAtr > 1.45) return null;

  let touch = null;
  const start = Math.max(0, closed.length - 15);
  for (let i = closed.length - 2; i >= start; i--) {
    const c = closed[i];
    const hit21 = Number(c.low) <= ema21 * 1.006 && Number(c.high) >= ema21 * 0.994;
    const hit50 = Number(c.low) <= ema50 * 1.006 && Number(c.high) >= ema50 * 0.994;
    if (hit21 || hit50) { touch = { index: i, candle: c }; break; }
  }
  if (!touch) return null;

  const depthAtr = direction === "LONG"
    ? Math.max(0, (Math.max(ema21, ema50) - Number(touch.candle.low)) / atr14)
    : Math.max(0, (Number(touch.candle.high) - Math.min(ema21, ema50)) / atr14);
  if (depthAtr < 0.25) return null;

  const reclaim = direction === "LONG"
    ? q.bullish && price > ema21 * (1 + ENTRY_PULLBACK_RECLAIM_BUFFER_PCT * 0.50)
    : q.bearish && price < ema21 * (1 - ENTRY_PULLBACK_RECLAIM_BUFFER_PCT * 0.50);
  if (!reclaim) return null;

  const extensionAtr = direction === "LONG" ? Math.max(0, (price - ema21) / atr14) : Math.max(0, (ema21 - price) / atr14);
  if (extensionAtr > 1.45) return null;

  const candlePattern = detectCandlestickPatterns(closed, direction);
  let score = 72;
  if (candlePattern.confirmed) score += Math.min(12, Math.round(candlePattern.score * 0.60));
  if (candlePattern.oppositePatterns.length > 0 && !candlePattern.confirmed) score -= 8;
  if (depthAtr >= 0.30) score += 6;
  if (distanceAtr <= 0.55) score += 5;
  if (wick.score >= 80) score += 7;
  if (q.bodyPct >= 0.35) score += 4;
  if (closeLocation >= 0.75) score += 4;
  score = Math.min(100, score);

  const swing = closed.slice(Math.max(0, touch.index - 4), Math.min(closed.length, touch.index + 2));
  const swingLow = Math.min(...swing.map(c => Number(c.low)));
  const swingHigh = Math.max(...swing.map(c => Number(c.high)));
  return {
    signal: direction, direction, score,
    precisionScore: Math.min(100, score + (wick.score >= 85 ? 5 : 0)),
    price, atr: atr14, volumeRatio: 1, breakoutLevel: level, extensionAtr, bodyAtr: q.bodyPct,
    bodyPct: q.bodyPct, upperWickPct: q.upperWickPct, lowerWickPct: q.lowerWickPct, closeLocation,
    candleTime: current.time, breakoutCandleTime: null, resistance: swingHigh, support: swingLow,
    swingLow, swingHigh,
    pullbackLow: direction === 'LONG' ? Number(touch.candle.low) : null,
    pullbackHigh: direction === 'SHORT' ? Number(touch.candle.high) : null,
    pullbackDepthAtr: depthAtr, retestConfirmed: true, pullbackEntryPass: true, confirmed: true,
    wickCheck: wick, candlePattern, entryMode: "15M_EMA_PULLBACK_WICK_RECLAIM",
    reason: `${direction} 15m EMA pullback → candlestick confluence → wick rejection → reclaim`
  };
}

// ============================================================
// EARLY PULLBACK ENTRY (15m, shallow reset)
// ============================================================
function early15mPullbackEntry(candles, direction) {
  const closed = Array.isArray(candles) ? candles.slice(0, -1) : [];
  if (closed.length < 55 || !["LONG", "SHORT"].includes(direction)) return null;
  const closes = closed.map(c => Number(c.close)).filter(Number.isFinite);
  if (closes.length < 55) return null;
  const ema21s = emaSeries(closes, 21);
  const ema50s = emaSeries(closes, 50);
  const ema21 = num(ema21s.at(-1)), ema50 = num(ema50s.at(-1));
  const atr14 = num(atr(closed, 14));
  const current = closed.at(-1);
  if (!current || !(ema21 > 0 && ema50 > 0 && atr14 > 0)) return null;

  const price = Number(current.close);
  const q = candleQuality(current);
  const range = Math.max(1e-12, Number(current.high) - Number(current.low));
  const closeLocation = direction === "LONG" ? (price - Number(current.low)) / range : (Number(current.high) - price) / range;
  const wick = wickDirectionalCheck({ ...q, closeLocation }, direction);
  if (!wick.pass) return null;
  const candlePattern = detectCandlestickPatterns(closed, direction);

  const trendPass = direction === "LONG" ? price > ema21 && ema21 >= ema50 : price < ema21 && ema21 <= ema50;
  if (!trendPass) return null;

  let touch = null;
  const start = Math.max(0, closed.length - 7);
  for (let i = closed.length - 2; i >= start; i--) {
    const c = closed[i];
    const hit21 = Number(c.low) <= ema21 * 1.008 && Number(c.high) >= ema21 * 0.992;
    const hit50 = Number(c.low) <= ema50 * 1.008 && Number(c.high) >= ema50 * 0.992;
    if (hit21 || hit50) { touch = { index: i, candle: c }; break; }
  }
  if (!touch) return null;

  const depthAtr = direction === "LONG"
    ? Math.max(0, (Math.max(ema21, ema50) - Number(touch.candle.low)) / atr14)
    : Math.max(0, (Number(touch.candle.high) - Math.min(ema21, ema50)) / atr14);
  if (depthAtr < 0.18 || depthAtr > 0.55) return null;

  const reclaim = direction === "LONG"
    ? q.bullish && price > ema21 * (1 + ENTRY_PULLBACK_RECLAIM_BUFFER_PCT * 0.35)
    : q.bearish && price < ema21 * (1 - ENTRY_PULLBACK_RECLAIM_BUFFER_PCT * 0.35);
  if (!reclaim) return null;

  const extensionAtr = direction === "LONG" ? Math.max(0, (price - ema21) / atr14) : Math.max(0, (ema21 - price) / atr14);
  if (extensionAtr > 0.90) return null;

  const swing = closed.slice(Math.max(0, touch.index - 3), Math.min(closed.length, touch.index + 2));
  const swingLow = Math.min(...swing.map(c => Number(c.low)));
  const swingHigh = Math.max(...swing.map(c => Number(c.high)));
  let score = 82;
  if (candlePattern.confirmed) score += Math.min(14, Math.round(candlePattern.score * 0.70));
  if (candlePattern.oppositePatterns.length > 0 && !candlePattern.confirmed) score -= 8;
  if (depthAtr >= 0.15) score += 4;
  if (depthAtr >= 0.25) score += 3;
  if (extensionAtr <= 0.55) score += 4;
  if (wick.score >= 80) score += 4;
  if (q.bodyPct >= 0.35) score += 3;
  if (closeLocation >= 0.75) score += 3;
  score = Math.min(100, score);

  return {
    signal: direction, direction, score,
    precisionScore: Math.min(100, score + (wick.score >= 85 ? 5 : 0)),
    price, atr: atr14, volumeRatio: 1, breakoutLevel: ema21, extensionAtr, bodyAtr: q.bodyPct,
    bodyPct: q.bodyPct, upperWickPct: q.upperWickPct, lowerWickPct: q.lowerWickPct, closeLocation,
    candleTime: current.time, breakoutCandleTime: null, resistance: swingHigh, support: swingLow,
    swingLow, swingHigh,
    pullbackLow: direction === 'LONG' ? Number(touch.candle.low) : null,
    pullbackHigh: direction === 'SHORT' ? Number(touch.candle.high) : null,
    pullbackDepthAtr: depthAtr, retestConfirmed: true, pullbackEntryPass: true, confirmed: true,
    wickCheck: wick, candlePattern,
    retestBarsAgo: closed.length - 1 - touch.index,
    entryMode: "15M_EARLY_PULLBACK_RECLAIM",
    reason: `${direction} 15m early EMA pullback → ${candlePattern.primary || "candle confirmation"} → shallow reset → reclaim`
  };
}

function timeframeBias(candles) {
  if (!Array.isArray(candles) || candles.length < 60) return { bias: "NEUTRAL", price: null, ema9: null, ema21: null, ema50: null };
  const closes = candles.map(c => Number(c.close)).filter(Number.isFinite);
  const e9 = emaSeries(closes, 9);
  const e21 = emaSeries(closes, 21);
  const e50 = emaSeries(closes, 50);
  const price = closes[closes.length - 1];
  const a = e9[e9.length - 1], b = e21[e21.length - 1], c = e50[e50.length - 1];
  if (![price, a, b, c].every(Number.isFinite)) return { bias: "NEUTRAL", price, ema9: a, ema21: b, ema50: c };
  if (price > b && a > b && b > c) return { bias: "LONG", price, ema9: a, ema21: b, ema50: c };
  if (price < b && a < b && b < c) return { bias: "SHORT", price, ema9: a, ema21: b, ema50: c };
  return { bias: "NEUTRAL", price, ema9: a, ema21: b, ema50: c };
}

// ============================================================
// ENTRY TIMING GUARD (single combined rule)
// ============================================================
function entryTimingGuard(candles, direction, price, atr14, trigger) {
  const closed = Array.isArray(candles) ? candles.slice(0, -1) : [];
  if (closed.length < 25 || !Number.isFinite(price) || !(atr14 > 0)) {
    return { pass: false, reason: "Entry timing rejected: insufficient closed-candle/ATR data to verify late-entry risk", impulseAtr: null, roomToExtremeAtr: null, recentLow: null, recentHigh: null };
  }
  const window = closed.slice(-20);
  const recentLow = Math.min(...window.map(c => Number(c.low)).filter(Number.isFinite));
  const recentHigh = Math.max(...window.map(c => Number(c.high)).filter(Number.isFinite));
  if (!Number.isFinite(recentLow) || !Number.isFinite(recentHigh)) return { pass: true, reason: null };

  const impulseAtr = direction === 'LONG' ? (price - recentLow) / atr14 : (recentHigh - price) / atr14;
  const roomToExtremeAtr = direction === 'LONG' ? (recentHigh - price) / atr14 : (price - recentLow) / atr14;

  const retestAge = Number(trigger?.retestBarsAgo);
  const hasRecentRetest = Boolean(trigger?.retestConfirmed) && Number.isFinite(retestAge) && retestAge <= ENTRY_MAX_RETEST_AGE_BARS;
  const pullbackDepth = Number(trigger?.pullbackDepthAtr || 0);
  const hasRealPullback = hasRecentRetest && pullbackDepth >= ENTRY_MIN_REAL_PULLBACK_ATR;

  // Single combined rule: reject when price is close to the recent extreme
  // AND the setup has not produced a genuine reset.
  if (roomToExtremeAtr < ENTRY_EXTREME_PROXIMITY_ATR) {
    const bigImpulse = impulseAtr > ENTRY_MAX_IMPULSE_ATR;
    const shallowPullback = pullbackDepth < ENTRY_MIN_REAL_PULLBACK_ATR;
    if (bigImpulse || shallowPullback) {
      return {
        pass: false,
        reason: bigImpulse
          ? `Late entry rejected: ${impulseAtr.toFixed(2)} ATR impulse and only ${roomToExtremeAtr.toFixed(2)} ATR room to recent ${direction === 'LONG' ? 'high' : 'low'}`
          : `Insufficient pullback: only ${pullbackDepth.toFixed(2)} ATR reset and ${roomToExtremeAtr.toFixed(2)} ATR room to recent ${direction === 'LONG' ? 'high' : 'low'}`,
        impulseAtr, roomToExtremeAtr, recentLow, recentHigh, hasRecentRetest, pullbackDepth, hasRealPullback
      };
    }
  }

  if (trigger?.retestConfirmed && Number.isFinite(retestAge) && retestAge > ENTRY_MAX_RETEST_AGE_BARS) {
    return {
      pass: false,
      reason: `Stale retest rejected: ${retestAge} closed 15m bars since retest; wait for a fresh pullback`,
      impulseAtr, roomToExtremeAtr, recentLow, recentHigh, hasRecentRetest, pullbackDepth, hasRealPullback
    };
  }

  return { pass: true, reason: null, impulseAtr, roomToExtremeAtr, recentLow, recentHigh, hasRecentRetest, pullbackDepth, hasRealPullback };
}

// ============================================================
// ADVANCED SIGNAL
// ============================================================
async function getAdvancedSignal(symbol = SYMBOL) {
  await refreshActiveSymbols();
  await ensureTradableSymbol(symbol);
  const cached = advancedSignalCache.get(symbol);
  if (cached && Date.now() - cached.time < ADVANCED_SIGNAL_CACHE_TTL_MS) return cached.data;

  const [c4h, c1h, c15, c5] = await Promise.all([getCandles(symbol, "Hour4"), getCandles(symbol, "Min60"), getCandles(symbol, "Min15"), getFastCandles(symbol)]);
  const c8h = aggregateCandles(c4h, 480);
  const c6h = aggregateCandles(c4h, 360);
  const c1d = await getCandles(symbol, "Day1");
  const bias4h = timeframeBias(c4h);
  const bias6h = timeframeBias(c6h);
  const bias8h = timeframeBias(c8h);
  const bias1d = timeframeBias(c1d);
  const bias1h = timeframeBias(c1h);
  const analysis15 = timeframeAnalysis(c15);
  const analysis1h = timeframeAnalysis(c1h);
  const analysis4h = timeframeAnalysis(c4h);
  const consensus = higherTimeframeConsensus({ Day1: bias1d.bias, Hour8: bias8h.bias, Hour6: bias6h.bias, Hour4: bias4h.bias });
  const htfDirs = [bias1d.bias, bias8h.bias, bias6h.bias, bias4h.bias];
  const longCount = htfDirs.filter(x => x === "LONG").length;
  const shortCount = htfDirs.filter(x => x === "SHORT").length;
  const majorityDirection = longCount >= 2 && longCount > shortCount ? "LONG" : (shortCount >= 2 && shortCount > longCount ? "SHORT" : "NEUTRAL");
  const effectiveConsensus = majorityDirection !== "NEUTRAL"
    ? { direction: majorityDirection, aligned: Math.max(longCount, shortCount), opposite: Math.min(longCount, shortCount), score: Math.max(longCount, shortCount), mode: "2_OF_4_BALANCED_MAJORITY" }
    : { ...consensus, mode: "2_OF_4_TIE_NEUTRAL" };
  const price = num(analysis15?.price ?? bias1h?.price ?? bias4h?.price);
  const consensusDirection = effectiveConsensus.direction;

  const fast15DirectionProbe = fastOpportunityScore(c15);
  const fast15ProbeDirection = String(fast15DirectionProbe?.direction || '').toUpperCase();
  const fast15ProbeScore = Number(fast15DirectionProbe?.score || 0);
  const htfOppositeToFast = fast15ProbeDirection === 'LONG' ? shortCount : fast15ProbeDirection === 'SHORT' ? longCount : 0;
  const soft15mLead = Boolean(fast15ProbeDirection && fast15ProbeScore >= 90 && htfOppositeToFast <= 2);

  const direction = consensusDirection !== 'NEUTRAL'
    ? (fast15ProbeDirection && fast15ProbeDirection !== consensusDirection && soft15mLead ? fast15ProbeDirection : consensusDirection)
    : (soft15mLead ? fast15ProbeDirection : 'NEUTRAL');

  const fast5 = fastOpportunityScore(c5);
  let trigger = null;

  if (direction !== "NEUTRAL") {
    trigger = strict15mPullbackEntry(c15, direction);
    if (!trigger) trigger = balanced15mPullbackWickEntry(c15, direction);
    if (!trigger) trigger = early15mPullbackEntry(c15, direction);
  }

  if (!trigger || trigger.signal !== direction) {
    const result = {
      signal: "WAIT",
      reason: `No valid 15m entry setup aligned with ${direction === "NEUTRAL" ? "HTF majority" : direction}`,
      symbol, interval: "Min15", score: 0, precisionScore: 0,
      timeframes: { Day1: bias1d, Hour8: bias8h, Hour6: bias6h, Hour4: bias4h, Min60: bias1h, Min15: analysis15, Min5: fast5 },
      higherTimeframeConsensus: effectiveConsensus
    };
    advancedSignalCache.set(symbol, { time: Date.now(), data: result });
    return result;
  }

  const signal = direction;
  const candlePattern = trigger?.candlePattern || detectCandlestickPatterns(c15, signal);
  const structure = {
    swingLow: Number(analysis4h?.support),
    swingHigh: Number(analysis4h?.resistance),
    pullbackLow: Number(trigger.pullbackLow ?? analysis15?.support),
    pullbackHigh: Number(trigger.pullbackHigh ?? analysis15?.resistance)
  };
  const protectionPlan = protectionPricesFor(signal, price, null, analysis4h?.atr14 || trigger.atr, structure);
  const stopPct = Number(protectionPlan?.stopPct || 0);
  const riskReward = stopPct > 0 ? TAKE_PROFIT_PCT / stopPct : 0;

  const emaDistanceAtr = Number.isFinite(Number(analysis15?.distE21)) ? Number(analysis15.distE21) : Infinity;
  const continuationChaseRisk = !Boolean(trigger?.retestConfirmed) && emaDistanceAtr > ENTRY_TRIGGER_MAX_DISTANCE_ATR;
  const timingAtr = Number(analysis15?.atr14 || trigger.atr || 0);
  const timingGuard = entryTimingGuard(c15, signal, price, timingAtr, trigger);
  const lateEntryRisk = Number(trigger.extensionAtr || 0) > 1.00 || continuationChaseRisk || !timingGuard.pass;
  const volatilitySpike = Number(trigger.bodyAtr || 0) >= 3.50;

  const localAtr = Math.max(1e-12, Number(analysis15?.atr14 || trigger.atr || 0));
  const localResistance = num(analysis15?.resistance);
  const localSupport = num(analysis15?.support);
  const srRoomLong = localResistance !== null ? (localResistance - price) / localAtr : Infinity;
  const srRoomShort = localSupport !== null ? (price - localSupport) / localAtr : Infinity;
  const isBreakoutRetest = String(trigger.entryMode || '').toUpperCase() === 'BREAKOUT_RETEST' || Boolean(trigger.retestConfirmed);
  const isConfirmedBeyondLevel = signal === 'LONG'
    ? (num(trigger.breakoutLevel) !== null && price > Number(trigger.breakoutLevel) * (1 + BREAKOUT_BUFFER_PCT))
    : (num(trigger.breakoutLevel) !== null && price < Number(trigger.breakoutLevel) * (1 - BREAKOUT_BUFFER_PCT));
  const nearOpposingSR = (signal === 'LONG' ? srRoomLong : srRoomShort) < 0.35;
  const continuationOnly = !isBreakoutRetest && !isConfirmedBeyondLevel;
  const lateLocationRisk = nearOpposingSR && continuationOnly;

  const stopDistanceOk = Boolean(protectionPlan?.valid && stopPct > 0 && stopPct <= MAX_STRUCTURE_STOP_PCT * 1.02);
  const wickCheck = wickDirectionalCheck(analysis15?.candle, signal);
  const wickRequired = !isBreakoutRetest && !isConfirmedBeyondLevel;
  const wickPass = wickRequired ? wickCheck.pass : (wickCheck.pass || Number(analysis15?.candle?.bodyPct || 0) >= 0.60);

  const coreAligned = (effectiveConsensus.aligned >= 2 && effectiveConsensus.direction === signal) ||
    Boolean(soft15mLead && fast15ProbeDirection === signal && htfOppositeToFast <= 2);
  const oneHourOpposite = bias1h.bias === (signal === "LONG" ? "SHORT" : "LONG");
  const oneHourPass = !oneHourOpposite;
  const oneHourMomentumPass = analysis1h.direction !== (signal === "LONG" ? "SHORT" : "LONG");
  const fifteenPass = analysis15.direction !== (signal === "LONG" ? "SHORT" : "LONG");

  let finalSignal = signal, reason = trigger.reason;
  if (!coreAligned) {
    finalSignal = "WAIT";
    reason = `Higher-timeframe majority too weak/contradictory: 1D=${bias1d.bias}, 8H=${bias8h.bias}, 6H=${bias6h.bias}, 4H=${bias4h.bias}`;
  } else if (!oneHourPass || !oneHourMomentumPass) {
    finalSignal = "WAIT"; reason = `1H trend conflict for ${signal}`;
  } else if (volatilitySpike) {
    finalSignal = "WAIT"; reason = `15m trigger candle volatility too high (${Number(trigger.bodyAtr).toFixed(2)} ATR)`;
  } else if (lateEntryRisk) {
    finalSignal = "WAIT";
    reason = !timingGuard.pass
      ? timingGuard.reason
      : continuationChaseRisk
        ? `Late entry rejected: ${emaDistanceAtr.toFixed(2)} ATR from EMA21; wait for pullback/retest`
        : `Entry too extended (${Number(trigger.extensionAtr).toFixed(2)} ATR)`;
  } else if (lateLocationRisk) {
    finalSignal = "WAIT";
    reason = signal === 'LONG'
      ? `LONG waiting for breakout/retest above nearby resistance (${Number(localResistance).toFixed(6)})`
      : `SHORT waiting for breakdown/retest below nearby support (${Number(localSupport).toFixed(6)})`;
  } else if (!wickPass) {
    finalSignal = "WAIT"; reason = wickCheck.reason || `${signal} candle wick does not confirm rejection`;
  } else if (!candlePattern.confirmed && Number(wickCheck.score || 0) < 90) {
    finalSignal = "WAIT";
    reason = `${signal} needs candlestick confirmation at the pullback/reclaim; no strong pattern detected`;
  } else if (Number(timingGuard.roomToExtremeAtr) < ENTRY_EXTREME_PROXIMITY_ATR) {
    finalSignal = "WAIT";
    reason = `${signal} entry too close to recent ${signal === "LONG" ? "high" : "low"} (${Number(timingGuard.roomToExtremeAtr).toFixed(2)} ATR); wait for a cleaner pullback`;
  } else if (Number(trigger.pullbackDepthAtr || 0) < (
    String(trigger.entryMode || "").includes("BREAKOUT") ? 0.45 :
    String(trigger.entryMode || "").includes("EARLY") ? 0.18 : 0.25
  )) {
    finalSignal = "WAIT";
    reason = `${signal} pullback too shallow (${Number(trigger.pullbackDepthAtr || 0).toFixed(2)} ATR); wait for a deeper reset`;
  } else if (!stopDistanceOk) {
    finalSignal = "WAIT"; reason = protectionPlan?.reason || "Invalid higher-timeframe structure stop";
  } else if (riskReward < MIN_RISK_REWARD) {
    finalSignal = "WAIT"; reason = `Risk/reward too low (${riskReward.toFixed(2)} < ${MIN_RISK_REWARD})`;
  }

  let score = 60 + effectiveConsensus.aligned * 7;
  if (candlePattern.confirmed) score += Math.min(10, Math.round(candlePattern.score * 0.45));
  if (bias1d.bias === signal) score += 5;
  if (bias1h.bias === signal) score += 7;
  if (analysis15.direction === signal) score += 8;
  if (trigger.confirmed) score += 5;
  score = Math.min(100, score);
  const precisionScore = Math.min(100, score + (Number(trigger.precisionScore || 0) >= 90 ? 5 : 0));

  const result = {
    signal: finalSignal, reason, symbol, interval: "Min15", price, score, precisionScore,
    directionScores: { LONG: signal === "LONG" ? score : 0, SHORT: signal === "SHORT" ? score : 0 },
    candleTime: trigger.candleTime,
    atr14: analysis15?.atr14 || trigger.atr,
    rsi14: analysis15?.rsi14 ?? null,
    reasons: [trigger.reason],
    breakout: { ...trigger, higherTimeframeEntry: true },
    timeframes: { Day1: bias1d, Hour8: bias8h, Hour6: bias6h, Hour4: bias4h, Min60: bias1h, Min15: analysis15, Min5: fast5 },
    higherTimeframeConsensus: effectiveConsensus,
    quality: {
      breakoutOnly: false, higherTimeframeOnly: true, no5mSignalEngine: true,
      strictPullbackRetest: false, coreTimeframeAlignmentPass: coreAligned,
      oneHourAlignmentPass: oneHourPass, fifteenMinuteConfirmationPass: fifteenPass,
      higherTimeframeAlignmentPass: coreAligned && oneHourPass && fifteenPass,
      soft15mLead, soft15mLeadDirection: soft15mLead ? fast15ProbeDirection : null,
      soft15mLeadScore: soft15mLead ? fast15ProbeScore : null, htfOppositeToFast,
      majorityDirection, dailyTrend: bias1d.bias, dailyAlignmentPass: bias1d.bias === signal,
      setupNotExhausted: !lateEntryRisk && !lateLocationRisk, lateEntryRisk,
      continuationChaseRisk, emaDistanceAtr, entryTimingGuard: timingGuard,
      impulseAtr: timingGuard.impulseAtr, roomToExtremeAtr: timingGuard.roomToExtremeAtr,
      lateLocationRisk, nearOpposingSR, localResistance, localSupport,
      srRoomAtr: Number((signal === 'LONG' ? srRoomLong : srRoomShort).toFixed(3)),
      isBreakoutRetest, isConfirmedBeyondLevel, volatilitySpike,
      riskReward: Number(riskReward.toFixed(3)), minRiskReward: MIN_RISK_REWARD,
      precisionScore, tpTargetPct: TAKE_PROFIT_PCT, tpReachableForTarget: true,
      entryMode: trigger.entryMode || "15M_TREND_CONTINUATION",
      wickCheck, wickRequired, wickPass, candlestickConfluence: candlePattern,
      breakoutLevel: trigger.breakoutLevel, breakoutExtensionAtr: trigger.extensionAtr,
      breakoutVolumeRatio: trigger.volumeRatio, breakoutBodyAtr: trigger.bodyAtr
    },
    protectionPlan,
    higherTimeframe: { consensus, Day1: bias1d, Hour8: bias8h, Hour6: bias6h, Hour4: bias4h, Hour1: bias1h, Min15: analysis15 }
  };
  advancedSignalCache.set(symbol, { time: Date.now(), data: result });
  return result;
}

async function getSignal(symbol = SYMBOL) {
  return getAdvancedSignal(symbol);
}

// ============================================================
// MEXC PRIVATE ENDPOINTS
// ============================================================
async function getContract(symbol = SYMBOL) {
  const d = await mexc("GET", "/api/v1/contract/detail", { symbol });
  const arr = Array.isArray(d?.data) ? d.data : [];
  return arr[0] || d?.data || {};
}

async function getTicker(symbol = SYMBOL) {
  const d = await mexc("GET", "/api/v1/contract/ticker", { symbol });
  return d?.data || d || {};
}

async function getAccount() {
  return mexc("GET", "/api/v1/private/account/assets", {}, true);
}

async function getPositions(symbol = null) {
  const params = symbol ? { symbol } : {};
  const d = await mexc("GET", "/api/v1/private/position/open_positions", params, true);
  return Array.isArray(d?.data) ? d.data : [];
}

async function getCurrentOrders(symbol = SYMBOL) {
  const d = await mexc("GET", "/api/v1/private/order/list/open_orders/" + symbol, {}, true);
  return Array.isArray(d?.data) ? d.data : [];
}

async function getPlanOrders(symbol = SYMBOL) {
  const d = await mexc("GET", "/api/v1/private/planorder/list/orders", { symbol }, true);
  return Array.isArray(d?.data) ? d.data : [];
}

async function getLeverage(symbol = SYMBOL) {
  const d = await mexc("GET", "/api/v1/private/position/leverage", { symbol }, true);
  return d?.data || d;
}

async function getPositionMode() {
  const d = await mexc("GET", "/api/v1/private/position/position_mode", {}, true);
  return d?.data ?? d;
}

function collectObjects(value, out = []) {
  if (value && typeof value === "object") {
    out.push(value);
    if (Array.isArray(value)) value.forEach(v => collectObjects(v, out));
    else Object.values(value).forEach(v => collectObjects(v, out));
  }
  return out;
}

function getUsdtAsset(accountData) {
  const data = accountData?.data;
  if (Array.isArray(data)) return data.find(x => String(x?.currency || x?.asset || "").toUpperCase() === "USDT") || null;
  if (data && typeof data === "object" && String(data.currency || data.asset || "").toUpperCase() === "USDT") return data;
  return null;
}

function availableBalance(accountData) {
  const usdt = getUsdtAsset(accountData);
  return num(usdt?.availableOpen ?? usdt?.availableBalance ?? usdt?.available ?? usdt?.available_amount) || 0;
}

function balanceDiagnostics(accountData) {
  const usdt = getUsdtAsset(accountData) || {};
  return {
    currency: String(usdt.currency || usdt.asset || "USDT"),
    availableOpen: num(usdt.availableOpen),
    availableBalance: num(usdt.availableBalance),
    availableCash: num(usdt.availableCash),
    cashBalance: num(usdt.cashBalance),
    frozenBalance: num(usdt.frozenBalance),
    positionMargin: num(usdt.positionMargin),
    orderMargin: num(usdt.orderMargin),
    equity: num(usdt.equity),
    unrealized: num(usdt.unrealized),
    selectedSource: usdt.availableOpen !== undefined && num(usdt.availableOpen) !== null ? "availableOpen" : "availableBalance"
  };
}

function accountEquity(accountData) {
  const arr = Array.isArray(accountData?.data) ? accountData.data : [];
  const usdt = arr.find(x => String(x.currency || x.asset || "").toUpperCase() === "USDT");
  return num(usdt?.equity ?? usdt?.walletBalance ?? usdt?.balance ?? usdt?.availableBalance ?? usdt?.available) || 0;
}

function calcVolume(contract, price, leverage = TARGET_LEVERAGE, orderUsdt = MAX_ORDER_USDT) {
  const size = num(contract?.contractSize) || 0.1;
  const minVol = Math.max(1e-12, num(contract?.minVol) || 1);
  const step = Math.max(1e-12, num(contract?.volUnit) || minVol);
  const maxVol = num(contract?.maxVol) || Infinity;
  if (!(price > 0) || !(size > 0)) return 0;
  const requestedUsdt = Math.max(0, Number(orderUsdt) || 0);
  const raw = (requestedUsdt * Math.max(1, leverage)) / (price * size);
  const stepped = Math.ceil(Math.max(minVol, raw) / step - 1e-12) * step;
  const capped = Math.min(stepped, maxVol);
  return Number(capped.toFixed(Math.max(0, Number(contract?.volScale) || 0)));
}

function priceDecimalsFromTick(tick) {
  const t = Number(tick);
  if (!(t > 0)) return 2;
  const s = t.toFixed(12).replace(/0+$/, "");
  const dot = s.indexOf(".");
  return dot >= 0 ? s.length - dot - 1 : 0;
}

function roundPrice(price, contract) {
  const tick = num(contract?.priceUnit) || 0.01;
  const decimals = priceDecimalsFromTick(tick);
  const n = Number(price);
  if (!Number.isFinite(n)) return null;
  const steps = Math.round((n / tick) + Number.EPSILON);
  const rounded = steps * tick;
  return Number(rounded.toFixed(decimals));
}

async function ensureTradableSymbol(symbol) {
  symbol = String(symbol || "").trim().toUpperCase();
  if (!symbol.endsWith("_USDT")) throw new Error("Symbol not allowed");
  if (ALLOWED_SYMBOLS.includes(symbol)) return true;
  const d = await mexc("GET", "/api/v1/contract/detail", { symbol });
  const c = Array.isArray(d?.data) ? d.data[0] : d?.data;
  const active = c && String(c.symbol || "").toUpperCase() === symbol &&
    (c.state === undefined || c.state === null || c.state === "" || Number(c.state) === 0);
  if (!active) throw new Error("Symbol not allowed");
  ALLOWED_SYMBOLS = Array.from(new Set([symbol, ...ALLOWED_SYMBOLS]));
  return true;
}

// ============================================================
// PREFLIGHT
// ============================================================
async function preflight(symbol = SYMBOL) {
  symbol = String(symbol || SYMBOL).toUpperCase();
  await refreshActiveSymbols(true);
  await ensureTradableSymbol(symbol);
  const signal = await getSignal(symbol);
  const [positions, orders, plans, account, leverage, mode, contract] = await Promise.all([
    getPositions(symbol), getCurrentOrders(symbol), getPlanOrders(symbol),
    getAccount(), getLeverage(symbol), getPositionMode(), getContract(symbol)
  ]);

  const balance = availableBalance(account);
  const balanceInfo = balanceDiagnostics(account);
  const price = signal.price || 0;
  const minLev = Math.max(1, num(contract?.minLeverage) || 1);
  const maxLev = Math.max(minLev, num(contract?.maxLeverage) || TARGET_LEVERAGE);
  const effectiveLeverage = Math.max(minLev, Math.min(TARGET_LEVERAGE, maxLev));
  const size = num(contract?.contractSize) || 0.1;
  const availableForOrder = Math.max(0, balance - ORDER_BALANCE_RESERVE_USDT);
  const requestedOrderUsdt = ADAPTIVE_ORDER_SIZE ? Math.min(MAX_ORDER_USDT, availableForOrder) : MAX_ORDER_USDT;
  let volume = price ? calcVolume(contract, price, effectiveLeverage, requestedOrderUsdt) : 0;

  if (ADAPTIVE_ORDER_SIZE && price && volume > 0) {
    const step = Math.max(1e-12, num(contract?.volUnit) || num(contract?.minVol) || 1);
    const minVol = Math.max(1e-12, num(contract?.minVol) || 1);
    let guard = 0;
    while (volume >= minVol && guard++ < 10000) {
      const testNotional = price * size * volume;
      const testMargin = effectiveLeverage > 0 ? testNotional / effectiveLeverage : testNotional;
      if (testMargin <= availableForOrder + 1e-9) break;
      const next = volume - step;
      if (next < minVol - 1e-12) { volume = 0; break; }
      volume = Number(next.toFixed(Math.max(0, Number(contract?.volScale) || 0)));
    }
  }
  const notional = price * size * volume;
  const margin = effectiveLeverage > 0 ? notional / effectiveLeverage : notional;

  const supportedOpenType = Number(contract?.positionOpenType);
  const configuredOpenType = CONFIGURED_OPEN_TYPE === 1 || CONFIGURED_OPEN_TYPE === 2 ? CONFIGURED_OPEN_TYPE : 1;
  const leverageObjects = collectObjects(leverage);
  const reportedOpenType = Number(leverageObjects.find(o => o.openType !== undefined)?.openType);
  const actualOpenType = (reportedOpenType === 1 || reportedOpenType === 2)
    ? reportedOpenType
    : ((supportedOpenType === 1 || supportedOpenType === 2) ? supportedOpenType : configuredOpenType);
  const openTypeOk = actualOpenType === 1 || actualOpenType === 2;
  const levOk = effectiveLeverage >= minLev && effectiveLeverage <= maxLev;
  const modeValues = collectObjects(mode).flatMap(o => [o.positionMode, o.positionModeType]).filter(v => v !== undefined).map(Number).filter(v => v === 1 || v === 2);
  const actualPositionMode = modeValues[0] || CONFIGURED_POSITION_MODE;
  const modeOk = actualPositionMode === 1 || actualPositionMode === 2;

  const balanceOk = balance >= margin + ORDER_BALANCE_RESERVE_USDT;
  const sizingOk = volume > 0 && notional > 0 && (!contract?.maxVol || volume <= Number(contract.maxVol));

  const ready = REAL_TRADING_ENABLED && signal.signal !== "WAIT" &&
    positions.length === 0 && orders.length === 0 && plans.length === 0 &&
    balanceOk && openTypeOk && levOk && modeOk && sizingOk;

  return {
    success: true, symbol, signal,
    noOpenPosition: positions.length === 0,
    noOpenOrders: orders.length === 0,
    noPlanOrders: plans.length === 0,
    balanceOk, isolatedMargin: actualOpenType === 1,
    openType: actualOpenType, actualOpenType, openTypeOk,
    leverageOk: levOk, effectiveLeverage, positionModeOk: modeOk,
    actualPositionMode, configuredPositionMode: CONFIGURED_POSITION_MODE,
    sizingOk, balance, balanceInfo, price, volume, notional, requiredMargin: margin,
    adaptiveOrderSize: ADAPTIVE_ORDER_SIZE, requestedOrderUsdt,
    orderBalanceReserveUSDT: ORDER_BALANCE_RESERVE_USDT,
    leverage, positionMode: mode, contract,
    liveTradingEnabled: REAL_TRADING_ENABLED,
    autoTradingEnabled: AUTO_TRADING_ENABLED,
    ready,
    readyReason: ready ? "READY" : [
      !REAL_TRADING_ENABLED && "REAL_TRADING_ENABLED=false",
      signal.signal === "WAIT" && `SIGNAL=${signal.reason || "WAIT"}`,
      positions.length > 0 && "open position exists",
      orders.length > 0 && "open order exists",
      plans.length > 0 && "plan order exists",
      !balanceOk && `insufficient balance (need ~${(margin + ORDER_BALANCE_RESERVE_USDT).toFixed(4)} USDT; available ${balance.toFixed(4)} USDT)`,
      !openTypeOk && `openType unavailable (resolved ${actualOpenType})`,
      !levOk && `leverage outside contract range (${minLev}-${maxLev})`,
      !modeOk && `position mode unavailable (${actualPositionMode})`,
      !sizingOk && "invalid contract quantity"
    ].filter(Boolean).join("; ")
  };
}

// ============================================================
// TP/SL PROTECTION
// ============================================================
async function getOpenTPSL(symbol = SYMBOL) {
  const normalize = (d) => {
    if (Array.isArray(d?.data)) return d.data;
    if (Array.isArray(d?.data?.resultList)) return d.data.resultList;
    if (Array.isArray(d?.resultList)) return d.resultList;
    return [];
  };
  const out = [];
  try {
    const d = await mexc("GET", "/api/v1/private/stoporder/open_orders", { symbol }, true);
    for (const x of normalize(d)) out.push({ ...x, __tpslSource: "current" });
  } catch (e) {
    console.log("TP/SL CURRENT QUERY ERROR", JSON.stringify({ symbol, error: e.message }));
  }
  try {
    const d = await mexc("GET", "/api/v1/private/stoporder/list/orders", { symbol, is_finished: 0, page_num: 1, page_size: 100 }, true);
    for (const x of normalize(d)) {
      const state = Number(x?.state);
      const finished = Number(x?.isFinished);
      if ((!Number.isFinite(finished) || finished === 0) && (!Number.isFinite(state) || state === 1)) {
        out.push({ ...x, __tpslSource: "list" });
      }
    }
  } catch (e) {
    console.log("TP/SL LIST QUERY ERROR", JSON.stringify({ symbol, error: e.message }));
  }
  return out;
}

function samePrice(a, b, contract, ticks = 2) {
  const tick = num(contract?.priceUnit) || 0.01;
  const x = num(a), y = num(b);
  return x !== null && y !== null && Math.abs(x - y) <= tick * Math.max(1, ticks) + 1e-9;
}

function protectionSemanticallyValid(direction, referencePrice, stop, take) {
  const ref =
