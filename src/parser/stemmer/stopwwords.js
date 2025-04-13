const stops2 = {
  ru: "алл без близк бол больш буд будет будеш будт будут бы быва быв был быт в важн вам вас ваш вверх вдал вдруг вед везд ве вниз во вокруг вон восемнадцат восемнадца восем восьм вот впроч времен врем все всегд всег всем всех всю всюд вся всё втор вы г где говор год да давн даж далек дальш дар два двадцат двадца две двенадцат двенадца двух девятнадцат девятнадца девят девя действительн дел ден десят деся для до довольн долг должн друг е ег ем есл ест ещ ещё её ж же жизн за зан занят зат зач зде знач и из ил им имен имет иногд их к кажд кажет как кем когд ког ком конечн котор кром круг кто куд лет ли лиш лучш люд м мал межд мел мен меньш миллион мим мир мне мног многочислен мно мог могут мож может можн можх мо мор моч моё мы на наверх над назад наибол наконец нам нас нача наш не нег недавн недалек нельз нем немн непрерывн нередк нескольк нет неё ни нибуд ниж низк никогд никуд ним них нич но ну нужн нх о об обычн один одиннадцат одиннадца однажд однак одн окол он опя особен от отовсюд отсюд очен перв перед по под пожалуйст позж пок пор посл посред пот поч почт прекрасн при про прост прот процент пятнадцат пятнадца пят раз разв ран раньш ряд с сам сво сеа себ сегодн седьм сейчас семнадцат семнадца сем сих сказа скольк слишк снача снов со соб совс спасиб стал сут т та так такж там тво твоё те теб тем тепер тех то тоб тогд тог тож тольк том тот трет три тринадцат тринадца ту туд тут ты тысяч у уж умет хорош хотет хот хочеш част чащ чег человек чем через четверт четыр четырнадцат четырнадца что чтоб чут шестнадцат шестнадца шест эт этот я а вообщ тип чо прям сдела дума врод ващ дела кстат зна знают знал никт вид норм понима реальн хотел хоч всяк помн сраз смысл блин хз равн ок возможн пар поня аг например че поэт видим щас точн".split(
    " ",
  ),
  en: "i me my myself we us our ourselv you your yourself yourselv he him his himself she her herself it itself they them their themselv what which who whom whose this that these those am is are was were be been have has had do doe did will would should can could ought i'm you'r we'r they'r i'v you'v we'v they'v i'd you'd he'd she'd we'd they'd i'll you'll he'll she'll we'll they'll isn't aren't wasn't weren't hasn't haven't hadn't doesn't don't didn't won't wouldn't shan't shouldn't can't cannot couldn't mustn't let here there when where whi how a an the and but if or becaus as until while of at by for with about against between into through dure befor after abov below to from up upon down in out on off over under again further then onc all ani both each few more most other some such no nor not onli own same so than too veri say said shall".split(
    " ",
  ),
};

const stopWords = {
  ru: stops2.ru.reduce((p, v) => ((p[v] = true), p), {}),
  en: stops2.en.reduce((p, v) => ((p[v] = true), p), {}),
};

export function filterRu(word) {
  return stopWords.ru[word] ? "" : word;
}

export function filterEn(word) {
  return stopWords.en[word] ? "" : word;
}
