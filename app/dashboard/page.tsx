"use client";

import { useEffect, useState } from "react";

type Course = { id:string; name:string; section:string|null; room:string|null; state:string|null };
type WorkItem = { id:string; type:"assignment"|"material"; title:string; description:string|null; state:string|null; dueDate:string|null; dueTime:string|null; alternateLink:string|null };

export default function DashboardPage() {
  const [courses,setCourses]=useState<Course[]>([]);
  const [selectedCourse,setSelectedCourse]=useState<Course|null>(null);
  const [items,setItems]=useState<WorkItem[]>([]);
  const [loading,setLoading]=useState(true);
  const [loadingItems,setLoadingItems]=useState(false);
  const [error,setError]=useState<string|null>(null);

  useEffect(() => {
    fetch("/api/classroom/courses")
      .then(async (response) => { const data=await response.json(); if(!response.ok) throw new Error(data.error ?? "Failed to load courses."); return data; })
      .then((data) => setCourses(data.courses ?? []))
      .catch((err) => setError(err instanceof Error ? err.message : "Failed to load courses."))
      .finally(() => setLoading(false));
  }, []);

  async function openCourse(course:Course) {
    setSelectedCourse(course); setItems([]); setLoadingItems(true); setError(null);
    try {
      const response=await fetch("/api/classroom/courses/"+encodeURIComponent(course.id)+"/work");
      const data=await response.json();
      if(!response.ok) throw new Error(data.error ?? "Failed to load coursework.");
      setItems(data.items ?? []);
    } catch(err) { setError(err instanceof Error ? err.message : "Failed to load coursework."); }
    finally { setLoadingItems(false); }
  }

  return <main className="container">
    <div className="card"><span className="badge">Student dashboard</span><h1>GCScrape</h1><p className="muted">Read-only Classroom data from the account currently connected to Google.</p></div>
    {error && <div className="card error" style={{marginTop:16}}>{error}</div>}
    <section style={{marginTop:24}}><div className="card"><h2>Courses</h2>
      {loading ? <p className="muted">Loading courses…</p> : courses.length===0 ? <p className="muted">No courses were returned for this account.</p> :
      <div className="list">{courses.map((course)=><button key={course.id} className="item" style={{textAlign:"left",color:"inherit",cursor:"pointer"}} onClick={()=>openCourse(course)}>
        <strong>{course.name}</strong><span className="muted">{[course.section,course.room,course.state].filter(Boolean).join(" • ")}</span>
      </button>)}</div>}
    </div></section>
    {selectedCourse && <section style={{marginTop:24}}><div className="card"><h2>{selectedCourse.name}</h2>
      {loadingItems ? <p className="muted">Loading coursework and materials…</p> : items.length===0 ? <p className="muted">No readable coursework or materials were returned.</p> :
      <div className="list">{items.map((item)=><div className="item" key={item.type+"-"+item.id}>
        <span className="badge">{item.type}</span><strong>{item.title}</strong>
        {item.description && <span className="muted">{item.description}</span>}
        {(item.dueDate || item.state) && <span className="muted" style={{display:"block",marginTop:8}}>{[item.state,item.dueDate,item.dueTime].filter(Boolean).join(" • ")}</span>}
        {item.alternateLink && <a className="btn secondary" style={{marginTop:12}} href={item.alternateLink} target="_blank" rel="noreferrer">Open in Classroom</a>}
      </div>)}</div>}
    </div></section>}
  </main>;
}
