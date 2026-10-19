const fs=require('node:fs');
const path=require('node:path');
const root=path.join(__dirname,'..');
let html=fs.readFileSync(path.join(root,'index.html'),'utf8');
const model=fs.readFileSync(path.join(root,'model.js'),'utf8');
const app=fs.readFileSync(path.join(root,'app.js'),'utf8');
const mime=file=>file.endsWith('.ttf')?'font/ttf':file.endsWith('.webp')?'image/webp':'application/octet-stream';
const dataURI=file=>'data:'+mime(file)+';base64,'+fs.readFileSync(path.join(root,file)).toString('base64');
for(const name of ['styles.css','art.css','teaching.css']){
 let css=fs.readFileSync(path.join(root,name),'utf8');
 css=css.replace(/url\((['"]?)(assets\/[^)'"\s]+)\1\)/g,(_,q,file)=>"url('"+dataURI(file)+"')");
 html=html.replace(new RegExp('<link rel="stylesheet" href="'+name.replace(/\./g,'\\.')+'(?:\\?[^\"]*)?">'),()=>'<style>'+css+'</style>');
}
const assets=Object.fromEntries(['assets/youtopia-map.webp','assets/fiscal-scene.webp','assets/tax-scene.webp','assets/goods-scene.webp'].map(file=>[file,dataURI(file)]));
const scriptNames=['model.js','teaching-model.js','app.js','teaching.js'];
for(const name of scriptNames)html=html.replace(new RegExp('<script defer src="'+name.replace(/\./g,'\\.')+'(?:\\?[^\"]*)?"></script>'),'');
html=html.replace(/<a[^>]*id="offline-download"[^>]*>[^<]*<\/a>/,'<span>Offline edition</span>');
html=html.replace('</body>',()=>'<script>window.YoutopiaAssets='+JSON.stringify(assets)+'</script>'+scriptNames.map(name=>'<script>'+fs.readFileSync(path.join(root,name),'utf8').replace(/<\/script/gi,'<\\/script')+'</script>').join('')+'</body>');
fs.writeFileSync(path.join(root,'Youtopia_Offline.html'),html);
console.log('Self-contained offline edition exported.');
