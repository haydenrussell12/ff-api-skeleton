(()=>{var e={};e.id=931,e.ids=[931],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},9975:(e,t,a)=>{"use strict";a.r(t),a.d(t,{GlobalError:()=>i.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>g,tree:()=>l}),a(908),a(1506),a(5866);var r=a(3191),o=a(8716),n=a(7922),i=a.n(n),s=a(5231),d={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(d[e]=()=>s[e]);a.d(t,d);let l=["",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(a.bind(a,908)),"/Users/kanikameister/Documents/ff_api_skeleton/app/page.tsx"]}]},{layout:[()=>Promise.resolve().then(a.bind(a,1506)),"/Users/kanikameister/Documents/ff_api_skeleton/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(a.t.bind(a,5866,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/kanikameister/Documents/ff_api_skeleton/app/page.tsx"],p="/page",u={require:a,loadChunk:()=>Promise.resolve()},g=new r.AppPageRouteModule({definition:{kind:o.x.APP_PAGE,page:"/page",pathname:"/",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:l}})},2025:(e,t,a)=>{Promise.resolve().then(a.bind(a,8743))},3463:(e,t,a)=>{Promise.resolve().then(a.t.bind(a,2994,23)),Promise.resolve().then(a.t.bind(a,6114,23)),Promise.resolve().then(a.t.bind(a,9727,23)),Promise.resolve().then(a.t.bind(a,9671,23)),Promise.resolve().then(a.t.bind(a,1868,23)),Promise.resolve().then(a.t.bind(a,4759,23))},5303:()=>{},8743:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>o});var r=a(326);function o(){return r.jsx("div",{dangerouslySetInnerHTML:{__html:`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Fantasy Football API</title>
            <style>
                body {
                    font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
                    max-width: 1200px;
                    margin: 0 auto;
                    padding: 20px;
                    background-color: #f5f5f5;
                    line-height: 1.6;
                }
                .container {
                    background: white;
                    padding: 40px;
                    border-radius: 10px;
                    box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
                }
                h1 {
                    color: #2c3e50;
                    text-align: center;
                    margin-bottom: 30px;
                    font-size: 3em;
                }
                .subtitle {
                    text-align: center;
                    color: #7f8c8d;
                    font-size: 1.2em;
                    margin-bottom: 40px;
                }
                .hero-section {
                    background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
                    color: white;
                    padding: 40px;
                    border-radius: 10px;
                    text-align: center;
                    margin-bottom: 40px;
                }
                .hero-section h2 {
                    font-size: 2em;
                    margin-bottom: 20px;
                }
                .hero-section p {
                    font-size: 1.1em;
                    margin-bottom: 30px;
                    opacity: 0.9;
                }
                .cta-button {
                    display: inline-block;
                    background: #27ae60;
                    color: white;
                    padding: 15px 30px;
                    text-decoration: none;
                    border-radius: 6px;
                    font-size: 1.1em;
                    font-weight: 600;
                    transition: background 0.3s;
                    margin: 10px;
                }
                .cta-button:hover {
                    background: #229954;
                }
                .cta-button.coming-soon {
                    background: #95a5a6;
                    cursor: not-allowed;
                    position: relative;
                }
                .cta-button.coming-soon:hover {
                    background: #95a5a6;
                }
                .coming-soon-tag {
                    position: absolute;
                    top: -8px;
                    right: -8px;
                    background: #e74c3c;
                    color: white;
                    padding: 4px 8px;
                    border-radius: 12px;
                    font-size: 0.7em;
                    font-weight: bold;
                }
                .features-grid {
                    display: grid;
                    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
                    gap: 30px;
                    margin: 40px 0;
                }
                .feature-card {
                    background: #f8f9fa;
                    padding: 25px;
                    border-radius: 8px;
                    border-left: 4px solid #3498db;
                }
                .feature-card h3 {
                    color: #2c3e50;
                    margin-top: 0;
                    margin-bottom: 15px;
                }
                .feature-card p {
                    color: #7f8c8d;
                    margin: 0;
                }
                .deployment-status {
                    background: #d4edda;
                    color: #155724;
                    padding: 15px;
                    border-radius: 5px;
                    margin-bottom: 20px;
                    text-align: center;
                    border: 1px solid #c3e6cb;
                }
            </style>
        </head>
        <body>
            <div class="container">
                <div class="deployment-status">
                    🚀 <strong>Deployed Successfully!</strong> Your Fantasy Football API is now live on Vercel!
                </div>
                
                <h1>Fantasy Football API</h1>
                <p class="subtitle">Advanced analytics, draft analysis, and player insights powered by AI</p>
                
                <div class="hero-section">
                    <h2>Ready to dominate your fantasy league?</h2>
                    <p>Get instant draft analysis, player projections, and strategic insights to build the ultimate team.</p>
                    <a href="/draft-analyzer" class="cta-button">Try Draft Analyzer Now</a>
                    <a href="/cheat-sheet" class="cta-button" style="background: #f39c12;">📋 Pre Draft Cheat Sheet</a>
                    <a href="#" class="cta-button coming-soon" style="background: #e74c3c;">
                        🤖 AI Helper
                        <span class="coming-soon-tag">Coming Soon</span>
                    </a>
                </div>
                
                <div class="features-grid">
                    <div class="feature-card">
                        <h3>🚀 Draft Analyzer</h3>
                        <p>Analyze your Sleeper draft picks with advanced metrics, VORP calculations, and team grading.</p>
                    </div>
                    <div class="feature-card">
                        <h3>📊 Pre Draft Cheat Sheet</h3>
                        <p>Comprehensive player rankings with VORP scores, projections, and strategic insights.</p>
                    </div>
                    <div class="feature-card">
                        <h3>⚡ Real-time Data</h3>
                        <p>Live player projections, ADP values, and fantasy football analytics updated daily.</p>
                    </div>
                </div>
                
                <div class="hero-section" style="background: linear-gradient(135deg, #f093fb 0%, #f5576c 100%);">
                    <h2>Start Building Your Championship Team</h2>
                    <p>Join thousands of fantasy managers who are already using our tools to dominate their leagues.</p>
                    <a href="/draft-analyzer" class="cta-button">🚀 Start Analyzing Drafts</a>
                    <a href="/cheat-sheet" class="cta-button" style="background: #f39c12;">📋 Pre Draft Cheat Sheet</a>
                </div>
            </div>
        </body>
        </html>
      `}})}},1506:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>n,metadata:()=>o});var r=a(9510);let o={title:"Fantasy Football"};function n({children:e}){return r.jsx("html",{lang:"en",children:r.jsx("body",{children:e})})}},908:(e,t,a)=>{"use strict";a.r(t),a.d(t,{default:()=>r});let r=(0,a(8570).createProxy)(String.raw`/Users/kanikameister/Documents/ff_api_skeleton/app/page.tsx#default`)}};var t=require("../webpack-runtime.js");t.C(e);var a=e=>t(t.s=e),r=t.X(0,[276,471],()=>a(9975));module.exports=r})();