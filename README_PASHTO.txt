v34.9.1 — RISK GUARD / ROBUST PULLBACK ENTRY / ANTI-CHASE
دا نسخه د تېرو Entry ستونزو د بنسټیز اصلاح لپاره جوړه شوې ده.

اصلي ستراتیژي:
- 1D + 8H + 6H + 4H د لوی Trend جهت ټاکي.
- 1H د جهت Safety Confirmation دی.
- 15m د Entry اصلي timeframe دی.
- 5m یوازې diagnostic دی؛ 5m نه شي کولی غلط جهت جوړ کړي.
- Breakout/EMA pullback + reclaim باید موجود وي؛ یوازې لوړ score Entry نه جوړوي.
- Strong continuation fallback لرې شوی: که اصلي Pullback نه وي، Bot WAIT کوي.
- د Pullback وروسته هم که قیمت د وروستي high/low سره ډېر نږدې وي، Entry رد کېږي.
- د Pullback minimum depth د Entry mode له مخې سخت شوی.
- Candlestick confluence اوس د Entry په کیفیت کې عملي hard gate دی؛ یوازې candle pattern په ځان کې Entry نه جوړوي.
- ناوخته Entry د impulse ATR، room-to-extreme، EMA distance، S/R او timing checks له لارې رد کېږي.
- Structure-based SL ساتل شوی؛ ډېر تنګ default SL نه منل کېږي.
- د LONG/SHORT direction invariant ساتل شوی؛ signal او order direction باید عین وي.
- Max Open Positions=6 په فعال ډول نافذ دی؛ په هماغه symbol کې duplicate position هم نه پرېږدي.
- Initial TP=2% دی؛ د قوي momentum په صورت کې adaptive TP غځېدای شي.
- Leverage تر 12x محدود دی؛ که contract د exchange له خوا ټیټ حد ولري، هماغه حد کارول کېږي.
- Break-even د 2% ګټې شاوخوا فعالېږي او trailing stop د 3% ګټې وروسته د قیمت شاته حرکت کوي؛ stop هېڅکله شاته نه پراخېږي.
- هدف: لږې خو د ښه Entry ځای لرونکې معاملې؛ د trade شمېر د مجبورولو لپاره مصنوعي signal نه جوړېږي.

مهم:
- دا Bot د ګټې تضمین نه کوي. Real trading کې تل د تاوان امکان شته.
- د نوې نسخې له deploy وروسته /api/auto-status کې entryMode، pullbackDepthAtr، roomToExtremeAtr، lateEntryRisk او candlestickConfluence وګورئ.


--- پخوانی changelog ---
v34.8.6 — Soft HTF / Early Entry balance
- قوي 15m signal (90+) په mixed HTF حالت کې اجازه لري، خو 3+ مخالف HTF لا هم hard block دی او 1H conflict safety gate پاتې دی.
MEXC Futures Auto Trading Bot v34.4.5 — NO PULLBACK QUALITY MODE

دا نسخه د Pullback/Retest اجباري شرط لرې کوي.

اصلي بدلونونه:
- Pullback/Retest د Entry لپاره REQUIRED نه دی.
- 5m CLOSED candle trend + momentum signal کولای شي Entry جوړ کړي.
- LONG: Close > EMA9 > EMA21 >= EMA50 + bullish candle + volume/body quality.
- SHORT: Close < EMA9 < EMA21 <= EMA50 + bearish candle + volume/body quality.
- د ډېر ناوخته Entry مخنیوي لپاره EMA21 distance، extension، volatility، HTF alignment، score، RR او structure protection لا هم فعال دي.
- LONG/SHORT direction invariant ساتل شوی؛ signal باید د order direction سره عین وي.
- Real trading د deploy په وخت کې د .env له لارې کنټرولېږي. د ازموینې لپاره REAL_TRADING_ENABLED=false او AUTO_TRADING_ENABLED=false وساتئ.

یادونه: دا نسخه د Pullback شرط لرې کوي، خو د کیفیت ټول فلټرونه نه لرې کوي. هدف دا دی چې WAIT کم شي، خو خراب/ډېر ناوخته Entry هم ونه منل شي.


v34.4.5 اصلاحات: د fast scanner صفر-candidate ستونزه اصلاح شوه؛ د discovery او final entry شرطونه جلا شول؛ د API/scan خطاګانې اوس په status کې ښکاره کېږي؛ Pullback او Breakout اجباري نه دي.


v34.4.5 HOTFIX:
- د REQUIRE_BREAKOUT_RETEST د JavaScript comment کې پټ پاتې کېدل اصلاح شول.
- REQUIRE_BREAKOUT_RETEST اوس په کوډ کې په ښکاره ډول false دی.
- REQUIRE_PULLBACK_ENTRY هم hard-disabled دی، څو پخوانی Railway .env د Signal مخه ونه نیسي.
- Quality filters، breakout confirmation، HTF alignment، anti-chase، RR او protection checks لا هم فعال دي.


v34.5 — د غټو Timeframeونو نوې ستراتیژي
- اصلي تحلیل: 1D + 8H + 6H + 4H.
- 1H د Trend confirmation لپاره کارېږي.
- 15m د Entry trigger دی.
- 5m نور د Signal لپاره نه کارېږي.
- LONG یوازې هغه وخت چې د غټو Timeframeونو اکثریت LONG وي او 1H/15m تایید وکړي.
- SHORT هم همداسې برعکس؛ د Signal او Order direction سخت lock دی.
- لومړنی TP شاوخوا 3.5٪ دی، خو که 4H/1H/15m حرکت قوي پاتې شي، TP په 2٪-2٪ مرحلو کې تر 15٪ پورې غځېږي.
- Trailing stop تر 6٪ ګټې وروسته فعالېږي، څو قوي حرکت ډېر ژر بند نه کړي.
- د SL protection سیستم هم فعاله پاتې دی.
- هدف: د کوچنیو 5m شورونو پر ځای د غټو حرکتونو نیول.


v34.6 — STRICT PULLBACK + WICK ENTRY
- 1D + 8H + 6H + 4H د اصلي جهت لپاره؛ لږ تر لږه 3 له 4 څخه باید یو جهت تایید کړي.
- 1H باید د Entry له جهت سره مخالف نه وي.
- 15m اصلي Entry timeframe دی.
- د Breakout په هماغه کندل کې Entry نه کېږي. لومړی Breakout، بیا Pullback/Retest، بیا Reclaim غواړي.
- د LONG لپاره د 15m کندل lower wick د upper wick سره مقایسه کېږي؛ د SHORT لپاره upper wick د lower wick سره مقایسه کېږي.
- د عمودي Pump په سر کې LONG او د Dump په ښکته کې SHORT نه اخلي.
- SL د Pullback/Retest د swing له شا + ATR buffer څخه جوړېږي؛ که structure ډېر لرې وي، Entry رد کېږي.
- 5m یوازې diagnostic دی او د 15m صحیح Entry په خپله نه بندوي.
- مصنوعي Entry cooldown = 0؛ معتبر setup په وخت کې د cooldown له امله نه بندېږي.
- Score تر 100 پورې رسېږي، خو 100٪ ګټه/بریا هېڅ سیستم تضمینولی نه شي.
- TP adaptive پاتې دی او قوي حرکت کې غځېږي.


v34.8.1 — اصلاحات مهم:
- د MAX_OPEN_POSITIONS پخوانی default=1 لرې شو؛ POSITION_LIMIT_ENABLED=false په default کې دی.
- څو مختلفو کوینونو کې پوزیشنونه هممهاله خلاصولی شي.
- د هماغه symbol موجود position/order لا هم د duplicate entry مخه نیسي.
- د final preflight لپاره د قوي candidates شمېر تر 15 پورې لوړ شو؛ که لومړی قوي signal د manual position، balance، spread، news یا exchange preflight له امله بند شي، راتلونکی قوي signal هم ازمویل کېږي.
- Pullback/Breakout flags نور د پخواني Railway env له امله په پټه سخت gate نه جوړوي.
- بوټ د هر scan لپاره ټول active USDT universe لټوي او د موجودو معتبره setupونو له منځه تر ټولو قوي trade هڅوي؛ خو د بازار د نشتوالي په صورت کې مصنوعي/جبري trade نه جوړوي.


v34.8.4 — NO-LATE-ENTRY / SMART PULLBACK
- د 15m لوی impulse وروسته په سر/لاندې کې Entry ردوي.
- د وروستي swing extreme ته نږدې chasing بندوي.
- زوړ/stale retest که له 6 closed 15m candles څخه ډېر تېر وي او حرکت ډېر غټ شوی وي، ردوي.
- د حقیقي pullback لپاره لږ تر لږه 0.55 ATR ژوروالی غواړي کله چې بازار ډېر غځېدلی وي.
- هدف: د XMR/EUL په شان د لوی حرکت په پای کې LONG/SHORT نه اخیستل؛ Bot باید Pullback/Re-test ته انتظار وباسي او بیا بل coin وازمويي.
