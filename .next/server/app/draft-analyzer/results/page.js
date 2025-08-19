(()=>{var e={};e.id=890,e.ids=[890],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},1476:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>n.a,__next_app__:()=>x,originalPathname:()=>p,pages:()=>c,routeModule:()=>h,tree:()=>d}),r(8615),r(1506),r(5866);var a=r(3191),i=r(8716),s=r(7922),n=r.n(s),l=r(5231),o={};for(let e in l)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(o[e]=()=>l[e]);r.d(t,o);let d=["",{children:["draft-analyzer",{children:["results",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,8615)),"/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/results/page.tsx"]}]},{}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,1506)),"/Users/kanikameister/Documents/ff_api_skeleton/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,5866,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/results/page.tsx"],p="/draft-analyzer/results/page",x={require:r,loadChunk:()=>Promise.resolve()},h=new a.AppPageRouteModule({definition:{kind:i.x.APP_PAGE,page:"/draft-analyzer/results/page",pathname:"/draft-analyzer/results",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},91:(e,t,r)=>{Promise.resolve().then(r.bind(r,9053))},3463:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,2994,23)),Promise.resolve().then(r.t.bind(r,6114,23)),Promise.resolve().then(r.t.bind(r,9727,23)),Promise.resolve().then(r.t.bind(r,9671,23)),Promise.resolve().then(r.t.bind(r,1868,23)),Promise.resolve().then(r.t.bind(r,4759,23))},5303:()=>{},9053:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>x,dynamic:()=>n});var a=r(326),i=r(7577),s=r(5047);let n="force-dynamic",l=`
  .scoreboard { 
    display: block; 
    overflow-x: auto; 
  }
  
  .shrinkwrap { 
    display: inline-block; 
    max-width: 100%; 
  }
  
  .scoreTable { 
    display: table !important;
    table-layout: fixed !important;
    width: 660px !important;
    border-collapse: collapse;
    font-size: 12px;
  }
  
  .scoreTable col.col-rank { width: 60px !important; }
  .scoreTable col.col-team { width: 200px !important; }
  .scoreTable col.col-grade { width: 100px !important; }
  .scoreTable col.col-opt { width: 100px !important; }
  .scoreTable col.col-bench { width: 100px !important; }
  .scoreTable col.col-total { width: 100px !important; }
  
  .scoreTable th, .scoreTable td {
    padding: 8px 10px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
    border-bottom: 1px solid #e5e7eb;
  }
  
  .scoreTable th {
    background: linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%);
    border-bottom: 2px solid #cbd5e1;
    font-weight: 600;
    color: #374151;
  }
  
  .scoreTable th:nth-child(1),
  .scoreTable td:nth-child(1),
  .scoreTable th:nth-child(3),
  .scoreTable td:nth-child(3),
  .scoreTable th:nth-child(4),
  .scoreTable td:nth-child(4),
  .scoreTable th:nth-child(5),
  .scoreTable td:nth-child(5),
  .scoreTable th:nth-child(6),
  .scoreTable td:nth-child(6) { 
    text-align: center; 
  }
  
  .scoreTable th:nth-child(2),
  .scoreTable td:nth-child(2) { 
    text-align: left; 
  }
  
  .scoreTable tr {
    transition: background-color 0.2s ease;
    cursor: pointer;
  }
  
  .scoreTable tr:hover {
    background-color: #f8fafc;
  }
  
  .rank-display {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 4px;
  }
  
  .rank-circle {
    width: 32px;
    height: 32px;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    color: white;
    font-weight: 700;
    font-size: 12px;
  }
  
  .rank-circle.rank-1 {
    background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  }
  
  .rank-circle.rank-2 {
    background: linear-gradient(135deg, #94a3b8 0%, #64748b 100%);
  }
  
  .rank-circle.rank-3 {
    background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
  }
  
  .rank-circle:not(.rank-1):not(.rank-2):not(.rank-3) {
    background: linear-gradient(135deg, #e2e8f0 0%, #cbd5e1 100%);
  }
  
  .rank-medal {
    font-size: 8px;
    font-weight: 600;
    color: #92400e;
    text-transform: uppercase;
  }
  
  .team-name {
    font-weight: 600;
    color: #0f172a;
  }
  
  .points {
    font-weight: 600;
  }
  
  .points.optimal { color: #0ea5e9; }
  .points.bench { color: #f59e0b; }
  .points.total { color: #10b981; }
`;function o({text:e,color:t="#64748b",style:r}){return a.jsx("span",{style:{display:"inline-block",padding:"2px 8px",borderRadius:999,background:`${t}20`,color:t,fontSize:12,fontWeight:700,border:`1px solid ${t}55`,...r},children:e})}function d({title:e,children:t}){return(0,a.jsxs)("div",{style:{background:"white",borderRadius:16,border:"1px solid #e9ecef",boxShadow:"0 6px 20px rgba(0,0,0,0.06)"},children:[a.jsx("div",{style:{padding:16,borderBottom:"1px solid #eef2f7",display:"flex",alignItems:"center",gap:10},children:a.jsx("h2",{style:{margin:0,color:"#1e293b",fontSize:18},children:e})}),a.jsx("div",{style:{padding:16},children:t})]})}function c({team:e}){let t=e?.optimalLineup||{},r=e?.benchPlayers||[],i=e?.positionGrades||{},s=e=>a.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(1, minmax(0, 1fr))",gap:8},children:(e||[]).map((e,t)=>(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",justifyContent:"space-between",padding:"12px 16px",background:"linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%)",border:"1px solid #e2e8f0",borderRadius:10,boxShadow:"0 1px 3px 0 rgba(0, 0, 0, 0.1)"},children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:12},children:[a.jsx(o,{text:e.position||"—",color:"#0ea5e9"}),a.jsx("div",{style:{fontWeight:600,color:"#0f172a",fontSize:14},children:e.playerName})]}),a.jsx("div",{style:{display:"flex",alignItems:"center",gap:12},children:(0,a.jsxs)("div",{style:{fontSize:12,color:"#64748b"},children:[(e.projectedPoints||0).toFixed(1)," pts"]})})]},(e.playerId||e.playerName||t)+"-lineup"))});return(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:20},children:[(0,a.jsxs)("div",{children:[(0,a.jsxs)("h4",{style:{margin:"0 0 16px",color:"#334155",fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:8},children:[a.jsx("span",{style:{width:8,height:8,background:"#10b981",borderRadius:"50%"}}),"Starters"]}),a.jsx("div",{style:{display:"grid",gap:16},children:["QB","RB","WR","TE","FLEX","DEF","K"].map(e=>{var r;let n=t[e]||[],l=i[e];return(0,a.jsxs)("div",{style:{border:"1px solid #e2e8f0",borderRadius:12,overflow:"hidden",boxShadow:"0 1px 3px 0 rgba(0, 0, 0, 0.1)"},children:[(0,a.jsxs)("div",{style:{padding:"12px 16px",background:"linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)",display:"flex",alignItems:"center",justifyContent:"space-between",borderBottom:"1px solid #e2e8f0"},children:[(0,a.jsxs)("div",{style:{display:"flex",alignItems:"center",gap:10},children:[a.jsx(o,{text:e,color:"#4f46e5"}),l&&a.jsx(o,{text:l.grade,color:(r=l.grade).startsWith("A")?"#16a34a":r.startsWith("B")?"#22c55e":r.startsWith("C")?"#f59e0b":r.startsWith("D")?"#f97316":r.startsWith("F")?"#ef4444":"#64748b"})]}),(0,a.jsxs)("div",{style:{fontSize:12,color:"#64748b",fontWeight:500},children:[n.length>0?n.reduce((e,t)=>e+(t.projectedPoints||0),0).toFixed(1):"0"," pts"]})]}),n.length>0?s(n):(0,a.jsxs)("div",{style:{padding:"20px",textAlign:"center",color:"#64748b",fontSize:"14px",background:"#f8fafc"},children:["No players in ",e," position"]})]},e)})})]}),(0,a.jsxs)("div",{children:[(0,a.jsxs)("h4",{style:{margin:"0 0 16px",color:"#334155",fontSize:16,fontWeight:600,display:"flex",alignItems:"center",gap:8},children:[a.jsx("span",{style:{width:8,height:8,background:"#f59e0b",borderRadius:"50%"}}),"Bench"]}),0===r.length?a.jsx("div",{style:{fontSize:12,color:"#64748b",textAlign:"center",padding:"40px 20px",background:"#f8fafc",border:"2px dashed #e2e8f0",borderRadius:12},children:"No bench players"}):s(r)]})]})}function p(){let e=(0,s.useSearchParams)(),t=(0,i.useMemo)(()=>e.get("draftUrl")||"",[e]),r=(0,i.useMemo)(()=>e.get("leagueType")||"standard",[e]),[n,p]=(0,i.useState)(!1),[x,h]=(0,i.useState)(""),[f,g]=(0,i.useState)(null),b=(0,i.useMemo)(()=>(f?.analysis?.teams||[]).map(e=>{let t=e?.optimalLineupPoints??0;return{...e,__rankScore:t}}).sort((e,t)=>(t.__rankScore||0)-(e.__rankScore||0)),[f]),m=e=>e&&e.overallGrade?{grade:e.overallGrade.grade||"—",score:e.overallGrade.score||0,summary:e.overallGrade.summary||"No summary available",breakdown:e.overallGrade.breakdown||{}}:{grade:"—",score:0,summary:"No grade available"},u=e=>e.startsWith("A")?"#10B981":e.startsWith("B")?"#3B82F6":e.startsWith("C")?"#F59E0B":e.startsWith("D")?"#EF4444":"#6B7280",y=(e=>{let t={standard:{name:"Standard (1 QB)",starters:9,description:"QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1"},superflex:{name:"\uD83E\uDDB8 Superflex",starters:9,description:"QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 1 (QB/RB/WR/TE), DEF: 1, K: 1"},"2qb":{name:"⚖️ 2 QB",starters:10,description:"QB: 2, RB: 2, WR: 2, TE: 1, FLEX: 1, DEF: 1, K: 1"},"2flex":{name:"\uD83D\uDD04 2 Flex",starters:10,description:"QB: 1, RB: 2, WR: 2, TE: 1, FLEX: 2, DEF: 1, K: 1"},"robs-bullshit":{name:"\uD83D\uDCA9 Rob's Bullshit",starters:12,description:"QB: 2, RB: 2, WR: 3, TE: 1, FLEX: 2, DEF: 1, K: 1"}};return t[e]||t.standard})(r);return(0,a.jsxs)("div",{children:[a.jsx("style",{dangerouslySetInnerHTML:{__html:l}}),(0,a.jsxs)("div",{style:{background:"linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",color:"white",padding:"30px",textAlign:"center"},children:[a.jsx("a",{href:"/draft-analyzer",style:{display:"inline-block",padding:"10px 20px",background:"rgba(255,255,255,0.2)",color:"white",textDecoration:"none",borderRadius:"5px",marginBottom:"20px",fontSize:"14px"},children:"← Back"}),a.jsx("h1",{style:{fontSize:"2.0rem",marginBottom:"10px",textShadow:"2px 2px 4px rgba(0,0,0,0.3)"},children:"\uD83D\uDCCA Draft Analysis Results"}),a.jsx("p",{style:{fontSize:"0.95rem",opacity:.9,wordBreak:"break-all"},children:t})]}),x&&(0,a.jsxs)("div",{style:{padding:"20px",margin:"20px",background:"#fee2e2",color:"#991b1b",border:"1px solid #fecaca",borderRadius:"10px",textAlign:"center"},children:["❌ ",x]}),n&&a.jsx("div",{style:{padding:"30px",textAlign:"center"},children:"\uD83D\uDD04 Analyzing draft..."}),!n&&!x&&f&&(0,a.jsxs)("div",{style:{padding:"20px",display:"grid",gap:20,width:"100%",maxWidth:"100%",overflow:"hidden",boxSizing:"border-box"},children:[(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(280px, 1fr))",gap:20},children:[a.jsx(d,{title:"Overview",children:(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(100px, 1fr))",gap:12},children:[(0,a.jsxs)("div",{children:[a.jsx("div",{style:{color:"#64748b",fontSize:12},children:"Name"}),a.jsx("div",{style:{fontWeight:700},children:f?.draftInfo?.name})]}),(0,a.jsxs)("div",{children:[a.jsx("div",{style:{color:"#64748b",fontSize:12},children:"Teams"}),a.jsx("div",{style:{fontWeight:700},children:f?.draftInfo?.teams})]}),(0,a.jsxs)("div",{children:[a.jsx("div",{style:{color:"#64748b",fontSize:12},children:"Rounds"}),a.jsx("div",{style:{fontWeight:700},children:f?.draftInfo?.rounds})]}),(0,a.jsxs)("div",{children:[a.jsx("div",{style:{color:"#64748b",fontSize:12},children:"Total Picks"}),a.jsx("div",{style:{fontWeight:700},children:f?.draftInfo?.totalPicks})]})]})}),a.jsx(d,{title:"Settings",children:a.jsx("div",{style:{color:"#64748b",fontSize:12},children:y.description})})]}),a.jsx(d,{title:"\uD83C\uDFC6 Scoreboard (Ranked by Optimal Lineup Points)",children:a.jsx("div",{className:"scoreboard",children:a.jsx("div",{className:"shrinkwrap",children:(0,a.jsxs)("table",{className:"scoreTable",children:[(0,a.jsxs)("colgroup",{children:[a.jsx("col",{className:"col-rank"}),a.jsx("col",{className:"col-team"}),a.jsx("col",{className:"col-grade"}),a.jsx("col",{className:"col-opt"}),a.jsx("col",{className:"col-bench"}),a.jsx("col",{className:"col-total"})]}),a.jsx("thead",{children:(0,a.jsxs)("tr",{children:[a.jsx("th",{children:"Rank"}),a.jsx("th",{children:"Team"}),a.jsx("th",{children:"Grade"}),a.jsx("th",{children:"Optimal"}),a.jsx("th",{children:"Bench"}),a.jsx("th",{children:"Total"})]})}),a.jsx("tbody",{children:b.map((e,t)=>{let r=m(e).grade,i=e?.optimalLineupPoints??0,s=e?.benchPoints??0,n=e?.totalProjectedPoints??0,l=r&&"—"!==r?r.startsWith("A")?"#16a34a":r.startsWith("B")?"#22c55e":r.startsWith("C")?"#f59e0b":"#ef4444":"#64748b";return(0,a.jsxs)("tr",{children:[a.jsx("td",{children:(0,a.jsxs)("div",{className:"rank-display",children:[a.jsx("div",{className:`rank-circle rank-${t+1}`,children:t+1}),t<3&&a.jsx("div",{className:"rank-medal",children:0===t?"\uD83E\uDD47":1===t?"\uD83E\uDD48":"\uD83E\uDD49"})]})}),a.jsx("td",{children:a.jsx("div",{className:"team-name",children:e.teamName||`Team ${e.teamId}`})}),a.jsx("td",{children:a.jsx(o,{text:r,color:l})}),a.jsx("td",{children:a.jsx("div",{className:"points optimal",children:i.toFixed(1)})}),a.jsx("td",{children:a.jsx("div",{className:"points bench",children:s.toFixed(1)})}),a.jsx("td",{children:a.jsx("div",{className:"points total",children:n.toFixed(1)})})]},e.teamId)})})]})})})}),a.jsx(d,{title:"Teams",children:a.jsx("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(400px, 1fr))",gap:20},children:(f?.analysis?.teams||[]).map(e=>{let t=m(e),r=u(t.grade);return(0,a.jsxs)("div",{style:{background:"linear-gradient(135deg, #ffffff 0%, #f8fafc 100%)",border:"1px solid #e2e8f0",borderRadius:16,boxShadow:"0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",overflow:"hidden"},children:[(0,a.jsxs)("div",{style:{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"20px",paddingBottom:"15px",borderBottom:"1px solid #e5e7eb"},children:[(0,a.jsxs)("div",{children:[a.jsx("h3",{style:{margin:"0 0 5px 0",fontSize:"24px",fontWeight:"bold"},children:e.teamName||`Team ${e.teamId}`}),(0,a.jsxs)("p",{style:{margin:"0",color:"#6b7280",fontSize:"14px"},children:[e.roster?.length||0," players • ",Math.round(10*(e.optimalLineupPoints||0))/10," projected points"]})]}),(0,a.jsxs)("div",{style:{textAlign:"center",padding:"15px",borderRadius:"8px",backgroundColor:"#f9fafb",border:`2px solid ${r}`,minWidth:"80px"},children:[a.jsx("div",{style:{fontSize:"32px",fontWeight:"bold",color:r,marginBottom:"5px"},children:t.grade}),(0,a.jsxs)("div",{style:{fontSize:"14px",color:"#6b7280",fontWeight:"500"},children:[t.score,"/100"]})]})]}),(0,a.jsxs)("div",{style:{display:"grid",gridTemplateColumns:"repeat(auto-fit, minmax(220px, 1fr))",gap:"15px",marginBottom:"20px"},children:[(0,a.jsxs)("div",{style:{padding:"15px",backgroundColor:"#f8fafc",borderRadius:"6px",border:"1px solid #e2e8f0"},children:[a.jsx("h4",{style:{margin:"0 0 10px 0",fontSize:"16px",fontWeight:"600"},children:"\uD83D\uDCCA Positional Balance"}),(0,a.jsxs)("div",{style:{fontSize:"24px",fontWeight:"bold",color:u(t.breakdown?.positionalBalance?.score>=80?"A":t.breakdown?.positionalBalance?.score>=60?"C":"D"),marginBottom:"5px"},children:[t.breakdown?.positionalBalance?.score||0,"/100"]}),a.jsx("p",{style:{margin:"0",fontSize:"14px",color:"#6b7280"},children:t.breakdown?.positionalBalance?.analysis||"No analysis available"})]}),(0,a.jsxs)("div",{style:{padding:"15px",backgroundColor:"#f8fafc",borderRadius:"6px",border:"1px solid #e2e8f0"},children:[a.jsx("h4",{style:{margin:"0 0 10px 0",fontSize:"16px",fontWeight:"600"},children:"\uD83C\uDFD7️ Depth Strategy"}),(0,a.jsxs)("div",{style:{fontSize:"24px",fontWeight:"bold",color:u(t.breakdown?.depthStrategy?.score>=80?"A":t.breakdown?.depthStrategy?.score>=60?"C":"D"),marginBottom:"5px"},children:[t.breakdown?.depthStrategy?.score||0,"/100"]}),a.jsx("p",{style:{margin:"0",fontSize:"14px",color:"#6b7280"},children:t.breakdown?.depthStrategy?.analysis||"No analysis available"})]}),(0,a.jsxs)("div",{style:{padding:"15px",backgroundColor:"#f8fafc",borderRadius:"6px",border:"1px solid #e2e8f0"},children:[a.jsx("h4",{style:{margin:"0 0 10px 0",fontSize:"16px",fontWeight:"600"},children:"\uD83D\uDC8E Draft Value"}),(0,a.jsxs)("div",{style:{fontSize:"24px",fontWeight:"bold",color:u(t.breakdown?.adpValue?.score>=80?"A":t.breakdown?.adpValue?.score>=60?"C":"D"),marginBottom:"5px"},children:[t.breakdown?.adpValue?.score||0,"/100"]}),a.jsx("p",{style:{margin:"0",fontSize:"14px",color:"#6b7280"},children:t.breakdown?.adpValue?.analysis||"No analysis available"})]})]}),a.jsx("div",{style:{padding:"20px"},children:a.jsx(c,{team:e})})]},e.teamId)})})}),a.jsx(d,{title:"Raw Results",children:a.jsx("pre",{style:{background:"#0b1220",color:"#e2e8f0",padding:"16px",borderRadius:12,overflow:"auto",fontSize:"12px",lineHeight:1.5},children:JSON.stringify(f,null,2)})})]})]})}function x(){return a.jsx("div",{style:{background:"linear-gradient(135deg, #0ea5e9 0%, #4f46e5 100%)",minHeight:"100vh",padding:"20px",width:"100%",maxWidth:"100vw",overflowX:"hidden",boxSizing:"border-box"},children:a.jsx("div",{style:{width:"100%",maxWidth:"100%",margin:"0 auto",background:"transparent",borderRadius:"20px",overflow:"hidden",boxSizing:"border-box"},children:a.jsx(i.Suspense,{fallback:a.jsx("div",{style:{padding:"30px",textAlign:"center"},children:"Loading..."}),children:a.jsx(p,{})})})})}},5047:(e,t,r)=>{"use strict";var a=r(7389);r.o(a,"useRouter")&&r.d(t,{useRouter:function(){return a.useRouter}}),r.o(a,"useSearchParams")&&r.d(t,{useSearchParams:function(){return a.useSearchParams}})},8615:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s,dynamic:()=>i});var a=r(8570);let i=(0,a.createProxy)(String.raw`/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/results/page.tsx#dynamic`),s=(0,a.createProxy)(String.raw`/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/results/page.tsx#default`)},1506:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>s,metadata:()=>i});var a=r(9510);let i={title:"Fantasy Football"};function s({children:e}){return a.jsx("html",{lang:"en",children:a.jsx("body",{children:e})})}}};var t=require("../../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,471],()=>r(1476));module.exports=a})();