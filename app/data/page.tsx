"use client";

import { useEffect, useMemo, useState } from "react";
import AppNav from "@/app/components/nav";

type Item = { id:string; courseId:string; courseName:string; type:"assignment"|"material"; title:string; description:string|null; state:string|null; submissionState:string|null; turnedIn:boolean; dueDate:string|null; dueTime:string|null; alternateLink:string|null };
type SortKey = "due"|"title"|"class"|"type"|"state";
type ViewFilter = "all"|"upcoming"|"overdue";

function dueTimestamp(item: Item) { if (!item.dueDate) return Number.POSITIVE_INFINITY; return new Date(item.dueDate + "T" + (item.dueTime ?? "23:59:59")).getTime(); }

export default function DataPage() {
  const [items,setItems]=useState<Item[]>([]), [loading,setLoading]=useState(true), [error,setError]=useState<string|null>(null);
  const [search,setSearch]=useState(""), [typeFilter,setTypeFilter]=useState<"all"|"assignment"|"material">("all"), [classFilter,setClassFilter]=useState("all");
  const [viewFilter,setViewFilter]=useState<ViewFilter>("all"), [sortKey,setSortKey]=useState<SortKey>("due"), [sortDirection,setSortDirection]=useState<"asc"|"desc">("asc");
  const [hideTurnedIn,setHideTurnedIn]=useState(false), [hideNoDueDate,setHideNoDueDate]=useState(false);

  useEffect(() => { fetch("/api/classroom/work").then(async r => { const d=await r.json(); if(!r.ok) throw new Error(d.error ?? "Failed to load Classroom data."); return d; }).then(d=>setItems(d.items ?? [])).catch(e=>setError(e instanceof Error?e.message:"Failed to load Classroom data.")).finally(()=>setLoading(false)); }, []);

  const classes=useMemo(()=>[...new Map(items.map(i=>[i.courseId,i.courseName])).entries()].sort((a,b)=>a[1].localeCompare(b[1])),[items]);
  const visibleItems=useMemo(()=>{
    const q=search.trim().toLowerCase(), now=Date.now();
    return items.filter(item=>{
      const hasDue=Boolean(item.dueDate), due=dueTimestamp(item), hay=[item.title,item.description,item.courseName,item.state,item.submissionState].filter(Boolean).join(" ").toLowerCase();
      const view=viewFilter==="all" || (viewFilter==="upcoming"&&hasDue&&due>=now&&!item.turnedIn) || (viewFilter==="overdue"&&hasDue&&due<now&&!item.turnedIn);
      return (!q||hay.includes(q))&&(typeFilter==="all"||item.type===typeFilter)&&(classFilter==="all"||item.courseId===classFilter)&&view&&!(hideTurnedIn&&item.turnedIn)&&!(hideNoDueDate&&!hasDue);
    }).sort((a,b)=>{
      let r=0; if(sortKey==="due")r=dueTimestamp(a)-dueTimestamp(b); if(sortKey==="title")r=a.title.localeCompare(b.title); if(sortKey==="class")r=a.courseName.localeCompare(b.courseName); if(sortKey==="type")r=a.type.localeCompare(b.type); if(sortKey==="state")r=(a.state??"").localeCompare(b.state??""); return sortDirection==="asc"?r:-r;
    });
  },[items,search,typeFilter,classFilter,viewFilter,sortKey,sortDirection,hideTurnedIn,hideNoDueDate]);

  const assignmentCount=items.filter(i=>i.type==="assignment").length, materialCount=items.filter(i=>i.type==="material").length, turnedInCount=items.filter(i=>i.turnedIn).length;

  return <div className="app-shell"><AppNav /><main className="page-content">
    <div className="page-heading"><div className="eyebrow">Classroom data</div><h1>Everything, together.</h1><p className="hero-copy">Assignments and materials from all of your classes.</p></div>
    {error&&<div className="notice error">{error}</div>}
    <section className="stats-grid">
      <div className="stat-card"><span>Classes</span><strong>{classes.length}</strong></div><div className="stat-card"><span>Assignments</span><strong>{assignmentCount}</strong></div>
      <div className="stat-card"><span>Materials</span><strong>{materialCount}</strong></div><div className="stat-card"><span>Turned in</span><strong>{turnedInCount}</strong></div>
    </section>
    <section className="data-panel">
      <div className="toolbar">
        <input className="input" aria-label="Search all classes" placeholder="Search all classes…" value={search} onChange={e=>setSearch(e.target.value)}/>
        <select className="input" value={classFilter} onChange={e=>setClassFilter(e.target.value)} aria-label="Filter by class"><option value="all">All classes</option>{classes.map(([id,name])=><option key={id} value={id}>{name}</option>)}</select>
        <select className="input" value={typeFilter} onChange={e=>setTypeFilter(e.target.value as typeof typeFilter)} aria-label="Filter by type"><option value="all">All types</option><option value="assignment">Assignments</option><option value="material">Materials</option></select>
        <select className="input" value={sortKey} onChange={e=>{setSortKey(e.target.value as SortKey);setSortDirection("asc")}} aria-label="Sort data"><option value="due">Due date</option><option value="title">Title</option><option value="class">Class</option><option value="type">Type</option><option value="state">State</option></select>
        <button className="secondary-button" onClick={()=>setSortDirection(d=>d==="asc"?"desc":"asc")}>{sortDirection==="asc"?"Ascending ↑":"Descending ↓"}</button>
      </div>
      <div className="filter-row">
        <div className="filter-group"><span>View</span>{(["all","upcoming","overdue"] as ViewFilter[]).map(v=><button key={v} className={"filter-button"+(viewFilter===v?" active":"")} onClick={()=>setViewFilter(v)}>{v[0].toUpperCase()+v.slice(1)}</button>)}</div>
        <div className="filter-group"><span>Hide</span><label className="toggle-label"><input type="checkbox" checked={hideTurnedIn} onChange={e=>setHideTurnedIn(e.target.checked)}/> Turned in</label><label className="toggle-label"><input type="checkbox" checked={hideNoDueDate} onChange={e=>setHideNoDueDate(e.target.checked)}/> No due date</label></div>
      </div>
      <div className="results-bar"><span>{loading ? "Loading…" : visibleItems.length + " of " + items.length + " items"}</span><span className="muted">Mark-as-useless controls are next.</span></div>
      {loading?<div className="loading-state">Loading your Classroom data…</div>:visibleItems.length===0?<div className="empty-state"><h2>Nothing here.</h2><p>Try changing your search or filters.</p></div>:
      <div className="data-list">{visibleItems.map(item=><article className="data-item" key={item.courseId+"-"+item.type+"-"+item.id}><div className="data-item-main">
        <div className="item-top"><span className="badge">{item.type}</span><span className="class-badge">{item.courseName}</span>{item.turnedIn&&<span className="badge">turned in</span>}</div>
        <h2>{item.title}</h2>{item.description&&<p className="description">{item.description}</p>}<div className="item-meta">{item.dueDate&&<span>Due {item.dueDate}{item.dueTime?" · "+item.dueTime:""}</span>}{item.state&&<span>{item.state.toLowerCase()}</span>}</div>
      </div>{item.alternateLink&&<a className="open-link" href={item.alternateLink} target="_blank" rel="noreferrer">Open in Classroom ↗</a>}</article>)}</div>}
    </section>
  </main></div>;
}
