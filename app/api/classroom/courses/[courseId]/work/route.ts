import { randomUUID } from "node:crypto";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClassroomClient } from "@/app/lib/google";
import { decryptRefreshToken, sessionCookie } from "@/app/lib/session";

type WorkItem = {
  id:string;
  type:"assignment"|"material";
  title:string;
  description:string|null;
  state:string|null;
  submissionState:string|null;
  turnedIn:boolean;
  dueDate:string|null;
  dueTime:string|null;
  alternateLink:string|null;
};

function dueDate(item: { dueDate?: { year?: number|null; month?: number|null; day?: number|null }|null }) {
  if (!item.dueDate?.year || !item.dueDate.month || !item.dueDate.day) return null;
  return [item.dueDate.year, String(item.dueDate.month).padStart(2,"0"), String(item.dueDate.day).padStart(2,"0")].join("-");
}

function dueTime(item: { dueTime?: { hours?: number|null; minutes?: number|null; seconds?: number|null }|null }) {
  if (item.dueTime?.hours == null || item.dueTime.minutes == null) return null;
  return [String(item.dueTime.hours).padStart(2,"0"), String(item.dueTime.minutes).padStart(2,"0"), String(item.dueTime.seconds ?? 0).padStart(2,"0")].join(":");
}

export async function GET(_request: Request, { params }: { params: Promise<{ courseId:string }> }) {
  try {
    const value = (await cookies()).get(sessionCookie)?.value;
    if (!value) return NextResponse.json({ error:"Not signed in." }, { status:401 });
    const { courseId } = await params;
    const classroom = createClassroomClient(decryptRefreshToken(value));

    const [courseWorkResponse, materialsResponse, submissionsResponse] = await Promise.all([
      classroom.courses.courseWork.list({ courseId, pageSize:100, orderBy:"updateTime desc" }),
      classroom.courses.courseWorkMaterials.list({ courseId, pageSize:100, orderBy:"updateTime desc" }),
      classroom.courses.courseWork.studentSubmissions.list({
        courseId,
        courseWorkId:"-",
        userId:"me",
        pageSize:100
      })
    ]);

    const submissionsByCourseWorkId = new Map(
      (submissionsResponse.data.studentSubmissions ?? [])
        .filter((submission) => submission.courseWorkId)
        .map((submission) => [submission.courseWorkId as string, submission])
    );

    const assignments: WorkItem[] = (courseWorkResponse.data.courseWork ?? []).map((item) => {
      const submission = item.id ? submissionsByCourseWorkId.get(item.id) : undefined;
      const submissionState = submission?.state ?? null;
      return {
        id:item.id ?? randomUUID(),
        type:"assignment",
        title:item.title ?? "Untitled assignment",
        description:item.description ?? null,
        state:item.state ?? null,
        submissionState,
        turnedIn:submissionState === "TURNED_IN" || submissionState === "RETURNED",
        dueDate:dueDate(item),
        dueTime:dueTime(item),
        alternateLink:item.alternateLink ?? null
      };
    });

    const materials: WorkItem[] = (materialsResponse.data.courseWorkMaterial ?? []).map((item) => ({
      id:item.id ?? randomUUID(),
      type:"material",
      title:item.title ?? "Untitled material",
      description:item.description ?? null,
      state:item.state ?? null,
      submissionState:null,
      turnedIn:false,
      dueDate:null,
      dueTime:null,
      alternateLink:item.alternateLink ?? null
    }));

    return NextResponse.json({ items:[...assignments, ...materials] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load coursework.";
    return NextResponse.json({ error: message }, { status:500 });
  }
}
