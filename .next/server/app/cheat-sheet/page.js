(()=>{var e={};e.id=403,e.ids=[403],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},3163:(e,t,n)=>{"use strict";n.r(t),n.d(t,{GlobalError:()=>s.a,__next_app__:()=>p,originalPathname:()=>c,pages:()=>h,routeModule:()=>u,tree:()=>d}),n(6709),n(1506),n(5866);var r=n(3191),a=n(8716),i=n(7922),s=n.n(i),o=n(5231),l={};for(let e in o)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>o[e]);n.d(t,l);let d=["",{children:["cheat-sheet",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(n.bind(n,6709)),"/Users/kanikameister/Documents/ff_api_skeleton/app/cheat-sheet/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(n.bind(n,1506)),"/Users/kanikameister/Documents/ff_api_skeleton/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(n.t.bind(n,5866,23)),"next/dist/client/components/not-found-error"]}],h=["/Users/kanikameister/Documents/ff_api_skeleton/app/cheat-sheet/page.tsx"],c="/cheat-sheet/page",p={require:n,loadChunk:()=>Promise.resolve()},u=new r.AppPageRouteModule({definition:{kind:a.x.APP_PAGE,page:"/cheat-sheet/page",pathname:"/cheat-sheet",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},3463:(e,t,n)=>{Promise.resolve().then(n.t.bind(n,2994,23)),Promise.resolve().then(n.t.bind(n,6114,23)),Promise.resolve().then(n.t.bind(n,9727,23)),Promise.resolve().then(n.t.bind(n,9671,23)),Promise.resolve().then(n.t.bind(n,1868,23)),Promise.resolve().then(n.t.bind(n,4759,23))},5303:()=>{},6709:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>a});var r=n(9510);function a(){return r.jsx("div",{dangerouslySetInnerHTML:{__html:`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Pre Draft Cheat Sheet - Fantasy Football</title>
            <style>
                body { font-family: Arial, sans-serif; margin: 0; padding: 20px; background: #f5f5f5; }
                .container { max-width: 1200px; margin: 0 auto; background: white; padding: 20px; border-radius: 8px; }
                .back-button { display: inline-block; padding: 10px 20px; background: #007bff; color: white; text-decoration: none; border-radius: 5px; margin-bottom: 20px; }
                .back-button:hover { background: #0056b3; }
            </style>
        </head>
        <body>
            <div class="container">
                <a href="/" class="back-button">← Back to Home</a>
                <h1>Pre Draft Cheat Sheet</h1>
                <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing cheat sheet code.</p>
                <div id="cheat-sheet-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
            <script>
                // Load the existing cheat sheet HTML
                fetch('/pre-draft-cheat-sheet.html')
                    .then(response => response.text())
                    .then(html => {
                        document.getElementById('cheat-sheet-content').innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Error loading cheat sheet:', error);
                        document.getElementById('cheat-sheet-content').innerHTML = '<p>Error loading cheat sheet. Please try again.</p>';
                    });
            </script>
        </body>
        </html>
      `}})}},1506:(e,t,n)=>{"use strict";n.r(t),n.d(t,{default:()=>i,metadata:()=>a});var r=n(9510);let a={title:"Fantasy Football"};function i({children:e}){return r.jsx("html",{lang:"en",children:r.jsx("body",{children:e})})}}};var t=require("../../webpack-runtime.js");t.C(e);var n=e=>t(t.s=e),r=t.X(0,[276,471],()=>n(3163));module.exports=r})();