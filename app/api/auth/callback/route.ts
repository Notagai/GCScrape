import { google } from "googleapis";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");

  if (!code) {
    return NextResponse.json({error:"Missing OAuth code"}, {status:400});
  }

  try {
    const client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    const { tokens } = await client.getToken(code);
    client.setCredentials(tokens);

    const classroom = google.classroom({version:"v1", auth:client});
    const response = await classroom.courses.list({pageSize:100});

    return NextResponse.json({
      ok:true,
      message:"OAuth and Classroom API access succeeded.",
      courses:(response.data.courses ?? []).map(course => ({
        id:course.id,
        name:course.name,
        section:course.section ?? null,
        room:course.room ?? null,
        state:course.courseState ?? null
      }))
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Unknown OAuth error";
    return NextResponse.json({ok:false,error:message},{status:500});
  }
}
