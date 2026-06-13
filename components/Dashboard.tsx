"use client";
import { useState, useEffect } from "react";
import {
  ResponsiveContainer, LineChart, Line, AreaChart, Area,
  XAxis, YAxis, Tooltip, CartesianGrid, BarChart, Bar,
} from "recharts";
import type { DailyData, Insight } from "@/lib/summary";

/* ─── Kleuren ─── */
const C = {
  green:"#34C759", blue:"#0A84FF", red:"#FF3B30", orange:"#FF9F0A",
  purple:"#AF52DE", teal:"#32ADE6", yellow:"#FFD60A",
  muted:"rgba(255,255,255,0.40)",
};
const tt = { background:"#1c1c1e", border:"0.5px solid rgba(255,255,255,0.12)", borderRadius:10, color:"#fff", fontSize:12 };

/* ─── Default doelen ─── */
const DEFAULT_GOALS = { stappen:8000, kcal:500, water:2000, slaap:480 };

/* ─── SVG Iconen ─── */
const IcoHome    = ({a=false}) => <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.2:1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/></svg>;
const IcoTrends  = ({a=false}) => <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.2:1.6} strokeLinecap="round" strokeLinejoin="round"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg>;
const IcoHeart   = ({a=false}) => <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.2:1.6} strokeLinecap="round" strokeLinejoin="round"><polyline points="22 12 18 12 15 21 9 3 6 12 2 12"/></svg>;
const IcoStar    = ({a=false}) => <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={a?2.2:1.6} strokeLinecap="round" strokeLinejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>;
const IcoPlus    = () => <svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>;
const IcoFlash   = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="currentColor" stroke="none"><polygon points="13 2 3 14 12 14 11 22 21 10 12 10 13 2"/></svg>;
const IcoFire    = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-2-1-4-1-4s-1 2-3 2-2-2-2-2 2-5 2-5z"/></svg>;
const IcoDrop    = () => <svg width={14} height={14} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>;
const IcoBell    = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9"/><path d="M13.73 21a2 2 0 0 1-3.46 0"/></svg>;
const IcoUser    = () => <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>;
const IcoBack    = () => <svg width={10} height={18} viewBox="0 0 10 18" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round"><path d="M9 1L1 9l8 8"/></svg>;
const IcoChevron = () => <svg width={16} height={16} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>;
const IcoTrophy  = () => <svg width={18} height={18} viewBox="0 0 24 24" fill="none" stroke="#FFD60A" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d="M6 9H4.5a2.5 2.5 0 0 1 0-5H6"/><path d="M18 9h1.5a2.5 2.5 0 0 0 0-5H18"/><path d="M4 22h16"/><path d="M10 14.66V17c0 .55-.47.98-.97 1.21C7.85 18.75 7 20.24 7 22"/><path d="M14 14.66V17c0 .55.47.98.97 1.21C16.15 18.75 17 20.24 17 22"/><path d="M18 2H6v7a6 6 0 0 0 12 0V2z"/></svg>;

/* ─── Helpers ─── */
function fmtDay(d:string){ return new Date(d+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"short"}); }
function fmtMin(min:number|null){
  if(!min||min<=0) return "–";
  const h=Math.floor(min/60), m=Math.round(min%60);
  return h>0?`${h}u ${m}m`:`${m}m`;
}
function colorPct(p:number){ return p>=70?C.green:p>=40?C.orange:C.red; }
function avg(arr:(number|null)[]){ const v=arr.filter((x):x is number=>x!=null); return v.length?v.reduce((a,b)=>a+b,0)/v.length:null; }

/* ─── Sport icoon ─── */
function WorkoutIcon({name}:{name:string}){
  const n=(name||"").toLowerCase();
  let d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20";
  if(n.includes("run")||n.includes("hardloop")) d="M13 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6 17l4-8 2 3 2-2 2 5";
  else if(n.includes("fiet")||n.includes("cycl")) d="M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0M12 8h4l2 8-5-4-3 5-3-4 2-5z";
  else if(n.includes("zwem")||n.includes("swim")) d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0";
  else if(n.includes("kracht")||n.includes("strength")) d="M6 4v16M18 4v16M2 12h20M2 7h4M18 7h4M2 17h4M18 17h4";
  else if(n.includes("yoga")) d="M12 2c0 0-4 6-4 10a4 4 0 0 0 8 0c0-4-4-10-4-10z";
  else if(n.includes("hiit")||n.includes("interval")) d="M13 2L3 14h9l-1 8 10-12h-9z";
  return <svg width={20} height={20} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round"><path d={d}/></svg>;
}

/* ─── Ring ─── */
function Ring({pct,size=80,color=C.green,children}:{pct:number;size?:number;color?:string;children?:React.ReactNode}){
  const sw=7, r=(size-sw)/2, circ=2*Math.PI*r, safe=Math.min(100,Math.max(0,pct));
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.09)" strokeWidth={sw}/>
        {safe>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(safe/100)*circ} ${circ}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>}
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        {children}
      </div>
    </div>
  );
}

function SmallRing({pct,size=64}:{pct:number;size?:number}){
  const sw=5, r=(size-sw)/2, circ=2*Math.PI*r, safe=Math.min(100,Math.max(0,pct));
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.18)" strokeWidth={sw}/>
        {safe>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.88)"
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(safe/100)*circ} ${circ}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>}
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",fontSize:12,fontWeight:800,color:"#fff"}}>{Math.round(safe)}%</div>
    </div>
  );
}

/* ─── Main Dashboard ─── */
export default function Dashboard({daily,workouts,insights,dayScore}:{
  daily:DailyData; workouts:any[]; insights:Insight[];
  dayScore:{score:number;parts:{label:string;pct:number}[]}|null;
}){
  const [tab,setTab]=useState<"home"|"trends"|"activiteit">("home");
  const [range,setRange]=useState(30);
  const [goals,setGoals]=useState(DEFAULT_GOALS);
  const [editGoals,setEditGoals]=useState(false);
  const [detailKey,setDetailKey]=useState<string|null>(null);
  const [showSettings,setShowSettings]=useState(false);
  const [showInfo,setShowInfo]=useState(false);

  // Laad opgeslagen doelen
  useEffect(()=>{
    try{ const s=localStorage.getItem("hh_goals"); if(s) setGoals(JSON.parse(s)); }catch{}
  },[]);

  const allDays=Object.keys(daily).sort();
  const days=allDays.slice(-range);

  const rows=days.map(d=>{
    const m=daily[d]??{};
    const v=(k:string,f=1,dec=1)=>(m[k]!=null?+((m[k]*f).toFixed(dec)):null);
    return{
      day:fmtDay(d), rawDay:d,
      slaap:v("sleep.total",1/60), diep:v("sleep.deep",1/60),
      rem:v("sleep.rem",1/60), licht:v("sleep.core",1/60),
      hrv:v("heart_rate_variability.qty",1,0), rusthr:v("resting_heart_rate.qty",1,0),
      stappen:v("step_count.qty",1,0), water:v("dietary_water.qty",1,0),
      gewicht:v("weight_body_mass.qty"), vet:v("body_fat_percentage.qty"),
      spier:v("lean_body_mass.qty"), kcal:v("active_energy.qty",1,0),
    };
  });

  const latest=(key:keyof typeof rows[0])=>{
    for(let i=rows.length-1;i>=0;i--) if(rows[i][key]!=null) return rows[i][key] as number;
    return null;
  };
  const prev=(key:keyof typeof rows[0])=>{
    let n=0;
    for(let i=rows.length-1;i>=0;i--) if(rows[i][key]!=null&&++n===2) return rows[i][key] as number;
    return null;
  };
  const weekAvg=(key:keyof typeof rows[0],offset=0)=>{
    const slice=rows.slice(-(14+offset*7),-(7*offset)||undefined);
    return avg(slice.map(r=>r[key] as number|null));
  };

  const today=new Date().toLocaleDateString("nl-NL",{day:"numeric",month:"long"});
  const weekWorkouts=workouts.filter(w=>new Date(w.start)>new Date(Date.now()-7*86400000));

  const latestHRV=latest("hrv");
  const baseHRVs=rows.slice(-30,-1).map(r=>r.hrv).filter((v):v is number=>v!=null);
  const avgHRV=baseHRVs.length?baseHRVs.reduce((a,b)=>a+b,0)/baseHRVs.length:50;
  const herstelPct=latestHRV?Math.min(100,Math.round((latestHRV/(avgHRV*1.2))*100)):0;
  const slaapMin=latest("slaap")?Math.round((latest("slaap") as number)*60):null;
  const slaapPct=slaapMin?Math.min(100,Math.round((slaapMin/goals.slaap)*100)):0;
  const stappenPct=Math.min(100,Math.round(((latest("stappen")??0)/goals.stappen)*100));
  const waterPct=Math.min(100,Math.round(((latest("water")??0)/goals.water)*100));
  const kcalPct=Math.min(100,Math.round(((latest("kcal")??0)/goals.kcal)*100));

  // Slaapscore 0-100
  const slaapScore=(()=>{
    if(!slaapMin) return null;
    let s=50;
    s+=Math.min(20,Math.round(((slaapMin-360)/120)*20));
    const remMin=latest("rem")?Math.round((latest("rem") as number)*60):0;
    const diepMin=latest("diep")?Math.round((latest("diep") as number)*60):0;
    if(slaapMin>0){ s+=Math.min(15,Math.round((remMin/slaapMin)*50)); }
    if(slaapMin>0){ s+=Math.min(15,Math.round((diepMin/slaapMin)*50)); }
    if(latestHRV&&avgHRV>0){ s+=Math.round(Math.min(10,((latestHRV/avgHRV)-0.8)*25)); }
    return Math.max(0,Math.min(100,Math.round(s)));
  })();

  // PRs
  const prData=(()=>{
    const records:{name:string;val:number;unit:string;date:string}[]=[];
    const maxStappen=rows.reduce((best,r)=>r.stappen!=null&&r.stappen>(best?.stappen??0)?r:best,rows[0]);
    if(maxStappen?.stappen) records.push({name:"Meeste stappen",val:Math.round(maxStappen.stappen),unit:"stappen",date:fmtDay(maxStappen.rawDay)});
    const topHRV=rows.reduce((best,r)=>r.hrv!=null&&r.hrv>(best?.hrv??0)?r:best,rows[0]);
    if(topHRV?.hrv) records.push({name:"Hoogste HRV",val:Math.round(topHRV.hrv),unit:"ms",date:fmtDay(topHRV.rawDay)});
    const longSlaap=rows.reduce((best,r)=>r.slaap!=null&&r.slaap>(best?.slaap??0)?r:best,rows[0]);
    if(longSlaap?.slaap) records.push({name:"Langste nacht",val:longSlaap.slaap,unit:"uur",date:fmtDay(longSlaap.rawDay)});
    return records;
  })();

  // Correlatie HRV vs slaap
  const corrData=rows.filter(r=>r.hrv!=null&&r.slaap!=null).map(r=>({day:r.day,hrv:r.hrv!,slaap:+(r.slaap!*60).toFixed(0)}));

  if(!allDays.length){
    return(
      <div className="container">
        <AppHeader today={today} onProfile={()=>setShowSettings(true)} onBell={()=>setShowInfo(true)}/>
        <div className="empty-state">
          <svg width={52} height={52} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.25)" strokeWidth={1.2} style={{marginBottom:20}}><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01"/></svg>
          <h2>Nog geen data</h2>
          <p>Zodra Health Auto Export pusht naar<br/><code>/api/ingest</code> verschijnt hier alles.</p>
        </div>
        <TabBar tab={tab} onTab={setTab} onSettings={()=>setShowSettings(true)}/>
      </div>
    );
  }

  const metricLabels:{[k:string]:{label:string;unit:string;color:string;higher?:boolean}}={
    hrv:{label:"Hartslagvariabiliteit",unit:"ms",color:C.green,higher:true},
    rusthr:{label:"Rusthartslag",unit:"bpm",color:C.red,higher:false},
    slaap:{label:"Slaap",unit:"uur",color:C.purple,higher:true},
    gewicht:{label:"Gewicht",unit:"kg",color:C.blue},
    vet:{label:"Vetpercentage",unit:"%",color:C.orange,higher:false},
    spier:{label:"Spiermassa",unit:"kg",color:C.teal,higher:true},
    stappen:{label:"Stappen",unit:"",color:C.green,higher:true},
    kcal:{label:"Actieve calorieën",unit:"kcal",color:C.orange,higher:true},
    water:{label:"Water",unit:"ml",color:C.teal,higher:true},
  };

  return(
    <div className="container">
      <AppHeader today={today} onProfile={()=>setShowSettings(true)} onBell={()=>setShowInfo(true)}/>

      {tab==="home"&&<HomeTab
        herstelPct={herstelPct} stappenPct={stappenPct} waterPct={waterPct}
        kcalPct={kcalPct} slaapPct={slaapPct} slaapMin={slaapMin} slaapScore={slaapScore}
        latestHRV={latestHRV} avgHRV={avgHRV} rows={rows}
        deepMin={latest("diep")?Math.round((latest("diep") as number)*60):null}
        remMin={latest("rem")?Math.round((latest("rem") as number)*60):null}
        lightMin={latest("licht")?Math.round((latest("licht") as number)*60):null}
        latest={latest} prev={prev} weekAvg={weekAvg}
        weekWorkouts={weekWorkouts} workouts={workouts} insights={insights}
        goals={goals} onEditGoals={()=>setEditGoals(true)}
        onMetricClick={setDetailKey}
        prData={prData} corrData={corrData}
        onAI={()=>window.location.href="/chat"}
      />}

      {tab==="trends"&&<TrendsTab rows={rows} range={range} setRange={setRange}
        herstelPct={herstelPct} stappenPct={stappenPct} waterPct={waterPct} slaapPct={slaapPct}
        latest={latest} prev={prev} weekAvg={weekAvg}
        onMetricClick={setDetailKey}
      />}

      {tab==="activiteit"&&<ActiviteitTab workouts={workouts} weekWorkouts={weekWorkouts}
        latest={latest} prev={prev} goals={goals} onEditGoals={()=>setEditGoals(true)}
        onMetricClick={setDetailKey}
      />}

      <TabBar tab={tab} onTab={setTab} onSettings={()=>setShowSettings(true)}/>

      {/* Modals */}
      {editGoals&&<EditGoalsModal goals={goals} setGoals={setGoals} onClose={()=>setEditGoals(false)}/>}
      {detailKey&&<MetricDetailModal
        metaKey={detailKey}
        meta={metricLabels[detailKey]}
        rows={rows}
        weekAvg={weekAvg}
        onClose={()=>setDetailKey(null)}
      />}
      {showSettings&&<SettingsModal goals={goals} setGoals={setGoals} onClose={()=>setShowSettings(false)}/>}
      {showInfo&&<InfoModal onClose={()=>setShowInfo(false)}/>}
    </div>
  );
}

/* ─── App Header ─── */
function AppHeader({today,onProfile,onBell}:{today:string;onProfile?:()=>void;onBell?:()=>void}){
  return(
    <div className="app-header">
      <div className="header-left">
        <div className="header-date-pill">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Vandaag, {today}
        </div>
      </div>
      <div className="header-right">
        <button className="header-icon-btn" onClick={onProfile} title="Profiel"><IcoUser/></button>
        <button className="header-icon-btn" onClick={onBell} title="Info"><IcoBell/></button>
      </div>
    </div>
  );
}

/* ─── SectionHeader ─── */
function SectionHeader({title,action,onAction}:{title:string;action?:string;onAction?:()=>void}){
  return(
    <div className="section-hdr">
      <span className="section-hdr-title">{title}</span>
      {action&&<button className="section-hdr-action" onClick={onAction}>{action}</button>}
    </div>
  );
}

/* ─── Home Tab ─── */
function HomeTab({herstelPct,stappenPct,waterPct,kcalPct,slaapPct,slaapMin,slaapScore,
  latestHRV,avgHRV,rows,deepMin,remMin,lightMin,latest,prev,weekAvg,
  weekWorkouts,workouts,insights,goals,onEditGoals,onMetricClick,prData,corrData,onAI}:any){

  const hrvVals=rows.map((r:any)=>r.hrv).filter((v:any):v is number=>v!=null);
  const hrvMax=hrvVals.length?Math.max(...hrvVals):null;
  const hrvMin=hrvVals.length?Math.min(...hrvVals):null;
  const hrvAvg=hrvVals.length?Math.round(hrvVals.reduce((a:number,b:number)=>a+b,0)/hrvVals.length):null;

  return(
    <>
      <div className="hero">
        <div className="hero-bg"/>
        <div className="hero-eyebrow">JOUW OVERZICHT</div>
        <div className="hero-title">Goedemorgen, Max</div>
        <button className="ai-cta-btn" onClick={onAI}>
          <IcoStar/> Vraag het aan AI-coach
        </button>
      </div>

      {/* Drie ringen */}
      <div className="three-rings">
        <div className="ring-col">
          <div className="ring-lbl"><IcoFlash/> Herstel</div>
          <Ring pct={herstelPct} size={76} color={colorPct(herstelPct)}>
            <div style={{fontSize:16,fontWeight:800}}>{herstelPct}%</div>
          </Ring>
        </div>
        <div className="ring-col ring-col-center">
          <div className="ring-lbl"><IcoFire/> Inspanning</div>
          <Ring pct={stappenPct} size={96} color={colorPct(stappenPct)}>
            <div style={{fontSize:20,fontWeight:900}}>{stappenPct}%</div>
          </Ring>
        </div>
        <div className="ring-col">
          <div className="ring-lbl"><IcoDrop/> Voeding</div>
          <Ring pct={waterPct} size={76} color={colorPct(waterPct)}>
            <div style={{fontSize:16,fontWeight:800}}>{waterPct}%</div>
          </Ring>
        </div>
      </div>

      {/* Dagelijkse doelen */}
      <SectionHeader title="Dagelijkse doelen" action="Bewerken" onAction={onEditGoals}/>
      <div className="goals-grid">
        <GoalCard label="Stappen" value={latest("stappen")} goal={goals.stappen} unit="stap." color={C.green} onClick={()=>onMetricClick("stappen")}/>
        <GoalCard label="Calorieën" value={latest("kcal")} goal={goals.kcal} unit="kcal" color={C.orange} onClick={()=>onMetricClick("kcal")}/>
        <GoalCard label="Slaap" value={slaapMin} goal={goals.slaap} unit="min" color={C.purple} onClick={()=>onMetricClick("slaap")}/>
        <GoalCard label="Water" value={latest("water")} goal={goals.water} unit="ml" color={C.teal} onClick={()=>onMetricClick("water")}/>
      </div>

      {/* HRV & Energie */}
      <SectionHeader title="Energie & herstel" action="Details" onAction={()=>onMetricClick("hrv")}/>
      <div className="sonar-card" style={{cursor:"pointer"}} onClick={()=>onMetricClick("hrv")}>
        <div className="energy-header">
          <div>
            <div className="energy-value">
              {latestHRV??<span style={{color:C.muted}}>–</span>}
              <span className="energy-unit">{latestHRV?" ms":""}</span>
            </div>
            <div className="energy-label">Hartslagvariabiliteit (HRV)</div>
          </div>
          <div style={{display:"flex",flexWrap:"wrap",width:96,justifyContent:"flex-end",gap:0,paddingTop:6}}>
            {[...Array(20)].map((_,i)=>{
              const f=latestHRV&&i<Math.round((latestHRV/100)*20);
              return<div key={i} style={{width:4,height:4,borderRadius:2,background:f?"#fff":"rgba(255,255,255,0.10)",margin:"0 1.5px"}}/>;
            })}
          </div>
        </div>
        <div className="energy-stats">
          <div className="energy-stat"><div className="energy-stat-val">{hrvMax??"–"}</div><div className="energy-stat-lbl">Max</div></div>
          <div className="energy-stat-div"/>
          <div className="energy-stat"><div className="energy-stat-val">{hrvMin??"–"}</div><div className="energy-stat-lbl">Min</div></div>
          <div className="energy-stat-div"/>
          <div className="energy-stat"><div className="energy-stat-val">{hrvAvg??"–"}</div><div className="energy-stat-lbl">Gem.</div></div>
        </div>
      </div>

      {/* Slaap + score */}
      <SectionHeader title="Slaap" action="Details" onAction={()=>onMetricClick("slaap")}/>
      <div className="sonar-card" style={{cursor:"pointer"}} onClick={()=>onMetricClick("slaap")}>
        {slaapScore!=null&&(
          <div className="sleep-score-badge" style={{marginBottom:14}}>
            <div className="sleep-score-num" style={{color:slaapScore>=80?C.green:slaapScore>=60?C.orange:C.red}}>
              {slaapScore}
            </div>
            <div>
              <div className="sleep-score-label">Slaapscore</div>
              <div className="sleep-score-sub">{slaapScore>=80?"Uitstekend":slaapScore>=65?"Goed":slaapScore>=50?"Matig":"Slecht"}</div>
            </div>
          </div>
        )}
        <div className="sleep-row">
          <div className="sleep-left">
            <Ring pct={slaapPct} size={88} color={C.purple}>
              <div style={{fontSize:15,fontWeight:800}}>{slaapMin?`${Math.floor(slaapMin/60)}u`:"–"}</div>
              {slaapMin&&<div style={{fontSize:11,color:C.muted,fontWeight:600}}>{slaapMin%60}m</div>}
            </Ring>
            <div className="sleep-sublabel">Doel {fmtMin(480)}</div>
          </div>
          <div className="sleep-phases">
            <PhaseRow label="Diepe slaap" min={deepMin} max={slaapMin??480} color={C.purple}/>
            <PhaseRow label="REM-slaap" min={remMin} max={slaapMin??480} color={C.teal}/>
            <PhaseRow label="Lichte slaap" min={lightMin} max={slaapMin??480} color={C.blue}/>
          </div>
        </div>
      </div>

      {/* Vitale trends */}
      <SectionHeader title="Vitale trends"/>
      <div className="vitals-grid">
        <VitalCard label="HRV" value={latest("hrv")} unit="ms" prev={prev("hrv")} higher onClick={()=>onMetricClick("hrv")}/>
        <VitalCard label="Rusthartslag" value={latest("rusthr")} unit="bpm" prev={prev("rusthr")} higher={false} onClick={()=>onMetricClick("rusthr")}/>
        <VitalCard label="Gewicht" value={latest("gewicht")} unit="kg" prev={prev("gewicht")} onClick={()=>onMetricClick("gewicht")}/>
        <VitalCard label="Spiermassa" value={latest("spier")} unit="kg" prev={prev("spier")} higher onClick={()=>onMetricClick("spier")}/>
      </div>

      {/* Persoonlijke records */}
      {prData.length>0&&<>
        <SectionHeader title="Persoonlijke records"/>
        <div className="sonar-card">
          {prData.map((pr:any,i:number)=>(
            <div className="pr-row" key={i}>
              <div className="pr-badge"><IcoTrophy/></div>
              <div className="pr-info">
                <div className="pr-name">{pr.name}</div>
                <div className="pr-date">{pr.date}</div>
              </div>
              <div className="pr-val">{typeof pr.val==="number"&&pr.unit==="uur"?fmtMin(Math.round(pr.val*60)):pr.val.toLocaleString("nl-NL")} {pr.unit}</div>
            </div>
          ))}
        </div>
      </>}

      {/* Training */}
      <SectionHeader title="Training"/>
      <div className="sonar-card">
        {workouts.length>0?workouts.slice(-5).reverse().map((w:any,i:number)=>(
          <WorkoutRow key={i} w={w}/>
        )):<EmptySection msg="Geen workouts gevonden"/>}
      </div>

      {/* Correlatie */}
      {corrData.length>=5&&<>
        <SectionHeader title="Correlatie"/>
        <div className="sonar-card">
          <div style={{fontSize:13,color:C.muted,marginBottom:12}}>HRV in relatie tot slaaptijd</div>
          <ResponsiveContainer width="100%" height={100}>
            <LineChart data={corrData} margin={{left:0,right:0,top:2,bottom:0}}>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.3)",fontSize:8}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis yAxisId="l" orientation="left" tick={{fill:C.green,fontSize:8}} width={24} axisLine={false} tickLine={false}/>
              <YAxis yAxisId="r" orientation="right" tick={{fill:C.purple,fontSize:8}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Line yAxisId="l" dataKey="hrv" name="HRV" stroke={C.green} strokeWidth={2} dot={false} connectNulls/>
              <Line yAxisId="r" dataKey="slaap" name="Slaap (min)" stroke={C.purple} strokeWidth={2} dot={false} connectNulls strokeDasharray="4 2"/>
            </LineChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:16,marginTop:10}}>
            <span style={{fontSize:11,color:C.green}}>— HRV (ms)</span>
            <span style={{fontSize:11,color:C.purple}}>--- Slaap (min)</span>
          </div>
        </div>
      </>}

      {/* Inzichten */}
      {insights.length>0&&<>
        <SectionHeader title="Inzichten van de AI"/>
        <div className="sonar-card">
          {insights.map((ins:any,i:number)=>(
            <div className="insight-row" key={i}>
              <div className="insight-dot" style={{background:C.blue}}/>
              <div className="insight-text">{ins.text}</div>
            </div>
          ))}
        </div>
      </>}
    </>
  );
}

/* ─── Trends Tab ─── */
function TrendsTab({rows,range,setRange,herstelPct,stappenPct,waterPct,slaapPct,latest,prev,weekAvg,onMetricClick}:any){
  const [filter,setFilter]=useState("Alles");
  const [compareSel,setCompareSel]=useState("stappen");
  const filters=["Alles","Slaap","Activiteit","Herstel","Lichaam"];

  const metaMap:{[k:string]:{label:string;unit:string;color:string}}={
    hrv:{label:"Hartslagvariabiliteit",unit:"ms",color:C.green},
    rusthr:{label:"Rusthartslag",unit:"bpm",color:C.red},
    slaap:{label:"Slaaptijd",unit:"uur",color:C.purple},
    stappen:{label:"Stappen",unit:"",color:C.green},
    kcal:{label:"Actieve calorieën",unit:"kcal",color:C.orange},
    water:{label:"Water",unit:"ml",color:C.teal},
    gewicht:{label:"Gewicht",unit:"kg",color:C.blue},
    vet:{label:"Vetpercentage",unit:"%",color:C.orange},
    spier:{label:"Spiermassa",unit:"kg",color:C.teal},
  };

  const latestHRV=latest("hrv");
  const latestSlaap=latest("slaap");

  return(
    <>
      <div className="filter-scroll">
        {filters.map(f=>(
          <button key={f} className={`filter-pill${filter===f?" active":""}`} onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>
      <div className="segment">
        {[7,14,30,90].map(r=>(
          <button key={r} className={range===r?"active":""} onClick={()=>setRange(r)}>{r}d</button>
        ))}
      </div>

      {/* ── ALLES ── */}
      {filter==="Alles"&&<>
        <SectionHeader title="Samenvatting"/>
        <div className="photo-cards">
          <PhotoCard title="Activiteit" sub={`${(latest("stappen")??0).toLocaleString("nl-NL")} stappen`} pct={stappenPct} gradient="linear-gradient(130deg,#0d1f0d,#0a1505)"/>
          <PhotoCard title="Slaap" sub={`${fmtMin(latestSlaap?Math.round(latestSlaap*60):null)} geslapen`} pct={slaapPct} gradient="linear-gradient(130deg,#0d0d2e,#080820)"/>
          <PhotoCard title="Herstel" sub={`HRV ${latestHRV??"–"} ms`} pct={herstelPct} gradient="linear-gradient(130deg,#1f100d,#120800)"/>
        </div>
        <SectionHeader title="Vergelijken"/>
        <div className="sonar-card" style={{padding:"14px 16px"}}>
          <div className="compare-chips">
            {["stappen","hrv","slaap","gewicht","kcal"].map(k=>(
              <button key={k} className={`compare-chip${compareSel===k?" sel":""}`} onClick={()=>setCompareSel(k)}>
                {metaMap[k]?.label.split(" ")[0]}
              </button>
            ))}
          </div>
          <div style={{display:"flex",gap:10,marginBottom:10}}>
            <WeekBox label="Laatste 7d" val={weekAvg(compareSel,0)?.toFixed(1)} unit={metaMap[compareSel]?.unit}/>
            <WeekBox label="Week daarvoor" val={weekAvg(compareSel,1)?.toFixed(1)} unit={metaMap[compareSel]?.unit}/>
          </div>
          <ResponsiveContainer width="100%" height={120}>
            <AreaChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Area dataKey={compareSel} stroke={metaMap[compareSel]?.color||C.green} fill={metaMap[compareSel]?.color||C.green} fillOpacity={0.12} strokeWidth={2} connectNulls dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {["slaap","hrv","stappen","gewicht"].map(k=>(
          <div key={k} onClick={()=>onMetricClick(k)}>
            <MetricChart title={metaMap[k].label} value={latest(k)!=null?`${latest(k)?.toFixed?.(1)} ${metaMap[k].unit}`:null} rows={rows} dataKey={k} color={metaMap[k].color}/>
          </div>
        ))}
      </>}

      {/* ── SLAAP ── */}
      {filter==="Slaap"&&<>
        <SectionHeader title="Slaap"/>
        <div className="sonar-card">
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <WeekBox label="Gem. slaap 7d" val={weekAvg("slaap",0)!=null?fmtMin(Math.round((weekAvg("slaap",0)??0)*60)):undefined} unit=""/>
            <WeekBox label="Week daarvoor" val={weekAvg("slaap",1)!=null?fmtMin(Math.round((weekAvg("slaap",1)??0)*60)):undefined} unit=""/>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={24} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Bar dataKey="diep" name="Diepe slaap" stackId="s" fill={C.purple} radius={[0,0,0,0]}/>
              <Bar dataKey="rem" name="REM" stackId="s" fill={C.teal}/>
              <Bar dataKey="licht" name="Lichte slaap" stackId="s" fill={C.blue} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
          <div style={{display:"flex",gap:14,marginTop:10}}>
            <LegDot color={C.purple} label="Diepe slaap"/>
            <LegDot color={C.teal} label="REM"/>
            <LegDot color={C.blue} label="Lichte slaap"/>
          </div>
        </div>
        {["slaap","hrv"].map(k=>(
          <div key={k} onClick={()=>onMetricClick(k)}>
            <MetricChart title={metaMap[k].label} value={latest(k)!=null?`${latest(k)?.toFixed?.(1)} ${metaMap[k].unit}`:null} rows={rows} dataKey={k} color={metaMap[k].color}/>
          </div>
        ))}
      </>}

      {/* ── ACTIVITEIT ── */}
      {filter==="Activiteit"&&<>
        <SectionHeader title="Activiteit"/>
        <div className="sonar-card">
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <WeekBox label="Gem. stappen 7d" val={weekAvg("stappen",0)?.toFixed(0)} unit=""/>
            <WeekBox label="Week daarvoor" val={weekAvg("stappen",1)?.toFixed(0)} unit=""/>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <BarChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Bar dataKey="stappen" name="Stappen" fill={C.green} radius={[4,4,0,0]}/>
            </BarChart>
          </ResponsiveContainer>
        </div>
        {["stappen","kcal","water"].map(k=>(
          <div key={k} onClick={()=>onMetricClick(k)}>
            <MetricChart title={metaMap[k].label} value={latest(k)!=null?`${latest(k)?.toFixed?.(0)} ${metaMap[k].unit}`:null} rows={rows} dataKey={k} color={metaMap[k].color}/>
          </div>
        ))}
      </>}

      {/* ── HERSTEL ── */}
      {filter==="Herstel"&&<>
        <SectionHeader title="Herstel & HRV"/>
        <div className="sonar-card">
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <WeekBox label="Gem. HRV 7d" val={weekAvg("hrv",0)?.toFixed(0)} unit="ms"/>
            <WeekBox label="Week daarvoor" val={weekAvg("hrv",1)?.toFixed(0)} unit="ms"/>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <AreaChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Area dataKey="hrv" name="HRV" stroke={C.green} fill={C.green} fillOpacity={0.15} strokeWidth={2} connectNulls dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
        {["hrv","rusthr"].map(k=>(
          <div key={k} onClick={()=>onMetricClick(k)}>
            <MetricChart title={metaMap[k].label} value={latest(k)!=null?`${latest(k)?.toFixed?.(0)} ${metaMap[k].unit}`:null} rows={rows} dataKey={k} color={metaMap[k].color}/>
          </div>
        ))}
      </>}

      {/* ── LICHAAM ── */}
      {filter==="Lichaam"&&<>
        <SectionHeader title="Lichaamssamenstelling"/>
        <div className="sonar-card">
          <div style={{display:"flex",gap:10,marginBottom:14}}>
            <WeekBox label="Huidig gewicht" val={latest("gewicht")?.toFixed(1)} unit="kg"/>
            <WeekBox label="7d geleden" val={weekAvg("gewicht",1)?.toFixed(1)} unit="kg"/>
          </div>
          <ResponsiveContainer width="100%" height={130}>
            <LineChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.04)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis domain={["auto","auto"]} tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Line dataKey="gewicht" name="Gewicht (kg)" stroke={C.blue} strokeWidth={2.5} dot={false} connectNulls/>
            </LineChart>
          </ResponsiveContainer>
        </div>
        {["gewicht","vet","spier"].map(k=>(
          <div key={k} onClick={()=>onMetricClick(k)}>
            <MetricChart title={metaMap[k].label} value={latest(k)!=null?`${latest(k)?.toFixed?.(1)} ${metaMap[k].unit}`:null} rows={rows} dataKey={k} color={metaMap[k].color}/>
          </div>
        ))}
      </>}
    </>
  );
}

function WeekBox({label,val,unit}:{label:string;val?:string|null;unit:string}){
  return(
    <div style={{flex:1,background:"rgba(255,255,255,0.05)",borderRadius:12,padding:"10px 12px"}}>
      <div style={{fontSize:11,color:C.muted,marginBottom:4}}>{label}</div>
      <div style={{fontSize:18,fontWeight:800}}>{val??<span style={{color:C.muted}}>–</span>}<span style={{fontSize:12,color:C.muted}}>{val&&unit?" "+unit:""}</span></div>
    </div>
  );
}

function LegDot({color,label}:{color:string;label:string}){
  return(
    <span style={{display:"flex",alignItems:"center",gap:5,fontSize:11,color:"rgba(255,255,255,0.5)"}}>
      <span style={{width:8,height:8,borderRadius:2,background:color,display:"inline-block"}}/>
      {label}
    </span>
  );
}

/* ─── Activiteit Tab ─── */
function ActiviteitTab({workouts,weekWorkouts,latest,prev,goals,onEditGoals,onMetricClick}:any){
  return(
    <>
      <SectionHeader title="Vandaag" action="Doelen aanpassen" onAction={onEditGoals}/>
      <div className="goals-grid">
        <GoalCard label="Stappen" value={latest("stappen")} goal={goals.stappen} unit="stap." color={C.green} onClick={()=>onMetricClick("stappen")}/>
        <GoalCard label="Calorieën" value={latest("kcal")} goal={goals.kcal} unit="kcal" color={C.orange} onClick={()=>onMetricClick("kcal")}/>
        <GoalCard label="Water" value={latest("water")} goal={goals.water} unit="ml" color={C.teal} onClick={()=>onMetricClick("water")}/>
        <GoalCard label="Workouts 7d" value={weekWorkouts.length} goal={4} unit="" color={C.purple} onClick={()=>{}}/>
      </div>

      <SectionHeader title="Lichaamssamenstelling"/>
      <div className="vitals-grid">
        <VitalCard label="Gewicht" value={latest("gewicht")} unit="kg" prev={prev("gewicht")} onClick={()=>onMetricClick("gewicht")}/>
        <VitalCard label="Vetpercentage" value={latest("vet")} unit="%" prev={prev("vet")} higher={false} onClick={()=>onMetricClick("vet")}/>
        <VitalCard label="Spiermassa" value={latest("spier")} unit="kg" prev={prev("spier")} higher onClick={()=>onMetricClick("spier")}/>
        <VitalCard label="Rusthartslag" value={latest("rusthr")} unit="bpm" prev={prev("rusthr")} higher={false} onClick={()=>onMetricClick("rusthr")}/>
      </div>

      <SectionHeader title="Alle trainingen"/>
      <div className="sonar-card">
        {workouts.length>0?workouts.slice().reverse().slice(0,20).map((w:any,i:number)=>(
          <WorkoutRow key={i} w={w}/>
        )):<EmptySection msg="Geen workouts gevonden"/>}
      </div>
    </>
  );
}

/* ─── Bewerken Modal ─── */
function EditGoalsModal({goals,setGoals,onClose}:{goals:any;setGoals:(g:any)=>void;onClose:()=>void}){
  const [local,setLocal]=useState({...goals});
  const items=[
    {key:"stappen",label:"Stappen per dag",unit:"stap."},
    {key:"kcal",label:"Actieve calorieën",unit:"kcal"},
    {key:"slaap",label:"Slaap doel",unit:"min"},
    {key:"water",label:"Water doel",unit:"ml"},
  ];
  function save(){
    setGoals(local);
    try{ localStorage.setItem("hh_goals",JSON.stringify(local)); }catch{}
    onClose();
  }
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-header">
          <span className="modal-title">Doelen aanpassen</span>
          <button className="modal-done" onClick={save}>Gereed</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:13,color:C.muted,marginBottom:20,lineHeight:1.6}}>
            Pas je persoonlijke doelen aan. Ze worden lokaal opgeslagen op dit apparaat.
          </p>
          {items.map(({key,label,unit})=>(
            <div className="goal-edit-row" key={key}>
              <div>
                <div className="goal-edit-label">{label}</div>
                <div style={{fontSize:12,color:C.muted,marginTop:2}}>{unit}</div>
              </div>
              <input className="goal-edit-input" type="number" value={local[key]}
                onChange={e=>setLocal({...local,[key]:+e.target.value})}/>
            </div>
          ))}
          <button className="modal-save-btn" onClick={save}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Metriek detail Modal (met 7d vergelijking) ─── */
function MetricDetailModal({metaKey,meta,rows,weekAvg,onClose}:{
  metaKey:string; meta:{label:string;unit:string;color:string;higher?:boolean};
  rows:any[]; weekAvg:(k:any,offset:number)=>number|null; onClose:()=>void;
}){
  if(!meta) return null;
  const thisWeek=weekAvg(metaKey,0);
  const lastWeek=weekAvg(metaKey,1);
  const delta=(thisWeek!=null&&lastWeek!=null&&lastWeek!==0)?((thisWeek-lastWeek)/Math.abs(lastWeek))*100:null;
  const good=delta==null?"flat":Math.abs(delta)<1?"flat":(delta>0)===(meta.higher!==false)?"up":"down";
  const hasData=rows.some((r:any)=>r[metaKey]!=null);
  const allVals=rows.map((r:any)=>r[metaKey]).filter((v:any):v is number=>v!=null);
  const valMax=allVals.length?Math.max(...allVals):null;
  const valMin=allVals.length?Math.min(...allVals):null;
  const valAvg=allVals.length?+(allVals.reduce((a:number,b:number)=>a+b,0)/allVals.length).toFixed(1):null;

  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-header">
          <span className="modal-title">{meta.label}</span>
          <button className="modal-done" onClick={onClose}>Sluiten</button>
        </div>
        <div className="modal-body">
          {/* Week vergelijking */}
          <div className="detail-meta-row">
            <div className="detail-meta-box">
              <div className="detail-meta-val">{thisWeek?.toFixed(1)??<span style={{color:C.muted}}>–</span>}</div>
              <div className="detail-meta-lbl">Gem. afgelopen 7d</div>
            </div>
            <div className="detail-meta-box">
              <div className="detail-meta-val">{lastWeek?.toFixed(1)??<span style={{color:C.muted}}>–</span>}</div>
              <div className="detail-meta-lbl">Week daarvoor</div>
            </div>
          </div>
          {delta!=null&&(
            <div className="detail-delta-row">
              <span style={{fontSize:18,fontWeight:800,color:good==="up"?C.green:good==="down"?C.red:C.muted}}>
                {delta>0?"↑":delta<0?"↓":"→"}{Math.abs(delta).toFixed(0)}%
              </span>
              <span className="detail-delta-txt">
                {good==="up"?"Verbetering t.o.v. vorige week":good==="down"?"Teruggang t.o.v. vorige week":"Stabiel t.o.v. vorige week"}
              </span>
            </div>
          )}
          {/* Min/Max/Avg */}
          <div className="energy-stats" style={{marginBottom:16}}>
            <div className="energy-stat"><div className="energy-stat-val">{valMax?.toFixed(1)??"–"}</div><div className="energy-stat-lbl">Max</div></div>
            <div className="energy-stat-div"/>
            <div className="energy-stat"><div className="energy-stat-val">{valMin?.toFixed(1)??"–"}</div><div className="energy-stat-lbl">Min</div></div>
            <div className="energy-stat-div"/>
            <div className="energy-stat"><div className="energy-stat-val">{valAvg?.toFixed(1)??"–"}</div><div className="energy-stat-lbl">Gemiddeld</div></div>
          </div>
          {/* Chart */}
          {hasData?(
            <ResponsiveContainer width="100%" height={160}>
              <AreaChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
                <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}/>
                <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
                <YAxis domain={["auto","auto"]} tick={{fill:"rgba(255,255,255,0.35)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
                <Tooltip contentStyle={tt}/>
                <Area dataKey={metaKey} name={meta.label} stroke={meta.color} fill={meta.color} fillOpacity={0.15} strokeWidth={2.5} dot={false} connectNulls/>
              </AreaChart>
            </ResponsiveContainer>
          ):<EmptySection msg="Geen gegevens in deze periode"/>}
        </div>
      </div>
    </div>
  );
}

/* ─── Sub-componenten ─── */
function GoalCard({label,value,goal,unit,color,onClick}:{label:string;value:number|null;goal:number;unit:string;color:string;onClick:()=>void}){
  const v=value??0;
  const pct=Math.min(100,(v/goal)*100);
  return(
    <div className="goal-card" onClick={onClick}>
      <div className="goal-card-label">{label}</div>
      <div className="goal-card-value">
        {Math.round(v).toLocaleString("nl-NL")}
        <span className="goal-card-unit"> {unit}</span>
      </div>
      <div className="goal-bar-wrap">
        <div className="goal-bar-track"><div className="goal-bar-fill" style={{width:`${pct}%`,background:color}}/></div>
        <span className="goal-bar-pct">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function VitalCard({label,value,unit,prev,higher,onClick}:{label:string;value:number|null;unit:string;prev?:number|null;higher?:boolean;onClick:()=>void}){
  let delta:React.ReactNode=null;
  if(value!=null&&prev!=null&&prev!==0){
    const d=((value-prev)/Math.abs(prev))*100;
    const good=Math.abs(d)<0.5?"flat":higher===undefined?"flat":(d>0)===higher?"up":"down";
    delta=<span className={`vital-delta ${good}`}>{d>0?"↑":d<0?"↓":"→"} {Math.abs(d).toFixed(0)}%</span>;
  }
  return(
    <div className="vital-card" onClick={onClick}>
      <div className="vital-label">{label}</div>
      <div className="vital-value">
        {value!=null?<>{typeof value==="number"?value.toLocaleString("nl-NL"):value}<span className="vital-unit"> {unit}</span></>:<span style={{color:C.muted}}>–</span>}
      </div>
      {delta}
    </div>
  );
}

function PhaseRow({label,min,max,color}:{label:string;min:number|null;max:number;color:string}){
  const pct=min&&max>0?Math.min(100,(min/max)*100):0;
  return(
    <div className="phase-row">
      <div className="phase-top">
        <span className="phase-name">{label}</span>
        <span className="phase-val">{fmtMin(min)}</span>
      </div>
      <div className="phase-track"><div className="phase-fill" style={{width:`${pct}%`,background:color}}/></div>
    </div>
  );
}

function WorkoutRow({w}:{w:any}){
  // Defensief: als duration nog in seconden staat (> 300) → minuten
  const durMin = w.duration ? (w.duration > 300 ? Math.round(w.duration/60) : Math.round(w.duration)) : null;
  // Defensief: als energie in kJ staat (> 5000) → kcal
  const kcal = w.energy ? (w.energy > 5000 ? Math.round(w.energy/4.184) : Math.round(w.energy)) : null;
  return(
    <div className="workout-row">
      <div className="workout-ico-wrap"><WorkoutIcon name={w.name??""}/></div>
      <div className="workout-info">
        <div className="workout-name">{w.name}</div>
        <div className="workout-meta">
          {new Date(w.start).toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"short"})}
          {durMin?` · ${durMin} min`:""}
          {w.avghr?` · ${Math.round(w.avghr)} bpm`:""}
        </div>
      </div>
      {kcal&&<div className="workout-kcal">{kcal.toLocaleString("nl-NL")}<span style={{fontSize:11,opacity:.55}}> kcal</span></div>}
    </div>
  );
}

function PhotoCard({title,sub,pct,gradient}:{title:string;sub:string;pct:number;gradient:string}){
  return(
    <div className="photo-card" style={{background:gradient}}>
      <div className="photo-card-overlay"/>
      <div className="photo-card-content">
        <div className="photo-card-title">{title}</div>
        <div className="photo-card-sub">{sub}</div>
      </div>
      <SmallRing pct={pct} size={60}/>
    </div>
  );
}

function MetricChart({title,value,rows,dataKey,color}:{title:string;value:string|null;rows:any[];dataKey:string;color:string}){
  const hasData=rows.some((r:any)=>r[dataKey]!=null);
  return(
    <div className="metric-card">
      <div className="metric-label">{title}</div>
      <div className={`metric-value${!value?" metric-empty":""}`}>{value??"Geen gegevens"}</div>
      {hasData?(
        <ResponsiveContainer width="100%" height={70}>
          <LineChart data={rows} margin={{left:0,right:0,top:2,bottom:0}}>
            <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.25)",fontSize:8}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
            <YAxis domain={["auto","auto"]} tick={{fill:"rgba(255,255,255,0.25)",fontSize:8}} width={22} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={tt}/>
            <Line dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls/>
          </LineChart>
        </ResponsiveContainer>
      ):(
        <div className="metric-empty-chart">
          {["M","D","W","D","V","Z","Z"].map((d,i)=><span key={i} style={{flex:1,textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.2)"}}>{d}</span>)}
        </div>
      )}
    </div>
  );
}

function EmptySection({msg}:{msg:string}){
  return<div style={{color:C.muted,fontSize:14,textAlign:"center",padding:"16px 0"}}>{msg}</div>;
}

/* ─── Tab Bar ─── */
function TabBar({tab,onTab,onSettings}:{tab:string;onTab:(t:any)=>void;onSettings:()=>void}){
  return(
    <nav className="tabbar">
      <button className={`tab-item${tab==="home"?" active":""}`} onClick={()=>onTab("home")}>
        <IcoHome a={tab==="home"}/><span>Home</span>
      </button>
      <button className={`tab-item${tab==="trends"?" active":""}`} onClick={()=>onTab("trends")}>
        <IcoTrends a={tab==="trends"}/><span>Trends</span>
      </button>
      <button className={`tab-item${tab==="activiteit"?" active":""}`} onClick={()=>onTab("activiteit")}>
        <IcoHeart a={tab==="activiteit"}/><span>Activiteit</span>
      </button>
      <a className="tab-item" href="/chat">
        <IcoStar/><span>AI Coach</span>
      </a>
      <button className={`tab-item${tab==="instellingen"?" active":""}`} onClick={onSettings}>
        <svg width={24} height={24} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.6} strokeLinecap="round" strokeLinejoin="round"><circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1-2.83 2.83l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-4 0v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83-2.83l.06-.06A1.65 1.65 0 0 0 4.68 15a1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1 0-4h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 2.83-2.83l.06.06A1.65 1.65 0 0 0 9 4.68a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 4 0v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 2.83l-.06.06A1.65 1.65 0 0 0 19.4 9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 0 4h-.09a1.65 1.65 0 0 0-1.51 1z"/></svg>
        <span>Instellingen</span>
      </button>
    </nav>
  );
}

/* ─── Instellingen Modal ─── */
function SettingsModal({goals,setGoals,onClose}:{goals:any;setGoals:(g:any)=>void;onClose:()=>void}){
  const [local,setLocal]=useState({...goals});
  const goalItems=[
    {key:"stappen",label:"Stappen per dag",unit:"stap.",min:1000,max:30000,step:500},
    {key:"kcal",label:"Actieve calorieën",unit:"kcal",min:100,max:2000,step:50},
    {key:"slaap",label:"Slaapdoel",unit:"min",min:240,max:600,step:15},
    {key:"water",label:"Waterdoel",unit:"ml",min:500,max:5000,step:250},
  ];
  function save(){
    setGoals(local);
    try{ localStorage.setItem("hh_goals",JSON.stringify(local)); }catch{}
    onClose();
  }
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-header">
          <span className="modal-title">Instellingen</span>
          <button className="modal-done" onClick={onClose}>Sluiten</button>
        </div>
        <div className="modal-body">
          <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:12}}>
            Persoonlijke doelen
          </div>
          {goalItems.map(({key,label,unit,min,max,step})=>(
            <div key={key} style={{marginBottom:20}}>
              <div style={{display:"flex",justifyContent:"space-between",marginBottom:8}}>
                <span style={{fontSize:15,fontWeight:600}}>{label}</span>
                <span style={{fontSize:15,fontWeight:800,color:"#34C759"}}>{local[key].toLocaleString("nl-NL")} <span style={{fontSize:12,fontWeight:600,color:"rgba(255,255,255,0.4)"}}>{unit}</span></span>
              </div>
              <input type="range" min={min} max={max} step={step} value={local[key]}
                onChange={e=>setLocal({...local,[key]:+e.target.value})}
                style={{width:"100%",accentColor:"#34C759",height:4}}/>
              <div style={{display:"flex",justifyContent:"space-between",marginTop:4,fontSize:11,color:"rgba(255,255,255,0.3)"}}>
                <span>{min.toLocaleString("nl-NL")}</span><span>{max.toLocaleString("nl-NL")}</span>
              </div>
            </div>
          ))}
          <div style={{marginTop:4,borderTop:"0.5px solid rgba(255,255,255,0.08)",paddingTop:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>
              App-informatie
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
              <span style={{fontSize:15}}>Versie</span><span style={{fontSize:15,color:"rgba(255,255,255,0.4)"}}>1.0.0</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0",borderBottom:"0.5px solid rgba(255,255,255,0.07)"}}>
              <span style={{fontSize:15}}>Gebruiker</span><span style={{fontSize:15,color:"rgba(255,255,255,0.4)"}}>Max</span>
            </div>
            <div style={{display:"flex",justifyContent:"space-between",padding:"10px 0"}}>
              <span style={{fontSize:15}}>Data-ingest</span><span style={{fontSize:15,color:"#34C759"}}>Actief</span>
            </div>
          </div>
          <button className="modal-save-btn" onClick={save}>Opslaan</button>
        </div>
      </div>
    </div>
  );
}

/* ─── Info / Debug Modal ─── */
function InfoModal({onClose}:{onClose:()=>void}){
  return(
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-sheet" onClick={e=>e.stopPropagation()}>
        <div className="modal-handle"/>
        <div className="modal-header">
          <span className="modal-title">Data-diagnose</span>
          <button className="modal-done" onClick={onClose}>Sluiten</button>
        </div>
        <div className="modal-body">
          <p style={{fontSize:14,lineHeight:1.65,color:"rgba(255,255,255,0.75)",marginBottom:20}}>
            Om te controleren welke data Health Auto Export naar de app stuurt, open je deze URL in Safari:
          </p>
          <div style={{background:"rgba(255,255,255,0.06)",borderRadius:12,padding:"12px 14px",fontFamily:"monospace",fontSize:12,wordBreak:"break-all",color:"#34C759",marginBottom:20}}>
            /api/debug?key=weddendatikhetkan4923
          </div>
          <p style={{fontSize:13,lineHeight:1.6,color:"rgba(255,255,255,0.5)"}}>
            Dit toont welke metrieken in de database staan, welke slaapvelden aanwezig zijn, en hoeveel data er is per metriek.
          </p>
          <div style={{marginTop:24,borderTop:"0.5px solid rgba(255,255,255,0.08)",paddingTop:20}}>
            <div style={{fontSize:13,fontWeight:700,color:"rgba(255,255,255,0.4)",textTransform:"uppercase",letterSpacing:"0.07em",marginBottom:14}}>
              Tips voor Health Auto Export
            </div>
            {[
              "Slaap: zet alle slaap-categorieën aan (Core, Deep, REM, InBed)",
              "Workouts: zet 'Workouts' aan in de export",
              "HRV: zit onder 'Heart Rate Variability'",
              "Stel export in op dagelijks automatisch om 07:00",
              "Kies REST API als export methode",
            ].map((tip,i)=>(
              <div key={i} style={{display:"flex",gap:10,paddingBottom:10,borderBottom:"0.5px solid rgba(255,255,255,0.06)",marginBottom:10}}>
                <span style={{color:"#34C759",fontWeight:700,fontSize:14}}>{i+1}.</span>
                <span style={{fontSize:13,color:"rgba(255,255,255,0.7)",lineHeight:1.5}}>{tip}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
