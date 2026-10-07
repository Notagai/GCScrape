import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClassroomClient } from "@/app/lib/google";
import { decryptRefreshToken, sessionCookie } from "@/app/lib/session";

function dueDate(value?: { year?: number | null; month?: number | null; day?: number | null }) {
  if (!value?.year || !value.month || !value.day) return null;
  return `${String(value.year).padStart(4, "0")}-${String(value.month).padStart(2, "0")}-${String(value.day).padStart(2, "0")}`;
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ courseId: string }> }
) {
  try {
    const value = (await cookies()).get(sessionCookie)?.value;
    if (!value) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const { courseId } = await context.params;
    const classroom = createClassroomClient(decryptRefreshToken(value));

    const [courseWork, materials] = await Promise.all([
      classroom.courses.courseWork.list({
        courseId,
        pageSize: 100,
        orderBy: "updateTime desc"
      }),
      classroom.courses.courseWorkMaterials.list({
        courseId,
        pageSize: 100,
        orderBy: "updateTime desc"
      })
    ]);

    const assignments = (courseWork.data.courseWork ?? []).map((work) => ({
      id: work.id ?? crypto.randomUUID(),
      type: "assignment" as const,
      title: work.title ?? "Untitled assignment",
      description: work.description ?? null,
      state: work.state ?? null,
      dueDate: dueDate(work.dueDate),
      dueTime: work.dueTime
        ? `${String(work.dueTime.hours ?? 0).padStart(2, "0")}:${String(work.dueTime.minutes ?? 0).padStart(2, "0")}`
        : null,
      alternateLink: work.alternateLink ?? null
    }));

    const materialItems = (materials.data.courseWorkMaterial ?? []).map((material) => ({
      id: material.id ?? crypto.randomUUID(),
      type: "material" as const,
      title: material.title ?? "Untitled material",
      description: material.description ?? null,
      state: material.state ?? null,
      dueDate: null,
      dueTime: null,
      alternateLink: material.alternateLink ?? null
    }));

    return NextResponse.json({ items: [...assignments, ...materialItems] });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load coursework.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
