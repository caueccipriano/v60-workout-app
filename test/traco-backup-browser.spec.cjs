const {test,expect}=require('@playwright/test');
const url='http://127.0.0.1:4173/';
async function settings(page){
 await page.goto(url,{waitUntil:'load'});
 await page.evaluate(()=>renderSettings());
 await expect(page.locator('#importData')).toHaveCount(1);
}
const fixture=(obj)=>({name:'synthetic-traço.json',mimeType:'application/json',buffer:Buffer.from(JSON.stringify(obj))});
test('a valid V60 backup requires confirmation before replacing existing sessions',async({page})=>{
 await settings(page);
 await page.evaluate(()=>localStorage.setItem('v60_sessions','[{"id":"existing"}]'));
 let dialogs=0;
 page.on('dialog',async dialog=>{dialogs++;if(dialog.type()==='confirm')await dialog.accept();else await dialog.dismiss();});
 await page.locator('#importData').setInputFiles(fixture({
  sessions:[{id:'synthetic-finished',startedAt:100}],body:[],settings:{defaultRest:75}
 }));
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('v60_sessions'))[0].id)).toBe('synthetic-finished');
 expect(dialogs).toBe(1);
 await expect.poll(()=>page.evaluate(()=>JSON.parse(localStorage.getItem('v60_settings')).defaultRest)).toBe(75);
});
test('malformed JSON sections cannot erase existing history',async({page})=>{
 await settings(page);
 await page.evaluate(()=>localStorage.setItem('v60_sessions','[{"id":"existing"}]'));
 const dialogs=[];
 page.on('dialog',async dialog=>{dialogs.push(dialog.type());await dialog.accept();});
 await page.locator('#importData').setInputFiles(fixture({sessions:'not-an-array'}));
 await expect.poll(()=>dialogs.length).toBe(1);
 expect(dialogs).toEqual(['alert']);
 expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe('[{"id":"existing"}]');
});
test('a storage quota failure rolls back the previous section',async({page})=>{
 await settings(page);
 await page.evaluate(()=>{
  localStorage.setItem('v60_sessions','[{"id":"existing"}]');
  localStorage.setItem('v60_body','[{"id":"existing-body"}]');
  const original=Storage.prototype.setItem;
  let once=false;
  Storage.prototype.setItem=function(k,value){
   if(k==='v60_body'&&!once){once=true;throw new DOMException('Quota exceeded','QuotaExceededError');}
   return original.call(this,k,value);
  };
 });
 const dialogs=[];
 page.on('dialog',async dialog=>{dialogs.push(dialog.type());await dialog.accept();});
 await page.locator('#importData').setInputFiles(fixture({sessions:[{id:'new'}],body:[{id:'new-body'}]}));
 await expect.poll(()=>dialogs.length).toBe(2);
 expect(dialogs).toEqual(['confirm','alert']);
 expect(await page.evaluate(()=>localStorage.getItem('v60_sessions'))).toBe('[{"id":"existing"}]');
 expect(await page.evaluate(()=>localStorage.getItem('v60_body'))).toBe('[{"id":"existing-body"}]');
});
