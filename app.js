const KEY="budgetGuardData_v3";
const defaults={
  month:"2026-10",
  balance:6996.25,
  limit:2000,
  expenses:[]
};
let state=load();

function load(){
  try{
    const x=JSON.parse(localStorage.getItem(KEY));
    if(x&&typeof x==="object") return {...defaults,...x,expenses:Array.isArray(x.expenses)?x.expenses:[]};
  }catch(e){}
  return {...defaults,expenses:[]};
}
function save(){localStorage.setItem(KEY,JSON.stringify(state));}
function money(n){return "₹"+Number(n||0).toLocaleString("en-IN",{maximumFractionDigits:2});}
function monthName(v){const [y,m]=v.split("-").map(Number);return new Intl.DateTimeFormat("en-IN",{month:"long",year:"numeric"}).format(new Date(Date.UTC(y,m-1,1)));}
function dateText(v){if(!v)return "—";const [y,m,d]=v.split("-").map(Number);return new Intl.DateTimeFormat("en-IN",{day:"2-digit",month:"short",year:"numeric"}).format(new Date(Date.UTC(y,m-1,d)));}
function todayISO(){const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,"0")}-${String(d.getDate()).padStart(2,"0")}`;}
function totalSpent(){return state.expenses.reduce((s,e)=>s+Number(e.amount||0),0);}
function byCat(cat){return state.expenses.filter(e=>e.category===cat).reduce((s,e)=>s+Number(e.amount||0),0);}
function render(){
  const spent=totalSpent(), remaining=Number(state.balance)-spent;
  document.getElementById("periodLabel").textContent=monthName(state.month);
  document.getElementById("startingBalance").textContent=money(state.balance);
  document.getElementById("spent").textContent=money(spent);
  document.getElementById("limit").textContent=money(state.limit);
  document.getElementById("remaining").textContent=money(remaining);
  document.getElementById("remaining").className="big-money "+(remaining<0?"over":"");
  document.getElementById("status").textContent=spent>state.limit?"LIMIT EXCEEDED":spent>state.limit*.8?"WATCH SPENDING":"ON TRACK";
  const pct=state.limit>0?Math.min(100,(spent/state.limit)*100):0;
  document.getElementById("progressBar").style.width=pct+"%";
  document.getElementById("todayDate").textContent=dateText(todayISO());
  const today=state.expenses.filter(e=>e.date===todayISO()).reduce((s,e)=>s+Number(e.amount||0),0);
  document.getElementById("todaySpent").textContent=money(today)+" spent today";
  const cats=["Food & snacks","Travel / transport","Recharge & subscriptions","College / study items","Shopping","Other small spends"];
  document.getElementById("categories").innerHTML=cats.map(c=>{
    const a=byCat(c), width=spent?Math.min(100,a/spent*100):0;
    return `<div class="cat"><span class="cat-name">${esc(c)}</span><span class="cat-amt">${money(a)}</span><div class="cat-line"><div style="width:${width}%"></div></div></div>`;
  }).join("");
  const list=document.getElementById("receiptList");
  const sorted=[...state.expenses].sort((a,b)=>(b.date||"").localeCompare(a.date||""));
  document.getElementById("emptyReceipt").style.display=sorted.length?"none":"block";
  list.innerHTML=sorted.map(e=>`<div class="receipt-row">
    <div><div class="receipt-note">${esc(e.note||e.category)}</div><div class="receipt-meta">${esc(e.category)} • ${dateText(e.date)}</div></div>
    <div class="receipt-amt">${money(e.amount)}</div>
    <button class="edit-btn" type="button" data-edit="${e.id}" aria-label="Edit spending">✎</button>
  </div>`).join("");
}
function esc(s){return String(s??"").replace(/[&<>"']/g,c=>({"&":"&amp;","<":"&lt;",">":"&gt;",'"':"&quot;","'":"&#039;"}[c]));}

const expenseDialog=document.getElementById("expenseDialog");
const settingsDialog=document.getElementById("settingsDialog");
document.getElementById("addBtn").onclick=()=>openExpense();
document.getElementById("settingsBtn").onclick=()=>openSettings();
document.querySelectorAll("[data-close]").forEach(b=>b.onclick=()=>document.getElementById(b.dataset.close).close());

function openExpense(id=null){
  const e=id?state.expenses.find(x=>x.id===id):null;
  document.getElementById("expenseTitle").textContent=e?"Edit spending":"Add spending";
  document.getElementById("expenseId").value=e?.id||"";
  document.getElementById("expenseDate").value=e?.date||todayISO();
  document.getElementById("expenseAmount").value=e?.amount??"";
  document.getElementById("expenseCategory").value=e?.category||"Food & snacks";
  document.getElementById("expenseNote").value=e?.note||"";
  expenseDialog.showModal();
}
document.getElementById("receiptList").addEventListener("click",ev=>{
  const btn=ev.target.closest("[data-edit]");
  if(btn)openExpense(btn.dataset.edit);
});
document.getElementById("expenseForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const id=document.getElementById("expenseId").value;
  const item={
    id:id||crypto.randomUUID(),
    date:document.getElementById("expenseDate").value,
    amount:Number(document.getElementById("expenseAmount").value),
    category:document.getElementById("expenseCategory").value,
    note:document.getElementById("expenseNote").value.trim()
  };
  if(!item.date||!Number.isFinite(item.amount)||item.amount<=0){alert("Please enter a valid date and amount.");return;}
  if(id) state.expenses=state.expenses.map(e=>e.id===id?item:e); else state.expenses.push(item);
  save();expenseDialog.close();render();
});

function openSettings(){
  document.getElementById("month").value=state.month;
  document.getElementById("balance").value=state.balance;
  document.getElementById("monthlyLimit").value=state.limit;
  settingsDialog.showModal();
}
document.getElementById("settingsForm").addEventListener("submit",ev=>{
  ev.preventDefault();
  const balance=Number(document.getElementById("balance").value);
  const limit=Number(document.getElementById("monthlyLimit").value);
  const month=document.getElementById("month").value;
  if(!month||!Number.isFinite(balance)||balance<0||!Number.isFinite(limit)||limit<0){alert("Please enter valid budget details.");return;}
  state.month=month;state.balance=balance;state.limit=limit;save();settingsDialog.close();render();
});
document.getElementById("clearBtn").onclick=()=>{
  if(!state.expenses.length){alert("The receipt is already empty.");return;}
  if(confirm("Clear this receipt? All saved spending entries will be deleted. Your starting balance and budget settings will stay.")){
    state.expenses=[];save();render();
  }
};
render();