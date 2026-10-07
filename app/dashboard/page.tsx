"use client";

import { useEffect, useMemo, useState } from "react";

type Course = { id:string; name:string; section:string|null; room:string|null; state:string|null };
type WorkItem = { id:string; type:"assignment"|"material"; title:string; description:string|null; state:string|null; submissionState:string|null; turnedIn:boolean; dueDate:string|null; dueTime:string|null; alternateLink:string|null };
type SortKey = "due" | "title" | "type" | "state";
type ViewFilter = "all" | "upcoming" | "overdue";

function dueTimestamp(item: WorkItem) {
  if (!item.dueDate) return Number.POSITIVE_INFINITY;
  return new Date(item.dueDate + "T" + (item.dueTime ?? "23:59:59")).getTime();
}

function isTurnedIn(item: WorkItem) {
  return item.turnedIn;
}

export default function DashboardPage() {
  const [courses,setCourses]=useState<Course[]>([]);
  const [selectedCourse,setSelectedCourse]=useState<Course|null>(null);
  const [items,setItems]=useState<WorkItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadingItems,setLoadingItems]=useState(false);
  const [error,setError]=useState<string|null>(null);
  const [search,setSearch]=useState("");
  const [typeFilter,setTypeFilter]=useState<"all"|"assignment"|"material">("all");
  const [sortKey,setSortKey]=useState<SortKey>("due");
  const [sortDirection,setSortDirection]=useState<"asc"|"desc">("asc");
  const [viewFilter,setViewFilter]=useState<ViewFilter>("all");
  const [hideMaterials,setHideMaterials]=useState(false);
  const [hideTurnedIn,setHideTurnedIn]=useState(false);
  const [hideNoDueDate,setHideNoDueDate]=useState(false);

  useEffect(() => {
    fetch("/api/classroom/courses")
      .then(async (response) => { const data=await response.json(); if(!response.ok) throw new Error(data.error ?? "Failed to load courses."); return data; })
      .then((data) => setCourses(data.courses ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  async function openCourse(course:Course) {
    setSelectedCourse(course); setItems([]); setSearch(""); setTypeFilter("all"); setSortKey("due"); setSortDirection("asc"); setViewFilter("all"); setHideMaterials(false); setHideTurnedIn(false); setHideNoDueDate(false); setLoadingItems(true); setError(null);
    try {
      const response=await fetch("/api/classroom/courses/"+encodeURIComponent(course.id)+"/work");
      const data=await response.json();
      if(!response.ok) throw new Error(data.error ?? "Failed to load coursework.");
      setItems(data.items ?? []);
    } catch(err) { setError(err instanceof Error ? err.message : "Failed to load coursework."); }
    finally { setLoadingItems(false); }
  }

  const visibleItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    const now = Date.now();

    const filtered = items.filter((item) => {
      const matchesType = typeFilter === "all" || item.type === typeFilter;
      const haystack = [item.title, item.description, item.state, item.submissionState].filter(Boolean).join(" ").toLowerCase();
      const hasDueDate = Boolean(item.dueDate);
      const turnedIn = isTurnedIn(item);
      const due = dueTimestamp(item);
      const matchesView =
        viewFilter === "all" ||
        (viewFilter === "upcoming" && hasDueDate && due >= now && !turnedIn) ||
        (viewFilter === "overdue" && hasDueDate && due < now && !turnedIn);

      return matchesType &&
        (!query || haystack.includes(query)) &&
        matchesView &&
        !(hideMaterials && item.type === "material") &&
        !(hideTurnedIn && turnedIn) &&
        !(hideNoDueDate && !hasDueDate);
    });

    return [...filtered].sort((a,b) => {
      let result = 0;
      if (sortKey === "due") result = dueTimestamp(a) - dueTimestamp(b);
      if (sortKey === "title") result = a.title.localeCompare(b.title);
      if (sortKey === "type") result = a.type.localeCompare(b.type);
      if (sortKey === "state") result = (a.state ?? "").localeCompare(b.state ?? "");
      return sortDirection === "asc" ? result : -result;
    });
  }, [items, search, typeFilter, sortKey, sortDirection, viewFilter, hideMaterials, hideTurnedIn, hideNoDueDate]);

  function changeSort(next: SortKey) {
    if (sortKey === next) setSortDirection((direction) => direction === "asc" ? "desc" : "asc");
    else { setSortKey(next); setSortDirection("asc"); }
  }

  return <main className="container">
    <div className="card"><span className="badge">Student dashboard</span><h1>GCScrape</h1><p className="muted">Read-only Classroom data from the account currently connected to Google.</p></div>

    {error && <div className="card error" style={{marginTop:16}}>{error}</div>}

    <section style={{marginTop:24}}><div className="card"><h2>Courses</h2>
      {loading ? <p className="muted">Loading courses…</p> : courses.length===0 ? <p className="muted">No courses were returned for this account.</p> :
      <div className="list">{courses.map((course)=><button key={course.id} className={"item course-button"+(selectedCourse?.id===course.id ? " selected" : "")} onClick={()=>openCourse(course)}>
        <strong>{course.name}</strong><span className="muted">{[course.section,course.room,course.state].filter(Boolean).join(" • ")}</span>
      </button>)}</div>}
    </div></section>

    {selectedCourse && <section style={{marginTop:24}}><div className="card">
      <div className="section-header">
        <div><h2>{selectedCourse.name}</h2><p className="muted">{visibleItems.length} of {items.length} items shown</p></div>
      </div>

      {loadingItems ? <p className="muted">Loading coursework and materials…</p> : items.length===0 ? <p className="muted">No readable coursework or materials were returned.</p> : <>
        <div className="controls">
          <input aria-label="Search coursework" className="input" placeholder="Search assignments and materials…" value={search} onChange={(event)=>setSearch(event.target.value)} />
          <select aria-label="Filter by type" className="input" value={typeFilter} onChange={(event)=>setTypeFilter(event.target.value as typeof typeFilter)}>
            <option value="all">All types</option>
            <option value="assignment">Assignments</option>
            <option value="material">Materials</option>
          </select>
          <select aria-label="Sort coursework" className="input" value={sortKey} onChange={(event)=>{setSortKey(event.target.value as SortKey);setSortDirection("asc")}}>
            <option value="due">Due date</option>
            <option value="title">Title</option>
            <option value="type">Type</option>
            <option value="state">State</option>
          </select>
          <button className="btn secondary" onClick={()=>setSortDirection((direction)=>direction==="asc"?"desc":"asc")}>
            {sortDirection === "asc" ? "Ascending ↑" : "Descending ↓"}
          </button>
        </div>

        <div className="filter-section">
          <div className="filter-title">View</div>
          <div className="filter-buttons">
            <button className={"filter-button"+(viewFilter==="all" ? " active" : "")} onClick={()=>setViewFilter("all")}>All</button>
            <button className={"filter-button"+(viewFilter==="upcoming" ? " active" : "")} onClick={()=>setViewFilter("upcoming")}>Upcoming</button>
            <button className={"filter-button"+(viewFilter==="overdue" ? " active" : "")} onClick={()=>setViewFilter("overdue")}>Overdue</button>
          </div>
        </div>

        <div className="filter-section">
          <div className="filter-title">Hide</div>
          <div className="checkbox-grid">
            <label className="checkbox-label"><input type="checkbox" checked={hideMaterials} onChange={(event)=>setHideMaterials(event.target.checked)} /> <span>Materials</span></label>
            <label className="checkbox-label"><input type="checkbox" checked={hideTurnedIn} onChange={(event)=>setHideTurnedIn(event.target.checked)} /> <span>Turned In</span></label>
            <label className="checkbox-label"><input type="checkbox" checked={hideNoDueDate} onChange={(event)=>setHideNoDueDate(event.target.checked)} /> <span>No Due Date</span></label>
            <label className="checkbox-label disabled-option"><input type="checkbox" disabled /> <span>Tagged as ___ <small>(coming later)</small></span></label>
          </div>
        </div>

        <div className="sort-buttons">
          <span className="muted">Quick sort:</span>
          <button className="text-button" onClick={()=>changeSort("due")}>Due</button>
          <button className="text-button" onClick={()=>changeSort("title")}>Title</button>
          <button className="text-button" onClick={()=>changeSort("type")}>Type</button>
          <button className="text-button" onClick={()=>changeSort("state")}>State</button>
        </div>

        {visibleItems.length === 0 ? <p className="muted empty">Nothing matches your filters.</p> :
        <div className="list">{visibleItems.map((item)=><div className="item" key={item.type+"-"+item.id}>
          <div className="item-top">
            <span className="badge">{item.type}</span>
            {item.state && <span className="badge">{item.state.toLowerCase()}</span>}
            {item.turnedIn && <span className="badge">turned in</span>}
          </div>
          <strong>{item.title}</strong>
          {item.description && <span className="muted description">{item.description}</span>}
          {(item.dueDate || item.dueTime) && <span className="due">Due {item.dueDate ?? "date unavailable"}{item.dueTime ? " at "+item.dueTime : ""}</span>}
          {item.alternateLink && <a className="btn secondary" style={{marginTop:12}} href={item.alternateLink} target="_blank" rel="noreferrer">Open in Classroom</a>}
        </div>)}</div>}
      </>}
    </div></section>}
  </main>;
}
