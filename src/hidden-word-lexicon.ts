type Word=[noun:string,signature:string]
type Pair=[clue1:string,clue2:string,first:Word,second:Word]
type Cluster=[clue1:string,clue2:string,...pairs:Pair[]]

const clusters:Cluster[]=[
 ['produce','fruit bowl',
  ['orchard harvest','pome fruit',['apple','cider press'],['pear','teardrop shape']],
  ['smoothie bar','tropical harvest',['banana','yellow bunch'],['mango','chutney']],
  ['preserves','purple crop',['grape','winemaking'],['plum','prune']]],
 ['watercraft','dockside',
  ['paddle sport','narrow hull',['canoe','single blade'],['kayak','spray skirt']],
  ['river traffic','cargo berth',['ferry','passenger crossing'],['barge','flat deck']],
  ['marina','leisure craft',['yacht','luxury cabin'],['sailboat','mainsail']]],
 ['birdwatching','feathers',
  ['bird of prey','talons',['owl','night hunter'],['hawk','sharp eyesight']],
  ['seabird colony','black and white plumage',['penguin','flightless swimmer'],['puffin','colorful beak']],
  ['songbird','garden perch',['robin','red breast'],['sparrow','brown flock']]],
 ['music lesson','orchestra pit',
  ['frets','strumming',['guitar','six strings'],['ukulele','island strum']],
  ['bowed strings','rosin',['cello','endpin'],['violin','chin rest']],
  ['percussion','rhythm section',['drum','snare'],['tambourine','metal jingles']]],
 ['architecture','country structures',
  ['lookout','elevated platform',['lighthouse','coastal beacon'],['watchtower','guard post']],
  ['glazed building','botanical shelter',['greenhouse','plant nursery'],['conservatory','sunroom']],
  ['farm building','livestock quarters',['barn','hayloft'],['stable','horse stall']]],
 ['textiles','fabric shop',
  ['plant fiber','summer cloth',['linen','flax'],['cotton','boll']],
  ['evening wear','luster',['silk','cocoon thread'],['satin','glossy weave']],
  ['winter fabric','warm fibers',['wool','sheep fleece'],['felt','compressed fibers']]],
 ['forecast','meteorology',
  ['water vapor','low visibility',['fog','dense bank'],['mist','fine veil']],
  ['frozen precipitation','winter clouds',['snow','flakes'],['hail','ice pellets']],
  ['storm front','storm warning',['thunder','rumble'],['lightning','electric bolt']]],
 ['hand tools','workbench',
  ['striking tool','impact',['hammer','nail driver'],['mallet','rubber head']],
  ['mechanic kit','metal grip',['wrench','hex nut'],['pliers','pinching jaws']],
  ['shaping tool','finishing work',['chisel','wood carving'],['file','abrasive teeth']]],
 ['astronomy','telescope view',
  ['orbital body','solar system',['planet','world in orbit'],['moon','natural satellite']],
  ['small body','inner space',['comet','dust tail'],['asteroid','rocky belt']],
  ['deep sky','stellar nursery',['star','fusion core'],['nebula','interstellar cloud']]],
 ['paper goods','stationery shelf',
  ['bound pages','handwriting',['notebook','lecture notes'],['journal','private diary']],
  ['navigation print','geography',['atlas','bound maps'],['map','foldout chart']],
  ['postal mail','stamp corner',['letter','sealed correspondence'],['postcard','holiday picture']]],
 ['place setting','tableware',
  ['cutlery','utensil drawer',['spoon','soup scoop'],['fork','tines']],
  ['serving dish','ceramic setting',['bowl','deep basin'],['plate','flat platter']],
  ['drinkware','hot beverage',['cup','saucer'],['mug','large handle']]],
 ['horticulture','garden bed',
  ['flower bloom','bouquet stem',['rose','thorn'],['tulip','spring bulb']],
  ['climbing plant','trellis',['ivy','wall creeper'],['vine','grape tendril']],
  ['drought plant','arid collection',['cactus','spines'],['succulent','fleshy leaves']]],
 ['shoreline','coastal terrain',
  ['sand formation','seaside sand',['beach','tide line'],['dune','windblown mound']],
  ['rock formation','sea erosion',['cliff','steep face'],['cave','hollow chamber']],
  ['tropical waters','snorkel spot',['reef','coral colony'],['lagoon','enclosed shallows']]],
 ['wardrobe','clothing accessory',
  ['draped cloth','winter wrap',['scarf','neck knot'],['shawl','shoulder drape']],
  ['hand covering','winter hands',['glove','separate fingers'],['mitten','shared finger pocket']],
  ['headwear','brim',['hat','wide brim'],['cap','baseball visor']]],
 ['camping gear','outdoor kit',
  ['camp shelter','weather cover',['tent','camp poles'],['tarp','waterproof sheet']],
  ['portable light','after-dark gear',['lantern','hanging light'],['torch','handheld beam']],
  ['field optics and navigation','trail tools',['compass','magnetic needle'],['binoculars','paired eyepieces']]],
 ['timekeeping','schedule cues',
  ['time display','dial hands',['clock','wall dial'],['watch','wrist strap']],
  ['date keeping','desk schedule',['calendar','month grid'],['planner','appointment book']],
  ['interval measure','countdown',['timer','kitchen alarm'],['hourglass','falling sand']]],
]

export type Clue={word:string;score:number}
export type ClueStage=1|2|3
const index=new Map<string,Readonly<Record<ClueStage,readonly Clue[]>>>()
for(const [first,second,...pairs] of clusters){
 const broad=[{word:first,score:95},{word:second,score:95}]
 for(const [a,b,...words] of pairs){
  const near=[{word:a,score:97},{word:b,score:96}]
  for(const [noun,signature] of words)index.set(noun,{1:broad,2:near,3:[{word:signature,score:99}]})
 }
}

export const hiddenNouns=[...index.keys()].sort()
export const hiddenClues=(noun:string,stage:ClueStage)=>index.get(noun)?.[stage]??[]
export function hiddenScore(noun:string,clue:string){
 const deck=index.get(noun)
 return deck?Object.values(deck).flat().find(c=>c.word===clue)?.score??0:0
}
