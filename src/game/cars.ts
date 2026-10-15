export type Slot = "body" | "glass" | "tail" | "head" | "trim";

export type Part = {
  x: number;
  y: number;
  z: number;
  sx: number;
  sy: number;
  sz: number;
  color: string;
  slot: Slot;
};

export type WheelSpec = { x: number; z: number };

export type CarClass = "jdm" | "super" | "dtm" | "sales" | "f1";
export type Kind = "coupe" | "sedan" | "hatch" | "wagon" | "roadster" | "truck" | "suv" | "wedge" | "van" | "f1";
export type Stage = 0 | 1 | 2 | 3;

export type CarDef = {
  id: string;
  name: string;
  house: string;
  blurb: string;
  klass: CarClass;
  stage: Stage;
  tempo: number;
  gripStat: number;
  driftStat: number;
  maxSpeed: number;
  accel: number;
  grip: number;
  driftGrip: number;
  turn: number;
  paint: string;
  rim: string;
  parts: Part[];
  wheels: WheelSpec[];
};

export type Blueprint = {
  id: string;
  name: string;
  house: string;
  klass: CarClass;
  kind: Kind;
  blurb: string;
  body: string;
  accent: string;
  L: number;
  W: number;
  H: number;
  nose: number;
  wing: number;
  flare: number;
  maxSpeed: number;
  accel: number;
  grip: number;
  driftGrip: number;
  turn: number;
};

const GLASS = "#101820";
const BLACK = "#141414";
const TAIL = "#ff2a2a";
const HEAD = "#fff1c4";

export const CLASSES: { id: CarClass; label: string }[] = [
  { id: "jdm", label: "JDM" },
  { id: "super", label: "SUPER" },
  { id: "dtm", label: "DTM" },
  { id: "sales", label: "SELLER" },
  { id: "f1", label: "FORMEL" },
];

export const STAGE_LABEL = ["Stock", "Stufe 1", "Stufe 2", "Stufe 3"] as const;

const RAW = `
jdm|azra|AZRA MK4|KEI WORKS|coupe|Langer Sechszylinder, Haiflosse, Posterform.|#c41822|#111111|4.2|1.84|0.5|0.66|0.62|0.25|50|28|6.4|1.65|1.9
jdm|ridge32|RIDGE 32|HORIZON|coupe|Allrad-Ikone, vier Lampen, breite Hüften.|#c0c6d0|#1d4e89|4.05|1.78|0.52|0.48|0.7|0.45|49|27|7.2|1.8|1.82
jdm|ridge33|RIDGE 33|HORIZON|coupe|Glatter Nachfolger, gleiche Haltung.|#d9dde4|#c41822|4.12|1.8|0.5|0.52|0.66|0.4|50|27|7.1|1.75|1.84
jdm|spin-fd|SPIN FD|ROTOR|coupe|Kreiskolben, Dreieckfenster, leichter Schwanz.|#e6c84a|#111111|4.0|1.72|0.46|0.5|0.58|0.3|51|30|6.1|1.55|2.0
jdm|spin-fc|SPIN FC|ROTOR|coupe|Älterer Kreiskolben, Klappaugen-Andeutung.|#f3efe4|#c41822|3.95|1.7|0.48|0.55|0.4|0.22|46|26|5.8|1.6|1.88
jdm|midnight-x|MIDNIGHT X|MID HOUSE|coupe|Mittelmotor, niedrige Kabine, rote Kehle.|#9e1b2e|#111111|4.05|1.76|0.44|0.42|0.35|0.28|48|27|6.8|1.9|1.95
jdm|silva13|SILVA 13|DRIFT LINE|hatch|Heckschleuder, aufrechte Lampen.|#f3efe4|#222222|3.9|1.68|0.5|0.46|0.3|0.18|45|25|5.4|1.5|1.92
jdm|silva14|SILVA 14|DRIFT LINE|coupe|Runde Front, tiefer als die Schwester.|#1a6b6b|#f3efe4|3.95|1.7|0.48|0.5|0.36|0.24|46|26|5.6|1.48|1.96
jdm|hachi|HACHI 86|SPRINTER|coupe|Klein, leicht, schwarz-weiße Kappe.|#f3efe4|#111111|3.7|1.62|0.5|0.4|0.15|0.1|42|24|5.2|1.45|2.05
jdm|miko|MIKO ROAD|ROADSTER CO|roadster|Offen, kurz, Pop-up-Andeutung.|#c41822|#111111|3.55|1.6|0.42|0.48|0.1|0.05|40|22|5.5|1.7|2.1
jdm|pulse-r|PULSE R|POCKET|hatch|Kleiner Allrad, Haube voller Schlitze.|#6e7380|#c41822|3.65|1.66|0.52|0.42|0.5|0.35|44|26|6.6|1.85|1.8
jdm|summit3|SUMMIT III|PEAK|sedan|Limo mit Kampfspoiler und breiten Backen.|#f3efe4|#c41822|4.15|1.74|0.55|0.4|0.72|0.5|47|26|6.9|1.7|1.78
jdm|star-gc|STAR GC|PLEIAD|sedan|Blaue Limo, Hutze, goldene Felgen.|#1a3f8a|#d4b46a|4.1|1.72|0.54|0.38|0.68|0.42|48|27|6.8|1.72|1.8
jdm|zed32|ZED 32|FAIR LINE|coupe|Lange Nase, zwei Sitze, schwarzes Glas.|#141414|#c41822|4.15|1.8|0.48|0.6|0.25|0.2|47|25|6.0|1.62|1.86
jdm|star3k|STAR 3000|TWIN HOUSE|coupe|Breit, zwei Schächte in der Haube.|#1f6b3a|#111111|4.25|1.86|0.5|0.58|0.4|0.3|48|26|6.3|1.7|1.75
jdm|mid-w2|MID W2|MIDSHIP|coupe|Baby-Mittelmotor, knubbeliges Heck.|#c41822|#f3efe4|3.85|1.68|0.46|0.36|0.3|0.22|46|28|6.0|1.58|2.0
jdm|teg-r|TEG R|POCKET|coupe|Kurzes Coupé, hohe Drehzahl, schmal.|#f3efe4|#c41822|3.9|1.68|0.48|0.44|0.45|0.2|47|29|6.2|1.6|1.98
jdm|pocket-r|POCKET R|POCKET|hatch|Drei Türen, roter Deckel, Stadtflitzer.|#e6c84a|#c41822|3.6|1.64|0.5|0.34|0.55|0.18|44|28|5.8|1.55|2.02
jdm|lift4|LIFT FOUR|PEAK|hatch|Liftback, Allrad, Haubenschlitz.|#f4f4f4|#c41822|4.05|1.74|0.5|0.46|0.6|0.38|48|27|6.7|1.68|1.82
jdm|fifth-bb|FIFTH BB|POCKET|coupe|Langes Coupé, vier Augen, leise schnell.|#1a1a1a|#f3efe4|4.2|1.76|0.48|0.54|0.2|0.12|46|24|6.4|1.9|1.7
jdm|soar-z|SOAR Z|KEI WORKS|coupe|Grand Tourer, goldener Lack, weiche Nase.|#c4a574|#111111|4.3|1.78|0.5|0.6|0.22|0.15|47|24|6.5|1.85|1.72
jdm|chase-x|CHASE X|KEI WORKS|sedan|Viereckige Limo, loses Heck.|#f3efe4|#1a3f8a|4.2|1.7|0.54|0.42|0.35|0.2|45|25|5.7|1.52|1.9
jdm|wagon26|WAGON 26|HORIZON|wagon|Kombi mit dem Herz eines Allrad-Coupés.|#b7bcc6|#c41822|4.35|1.76|0.58|0.4|0.48|0.3|46|25|6.6|1.75|1.74
jdm|one-eight|ONE EIGHT|DRIFT LINE|hatch|Schrägheck, Nachtstraße, leichtes Heck.|#141414|#e6c84a|3.95|1.68|0.5|0.4|0.28|0.16|44|26|5.3|1.42|2.08
jdm|vr-four|VR FOUR|PEAK|sedan|Unscheinbare Limo, Allrad darunter.|#8e1d2c|#111111|4.15|1.72|0.54|0.4|0.3|0.22|46|26|6.5|1.8|1.76
super|q40|ROSSO Q40|SCUDERIA DI CARTA|wedge|Roter Mittelmotor, großer Flügel, vier Rohre.|#c41822|#111111|4.05|1.9|0.4|0.55|0.9|0.35|52|30|6.6|1.9|1.8
super|rosso50|ROSSO 50|SCUDERIA DI CARTA|roadster|Offener Zwölfer, geschwungene Flanke.|#c41822|#d4b46a|4.3|1.92|0.42|0.5|0.4|0.2|54|28|6.9|2.0|1.7
super|rosso355|ROSSO 355|SCUDERIA DI CARTA|coupe|Kleine Mitte, runde Hüften.|#c41822|#f3efe4|4.1|1.8|0.44|0.48|0.35|0.22|51|29|6.7|1.85|1.82
super|rosso348|ROSSO 348|SCUDERIA DI CARTA|coupe|Kantiger Vorgänger, Lamellen hinten.|#9e1b2e|#111111|4.05|1.78|0.44|0.5|0.3|0.2|49|27|6.4|1.8|1.78
super|bull-vt|BULL VT|TORO|wedge|Scharfe Kanten, tief, Scherentür-Andeutung.|#e6c84a|#111111|4.3|2.0|0.4|0.62|0.55|0.3|53|29|6.5|1.75|1.68
super|wedge25|WEDGE 25|TORO|wedge|Der Keil. Flach, breit, Nase wie ein Bügeleisen.|#f3efe4|#111111|4.15|1.98|0.38|0.7|0.7|0.25|50|26|6.2|1.7|1.62
super|cat220|CAT 220|LEAPER|coupe|Sehr lang, sehr breit, britischer Lader.|#1a4a8a|#c0c6d0|4.5|2.02|0.42|0.64|0.45|0.28|55|27|7.0|1.95|1.6
super|speed1|SPEED ONE|WOKING|coupe|Goldene Mitte, drei Plätze im Kopf, großer Flügel.|#c4a574|#111111|4.35|1.9|0.4|0.58|0.85|0.2|58|32|7.4|2.1|1.72
super|snake-rt|SNAKE RT|COIL|roadster|Lange Haube, Seitenrohr-Streifen, offen.|#c41822|#111111|4.35|1.92|0.42|0.72|0.2|0.15|51|30|5.8|1.6|1.74
super|glass-c4|GLASS C4|BOWTIE|coupe|Glasheck, breite Backen, lange Nase.|#f3efe4|#c41822|4.2|1.88|0.44|0.6|0.35|0.3|49|26|6.0|1.7|1.7
super|flat959|FLAT 959|ZWÖLF|coupe|Runde Lampen, breite Hüften, Allrad-Flunder.|#c0c6d0|#1a1a1a|4.15|1.84|0.46|0.5|0.5|0.4|52|28|7.1|1.9|1.76
super|flat993|FLAT 993|ZWÖLF|coupe|Letzte Luft, rund und breit.|#d9dde4|#c41822|4.05|1.74|0.46|0.42|0.4|0.32|50|27|6.8|1.75|1.84
super|front928|FRONT 928|ZWÖLF|coupe|Frontmotor, Klappaugen, Gran Turismo.|#6e3a2e|#d4b46a|4.3|1.82|0.46|0.62|0.15|0.12|48|24|6.5|1.95|1.66
super|sidestrike|SIDESTRIKE|SCUDERIA DI CARTA|wedge|Kiemen in der Flanke, flach wie ein Tisch.|#f3efe4|#c41822|4.2|1.94|0.4|0.58|0.3|0.22|51|27|6.3|1.8|1.7
super|boxer512|BOXER 512|SCUDERIA DI CARTA|wedge|Schwarzrot, breit, Mittelmotor.|#141414|#c41822|4.25|1.92|0.4|0.56|0.35|0.24|50|26|6.2|1.78|1.68
super|quad-t|QUAD TURBO|MOLSHEIM|wedge|Kleines Hyper, vier Lader, blaue Nase.|#1a3f8a|#d4b46a|4.15|1.9|0.4|0.6|0.6|0.28|54|31|6.9|1.85|1.74
super|wedge-s4|WEDGE S4|HETHEL|wedge|Britischer Keil, lang und niedrig.|#c4a574|#111111|4.2|1.86|0.4|0.66|0.4|0.18|49|27|6.4|1.7|1.8
super|mid-s1|MID S1|HETHEL|roadster|Winzig, offen, kaum Dach.|#c41822|#f3efe4|3.5|1.66|0.38|0.4|0.15|0.08|44|28|6.6|1.65|2.15
super|vector-w|VECTOR W|WILMINGTON|wedge|Amerikanischer Keil, scharfe Nase.|#111111|#c41822|4.25|1.96|0.38|0.7|0.5|0.2|52|28|6.0|1.6|1.64
super|silver-gt|SILVER GT|STERN|coupe|Silberner Langheck, GT-Nacht.|#c0c6d0|#111111|4.45|1.96|0.42|0.6|0.95|0.4|56|30|7.6|2.05|1.7
super|enduro-gt|ENDURO GT|ZWÖLF|coupe|Rennheck, flach, lange Haube.|#f3efe4|#c41822|4.4|1.9|0.4|0.62|0.9|0.35|57|31|7.5|2.0|1.72
super|blackpool|BLACKPOOL|GRIFF|coupe|Britisch, muskulös, lange Türen.|#1f6b3a|#111111|4.15|1.84|0.46|0.58|0.3|0.2|48|26|6.1|1.7|1.78
super|wing-db|WING DB|NEWPORT|coupe|Lange Haube, runde Hüfte, dunkelgrün.|#0e3b2e|#d4b46a|4.4|1.8|0.48|0.64|0.2|0.1|47|23|6.6|2.0|1.6
super|endurance-r|ENDURANCE R|HORIZON|coupe|Langstrecken-Nase, weißrot, geschlossen.|#f3efe4|#c41822|4.45|1.92|0.4|0.66|0.8|0.3|56|30|7.3|1.95|1.68
super|gt-one|GT ONE|KEI WORKS|coupe|Roter Langheck, eine große Flosse.|#c41822|#f3efe4|4.5|1.94|0.4|0.68|0.85|0.32|57|31|7.4|1.9|1.66
dtm|stern-evo|STERN EVO|STERN|sedan|Kasten, Riesenflügel, ausgestellte Läufe.|#f3efe4|#111111|4.2|1.82|0.52|0.4|0.95|0.7|49|27|8.0|2.2|1.7
dtm|stern-190|STERN 190|STERN|sedan|Kleine Limo, schon kampflustig.|#d9dde4|#1a1a1a|4.05|1.74|0.54|0.36|0.8|0.55|47|26|7.6|2.15|1.72
dtm|stern-c|STERN C|STERN|sedan|Runde Limo, schwarzer Flügel.|#111111|#c0c6d0|4.25|1.8|0.52|0.42|0.9|0.6|50|27|8.1|2.25|1.68
dtm|ring-e30|RING E30|RING|coupe|Kasten-Coupé, der Klassiker der Box.|#f3efe4|#1a3f8a|4.0|1.72|0.5|0.4|0.85|0.6|48|28|7.8|2.1|1.8
dtm|ring-e36|RING E36|RING|coupe|Runder, niedriger, immer noch kantig.|#d4b46a|#111111|4.15|1.76|0.5|0.44|0.88|0.58|49|28|8.0|2.15|1.78
dtm|ring-tour|RING TOUR|RING|sedan|Viertürer mit Rennflächen.|#c41822|#f3efe4|4.3|1.78|0.54|0.4|0.9|0.62|48|26|7.9|2.2|1.7
dtm|quad-v8|QUAD V8|QUAD|sedan|Lange Limo, breite Brust.|#f3efe4|#111111|4.45|1.82|0.54|0.48|0.82|0.5|48|25|7.7|2.3|1.64
dtm|quad-80|QUAD 80|QUAD|sedan|Kompakte Limo, kantige Lampen.|#b7bcc6|#c41822|4.1|1.74|0.54|0.38|0.78|0.48|47|26|7.5|2.2|1.7
dtm|quad-a4|QUAD A4|QUAD|sedan|Niedrige Limo, silber, großer Heckflügel.|#c0c6d0|#111111|4.2|1.78|0.52|0.42|0.92|0.58|50|27|8.2|2.25|1.72
dtm|quad-tour|QUAD TOUR|QUAD|wagon|Kombi, der nicht nachgibt.|#1a3f8a|#f3efe4|4.4|1.8|0.58|0.4|0.86|0.55|48|25|7.8|2.3|1.62
dtm|nord-155|NORD 155|NORD|sedan|Schmale Limo, rote Nase, breite Backen.|#c41822|#f3efe4|4.15|1.76|0.52|0.46|0.9|0.65|49|27|7.9|2.15|1.74
dtm|nord-v6|NORD V6|NORD|sedan|Keilnase, dunkle Flanken.|#141414|#c41822|4.2|1.78|0.52|0.5|0.88|0.6|49|27|7.8|2.1|1.76
dtm|nord-tour|NORD TOUR|NORD|coupe|Kurzes Coupé aus der Box.|#1f6b3a|#f3efe4|4.05|1.76|0.5|0.42|0.84|0.58|48|28|7.7|2.1|1.8
dtm|cali-aero|CALI AERO|CALI|coupe|Flaches Coupé, geschwungene Hüfte.|#e6c84a|#111111|4.2|1.8|0.46|0.5|0.8|0.5|50|28|7.6|2.05|1.82
dtm|cali-v6|CALI V6|CALI|coupe|Gelb, breit, niedriger als die Limo.|#f2c14e|#111111|4.15|1.82|0.46|0.48|0.86|0.55|50|28|7.8|2.1|1.8
dtm|omega-t|OMEGA TOUR|CALI|sedan|Große Limo, Flügel wie ein Regal.|#1a2744|#e6c84a|4.5|1.84|0.54|0.46|0.94|0.6|49|25|7.9|2.3|1.6
dtm|sierra-rs|SIERRA RS|OVAL|hatch|Dreitürer, Walfisch-Heck, Flügel.|#f3efe4|#1a3f8a|4.1|1.74|0.52|0.4|0.82|0.48|48|27|7.4|2.05|1.78
dtm|oval-tour|OVAL TOUR|OVAL|sedan|Mittelklasse, überraschend breit.|#1a3f8a|#f3efe4|4.3|1.78|0.54|0.42|0.8|0.5|47|26|7.5|2.2|1.68
dtm|prime-tour|PRIME TOUR|HORIZON|sedan|Unauffällige Limo, lauter Flügel.|#6e7380|#c41822|4.25|1.76|0.54|0.4|0.88|0.52|48|26|7.6|2.15|1.7
dtm|peak-tour|PEAK TOUR|PEAK|sedan|Weiße Limo, rote Spiegel.|#f3efe4|#c41822|4.2|1.74|0.54|0.4|0.84|0.5|47|26|7.5|2.15|1.72
dtm|stern-dtm|STERN DTM|STERN|coupe|Silbernes Coupé, schwarze Flächen.|#d9dde4|#111111|4.25|1.82|0.48|0.5|0.96|0.66|51|28|8.3|2.2|1.74
dtm|ring-dtm|RING DTM|RING|coupe|Blaues Coupé, weiße Bahn.|#1a3f8a|#f3efe4|4.15|1.8|0.48|0.46|0.92|0.64|50|28|8.2|2.15|1.78
dtm|quad-dtm|QUAD DTM|QUAD|sedan|Rote Limo, vier Punkte auf der Nase.|#c41822|#111111|4.3|1.8|0.52|0.44|0.9|0.6|50|27|8.1|2.25|1.7
dtm|cali-dtm|CALI DTM|CALI|coupe|Grünes Coupé, gelbe Nase.|#1f6b3a|#e6c84a|4.18|1.8|0.48|0.48|0.88|0.58|49|28|7.9|2.1|1.76
dtm|nord-dtm|NORD DTM|NORD|sedan|Weiße Limo, roter Bug.|#f3efe4|#c41822|4.22|1.78|0.52|0.46|0.9|0.62|49|27|8.0|2.15|1.74
sales|roll-a|ROLL A|KEI WORKS|sedan|Die Limo, die überall stand.|#f3efe4|#c41822|4.05|1.66|0.55|0.4|0.02|0.02|38|18|5.4|2.3|1.5
sales|pocket-eg|POCKET EG|POCKET|hatch|Drei Türen, Stadt, unverwüstlich.|#1a3f8a|#f3efe4|3.6|1.62|0.52|0.34|0.05|0.05|36|20|5.2|2.1|1.7
sales|klein-g|KLEIN G|WOLF|hatch|Kompakt, aufrecht, der Standard.|#1f6b3a|#111111|3.7|1.64|0.54|0.32|0.08|0.06|37|20|5.3|2.0|1.68
sales|haul-f|HAUL F|OVAL|truck|Hohe Pritsche, die halbe Welt.|#c41822|#f3efe4|4.7|1.9|0.72|0.55|0.05|0.1|40|16|4.8|2.4|1.3
sales|cami|CAMI|KEI WORKS|sedan|Weiche Limo, leise, lang.|#b7bcc6|#1a3f8a|4.3|1.7|0.55|0.42|0.02|0.02|39|17|5.6|2.35|1.45
sales|chord|CHORD|POCKET|sedan|Größerer Bruder, vier Türen, ruhig.|#1a2744|#c0c6d0|4.35|1.72|0.54|0.4|0.04|0.04|40|18|5.7|2.3|1.48
sales|compact-e|COMPACT E|OVAL|hatch|Kleinwagen der Masse.|#f3efe4|#1a3f8a|3.75|1.64|0.54|0.36|0.04|0.04|35|19|5.0|2.15|1.62
sales|sign-sedan|SIGN SEDAN|OVAL|sedan|Ovale Mittelklasse, weiche Schultern.|#6e3a2e|#d4b46a|4.4|1.76|0.55|0.46|0.06|0.05|41|18|5.5|2.25|1.42
sales|range-pick|RANGE PICK|OVAL|truck|Schmale Pritsche, Arbeit.|#1f6b3a|#111111|4.4|1.74|0.68|0.5|0.02|0.08|36|16|4.9|2.3|1.4
sales|trail-ex|TRAIL EX|OVAL|suv|Hoher Kombi, zwei Reihen.|#1a4a3a|#d4b46a|4.3|1.8|0.74|0.4|0.08|0.12|38|16|5.1|2.4|1.35
sales|horn-haul|HORN HAUL|HORN|truck|Bullige Pritsche, hohe Nase.|#c41822|#111111|4.75|1.92|0.74|0.58|0.04|0.12|39|15|4.7|2.45|1.28
sales|bow-haul|BOW HAUL|BOWTIE|truck|Lange Pritsche, eckige Lampen.|#1a2744|#c0c6d0|4.8|1.9|0.72|0.56|0.04|0.1|38|15|4.8|2.4|1.26
sales|jet-hatch|JET HATCH|WOLF|hatch|Stufenheck, kompakt, gerade.|#141414|#f3efe4|3.95|1.66|0.52|0.38|0.1|0.08|39|21|5.5|2.05|1.6
sales|pass-wagon|PASS WAGON|WOLF|wagon|Familienkombi, lang.|#1a3f8a|#f3efe4|4.4|1.72|0.58|0.4|0.06|0.06|40|18|5.6|2.2|1.46
sales|sunny-s|SUNNY S|HORIZON|sedan|Schlicht, überall, zuverlässig.|#f3efe4|#1a3f8a|4.05|1.66|0.54|0.38|0.02|0.02|36|17|5.3|2.25|1.5
sales|alti|ALTI|HORIZON|sedan|Mittelklasse, weiche Schultern.|#6e7380|#c41822|4.3|1.72|0.54|0.42|0.08|0.06|41|19|5.6|2.15|1.5
sales|max-sedan|MAX SEDAN|HORIZON|sedan|Die große, fast schon eine Sportlimo.|#141414|#d4b46a|4.4|1.76|0.52|0.46|0.2|0.12|44|22|6.0|2.0|1.55
sales|cav-c|CAV C|BOWTIE|coupe|Günstiges Coupé, eckig.|#e6c84a|#111111|4.15|1.7|0.5|0.48|0.15|0.1|40|20|5.2|1.9|1.58
sales|lume|LUME|BOWTIE|sedan|Familienlimo, lang und hell.|#f3efe4|#1a3f8a|4.5|1.76|0.55|0.44|0.02|0.04|39|16|5.4|2.3|1.4
sales|grand-a|GRAND A|ARROW|coupe|Nase runter, Heck hoch.|#c41822|#111111|4.2|1.74|0.5|0.5|0.35|0.22|43|22|5.4|1.75|1.62
sales|fur-sedan|FUR SEDAN|OVAL|sedan|Weiche Luxuslimo, Chrom-Andeutung.|#d9dde4|#1a2744|4.55|1.78|0.55|0.48|0.04|0.04|40|16|5.7|2.4|1.38
sales|pony-gt|PONY GT|OVAL|coupe|Lange Haube, kurzes Dach.|#c41822|#f3efe4|4.35|1.8|0.48|0.68|0.4|0.2|46|24|5.6|1.65|1.66
sales|bandit|BANDIT|BOWTIE|coupe|Breites Coupé, verdeckte Lampen.|#e6c84a|#111111|4.4|1.86|0.46|0.62|0.45|0.28|47|25|5.7|1.6|1.64
sales|bird-ta|BIRD TA|BIRD|coupe|Feuerbird-Haltung, ohne den Vogel.|#111111|#e6c84a|4.45|1.88|0.46|0.64|0.5|0.3|47|25|5.6|1.58|1.62
sales|coupe-c|COUPE C|KEI WORKS|hatch|Liftback, jung, kurze Haube.|#c41822|#f3efe4|4.05|1.7|0.5|0.42|0.25|0.12|42|22|5.5|1.8|1.64
sales|work-lux|WORK LUX|KEI WORKS|truck|Arbeitspritsche, weltweit.|#f3efe4|#1f6b3a|4.55|1.72|0.68|0.5|0.02|0.08|35|15|4.8|2.3|1.36
sales|cruiser-j|CRUISER J|KEI WORKS|suv|Kasten, hoch, zwei Kisten auf dem Dach im Kopf.|#1f6b3a|#d4b46a|4.5|1.82|0.76|0.42|0.06|0.14|36|14|5.0|2.5|1.28
sales|rav-box|RAV BOX|KEI WORKS|suv|Kleiner Hochbeiner, Stadt und Feld.|#c41822|#111111|3.85|1.7|0.7|0.36|0.08|0.1|37|18|5.2|2.2|1.48
sales|chief-suv|CHIEF SUV|CHIEF|suv|Eckiger Hochsitz.|#1a2744|#c4a574|4.2|1.76|0.72|0.4|0.05|0.12|37|16|5.0|2.35|1.36
sales|trail-open|TRAIL OPEN|CHIEF|suv|Offen, eckig, kurze Türen.|#1f6b3a|#111111|3.8|1.7|0.7|0.38|0.02|0.1|36|17|4.9|2.1|1.5
sales|neon-c|NEON C|HORN|sedan|Runde Kleinlimo, bunt.|#e6c84a|#1a3f8a|4.05|1.68|0.54|0.4|0.12|0.06|38|20|5.2|2.0|1.58
sales|family-van|FAMILY VAN|HORN|van|Kasten, der Familienbus.|#1a3f8a|#f3efe4|4.45|1.82|0.8|0.3|0.02|0.04|34|14|4.7|2.5|1.22
sales|river-hatch|RIVER HATCH|DIAMOND|hatch|Klein und rund.|#c41822|#f3efe4|3.55|1.6|0.54|0.32|0.06|0.04|36|20|5.3|2.05|1.72
sales|point-hatch|POINT HATCH|POINT|hatch|Rund, Stadt, Italien im Kopf.|#d4b46a|#c41822|3.6|1.62|0.54|0.3|0.08|0.05|35|19|5.1|2.1|1.68
sales|mira|MIRA|HORIZON|hatch|Winzig, hoch, freundlich.|#f3efe4|#1a6b6b|3.4|1.55|0.56|0.28|0.02|0.02|33|18|5.0|2.2|1.74
sales|small-p|SMALL P|WOLF|hatch|Noch kleiner als der Standard.|#1a3f8a|#f3efe4|3.5|1.58|0.54|0.3|0.06|0.04|35|19|5.2|2.1|1.7
sales|oval-bug|OVAL BUG|WOLF|coupe|Rund, neu aufgelegt, lächelnde Nase.|#e6c84a|#111111|3.9|1.68|0.55|0.28|0.1|0.08|38|18|5.4|2.15|1.55
sales|vic-sedan|VIC SEDAN|OVAL|sedan|Lange Limo, Rahmen im Gefühl.|#141414|#d4b46a|4.7|1.84|0.56|0.5|0.02|0.04|40|15|5.2|2.4|1.3
sales|burb-haul|BURB HAUL|BOWTIE|suv|Riesiger Kasten.|#1a4a3a|#d4b46a|4.9|1.95|0.8|0.42|0.04|0.16|36|13|4.6|2.6|1.18
sales|runner-4|RUNNER 4|KEI WORKS|suv|Hoher Allrad, schmale Hüften.|#c0c6d0|#c41822|4.25|1.74|0.72|0.4|0.1|0.14|38|17|5.3|2.2|1.4
f1|nose90|NOSE 90|HIGH LINE|f1|Die Nase beginnt zu steigen.|#f3efe4|#1d4e89|4.3|1.85|0.32|0.4|0.55|0.1|56|32|9.2|3.6|2.15
f1|high91|HIGH 91|HIGH LINE|f1|Hohe Nase, schmale Spur.|#1a3f8a|#f3efe4|4.25|1.8|0.32|0.7|0.6|0.08|57|33|9.4|3.7|2.2
f1|active92|ACTIVE 92|ACTIVE|f1|Aktive Fläche im Kopf, tief und nervös.|#f3efe4|#1a3f8a|4.35|1.88|0.3|0.55|0.75|0.12|60|35|10.2|3.9|2.05
f1|active93|ACTIVE 93|ACTIVE|f1|Sauberer Flügel, noch elektronisch im Gefühl.|#d9dde4|#c41822|4.32|1.86|0.3|0.6|0.72|0.1|59|34|10.0|3.85|2.1
f1|narrow94|NARROW 94|NARROW|f1|Schmal, roh, wenig Hilfe.|#f3efe4|#111111|4.2|1.72|0.32|0.5|0.5|0.06|55|31|8.8|3.5|2.25
f1|blue95|BLUE 95|BLUE NOSE|f1|Hohe Nase, blau, spitzer Bug.|#1a3f8a|#e6c84a|4.28|1.78|0.32|0.78|0.7|0.08|58|34|9.5|3.7|2.18
f1|low96|LOW 96|LOW LINE|f1|Tiefer, breitere Schultern.|#f3efe4|#1a3f8a|4.4|1.9|0.3|0.62|0.8|0.14|59|33|9.8|3.8|2.12
f1|groove97|GROOVE 97|GROOVE|f1|Rillen-Ära, silberne Flanke.|#c0c6d0|#c41822|4.42|1.88|0.3|0.66|0.78|0.12|58|33|9.6|3.75|2.14
f1|slim98|SLIM 98|SLIM|f1|Schmal, silbern, lange Nase.|#c0c6d0|#111111|4.45|1.74|0.3|0.8|0.85|0.06|61|36|10.4|4.0|2.2
f1|slim99|SLIM 99|SLIM|f1|Letztes Jahr, noch schmaler.|#d9dde4|#c41822|4.48|1.72|0.3|0.82|0.88|0.06|62|36|10.5|4.05|2.22
f1|red90|RED 90|ROSSO LINE|f1|Rotes offenes Rad, breiter Frontflügel.|#c41822|#f3efe4|4.22|1.9|0.34|0.35|0.65|0.12|55|31|9.0|3.55|2.1
f1|white91|WHITE 91|WHITE LINE|f1|Weiß mit rotem Bug.|#f3efe4|#c41822|4.26|1.82|0.32|0.58|0.6|0.08|56|32|9.3|3.65|2.16
f1|yellow92|YELLOW 92|YELLOW LINE|f1|Gelb, hoher Heckflügel.|#e6c84a|#111111|4.3|1.84|0.32|0.5|0.9|0.1|57|33|9.4|3.6|2.12
f1|black93|BLACK 93|BLACK LINE|f1|Schwarz, goldene Nase.|#111111|#d4b46a|4.28|1.8|0.32|0.64|0.7|0.08|57|33|9.5|3.7|2.14
f1|silver96|SILVER 96|SILVER LINE|f1|Silberne Haltung, ohne Pfeil.|#d9dde4|#111111|4.4|1.86|0.3|0.7|0.82|0.1|60|35|10.1|3.9|2.16
f1|dart97|DART 97|DART|f1|Rote Nase, weißer Körper.|#f3efe4|#c41822|4.36|1.82|0.32|0.72|0.74|0.08|57|33|9.4|3.7|2.18
f1|fluo91|FLUO 91|FLUO|f1|Neongelb, schwarz, laut.|#e6c84a|#141414|4.24|1.82|0.33|0.48|0.68|0.1|56|32|9.1|3.55|2.2
f1|navy96|NAVY 96|NAVY|f1|Dunkelblau, gelbe Bahn.|#1a2744|#e6c84a|4.38|1.84|0.31|0.66|0.76|0.1|58|33|9.6|3.75|2.14
f1|gold98|GOLD 98|GOLD LINE|f1|Gold und schwarz, späte Neunziger.|#d4b46a|#111111|4.46|1.76|0.3|0.8|0.9|0.08|61|36|10.3|3.95|2.18
f1|carbon95|CARBON 95|CARBON|f1|Dunkle Schale, bunte Nase.|#141414|#c41822|4.3|1.8|0.32|0.74|0.72|0.08|58|34|9.7|3.75|2.16
f1|long94|LONG 94|LONG LINE|f1|Längerer Radstand, ruhiger.|#f3efe4|#1a6b6b|4.55|1.78|0.32|0.52|0.58|0.06|56|30|9.2|3.8|2.0
f1|short93|SHORT 93|SHORT LINE|f1|Kurz, wendig, hoher Flügel.|#1f6b3a|#f3efe4|4.05|1.8|0.33|0.42|0.95|0.1|55|33|9.0|3.5|2.3
f1|red98|RED 98|ROSSO LINE|f1|Rote schmale Nase, spät.|#9e1b2e|#f3efe4|4.44|1.74|0.3|0.84|0.86|0.06|60|35|10.2|4.0|2.2
f1|white99|WHITE 99|WHITE LINE|f1|Weiß, dünne Flügel, Rillen-Ära.|#f3efe4|#1a3f8a|4.5|1.72|0.3|0.86|0.84|0.05|61|35|10.4|4.05|2.18
f1|green94|GREEN 94|GREEN LINE|f1|Grün, gelbe Nase, laut.|#1f6b3a|#e6c84a|4.22|1.8|0.33|0.5|0.7|0.1|56|32|9.1|3.55|2.22
`;

function num(value: string) {
  return Number(value);
}

function parseCatalog(raw: string): Blueprint[] {
  return raw
    .trim()
    .split("\n")
    .map((line) => {
      const [klass, id, name, house, kind, blurb, body, accent, L, W, H, nose, wing, flare, maxSpeed, accel, grip, driftGrip, turn] =
        line.split("|");
      return {
        id: id!,
        name: name!,
        house: house!,
        klass: klass as CarClass,
        kind: kind as Kind,
        blurb: blurb!,
        body: body!,
        accent: accent!,
        L: num(L!),
        W: num(W!),
        H: num(H!),
        nose: num(nose!),
        wing: num(wing!),
        flare: num(flare!),
        maxSpeed: num(maxSpeed!),
        accel: num(accel!),
        grip: num(grip!),
        driftGrip: num(driftGrip!),
        turn: num(turn!),
      };
    });
}

export const CATALOG: Blueprint[] = parseCatalog(RAW);
export const DEFAULT_CAR = "q40";
export const SHOWCASE = ["q40", "azra", "ridge32", "spin-fd", "ring-e30", "pony-gt"];

const BY_ID: Record<string, Blueprint> = Object.fromEntries(CATALOG.map((car) => [car.id, car]));

export function blueprint(id: string): Blueprint {
  return BY_ID[id] ?? BY_ID[DEFAULT_CAR]!;
}

function clamp(v: number, a: number, b: number) {
  return Math.max(a, Math.min(b, v));
}

function bars(maxSpeed: number, grip: number, driftGrip: number) {
  return {
    tempo: clamp(Math.round((maxSpeed - 32) / 6), 1, 5),
    gripStat: clamp(Math.round((grip - 4.2) / 1.25), 1, 5),
    driftStat: clamp(Math.round((3.3 - driftGrip) * 2.1), 1, 5),
  };
}

const STAGE_SPEED = [1, 1.06, 1.12, 1.2];
const STAGE_ACCEL = [1, 1.08, 1.16, 1.28];
const STAGE_GRIP = [1, 1.04, 1.08, 1.12];

function part(x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, slot: Slot = "body"): Part {
  return { x, y, z, sx, sy, sz, color, slot };
}

function mirror(parts: Part[]): Part[] {
  const out: Part[] = [];
  for (const item of parts) {
    out.push(item);
    if (Math.abs(item.x) > 0.05) out.push({ ...item, x: -item.x });
  }
  return out;
}

function shapeRoad(bp: Blueprint, stage: Stage): { parts: Part[]; wheels: WheelSpec[] } {
  const wide = bp.W * (1 + bp.flare * 0.08 + (stage >= 2 ? 0.07 : 0) + (stage === 3 ? 0.05 : 0));
  const ride = Math.max(0.2, bp.H * 0.34 - stage * 0.03);
  const L = bp.L;
  const zNose = -L * 0.48;
  const zTail = L * 0.46;
  const cabH = bp.kind === "suv" || bp.kind === "van" || bp.kind === "truck" ? bp.H * 0.55 : bp.kind === "wedge" ? bp.H * 0.28 : bp.H * 0.42;
  const cabL = bp.kind === "wagon" || bp.kind === "van" ? L * 0.46 : bp.kind === "hatch" ? L * 0.36 : bp.kind === "truck" ? L * 0.28 : L * 0.3;
  const cabZ = bp.kind === "truck" ? -L * 0.12 : bp.kind === "wedge" ? -L * 0.02 : L * 0.02;
  const list: Part[] = [];
  const add = (x: number, y: number, z: number, sx: number, sy: number, sz: number, color: string, slot: Slot = "body") => {
    list.push(part(x, y, z, sx, sy, sz, color, slot));
  };
  add(0, ride, 0.02, wide * 0.9, bp.H * 0.36, L * 0.82, bp.body);
  add(0, ride + bp.H * 0.16, -L * (0.16 + bp.nose * 0.08), wide * 0.78, bp.H * 0.12, L * (0.26 + bp.nose * 0.08), bp.body);
  if (bp.kind === "wedge" || bp.kind === "roadster") {
    add(0, ride + bp.H * 0.28, cabZ, wide * 0.55, cabH, cabL, GLASS, "glass");
  } else {
    add(0, ride + bp.H * 0.22 + cabH * 0.35, cabZ, wide * 0.72, cabH, cabL, bp.body);
    add(0, ride + bp.H * 0.34 + cabH * 0.2, cabZ - cabL * 0.48, wide * 0.6, cabH * 0.45, 0.08, GLASS, "glass");
    if (bp.kind !== "truck") add(0, ride + bp.H * 0.34 + cabH * 0.15, cabZ + cabL * 0.48, wide * 0.58, cabH * 0.38, 0.08, GLASS, "glass");
    add(wide * 0.36, ride + bp.H * 0.32 + cabH * 0.2, cabZ, 0.06, cabH * 0.4, cabL * 0.7, GLASS, "glass");
  }
  if (bp.kind === "truck") add(0, ride + bp.H * 0.18, L * 0.16, wide * 0.88, bp.H * 0.28, L * 0.38, bp.accent);
  if (bp.kind === "suv" || bp.kind === "van") add(0, ride + bp.H * 0.62, L * 0.02, wide * 0.8, bp.H * 0.16, L * 0.5, bp.body);
  add(0, ride + bp.H * 0.12, zTail, wide * 0.9, bp.H * 0.28, 0.12, bp.body);
  add(wide * 0.32, ride + bp.H * 0.2, zTail + 0.02, bp.kind === "van" ? 0.2 : 0.28, 0.1, 0.06, TAIL, "tail");
  add(wide * 0.28, ride + bp.H * 0.16, zNose, 0.22, 0.08, 0.06, HEAD, "head");
  add(0, ride + bp.H * 0.4, 0, 0.1 + bp.nose * 0.08, 0.04, L * 0.62, bp.accent, "trim");
  if (bp.wing > 0.45 || stage >= 1) {
    add(0, ride + bp.H * 0.2, -L * 0.22, 0.22, 0.08, 0.28, bp.accent);
  }
  const wing = bp.wing + stage * 0.34;
  if (wing > 0.18) {
    const wh = 0.12 + wing * 0.42;
    add(wide * 0.34, ride + bp.H * 0.35, zTail - 0.12, 0.06, wh, 0.06, BLACK);
    add(0, ride + bp.H * 0.35 + wh, zTail - 0.1, wide * (0.72 + wing * 0.2), 0.06, 0.22 + stage * 0.08, stage >= 3 ? bp.accent : bp.body);
  }
  if (stage >= 2 || bp.flare > 0.45) {
    add(wide * 0.46, ride * 0.8, -L * 0.22, 0.14, 0.16, 0.4, bp.accent);
    add(wide * 0.46, ride * 0.8, L * 0.22, 0.14, 0.16, 0.4, bp.accent);
  }
  if (stage >= 3) {
    add(0, ride - 0.02, zNose + 0.08, wide * 0.82, 0.04, 0.2, BLACK, "trim");
    add(wide * 0.4, ride + bp.H * 0.18, zNose + 0.2, 0.16, 0.05, 0.18, bp.accent, "trim");
  }
  const wz = L * 0.31;
  const wx = wide * 0.46;
  return { parts: mirror(list), wheels: [{ x: wx, z: -wz }, { x: wx, z: wz }] };
}

function shapeF1(bp: Blueprint, stage: Stage): { parts: Part[]; wheels: WheelSpec[] } {
  const L = bp.L;
  const W = bp.W + stage * 0.04;
  const y = 0.28;
  const nose = 0.35 + bp.nose * 0.45;
  const list: Part[] = [];
  const add = (x: number, y0: number, z: number, sx: number, sy: number, sz: number, color: string, slot: Slot = "body") => {
    list.push(part(x, y0, z, sx, sy, sz, color, slot));
  };
  add(0, y, -L * 0.28, 0.32, 0.22, L * 0.42, bp.body);
  add(0, y + 0.02, -L * (0.42 + nose * 0.08), 0.22, 0.16, L * nose * 0.35, bp.accent);
  add(0, y - 0.02, -L * 0.48, W * (0.85 + stage * 0.04), 0.06, 0.28 + bp.wing * 0.12, bp.body);
  add(W * 0.38, y + 0.08, -L * 0.48, 0.05, 0.16 + stage * 0.04, 0.22, bp.accent, "trim");
  add(0, y + 0.18, -L * 0.05, 0.46, 0.2, 0.55, bp.body);
  add(0, y + 0.34, -L * 0.02, 0.38, 0.08, 0.28, GLASS, "glass");
  add(0.42, y + 0.08, 0.15, 0.55, 0.2, L * 0.28, bp.body);
  add(0, y + 0.16, L * 0.22, 0.48, 0.24, L * 0.22, bp.accent);
  const rear = 0.35 + bp.wing * 0.35 + stage * 0.12;
  add(0.5, y + 0.15, L * 0.4, 0.06, rear, 0.06, BLACK);
  add(0, y + 0.15 + rear, L * 0.4, W * 0.7, 0.06, 0.34, bp.body);
  add(0, y + 0.05 + rear * 0.45, L * 0.36, W * 0.55, 0.05, 0.16, bp.accent);
  if (stage >= 2) add(0.28, y + 0.05, -L * 0.12, 0.2, 0.08, 0.35, bp.accent, "trim");
  if (stage >= 3) add(0, y + 0.02, L * 0.12, 0.7, 0.04, 0.5, BLACK, "trim");
  add(0.18, y + 0.2, L * 0.46, 0.08, 0.08, 0.06, TAIL, "tail");
  add(0.12, y + 0.12, -L * 0.5, 0.1, 0.06, 0.05, HEAD, "head");
  const wx = W * 0.42;
  return {
    parts: mirror(list),
    wheels: [
      { x: wx, z: -L * 0.32 },
      { x: wx, z: L * 0.3 },
    ],
  };
}

const CACHE = new Map<string, CarDef>();

export function resolveCar(id: string, stage: Stage = 0): CarDef {
  const key = `${id}:${stage}`;
  const hit = CACHE.get(key);
  if (hit) return hit;
  const bp = blueprint(id);
  const speed = bp.maxSpeed * STAGE_SPEED[stage]!;
  const accel = bp.accel * STAGE_ACCEL[stage]!;
  const grip = bp.grip * STAGE_GRIP[stage]!;
  const driftGrip = bp.driftGrip * (stage === 0 ? 1 : stage === 3 ? 0.9 : 0.96);
  const turn = bp.turn * (1 + stage * 0.03);
  const built = bp.kind === "f1" ? shapeF1(bp, stage) : shapeRoad(bp, stage);
  const stat = bars(speed, grip, driftGrip);
  const car: CarDef = {
    id: bp.id,
    name: stage === 0 ? bp.name : `${bp.name} S${stage}`,
    house: bp.house,
    blurb: bp.blurb,
    klass: bp.klass,
    stage,
    tempo: stat.tempo,
    gripStat: stat.gripStat,
    driftStat: stat.driftStat,
    maxSpeed: speed,
    accel,
    grip,
    driftGrip,
    turn,
    paint: bp.body,
    rim: stage >= 2 ? "#d4b46a" : "#9aa0a8",
    parts: built.parts,
    wheels: built.wheels,
  };
  CACHE.set(key, car);
  return car;
}

export const CARS: CarDef[] = CATALOG.map((car) => resolveCar(car.id, 0));
export const CAR_BY_ID: Record<string, CarDef> = Object.fromEntries(CARS.map((car) => [car.id, car]));
