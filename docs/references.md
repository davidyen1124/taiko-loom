# Genre references

Taiko Nights is an original game: its own code, its own characters, its own artwork.
This file records what was studied to reach gameplay parity with the taiko rhythm
genre. It holds links and written notes only. No third-party image, sprite, sound or
chart is stored in this repository, and none was used to make the artwork.

How the notes were used:

- **Layout conventions** (Part 2) set where the lane, target, gauge and player panel sit.
- **Rules and numbers** (Part 3) set the timing windows, gauge thresholds and scoring in
  `src/game/rules.js`, and the per-difficulty charting habits in
  `src/game/charting.js`.
- Where this game differs on purpose, `README.md` says so under "Rules".

Research date: 2026-09-27. Purpose: layout conventions and rule parity for an original taiko-style browser rhythm game (own art, own characters, own code). Nothing here is meant to be copied as an asset; screenshots and sprite pages are for looking, not for reuse.

## How to read this file

- **[V]** = verified against a cited text or source-code source during this research.
- **[U]** = unverified / from general knowledge. Treat as a hint and confirm by eye against the linked screenshots.
- **No image was opened or viewed during this research** (images were not downloaded). The "what is visible" notes in Part 1 come from page captions, alt text, file names and surrounding article text. Where the page gave no caption the note says so.
- Layout numbers in Part 2 are given on a **1280 x 720 reference grid** and as **% of a 16:9 screen**. They were read from two open-source simulators that reproduce the 2011-2019 arcade layout: taiko-web (`public/src/js/view.js`, `canvasdraw.js`, `viewassets.js`, `scoresheet.js`, `songselect.js`) and TJAPlayer3 (`TJAPlayer3/Common/CSkin.cs` default skin values). The two agree closely (lane top y=192, judge circle x=413 in both), which is good evidence that they match the arcade layout they imitate.
- Version shorthand: AC15 = arcade 2011-2020 ("new cabinet", colour-named versions such as Sorairo, Murasaki, White, Red, Yellow, Blue, Green). AC16 = arcade Nijiiro (2020-). CS = console.

---

## Part 1 - Reference link list

70 rows (many rows name further images from the same set in the note column). "Direct image URL" is blank where the page is a gallery, video, source repository or is bot-protected.

### 1A. Arcade - Nijiiro (AC16)

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 1 | https://taiko.namco-ch.net/taiko/en/howto/index.php | https://taiko.namco-ch.net/taiko/en/images/howto/pic_01.png | Arcade Nijiiro (official) | Gameplay normal | Official annotated play-screen diagram with numbered callouts: 1 score, 2 nameplate, 3 song title + genre, 4 difficulty, 5 notes, 6 soul gauge. Best single layout reference. |
| 2 | https://taiko.namco-ch.net/taiko/en/howto/index.php | https://taiko.namco-ch.net/taiko/en/images/howto/pic_02.png | Arcade Nijiiro (official) | How-to | Alt text "How to Play": drum face vs rim input illustration. |
| 3 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/img_onpu_01.png | Arcade Nijiiro (official) | Note art | Small don note ("hit the surface"). |
| 4 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/img_onpu_02.png | Arcade Nijiiro (official) | Note art | Small ka note ("hit the rim"). |
| 5 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/img_onpu_03.png | Arcade Nijiiro (official) | Note art | Big don. (img_onpu_04.png = big ka.) |
| 6 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/img_onpu_05.png | Arcade Nijiiro (official) | Drumroll | Yellow drumroll bar. (img_onpu_06.png = big drumroll.) |
| 7 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/img_onpu_07.png | Arcade Nijiiro (official) | Balloon | Balloon note. (08 = hand-holding note, 09 = party popper / kusudama.) |
| 8 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/pic_03.png | Arcade Nijiiro (official) | Judgement | Sits under the "Rhythm & Timing" heading: GOOD / OK / BAD illustration. |
| 9 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/pic_10.jpg | Arcade Nijiiro (official) | Results | The seven score-rank badges in ascending order. |
| 10 | https://taiko.namco-ch.net/taiko/en/howto/onpu.php | https://taiko.namco-ch.net/taiko/en/images/howto/pic_11.jpg | Arcade Nijiiro (official) | Results | Clear / Full Combo / Donderful Combo crowns. |
| 11 | https://www.4gamer.net/games/140/G014093/20200324028/ | https://www.4gamer.net/games/140/G014093/20200324028/SS/005.jpg | Arcade Nijiiro | Results | Placed beside the score-rank paragraph of the launch press release. |
| 12 | https://www.4gamer.net/games/140/G014093/20200324028/ | https://www.4gamer.net/games/140/G014093/20200324028/SS/006.jpg | Arcade Nijiiro | Results / crowns | Placed beside the Donderful Combo crown paragraph (007, 008 are the companion images). |
| 13 | https://www.4gamer.net/games/140/G014093/20200324028/ | https://www.4gamer.net/games/140/G014093/20200324028/SS/009.jpg | Arcade Nijiiro | Options | Placed beside the play-options paragraph (note position adjust, speed, skip). |
| 14 | https://gamesdb.launchbox-app.com/games/images/160609-taiko-no-tatsujin-nijiiro-version | https://images.launchbox-app.com/r2_63caa1fc-ca80-4ca5-88d4-51b2111ff7bd.png | Arcade Nijiiro | Gameplay | Labelled "Screenshot - Gameplay (Japan)". |
| 15 | https://gamesdb.launchbox-app.com/games/images/160609-taiko-no-tatsujin-nijiiro-version | https://images.launchbox-app.com/edeed191-812a-4486-a29d-bcb6f487cd84.jpg | Arcade Nijiiro | Gameplay | Labelled "Screenshot - Gameplay". Second one: https://images.launchbox-app.com/9e1d7ac7-53b4-47d9-a01c-2cc568207969.jpg |
| 16 | https://gamesdb.launchbox-app.com/games/images/160609-taiko-no-tatsujin-nijiiro-version | https://images.launchbox-app.com/r2_5330e593-52e8-4690-a050-7000b2586fe7.jpg | Arcade Nijiiro | Title | Labelled "Screenshot - Game Title (Japan)". |
| 17 | https://commons.wikimedia.org/wiki/File:Taiko_no_tatsujin%E3%80%90nijiiro_version%E3%80%91.jpg | https://upload.wikimedia.org/wikipedia/commons/0/0d/Taiko_no_tatsujin%E3%80%90nijiiro_version%E3%80%91.jpg | Arcade Nijiiro | Cabinet photo | CC BY-SA 4.0 photo of the cabinet, screen visible. |
| 18 | https://commons.wikimedia.org/wiki/File:Taiko_no_Tatsujin_AC16_CN.jpg | https://upload.wikimedia.org/wikipedia/commons/9/9e/Taiko_no_Tatsujin_AC16_CN.jpg | Arcade Nijiiro (China) | Cabinet photo | CC BY-SA 4.0. |
| 19 | https://www.youtube.com/watch?v=r_HWQUEe7bE | | Arcade Nijiiro | Gameplay video | Player capture, Ura Oni, all-good run: long combo, full gauge, go-go sections. |
| 20 | https://www.youtube.com/watch?v=lMqby-ZuVmo | | Arcade Nijiiro | Gameplay video | Player capture, all-good run. |
| 21 | https://www.youtube.com/watch?v=iGGn_phmIqY | | Arcade Nijiiro | Gameplay video | Player capture of a 1500-note chart: dense streams, 4-digit combo display. |

### 1B. Older arcade and PS2

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 31 | https://taikotime.blogspot.com/2010/11/how-to-play.html | https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjEgletQ_ZI5C5thK35tmyOK3CtYheqR3xfpJbUpovTvtTfe-ctagFPUe5KnV9Ju6BRjcQAjX2eCd1bU9tM0XKQYb1xxuLgSlLHvFT6kfSvyvjIPDkR1e-N31nvH9PiVD019k-dnhnXGyMy/s400/tutscrn.png | Older arcade / console | Gameplay normal | Tutorial screenshot showing notes scrolling to the circular mark at the left. |
| 32 | https://taikotime.blogspot.com/2010/11/how-to-play.html | https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhyyenFBG1nUotR82myzVVm3DIKrcMnpFF3J3YpuKJKZdm0c5FE3q7ydfvUbAvcfs6xYNJTz2EIK59-bzDqndg_hpW_mHKc-Y98SeZBdZ91QDDvNrF6PvDzvk68BpPaXx-uyhKiiT9IJNI7/s400/nutut8.png | Older arcade / console | Gauge | Placed beside the text about the gauge in the top-right and the norma line. |
| 33 | https://taikotime.blogspot.com/2010/11/how-to-play.html | https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEgt5gd3E8Tp0HTiE4ZETTD3ict9GIavMSzQMbr39izcMSuC6_uHrtvDK5qDvtUROmSz6WLEae7CVq4CN5qojXDhscX2IzNGTanCvD5SCWgn1XEuR0mpeukaHUjlR1fr8UN-bjFLAYX8rqAj/s1600/nutut9.png | Older arcade / console | Combo | Placed beside the text about the combo counter. |
| 34 | https://taikotime.blogspot.com/2010/11/how-to-play.html | https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEi2YFrSjk68MvJ366msB79ZTm7od5ehahyphenhyphenCY07lbYjH6bTwY2WkNbHdfd6RyKlB_shyx5TTPfm7sqDDXzdXLsZ6AEEbSMiRX93MywhujTZKREqE9v4Cr8Vdanqn5Et7NiDZOuSxOgOwsxFI/s320/drumroll.gif | Older arcade / console | Drumroll | Animated drumroll note. Balloon equivalent is `balloon.gif` on the same page. |
| 35 | https://taikotime.blogspot.com/2010/08/advanced-rules.html | https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEiMBN1HcJM-2joMYSwdxt2sxe_sPE2Xpa5S7Bh_iQoOjN6tVfr3ODcbslRJ7NrSYE2t391jjAL8GbXP0Cmwz_MXPDz6qcuf5ypNrdKAat9JedV6Wcbo8a8m3DyO7vYIGSmfg1hcdXVueZ0W/s320/ryou.png | Older arcade / console | Judgement | The 良 judgement graphic (`ka.png` on the same page is 可). Page also covers go-go time and special notes. |
| 36 | https://commons.wikimedia.org/wiki/File:Taiko_no_Tatsujin_selecting_song.jpg | https://upload.wikimedia.org/wikipedia/commons/b/bb/Taiko_no_Tatsujin_selecting_song.jpg | Older arcade | Song select | CC BY 2.0 photo, described as a player selecting a song. |
| 37 | https://commons.wikimedia.org/wiki/File:Taiko_no_Tatsujin_versus_play.jpg | https://upload.wikimedia.org/wikipedia/commons/b/bc/Taiko_no_Tatsujin_versus_play.jpg | Older arcade | Gameplay 2P | CC BY-SA 2.0 photo of versus mode: two stacked lanes. |
| 38 | https://commons.wikimedia.org/wiki/File:Taiko_no_tatsujin_9.jpg | https://upload.wikimedia.org/wikipedia/commons/d/db/Taiko_no_tatsujin_9.jpg | Older arcade (Taiko 9) | Results / clear | CC BY 2.0 photo described as two players clearing a song. |
| 39 | https://commons.wikimedia.org/wiki/File:Taiko_no_Tatsujin_White_Ver_Arcade.jpg | https://upload.wikimedia.org/wikipedia/commons/f/fe/Taiko_no_Tatsujin_White_Ver_Arcade.jpg | Arcade AC15 White | Cabinet photo | CC BY-SA 2.0, game being played. |
| 40 | https://commons.wikimedia.org/wiki/File:%E5%A4%AA%E9%BC%93%E3%81%AE%E9%81%94%E4%BA%BA15%E3%82%BD%E3%83%A9%E3%82%A4%E3%83%ADver1.JPG | https://upload.wikimedia.org/wikipedia/commons/8/88/%E5%A4%AA%E9%BC%93%E3%81%AE%E9%81%94%E4%BA%BA15%E3%82%BD%E3%83%A9%E3%82%A4%E3%83%ADver1.JPG | Arcade AC15 Sorairo | Cabinet photo | CC BY-SA 3.0. |
| 41 | https://commons.wikimedia.org/wiki/Category:Taiko_no_Tatsujin | | Arcade, many versions | Mixed | About 80 freely licensed photos of cabinets in use. |
| 42 | https://gamesdb.launchbox-app.com/games/images/9450-taiko-drum-master | https://images.launchbox-app.com/r2_11e1aacc-3cae-4f69-a472-d9587893da61.jpg | PS2 Taiko: Drum Master | Gameplay | Labelled "Screenshot - Gameplay". |
| 43 | https://gamesdb.launchbox-app.com/games/images/9450-taiko-drum-master | https://images.launchbox-app.com/r2_5ec0daed-8e70-4a8b-86d6-c5e8fef33584.jpg | PS2 Taiko: Drum Master | Select | Labelled "Screenshot - Game Select". Title screen: https://images.launchbox-app.com/r2_344b5535-383b-4c0a-b7b9-25c7970cc426.jpg |
| 44 | https://gamesdb.launchbox-app.com/games/images/427353-taiko-no-tatsujin-green-version | https://images.launchbox-app.com/4bc46f45-32e7-498e-9ed5-d2af62f88277.jpg | Arcade AC15 Green | Title | Labelled "Screenshot - Game Title". |

### 1C. Switch - Drum 'n' Fun

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 45 | https://gamesdb.launchbox-app.com/games/images/107770-taiko-no-tatsujin-drum-n-fun | https://images.launchbox-app.com/60fbfd36-241c-4280-9ca5-c2fbd3cb481e.jpg | Switch Drum 'n' Fun | Gameplay | Labelled "Screenshot - Gameplay". Exact screen not individually confirmed. |
| 46 | https://gamesdb.launchbox-app.com/games/images/107770-taiko-no-tatsujin-drum-n-fun | https://images.launchbox-app.com/52eaad52-9d29-4a26-89b0-e66a2534ae22.jpg | Switch Drum 'n' Fun | Gameplay | Same label. More in the set: `2b77f474-b964-4501-a3dc-20b3c64a9318.jpg`, `cc00d4c7-b955-4524-944a-c7d5c55e95ec.jpg`, `9ca7e41a-a673-4339-bc9f-0bdf9a7a4fa4.jpg`, `d38eeeaa-3421-45ac-8d59-380c34705fb2.jpg` on the same host. |
| 47 | https://www.gameuidatabase.com/gameData.php?id=296 | | Switch Drum 'n' Fun | All screens | Game UI Database entry with screens sorted by type (menus, HUD, results). Bot-protected, open in a browser. |
| 48 | https://switch.taiko-ch.net/howto/ | | Switch Drum 'n' Fun (official JP) | How-to | Official how-to pages, including the rule that big notes score higher when both sides are hit together. |

### 1D. Switch / PS5 / Xbox / Steam - Rhythm Festival

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 49 | https://dondafulfestival-20th.taiko-ch.net/mode/play.php | https://dondafulfestival-20th.taiko-ch.net/images/mode/play/ss_play_01.png | Rhythm Festival (official JP) | Gameplay | Official screenshot in the "play mode" section. No caption. |
| 50 | https://dondafulfestival-20th.taiko-ch.net/mode/play.php | https://dondafulfestival-20th.taiko-ch.net/images/mode/play/ss_play_02.png | Rhythm Festival (official JP) | Gameplay | Second official screenshot in the same section. No caption. |
| 51 | https://store.steampowered.com/app/2288630/Taiko_no_Tatsujin_Rhythm_Festival/ | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2288630/ss_239db8182d082194a71619da2edb622f89bd1794.1920x1080.jpg | Rhythm Festival (Steam) | Unlabelled | First of ten official 1920x1080 store screenshots. Steam gives no captions. |
| 52 | https://store.steampowered.com/app/2288630/Taiko_no_Tatsujin_Rhythm_Festival/ | https://shared.akamai.steamstatic.com/store_item_assets/steam/apps/2288630/ss_ab4de84414ffcb3cce90a75f16a59bc77e1ac9bb.1920x1080.jpg | Rhythm Festival (Steam) | Unlabelled | Others in the set share the path and end in `ss_ca6f5b73085048ea78a5d05420f871f1a7cd9476`, `ss_7e9c3bcf5f22d0be0fbcc01edceebefce23a9cf9`, `ss_d93c6a90858b6afd8f9d1ab4df593b24e8612ea9`, `ss_0af0c99db01b1f167974520efb6ecc8336979c20`, `ss_f2220aa4c3900f37164e3185b59e39effe56a03d`, `ss_d0bad133e3ee815bbbff7f29edef3320353b2681`, `ss_745d155d7f4fa9d3c1a4e94a176129951e5f139b`, `ss_7b9f9d6fcb4fbbac6959305d2018aafb27bcadc2` + `.1920x1080.jpg`. |
| 53 | https://www.nintendolife.com/reviews/nintendo-switch/taiko-no-tatsujin-rhythm-festival | https://images.nintendolife.com/screenshots/128302/large.jpg | Rhythm Festival (Switch) | Unlabelled | Review screenshot 1 of 5. Others: 128308, 128303, 128305, 128306 with the same `/large.jpg` suffix. |
| 54 | https://gamesdb.launchbox-app.com/games/images/158873-taiko-no-tatsujin-rhythm-festival | https://images.launchbox-app.com/6efc41e6-4b51-4d74-becb-faf493231238.png | Rhythm Festival | Gameplay | Labelled "Screenshot - Gameplay". Five more on the page. |
| 55 | https://www.youtube.com/watch?v=VtI77yAjjVk | | Rhythm Festival | Video | Bandai Namco America "Game Modes Trailer": Taiko mode plus party modes. |
| 56 | https://www.youtube.com/watch?v=azFTGYIll1s | | Rhythm Festival (PS5/Xbox/PC) | Video | Official Taiko channel launch trailer. |
| 57 | https://www.youtube.com/watch?v=Hla3hA677vc | | Rhythm Festival (Switch) | Video | Official TV commercial showing play styles. |

### 1E. PS4, Xbox, Wii, DS, PSP, Vita, mobile

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 58 | https://www.truetrophies.com/game/Taiko-no-Tatsujin-Drum-Session/screenshots | | PS4 Drum Session | Gallery | Screenshot gallery page. Bot-protected, open in a browser. |
| 59 | https://www.4gamer.net/games/384/G038458/20171012034/ | https://www.4gamer.net/games/384/G038458/20171012034/TN/001.jpg | PS4 Drum Session | Unlabelled | DLC announcement article image. |
| 60 | https://gamesdb.launchbox-app.com/games/images/158716-taiko-no-tatsujin-the-drum-master | https://images.launchbox-app.com/128dc49f-4766-417a-8468-2ec6d4fae98e.jpg | Xbox / PC The Drum Master | Gameplay | Labelled "Screenshot - Gameplay". This title uses the Nijiiro-style fixed scoring. |
| 61 | https://gamesdb.launchbox-app.com/games/images/73884-taiko-no-tatsujin-wii | https://images.launchbox-app.com/3c355b94-7bab-4daf-93a9-775a5500d238.jpg | Wii | Gameplay | Labelled "Screenshot - Gameplay". |
| 62 | https://gamesdb.launchbox-app.com/games/images/31911-taiko-no-tatsujin-portable-dx | https://images.launchbox-app.com/640bffae-b272-4a75-b8f3-e140260a61cc.jpg | PSP Portable DX | Gameplay | Labelled "Screenshot - Gameplay". Title screen: `7b032720-6371-4da8-ae7d-4d922f0357d4.jpg`. |
| 63 | https://gamesdb.launchbox-app.com/games/images/92318-taiko-no-tatsujin-ds-touch-de-dokodon | https://images.launchbox-app.com/063baa5b-b60d-464a-bd59-2ddd57c52464.jpg | DS | Gameplay | Labelled "Screenshot - Gameplay". Dual-screen layout. |
| 64 | https://gamesdb.launchbox-app.com/games/images/134458-taiko-no-tatsujin-v-version | https://images.launchbox-app.com/18ae6906-bdb0-40d1-afb3-f1e0d22e674b.png | PS Vita V Version | Gameplay | Labelled "Screenshot - Gameplay". |
| 65 | https://apps.apple.com/us/app/taiko-no-tatsujin-pop-tap-beat/id1463360242 | https://is1-ssl.mzstatic.com/image/thumb/PurpleSource114/v4/9f/02/66/9f0266c9-9dc3-9e03-ae2b-7cc53bca6458/51dda039-d828-4d72-a245-d0e3b3229066_iphoneXS_MAX_p01.jpg/1286x0w.webp | Mobile Pop Tap Beat | Store screenshot | First of three iPhone store screenshots (p01, p02, p03). Touch layout with an on-screen drum. |

### 1F. taiko-web (open-source browser simulator)

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 66 | https://www.kocpc.com.tw/archives/240012 | https://www.kocpc.com.tw/wp-content/uploads/2019/01/1547862102-aeb13d310a014f59a96dcf5bf4d1b940.jpg | taiko-web | Title | First image of the article, the opening screen. |
| 67 | https://www.kocpc.com.tw/archives/240012 | https://www.kocpc.com.tw/wp-content/uploads/2019/01/1547862115-541bd63d49954f6a8dc5cc10b5dfb14a.jpg | taiko-web | Song select | Caption points at the purple "random song" bar. `1547862122-4acb18f1853fd93f888e44ec83fd02f1.jpg` shows a selected song with its difficulties. |
| 68 | https://www.kocpc.com.tw/archives/240012 | https://www.kocpc.com.tw/wp-content/uploads/2019/01/1547862129-7f7c0af3181f68c71f458a77d091e0df.jpg | taiko-web | Difficulty select | Caption: choose difficulty, harder to the right. |
| 69 | https://www.kocpc.com.tw/archives/240012 | https://www.kocpc.com.tw/wp-content/uploads/2019/01/1547862135-b58814e9c2eb79610de25bb09b534c8b.jpg | taiko-web | Gameplay | Caption mentions small notes, big notes, yellow drumroll and balloon. `1547862143-172c2485fa809809bd06c74a6140a292.jpg` is captioned as showing drumroll count and score. |
| 70 | https://www.kocpc.com.tw/archives/240012 | https://www.kocpc.com.tw/wp-content/uploads/2019/01/1547862151-72546e343093964466831b4670f97c6c.jpg | taiko-web | Results | Caption: score and rating after the song. Pause menu: `1547862160-9475231b88f7f101ee2087195cc58006.jpg`. |
| 71 | https://mrmad.com.tw/taiko-drum-master-web | https://mrmad.com.tw/wp-content/uploads/2019/01/taiko-drum-master-web-3.jpg | taiko-web | Gameplay | Follows the paragraph explaining note types. Same folder: `-1.jpg` song select, `-2.jpg` difficulty select, `-5.jpg` results with crown, `-8.jpg` two-player play with two lanes, `-9.jpg` two-player results, `-pc.jpg` desktop play. |
| 72 | https://github.com/Mik027/taiko-web | | taiko-web | Source code | Mirror of the original project. Layout numbers in Part 2 come from its `public/src/js/` files. Other write-ups: https://unwire.hk/2019/01/20/taikoweb/game-channel/ , https://iqmore.tw/taiko-no-tatsujin-simulator-web-game |

### 1G. OpenTaiko / TJAPlayer3

| # | Page URL | Direct image URL | Version | Screen | Note |
|---|---|---|---|---|---|
| 73 | https://github.com/gtensha/OpenTaiko | https://raw.githubusercontent.com/gtensha/OpenTaiko/master/screenshot1.png | OpenTaiko (gtensha, an unrelated project of the same name) | Gameplay | README caption "Gameplay". Minimal original-art take on the genre, useful as a clean-room example. |
| 74 | https://github.com/gtensha/OpenTaiko | https://raw.githubusercontent.com/gtensha/OpenTaiko/master/screenshot0.png | OpenTaiko (gtensha) | Song select | README caption "Song select". |
| 75 | https://opentaiko.github.io/ | | OpenTaiko (0auBSQ) | Site | Official site. Main repo https://github.com/0auBSQ/OpenTaiko has only a logo in its README. |
| 76 | https://www.youtube.com/watch?v=5b_-iP0DPo0 | | OpenTaiko (0auBSQ) | Gameplay video | ESA Winter 2024 showcase. Channel: https://www.youtube.com/@OpenTaiko |
| 77 | https://github.com/OpenTaiko/OpenTaiko-Skins | | OpenTaiko | Skins | Skin repository: shows how the layout is split into textures. |
| 78 | https://github.com/twopointzero/TJAPlayer3 | | TJAPlayer3 | Source code | No screenshots in README. Default layout numbers are in `TJAPlayer3/Common/CSkin.cs` (read from the AioiLight fork). |
| 79 | https://iepiweidieng.github.io/TJAPlayer3/tja/ | | TJA format | Spec | The most complete TJA format reference found. Used heavily in Part 3. |

Excluded on purpose: a PlayStation Store "concept" URL that turned up in search resolved to an unrelated game.

---

## Part 2 - Screen anatomy

Reference grid: 1280 x 720. "x 25.9%" means 25.9% of screen width from the left; "y 26.7%" means 26.7% of screen height from the top.

### 2.0 Gameplay screen at a glance

```
y=0   +----------------------------------------------------------------------+
      | TOP STRIP (mascot background)                    SONG TITLE (right)  |
      | [mascot]  [callout / roll bubble]                       [genre pill] |
      |                          [gauge: red segments | taller yellow ][soul]|
y=184 +======================================================================+  black frame
y=192 | LEFT PANEL        |  LANE (dark grey)                                 |
      | score  [drum+combo]| (O) judge circle   o  O   o o o   ===roll===>    |
      | [difficulty badge] |                                                  |
y=322 |                    +--------------------------------------------------+
y=326 |                    | syllable strip: don  ka  don  roll--             |
y=352 +======================================================================+
y=360 | BOTTOM HALF: stage background, dancers, crowd, fireworks in go-go     |
y=720 +----------------------------------------------------------------------+
      x=0              x=328/332                                        x=1280
```

Vertical budget: top strip 25.6%, lane block (with black frame) 24.4%, bottom scene 50%.

### 2.1 Gameplay - element by element

| Element | Position and size (1280x720) | % of screen | Look | Source |
|---|---|---|---|---|
| Top background strip | x 0-1280, y 0-184 | full width, top 25.6% | Looping patterned backdrop behind the mascot. Swaps to a brighter "clear" variant once the gauge passes the clear line. | [V] taiko-web; wikiwiki says the mascot and dancer backgrounds change on reaching clear |
| Mascot | Sprite frame 360 x 184 at x 0, y 0 | left 28% of width, full strip height | Animated to the beat. States: idle, jump on every 10th combo, "clear" dance, go-go start, go-go dance. | [V] taiko-web `viewassets.js`; TJAPlayer3 places it at (0,0) |
| Song title | Right-aligned, right edge about x 1254-1270, top y 10-14, font 30-40 px, max width 600 | right edge 98%, top 1.5%, text height about 5% | White fill, black outline about 10 px, single line, shrinks to fit. | [V] both simulators |
| Genre pill | 142 x 22, corner radius 11, right-aligned under the title at about y 76-98 | 11% x 3% | Rounded pill filled with the genre colour, white 15 px text. | [V] taiko-web; TJAPlayer3 genre at (1114, 74) |
| Player nameplate | taiko-web: 273 x 66 at (320, 20), in the top strip. TJAPlayer3: (0, 288), inside the left panel. | 21% x 9% | Rounded plate with player name, red for 1P and blue for 2P. | [V] simulators disagree on position. The official arcade diagram lists a nameplate as its own element; exact arcade position [U] |
| Soul gauge | Assembly 788 wide anchored to the right edge: x 492-1280, y 135-187. 50 segments at 14 px each = 700 px (x 492-1192). | x 38.4%-93.1%, y 18.8%-26.0% | See 2.2. | [V] taiko-web `canvasdraw.js` |
| Soul icon | Centre (1223, 165), about 42 px | x 95.5%, y 22.9% | Flame-shaped badge with the character 魂. Grey (#737373) until clear, white and lit after. | [V] taiko-web |
| Black frame | Full-width band y 184-360 behind the lane block | y 25.6%-50% | Pure black. Reads as 8 px borders above and below the lane and a 4 px gap between panel and lane. | [V] taiko-web |
| Left player panel | x 0-328, y 192-352 | width 25.6%, y 26.7%-48.9% | Flat colour with a faint repeating pattern at 50% alpha. 1P #fa4529 (orange-red), 2P #6bbec0 (teal). | [V] taiko-web |
| Score | Right-aligned at x 155, y 193. Digits 30 px, squeezed to 70% width. Sits on a black tab x 0-176, y 191-232 with a rounded lower-right corner. | tab 13.8% x 5.7% | White digits, no leading zeros. | [V] taiko-web; TJAPlayer3 score at (20, 226) with the "points just added" number above it at (20, 186) |
| Difficulty badge | 141 x 120 at (16, 232), label centred at (87, 348), 20 px | 11% x 16.7% | Round emblem per difficulty, label in white with black outline. | [V] taiko-web; TJAPlayer3 course symbol at (64, 232) |
| Drum graphic | 138 x 162 at (179, 190) | x 14.0%-24.8%, y 26.4%-48.9% | Front view of the drum, right side of the left panel. Four overlays light up for 130 ms: left rim, right rim, left face, right face. | [V] taiko-web; TJAPlayer3 drum at (190, 190) |
| Combo number | Centred on the drum at x 248, digits 51 x 65, top about y 205. Word "combo" at y 292, 24 px. | digit height 9% | Hidden below 10 combo. See 2.4. | [V] taiko-web; TJAPlayer3 combo (268, 270), label (268, 295) |
| Lane | x 332-1280, y 192-322 | x 25.9%-100%, height 18.1% | Flat dark grey #2c2a2c. | [V] both (TJAPlayer3 field origin 414, 192) |
| Judge circle | Centre (413, 257), 81 px in from the lane's left edge, vertically centred | x 32.3%, y 35.7% | Three concentric parts at 70% alpha, screen-blended: filled disc r 26 (#444544), ring r 33.5 stroke 3 (#9c9e9c) = small-note size, ring r 51.5 stroke 3.5 (#5d5e5d) = big-note size. | [V] taiko-web `slot()`; TJAPlayer3 judge point (413, 256) |
| Syllable strip | x 332-1280, y 326-352 | height 3.6% | Flat mid grey #847f84. Text centred under each note, 83 px below lane centre, 20 px, white with black outline. | [V] taiko-web; TJAPlayer3 offsets it 131 px below the lane top |
| Bar lines | Vertical, full lane height, 3 px wide | | Light grey #bdbdbd. Yellow #ffff00 where a chart branch starts. Scroll with the notes. | [V] taiko-web; wikiwiki confirms yellow branch lines |
| Bottom scene | x 0-1280, y 360-720 | bottom 50% | Stage backdrop. Dancers at x 640, 430, 856, 215, 1070 (centre first, then outward), y about 500. They appear one by one as the gauge passes 0, 20, 40, 60, 80%. | [V] TJAPlayer3 defaults |
| Lyrics (optional) | Centred at (640, 630), 38 px | y 87.5% | White text with coloured outline. | [V] TJAPlayer3 |

Two-player: the 2P block is mirrored vertically below the 1P block (2P lane y about 368-498, 2P gauge under its lane, 2P judge circle y 433), replacing the bottom scene. [V] both simulators.

### 2.2 Soul gauge in detail

- **50 segments**, split into two zones by the clear line. [V]
- **Before the clear line**: short segments, 22 px tall, bottom-aligned. Empty = dark red #680000. Filled = bright red #ff3408 with a 3 px lighter top highlight #ffa191. (2P: #184d55 empty, #00edff filled.) [V]
- **From the clear line on**: segments are **twice as tall** (44 px). Empty = dark olive #684900. Filled = yellow #ffff00 with a white highlight. The first segment of this zone has a rounded top-left corner. [V]
- **Clear line position** depends on difficulty: segment 30 of 50 on Easy, 35 on Normal and Hard, 40 on Oni. On the grid that is about x 898 (70%), 968 (76%), 1038 (81%). [V] taiko-web `gamerules.js`, wikiwiki
- Label "クリア" (older games "ノルマ") sits just above the clear line, 18 px. Grey #737373 before clear, white after. [V]
- Segment dividers: 5 px translucent black lines every 14 px. [V]
- A black tab with a rounded top-left corner sits behind the tall zone, from the clear line to the right edge, y 135-159. [V]
- Full gauge: the soul icon lights up (arcade Taiko 9 onward, per wikiwiki). TJAPlayer3 also plays a rainbow arc effect from the lane to the gauge. Rainbow-coloured fill when full is [U].
- The official how-to describes success as finishing with the gauge "filled over the Clear line (yellow or above)". [V]

### 2.3 Notes

| Note | Diameter | Relative to lane height (130) | Fill | Other |
|---|---|---|---|---|
| Small don | 70 px | 54% | #f34728 (orange-red) | |
| Small ka | 70 px | 54% | #65bdbb (light blue-teal) | |
| Big don / big ka | 106 px | 82% | same colours | Big : small = 1.51 : 1 |
| Drumroll head | 70 px small, 106 px big | | #f3b500 (yellow) | Body is a bar of the same height with a 3 px black outline and a rounded cap at the far end |
| Balloon head | 70 px | | #f87700 (orange) | Balloon graphic attached on the right, about 119 x 63 px |

[V] all of the above from taiko-web `drawCircle()`.

- Every note has a face (two eyes and a mouth) over the coloured disc, with a white ring and black outer outline supplied by the note sprite. Ring and outline widths were not measurable from code: [U], check screenshots 3-7.
- The slot rings match note sizes exactly, so a note "fits" the ring at the hit moment. [V]
- **Face animation**: at higher combos the mouths open and close to the beat. Arcade up to AC15: 8th-note rhythm from 50 combo, 16th-note rhythm from 150, angry eyes from 300. Nijiiro: thresholds depend on difficulty (Normal and below 5 / 10 / 30; Hard 10 / 30 / 50; Oni 10 / 50 / 100). [V] wikiwiki
- Drumroll heads turn red while being hit fast and fade back (arcade). [V] TJA spec
- **Draw order**: earlier notes are drawn on top of later ones, so in a dense stream the note about to be hit is fully visible. taiko-web iterates the list backwards to achieve this. [V]
- 16th notes overlap: at normal speed one beat is 250 px, so 16ths are 62.5 px apart, less than the 70 px small-note diameter. [V] derived from taiko-web

### 2.4 Combo display and milestones

- Shown on the drum graphic from 10 combo upward. [V] taiko-web
- Each hit makes the digits stretch upward by up to 1/8 of their height for 100 ms, then settle. [V] taiko-web
- Colour: white below 100, then a red-orange-gold gradient (#ff2000, #ffc321, #ffedb7) from 100. Four-digit combos use tighter letter spacing. [V] taiko-web
- Official behaviour by version [V] wikiwiki: old cabinets turned the digits red from 50 (Easy, Normal) or 100 (Hard, Oni) with cherry blossoms; AC15 unified this to 100; Nijiiro goes white, then silver, then gold with difficulty-dependent thresholds. Four-digit display gets narrower or smaller depending on the game.
- **Voice callouts** at 50 combo and every 100. [V] wikiwiki, taiko-web
- **Callout bubble**: old cabinets showed a speech bubble every 10 combo, AC15 every 100. Nijiiro shows a scroll banner at 10, 30, 50 and every 100 on Hard and below, and at 50 and every 100 on Oni. [V] wikiwiki
- Bubble position in TJAPlayer3: frame at (253, -11), number at (312, 34), text at (471, 55), so it sits in the top strip just right of the mascot (x about 20-45%, y 0-15%). [V]
- Full combo callout at the end of the song: [U].

### 2.5 Judgement text

- Characters: 良 (good), 可 (ok), 不可 (bad). [V]
- Position: centred on the judge circle's x, 98 px above its centre (y about 159, 22% of screen height), so it floats over the lane's top edge. [V] taiko-web
- Size: about 35-40 px tall. [V] taiko-web (scale 1.35 on a 29 px glyph)
- Colours, all with a 7 px black outline [V] taiko-web:
  - 良: vertical gradient yellow #f7fb00 (top) to orange-red #ff4900 (bottom)
  - 可: plain white
  - 不可: vertical gradient violet #6b5dff to cyan-blue #00aede
- Animation: rises 13 px during the first 70 ms, holds, fades out over the last 50 ms, total 300 ms. [V] taiko-web
- Letting a note pass without hitting shows no text in the official game but counts as 不可 on the results. [V] wikiwiki
- Wikiwiki describes the hit effect as orange for 良 and white for 可. [V]

### 2.6 Hit effects

| Effect | Behaviour | Source |
|---|---|---|
| Hit flash on the slot | 128 x 128 glow centred on the judge circle, four variants (good / ok x small / big), visible 300 ms, fading from 120 ms | [V] taiko-web |
| Explosion | 222 x 222 sprite centred on the judge circle, screen blend. Small notes 7 frames, big notes 14 frames with a shrink-in start and a fade-out tail. TJAPlayer3 uses 180 x 180, 12 frames. | [V] both |
| Lane flash on input | The whole lane gets a left-to-right gradient that is opaque at the left and transparent at the right: red (255,0,0) for face hits, blue (0,170,255) for rim hits, at 20% alpha fading over 130 ms. If a note was actually hit a yellow (255,231,0) layer is added. Additive blend. | [V] taiko-web |
| Notes flying to the gauge | A hit note leaves the slot and travels along a cubic Bezier from (427, 228) through control points (560, 10) and (940, -150) to the soul icon at (1225, 165). That is a tall arc that leaves the top of the screen and comes back down. 490 ms with ease-out, then a 320 ms white flash at the icon. | [V] taiko-web; TJAPlayer3 uses start (414, 260), end (1222, 164) with a sine arc |
| Drumroll hits | Each drumroll hit spawns a note of the colour that was pressed (don or ka, big for big rolls) which flies to the gauge the same way. | [V] taiko-web |
| Miss | taiko-web dims the top strip until the next successful hit. Whether the official game does this is [U]. | [V] taiko-web only |

### 2.7 Drumroll counter and balloon

- **Drumroll counter**: a speech bubble from the mascot showing the running hit count. TJAPlayer3 places the bubble frame at (218, -3) and the number at (392, 128), so it covers roughly x 17-40%, y 0-25% of the screen. Digits about 62 x 80. [V] TJAPlayer3. It stays briefly after the roll ends, then fades: [U].
- **Balloon**: while a balloon is active its head is pinned on the judge circle instead of scrolling. [V] taiko-web. A balloon character appears above the judge circle (TJAPlayer3 frame at (382, 80), balloon at (382, 115)) with the **remaining** hit count at about (486, 187). The balloon inflates in steps and pops at zero. [V] positions; inflation steps [U]
- The end of a yellow drumroll is marked in the syllable strip with a long dash joining "連打" to the end mark. [V] taiko-web, TJA spec

### 2.8 Syllable strip text

| Note | Text |
|---|---|
| Don | ドン (long form), ド (short form in runs), コ (alternate form on every second note of short even runs) |
| Ka | カッ (long form), カ (short form) |
| Big don / big ka | ドン(大) / カッ(大) |
| Drumroll | 連打 followed by a dash to the end, big roll 連打(大) |
| Balloon | ふうせん |
| Kusudama | くすだま |

[V] TJA spec. Rule of thumb from the same spec: a note gets the long form when it is the last note of a run or is followed by a gap wider than an 8th; notes inside a dense run get the short form so the text does not overlap.

With the "doron" (invisible) option notes are hidden and only this strip and the bar lines remain. [V] wikiwiki

### 2.9 Go-go time

| Change | Detail | Source |
|---|---|---|
| Lane tint | A warm overlay on the lane: red at 16% alpha at the left, 28% at 45% across, pink (255,83,157) at 40% at 77% across, fading to transparent at the right edge. Fades in and out over 100 ms. | [V] taiko-web |
| Flame on the judge circle | Animated flame centred on the judge circle, 7 frames, additive blend, roughly 360 x 370 px (about 2.8 lane heights). Starts at 3x size and shrinks to 1x over 200 ms while fading in. | [V] taiko-web |
| Fireworks | Played once when go-go starts. taiko-web: five 230 x 460 sprites along the bottom edge. TJAPlayer3: six 300 x 400 splashes at x 120, 300, 520, 760, 980, 1160, bottom-anchored. | [V] both |
| Mascot | Switches to a start animation, then a looping go-go dance. | [V] taiko-web |
| Official description | Flames from the judge frame, lane background turns pink/orange, fireworks from the bottom of the screen (arcade Taiko 9 onward), mascot waves both hands. Usually placed on the chorus. | [V] wikiwiki, Taiko Time |
| Scoring | x1.2 before Nijiiro, visual only in Nijiiro. See 3.3. | [V] |

### 2.10 Branch indicator (only on charts with branches)

- Lane tint per branch: normal none, advanced (玄人) blue rgba(29,129,189,0.4), master (達人) magenta rgba(230,29,189,0.4). [V] taiko-web
- Branch name text at the right end of the lane, 43 px, slides vertically when the branch changes (about 310 ms). [V] taiko-web
- A "level up / level down" message appears above the difficulty badge in AC15 and later. [V] wikiwiki

### 2.11 Pause menu

Dim the screen with 50% black, then a rounded panel 742 x 494 at (269, 93) with a thick white-then-black border. Options are vertical text columns 80 x 464 spaced 110 px apart; the selected one has an orange #ffb447 pill behind it and white outlined text. [V] taiko-web

### 2.12 Song select

Two conventions exist.

**A. Row of vertical bars (AC15 era, reproduced by taiko-web)** [V] taiko-web unless noted

- Header text "曲をえらぶ" top-left at about (53, 30), 48 px, white with red outline.
- Genre name centred at the top with left/right arrows about 170 px either side of centre, y about 60.
- Song bars: **82 x 452**, 18 px gap, top edge y 104 (14.4%), so they span y 14%-77%. Title is written **vertically**, top to bottom.
- The selected bar is centred and **expands to 382 px wide** (30% of width) to show: title, optional subtitle, and one small column per difficulty with its star count and crown. Small difficulty columns are 60 px apart.
- Bar styling: 6 px outer border and 8 px inner border with a light and a dark edge colour, text outline in the genre's dark colour.
- Selected frame colours: fill #ffdb2c, border #fff4b5 / #ffa600.
- Utility bars in taiko-web: back #efb058, random #fa91ff, default grey #ececec.
- Player nameplates bottom-left and bottom-right (TJAPlayer3: (60, 650) and (950, 650)). [V] TJAPlayer3
- Genre text-outline colours in TJAPlayer3's default skin, a hint at the genre palette: J-POP #01455B, Anime #9D3800, Vocaloid #5B6278, Children #99001F, Variety #366600, Classical #875600, Game music #412080, Namco original #980E00. [V]
- Official genre theme colours per wikiwiki: Pops light blue, Kids yellow/orange, Anime orange (pink in Nijiiro), Vocaloid silver, Game music purple, Variety yellow-green, Classical gold. [V] Namco original red-orange is [U].
- Input: rim left/right moves, face confirms. Hitting one rim twice quickly skips 7 songs in Nijiiro. [V] 4Gamer
- A preview of the song plays while it is highlighted. [V] kocpc article
- Countdown timer top-right in arcade versions. [U]

**B. Vertical list (Drum 'n' Fun, Nijiiro, Rhythm Festival)**

- Fandom states that Nijiiro changed song select to a vertically arranged layout like Drum 'n' Fun. [V]
- Details [U]: horizontal bars stacked vertically, selected bar in the middle and enlarged, showing title, subtitle, per-difficulty stars, crowns and best score rank; genre colour on each bar; player info at the sides.

### 2.13 Difficulty select

[V] taiko-web unless noted.

- The selected song bar grows into a panel **912 x 502** (71% x 70% of the screen), centred, keeping the bar's genre styling.
- Left part of the panel: utility buttons as tall pills 64 x 304 with vertical text: back (#efb058), song options (#b2e442), and others.
- Right part: **four difficulty columns 100 px apart**. Each column has:
  - a crown slot above (best result on that difficulty),
  - a round difficulty emblem, scale 1.4,
  - a vertical plaque 71 x 380 with a brown frame #aa7023 and a white inner area 56 x 351,
  - the difficulty name written vertically, 40-45 px, black,
  - stars stacked vertically beneath the name, up to 10.
- A bouncing cursor arrow sits about 45 px above the selected column. 2P gets its own cursor.
- Extra (ura) Oni replaces the Oni column with a dark teal plaque #006279 and white text. In the arcade it is reached by hitting the right rim 10 times on Oni. [V] Fandom
- Charts with branches show a "branch" marker alternating with the stars. [V] taiko-web
- Emblem motifs and colours [U]: Easy = flower, red-orange; Normal = bamboo, green; Hard = pine tree, blue; Oni = demon face, magenta; Extra = darker purple demon.

### 2.14 Results screen

[V] taiko-web `scoresheet.js` unless noted.

| Element | Position (1280x720) | Look |
|---|---|---|
| Header band | y 0-64 plus an 8 px darker line | #fa4529 band, #bf2900 line |
| "Results" heading | (23, 15), 48 px | White with red outline, top-left |
| Song title | Right-aligned at x 1257, y 20, 40 px | White with black outline |
| Upper half | y 72-360 | Player result area. A dark-to-light gradient washes in at about 3.1 s, brighter (#ffffba tint) if cleared. |
| Lower half | y 360-720 | Patterned background with two characters who dance if the song was cleared and slump if not. Two-player mode puts 2P's result block here instead. |
| Nameplate | (259, 92), 273 x 66 | |
| Difficulty badge | (300, 150), 189 x 162, label at (395, 308) 28 px | |
| Crown | Centred at (395, 218), over the badge | Drops in from 3.7x scale to 0.9x, bounces to 1x, then a shine sweep |
| Result box | (532, 98), 728 x 232, radius 30 | Translucent pale pink rgba(255,224,216,0.8) for 1P, pale teal for 2P |
| Gauge | Inside the box, top, scaled to 712 px wide, y about 116 | Same drawing as in play, frozen at the final value |
| Soul icon | (1215, 144) | |
| Score | Box (556, 237), 254 x 70: black outer, gold #eec954 frame, black inner | White digits with the 点 suffix at the right |
| 良 / 可 / 不可 rows | Labels at x 823, y 192 / 233 / 273, counts to the right | Same colours as in play |
| Max combo, drumroll count | Labels right-aligned at x 1149, y 193 and 233 | Max combo label in an orange-to-yellow gradient, drumroll label in #ffc700 |

Reveal timeline: panel fades in 0-400 ms; gauge at 800 ms; crown at 1200 ms with a sound at 1650 ms; numbers count up from 2400 ms; background brightens and characters react at 3100 ms. If there is no crown the later steps start 2 s earlier. [V]

Nijiiro additions: score-rank badge (seven tiers, see 3.6) and the rainbow Donderful Combo crown. 1P and 2P results are shown left and right. [V] 4Gamer, official how-to. Exact placement of the rank badge is [U].

---

## Part 3 - Rules and numbers

### 3.1 Timing windows

All values are plus or minus, in milliseconds, measured from the note's exact time.

| Difficulty | 良 good | 可 ok | 不可 bad (hit but too far off) |
|---|---|---|---|
| Easy (かんたん) | 41.7 | 108.3 | 125.0 |
| Normal (ふつう) | 41.7 | 108.3 | 125.0 |
| Hard (むずかしい) | 25.0 | 75.0 | 108.3 |
| Oni (おに) | 25.0 | 75.0 | 108.3 |

[V] Three sources agree: the TJA spec, taiko-web `gamerules.js` (written as 2.5 / 6.5 / 7.5 frames and 1.5 / 4.5 / 6.5 frames at 60 fps), and wikiwiki (which lists 41.708 / 108.442 / 125.125 and 25.025 / 75.075 / 108.442, the same frame counts at 59.94 fps).

- A hit inside the bad window consumes the note and breaks combo. A hit outside it is ignored. A note that passes the bad window unhit becomes a miss. [V] TJA spec
- Beginner support mode (arcade, 3DS, Wii U, Switch) on Easy: 41.7 / 125.1 / 125.1. [V] wikiwiki
- Console assist settings, wider: PS4 support level 1 and Switch "easy timing" use 75.1 / 91.8 / 108.4 on Hard and Oni, and 91.8 / 108.4 / 125.1 on Easy and Normal. Switch "hard timing" narrows ok to 58.4 (Hard, Oni) and 75.1 (Easy, Normal). [V] wikiwiki
- Big notes in taiko-web: the second hand may land up to 2 frames (33 ms) after the first and still count as a two-handed hit. [V]

### 3.2 Soul gauge

**Structure** [V] wikiwiki, taiko-web
- Internally 0 to 10,000 points, clamped at both ends. The display has 50 segments, one per 200 points.
- The song starts with an empty gauge.
- Only don and ka notes move the gauge. Drumrolls and balloons never do.

**Clear thresholds**

| Difficulty | Segments needed | Gauge % |
|---|---|---|
| Easy | 30 of 50 | 60% |
| Normal | 35 of 50 | 70% |
| Hard | 35 of 50 | 70% |
| Oni / Extra | 40 of 50 | 80% |

[V] wikiwiki (new arcade), taiko-web. Older cabinets also varied the fill rate by star count within a difficulty.

**Per-note gauge change** as implemented in taiko-web, where N is the chart's total note count [V]:

| Difficulty | 良 | 可 | 不可 |
|---|---|---|---|
| Easy | floor(10000 / N x 1.575) | 0.75 x good | -0.5 x good |
| Normal | floor(10000 / N / 0.7) | 0.75 x good | -1.33 x good |
| Hard | floor(10000 / N x 1.5) | 0.75 x good | -1.25 x good |
| Oni | floor(10000 / N / 0.7) | 0.5 x good | -1.6 x good |

**Measured official behaviour** from wikiwiki [V]: fraction of the chart that must be hit 良 (with no misses) to reach each line.

| Difficulty and stars | To clear | To fill | 可 relative to 良 | 不可 relative to 良 |
|---|---|---|---|---|
| Easy 1 | 36% | 60% | 0.75 | -0.5 |
| Easy 2-3 | 38% | 63% | 0.75 | -0.5 |
| Easy 4-5 | 44% | 73% | 0.75 | -0.5 |
| Normal 1-2 | 46% | 66% | 0.75 | -0.5 |
| Normal 3 | 49% | 70% | 0.75 | -0.5 |
| Normal 4 | 49% | 70% | 0.75 | -0.75 |
| Normal 5-7 | 52.5% | 75% | 0.75 | -1 |
| Hard 1-2 | 54% | 77% | 0.75 | -0.75 |
| Hard 3 | 51% | 72.5% | 0.75 | -1 |
| Hard 4 | 48% | 69% | 0.75 | about -1.17 |
| Hard 5-8 | 47-48% | 67.5-69% | 0.75 | -1.25 |
| Oni 1-7 | 56.6% | 70.7% | 0.5 | -1.6 |
| Oni 8 | 56% | 70% | 0.5 | -2 |
| Oni 9-10 | 59-63% | 74-79% | 0.5 | -2 |

The wiki notes the real values are integers tuned per chart and sometimes differ by a point. A 2026 comment on the same page reports that Nijiiro's Easy gauge has since been loosened (clear at roughly 30-36% of notes), so treat the Easy rows as the older tuning.

Consequence worth copying: a full combo made only of 可 can still fail. On Oni, all-可 yields 50% of the fill rate, which tops out at about 71% gauge, short of the 80% line. [V] Taiko Time, arithmetic from the table

Practical rule of thumb on Oni: about 90-92% accuracy is needed to clear. [V] wikiwiki

### 3.3 Scoring systems

All values are for one player with a 良 hit. 可 scores half, truncated to a multiple of 10. 不可 scores 0. Totals always end in 0. [V] wikiwiki

**A. Fixed scoring (arcade Nijiiro 2020-, Xbox/PC The Drum Master)** [V] wikiwiki, Fandom

| Item | Points |
|---|---|
| Don / ka, 良 | `init` (one fixed value per chart) |
| Don / ka, 可 | init / 2, truncated to 10 |
| Big note, either hand count | same as a small note, no bonus |
| Drumroll hit, small or big | 100 |
| Balloon / kusudama hit | 100, no pop bonus |
| Go-go time | no bonus |
| Combo | no effect |
| 100-combo bonus | none |

- Chart maximum is tuned to about **1,000,000** regardless of difficulty or stars.
- Ceiling = note count x init + balloon hits x 100.
- Community reverse-engineering of init: (1,000,000 - drumroll seconds x about 17 x 100 - balloon hits x 100) / note count, rounded to 10. [V] as a wiki comment, approximate
- A chart with 500 notes and no rolls therefore has init = 2000; one with 1000 notes has init = 1000.

**B. Shin-uchi option (AC15 from 2013, most console games)** [V] wikiwiki
- Same idea as A: fixed per-note value, no combo growth, no go-go bonus, no 100-combo bonus, ceiling about 1,000,000.
- Differences from A: big notes hit two-handed still score double; balloons still pay 300 per hit and 5000 on the pop.
- Ceiling = (notes + big notes) x init + (balloon hits - balloons) x 300 + balloons x 5000.

**C. Combo-based scoring, AC15 (2011-2020) and most console games since 3DS** [V] wikiwiki, TJA spec (SCOREMODE 2), taiko-web

Per-note score = floor((init + diff x m) / 10) x 10, where m depends on the current combo:

| Combo | 1-9 | 10-29 | 30-49 | 50-99 | 100+ |
|---|---|---|---|---|---|
| m | 0 | 1 | 2 | 4 | 8 |

- +10,000 every 100 combo.
- Go-go time x1.2, truncated to 10.
- Big note hit two-handed: x2.
- Drumroll 100 per hit, big drumroll 200.
- Balloon 300 per hit, 5000 for the popping hit. Kusudama pays 5000 if popped early, 1000 if late.
- init is usually 3 to 5 times diff. Worked example from the wiki: init 420, diff 98 gives 420, 510, 610, 810, 1200.
- Rhythm Festival and Drum 'n' Fun use this system and offer shin-uchi as an option.

**D. Combo-based scoring, old cabinets Taiko 2-14 and consoles up to Wii 4** [V] wikiwiki, TJA spec (SCOREMODE 1)
- Per-note score = floor((init + diff x min(floor(combo / 10), 10)) / 10) x 10. Grows every 10 combo, stops at 100.
- Go-go time x1.2 (from Taiko 7). Big note two-handed x2.
- Drumroll 300 per hit; big drumroll 360 (Taiko 7-14).
- Balloon 300 per hit plus 5000 on the pop.

**E. Earliest Oni scoring (Taiko 2-7)**: flat 1000 per note below 200 combo, 2000 from 200. [V] wikiwiki

Reference table for a chart where 良 = 330 [V] wikiwiki:

| Hit | Old (D) normal / go-go | AC15 (C) normal / go-go | Nijiiro (A) |
|---|---|---|---|
| 良 | 330 / 390 | 330 / 390 | 330 |
| 可 | 160 / 190 | 160 / 190 | 160 |
| Big 良, two-handed | 660 / 790 | 660 / 780 | 330 |
| Drumroll hit | 300 / 360 | 100 / 120 | 100 |
| Big drumroll hit | 360 / 430 | 200 / 240 | 100 |
| Balloon hit | 300 / 360 | 300 / 360 | 100 |
| Balloon pop | 5000 / 6000 | 5000 / 6000 | none |

### 3.4 Note types

| Note | How it is played | Combo and gauge | Source |
|---|---|---|---|
| Don (red) | Hit the drum face, either side | Counts | [V] |
| Ka (blue) | Hit the rim, either side | Counts | [V] |
| Big don / big ka | Arcade: hit hard enough, one hand is fine. Console and simulators: both sides at once. A single hit still counts as a normal hit. | Counts | [V] wikiwiki, TJA spec |
| Drumroll (yellow bar) | Hit face or rim as many times as you like while the bar crosses the judge circle. No timing window at head or tail. | Never affects combo or gauge. Cannot be failed. | [V] |
| Big drumroll | Same as drumroll | Same | [V] |
| Balloon | Hit the **face only** the required number of times before the note ends. Rim hits are swallowed. | Never affects combo or gauge. Failing to pop has no penalty. | [V] TJA spec |
| Kusudama / party popper | Shared balloon: all players' hits add up. Falls back to a normal balloon in single-chart mismatches and in fixed-scoring modes. | Same as balloon | [V] |
| Hand-holding note | Two-player only. Both players must hit together for the bonus. Becomes a plain big note otherwise. | Counts | [V] |

Other documented behaviour:
- The official games accept at most **one drumroll hit per 60 fps frame**, so 60 per second is the hard cap. [V] TJA spec
- Autoplay hits drumrolls at about 15 per second and balloons at about 30 per second. [V] wikiwiki
- While a balloon is unpopped, notes placed inside its duration cannot be hit. [V] TJA spec
- Wrong-colour input on a don or ka note is not consumed by that note. [V] TJA spec
- A drumroll ends a little before the next note. One simulator uses 50 ms. [V] TJA spec
- Non-standard notes that exist only in simulators: bomb/mine, ad-lib (invisible bonus), swap note (face + rim), fuse roll. [V]

### 3.5 Scroll speed and BPM

- At scroll 1.0 a note crosses **the whole note field in 4 beats**, whatever the BPM. The on-screen distance between beats is therefore constant and the pixel speed is proportional to BPM. [V] TJA spec
- taiko-web's exact formula on the 1280-wide grid: **pixels per millisecond = BPM x scroll / 240**. [V]
  - One beat = 250 px (19.5% of screen width).
  - A 4/4 measure = 1000 px. The visible lane from the judge circle to the right edge is 867 px.
  - BPM 120: 500 px/s, a note is visible for about 1.7 s. BPM 200: 833 px/s, about 1.0 s.
- Chart commands change speed mid-song: `#SCROLL x` multiplies the speed for the following notes; `#BPMCHANGE` changes both timing and speed. Each note keeps the speed it was given, so slow and fast notes can overtake each other. [V] TJA spec
- Player speed options: older games had x2, x3, x4. Nijiiro has a "speed" option from 1.0 to 2.0 in 0.1 steps and 2.0 to 4.0 in 0.5 steps. [V] wikiwiki
- Nijiiro also lets the player shift the visual note position relative to the judgement point. [V] 4Gamer

### 3.6 Results, crowns, ranks

**Shown on the results screen** [V] taiko-web, official how-to: score, counts of 良 / 可 / 不可, max combo, total drumroll hits, final gauge, crown, difficulty, song title, player name. Nijiiro adds the score rank.

**Crowns** [V] official how-to, 4Gamer

| Crown | Condition |
|---|---|
| None | Gauge below the clear line |
| Silver (clear) | Gauge at or above the clear line |
| Gold (full combo) | Cleared with zero 不可 |
| Rainbow (donderful combo) | Every note 良 |

**Score ranks (Nijiiro)**, seven tiers [V] official how-to for the tier names; thresholds from Japanese Q&A and encyclopedia mirrors

| Rank | Colour | Score |
|---|---|---|
| 粋 iki | white | 500,000 |
| 粋 iki | bronze | 600,000 |
| 粋 iki | silver | 700,000 |
| 雅 miyabi | gold | 800,000 |
| 雅 miyabi | pink | 900,000 |
| 雅 miyabi | purple | 950,000 |
| 極 kiwami | rainbow | about 1,000,000 (the chart's ceiling; on charts with drumrolls it also assumes a fast roll speed) |

**Failing**: before Nijiiro, failing a song in the arcade could end the credit. Nijiiro always lets the player finish the set number of songs. [V] Fandom, 4Gamer

### 3.7 Difficulty, stars, density

**Star ranges** [V] TJA spec

| Difficulty | Stars |
|---|---|
| Easy | 1-5 |
| Normal | 1-7 |
| Hard | 1-8 |
| Oni / Extra | 1-10 |

Stars are only comparable within one difficulty. [V] Taiko Time

**Note counts per chart**, computed for this dossier from wikiwiki's per-star song tables (all listed charts, including retired ones). Median, with the 10th-90th percentile range in brackets.

| Difficulty | Stars | Charts | Notes per chart | Median top BPM |
|---|---|---|---|---|
| Easy | 1 | 150 | 56 (33-86) | 131 |
| Easy | 3 | 1020 | 112 (77-160) | 152 |
| Easy | 5 | 298 | 205 (146-289) | 200 |
| Normal | 3 | 406 | 132 (94-191) | 136 |
| Normal | 5 | 590 | 209 (147-285) | 160 |
| Normal | 7 | 216 | 332 (240-463) | 219 |
| Hard | 3 | 182 | 208 (137-276) | 149 |
| Hard | 5 | 628 | 280 (200-387) | 150 |
| Hard | 8 | 239 | 542 (403-694) | 204 |

**Oni density**, computed from wikiwiki's average-density tables. Density = (notes - 1) / seconds from first to last note.

| Oni stars | Charts | Notes per second, median (10th-90th) | Notes per chart, median (10th-90th) | Median BPM |
|---|---|---|---|---|
| 6 | 458 | 3.8 (2.9-4.7) | 355 (255-481) | 149 |
| 7 | 752 | 4.3 (3.3-5.2) | 425 (299-569) | 146 |
| 8 | 849 | 5.1 (4.0-6.0) | 544 (371-727) | 154 |
| 9 | 530 | 6.0 (4.7-7.2) | 713 (509-887) | 168 |
| 10 | 447 | 7.3 (5.8-8.8) | 902 (679-1166) | 200 |

- Highest listed average density: 11.8 notes per second.
- Typical chart length is about 2 minutes (median 123 s for Oni 10).
- Rough density for the lower difficulties, assuming a 100-120 s chart: Easy 1 about 0.5 notes/s, Easy 3 about 1, Easy 5 about 1.8, Normal 5 about 1.9, Normal 7 about 3, Hard 5 about 2.5, Hard 8 about 4.8. **Estimate**, because durations were not available for these tables.
- Longest combos in the game exceed 1500. Combos over 999 have existed since Taiko 14. [V] wikiwiki

### 3.8 Chart branching (optional feature)

- Some charts switch between normal, advanced and master versions of a section, decided just before the section from performance so far (accuracy, score, or drumroll hits). [V] wikiwiki
- Accuracy for branching in taiko-web: 良 = 1, 可 = 0.5, 不可 = 0, averaged over the section. [V]
- Gauge fill rate and score ceiling are tuned to the master path. [V] wikiwiki

### 3.9 TJA chart format

Plain text. Historically Shift-JIS, UTF-8 now common. `//` starts a comment. [V] TJA spec

**Header lines** (`NAME:value`)

| Header | Meaning |
|---|---|
| `TITLE`, `SUBTITLE` | Song title and subtitle. A leading `--` on the subtitle hides it outside song select. |
| `BPM` | Starting BPM |
| `WAVE` | Audio file |
| `OFFSET` | Seconds. Defined as (time the audio begins) minus (time the chart begins). A negative value means the audio starts first, so the chart's first measure falls at -OFFSET seconds into the audio. |
| `DEMOSTART` | Preview start time in seconds |
| `COURSE` | `Easy`/0, `Normal`/1, `Hard`/2, `Oni`/3, `Edit`/4 (used as Extra Oni), `Tower`/5, `Dan`/6 |
| `LEVEL` | Star count |
| `BALLOON` | Comma-separated hit counts, one per balloon in chart order. Default when missing is 5 in one simulator. |
| `SCOREMODE` | 0, 1, 2 or 3: see 3.3 (E, D, C and shin-uchi) |
| `SCOREINIT`, `SCOREDIFF` | init and diff for the scoring formula. The spec recommends leaving them out so the player computes them. |
| `TOTAL` | Total gauge gain for an all-良 run, from which the per-note gain is derived |
| `STYLE` | `Single` or `Double` |
| `GENRE`, `MAKER`, `SONGVOL`, `SEVOL`, `BGIMAGE`, `BGMOVIE`, `LYRICS` | Metadata and media |

**Note codes**

| Code | Meaning |
|---|---|
| 0 | Blank |
| 1 | Don |
| 2 | Ka |
| 3 | Big don |
| 4 | Big ka |
| 5 | Drumroll start |
| 6 | Big drumroll start |
| 7 | Balloon start |
| 8 | End of drumroll or balloon |
| 9 | Kusudama start |
| A, B | Hand-holding big don / big ka |
| C, D, F, G | Simulator extensions: bomb, fuse roll, ad-lib, swap note |

[V] TJA spec and OpenTaiko charting docs agree.

**Measure syntax**
- Each measure is a run of digits ending with a comma. The measure's duration is divided **evenly** by the number of digits: `1020,` is two notes on beats 1 and 3 of a 4/4 measure, `1111,` is four quarter notes, `10201020,` is eighth-note resolution, and 16 digits give sixteenth-note resolution.
- An empty measure is a lone `,`.
- To mix 16ths and triplets in one measure, write it with 48 digits (least common multiple).
- A drumroll runs from its start code to the next `8`; the cells between may be `0`. `5008`, `5558` and `5058` are equivalent.

**Commands** (on their own line, inside `#START` ... `#END`)

| Command | Effect |
|---|---|
| `#START`, `#END` | Begin and end the chart for the current `COURSE`. `#START P1` / `#START P2` for two-player charts. |
| `#MEASURE a/b` | Time signature. Measure length in beats = 4 x a / b. Default 4/4. |
| `#BPMCHANGE x` | New BPM from this point |
| `#SCROLL x` | Scroll speed multiplier for the following notes. Default 1. Some players accept complex values for vertical movement. |
| `#GOGOSTART`, `#GOGOEND` | Go-go time on and off |
| `#DELAY x` | Pushes everything after it later by x seconds |
| `#BARLINEOFF`, `#BARLINEON` | Hide and show bar lines |
| `#BRANCHSTART type,a,b` then `#N`, `#E`, `#M`, `#BRANCHEND` | Branch section with normal, expert and master paths. `type` is `p` (accuracy), `r` (drumroll hits) or `s` (score). |
| `#SECTION` | Resets the counters used for the next branch decision |
| `#LEVELHOLD` | Locks the current branch |
| `#LYRIC text` | Inline lyric line |

Minimal example:

```
TITLE:Example
BPM:120
WAVE:example.ogg
OFFSET:-1.5
COURSE:Oni
LEVEL:7
BALLOON:12
#START
1010201010102010,
#GOGOSTART
1110201011102000,
7000000000000008,
#GOGOEND
500000008000,
#END
```

### 3.10 Charting conventions by difficulty

Two kinds of source are used here. The osu!taiko ranking criteria is a published, enforced rule set for the same four difficulty names, written for about 180 BPM in 4/4 and explicitly scaled for other tempos. Statements about official charts that could not be tied to a document are marked [U].

Conversion used below: the criteria's "1/1" is a quarter note (one beat), "1/2" an eighth note, "1/4" a sixteenth, "1/6" a 24th (sextuplet), "1/8" a 32nd.

| Rule | Easy | Normal | Hard | Oni |
|---|---|---|---|---|
| Smallest gap allowed | Eighth note | Twelfth (triplet eighth); eighth if it is the easiest chart offered | 24th | 32nd |
| Main rhythm | Half notes and whole notes, quarter notes occasionally | Quarter and half notes, eighths occasionally | Eighth and quarter notes, sixteenths occasionally | Mostly eighths with frequent sixteenths |
| Longest run | 7 quarter notes in a row | 7 eighth notes (5 if easiest chart offered); triplet groups of 2 | 5 sixteenths (hard limit); 24th groups of 4 only at low BPM | 9 sixteenths; 32nd groups of 2 |
| Colour changes inside fast runs | None inside eighth-note groups | None inside triplet groups | Sixteenth groups longer than 3 get at most one change, at the start or the end. Groups with changes used sparingly. | Sixteenth groups longer than 5 avoid complicated changes |
| Big notes | Not inside eighth-note groups | Not inside triplet groups | Never inside sixteenth groups | Only as the last note of a sixteenth group, and in the opposite colour to the note before it |
| Rest required | 3 beats or more, at least every 32-36 beats | 2 beats or more, every 32-36 beats | 1.5 beats or more (or three quarter notes in a row), every 32-36 beats | 1 beat or more, every 16-20 beats |
| Scroll speed changes | Use cautiously | Use cautiously | Allowed for real changes in pacing | Allowed |
| Gap before a balloon-type note | Half a beat | Half a beat | Half a beat | Quarter of a beat |

[V] osu!taiko ranking criteria.

General rules from the same document [V]:
- Every note must follow something audible in the music, or a clearly intentional added layer. Do not add notes that fight the song's intensity.
- Make rhythm predictable: keep gaps consistent when moving between subdivisions, and use rests.
- Avoid heavy overlap that hides note colours.
- Go-go (kiai) belongs on the chorus or an emphasised section. No rapid on/off flashing.
- Keep the base scroll speed the same across all difficulties of one song.
- No large difficulty jumps between neighbouring difficulties.

From the official chart designer interview (Yamaha, 2024) [V]:
- Difficulty is lowered by reducing **density** and **variation**, and raised by increasing them.
- Cutting density too far loses the groove that comes from repetition. Balancing the two is the main craft.
- For very young players, keep gaps between notes wide.
- The chart is treated as an extra drum track added to the song, built from only three things: don, ka and rolls.

From wikiwiki [V]:
- In pop and anime songs go-go time is almost always the chorus. In game music and classical it marks the signature or hardest part. Since Nijiiro removed the score bonus it is used more freely as decoration.
- Five-note patterns such as don don ka ka don are described as commonly used.
- Charts over about 24th-note density at low BPM are read more easily with a raised speed option.

Patterns seen in official charts, for a generator's defaults [U], confirm by watching the linked videos:
- Easy: almost all don. Ka appears alone on off-beats or phrase ends. Big notes mark the end of a phrase or a cymbal hit. One drumroll or balloon every 8-16 measures as a reward.
- Normal: eighth-note pairs and short runs in one colour; ka used to answer don (call and response) rather than mixed within a run.
- Hard: three-note sixteenth bursts (don don don, ka ka ka, don don ka), five-note bursts in one colour, eighth-note lines that alternate colour by phrase.
- Oni: mixed-colour sixteenth streams, 3-5-7 note groupings that end on the beat, triplet and sixteenth switches, scroll changes on the hardest charts.
- Don maps to low sounds (kick, bass), ka to high sounds (snare, hi-hat, clap). The osu! criteria says the same about hit sounds. [V] for that last sentence
- Streams with an odd number of notes are preferred so alternating hands land the next phrase on the strong hand.

### 3.11 Player options worth matching

| Option | Effect | Source |
|---|---|---|
| Speed | x1 to x4 | [V] wikiwiki |
| Invisible (doron) | Notes hidden, syllable text and bar lines remain | [V] |
| Reverse (abekobe) | Every don becomes ka and the reverse | [V] |
| Random, two strengths | Each note swaps colour with 20% probability (25% in one PSP game) or 50% | [V] |
| Perfect | One 不可 ends the song | [V] console only |
| Training | One 不可 restarts the song | [V] console only |
| Auto | Plays itself with all 良; mascot replaced by a robot version; score not saved | [V] |
| Voice callouts off | Nijiiro | [V] |

---

## Conflicts and caveats found

1. **Timing windows.** Two agreeing sets differ only by frame rate: 25 / 75 / 108.3 and 41.7 / 108.3 / 125 (60 fps) versus 25.025 / 75.075 / 108.442 and 41.708 / 108.442 / 125.125 (59.94 fps). Unsourced Q&A answers quoting "4 / 8 / 12 frames" or "66 ms" contradict both and were discarded. An automated summary of the wiki page also mis-assigned Hard to the wider windows; the page's table markup shows Hard shares Oni's windows.
2. **Old drumroll and balloon points.** Taiko Time says big drumroll 600 per hit and balloon 500 per hit in the old system, then 300 for balloons in the same article. Wikiwiki says big drumroll 360 (Taiko 7-14) or 300 (earlier) and balloon 300. Wikiwiki is more detailed and internally consistent.
3. **Big-note bonus.** x2 everywhere except Nijiiro-style scoring, where it is removed. The arcade needs force, not two hands; consoles need two hands.
4. **Crowns.** taiko-web only has silver and gold. The official Nijiiro set is silver (clear), gold (full combo), rainbow (all 良). One automated summary had gold and silver swapped; the official how-to page is authoritative.
5. **Gauge fill rates.** taiko-web's formulas are a simplification. Official rates vary by star count and are hand-tuned per chart. Easy was reportedly loosened in recent Nijiiro versions.
6. **Nameplate position.** The two simulators place it differently (top strip versus left panel).
7. **Note codes.** One automated summary of the TJA spec shifted every code by one (claiming 0 = don). The spec text and OpenTaiko docs both say 0 = blank, 1 = don, 2 = ka.
8. **Song-select style** changed between arcade generations (row of vertical bars versus vertical list). Pick one deliberately.

---

## Sources for Parts 2 and 3

- TJA format reference: https://iepiweidieng.github.io/TJAPlayer3/tja/
- OpenTaiko charting docs: https://github.com/OpenTaiko/OpTk-Documentation/blob/main/docs/charting.md
- taiko-web source (mirror): https://github.com/Mik027/taiko-web (files under `public/src/js/`)
- TJAPlayer3 default skin values: https://github.com/AioiLight/TJAPlayer3/blob/master/TJAPlayer3/Common/CSkin.cs
- Wikiwiki, basic system: https://wikiwiki.jp/taiko-fumen/%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0/%E5%9F%BA%E6%9C%AC%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0
- Wikiwiki, scoring: https://wikiwiki.jp/taiko-fumen/%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0/%E9%85%8D%E7%82%B9
- Wikiwiki, gauge fill rates: https://wikiwiki.jp/taiko-fumen/%E3%82%B7%E3%82%B9%E3%83%86%E3%83%A0/%E9%AD%82%E3%82%B2%E3%83%BC%E3%82%B8%E3%81%AE%E4%BC%B8%E3%81%B3%E7%8E%87
- Wikiwiki, average density (Oni 10, other star levels linked from it): https://wikiwiki.jp/taiko-fumen/%E5%8F%8E%E9%8C%B2%E6%9B%B2/%E5%B9%B3%E5%9D%87%E5%AF%86%E5%BA%A6%E9%A0%86/%E3%81%8A%E3%81%AB/%E2%98%85%C3%9710
- Wikiwiki, per-star song lists (example, Easy 5): https://wikiwiki.jp/taiko-fumen/%E5%8F%8E%E9%8C%B2%E6%9B%B2/%E3%81%8B%E3%82%93%E3%81%9F%E3%82%93/%E2%98%85%C3%975
- Wikiwiki, top-rank score table: https://wikiwiki.jp/taiko-fumen/%E4%BD%9C%E5%93%81/%E6%96%B0AC/%E6%A5%B5%E3%82%B9%E3%82%B3%E3%82%A2/%E3%81%8A%E3%81%AB
- Official arcade how-to: https://taiko.namco-ch.net/taiko/en/howto/index.php and https://taiko.namco-ch.net/taiko/en/howto/onpu.php
- 4Gamer, Nijiiro launch: https://www.4gamer.net/games/140/G014093/20200324028/
- Taiko Time, how to play: https://taikotime.blogspot.com/2010/11/how-to-play.html
- Taiko Time, advanced rules: https://taikotime.blogspot.com/2010/08/advanced-rules.html
- Taiko Time, shin-uchi: https://taikotime.blogspot.com/2010/10/shinta-mode.html
- Fandom wiki, series overview and Nijiiro: https://taiko.fandom.com/wiki/Taiko_no_Tatsujin_(series) , https://taiko.fandom.com/wiki/Taiko_no_Tatsujin_(2020)
- Score rank thresholds: https://detail.chiebukuro.yahoo.co.jp/qa/question_detail/q11225767726 , https://www.weblio.jp/content/%E5%A4%AA%E9%BC%93%E3%81%AE%E9%81%94%E4%BA%BA
- osu!taiko ranking criteria: https://osu.ppy.sh/wiki/en/Ranking_criteria/osu!taiko
- Yamaha interview with an official chart designer: https://jp.yamaha.com/sp/myujin/79103.html
- Wikipedia overview: https://en.wikipedia.org/wiki/Taiko_no_Tatsujin
