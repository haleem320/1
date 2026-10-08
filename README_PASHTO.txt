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
