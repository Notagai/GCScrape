import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClassroomClient } from "@/app/lib/google";
import { decryptRefreshToken, sessionCookie } from "@/app/lib/session";

export async function GET() {
  try {
    const value = (await cookies()).get(sessionCookie)?.value;
    if (!value) {
      return NextResponse.json({ error: "Not signed in." }, { status: 401 });
    }

    const classroom = createClassroomClient(decryptRefreshToken(value));
    const response = await classroom.courses.list({
      pageSize: 100,
      courseStates: ["ACTIVE", "ARCHIVED"]
    });

    return NextResponse.json({
      courses: (response.data.courses ?? []).map((course) => ({
        id: course.id,
        name: course.name,
        section: course.section ?? null,
        room: course.room ?? null,
        state: course.courseState ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Failed to load courses.";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
