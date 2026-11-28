import type {ReactNode} from 'react'
import type {GalleryObject} from './fragments'

export const artifactTones=[
 ['#b9e6c4','#5fb39c','#255e58'],
 ['#ffe19b','#e8a14f','#8b481d'],
 ['#e6c3ec','#aa7db7','#56385e'],
 ['#ffbeb0','#d3656f','#872e38'],
] as const

export const artifactArt:Record<GalleryObject['item'],ReactNode>={
 Vase:<>
  <path d="M-11-24H11V-19L7-17v5C7-8 14-7 18-2q9 13 0 20l-5 2 1 4h-28l1-4q-15-6-7-20c3-5 13-9 13-12v-5l-4-2Z"/>
  <path className="cabinet-incise" d="M-11-19h22m-18 5H7m-25 14Q0 7 18 0m-36 13q18 8 36 0m-31 7h26"/>
  <path className="cabinet-gleam" d="M-10-22H8M-12-2q-9 6-6 11m4 3Q0 17 14 12"/>
  <path className="cabinet-incise" d="m-10 8 4-3 6 5 6-5 4 3m-10-5 2 2-2 2-2-2Z"/>
 </>,
 Key:<g transform="rotate(23)">
  <path fillRule="evenodd" d="M-26 0a11 11 0 0 1 21-5h28l5 5-4 5h-3v8h-5V6h-4v4H7V5H-5A11 11 0 0 1-26 0Zm6 0a5 5 0 1 0 10 0 5 5 0 1 0-10 0Z"/>
  <path className="cabinet-gleam" d="M-23-2q1-7 8-7m11 6H22M-1-1H24"/>
  <path className="cabinet-incise" d="M-4-4v8m3-8v8m18 1v5m-38-4 2 2m2-1 2 1"/>
 </g>,
 Gem:<>
  <path d="M-28-8-17-21H17L28-8 0 23Z"/>
  <path className="cabinet-facet" d="m-28-8 11-13 5 13Zm16 0L0-21l12 13Zm24 0 5-13L28-8ZM-12-8H12L0 23Z"/>
  <path className="cabinet-shade" d="M12-8h16L0 23ZM0-21h17L12-8Z"/>
  <path className="cabinet-incise" d="M-28-8h56m-45-13 5 13L0 23 12-8l5-13M-12-8 0-21 12-8"/>
  <path className="cabinet-gleam" d="m-24-9 8-9h9m-1 13L0 16"/>
 </>,
 Cup:<>
  <path fillRule="evenodd" d="M16-9q13-7 13 1Q31 5 12 9l1-5q13-3 12-11-1-4-10 1Z"/>
  <path d="M-22-15H19q0 21-17 24l1 10 12 3v4h-31v-4l12-3 1-10q-17-3-19-24Z"/>
  <ellipse cx="-1.5" cy="-15" rx="20.5" ry="4.5"/>
  <path className="cabinet-shade" d="M-17-15q15-4 31 0-14 5-31 0Z"/>
  <path className="cabinet-gleam" d="M-16-7q3 11 13 13m-10 17h22"/>
  <path className="cabinet-incise" d="M-16-7Q-2 1 14-7M-12 0q10 6 20 0m-11 10h5m-6 9h7"/>
 </>,
 Crown:<>
  <path d="m-25-15 13 10L0-20 12-5l13-10-6 34q-19 5-38 0Z"/>
  <circle cx="-25" cy="-15" r="3.5"/><circle cx="0" cy="-21" r="3.8"/><circle cx="25" cy="-15" r="3.5"/>
  <path className="cabinet-shade" d="M-20 10q20 5 40 0l-1 9q-19 5-38 0Z"/>
  <path className="cabinet-incise" d="M-20 10q20 5 40 0M-18 17q18 5 36 0m-37-27 4 17m34-17L15 7"/>
  <path className="cabinet-facet" d="M0-9 5-2 0 5l-5-7Z"/>
  <path className="cabinet-gleam" d="m0-9 5 7-5 7-5-7Zm-9 24 3 .4m10 .3 3-.5m-19-15 1 2 2-1m18 0 2 1 1-2"/>
 </>,
 Bell:<>
  <path d="M-4-19q-6-8 4-8t4 8Zm-2 34h12v5a6 6 0 0 1-12 0Z"/>
  <path d="M0-21q16 0 17 20 0 7 7 13v4q-24 8-48 0v-4q7-6 7-13 1-20 17-20Z"/>
  <path className="cabinet-incise" d="M-24 12q24 7 48 0M-16 4q16 5 32 0m-29-16q13 6 26 0"/>
  <path className="cabinet-gleam" d="M-7-16q-7 4-7 14m-5 17q18 5 38 0m-17 8-2 1"/>
  <path className="cabinet-incise" d="m0-9 4 4-4 5-4-5Z"/>
 </>,
 Leaf:<>
  <path d="M-24 21q6-4 8-9-6-10 2-21l4 1 1-5 8-6 2 2 7-6 18-3-1 15-4 9-3 1 1 4-7 8-5 1v3q-12 8-21 3l-7 8Z"/>
  <path className="cabinet-facet" d="M-16 12Q4-8 26-26l-18 3-7 6-2-2-8 6-1 5-4-1q-8 11-2 21Z"/>
  <path className="cabinet-incise" d="M-20 20Q-5 3 22-22m-32 31-4-10m11 3-2-13m9 5 1-11m-12 26 12 1m-5-8 13-1m-6-6 12-4"/>
  <path className="cabinet-gleam" d="M-15 5q-3-8 4-14m16-9 14-5"/>
 </>,
 Compass:<>
  <path d="M-5-22v-5h10v5Z"/>
  <circle r="24"/><circle r="19" className="cabinet-shade"/>
  <circle r="18" className="cabinet-gleam"/>
  <path className="cabinet-incise" d="M-15 0h3m24 0h3M0-15v3m0 24v3m-10-25 2 2m16 16 2 2m0-20-2 2m-16 16-2 2"/>
  <path d="m8-12-3 17-13 7 3-17Z"/>
  <path className="cabinet-facet" d="m8-12-3 17-10-10Z"/>
  <circle r="2.3" fill="#f5d28f"/><path className="cabinet-gleam" d="M-20-8q4-12 15-12m11 40q7-1 11-6"/>
 </>,
 Lantern:<>
  <path fillRule="evenodd" d="M-8-19v-3a8 8 0 0 1 16 0v3Zm3 0h10v-3a5 5 0 0 0-10 0Z"/>
  <path d="M-10-20H10l1 6 9 8H-20l9-8ZM-17-6h34v24h-34ZM-19 18h38l3 6h-44Z"/>
  <path className="cabinet-shade" d="M-11-5h22v22h-22Z"/>
  <path d="M0 15q-10-1-6-8l3 2q-2-6 4-11-1 4 4 8 5 6-5 9Z" fill="#f7ce83"/>
  <path className="cabinet-incise" d="M-12-5v21m24-21v21M-16-4v20m32-20v20M-15-11h30M-8-16H8m-26 38h36"/>
  <path className="cabinet-gleam" d="M-13-4v19m0-25h25m-27 30h30"/>
 </>,
}
