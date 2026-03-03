import { useState, useEffect, useCallback, useRef, useMemo } from "react";

// ═══════════════════════════════════════════════════════════════
// CONSTANTS
// ═══════════════════════════════════════════════════════════════

const API = '/api';
const STATUS = { TEAM: "team", BOX: "box", DEAD: "dead", MISSED: "missed" };

const S_CFG = {
  team: { label: "Team", icon: "⚔️", c: "#22c55e", bg: "rgba(22,163,74,.12)", bd: "rgba(22,163,74,.3)" },
  box: { label: "Box", icon: "📦", c: "#f59e0b", bg: "rgba(217,119,6,.12)", bd: "rgba(217,119,6,.3)" },
  dead: { label: "Tot", icon: "💀", c: "#ef4444", bg: "rgba(220,38,38,.12)", bd: "rgba(220,38,38,.3)" },
  missed: { label: "Verpasst", icon: "💨", c: "#6b7280", bg: "rgba(107,114,128,.12)", bd: "rgba(107,114,128,.3)" },
};

const T_EN = { normal: "Normal", fire: "Feuer", water: "Wasser", grass: "Pflanze", electric: "Elektro", ice: "Eis", fighting: "Kampf", poison: "Gift", ground: "Boden", flying: "Flug", psychic: "Psycho", bug: "Käfer", rock: "Gestein", ghost: "Geist", dragon: "Drache", dark: "Unlicht", steel: "Stahl", fairy: "Fee" };
const T_COL = { Normal: "#A8A878", Feuer: "#F08030", Wasser: "#6890F0", Pflanze: "#78C850", Elektro: "#F8D030", Eis: "#98D8D8", Kampf: "#C03028", Gift: "#A040A0", Boden: "#E0C068", Flug: "#A890F0", Psycho: "#F85888", Käfer: "#A8B820", Gestein: "#B8A038", Geist: "#705898", Drache: "#7038F8", Unlicht: "#705848", Stahl: "#B8B8D0", Fee: "#EE99AC" };

// Type effectiveness chart (attacking -> defending)
const TYPE_CHART = {
  Normal:  { Gestein: 0.5, Geist: 0, Stahl: 0.5 },
  Feuer:   { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 2, Käfer: 2, Gestein: 0.5, Drache: 0.5, Stahl: 2 },
  Wasser:  { Feuer: 2, Wasser: 0.5, Pflanze: 0.5, Boden: 2, Gestein: 2, Drache: 0.5 },
  Pflanze: { Feuer: 0.5, Wasser: 2, Pflanze: 0.5, Gift: 0.5, Boden: 2, Flug: 0.5, Käfer: 0.5, Gestein: 2, Drache: 0.5, Stahl: 0.5 },
  Elektro: { Wasser: 2, Pflanze: 0.5, Elektro: 0.5, Boden: 0, Flug: 2, Drache: 0.5 },
  Eis:     { Feuer: 0.5, Wasser: 0.5, Pflanze: 2, Eis: 0.5, Boden: 2, Flug: 2, Drache: 2, Stahl: 0.5 },
  Kampf:   { Normal: 2, Eis: 2, Gift: 0.5, Flug: 0.5, Psycho: 0.5, Käfer: 0.5, Gestein: 2, Geist: 0, Unlicht: 2, Stahl: 2, Fee: 0.5 },
  Gift:    { Pflanze: 2, Gift: 0.5, Boden: 0.5, Gestein: 0.5, Geist: 0.5, Stahl: 0, Fee: 2 },
  Boden:   { Feuer: 2, Pflanze: 0.5, Elektro: 2, Gift: 2, Flug: 0, Käfer: 0.5, Gestein: 2, Stahl: 2 },
  Flug:    { Pflanze: 2, Elektro: 0.5, Kampf: 2, Käfer: 2, Gestein: 0.5, Stahl: 0.5 },
  Psycho:  { Kampf: 2, Gift: 2, Psycho: 0.5, Unlicht: 0, Stahl: 0.5 },
  Käfer:   { Feuer: 0.5, Pflanze: 2, Kampf: 0.5, Gift: 0.5, Flug: 0.5, Psycho: 2, Geist: 0.5, Unlicht: 2, Stahl: 0.5, Fee: 0.5 },
  Gestein: { Feuer: 2, Eis: 2, Kampf: 0.5, Boden: 0.5, Flug: 2, Käfer: 2, Stahl: 0.5 },
  Geist:   { Normal: 0, Psycho: 2, Geist: 2, Unlicht: 0.5 },
  Drache:  { Drache: 2, Stahl: 0.5, Fee: 0 },
  Unlicht: { Kampf: 0.5, Psycho: 2, Geist: 2, Unlicht: 0.5, Fee: 0.5 },
  Stahl:   { Feuer: 0.5, Wasser: 0.5, Elektro: 0.5, Eis: 2, Gestein: 2, Stahl: 0.5, Fee: 2 },
  Fee:     { Feuer: 0.5, Gift: 0.5, Kampf: 2, Drache: 2, Unlicht: 2, Stahl: 0.5 },
};

const ALL_TYPES = Object.keys(T_COL);

const SPR = (id) => `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/${id}.png`;

// Static German name mapping (Gen 1-4, 493 Pokémon) – enables instant German search
const DE_NAMES = {1:"Bisasam",2:"Bisaknosp",3:"Bisaflor",4:"Glumanda",5:"Glutexo",6:"Glurak",7:"Schiggy",8:"Schillok",9:"Turtok",10:"Raupy",11:"Safcon",12:"Smettbo",13:"Hornliu",14:"Kokuna",15:"Bibor",16:"Taubsi",17:"Tauboga",18:"Tauboss",19:"Rattfratz",20:"Rattikarl",21:"Habitak",22:"Ibitak",23:"Rettan",24:"Arbok",25:"Pikachu",26:"Raichu",27:"Sandan",28:"Sandamer",29:"Nidoran♀",30:"Nidorina",31:"Nidoqueen",32:"Nidoran♂",33:"Nidorino",34:"Nidoking",35:"Piepi",36:"Pixi",37:"Vulpix",38:"Vulnona",39:"Pummeluff",40:"Knuddeluff",41:"Zubat",42:"Golbat",43:"Myrapla",44:"Duflor",45:"Giflor",46:"Paras",47:"Parasek",48:"Bluzuk",49:"Omot",50:"Digda",51:"Digdri",52:"Mauzi",53:"Snobilikat",54:"Enton",55:"Entoron",56:"Menki",57:"Rasaff",58:"Fukano",59:"Arkani",60:"Quapsel",61:"Quaputzi",62:"Quappo",63:"Abra",64:"Kadabra",65:"Simsala",66:"Machollo",67:"Maschock",68:"Machomei",69:"Knofensa",70:"Ultrigaria",71:"Sarzenia",72:"Tentacha",73:"Tentoxa",74:"Kleinstein",75:"Georok",76:"Geowaz",77:"Ponita",78:"Gallopa",79:"Flegmon",80:"Lahmus",81:"Magnetilo",82:"Magneton",83:"Porenta",84:"Dodu",85:"Dodri",86:"Jurob",87:"Jugong",88:"Sleima",89:"Sleimok",90:"Muschas",91:"Austos",92:"Nebulak",93:"Alpollo",94:"Gengar",95:"Onix",96:"Traumato",97:"Hypno",98:"Krabby",99:"Kingler",100:"Voltobal",101:"Lektrobal",102:"Owei",103:"Kokowei",104:"Tragosso",105:"Knogga",106:"Kicklee",107:"Nockchan",108:"Schlurp",109:"Smogon",110:"Smogmog",111:"Rihorn",112:"Rizeros",113:"Chaneira",114:"Tangela",115:"Kangama",116:"Seeper",117:"Seemon",118:"Goldini",119:"Golking",120:"Sterndu",121:"Starmie",122:"Pantimos",123:"Sichlor",124:"Rossana",125:"Elektek",126:"Magmar",127:"Pinsir",128:"Tauros",129:"Karpador",130:"Garados",131:"Lapras",132:"Ditto",133:"Evoli",134:"Aquana",135:"Blitza",136:"Flamara",137:"Porygon",138:"Amonitas",139:"Amoroso",140:"Kabuto",141:"Kabutops",142:"Aerodactyl",143:"Relaxo",144:"Arktos",145:"Zapdos",146:"Lavados",147:"Dratini",148:"Dragonir",149:"Dragoran",150:"Mewtu",151:"Mew",152:"Endivie",153:"Lorblatt",154:"Meganie",155:"Feurigel",156:"Igelavar",157:"Tornupto",158:"Karnimani",159:"Tyracroc",160:"Impergator",161:"Wiesor",162:"Wiesenior",163:"Hoothoot",164:"Noctuh",165:"Ledyba",166:"Ledian",167:"Webarak",168:"Ariados",169:"Iksbat",170:"Lampi",171:"Lanturn",172:"Pichu",173:"Pii",174:"Fluffeluff",175:"Togepi",176:"Togetic",177:"Natu",178:"Xatu",179:"Voltilamm",180:"Waaty",181:"Ampharos",182:"Blubella",183:"Marill",184:"Azumarill",185:"Mogelbaum",186:"Quaxo",187:"Hoppspross",188:"Hubelupf",189:"Papungha",190:"Griffel",191:"Sonnkern",192:"Sonnflora",193:"Yanma",194:"Felino",195:"Morlord",196:"Psiana",197:"Nachtara",198:"Kramurx",199:"Laschoking",200:"Traunfugil",201:"Icognito",202:"Woingenau",203:"Girafarig",204:"Tannza",205:"Forstellka",206:"Dummisel",207:"Skorgla",208:"Stahlos",209:"Snubbull",210:"Granbull",211:"Baldorfish",212:"Scherox",213:"Pottrott",214:"Skaraborn",215:"Sniebel",216:"Teddiursa",217:"Ursaring",218:"Schneckmag",219:"Magcargo",220:"Quiekel",221:"Keifel",222:"Corasonn",223:"Remoraid",224:"Octillery",225:"Botogel",226:"Mantax",227:"Panzaeron",228:"Hunduster",229:"Hundemon",230:"Seedraking",231:"Phanpy",232:"Donphan",233:"Porygon2",234:"Damhirplex",235:"Farbeagle",236:"Rabauz",237:"Kapoera",238:"Kussilla",239:"Elekid",240:"Magby",241:"Miltank",242:"Heiteira",243:"Raikou",244:"Entei",245:"Suicune",246:"Larvitar",247:"Pupitar",248:"Despotar",249:"Lugia",250:"Ho-Oh",251:"Celebi",252:"Geckarbor",253:"Reptain",254:"Gewaldro",255:"Flemmli",256:"Jungglut",257:"Lohgock",258:"Hydropi",259:"Moorabbel",260:"Sumpex",261:"Fiffyen",262:"Magnayen",263:"Zigzachs",264:"Geradaks",265:"Waumpel",266:"Schaloko",267:"Papinella",268:"Panekon",269:"Pudox",270:"Loturzel",271:"Lombrero",272:"Kappalores",273:"Samurzel",274:"Blanas",275:"Tengulist",276:"Schwalbini",277:"Schwalboss",278:"Wingull",279:"Pelipper",280:"Trasla",281:"Kirlia",282:"Guardevoir",283:"Gehweiher",284:"Maskeregen",285:"Knilz",286:"Kapilz",287:"Bummelz",288:"Muntier",289:"Letarking",290:"Nincada",291:"Ninjask",292:"Ninjatom",293:"Flurmel",294:"Krakeelo",295:"Krawumms",296:"Makuhita",297:"Hariyama",298:"Azurill",299:"Nasgnet",300:"Eneco",301:"Enekoro",302:"Zobiris",303:"Flunkifer",304:"Stollunior",305:"Stollrak",306:"Stolloss",307:"Meditie",308:"Medicham",309:"Frizelbliz",310:"Voltenso",311:"Plusle",312:"Minun",313:"Volbeat",314:"Illumise",315:"Roselia",316:"Schluppuck",317:"Schlukwech",318:"Kanivanha",319:"Tohaido",320:"Wailmer",321:"Wailord",322:"Camaub",323:"Camerupt",324:"Qurtel",325:"Spoink",326:"Groink",327:"Pandir",328:"Knacklion",329:"Vibrava",330:"Libelldra",331:"Tuska",332:"Noktuska",333:"Wablu",334:"Altaria",335:"Sengo",336:"Vipitis",337:"Lunastein",338:"Sonnfel",339:"Schmerbe",340:"Welsar",341:"Krebscorps",342:"Krebutack",343:"Puppance",344:"Lepumentas",345:"Liliep",346:"Wielie",347:"Anorith",348:"Armaldo",349:"Barschwa",350:"Milotic",351:"Formeo",352:"Kecleon",353:"Shuppet",354:"Banette",355:"Zwirrlicht",356:"Zwirrklop",357:"Tropius",358:"Palimpalim",359:"Absol",360:"Isso",361:"Schneppke",362:"Firnontor",363:"Seemops",364:"Seejong",365:"Walraisa",366:"Perlu",367:"Aalabyss",368:"Saganabyss",369:"Relicanth",370:"Liebiskus",371:"Kindwurm",372:"Draschel",373:"Brutalanda",374:"Tanhel",375:"Metang",376:"Metagross",377:"Regirock",378:"Regice",379:"Registeel",380:"Latias",381:"Latios",382:"Kyogre",383:"Groudon",384:"Rayquaza",385:"Jirachi",386:"Deoxys",387:"Chelast",388:"Chelcarain",389:"Chelterrar",390:"Panflam",391:"Panpyro",392:"Panferno",393:"Plinfa",394:"Pliprin",395:"Impoleon",396:"Staralili",397:"Staravia",398:"Staraptor",399:"Bidiza",400:"Bidifas",401:"Zirpurze",402:"Zirpeise",403:"Sheinux",404:"Luxio",405:"Luxtra",406:"Knospi",407:"Roserade",408:"Koknodon",409:"Rameidon",410:"Schilterus",411:"Bollterus",412:"Burmy",413:"Burmadame",414:"Moterpel",415:"Wadribie",416:"Honweisel",417:"Pachirisu",418:"Bamelin",419:"Bojelin",420:"Kikugi",421:"Kinoso",422:"Schalellos",423:"Gastrodon",424:"Ambidiffel",425:"Driftlon",426:"Drifzepeli",427:"Haspiror",428:"Schlapor",429:"Traunmagil",430:"Kramshef",431:"Charmian",432:"Shnurgarst",433:"Klingplim",434:"Skunkapuh",435:"Skuntank",436:"Bronzel",437:"Bronzong",438:"Mobai",439:"Pantimimi",440:"Wonneira",441:"Plaudagei",442:"Kryppuk",443:"Kaumalat",444:"Knarksel",445:"Knakrack",446:"Mampfaxo",447:"Riolu",448:"Lucario",449:"Hippopotas",450:"Hippoterus",451:"Pionskora",452:"Piondragi",453:"Glibunkel",454:"Toxiquak",455:"Venuflibis",456:"Finneon",457:"Lumineon",458:"Mantirps",459:"Shnebedeck",460:"Rexblisar",461:"Snibunna",462:"Magnezone",463:"Schlurplek",464:"Rihornior",465:"Tangoloss",466:"Elevoltek",467:"Magbrant",468:"Togekiss",469:"Yanmega",470:"Folipurba",471:"Glaziola",472:"Skorgro",473:"Mamutel",474:"Porygon-Z",475:"Galagladi",476:"Voluminas",477:"Zwirrfinst",478:"Frosdedje",479:"Rotom",480:"Selfe",481:"Vesprit",482:"Tobutz",483:"Dialga",484:"Palkia",485:"Heatran",486:"Regigigas",487:"Giratina",488:"Cresselia",489:"Phione",490:"Manaphy",491:"Darkrai",492:"Shaymin",493:"Arceus"};

const M_CFG = {
  grass: { label: "Gras", icon: "🌿", c: "#78C850" },
  surf: { label: "Surfer", icon: "🌊", c: "#6890F0" },
  fish: { label: "Angel", icon: "🎣", c: "#6890F0" },
  headbutt: { label: "Kopfnuss", icon: "🌳", c: "#A8B820" },
  gift: { label: "Geschenk", icon: "🎁", c: "#EE99AC" },
  static: { label: "Statisch", icon: "⭐", c: "#F8D030" },
  cave: { label: "Höhle", icon: "⛰️", c: "#B8A038" },
  bug: { label: "Käferturnier", icon: "🪲", c: "#A8B820" },
};

const ROUTES = [
  { id: "starter", name: "Starter", region: "johto", phase: "Falk", methods: ["gift"] },
  { id: "r29", name: "Route 29", region: "johto", phase: "Falk", methods: ["grass", "headbutt"] },
  { id: "r30", name: "Route 30", region: "johto", phase: "Falk", methods: ["grass", "headbutt", "surf", "fish"] },
  { id: "r31", name: "Route 31", region: "johto", phase: "Falk", methods: ["grass", "headbutt"] },
  { id: "dark1", name: "Dark Cave (Eingang)", region: "johto", phase: "Falk", methods: ["cave", "surf", "fish"] },
  { id: "sprout", name: "Sprout Tower", region: "johto", phase: "Falk", methods: ["cave"] },
  { id: "togepi", name: "Violet City (Togepi-Ei)", region: "johto", phase: "Falk", methods: ["gift"] },
  { id: "r32", name: "Route 32", region: "johto", phase: "Bianka", methods: ["grass", "headbutt", "surf", "fish"] },
  { id: "union1", name: "Union Cave 1F", region: "johto", phase: "Bianka", methods: ["cave", "surf", "fish"] },
  { id: "union2", name: "Union Cave B1F", region: "johto", phase: "Bianka", methods: ["cave", "surf", "fish"] },
  { id: "r33", name: "Route 33", region: "johto", phase: "Bianka", methods: ["grass", "headbutt"] },
  { id: "slow1", name: "Slowpoke Well B1F", region: "johto", phase: "Bianka", methods: ["cave", "surf", "fish"] },
  { id: "slow2", name: "Slowpoke Well B2F", region: "johto", phase: "Bianka", methods: ["cave", "surf", "fish"] },
  { id: "azalea", name: "Azalea Town", region: "johto", phase: "Bianka", methods: ["headbutt"] },
  { id: "ilex", name: "Ilex Wald", region: "johto", phase: "Bianka", methods: ["grass", "headbutt", "surf"] },
  { id: "r34", name: "Route 34", region: "johto", phase: "Whitney", methods: ["grass", "headbutt", "surf", "fish"] },
  { id: "eevee", name: "Goldenrod (Evoli)", region: "johto", phase: "Whitney", methods: ["gift"] },
  { id: "r35", name: "Route 35", region: "johto", phase: "Whitney", methods: ["grass", "headbutt", "surf"] },
  { id: "npark", name: "Nationalpark", region: "johto", phase: "Whitney", methods: ["grass", "bug"] },
  { id: "r36", name: "Route 36", region: "johto", phase: "Jens", methods: ["grass", "headbutt"] },
  { id: "r37", name: "Route 37", region: "johto", phase: "Jens", methods: ["grass", "headbutt"] },
  { id: "burned", name: "Turmruine", region: "johto", phase: "Jens", methods: ["cave"] },
  { id: "r38", name: "Route 38", region: "johto", phase: "Chuck", methods: ["grass", "headbutt"] },
  { id: "r39", name: "Route 39", region: "johto", phase: "Chuck", methods: ["grass", "headbutt"] },
  { id: "olivine", name: "Olivine City", region: "johto", phase: "Jasmin", methods: ["surf", "fish"] },
  { id: "r40", name: "Route 40", region: "johto", phase: "Chuck", methods: ["surf", "fish"] },
  { id: "r41", name: "Route 41", region: "johto", phase: "Chuck", methods: ["surf", "fish"] },
  { id: "cianwood", name: "Cianwood City", region: "johto", phase: "Chuck", methods: ["surf", "fish"] },
  { id: "r42", name: "Route 42", region: "johto", phase: "Sandra", methods: ["grass", "surf", "fish"] },
  { id: "mortar1", name: "Mt. Mortar 1F", region: "johto", phase: "Sandra", methods: ["cave", "surf", "fish"] },
  { id: "r43", name: "Route 43", region: "johto", phase: "Sandra", methods: ["grass", "surf", "fish"] },
  { id: "lake", name: "See des Zorns", region: "johto", phase: "Sandra", methods: ["surf", "fish", "static"] },
  { id: "ice1", name: "Eispfad 1F", region: "johto", phase: "Clair", methods: ["cave"] },
  { id: "ice2", name: "Eispfad B1F-B3F", region: "johto", phase: "Clair", methods: ["cave"] },
  { id: "r44", name: "Route 44", region: "johto", phase: "Clair", methods: ["grass", "headbutt", "surf", "fish"] },
  { id: "dragon", name: "Drachenhöhle", region: "johto", phase: "Clair", methods: ["surf", "fish"] },
  { id: "dratini", name: "Drachenhöhle (Dratini)", region: "johto", phase: "Clair", methods: ["gift"] },
  { id: "r45", name: "Route 45", region: "johto", phase: "Clair", methods: ["grass", "surf", "fish"] },
  { id: "r46", name: "Route 46", region: "johto", phase: "Clair", methods: ["grass"] },
  { id: "dark2", name: "Dark Cave (Blackthorn)", region: "johto", phase: "Clair", methods: ["cave", "surf", "fish"] },
  { id: "r47", name: "Route 47", region: "johto", phase: "Clair", methods: ["grass", "surf", "fish"] },
  { id: "r48", name: "Route 48", region: "johto", phase: "Clair", methods: ["grass"] },
  { id: "safari1", name: "Safari Zone (Wiese)", region: "johto", phase: "Clair", methods: ["grass"] },
  { id: "safari2", name: "Safari Zone (Wald)", region: "johto", phase: "Clair", methods: ["grass"] },
  { id: "safari3", name: "Safari Zone (Sumpf)", region: "johto", phase: "Clair", methods: ["grass", "surf"] },
  { id: "whirl", name: "Strudelinseln", region: "johto", phase: "Clair", methods: ["cave", "surf", "fish"] },
  { id: "lugia", name: "Strudelinseln (Lugia)", region: "johto", phase: "Clair", methods: ["static"] },
  { id: "bell", name: "Glockenturm", region: "johto", phase: "Clair", methods: ["cave"] },
  { id: "hooh", name: "Glockenturm (Ho-Oh)", region: "johto", phase: "Clair", methods: ["static"] },
  { id: "vroad", name: "Siegesstraße", region: "johto", phase: "E4", methods: ["cave", "surf", "fish"] },
  { id: "r26", name: "Route 26", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "r27", name: "Route 27", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "tohjo", name: "Tohjo-Fälle", region: "kanto", phase: "Kanto", methods: ["cave", "surf", "fish"] },
  { id: "r1", name: "Route 1", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "viridian", name: "Vertania-Wald", region: "kanto", phase: "Kanto", methods: ["grass", "headbutt"] },
  { id: "r2", name: "Route 2", region: "kanto", phase: "Kanto", methods: ["grass", "headbutt"] },
  { id: "r3", name: "Route 3", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "mtmoon", name: "Mondberg", region: "kanto", phase: "Kanto", methods: ["cave", "surf", "fish"] },
  { id: "r4", name: "Route 4", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r5", name: "Route 5", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r6", name: "Route 6", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "r7", name: "Route 7", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r8", name: "Route 8", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r9", name: "Route 9", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r10", name: "Route 10", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "rktunnel", name: "Felstunnel", region: "kanto", phase: "Kanto", methods: ["cave"] },
  { id: "power", name: "Kraftwerk", region: "kanto", phase: "Kanto", methods: ["surf", "fish"] },
  { id: "r11", name: "Route 11", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "diglett", name: "Digda-Höhle", region: "kanto", phase: "Kanto", methods: ["cave"] },
  { id: "r12", name: "Route 12", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "r13", name: "Route 13", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "r14", name: "Route 14", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r15", name: "Route 15", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r16", name: "Route 16", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r17", name: "Route 17", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r18", name: "Route 18", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r19", name: "Route 19", region: "kanto", phase: "Kanto", methods: ["surf", "fish"] },
  { id: "r20", name: "Route 20", region: "kanto", phase: "Kanto", methods: ["surf", "fish"] },
  { id: "seafoam", name: "Seeschauminseln", region: "kanto", phase: "Kanto", methods: ["cave", "surf", "fish"] },
  { id: "r21", name: "Route 21", region: "kanto", phase: "Kanto", methods: ["surf", "fish"] },
  { id: "r22", name: "Route 22", region: "kanto", phase: "Kanto", methods: ["grass"] },
  { id: "r24", name: "Route 24", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "r25", name: "Route 25", region: "kanto", phase: "Kanto", methods: ["grass", "surf", "fish"] },
  { id: "cerulean", name: "Azuria-Höhle", region: "kanto", phase: "Kanto", methods: ["cave", "surf", "fish"] },
  { id: "mtsilver1", name: "Silberberg Außen", region: "kanto", phase: "Rot", methods: ["grass", "surf"] },
  { id: "mtsilver2", name: "Silberberg Innen", region: "kanto", phase: "Rot", methods: ["cave", "surf", "fish"] },
];

const GYMS = [
  { id: "falk",    name: "Falk",    city: "Violet City",   type: "Flug",    badge: "Zephyr",   region: "johto", order: 1 },
  { id: "bianka",  name: "Bianka",  city: "Azalea Town",   type: "Käfer",   badge: "Insekt",   region: "johto", order: 2 },
  { id: "whitney", name: "Whitney", city: "Goldenrod City", type: "Normal",  badge: "Glanz",    region: "johto", order: 3 },
  { id: "jens",    name: "Jens",    city: "Ecruteak City",  type: "Geist",   badge: "Nebel",    region: "johto", order: 4 },
  { id: "chuck",   name: "Chuck",   city: "Cianwood City",  type: "Kampf",   badge: "Sturm",    region: "johto", order: 5 },
  { id: "jasmin",  name: "Jasmin",  city: "Olivine City",   type: "Stahl",   badge: "Mineral",  region: "johto", order: 6 },
  { id: "sandra",  name: "Sandra",  city: "Mahogany Town",  type: "Eis",     badge: "Gletscher",region: "johto", order: 7 },
  { id: "clair",   name: "Clair",   city: "Blackthorn City",type: "Drache",  badge: "Steig",    region: "johto", order: 8 },
  { id: "brock",   name: "Brock",   city: "Pewter City",    type: "Gestein", badge: "Fels",     region: "kanto", order: 9 },
  { id: "misty",   name: "Misty",   city: "Cerulean City",  type: "Wasser",  badge: "Quell",    region: "kanto", order: 10 },
  { id: "surge",   name: "Lt. Surge",city: "Vermilion City", type: "Elektro", badge: "Donner",   region: "kanto", order: 11 },
  { id: "erika",   name: "Erika",   city: "Celadon City",   type: "Pflanze", badge: "Regenbogen",region:"kanto", order: 12 },
  { id: "janina",  name: "Janina",  city: "Fuchsia City",   type: "Gift",    badge: "Seele",    region: "kanto", order: 13 },
  { id: "sabrina", name: "Sabrina", city: "Saffron City",   type: "Psycho",  badge: "Sumpf",    region: "kanto", order: 14 },
  { id: "pyro",    name: "Pyro",    city: "Cinnabar Island", type: "Feuer",   badge: "Vulkan",   region: "kanto", order: 15 },
  { id: "blau",    name: "Blau",    city: "Viridian City",  type: "Normal",  badge: "Erde",     region: "kanto", order: 16 },
];

const ROUTE_MAP = {};
ROUTES.forEach(r => ROUTE_MAP[r.id] = r);

const INP_STYLE = { width: "100%", background: "#080c16", border: "1px solid rgba(255,255,255,.08)", borderRadius: 8, color: "#e8ecf4", padding: "8px 12px", fontSize: 13, fontWeight: 500, outline: "none", fontFamily: "'DM Sans',sans-serif" };
const BTN_GHOST = { background: "none", border: "1px solid rgba(255,255,255,.06)", borderRadius: 6, color: "#4b5468", fontSize: 11, cursor: "pointer", padding: "4px 8px", fontFamily: "inherit" };

// ═══════════════════════════════════════════════════════════════
// API HELPERS
// ═══════════════════════════════════════════════════════════════

async function apiGet() {
  const r = await fetch(`${API}/data`);
  if (!r.ok) return null;
  return r.json();
}

async function apiPatch(patch) {
  const r = await fetch(`${API}/data`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(patch) });
  return r.json();
}

async function apiPut(data) {
  const r = await fetch(`${API}/data`, { method: 'PUT', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(data) });
  return r.json();
}

async function apiUndo() {
  const r = await fetch(`${API}/undo`, { method: 'POST' });
  if (!r.ok) return null;
  return r.json();
}

async function apiUndoInfo() {
  const r = await fetch(`${API}/undo`);
  return r.json();
}

// ═══════════════════════════════════════════════════════════════
// UTILITY COMPONENTS
// ═══════════════════════════════════════════════════════════════

function Pokeball({ size = 40, color = "#dc2626" }) {
  return (
    <svg width={size} height={size} viewBox="0 0 100 100">
      <circle cx="50" cy="50" r="48" fill="none" stroke={color} strokeWidth="3" opacity=".3" />
      <path d="M2,50 L98,50" stroke={color} strokeWidth="3" opacity=".3" />
      <circle cx="50" cy="50" r="12" fill="none" stroke={color} strokeWidth="3" opacity=".3" />
      <circle cx="50" cy="50" r="6" fill={color} opacity=".15" />
    </svg>
  );
}

function TypeBadge({ type, size = "sm" }) {
  const c = T_COL[type];
  if (!c) return null;
  const s = size === "lg" ? { fontSize: 10, padding: "2px 8px" } : { fontSize: 8, padding: "1px 6px" };
  return (
    <span style={{ display: "inline-block", fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", borderRadius: 3, background: c + "1a", color: c, border: "1px solid " + c + "30", lineHeight: "14px", ...s }}>
      {type}
    </span>
  );
}

function Sprite({ id, size = 48, dead = false }) {
  const [ok, setOk] = useState(true);
  useEffect(() => { setOk(true); }, [id]);
  if (!id || !ok) {
    return (
      <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", opacity: .1 }}>
        <Pokeball size={size * .5} color="#fff" />
      </div>
    );
  }
  return (
    <img src={SPR(id)} alt="" onError={() => setOk(false)}
      style={{ width: size, height: size, objectFit: "contain", imageRendering: "pixelated", filter: dead ? "grayscale(1) brightness(.3)" : "drop-shadow(0 2px 6px rgba(0,0,0,.5))", transition: "filter .3s" }} />
  );
}

function MethodTag({ method }) {
  const m = M_CFG[method];
  if (!m) return null;
  return (
    <span style={{ fontSize: 9, fontWeight: 700, padding: "2px 6px", borderRadius: 4, background: m.c + "15", color: m.c, border: "1px solid " + m.c + "25", display: "inline-flex", alignItems: "center", gap: 3 }}>
      {m.icon} {m.label}
    </span>
  );
}

function Toast({ message, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 2500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{ position: "fixed", bottom: 24, left: "50%", transform: "translateX(-50%)", background: "#22c55e", color: "#000", padding: "8px 20px", borderRadius: 8, fontSize: 13, fontWeight: 700, zIndex: 999, boxShadow: "0 8px 32px rgba(0,0,0,.5)", fontFamily: "'DM Sans',sans-serif" }}>
      {message}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// POKE INPUT (Autocomplete with PokeAPI)
// ═══════════════════════════════════════════════════════════════

function PokeInput({ value, onChange, onSelect, placeholder, dex, cache }) {
  const [q, setQ] = useState(value || "");
  const [hits, setHits] = useState([]);
  const [open, setOpen] = useState(false);

  useEffect(() => { setQ(value || ""); }, [value]);

  const doSearch = async (text) => {
    setQ(text);
    onChange(text);
    if (!text || text.length < 2 || !dex.length) { setHits([]); return; }
    const low = text.toLowerCase();
    let matches = dex.filter((p) => {
      if (p.name.includes(low)) return true;
      if (p.display && p.display.toLowerCase().includes(low)) return true;
      const cached = cache.current[p.id];
      if (cached && cached.de && cached.de.includes(low)) return true;
      return false;
    }).slice(0, 8);
    setHits(matches);
    // Enrich with PokeAPI data
    const enriched = await Promise.all(matches.map(async (m) => {
      if (cache.current[m.id]) return cache.current[m.id];
      try {
        const [sR, pR] = await Promise.all([
          fetch("https://pokeapi.co/api/v2/pokemon-species/" + m.id),
          fetch("https://pokeapi.co/api/v2/pokemon/" + m.id),
        ]);
        if (!sR.ok || !pR.ok) return m;
        const [s, p] = await Promise.all([sR.json(), pR.json()]);
        const de = (s.names || []).find((n) => n.language.name === "de");
        const deName = de ? de.name : "";
        const types = p.types.map((t) => T_EN[t.type.name]).filter(Boolean);
        const result = { ...m, de: deName.toLowerCase(), display: deName || m.display, types };
        cache.current[m.id] = result;
        return result;
      } catch { return m; }
    }));
    setHits(enriched);
  };

  const pick = (p) => { setQ(p.display); setHits([]); setOpen(false); onSelect(p); };

  return (
    <div style={{ position: "relative" }}>
      <input style={INP_STYLE} placeholder={placeholder} value={q}
        onChange={(e) => doSearch(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => { setOpen(false); setHits([]); }, 200)} />
      {open && hits.length > 0 && (
        <div style={{ position: "absolute", top: "100%", left: 0, right: 0, zIndex: 99, marginTop: 4, background: "#0d1220", border: "1px solid rgba(255,255,255,.12)", borderRadius: 10, overflow: "hidden", boxShadow: "0 16px 48px rgba(0,0,0,.7)", maxHeight: 280, overflowY: "auto" }}>
          {hits.map((p) => (
            <div key={p.id} onMouseDown={() => pick(p)}
              style={{ display: "flex", alignItems: "center", gap: 8, padding: "6px 10px", cursor: "pointer", borderBottom: "1px solid rgba(255,255,255,.04)" }}>
              <img src={SPR(p.id)} alt="" style={{ width: 32, height: 32, imageRendering: "pixelated", objectFit: "contain" }} onError={(e) => { e.target.style.visibility = "hidden"; }} />
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: 12, fontWeight: 600 }}>{p.display}</div>
                {p.de && p.de !== p.name && <div style={{ fontSize: 9, color: "#4b5468" }}>EN: {p.name}</div>}
              </div>
              <div style={{ display: "flex", gap: 2 }}>
                {(p.types || []).map((t) => (<TypeBadge key={t} type={t} />))}
              </div>
              <span style={{ fontSize: 9, color: "#2d3548", fontWeight: 600, fontFamily: "monospace" }}>{"#" + String(p.id).padStart(3, "0")}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// ENCOUNTER FORM
// ═══════════════════════════════════════════════════════════════

function EncounterForm({ method, routeId, existing, dex, cache, p1N, p2N, onSave, onCancel, onMiss, isEditing }) {
  const [p1, setP1] = useState(existing ? existing.p1 : "");
  const [p1Nick, setP1Nick] = useState(existing ? existing.p1Nick : "");
  const [p1Id, setP1Id] = useState(existing ? existing.p1Id : null);
  const [p1Types, setP1Types] = useState(existing ? (existing.p1Types || []) : []);
  const [p1Level, setP1Level] = useState(existing ? (existing.p1Level || "") : "");
  const [p2, setP2] = useState(existing ? existing.p2 : "");
  const [p2Nick, setP2Nick] = useState(existing ? existing.p2Nick : "");
  const [p2Id, setP2Id] = useState(existing ? existing.p2Id : null);
  const [p2Types, setP2Types] = useState(existing ? (existing.p2Types || []) : []);
  const [p2Level, setP2Level] = useState(existing ? (existing.p2Level || "") : "");
  const [open, setOpen] = useState(!!isEditing);

  const doSave = () => {
    if (!p1 || !p2) return;
    onSave({
      p1, p1Nick: p1Nick || p1, p1Id, p1Types, p1Level: p1Level ? parseInt(p1Level) : null,
      p2, p2Nick: p2Nick || p2, p2Id, p2Types, p2Level: p2Level ? parseInt(p2Level) : null,
      status: existing ? existing.status : STATUS.TEAM,
      ts: new Date().toLocaleDateString("de-DE"),
      deathInfo: existing?.deathInfo || null,
    });
    setOpen(false);
  };

  if (!open && !isEditing) {
    return (
      <div style={{ marginBottom: 8, padding: "10px 12px", background: "rgba(255,255,255,.015)", borderRadius: 10, border: "1px dashed rgba(255,255,255,.06)", display: "flex", alignItems: "center", gap: 8 }}>
        <MethodTag method={method} />
        <span onClick={() => setOpen(true)} style={{ flex: 1, fontSize: 12, color: "#3b4560", cursor: "pointer" }}>Encounter eintragen…</span>
        <button onClick={(e) => { e.stopPropagation(); if (confirm("Route als verpasst markieren?")) onMiss(); }}
          style={{ ...BTN_GHOST, fontSize: 10, color: "#6b7280", padding: "3px 8px" }}>💨 Verpasst</button>
      </div>
    );
  }

  const levelInput = (val, set) => (
    <input style={{ ...INP_STYLE, width: 52, textAlign: "center", padding: "8px 4px" }} placeholder="Lv" type="number" min="1" max="100"
      value={val} onChange={(e) => set(e.target.value)} />
  );

  return (
    <div style={{ marginBottom: 8, padding: 12, background: "rgba(255,255,255,.025)", borderRadius: 10, border: "1px solid rgba(255,255,255,.08)" }}>
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 10 }}>
        <MethodTag method={method} />
        <button onClick={() => { setOpen(false); if (isEditing) onCancel(); }} style={{ background: "none", border: "none", color: "#4b5468", fontSize: 12, cursor: "pointer", fontFamily: "inherit" }}>✕</button>
      </div>
      {/* Player 1 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: "#ef4444", letterSpacing: 1 }}>{p1N}</span>
        {p1Id && <Sprite id={p1Id} size={28} />}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 3 }}>
          <PokeInput value={p1} onChange={(v) => { setP1(v); setP1Id(null); setP1Types([]); }} onSelect={(p) => { setP1(p.display); setP1Id(p.id); setP1Types(p.types || []); }} placeholder="Pokémon…" dex={dex} cache={cache} />
        </div>
        <div style={{ flex: 2 }}>
          <input style={INP_STYLE} placeholder="Nickname" value={p1Nick} onChange={(e) => setP1Nick(e.target.value)} />
        </div>
        {levelInput(p1Level, setP1Level)}
      </div>
      {p1Types.length > 0 && <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>{p1Types.map((t) => (<TypeBadge key={t} type={t} />))}</div>}
      {/* Player 2 */}
      <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
        <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
        <span style={{ fontSize: 10, fontWeight: 800, color: "#3b82f6", letterSpacing: 1 }}>{p2N}</span>
        {p2Id && <Sprite id={p2Id} size={28} />}
      </div>
      <div style={{ display: "flex", gap: 6, marginBottom: 8 }}>
        <div style={{ flex: 3 }}>
          <PokeInput value={p2} onChange={(v) => { setP2(v); setP2Id(null); setP2Types([]); }} onSelect={(p) => { setP2(p.display); setP2Id(p.id); setP2Types(p.types || []); }} placeholder="Pokémon…" dex={dex} cache={cache} />
        </div>
        <div style={{ flex: 2 }}>
          <input style={INP_STYLE} placeholder="Nickname" value={p2Nick} onChange={(e) => setP2Nick(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") doSave(); }} />
        </div>
        {levelInput(p2Level, setP2Level)}
      </div>
      {p2Types.length > 0 && <div style={{ display: "flex", gap: 3, marginBottom: 8 }}>{p2Types.map((t) => (<TypeBadge key={t} type={t} />))}</div>}
      <button onClick={doSave} disabled={!p1 || !p2} style={{ width: "100%", padding: 10, background: "linear-gradient(135deg,rgba(220,38,38,.12),rgba(37,99,235,.08))", border: "1px solid rgba(220,38,38,.2)", borderRadius: 8, color: "#e8ecf4", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", opacity: (!p1 || !p2) ? .3 : 1, display: "flex", alignItems: "center", justifyContent: "center", gap: 6 }}>
        <Pokeball size={14} color="#fff" />
        {isEditing ? "Speichern" : "Encounter verlinken"}
      </button>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// DEATH DIALOG
// ═══════════════════════════════════════════════════════════════

function DeathDialog({ encounter, encKey, onConfirm, onCancel }) {
  const [cause, setCause] = useState("");
  const [killer, setKiller] = useState("");
  return (
    <div style={{ position: "fixed", inset: 0, background: "rgba(0,0,0,.7)", zIndex: 100, display: "flex", alignItems: "center", justifyContent: "center", padding: 16 }}>
      <div style={{ background: "#0d1220", border: "1px solid rgba(239,68,68,.3)", borderRadius: 16, padding: 24, maxWidth: 400, width: "100%" }}>
        <div style={{ fontSize: 28, textAlign: "center", marginBottom: 8 }}>💀</div>
        <div style={{ fontSize: 16, fontWeight: 800, textAlign: "center", color: "#ef4444", marginBottom: 4 }}>R.I.P.</div>
        <div style={{ fontSize: 13, textAlign: "center", color: "#8b95a8", marginBottom: 16 }}>
          {encounter.p1Nick} & {encounter.p2Nick}
        </div>
        <div style={{ marginBottom: 8 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#4b5468", letterSpacing: 1, display: "block", marginBottom: 4 }}>TODESURSACHE</label>
          <input style={INP_STYLE} placeholder="z.B. Krit von Miltank" value={cause} onChange={(e) => setCause(e.target.value)} />
        </div>
        <div style={{ marginBottom: 16 }}>
          <label style={{ fontSize: 10, fontWeight: 700, color: "#4b5468", letterSpacing: 1, display: "block", marginBottom: 4 }}>GETÖTET VON</label>
          <input style={INP_STYLE} placeholder="z.B. Whitney's Miltank" value={killer} onChange={(e) => setKiller(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") onConfirm({ cause, killer }); }} />
        </div>
        <div style={{ display: "flex", gap: 8 }}>
          <button onClick={onCancel} style={{ ...BTN_GHOST, flex: 1, padding: 10 }}>Abbrechen</button>
          <button onClick={() => onConfirm({ cause, killer })} style={{ flex: 1, padding: 10, background: "rgba(239,68,68,.15)", border: "1px solid rgba(239,68,68,.3)", borderRadius: 6, color: "#ef4444", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
            💀 Tod bestätigen
          </button>
        </div>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// TYPE COVERAGE ANALYSIS
// ═══════════════════════════════════════════════════════════════

function getDefWeaknesses(types) {
  // returns { type: multiplier } for defending types
  const result = {};
  ALL_TYPES.forEach(atkType => {
    let mult = 1;
    types.forEach(defType => {
      const chart = TYPE_CHART[atkType];
      if (chart && chart[defType] !== undefined) mult *= chart[defType];
    });
    if (mult !== 1) result[atkType] = mult;
  });
  return result;
}

function CoverageAnalysis({ teamEncounters }) {
  // Gather all unique types from both players' team pokemon
  const allTypes = new Set();
  const weakTo = {};
  const resistTo = {};

  teamEncounters.forEach(enc => {
    const allPTypes = [...(enc.p1Types || []), ...(enc.p2Types || [])];
    allPTypes.forEach(t => allTypes.add(t));

    // Check each pokemon pair's weaknesses
    [enc.p1Types || [], enc.p2Types || []].forEach(types => {
      if (types.length === 0) return;
      const eff = getDefWeaknesses(types);
      Object.entries(eff).forEach(([t, m]) => {
        if (m >= 2) weakTo[t] = (weakTo[t] || 0) + 1;
        if (m < 1 && m > 0) resistTo[t] = (resistTo[t] || 0) + 1;
        if (m === 0) resistTo[t] = (resistTo[t] || 0) + 2;
      });
    });
  });

  const uncovered = ALL_TYPES.filter(t => !allTypes.has(t));
  const dangerTypes = Object.entries(weakTo).filter(([t, c]) => c >= 2 && !resistTo[t]).sort((a, b) => b[1] - a[1]);

  return (
    <div style={{ marginTop: 16, padding: 12, background: "rgba(255,255,255,.02)", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)" }}>
      <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#4b5468", marginBottom: 8 }}>TYP-COVERAGE</div>
      <div style={{ display: "flex", flexWrap: "wrap", gap: 3, marginBottom: 8 }}>
        {ALL_TYPES.map(t => (
          <span key={t} style={{ fontSize: 8, fontWeight: 700, padding: "2px 5px", borderRadius: 3, background: allTypes.has(t) ? T_COL[t] + "25" : "#0b1018", color: allTypes.has(t) ? T_COL[t] : "#2d3548", border: "1px solid " + (allTypes.has(t) ? T_COL[t] + "40" : "rgba(255,255,255,.03)") }}>
            {t}
          </span>
        ))}
      </div>
      {dangerTypes.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#ef4444", marginBottom: 4 }}>⚠️ GEFÄHRLICHE SCHWÄCHEN ({dangerTypes.length}x ungedeckt)</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {dangerTypes.map(([t]) => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
      )}
      {uncovered.length > 0 && (
        <div style={{ marginTop: 6 }}>
          <div style={{ fontSize: 9, fontWeight: 700, color: "#f59e0b", marginBottom: 4 }}>FEHLENDE TYPEN IM TEAM</div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 3 }}>
            {uncovered.map(t => <TypeBadge key={t} type={t} />)}
          </div>
        </div>
      )}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function SoulLinkTracker() {
  const [data, setData] = useState({ encounters: {}, p1N: "Spieler 1", p2N: "Spieler 2", badges: {}, version: 0 });
  const [loaded, setLoaded] = useState(false);
  const [tab, setTab] = useState("routes");
  const [editNames, setEditNames] = useState(false);
  const [dex, setDex] = useState([]);
  const [expandedRoute, setExpandedRoute] = useState(null);
  const [editSlot, setEditSlot] = useState(null);
  const [regionFilter, setRegionFilter] = useState("johto");
  const [routeFilter, setRouteFilter] = useState("all");
  const [dexSearch, setDexSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [deathPending, setDeathPending] = useState(null);
  const [undoAvailable, setUndoAvailable] = useState(0);
  const cache = useRef({});
  const versionRef = useRef(0);

  // Load PokeAPI dex
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("https://pokeapi.co/api/v2/pokemon?limit=493");
        const d = await r.json();
        setDex(d.results.map((p, i) => {
          const id = i + 1;
          const deName = DE_NAMES[id] || "";
          return { id, name: p.name, display: deName || (p.name.charAt(0).toUpperCase() + p.name.slice(1)), de: deName.toLowerCase(), types: [] };
        }));
      } catch (e) {
        // Fallback: build dex from static DE_NAMES alone (offline)
        console.warn("PokeAPI unavailable, using static dex", e);
        setDex(Object.entries(DE_NAMES).map(([id, name]) => ({
          id: parseInt(id), name: name.toLowerCase(), display: name, de: name.toLowerCase(), types: []
        })));
      }
    })();
  }, []);

  // Polling for data sync
  useEffect(() => {
    let active = true;
    const poll = async () => {
      try {
        const d = await apiGet();
        if (!active) return;
        if (d) {
          const serverVersion = d.version || 0;
          if (serverVersion > versionRef.current || !loaded) {
            setData(d);
            versionRef.current = serverVersion;
          }
          if (!loaded) setLoaded(true);
        } else if (!loaded) {
          setLoaded(true);
        }
      } catch (e) {
        console.warn("Poll fail", e);
        if (!loaded) setLoaded(true);
      }
    };
    poll();
    const i = setInterval(poll, 3000);
    return () => { active = false; clearInterval(i); };
  }, [loaded]);

  // Check undo availability
  useEffect(() => {
    const check = async () => {
      try {
        const info = await apiUndoInfo();
        setUndoAvailable(info.available || 0);
      } catch {}
    };
    check();
    const i = setInterval(check, 10000);
    return () => clearInterval(i);
  }, []);

  const save = useCallback(async (patch) => {
    const merged = { ...data, ...patch };
    if (patch.encounters) merged.encounters = { ...data.encounters, ...patch.encounters };
    setData(merged);
    try {
      const updated = await apiPatch(patch);
      versionRef.current = updated.version || 0;
      setData(updated);
    } catch (e) { console.warn("Save fail", e); }
  }, [data]);

  const doUndo = useCallback(async () => {
    try {
      const restored = await apiUndo();
      if (restored) {
        setData(restored);
        versionRef.current = restored.version || 0;
        setToast("⏪ Rückgängig gemacht!");
        setUndoAvailable(prev => Math.max(0, prev - 1));
      }
    } catch (e) { console.warn("Undo fail", e); }
  }, []);

  const enc = data.encounters || {};
  const badges = data.badges || {};
  const getEnc = (routeId, method) => enc[routeId + "__" + method];

  const setEnc = (routeId, method, val) => {
    save({ encounters: { [routeId + "__" + method]: val } });
  };

  const delEnc = (routeId, method) => {
    const key = routeId + "__" + method;
    const newEnc = { ...enc };
    delete newEnc[key];
    // Full replace since we're deleting
    apiPut({ ...data, encounters: newEnc }).then(updated => {
      setData(updated);
      versionRef.current = updated.version || 0;
    });
  };

  const markDead = (routeId, method, deathInfo) => {
    const existing = getEnc(routeId, method);
    if (!existing) return;
    const route = ROUTE_MAP[routeId];
    setEnc(routeId, method, {
      ...existing,
      status: STATUS.DEAD,
      deathInfo: {
        ...deathInfo,
        route: route?.name || routeId,
        date: new Date().toLocaleDateString("de-DE"),
      }
    });
    setToast(`💀 ${existing.p1Nick} & ${existing.p2Nick} – R.I.P.`);
  };

  const toggleBadge = (gymId) => {
    const current = badges[gymId];
    save({ badges: { ...badges, [gymId]: current ? null : { earned: true, date: new Date().toLocaleDateString("de-DE") } } });
  };

  // Derived data
  const allEnc = Object.values(enc);
  const stats = {
    team: allEnc.filter(e => e.status === STATUS.TEAM).length,
    box: allEnc.filter(e => e.status === STATUS.BOX).length,
    dead: allEnc.filter(e => e.status === STATUS.DEAD).length,
    missed: allEnc.filter(e => e.status === STATUS.MISSED).length,
    total: allEnc.length,
  };

  const teamEnc = allEnc.filter(e => e.status === STATUS.TEAM);
  const deadEnc = allEnc.filter(e => e.status === STATUS.DEAD);
  const missedEnc = allEnc.filter(e => e.status === STATUS.MISSED);

  const caughtIds = useMemo(() => {
    const s = new Set();
    allEnc.forEach(e => { if (e.p1Id) s.add(e.p1Id); if (e.p2Id) s.add(e.p2Id); });
    return s;
  }, [allEnc.length]);

  const filteredRoutes = ROUTES.filter(rt => {
    if (rt.region !== regionFilter) return false;
    if (routeFilter === "empty") return !rt.methods.some(m => getEnc(rt.id, m));
    if (routeFilter === "filled") return rt.methods.some(m => getEnc(rt.id, m));
    if (routeFilter === "dead") return rt.methods.some(m => { const e = getEnc(rt.id, m); return e && e.status === STATUS.DEAD; });
    if (routeFilter === "missed") return rt.methods.some(m => { const e = getEnc(rt.id, m); return e && e.status === STATUS.MISSED; });
    return true;
  });

  // Stats calculations
  const deathsByRoute = useMemo(() => {
    const map = {};
    Object.entries(enc).forEach(([key, e]) => {
      if (e.status !== STATUS.DEAD) return;
      const routeId = key.split("__")[0];
      const route = ROUTE_MAP[routeId];
      const name = route?.name || routeId;
      map[name] = (map[name] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [enc]);

  const deathsByPhase = useMemo(() => {
    const map = {};
    Object.entries(enc).forEach(([key, e]) => {
      if (e.status !== STATUS.DEAD) return;
      const routeId = key.split("__")[0];
      const route = ROUTE_MAP[routeId];
      const phase = route?.phase || "?";
      map[phase] = (map[phase] || 0) + 1;
    });
    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [enc]);

  if (!loaded) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh", background: "#060810", flexDirection: "column", gap: 16 }}>
        <Pokeball size={56} />
        <div style={{ fontSize: 11, color: "#3b4560", letterSpacing: 3, fontWeight: 700 }}>VERBINDE...</div>
      </div>
    );
  }

  const TABS = [
    { k: "routes", l: "📍 Routen" },
    { k: "team", l: "⚔️ Team" },
    { k: "graveyard", l: "🪦 Friedhof" },
    { k: "badges", l: "🏅 Badges" },
    { k: "dex", l: "📖 Pokédex" },
    { k: "stats", l: "📊 Stats" },
  ];

  return (
    <div style={{ fontFamily: "'DM Sans',sans-serif", background: "#060810", color: "#e8ecf4", minHeight: "100vh" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Bebas+Neue&family=DM+Sans:wght@400;500;600;700;800&display=swap');
        *{box-sizing:border-box;margin:0;padding:0}
        input:focus{border-color:rgba(220,38,38,.45)!important}
        ::placeholder{color:#2d3548}
        ::-webkit-scrollbar{width:4px}::-webkit-scrollbar-track{background:transparent}::-webkit-scrollbar-thumb{background:#1a2030;border-radius:4px}
        @keyframes pulse{0%,100%{opacity:.4}50%{opacity:1}}
        input[type=number]::-webkit-inner-spin-button,input[type=number]::-webkit-outer-spin-button{-webkit-appearance:none;margin:0}
        input[type=number]{-moz-appearance:textfield}
      `}</style>

      {toast && <Toast message={toast} onDone={() => setToast(null)} />}
      {deathPending && (
        <DeathDialog
          encounter={getEnc(deathPending.routeId, deathPending.method)}
          encKey={deathPending.routeId + "__" + deathPending.method}
          onConfirm={(info) => { markDead(deathPending.routeId, deathPending.method, info); setDeathPending(null); }}
          onCancel={() => setDeathPending(null)}
        />
      )}

      {/* HEADER */}
      <div style={{ position: "relative", textAlign: "center", padding: "36px 24px 20px", overflow: "hidden", borderBottom: "1px solid rgba(255,255,255,.04)", background: "linear-gradient(180deg,rgba(220,38,38,.04) 0%,transparent 100%)" }}>
        <div style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%)", pointerEvents: "none", opacity: .03 }}>
          <Pokeball size={280} color="#fff" />
        </div>
        <div style={{ position: "relative", zIndex: 1 }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: 8, fontSize: 10, fontWeight: 700, letterSpacing: 3, textTransform: "uppercase", color: "#dc2626", marginBottom: 6 }}>
            <span style={{ width: 6, height: 6, borderRadius: "50%", background: "#dc2626", animation: "pulse 2s ease infinite", display: "inline-block" }} />
            SoulSilver Randomized
            <span style={{ color: "#22c55e", fontSize: 9 }}>
              · <span style={{ width: 5, height: 5, borderRadius: "50%", background: "#22c55e", animation: "pulse 1.5s ease infinite", display: "inline-block" }} /> LIVE
            </span>
          </div>
          <h1 style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 48, letterSpacing: 6, lineHeight: .9, background: "linear-gradient(135deg,#fff 15%,#dc2626 50%,#2563eb 85%)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>
            SOUL LINK
          </h1>
          <div style={{ fontFamily: "'Bebas Neue',sans-serif", fontSize: 14, letterSpacing: 10, color: "#4b5468", marginBottom: 12 }}>T R A C K E R</div>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8 }}>
            {!editNames ? (
              <div onClick={() => setEditNames(true)} style={{ display: "inline-flex", alignItems: "center", gap: 10, cursor: "pointer", padding: "6px 18px", borderRadius: 10, border: "1px solid rgba(255,255,255,.06)", background: "rgba(255,255,255,.02)" }}>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#ef4444", display: "inline-block" }} />
                <span style={{ color: "#ef4444", fontWeight: 700, fontSize: 13 }}>{data.p1N}</span>
                <Pokeball size={18} color="#4b5468" />
                <span style={{ color: "#3b82f6", fontWeight: 700, fontSize: 13 }}>{data.p2N}</span>
                <span style={{ width: 7, height: 7, borderRadius: "50%", background: "#3b82f6", display: "inline-block" }} />
                <span style={{ fontSize: 9, opacity: .2 }}>✏️</span>
              </div>
            ) : (
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                <input style={{ background: "#0b1018", border: "1px solid rgba(220,38,38,.3)", borderRadius: 8, color: "#ef4444", padding: "6px 12px", fontSize: 13, fontWeight: 700, width: 120, outline: "none", fontFamily: "inherit", textAlign: "center" }} value={data.p1N} onChange={(e) => setData({ ...data, p1N: e.target.value })} />
                <span style={{ color: "#2d3548", fontSize: 11, fontWeight: 800 }}>VS</span>
                <input style={{ background: "#0b1018", border: "1px solid rgba(37,99,235,.3)", borderRadius: 8, color: "#3b82f6", padding: "6px 12px", fontSize: 13, fontWeight: 700, width: 120, outline: "none", fontFamily: "inherit", textAlign: "center" }} value={data.p2N} onChange={(e) => setData({ ...data, p2N: e.target.value })} />
                <button onClick={() => { setEditNames(false); save({ p1N: data.p1N, p2N: data.p2N }); }} style={{ background: "rgba(22,163,74,.15)", border: "1px solid rgba(22,163,74,.35)", color: "#22c55e", borderRadius: 8, padding: "6px 12px", cursor: "pointer", fontWeight: 800, fontSize: 14, fontFamily: "inherit" }}>✓</button>
              </div>
            )}
            {/* Undo Button */}
            {undoAvailable > 0 && (
              <button onClick={doUndo} title={`${undoAvailable} Schritte rückgängig machbar`}
                style={{ ...BTN_GHOST, display: "flex", alignItems: "center", gap: 4, padding: "6px 10px" }}>
                ⏪ <span style={{ fontSize: 10 }}>Undo</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* STATS BAR */}
      <div style={{ padding: "12px 16px 0", maxWidth: 720, margin: "0 auto" }}>
        <div style={{ display: "flex", gap: 6 }}>
          {[{ k: "team", l: "Team", i: "⚔️", c: "#22c55e" }, { k: "box", l: "Box", i: "📦", c: "#f59e0b" }, { k: "dead", l: "Friedhof", i: "🪦", c: "#ef4444" }, { k: "missed", l: "Verpasst", i: "💨", c: "#6b7280" }, { k: "total", l: "Gesamt", i: "🔗", c: "#8b95a8" }].map(s => (
            <div key={s.k} style={{ flex: 1, background: "#0b1018", border: "1px solid rgba(255,255,255,.05)", borderRadius: 10, padding: "8px 4px 6px", textAlign: "center" }}>
              <div style={{ fontSize: 14 }}>{s.i}</div>
              <div style={{ fontSize: 22, fontWeight: 800, color: s.c, lineHeight: 1, fontFamily: "'Bebas Neue',sans-serif" }}>{stats[s.k]}</div>
              <div style={{ fontSize: 7, fontWeight: 700, letterSpacing: 1.5, color: "#4b5468", textTransform: "uppercase" }}>{s.l}</div>
            </div>
          ))}
        </div>
      </div>

      {/* TABS */}
      <div style={{ display: "flex", gap: 3, padding: "10px 16px 0", maxWidth: 720, margin: "0 auto", overflowX: "auto" }}>
        {TABS.map(t => (
          <button key={t.k} onClick={() => setTab(t.k)} style={{ padding: "8px 12px", background: tab === t.k ? "rgba(220,38,38,.08)" : "rgba(255,255,255,.02)", border: "1px solid " + (tab === t.k ? "rgba(220,38,38,.2)" : "rgba(255,255,255,.04)"), borderRadius: 8, color: tab === t.k ? "#ef4444" : "#4b5468", fontSize: 11, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", whiteSpace: "nowrap" }}>
            {t.l}
          </button>
        ))}
      </div>

      {/* ════════════════════════════════════════════════════════ */}
      {/* ROUTES TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "routes" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          <div style={{ display: "flex", gap: 4, marginBottom: 8, flexWrap: "wrap" }}>
            {[{ k: "johto", l: "🏯 Johto" }, { k: "kanto", l: "🗼 Kanto" }].map(r => (
              <button key={r.k} onClick={() => setRegionFilter(r.k)} style={{ padding: "6px 14px", background: regionFilter === r.k ? "rgba(220,38,38,.1)" : "transparent", border: "1px solid " + (regionFilter === r.k ? "rgba(220,38,38,.25)" : "rgba(255,255,255,.06)"), borderRadius: 8, color: regionFilter === r.k ? "#ef4444" : "#4b5468", fontSize: 12, fontWeight: 700, cursor: "pointer", fontFamily: "inherit" }}>
                {r.l}
              </button>
            ))}
            <div style={{ flex: 1 }} />
            {[{ k: "all", l: "Alle" }, { k: "empty", l: "Offen" }, { k: "filled", l: "Gefangen" }, { k: "dead", l: "💀" }, { k: "missed", l: "💨" }].map(f => (
              <button key={f.k} onClick={() => setRouteFilter(f.k)} style={{ padding: "5px 10px", background: routeFilter === f.k ? "rgba(255,255,255,.05)" : "transparent", border: "1px solid " + (routeFilter === f.k ? "rgba(255,255,255,.12)" : "rgba(255,255,255,.05)"), borderRadius: 6, color: routeFilter === f.k ? "#e8ecf4" : "#3b4560", fontSize: 11, fontWeight: 600, cursor: "pointer", fontFamily: "inherit" }}>
                {f.l}
              </button>
            ))}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
            {filteredRoutes.map(route => {
              const isOpen = expandedRoute === route.id;
              const filledMethods = route.methods.filter(m => getEnc(route.id, m));
              const hasDead = filledMethods.some(m => { const e = getEnc(route.id, m); return e && e.status === STATUS.DEAD; });
              const allFilled = filledMethods.length === route.methods.length;
              const borderCol = hasDead ? "rgba(239,68,68,.15)" : allFilled ? "rgba(22,163,74,.15)" : "rgba(255,255,255,.05)";

              return (
                <div key={route.id} style={{ background: "#0b1018", border: "1px solid " + borderCol, borderRadius: 12, overflow: "hidden" }}>
                  <div onClick={() => setExpandedRoute(isOpen ? null : route.id)} style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 16px", cursor: "pointer" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 0, flexShrink: 0, width: 50, justifyContent: "center" }}>
                      {filledMethods.length > 0 ? (
                        filledMethods.slice(0, 2).map(m => {
                          const e = getEnc(route.id, m);
                          return e && e.p1Id ? (<Sprite key={m} id={e.p1Id} size={24} dead={e.status === STATUS.DEAD} />) : null;
                        })
                      ) : (
                        <div style={{ opacity: .06 }}><Pokeball size={20} color="#fff" /></div>
                      )}
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ fontSize: 14, fontWeight: 700 }}>{route.name}</div>
                      <div style={{ display: "flex", gap: 3, marginTop: 3, flexWrap: "wrap" }}>
                        {route.methods.map(m => {
                          const e = getEnc(route.id, m);
                          const mc = M_CFG[m];
                          const col = e ? (S_CFG[e.status] || S_CFG.team).c : mc.c;
                          return (
                            <span key={m} style={{ fontSize: 8, fontWeight: 700, padding: "1px 5px", borderRadius: 3, background: (e ? col : mc.c) + (e ? "18" : "10"), color: e ? col : mc.c + "60", border: e ? "1px solid " + col + "30" : "1px solid transparent" }}>
                              {mc.icon} {mc.label}
                            </span>
                          );
                        })}
                      </div>
                    </div>
                    <div style={{ fontSize: 10, color: "#3b4560", fontWeight: 600, textAlign: "right" }}>
                      <div>{filledMethods.length}/{route.methods.length}</div>
                      <div style={{ fontSize: 9, color: "#2d3548" }}>{route.phase}</div>
                    </div>
                    <div style={{ color: "#3b4560", fontSize: 12, transition: "transform .2s", transform: isOpen ? "rotate(180deg)" : "rotate(0)" }}>▼</div>
                  </div>

                  {isOpen && (
                    <div style={{ borderTop: "1px solid rgba(255,255,255,.04)", padding: "12px 16px" }}>
                      {route.methods.map(method => {
                        const existing = getEnc(route.id, method);
                        const isEd = editSlot && editSlot.routeId === route.id && editSlot.method === method;

                        if (existing && !isEd) {
                          const cfg = S_CFG[existing.status] || S_CFG.team;
                          const isDead = existing.status === STATUS.DEAD;
                          const isMissed = existing.status === STATUS.MISSED;

                          if (isMissed) {
                            return (
                              <div key={method} style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(107,114,128,.05)", borderRadius: 10, border: "1px solid rgba(107,114,128,.15)" }}>
                                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                                  <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                    <MethodTag method={method} />
                                    <span style={{ fontSize: 11, color: "#6b7280", fontWeight: 700 }}>💨 Verpasst</span>
                                    {existing.ts && <span style={{ fontSize: 9, color: "#3b4560" }}>{existing.ts}</span>}
                                  </div>
                                  <div style={{ display: "flex", gap: 4 }}>
                                    <button onClick={() => setEditSlot({ routeId: route.id, method })} style={{ ...BTN_GHOST, padding: "2px 6px" }}>✏️</button>
                                    <button onClick={() => { if (confirm("Encounter löschen?")) delEnc(route.id, method); }} style={{ ...BTN_GHOST, padding: "2px 6px" }}>🗑</button>
                                  </div>
                                </div>
                              </div>
                            );
                          }
                          return (
                            <div key={method} style={{ marginBottom: 10, padding: "10px 12px", background: "rgba(255,255,255,.02)", borderRadius: 10, border: "1px solid " + cfg.c + "20" }}>
                              <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
                                <MethodTag method={method} />
                                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                                  <span style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, textTransform: "uppercase", padding: "2px 8px", borderRadius: 5, background: cfg.bg, color: cfg.c, border: "1px solid " + cfg.bd }}>{cfg.icon} {cfg.label}</span>
                                  <button onClick={() => setEditSlot({ routeId: route.id, method })} style={{ ...BTN_GHOST, padding: "2px 6px" }}>✏️</button>
                                </div>
                              </div>
                              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                                  <Sprite id={existing.p1Id} size={44} dead={isDead} />
                                  <div>
                                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#ef4444", textTransform: "uppercase" }}>{data.p1N}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, opacity: isDead ? .5 : 1 }}>
                                      {existing.p1Nick || existing.p1}
                                      {existing.p1Level && <span style={{ fontSize: 10, color: "#4b5468", marginLeft: 4 }}>Lv.{existing.p1Level}</span>}
                                    </div>
                                    {existing.p1Types?.length > 0 && <div style={{ display: "flex", gap: 2, marginTop: 2 }}>{existing.p1Types.map(t => <TypeBadge key={t} type={t} />)}</div>}
                                  </div>
                                </div>
                                <div style={{ opacity: .2 }}><Pokeball size={16} color={isDead ? "#ef4444" : "#4b5468"} /></div>
                                <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexDirection: "row-reverse" }}>
                                  <Sprite id={existing.p2Id} size={44} dead={isDead} />
                                  <div style={{ textAlign: "right" }}>
                                    <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#3b82f6", textTransform: "uppercase" }}>{data.p2N}</div>
                                    <div style={{ fontSize: 13, fontWeight: 700, opacity: isDead ? .5 : 1 }}>
                                      {existing.p2Nick || existing.p2}
                                      {existing.p2Level && <span style={{ fontSize: 10, color: "#4b5468", marginLeft: 4 }}>Lv.{existing.p2Level}</span>}
                                    </div>
                                    {existing.p2Types?.length > 0 && <div style={{ display: "flex", gap: 2, marginTop: 2, justifyContent: "flex-end" }}>{existing.p2Types.map(t => <TypeBadge key={t} type={t} />)}</div>}
                                  </div>
                                </div>
                              </div>
                              {isDead && existing.deathInfo && (
                                <div style={{ marginTop: 6, padding: "4px 8px", background: "rgba(239,68,68,.06)", borderRadius: 6, fontSize: 10, color: "#ef4444" }}>
                                  💀 {existing.deathInfo.cause && <span>{existing.deathInfo.cause}</span>}
                                  {existing.deathInfo.killer && <span> — {existing.deathInfo.killer}</span>}
                                </div>
                              )}
                              <div style={{ display: "flex", gap: 4, marginTop: 8 }}>
                                {Object.entries(S_CFG).map(([k, sc]) => {
                                  if (k === "dead") {
                                    return (
                                      <button key={k} onClick={() => {
                                        if (existing.status === STATUS.DEAD) return;
                                        setDeathPending({ routeId: route.id, method });
                                      }} style={{ flex: 1, padding: 5, border: "1px solid", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: existing.status === STATUS.DEAD ? "default" : "pointer", fontFamily: "inherit", background: existing.status === k ? sc.bg : "transparent", borderColor: existing.status === k ? sc.c : "rgba(255,255,255,.05)", color: existing.status === k ? sc.c : "#3b4560" }}>
                                        {sc.icon} {sc.label}
                                      </button>
                                    );
                                  }
                                  return (
                                    <button key={k} onClick={() => setEnc(route.id, method, { ...existing, status: k })} style={{ flex: 1, padding: 5, border: "1px solid", borderRadius: 6, fontSize: 10, fontWeight: 700, cursor: "pointer", fontFamily: "inherit", background: existing.status === k ? sc.bg : "transparent", borderColor: existing.status === k ? sc.c : "rgba(255,255,255,.05)", color: existing.status === k ? sc.c : "#3b4560" }}>
                                      {sc.icon} {sc.label}
                                    </button>
                                  );
                                })}
                                <button onClick={() => { if (confirm("Encounter löschen?")) delEnc(route.id, method); }} style={{ ...BTN_GHOST, padding: "5px 8px" }}>🗑</button>
                              </div>
                            </div>
                          );
                        }

                        return (
                          <EncounterForm key={method} method={method} routeId={route.id} existing={isEd ? existing : null} dex={dex} cache={cache} p1N={data.p1N} p2N={data.p2N}
                            onSave={(val) => { setEnc(route.id, method, val); setEditSlot(null); }}
                            onMiss={() => { setEnc(route.id, method, { p1: "", p1Nick: "", p1Id: null, p1Types: [], p2: "", p2Nick: "", p2Id: null, p2Types: [], status: STATUS.MISSED, ts: new Date().toLocaleDateString("de-DE") }); }}
                            onCancel={() => setEditSlot(null)} isEditing={isEd} />
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* TEAM TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "team" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          {teamEnc.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#3b4560" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>⚔️</div>
              <div style={{ fontSize: 13 }}>Noch keine Pokémon im Team</div>
            </div>
          ) : (
            <>
              <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
                {teamEnc.map((e, i) => {
                  const key = Object.entries(enc).find(([, v]) => v === e)?.[0] || i;
                  const routeId = key.split("__")[0];
                  const route = ROUTE_MAP[routeId];
                  return (
                    <div key={key} style={{ background: "#0b1018", border: "1px solid rgba(22,163,74,.15)", borderRadius: 12, padding: 14 }}>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        {/* P1 */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8 }}>
                          <Sprite id={e.p1Id} size={52} />
                          <div>
                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#ef4444" }}>{data.p1N}</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                              {e.p1Nick || e.p1}
                              {e.p1Level && <span style={{ fontSize: 11, color: "#4b5468", marginLeft: 4 }}>Lv.{e.p1Level}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 2, marginTop: 2 }}>{(e.p1Types || []).map(t => <TypeBadge key={t} type={t} />)}</div>
                          </div>
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 2 }}>
                          <Pokeball size={20} color="#22c55e" />
                          <div style={{ fontSize: 8, color: "#3b4560", fontWeight: 600 }}>{route?.name || "?"}</div>
                        </div>
                        {/* P2 */}
                        <div style={{ flex: 1, display: "flex", alignItems: "center", gap: 8, flexDirection: "row-reverse" }}>
                          <Sprite id={e.p2Id} size={52} />
                          <div style={{ textAlign: "right" }}>
                            <div style={{ fontSize: 9, fontWeight: 800, letterSpacing: 1, color: "#3b82f6" }}>{data.p2N}</div>
                            <div style={{ fontSize: 15, fontWeight: 700 }}>
                              {e.p2Nick || e.p2}
                              {e.p2Level && <span style={{ fontSize: 11, color: "#4b5468", marginLeft: 4 }}>Lv.{e.p2Level}</span>}
                            </div>
                            <div style={{ display: "flex", gap: 2, marginTop: 2, justifyContent: "flex-end" }}>{(e.p2Types || []).map(t => <TypeBadge key={t} type={t} />)}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
              <CoverageAnalysis teamEncounters={teamEnc} />
            </>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* GRAVEYARD TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "graveyard" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          {deadEnc.length === 0 ? (
            <div style={{ textAlign: "center", padding: 40, color: "#3b4560" }}>
              <div style={{ fontSize: 32, marginBottom: 8 }}>🪦</div>
              <div style={{ fontSize: 13 }}>Noch keine Verluste – weiter so!</div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
              {deadEnc.map((e, i) => {
                const key = Object.entries(enc).find(([, v]) => v === e)?.[0] || i;
                const routeId = key.split("__")[0];
                const route = ROUTE_MAP[routeId];
                return (
                  <div key={key} style={{ background: "#0b1018", border: "1px solid rgba(239,68,68,.12)", borderRadius: 12, padding: 12, opacity: .85 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                      <Sprite id={e.p1Id} size={40} dead />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: 13, fontWeight: 700, color: "#ef4444" }}>
                          {e.p1Nick} & {e.p2Nick}
                        </div>
                        <div style={{ fontSize: 10, color: "#4b5468" }}>
                          📍 {route?.name || routeId}
                          {e.deathInfo?.date && <span> · {e.deathInfo.date}</span>}
                        </div>
                        {e.deathInfo?.cause && (
                          <div style={{ fontSize: 10, color: "#8b95a8", marginTop: 2 }}>
                            💀 {e.deathInfo.cause}
                            {e.deathInfo.killer && <span> — {e.deathInfo.killer}</span>}
                          </div>
                        )}
                      </div>
                      <Sprite id={e.p2Id} size={40} dead />
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* BADGES TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "badges" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          {["johto", "kanto"].map(region => (
            <div key={region} style={{ marginBottom: 20 }}>
              <div style={{ fontSize: 11, fontWeight: 800, letterSpacing: 3, color: "#4b5468", textTransform: "uppercase", marginBottom: 8 }}>
                {region === "johto" ? "🏯" : "🗼"} {region}
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(140px,1fr))", gap: 8 }}>
                {GYMS.filter(g => g.region === region).map(gym => {
                  const earned = badges[gym.id]?.earned;
                  const tc = T_COL[gym.type] || "#888";
                  return (
                    <div key={gym.id} onClick={() => toggleBadge(gym.id)}
                      style={{ background: earned ? tc + "10" : "#0b1018", border: "1px solid " + (earned ? tc + "40" : "rgba(255,255,255,.05)"), borderRadius: 10, padding: 12, cursor: "pointer", textAlign: "center", transition: "all .2s", opacity: earned ? 1 : .5 }}>
                      <div style={{ fontSize: 24, marginBottom: 4 }}>{earned ? "🏅" : "⭕"}</div>
                      <div style={{ fontSize: 13, fontWeight: 700, color: earned ? "#e8ecf4" : "#3b4560" }}>{gym.name}</div>
                      <div style={{ fontSize: 10, color: "#4b5468" }}>{gym.city}</div>
                      <TypeBadge type={gym.type} size="lg" />
                      <div style={{ fontSize: 9, color: "#2d3548", marginTop: 4 }}>{gym.badge}-Orden</div>
                      {earned && badges[gym.id]?.date && (
                        <div style={{ fontSize: 9, color: "#22c55e", marginTop: 2 }}>✓ {badges[gym.id].date}</div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* POKEDEX TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "dex" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
            <input style={{ ...INP_STYLE, maxWidth: 300 }} placeholder="Pokémon suchen…" value={dexSearch} onChange={(e) => setDexSearch(e.target.value)} />
            <div style={{ fontSize: 13, color: "#4b5468", fontWeight: 700 }}>{caughtIds.size}<span style={{ color: "#2d3548" }}> / 493</span></div>
            <div style={{ flex: 1, height: 6, background: "#0b1018", borderRadius: 3, overflow: "hidden", border: "1px solid rgba(255,255,255,.04)" }}>
              <div style={{ height: "100%", width: (caughtIds.size / 493 * 100) + "%", background: "linear-gradient(90deg,#dc2626,#2563eb)", borderRadius: 3, transition: "width .3s" }} />
            </div>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill,minmax(64px,1fr))", gap: 4 }}>
            {dex.filter(p => {
              if (!dexSearch) return true;
              const low = dexSearch.toLowerCase();
              const cached = cache.current[p.id];
              return p.name.includes(low) || p.display.toLowerCase().includes(low) || (cached && cached.de && cached.de.includes(low)) || (cached && cached.display && cached.display.toLowerCase().includes(low));
            }).map(p => {
              const caught = caughtIds.has(p.id);
              const cached = cache.current[p.id];
              return (
                <div key={p.id} style={{ background: caught ? "rgba(22,163,74,.08)" : "#0b1018", border: "1px solid " + (caught ? "rgba(22,163,74,.2)" : "rgba(255,255,255,.03)"), borderRadius: 8, padding: "6px 4px 4px", textAlign: "center" }}>
                  <div style={{ opacity: caught ? 1 : .15, filter: caught ? "none" : "grayscale(1)" }}>
                    <Sprite id={p.id} size={48} />
                  </div>
                  <div style={{ fontSize: 8, fontWeight: 700, color: caught ? "#e8ecf4" : "#2d3548", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                    {(cached && cached.display) || p.display}
                  </div>
                  <div style={{ fontSize: 7, color: "#2d3548", fontFamily: "monospace" }}>{"#" + String(p.id).padStart(3, "0")}</div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════ */}
      {/* STATS TAB */}
      {/* ════════════════════════════════════════════════════════ */}
      {tab === "stats" && (
        <div style={{ maxWidth: 720, margin: "0 auto", padding: "12px 16px 40px" }}>
          {/* Overview */}
          <div style={{ background: "#0b1018", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
            <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#4b5468", marginBottom: 10 }}>ÜBERSICHT</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 12, textAlign: "center" }}>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", color: "#22c55e" }}>{stats.team}</div>
                <div style={{ fontSize: 9, color: "#4b5468", fontWeight: 700 }}>IM TEAM</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", color: "#f59e0b" }}>{stats.box}</div>
                <div style={{ fontSize: 9, color: "#4b5468", fontWeight: 700 }}>IN DER BOX</div>
              </div>
              <div>
                <div style={{ fontSize: 28, fontWeight: 800, fontFamily: "'Bebas Neue',sans-serif", color: "#ef4444" }}>{stats.dead}</div>
                <div style={{ fontSize: 9, color: "#4b5468", fontWeight: 700 }}>GEFALLEN</div>
              </div>
            </div>
            <div style={{ marginTop: 12, height: 8, background: "#080c16", borderRadius: 4, overflow: "hidden", display: "flex" }}>
              {stats.total > 0 && (
                <>
                  <div style={{ width: (stats.team / stats.total * 100) + "%", background: "#22c55e", transition: "width .3s" }} />
                  <div style={{ width: (stats.box / stats.total * 100) + "%", background: "#f59e0b", transition: "width .3s" }} />
                  <div style={{ width: (stats.dead / stats.total * 100) + "%", background: "#ef4444", transition: "width .3s" }} />
                </>
              )}
            </div>
            <div style={{ marginTop: 8, fontSize: 10, color: "#4b5468" }}>
              Pokédex: {caughtIds.size} / 493 ({(caughtIds.size / 493 * 100).toFixed(1)}%)
            </div>
            <div style={{ fontSize: 10, color: "#4b5468" }}>
              Badges: {Object.values(badges).filter(b => b?.earned).length} / {GYMS.length}
            </div>
            {stats.total > 0 && (
              <div style={{ fontSize: 10, color: stats.dead > 0 ? "#ef4444" : "#22c55e", marginTop: 2 }}>
                Überlebensrate: {((1 - stats.dead / stats.total) * 100).toFixed(0)}%
              </div>
            )}
          </div>

          {/* Deaths by Route */}
          {deathsByRoute.length > 0 && (
            <div style={{ background: "#0b1018", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: 16, marginBottom: 12 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#ef4444", marginBottom: 10 }}>💀 GEFÄHRLICHSTE ROUTEN</div>
              {deathsByRoute.slice(0, 5).map(([name, count]) => (
                <div key={name} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{name}</div>
                  <div style={{ display: "flex", gap: 2 }}>
                    {Array.from({ length: count }).map((_, i) => <span key={i} style={{ fontSize: 12 }}>💀</span>)}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", minWidth: 20, textAlign: "right" }}>{count}</div>
                </div>
              ))}
            </div>
          )}

          {/* Deaths by Gym Phase */}
          {deathsByPhase.length > 0 && (
            <div style={{ background: "#0b1018", border: "1px solid rgba(255,255,255,.05)", borderRadius: 12, padding: 16 }}>
              <div style={{ fontSize: 10, fontWeight: 800, letterSpacing: 2, color: "#ef4444", marginBottom: 10 }}>💀 VERLUSTE PRO PHASE</div>
              {deathsByPhase.map(([phase, count]) => (
                <div key={phase} style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 6 }}>
                  <div style={{ flex: 1, fontSize: 12, fontWeight: 600 }}>{phase}</div>
                  <div style={{ flex: 2, height: 6, background: "#080c16", borderRadius: 3, overflow: "hidden" }}>
                    <div style={{ height: "100%", width: (count / Math.max(...deathsByPhase.map(d => d[1])) * 100) + "%", background: "#ef4444", borderRadius: 3 }} />
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 800, color: "#ef4444", minWidth: 20, textAlign: "right" }}>{count}</div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
