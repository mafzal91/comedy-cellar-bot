import axios from "axios";
import { ApiResponse } from "../../types/api";
import { parseLineUp } from "./parseLineUp";

const mockRes = {
  show: {
    html: '<div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30950">+</span><div class="info"><h2><span class="bold">7:00 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Robert Kelly: A One Man Show:  Final Fat</span></h2></div></div><div class="lineup" data-set-content="30950"><div class="set-content"><div><img src="/wp-content/uploads/2013/04/RobertKellyHEadshot1-e1367204742124-70x70.jpg" alt="Robert Kelly\'s headshot"></div><div><p><span class="name">Robert Kelly</span> FROM "THE TONIGHT SHOW", THE MOVIE "TRAINWRECK", FROM FX "LOUIE", AND COMEDY CENTRAL</p><p class="website"><a target="_blank" href="http://robertkellylive.com/" aria-label="Website for Robert Kelly.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704844800" aria-label="Make a reservation for 7:00 pm Robert Kelly: A One Man Show:  Final Fat.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30987">+</span><div class="info"><h2><span class="bold">7:30 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Macdougal Street</span></h2></div></div><div class="lineup" data-set-content="30987"><div class="set-content"><div><img src="/wp-content/uploads/2021/06/matt-richards-70x70.jpg" alt="Matt Richards\'s headshot"></div><div><p><span class="name">Matt Richards</span> From HQ trivia, Two Broke Girls, That Damn Michael Che on HBO Max </p><p class="website"><a target="_blank" href="http://Mattrichardscomedy.com http://Mattrichardscomedy.com" aria-label="Website for Matt Richards.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/gregrogell-e1361318803193-70x70.jpg" alt="Gregg Rogell\'s headshot"></div><div><p><span class="name">Gregg Rogell</span> FROM THE "LOUIE" CK SHOW, "THE ARISTOCRATS", "THE CONAN O\'BRIEN SHOW", COMEDY CENTRAL\'S "TOUGH CROWD" AND "THE TONIGHT SHOW".</p><p class="website"><a target="_blank" href="http://imdb.com/name/nm0736612/" aria-label="Website for Gregg Rogell.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/06/doug-bell-1-70x70.jpg" alt="Geoff Chaser\'s headshot"></div><div><p><span class="name">Geoff Chaser</span> FROM HBO, </p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/ryanhamilton1-e1361315985758-70x70.jpg" alt="Ryan Hamilton\'s headshot"></div><div><p><span class="name">Ryan Hamilton</span> FROM THE TONIGHT SHOW, HOUR SPECIAL ON NETFLIX, FROM THE  "LATE SHOW WITH STEPHEN COLBERT",  "CONAN O\'BRIEN SHOW", "LAST COMIC STANDING",</p><p class="website"><a target="_blank" href="http://www.ryanhamiltonlive.com/" aria-label="Website for Ryan Hamilton.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2017/03/EW_030-70x70.jpg" alt="Emma Willmann\'s headshot"></div><div><p><span class="name">Emma Willmann</span> From The Late Show with Stephen Colbert, MTV, Vh1, host of The Check Spot on SiriusXM</p><p class="website"><a target="_blank" href="http://emmacomedy.com/" aria-label="Website for Emma Willmann.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/10/gianmarco-70x70.jpg" alt="Gianmarco Soresi\'s headshot"></div><div><p><span class="name">Gianmarco Soresi</span> NETFLIX BONDING, PBS\' STORIES FROM THE STAGE, HERE TODAY WITH BILLY CRYSTAL, "HUSTLERS" WITH J-LO, COMEDY CENTRAL</p><p class="website"><a target="_blank" href="http://gianmarcosoresi.com" aria-label="Website for Gianmarco Soresi.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704846600" aria-label="Make a reservation for 7:30 pm Macdougal Street.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="31007">+</span><div class="info"><h2><span class="bold">7:35 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Fat Black Pussycat (Bar)</span></h2></div></div><div class="lineup" data-set-content="31007"><div class="set-content"><div><img src="/wp-content/uploads/2022/03/DSC_7101-Edit-Color-4-70x70.jpg" alt="Eric Neumann\'s headshot"></div><div><p><span class="name">Eric Neumann</span> FROM THE TONIGHT SHOW STARRINGJIMMY FALLON, NETFLIX, COMEDY CENTRAL, IFC</p><p class="website"><a target="_blank" href="http://ericneumanncomedy.com" aria-label="Website for Eric Neumann.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/09/image0-70x70.jpeg" alt="Jeff Arcuri\'s headshot"></div><div><p><span class="name">Jeff Arcuri</span> THE LATE SHOW W/STEPHEN COLBERT</p><p class="website"><a target="_blank" href="http://@jarcuri" aria-label="Website for Jeff Arcuri.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/12/amina-70x70.jpeg" alt="Aminah Imani\'s headshot"></div><div><p><span class="name">Aminah Imani</span> FROM "INSIDE AMY SHUMER", FLATBUSH MISDEMEANORS, UP EARLY TONIGHT, COMEDY CENTRAL</p><p class="website"><a target="_blank" href="http://aminahimani.com" aria-label="Website for Aminah Imani.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/10/shafi-70x70.jpg" alt="Shafi Hossain\'s headshot"></div><div><p><span class="name">Shafi Hossain</span> ROAD COMICS ON PEACOCK, KEVIN HART\'S LOL NETWORK, NEW YORK\'S FUNNIESTAT NYCF</p><p class="website"><a target="_blank" href="http://shafihossaincomedy.carrd.co" aria-label="Website for Shafi Hossain.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/08/yush-Raj-70x70.jpeg" alt="Yush Raj\'s headshot"></div><div><p><span class="name">Yush Raj</span> FROM HBO</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/04/jordan-j-70x70.jpg" alt="Jordan Jensen\'s headshot"></div><div><p><span class="name">Jordan Jensen</span> Late Late Show, WINNER NEW YORK\'S FUNNIEST STAND UP 2021, JUST FOR LAUGHS NEW FACE 2019</p><p class="website"><a target="_blank" href="http://jordanjensencomedy.com" aria-label="Website for Jordan Jensen.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704846900" aria-label="Make a reservation for 7:35 pm Fat Black Pussycat (Bar).">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30998">+</span><div class="info"><h2><span class="bold">8:00 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Village Underground</span></h2></div></div><div class="lineup" data-set-content="30998"><div class="set-content"><div><img src="/wp-content/uploads/2013/02/MikeYard-e1361393787230-70x70.jpeg" alt="Mike Yard\'s headshot"></div><div><p><span class="name">Mike Yard</span> FROM "NIGHTLY SHOW WITH LARRY WILMORE", BAD BOYS OF COMEDY, DEF COMEDY JAM, AND SHOWTIME AT THE APOLLO.</p><p class="website"><a target="_blank" href="http://mikeyardcomedy.com/" aria-label="Website for Mike Yard.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/07/maddie-wiener-70x70.jpeg" alt="Maddie Wiener\'s headshot"></div><div><p><span class="name">Maddie Wiener</span> COMEDY CENTRAL, HBO, JUST FOR LAUGHS</p><p class="website"><a target="_blank" href="http://MaddieWiener.com" aria-label="Website for Maddie Wiener.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/06/doug-bell-1-70x70.jpg" alt="Geoff Chaser\'s headshot"></div><div><p><span class="name">Geoff Chaser</span> FROM HBO, </p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/04/dovdavidoff-e1366905931330-70x70.jpg" alt="Dov Davidoff\'s headshot"></div><div><p><span class="name">Dov Davidoff</span> FROM NBC\'S "SHADES OF BLUE", HBO\'S  "CRASHING",  FROM NBC\'S "RAINES", "JOHNNY" FROM THE MOVIE "INVINCIBLE", THE TONIGHT SHOW, COMEDY CENTRAL\'S "TOUGH CROWD". FROM THE MOVIES "MAX & GRACE" AND "ASH TUESDAY".</p><p class="website"><a target="_blank" href="https://www.dovdavidoff.net/" aria-label="Website for Dov Davidoff.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/greerbarnes-e1361318041796-70x70.jpg" alt="Greer Barnes\'s headshot"></div><div><p><span class="name">Greer Barnes</span> FROM HBO\'S "CRASHING",  THE "DAVE CHAPPELLE SHOW", "TOUGH CROWD", "FOR LOVE OF THE GAME", AND "THE DAVID LETTERMAN SHOW".</p><p class="website"><a target="_blank" href="https://www.comedycellar.com/images/greer.html" aria-label="Website for Greer Barnes.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/09/image0-70x70.jpeg" alt="Jeff Arcuri\'s headshot"></div><div><p><span class="name">Jeff Arcuri</span> THE LATE SHOW W/STEPHEN COLBERT</p><p class="website"><a target="_blank" href="http://@jarcuri" aria-label="Website for Jeff Arcuri.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704848400" aria-label="Make a reservation for 8:00 pm Village Underground.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="31013">+</span><div class="info"><h2><span class="bold">8:30 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Fat Black Pussycat (Lounge)</span></h2></div></div><div class="lineup" data-set-content="31013"><div class="set-content"><div><img src="/wp-content/uploads/2013/04/jonfisch-e1366073669758-70x70.jpg" alt="Jon Fisch\'s headshot"></div><div><p><span class="name">Jon Fisch</span> FROM THE LATE SHOW WITH STEPHEN COLBERT,  "THE DAVID LETTERMAN SHOW", "THE APPRENTICE" ON NBC, "LAST COMIC STANDING", AND COMEDY CENTRAL\'S "PREMIUM BLEND".</p><p class="website"><a target="_blank" href="https://twitter.com/JonnyFisch" aria-label="Website for Jon Fisch.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2019/02/jourdain.jpg" alt="Jourdain Fisher\'s headshot"></div><div><p><span class="name">Jourdain Fisher</span> THE TONIGHT SHOW, JFL, BET, NBC</p><p class="website"><a target="_blank" href="http://joudainfisher.com" aria-label="Website for Jourdain Fisher.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2015/05/gina-brillon1-70x70.jpg" alt="Gina Brillon\'s headshot"></div><div><p><span class="name">Gina Brillon</span> FROM THE DISNEY MOVIE "DASHING THROUGH THE SNOW", FROM "AMERICA GOT TALENT", FROM "THE FLUFFY MOVIE", LATE NIGHT W/SETH MEYERS, HOUR SPECIAL "PACIFICALLY SPEAKING"</p><p class="website"><a target="_blank" href="http://ginabrillon.com" aria-label="Website for Gina Brillon.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/nickgriffin-e1361317029345-70x70.jpg" alt="Nick Griffin\'s headshot"></div><div><p><span class="name">Nick Griffin</span> 11 APPEARANCES  ON  "THE LATE SHOW WITH DAVID LETTERMAN", "LATE SHOW WITH STEPHEN COLBERT", COMEDY CENTRAL PRESENTS "THE HALF HOUR  COMEDY SPECIAL"</p><p class="website"><a target="_blank" href="http://nickgriffin.net/" aria-label="Website for Nick Griffin.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/03/alex-kumin-70x70.jpg" alt="Alex Kumin\'s headshot"></div><div><p><span class="name">Alex Kumin</span> COMEDY CENTRAL, NBC BREAKOUT FEST, GILDA\'S LAUGHEST BEST OF THE MIDWEST</p><p class="website"><a target="_blank" href="http://alexkumin,com" aria-label="Website for Alex Kumin.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/03/pat-burtscher-70x70.jpg" alt="Pat Burtscher\'s headshot"></div><div><p><span class="name">Pat Burtscher</span> JUST FOR LAUGHS, MELBOURNE INTERNATIONAL COMEDY FESTIVAL</p><p class="website"><a target="_blank" href="http://patburtscher.com" aria-label="Website for Pat Burtscher.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2017/10/MG_0118-70x70.jpg" alt="Nathan Macintosh\'s headshot"></div><div><p><span class="name">Nathan Macintosh</span> THE TONIGHT SHOW WITH JIMMY FALLON TWICE, THE LATE SHOW WITH STEPHEN COLBERT AND NEW YORK TIMES REVIEWED SPECIAL "MONEY NEVER WAKES" ON YOUTUBE.</p><p class="website"><a target="_blank" href="http://nathanmacintosh.com" aria-label="Website for Nathan Macintosh.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704850200" aria-label="Make a reservation for 8:30 pm Fat Black Pussycat (Lounge).">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30988">+</span><div class="info"><h2><span class="bold">9:30 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Macdougal Street</span></h2></div></div><div class="lineup" data-set-content="30988"><div class="set-content"><div><img src="/wp-content/uploads/2021/06/matt-richards-70x70.jpg" alt="Matt Richards\'s headshot"></div><div><p><span class="name">Matt Richards</span> From HQ trivia, Two Broke Girls, That Damn Michael Che on HBO Max </p><p class="website"><a target="_blank" href="http://Mattrichardscomedy.com http://Mattrichardscomedy.com" aria-label="Website for Matt Richards.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/09/daphnique-70x70.jpg" alt="Daphnique Springs\'s headshot"></div><div><p><span class="name">Daphnique Springs</span> AMAZON PRIME\'S "INSIDE JOKES", BRING THE FUNNY NBC, JIMMY KIMMEL LIVE,</p><p class="website"><a target="_blank" href="http://iamdsprings.com" aria-label="Website for Daphnique Springs.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/02/ralph-b-70x70.jpeg" alt="Ralph Barbosa\'s headshot"></div><div><p><span class="name">Ralph Barbosa</span> FROM NETFLIX, FROM THE TONIGHT SHOW, HBO, COMEDY CENTRAL</p><p class="website"><a target="_blank" href="http://Babosacomedy.com" aria-label="Website for Ralph Barbosa.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/08/molly-k-70x70.jpeg" alt="Molly Kearney\'s headshot"></div><div><p><span class="name">Molly Kearney</span> SATURDAY NIGHT LIVE CAST MEMBER, AMAZON PRIME\'S LEAGUE OF THEIR OWN, DISNEY\'S THE MIGHTY DUCKS</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/04/caitlin-70x70.jpeg" alt="Caitlin Peluffo\'s headshot"></div><div><p><span class="name">Caitlin Peluffo</span> THE LATE LATE SHOW, THE LATE SHOW WITH STEPHEN COLBERT, NBC\'S NEW YORK\'S FUNNIES</p><p class="website"><a target="_blank" href="http://caitlinpeluffo.com" aria-label="Website for Caitlin Peluffo.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2020/01/ETHAN-SIMMONS-70x70.jpg" alt="Ethan Simmons-Patterson\'s headshot"></div><div><p><span class="name">Ethan Simmons-Patterson</span> BLUE WHALE COMEDY FESTIVAL, THE KNITTING FACTORY,</p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704853800" aria-label="Make a reservation for 9:30 pm Macdougal Street.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="31008">+</span><div class="info"><h2><span class="bold">9:35 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Fat Black Pussycat (Bar)</span></h2></div></div><div class="lineup" data-set-content="31008"><div class="set-content"><div><img src="/wp-content/uploads/2013/04/WilSylvince1-e1366141371904-70x70.jpg" alt="Wil Sylvince\'s headshot"></div><div><p><span class="name">Wil Sylvince</span> SHOWTIME, HBO, SHORT CUTS FILM FESTIVAL</p><p class="website"><a target="_blank" href="http://wilsylvince.com/" aria-label="Website for Wil Sylvince.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/07/maddie-wiener-70x70.jpeg" alt="Maddie Wiener\'s headshot"></div><div><p><span class="name">Maddie Wiener</span> COMEDY CENTRAL, HBO, JUST FOR LAUGHS</p><p class="website"><a target="_blank" href="http://MaddieWiener.com" aria-label="Website for Maddie Wiener.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2020/01/ETHAN-SIMMONS-70x70.jpg" alt="Ethan Simmons-Patterson\'s headshot"></div><div><p><span class="name">Ethan Simmons-Patterson</span> BLUE WHALE COMEDY FESTIVAL, THE KNITTING FACTORY,</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/07/geoffrey-70x70.jpg" alt="Geoffrey Asmus\'s headshot"></div><div><p><span class="name">Geoffrey Asmus</span> JUST FOR LAUGHS, FOX</p><p class="website"><a target="_blank" href="http://whitecomedian.com" aria-label="Website for Geoffrey Asmus.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2018/07/daniel-s-70x70.jpg" alt="Daniel Simonsen\'s headshot"></div><div><p><span class="name">Daniel Simonsen</span> WINNER NEW YORKS\'S FUNNIEST FOR 2022 AT THE NEW YORK COMEDY FESTIVAL, FROM SETH MYERS SHOW, BBC "RUSSELL HOWARD\'S GOOD NEWS", BEST NEWCOMER EDINBURGH FRINGE FESTIVAL</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2015/04/DEREK-GAINES1-70x70.jpg" alt="Derek Gaines\'s headshot"></div><div><p><span class="name">Derek Gaines</span> "WRITERS GUILD AWARD WINNER", MTV\'S "BROKE ASS GAME SHOW", AOL ORIGINALS "CONNECTED"</p><p class="website"><a target="_blank" href="https://twitter.com/Derek1Gaines" aria-label="Website for Derek Gaines.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704854100" aria-label="Make a reservation for 9:35 pm Fat Black Pussycat (Bar).">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30999">+</span><div class="info"><h2><span class="bold">10:00 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Village Underground</span></h2></div></div><div class="lineup" data-set-content="30999"><div class="set-content"><div><img src="/wp-content/uploads/2015/02/ryan-reiss-70x70.jpg" alt="Ryan Reiss\'s headshot"></div><div><p><span class="name">Ryan Reiss</span> LATE NIGHT WITH SETH MEYERS, WARM UP COMEDIAN AND CONTRIBUTING MONOLOGUE/SEGMENT WRITER, FX COMEDY CORRESPONDENT, MTV\'S JIMMY FALLON & DREW BARRYMORE\'S SPRING BREAK FACE OFF,</p><p class="website"><a target="_blank" href="http://ryanreiss.com" aria-label="Website for Ryan Reiss.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/12/mike-feeney-70x70.jpg" alt="Mike Feeney\'s headshot"></div><div><p><span class="name">Mike Feeney</span> FROM THE TONIGHT SHOW, COMEDY SPECIAL "A NIGHT AT THE COMEDY CELLAR", DEBUT ALBUM "RAGE AGAINST THE ROUTINE" PREMIERED AT #1 ON ITUNES COMEDY CHARTS AND #6 ON BILLBOARD CHARTS..</p><p class="website"><a target="_blank" href="http://MikeFeeneyComedy.com" aria-label="Website for Mike Feeney.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2019/12/mia-70x70.jpg" alt="Mia Jackson\'s headshot"></div><div><p><span class="name">Mia Jackson</span> Last Comic Standing, Epix, Comedy Central</p><p class="website"><a target="_blank" href="http://miajackson.com" aria-label="Website for Mia Jackson.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/11/image0-70x70.jpg" alt="Ian Lara\'s headshot"></div><div><p><span class="name">Ian Lara</span> HBO SPECIAL ROMANTIC COMEDY, Comedy Central Half-hour, The Tonight show</p><p class="website"><a target="_blank" href="http://ianlaralive.com" aria-label="Website for Ian Lara.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/09/image0-70x70.jpeg" alt="Jeff Arcuri\'s headshot"></div><div><p><span class="name">Jeff Arcuri</span> THE LATE SHOW W/STEPHEN COLBERT</p><p class="website"><a target="_blank" href="http://@jarcuri" aria-label="Website for Jeff Arcuri.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/06/JOSH-ADAM-MEYERS-70x70.jpg" alt="Josh Adam Meyers\'s headshot"></div><div><p><span class="name">Josh Adam Meyers</span> BILL BURR PRESENTS "THE RINGERS" ON COMEDY CENTRAL, THE GODDAMN COMEDY JAM, THE 500 ON SPOTIFY, F IS FOR FAMILY ON NETFLIX</p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704855600" aria-label="Make a reservation for 10:00 pm Village Underground.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="31062">+</span><div class="info"><h2><span class="bold">10:30 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">Hot Soup in the FBPC</span></h2></div></div><div class="lineup" data-set-content="31062"><div class="set-content"><div><img src="/wp-content/uploads/2022/03/GARY-VIDER-MATT-RUBY-70x70.jpg" alt="Hot Soup\'s headshot"></div><div><p><span class="name">Hot Soup</span> Hot Soup, the long-running Tuesday night comedy show, has a new home at the FBPC. This show is curated by Mark Normand, Gary Vider and Matt Ruby. </p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2015/11/gary-Vider-70x70.jpg" alt="Gary Vider\'s headshot"></div><div><p><span class="name">Gary Vider</span> FROM CONAN, FINALIST ON AMERICA GOT TALENT</p><p class="website"><a target="_blank" href="http://garyvider.com" aria-label="Website for Gary Vider.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/04/marknormand-e1366074149644-70x70.jpg" alt="Mark Normand\'s headshot"></div><div><p><span class="name">Mark Normand</span> FROM "THE LATE SHOW WITH STEPHEN COLBERT", HOUR SPECIAL ON COMEDY CENTRAL,  FOUR APPEARANCES ON THE CONAN O\'BRIEN SHOW, @MIDNIGHT, TRU-TV, LAST COMIC STANDING,</p><p class="website"><a target="_blank" href="http://marknormandcomedy.com/" aria-label="Website for Mark Normand.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2017/06/matt-ruby1-70x70.jpeg" alt="Matt Ruby\'s headshot"></div><div><p><span class="name">Matt Ruby</span> FROM SEESO/NBC THE COMEDY SHOW SHOW AND MTV’S GIRL CODE</p><p class="website"><a target="_blank" href="http://mattrubycomedy.com" aria-label="Website for Matt Ruby.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2019/12/mia-70x70.jpg" alt="Mia Jackson\'s headshot"></div><div><p><span class="name">Mia Jackson</span> Last Comic Standing, Epix, Comedy Central</p><p class="website"><a target="_blank" href="http://miajackson.com" aria-label="Website for Mia Jackson.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704857400" aria-label="Make a reservation for 10:30 pm Hot Soup in the FBPC.">Make A Reservation</a></div></div></div><div><div class="set-header"><span class="lineup-toggle" data-lineup-id="30989">+</span><div class="info"><h2><span class="bold">11:30 pm<span class="hide-mobile"> show</span></span><span class="divider">-</span><span class="title">MacDougal Street</span></h2></div></div><div class="lineup" data-set-content="30989"><div class="set-content"><div><img src="/wp-content/uploads/2021/05/james-mattern-1-70x70.jpg" alt="James Mattern\'s headshot"></div><div><p><span class="name">James Mattern</span> KEVIN HART\'S"COMEDY IN COLOR, MADISON SQUARE GARDEN NETWORK\'S "PEOPLE TALKIN SPORTS"</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2021/11/simeon-70x70.jpg" alt="Simeon Goodson\'s headshot"></div><div><p><span class="name">Simeon Goodson</span> BET COMIC VIEW, COMEDY CENTRAL ARABIA COMEDY AL WAGIF</p><p class="website"><a target="_blank" href="http://simeongoodson.wixsite.com/website" aria-label="Website for Simeon Goodson.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2023/07/tina-friml-70x70.jpg" alt="Tina Friml\'s headshot"></div><div><p><span class="name">Tina Friml</span> FROM THE TONIGHT SHOW, NBC, COMEDY CENTRAL, JUST FOR LAUGHS</p><p class="website"><a target="_blank" href="http://tinafriml.com" aria-label="Website for Tina Friml.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/05/JON-R-70x70.jpg" alt="Jon Rudnitsky\'s headshot"></div><div><p><span class="name">Jon Rudnitsky</span> SNL , YOUNG LARRY ON THE LAST SEASON OF CURB YOUR ENTHUSIASM, CONAN, "HOME AGAIN" OPPOSITE REESE WITHERSPOON, CATCH 22 ON HULU, BIG LEAP ON FOX.</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2022/09/eleanor-kerrigan-70x70.jpg" alt="Eleanor Kerrigan\'s headshot"></div><div><p><span class="name">Eleanor Kerrigan</span> ALBUM- LADYLIKE, BILL BURR PRESENTS THE RINGERS, LIGHTS OUT WITH DAVID SPADE, THE BLUE SHOW ON SHOWTIME, DICE ON SHOWTIME, ENTOURAGE ON HBO</p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/brianscolaro-e1361515717699-70x70.jpeg" alt="Brian Scolaro\'s headshot"></div><div><p><span class="name">Brian Scolaro</span> Abbott Elementary, Shameless, Night Court, Conan, Mad Men, Dexter, Grey\'s Anatgomy, Comedy Central Presents, A Million Little Things, Ten Year Old Tom, Sullivan and Son, Late Late Show, Stacked</p><p class="website"><a target="_blank" href="http://brianscolaro.com/" aria-label="Website for Brian Scolaro.">&gt; Website</a></p></div></div><div class="set-content"><div><img src="/wp-content/uploads/2013/02/daveattell-e1361323074871-70x70.jpg" alt="Dave Attell\'s headshot"></div><div><p><span class="name">Dave Attell</span> FROM THE MOVIE "TRAINWRECK", STAR OF "DAVES OLD PORN" ON SHOWTIME, COMEDY CENTRAL\'S "INSOMNIAC WITH DAVE ATTELL", THE DAVID LETTERMAN,T HE TONIGHT SHOW, IFC\'S "Z ROCK", "TOUGH CROWD".</p><p class="website"><a target="_blank" href="http://daveattell.com/" aria-label="Website for Dave Attell.">&gt; Website</a></p></div></div><div class="make-reservation"><a href="/reservations-newyork/?showid=1704861000" aria-label="Make a reservation for 11:30 pm MacDougal Street.">Make A Reservation</a></div></div></div>',
    date: "Tuesday January 9, 2024",
  },
  date: "2024-01-09",
};

export const fetchLineUp = async (
  date: string
): Promise<ApiResponse.GetLineUpResponse> => {
  const payload = {
    date: date,
    venue: "newyork",
    type: "lineup",
  };
  const data = new URLSearchParams();
  data.append("action", "cc_get_shows");
  data.append("json", JSON.stringify(payload));

  let config = {
    method: "POST",
    maxBodyLength: Infinity,
    url: "https://www.comedycellar.com/reservations/api/getShows",
    headers: {
      // accept: "*/*",
      // "accept-language": "en-US,en;q=0.9",
      "content-type": "application/x-www-form-urlencoded; charset=UTF-8",
      // pragma: "no-cache",
      // Referer: "https://www.comedycellar.com/new-york-line-up/",
      // "Referrer-Policy": "no-referrer-when-downgrade",
    },
    body: data.toString(),
  };

  try {
    // const res = await axios.request(config);
    // const responseData = res.data;
    // return responseData.data as ApiResponse.Response;

    const responseData = mockRes;
    const parsedPayload = parseLineUp({ html: responseData.show.html });
    return parsedPayload;
  } catch (error) {
    console.log(error);
    throw error; // You might want to re-throw the error so that callers can handle it
  }
};