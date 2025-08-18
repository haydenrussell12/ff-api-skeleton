(()=>{var e={};e.id=925,e.ids=[925],e.modules={2934:e=>{"use strict";e.exports=require("next/dist/client/components/action-async-storage.external.js")},4580:e=>{"use strict";e.exports=require("next/dist/client/components/request-async-storage.external.js")},5869:e=>{"use strict";e.exports=require("next/dist/client/components/static-generation-async-storage.external.js")},399:e=>{"use strict";e.exports=require("next/dist/compiled/next-server/app-page.runtime.prod.js")},5603:(e,t,r)=>{"use strict";r.r(t),r.d(t,{GlobalError:()=>o.a,__next_app__:()=>u,originalPathname:()=>p,pages:()=>c,routeModule:()=>m,tree:()=>d}),r(691),r(1506),r(5866);var a=r(3191),n=r(8716),i=r(7922),o=r.n(i),s=r(5231),l={};for(let e in s)0>["default","tree","pages","GlobalError","originalPathname","__next_app__","routeModule"].indexOf(e)&&(l[e]=()=>s[e]);r.d(t,l);let d=["",{children:["draft-analyzer",{children:["__PAGE__",{},{page:[()=>Promise.resolve().then(r.bind(r,691)),"/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/page.tsx"]}]},{}]},{layout:[()=>Promise.resolve().then(r.bind(r,1506)),"/Users/kanikameister/Documents/ff_api_skeleton/app/layout.tsx"],"not-found":[()=>Promise.resolve().then(r.t.bind(r,5866,23)),"next/dist/client/components/not-found-error"]}],c=["/Users/kanikameister/Documents/ff_api_skeleton/app/draft-analyzer/page.tsx"],p="/draft-analyzer/page",u={require:r,loadChunk:()=>Promise.resolve()},m=new a.AppPageRouteModule({definition:{kind:n.x.APP_PAGE,page:"/draft-analyzer/page",pathname:"/draft-analyzer",bundlePath:"",filename:"",appPaths:[]},userland:{loaderTree:d}})},3463:(e,t,r)=>{Promise.resolve().then(r.t.bind(r,2994,23)),Promise.resolve().then(r.t.bind(r,6114,23)),Promise.resolve().then(r.t.bind(r,9727,23)),Promise.resolve().then(r.t.bind(r,9671,23)),Promise.resolve().then(r.t.bind(r,1868,23)),Promise.resolve().then(r.t.bind(r,4759,23))},5303:()=>{},691:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>n});var a=r(9510);function n(){return a.jsx("div",{dangerouslySetInnerHTML:{__html:`
        <!DOCTYPE html>
        <html lang="en">
        <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <title>Draft Analyzer - Fantasy Football</title>
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
                <h1>Draft Analyzer</h1>
                <p>This page is being loaded from the existing HTML file. The full functionality will be available once we integrate the existing draft analyzer code.</p>
                <div id="draft-analyzer-content">
                    <!-- Content will be loaded here -->
                </div>
            </div>
            <script>
                // Load the existing draft analyzer HTML
                fetch('/draft-analyzer-new.html')
                    .then(response => response.text())
                    .then(html => {
                        document.getElementById('draft-analyzer-content').innerHTML = html;
                    })
                    .catch(error => {
                        console.error('Error loading draft analyzer:', error);
                        document.getElementById('draft-analyzer-content').innerHTML = '<p>Error loading draft analyzer. Please try again.</p>';
                    });
            </script>
        </body>
        </html>
      `}})}},1506:(e,t,r)=>{"use strict";r.r(t),r.d(t,{default:()=>i,metadata:()=>n});var a=r(9510);let n={title:"Fantasy Football"};function i({children:e}){return a.jsx("html",{lang:"en",children:a.jsx("body",{children:e})})}}};var t=require("../../webpack-runtime.js");t.C(e);var r=e=>t(t.s=e),a=t.X(0,[276,471],()=>r(5603));module.exports=a})();