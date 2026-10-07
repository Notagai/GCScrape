import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createClassroomClient } from "@/app/lib/google";
import { decryptRefreshToken, sessionCookie } from "@/app/lib/session";

type Item={id:string;courseId:string;courseName:string;type:"assignment"|"material";title:string;description:string|null;state:string|null;submissionState:string|null;turnedIn:boolean;dueDate:string|null;dueTime:string|null;alternateLink:string|null};
function dateValue(item:any){if(!item.dueDate?.year||!item.dueDate.month||!item.dueDate.day)return null;return [item.dueDate.year,String(item.dueDate.month).padStart(2,"0"),String(item.dueDate.day).padStart(2,"0")].join("-")}
function timeValue(item:any){if(item.dueTime?.hours==null||item.dueTime.minutes==null)return null;return [String(item.dueTime.hours).padStart(2,"0"),String(item.dueTime.minutes).padStart(2,"0"),String(item.dueTime.seconds??0).padStart(2,"0")].join(":")}
async function allPages<T>(getPage:(pageToken?:string)=>Promise<{data:{items?:T[];nextPageToken?:string}}>){const result:T[]=[];let pageToken:string|undefined;do{const r=await getPage(pageToken);result.push(...(r.data.items??[]));pageToken=r.data.nextPageToken??undefined}while(pageToken);return result}
async function submissions(classroom:any,courseId:string){const result:any[]=[];let pageToken:string|undefined;do{const r=await classroom.courses.courseWork.studentSubmissions.list({courseId,courseWorkId:"-",userId:"me",pageSize:100,pageToken});result.push(...(r.data.studentSubmissions??[]));pageToken=r.data.nextPageToken??undefined}while(pageToken);return result}

export async function GET(){
 try{
  const session=(await cookies()).get(sessionCookie)?.value;if(!session)return NextResponse.json({error:"Not signed in."},{status:401});
  const classroom=createClassroomClient(decryptRefreshToken(session));
  const coursesResponse=await classroom.courses.list({pageSize:100,courseStates:["ACTIVE","ARCHIVED"]}); const courses=coursesResponse.data.courses??[];
  const groups=await Promise.all(courses.map(async course=>{
    const courseId=course.id!;
    const [work,materials,subs]=await Promise.all([
      allPages<any>(pageToken=>classroom.courses.courseWork.list({courseId,pageSize:100,orderBy:"updateTime desc",pageToken})),
      allPages<any>(pageToken=>classroom.courses.courseWorkMaterials.list({courseId,pageSize:100,orderBy:"updateTime desc",pageToken})),
      submissions(classroom,courseId)
    ]);
    const byId=new Map(subs.filter(s=>s.courseWorkId).map(s=>[s.courseWorkId,s]));
    const assignments:Item[]=work.map(item=>{const s=item.id?byId.get(item.id):undefined;const state=s?.state??null;return {id:item.id??crypto.randomUUID(),courseId,courseName:course.name??"Untitled class",type:"assignment",title:item.title??"Untitled assignment",description:item.description??null,state:item.state??null,submissionState:state,turnedIn:state==="TURNED_IN"||state==="RETURNED",dueDate:dateValue(item),dueTime:timeValue(item),alternateLink:item.alternateLink??null}});
    const mats:Item[]=materials.map(item=>({id:item.id??crypto.randomUUID(),courseId,courseName:course.name??"Untitled class",type:"material",title:item.title??"Untitled material",description:item.description??null,state:item.state??null,submissionState:null,turnedIn:false,dueDate:null,dueTime:null,alternateLink:item.alternateLink??null}));
    return [...assignments,...mats];
  }));
  return NextResponse.json({items:groups.flat()});
 }catch(error){return NextResponse.json({error:error instanceof Error?error.message:"Failed to load Classroom data."},{status:500})}
}
