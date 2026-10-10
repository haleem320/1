v34.9.2 — RISK GUARD / ROBUST PULLBACK ENTRY / ANTI-CHASE
==========================================================
دا نسخه د ټولو پخوانیو نسخو ستونزې حل کوي او د کوډ سره یې
متناقض changelog یو ځای کوي.

اصلي ستراتیژي (CURRENT BEHAVIOR)
--------------------------------
- 1D + 8H + 6H + 4H د لوی Trend جهت ټاکي (لږ تر لږه 2 له 4).
- 1H د جهت Safety Confirmation دی.
- 15m د Entry اصلي timeframe دی.
- 5m یوازې diagnostic دی؛ 5m نه شي کولی غلط جهت جوړ کړي.
- Entry درې مرحلې لري:
  1) STRICT: 15m breakout → pullback/retest → wick rejection → reclaim
  2) BALANCED: EMA21/EMA50 pullback → wick rejection → reclaim
  3) EARLY: fresh shallow EMA pullback (0.18–0.55 ATR) + wick reclaim
- که درې واړه پاس نه کړي، Bot WAIT کوي. هېڅ continuation fallback نشته.
- Candlestick confluence د Entry په کیفیت کې عملي hard gate دی.
- ناوخته Entry د impulse ATR، room-to-extreme، EMA distance، S/R او
  timing checks له لارې رد کېږي.
- Structure-based SL (swing + ATR buffer، 0.8%–2.5%).
- LONG/SHORT direction invariant ساتل شوی.
- Max Open Positions=3; Max Same-Direction=3; duplicate symbol بند دی.
- Initial TP=2%؛ د قوي momentum په صورت کې adaptive TP تر 15% پورې.
- Leverage تر 12x محدود؛ که contract ټیټ حد ولري، هماغه کارول کېږي.
- Break-even د +2% ګټې، trailing د +3% وروسته؛ stop هېڅکله شاته نه ځي.

مهم
----
- دا Bot د ګټې تضمین نه کوي. Real trading کې تل د تاوان امکان شته.
- Real trading یوازې هغه وخت چې REAL_TRADING_ENABLED=true او
  AUTO_TRADING_ENABLED=true وي.
- د deploy وروسته /api/auto-status کې entryMode، pullbackDepthAtr،
  roomToExtremeAtr، lateEntryRisk او candlestickConfluence وګوره.

API Endpoints
-------------
GET  /health                      بې auth؛ د bot حالت لنډیز
GET  /api/signal?symbol=...       یو symbol تحلیل
GET  /api/signals                 د ټول universe تحلیل
GET  /api/preflight?symbol=       د entry وړاندوینه (auth)
GET  /api/order-preview?symbol=   بې auth د order preview
GET  /api/positions               اوسنۍ پوزیشنونه (auth)
GET  /api/account                 د USDT بیلانس (auth)
GET  /api/symbols                 د فعالو symbol لړ
GET  /api/news-risk               خبرونه / خطر
GET  /api/config                  د bot config
GET  /api/diagnostic              د وروستي scan تفصیل
GET  /api/auto-status             د auto loop حالت
GET  /api/trade-manager-status    د trade manager حالت
GET  /api/trade-stats?days=7      د تجارت احصائیې
POST /api/order                   د لاسي entry (auth)
POST /api/auto-run                د لاسي scan (auth)
POST /api/trade-manager-run       د لاسي manage (auth)

مهم فایلونه
-------------
- .env.example   → د env ټول options
- Dockerfile     → Railway د دې له مخې build کوي
- railway.toml   → deploy config
- server.js      → د bot بشپړ کوډ

نسخه بدلون (خلاصه)
------------------
v34.9.2  د README او کوډ تر منځ ناسازګاري حل؛ SCAN_BATCH_SIZE rotation
         سم؛ د JSON responses تکراري کلیدونه پاک؛ entryTimingGuard
         یو شرط؛ د version numbers یو شان؛ Dockerfile اضافه.
v34.9.1  RISK GUARD / robust pullback entry / anti-chase.
v34.9.0  EARLY-ENTRY zone؛ no continuation fallback.
v34.8.6  Soft HTF / early entry balance.
v34.8.5  Early pullback + no-late-entry engine.
v34.8.4  No-late-entry / smart pullback.
v34.8.2  Strong-15m fallback (بیا لرې شو).
v34.8.1  Balanced pullback fallback.
v34.6    Strict pullback + wick entry.
v34.5    HTF trend engine (1D/8H/6H/4H).
v34.4.5  No-pullback quality mode (بیا لرې شو).
