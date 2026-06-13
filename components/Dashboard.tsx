"use client";
import { useState } from "react";
import {
  ResponsiveContainer, LineChart, Line, BarChart, Bar, XAxis, YAxis,
  Tooltip, CartesianGrid, AreaChart, Area,
} from "recharts";
import type { DailyData, Insight } from "@/lib/summary";

/* ─── Kleuren ───────────────────────────────────────── */
const C = {
  green:"#34C759", blue:"#0A84FF", red:"#FF3B30", orange:"#FF9F0A",
  purple:"#AF52DE", teal:"#32ADE6", yellow:"#FFD60A",
  muted:"rgba(255,255,255,0.45)", border:"rgba(255,255,255,0.08)",
  track:"#2a2a2e",
};
const tt = { background:"#1c1c1e", border:"0.5px solid #38383a", borderRadius:10, color:"#fff", fontSize:12 };

/* ─── SVG Iconen (geen emoji's) ─────────────────────── */
function Ico({ d, size=24, fill="none", stroke="currentColor", sw=1.7 }:
  { d:string; size?:number; fill?:string; stroke?:string; sw?:number }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={fill}
      stroke={stroke} strokeWidth={sw} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}
const IcoHome    = ({a=false}) => <Ico d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z M9 22V12h6v10" sw={a?2.2:1.5}/>;
const IcoTrends  = ({a=false}) => <Ico d="M18 20V10M12 20V4M6 20v-6" sw={a?2.2:1.5}/>;
const IcoHeart   = ({a=false}) => <Ico d="M22 12h-4l-3 9L9 3l-3 9H2" sw={a?2.2:1.5}/>;
const IcoStar    = ({a=false}) => <Ico d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01z" sw={a?2.2:1.5}/>;
const IcoPlus    = ()          => <Ico d="M12 5v14M5 12h14" sw={2}/>;
const IcoFlash   = ()          => <Ico d="M13 2L3 14h9l-1 8 10-12h-9z" fill="currentColor" stroke="none"/>;
const IcoFire    = ()          => <Ico d="M12 2c0 0-4 4-4 9a4 4 0 0 0 8 0c0-2-1-4-1-4s-1 2-3 2-2-2-2-2 2-5 2-5z" sw={1.5}/>;
const IcoDrop    = ()          => <Ico d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" sw={1.5}/>;
const IcoBell    = ()          => <Ico d="M18 8A6 6 0 0 0 6 8c0 7-3 9-3 9h18s-3-2-3-9M13.73 21a2 2 0 0 1-3.46 0" sw={1.5}/>;
const IcoUser    = ()          => <Ico d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z" sw={1.5}/>;
const IcoChevron = ()          => <Ico d="M6 9l6 6 6-6" sw={1.8}/>;
const IcoRight   = ()          => <Ico d="M9 18l6-6-6-6" sw={1.8}/>;

/* ─── Helpers ────────────────────────────────────────── */
function fmtDay(d:string){ return new Date(d+"T12:00:00").toLocaleDateString("nl-NL",{day:"numeric",month:"short"}); }
function fmtMin(min:number|null){
  if(!min||min<=0) return "–";
  const h=Math.floor(min/60), m=Math.round(min%60);
  return h>0?`${h}u ${m}m`:`${m}m`;
}
function colorForPct(p:number){ return p>=70?C.green:p>=40?C.orange:C.red; }

/* ─── Sport icoon → SVG pad ─────────────────────────── */
function WorkoutIcon({name}:{name:string}){
  const n=(name||"").toLowerCase();
  let d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20"; // default: cirkel
  if(n.includes("run")||n.includes("looop")||n.includes("hardloop")) d="M13 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2M6 17l4-8 2 3 2-2 2 5";
  else if(n.includes("walk")||n.includes("wande")) d="M13 4a1 1 0 1 0 0-2 1 1 0 0 0 0 2M9 18l2-8 3 3M15 6l-3 5-3-1";
  else if(n.includes("fiet")||n.includes("cycl")) d="M5 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0M15 19a2 2 0 1 0 4 0 2 2 0 0 0-4 0M12 8h4l2 8-5-4-3 5-3-4 2-5z";
  else if(n.includes("zwem")||n.includes("swim")) d="M2 12c2-3 4-3 6 0s4 3 6 0 4-3 6 0M2 17c2-3 4-3 6 0s4 3 6 0 4-3 6 0";
  else if(n.includes("kracht")||n.includes("strength")||n.includes("tradit")) d="M6 4v16M18 4v16M2 12h20M2 7h4M18 7h4M2 17h4M18 17h4";
  else if(n.includes("yoga")) d="M12 2c0 0-4 6-4 10a4 4 0 0 0 8 0c0-4-4-10-4-10z";
  else if(n.includes("hiit")) d="M13 2L3 14h9l-1 8 10-12h-9z";
  return (
    <svg width={22} height={22} viewBox="0 0 24 24" fill="none"
      stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
      <path d={d}/>
    </svg>
  );
}

/* ─── Ring component ─────────────────────────────────── */
function Ring({pct,size=80,color=C.green,children}:{pct:number;size?:number;color?:string;children?:React.ReactNode}){
  const sw=7, r=(size-sw)/2, circ=2*Math.PI*r;
  const safe=Math.min(100,Math.max(0,pct));
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke={C.track} strokeWidth={sw}/>
        {safe>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke={color}
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(safe/100)*circ} ${circ}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>}
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",flexDirection:"column",
        alignItems:"center",justifyContent:"center",textAlign:"center"}}>
        {children}
      </div>
    </div>
  );
}

/* ─── Kleine ring voor Photo Card ───────────────────── */
function SmallRing({pct,size=64}:{pct:number;size?:number}){
  const sw=5, r=(size-sw)/2, circ=2*Math.PI*r;
  const safe=Math.min(100,Math.max(0,pct));
  return(
    <div style={{position:"relative",width:size,height:size}}>
      <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
        <circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.2)" strokeWidth={sw}/>
        {safe>0&&<circle cx={size/2} cy={size/2} r={r} fill="none" stroke="rgba(255,255,255,0.9)"
          strokeWidth={sw} strokeLinecap="round"
          strokeDasharray={`${(safe/100)*circ} ${circ}`}
          transform={`rotate(-90 ${size/2} ${size/2})`}/>}
      </svg>
      <div style={{position:"absolute",inset:0,display:"flex",alignItems:"center",justifyContent:"center",
        fontSize:13,fontWeight:800,color:"#fff"}}>{Math.round(safe)}%</div>
    </div>
  );
}

/* ─── Main component ─────────────────────────────────── */
export default function Dashboard({daily,workouts,insights,dayScore}:{
  daily:DailyData; workouts:any[]; insights:Insight[];
  dayScore:{score:number;parts:{label:string;pct:number}[]}|null;
}){
  const [tab,setTab]=useState<"home"|"trends"|"activiteit">("home");
  const [range,setRange]=useState(30);

  const allDays=Object.keys(daily).sort();
  const days=allDays.slice(-range);

  const rows=days.map(d=>{
    const m=daily[d]??{};
    const v=(k:string,f=1,dec=1)=>(m[k]!=null?+((m[k]*f).toFixed(dec)):null);
    return{
      day:fmtDay(d),
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

  const today=new Date().toLocaleDateString("nl-NL",{day:"numeric",month:"long"});
  const weekWorkouts=workouts.filter(w=>new Date(w.start)>new Date(Date.now()-7*86400000));

  /* Recovery ring: HRV vs 30d baseline */
  const latestHRV=latest("hrv");
  const baseHRVs=rows.slice(-30,-1).map(r=>r.hrv).filter((v):v is number=>v!=null);
  const avgHRV=baseHRVs.length?baseHRVs.reduce((a,b)=>a+b,0)/baseHRVs.length:50;
  const herstelPct=latestHRV?Math.min(100,Math.round((latestHRV/(avgHRV*1.2))*100)):0;
  const stappenPct=Math.min(100,Math.round(((latest("stappen")??0)/8000)*100));
  const waterPct=Math.min(100,Math.round(((latest("water")??0)/2000)*100));
  const slaapMin=latest("slaap")?Math.round((latest("slaap") as number)*60):null;
  const slaapPct=slaapMin?Math.min(100,Math.round((slaapMin/480)*100)):0;

  const hrvVals=rows.map(r=>r.hrv).filter((v):v is number=>v!=null);
  const hrvMax=hrvVals.length?Math.max(...hrvVals):null;
  const hrvMin=hrvVals.length?Math.min(...hrvVals):null;
  const hrvAvg=hrvVals.length?Math.round(hrvVals.reduce((a,b)=>a+b,0)/hrvVals.length):null;

  if(!allDays.length){
    return(
      <div className="container">
        <AppHeader today={today}/>
        <div className="empty-state">
          <svg width={56} height={56} viewBox="0 0 24 24" fill="none" stroke="rgba(255,255,255,0.3)" strokeWidth={1.2} style={{marginBottom:20}}>
            <path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zM12 8v4M12 16h.01"/>
          </svg>
          <h2>Nog geen data</h2>
          <p>Zodra Health Auto Export pusht naar<br/><code>/api/ingest</code> verschijnt hier alles.</p>
        </div>
        <TabBar tab={tab} onTab={setTab}/>
      </div>
    );
  }

  return(
    <div className="container">
      <AppHeader today={today}/>
      {tab==="home"&&<HomeTab
        herstelPct={herstelPct} stappenPct={stappenPct} waterPct={waterPct}
        latestHRV={latestHRV} hrvMax={hrvMax} hrvMin={hrvMin} hrvAvg={hrvAvg}
        slaapPct={slaapPct} slaapMin={slaapMin}
        deepMin={latest("diep")?Math.round((latest("diep") as number)*60):null}
        remMin={latest("rem")?Math.round((latest("rem") as number)*60):null}
        lightMin={latest("licht")?Math.round((latest("licht") as number)*60):null}
        latest={latest} prev={prev}
        weekWorkouts={weekWorkouts} workouts={workouts} insights={insights}
        onAI={()=>window.location.href="/chat"}
      />}
      {tab==="trends"&&<TrendsTab rows={rows} range={range} setRange={setRange}
        herstelPct={herstelPct} stappenPct={stappenPct} waterPct={waterPct} slaapPct={slaapPct}
        latest={latest} prev={prev}
      />}
      {tab==="activiteit"&&<ActiviteitTab workouts={workouts} weekWorkouts={weekWorkouts}
        latest={latest} prev={prev}
      />}
      <TabBar tab={tab} onTab={setTab}/>
    </div>
  );
}

/* ─── App Header ─────────────────────────────────────── */
function AppHeader({today}:{today:string}){
  return(
    <div className="app-header">
      <div className="header-left">
        <button className="header-date-pill">
          <svg width={13} height={13} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round"><rect x="3" y="4" width="18" height="18" rx="2"/><line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/><line x1="3" y1="10" x2="21" y2="10"/></svg>
          Vandaag, {today}
          <span style={{opacity:.6}}><IcoChevron/></span>
        </button>
      </div>
      <div className="header-right">
        <button className="header-icon-btn"><IcoUser/></button>
        <button className="header-icon-btn"><IcoBell/></button>
      </div>
    </div>
  );
}

/* ─── Home Tab ───────────────────────────────────────── */
function HomeTab({herstelPct,stappenPct,waterPct,latestHRV,hrvMax,hrvMin,hrvAvg,
  slaapPct,slaapMin,deepMin,remMin,lightMin,latest,prev,weekWorkouts,workouts,insights,onAI}:any){
  return(
    <>
      {/* Hero */}
      <div className="hero">
        <div className="hero-bg"/>
        <div className="hero-eyebrow">JOUW OVERZICHT</div>
        <div className="hero-title">
          {latestHRV?"Goedemorgen, Max":"We verzamelen\nje gegevens."}
        </div>
        <button className="ai-cta-btn" onClick={onAI}>
          <IcoStar a={false}/> Vraag het aan AI-coach
        </button>
      </div>

      {/* Drie ringen */}
      <div className="three-rings">
        <div className="ring-col">
          <div className="ring-lbl"><IcoFlash/> Herstel</div>
          <Ring pct={herstelPct} size={78} color={colorForPct(herstelPct)}>
            <div className="ring-pct">{herstelPct}%</div>
          </Ring>
        </div>
        <div className="ring-col ring-col-center">
          <div className="ring-lbl"><IcoFire/> Inspanning</div>
          <Ring pct={stappenPct} size={96} color={colorForPct(stappenPct)}>
            <div className="ring-pct ring-pct-lg">{stappenPct}%</div>
          </Ring>
        </div>
        <div className="ring-col">
          <div className="ring-lbl"><IcoDrop/> Voeding</div>
          <Ring pct={waterPct} size={78} color={colorForPct(waterPct)}>
            <div className="ring-pct">{waterPct}%</div>
          </Ring>
        </div>
      </div>

      {/* Dagelijkse doelen */}
      <SectionHeader title="Dagelijkse doelen" action="Bewerken"/>
      <div className="goals-grid">
        <GoalCard label="Stappen" value={latest("stappen")} goal={8000} unit="stappen" color={C.green}/>
        <GoalCard label="Actieve calorieën" value={latest("kcal")} goal={500} unit="cal" color={C.orange}/>
        <GoalCard label="Tijd geslapen" value={slaapMin} goal={480} unit="min" color={C.purple}/>
        <GoalCard label="Water" value={latest("water")} goal={2000} unit="ml" color={C.teal}/>
      </div>

      {/* Energie & stress (HRV) */}
      <SectionHeader title="Energie en stress"/>
      <div className="sonar-card energy-card">
        <div className="energy-header">
          <div>
            <div className="energy-value">{latestHRV??<span style={{color:C.muted}}>–</span>}
              <span className="energy-unit">{latestHRV?" ms":""}</span>
            </div>
            <div className="energy-label">Hartslagvariabiliteit (HRV)</div>
          </div>
          <div className="energy-dots">
            {[...Array(20)].map((_,i)=>{
              const filled=latestHRV&&i<Math.round((latestHRV/100)*20);
              return<div key={i} style={{width:4,height:4,borderRadius:2,
                background:filled?"#fff":"rgba(255,255,255,0.12)",margin:"0 1.5px"}}/>;
            })}
          </div>
        </div>
        <div className="energy-stats">
          <div className="energy-stat"><div className="energy-stat-val">{hrvMax??<span style={{color:C.muted}}>–</span>}</div><div className="energy-stat-lbl">Max</div></div>
          <div className="energy-stat-div"/>
          <div className="energy-stat"><div className="energy-stat-val">{hrvMin??<span style={{color:C.muted}}>–</span>}</div><div className="energy-stat-lbl">Min</div></div>
          <div className="energy-stat-div"/>
          <div className="energy-stat"><div className="energy-stat-val">{hrvAvg??<span style={{color:C.muted}}>–</span>}</div><div className="energy-stat-lbl">Gemiddeld</div></div>
        </div>
      </div>

      {/* Slaap */}
      <SectionHeader title="Slaap"/>
      <div className="sonar-card">
        <div className="sleep-row">
          <div className="sleep-left">
            <Ring pct={slaapPct} size={92} color={C.purple}>
              <div style={{fontSize:16,fontWeight:800,letterSpacing:-0.5}}>
                {slaapMin ? `${Math.floor(slaapMin/60)}u` : "–"}
              </div>
              {slaapMin&&<div style={{fontSize:11,color:C.muted,fontWeight:600}}>
                {slaapMin%60}m
              </div>}
            </Ring>
            <div className="sleep-sublabel">Gebruikelijk bereik</div>
          </div>
          <div className="sleep-phases">
            <PhaseRow label="Diepe slaap"   min={deepMin}  max={slaapMin??480} color={C.purple}/>
            <PhaseRow label="REM-slaap"     min={remMin}   max={slaapMin??480} color={C.teal}/>
            <PhaseRow label="Lichte slaap"  min={lightMin} max={slaapMin??480} color={C.blue}/>
          </div>
        </div>
      </div>

      {/* Vitale trends */}
      <SectionHeader title="Vitale trends"/>
      <div className="vitals-grid">
        <VitalCard label="Hartslagvariabiliteit" value={latest("hrv")} unit="ms" prev={prev("hrv")} higherBetter/>
        <VitalCard label="Rusthartslag" value={latest("rusthr")} unit="bpm" prev={prev("rusthr")} higherBetter={false}/>
        <VitalCard label="Gewicht" value={latest("gewicht")} unit="kg" prev={prev("gewicht")}/>
        <VitalCard label="Spiermassa" value={latest("spier")} unit="kg" prev={prev("spier")} higherBetter/>
      </div>

      {/* Training */}
      <SectionHeader title="Training"/>
      <div className="sonar-card">
        {workouts.length>0?workouts.slice(-5).reverse().map((w:any,i:number)=>(
          <WorkoutRow key={i} w={w}/>
        )):(
          <EmptySection msg="Geen workouts gevonden"/>
        )}
      </div>

      {/* Inzichten */}
      {insights.length>0&&<>
        <SectionHeader title="Inzichten"/>
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

/* ─── Trends Tab ─────────────────────────────────────── */
function TrendsTab({rows,range,setRange,herstelPct,stappenPct,waterPct,slaapPct,latest,prev}:any){
  const [filter,setFilter]=useState("alles");
  const filters=["Alles","Activiteit","Slaap","Herstel","Lichaam"];
  const latestHRV=latest("hrv"), latestSlaap=latest("slaap");

  return(
    <>
      {/* Filter tabs */}
      <div className="filter-scroll">
        {filters.map(f=>(
          <button key={f} className={`filter-pill${filter===f?" active":""}`}
            onClick={()=>setFilter(f)}>{f}</button>
        ))}
      </div>

      {/* Tijdrange */}
      <div className="segment">
        {[7,14,30,90].map(r=>(
          <button key={r} className={range===r?"active":""} onClick={()=>setRange(r)}>{r}d</button>
        ))}
      </div>

      {/* Wekelijks voortgangsrapport */}
      <SectionHeader title="Wekelijks voortgangsrapport"/>
      <div className="photo-cards">
        <PhotoCard title="Fitness" sub={`${(latest("stappen")??0).toLocaleString("nl-NL")} stappen · ${latest("kcal")??0} kcal`} pct={stappenPct} gradient="linear-gradient(120deg,#0d1f0d,#0a150a)"/>
        <PhotoCard title="Slaap" sub={`${fmtMin(latestSlaap?Math.round(latestSlaap*60):null)} geslapen`} pct={slaapPct} gradient="linear-gradient(120deg,#0d0d2e,#080820)"/>
        <PhotoCard title="Herstel" sub={`HRV ${latestHRV??"–"} ms · Rust-HR ${latest("rusthr")??"–"} bpm`} pct={herstelPct} gradient="linear-gradient(120deg,#1f100d,#150800)"/>
      </div>

      {/* Statistieken vergelijken */}
      <SectionHeader title="Statistieken vergelijken"/>
      <div className="sonar-card" style={{padding:"14px 16px"}}>
        <div className="compare-chips">
          {["Stappen","HRV","Slaap","Gewicht"].map(c=>(
            <button key={c} className="compare-chip">{c}</button>
          ))}
        </div>
        <div style={{marginTop:12}}>
          <ResponsiveContainer width="100%" height={140}>
            <AreaChart data={rows} margin={{left:0,right:0,top:4,bottom:0}}>
              <CartesianGrid stroke="rgba(255,255,255,0.05)" vertical={false}/>
              <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.4)",fontSize:9}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
              <YAxis tick={{fill:"rgba(255,255,255,0.4)",fontSize:9}} width={28} axisLine={false} tickLine={false}/>
              <Tooltip contentStyle={tt}/>
              <Area dataKey="stappen" name="Stappen" stroke={C.green} fill={C.green} fillOpacity={0.15} strokeWidth={2} connectNulls dot={false}/>
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Meer verkennen */}
      <SectionHeader title="Meer verkennen"/>
      <div className="explore-scroll">
        {[
          {ico:<IcoHeart/>,lbl:"HRV"},
          {ico:<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 0c0 5-4 9-4 14M12 2c0 5 4 9 4 14"/></svg>,lbl:"Slaap­score"},
          {ico:<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/></svg>,lbl:"Slaap­duur"},
          {ico:<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z"/></svg>,lbl:"Water"},
          {ico:<IcoTrends/>,lbl:"Gewicht"},
          {ico:<svg width={22} height={22} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={1.7} strokeLinecap="round"><rect x="2" y="7" width="20" height="15" rx="2"/><path d="M16 7V5a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v2"/></svg>,lbl:"Lichaams­compositie"},
        ].map((e,i)=>(
          <div className="explore-item" key={i}>
            <div className="explore-icon">{e.ico}</div>
            <div className="explore-label">{e.lbl}</div>
          </div>
        ))}
      </div>

      {/* Individuele metrieken */}
      <div style={{marginTop:8}}>
        <MetricChart title="Tijd geslapen" value={latestSlaap?fmtMin(Math.round(latestSlaap*60)):null} rows={rows} dataKey="slaap" color={C.purple}/>
        <MetricChart title="Hartslagvariabiliteit" value={latestHRV?`${latestHRV} ms`:null} rows={rows} dataKey="hrv" color={C.green}/>
        <MetricChart title="Rusthartslag" value={latest("rusthr")?`${latest("rusthr")} bpm`:null} rows={rows} dataKey="rusthr" color={C.red}/>
        <MetricChart title="Gewicht" value={latest("gewicht")?`${latest("gewicht")} kg`:null} rows={rows} dataKey="gewicht" color={C.blue}/>
        <MetricChart title="Vetpercentage" value={latest("vet")?`${latest("vet")}%`:null} rows={rows} dataKey="vet" color={C.orange}/>
      </div>
    </>
  );
}

/* ─── Activiteit Tab ─────────────────────────────────── */
function ActiviteitTab({workouts,weekWorkouts,latest,prev}:any){
  return(
    <>
      <SectionHeader title="Vandaag"/>
      <div className="goals-grid">
        <GoalCard label="Stappen" value={latest("stappen")} goal={8000} unit="stappen" color={C.green}/>
        <GoalCard label="Actieve calorieën" value={latest("kcal")} goal={500} unit="cal" color={C.orange}/>
        <GoalCard label="Water" value={latest("water")} goal={2000} unit="ml" color={C.teal}/>
        <GoalCard label="Workouts 7d" value={weekWorkouts.length} goal={4} unit="" color={C.purple}/>
      </div>

      <SectionHeader title="Lichaamssamenstelling"/>
      <div className="vitals-grid">
        <VitalCard label="Gewicht" value={latest("gewicht")} unit="kg" prev={prev("gewicht")}/>
        <VitalCard label="Vetpercentage" value={latest("vet")} unit="%" prev={prev("vet")} higherBetter={false}/>
        <VitalCard label="Spiermassa" value={latest("spier")} unit="kg" prev={prev("spier")} higherBetter/>
        <VitalCard label="Rusthartslag" value={latest("rusthr")} unit="bpm" prev={prev("rusthr")} higherBetter={false}/>
      </div>

      <SectionHeader title="Alle workouts"/>
      <div className="sonar-card">
        {workouts.length>0?workouts.slice().reverse().slice(0,20).map((w:any,i:number)=>(
          <WorkoutRow key={i} w={w}/>
        )):<EmptySection msg="Geen workouts gevonden"/>}
      </div>
    </>
  );
}

/* ─── Sub-components ─────────────────────────────────── */
function SectionHeader({title,action}:{title:string;action?:string}){
  return(
    <div className="section-hdr">
      <span className="section-hdr-title">{title}</span>
      {action&&<button className="section-hdr-action">{action}</button>}
    </div>
  );
}

function GoalCard({label,value,goal,unit,color}:{label:string;value:number|null;goal:number;unit:string;color:string}){
  const v=value??0;
  const pct=Math.min(100,(v/goal)*100);
  return(
    <div className="goal-card">
      <div className="goal-card-label">{label}</div>
      <div className="goal-card-value">
        {Math.round(v).toLocaleString("nl-NL")}
        <span className="goal-card-unit"> {unit}</span>
      </div>
      <div className="goal-bar-wrap">
        <div className="goal-bar-track">
          <div className="goal-bar-fill" style={{width:`${pct}%`,background:color}}/>
        </div>
        <span className="goal-bar-pct">{Math.round(pct)}%</span>
      </div>
    </div>
  );
}

function VitalCard({label,value,unit,prev,higherBetter}:{label:string;value:number|null;unit:string;prev?:number|null;higherBetter?:boolean}){
  let delta:React.ReactNode=null;
  if(value!=null&&prev!=null&&prev!==0){
    const d=((value-prev)/Math.abs(prev))*100;
    const good=Math.abs(d)<1?"flat":higherBetter===undefined?"flat":(d>0)===higherBetter?"up":"down";
    delta=<span className={`vital-delta ${good}`}>{d>0?"↑":d<0?"↓":"→"}{Math.abs(d).toFixed(0)}%</span>;
  }
  return(
    <div className="vital-card">
      <div className="vital-label">{label}</div>
      <div className="vital-value">
        {value!=null?<>{value.toLocaleString("nl-NL")}<span className="vital-unit"> {unit}</span></>:<span style={{color:C.muted}}>–</span>}
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
  return(
    <div className="workout-row">
      <div className="workout-ico-wrap"><WorkoutIcon name={w.name??""}/></div>
      <div className="workout-info">
        <div className="workout-name">{w.name}</div>
        <div className="workout-meta">
          {new Date(w.start).toLocaleDateString("nl-NL",{weekday:"short",day:"numeric",month:"short"})}
          {w.duration?` · ${Math.round(w.duration)} min`:""}
          {w.avghr?` · ${Math.round(w.avghr)} bpm`:""}
        </div>
      </div>
      {w.energy&&<div className="workout-kcal">{Math.round(w.energy)}<span style={{fontSize:11,opacity:.6}}> kcal</span></div>}
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
      <SmallRing pct={pct} size={66}/>
    </div>
  );
}

function MetricChart({title,value,rows,dataKey,color}:{title:string;value:string|null;rows:any[];dataKey:string;color:string}){
  const hasData=rows.some(r=>r[dataKey]!=null);
  return(
    <div className="metric-card">
      <div className="metric-label">{title}</div>
      <div className={`metric-value${!value?" metric-empty":""}`}>{value??"Geen gegevens"}</div>
      {hasData?(
        <ResponsiveContainer width="100%" height={72}>
          <LineChart data={rows} margin={{left:0,right:0,top:2,bottom:0}}>
            <XAxis dataKey="day" tick={{fill:"rgba(255,255,255,0.3)",fontSize:8}} axisLine={false} tickLine={false} interval="preserveStartEnd"/>
            <YAxis domain={["auto","auto"]} tick={{fill:"rgba(255,255,255,0.3)",fontSize:8}} width={22} axisLine={false} tickLine={false}/>
            <Tooltip contentStyle={tt}/>
            <Line dataKey={dataKey} stroke={color} strokeWidth={2} dot={false} connectNulls/>
          </LineChart>
        </ResponsiveContainer>
      ):(
        <div className="metric-empty-chart">
          {["M","D","W","D","V","Z","Z"].map((d,i)=>(
            <span key={i} style={{flex:1,textAlign:"center",fontSize:9,color:"rgba(255,255,255,0.25)"}}>{d}</span>
          ))}
        </div>
      )}
    </div>
  );
}

function EmptySection({msg}:{msg:string}){
  return<div style={{color:C.muted,fontSize:14,textAlign:"center",padding:"16px 0"}}>{msg}</div>;
}

/* ─── Tab Bar ────────────────────────────────────────── */
function TabBar({tab,onTab}:{tab:string;onTab:(t:any)=>void}){
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
      <button className="tab-add"><IcoPlus/></button>
    </nav>
  );
}
