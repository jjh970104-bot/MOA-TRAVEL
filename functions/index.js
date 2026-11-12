"use strict";
const {onCall, HttpsError} = require("firebase-functions/v2/https");
const admin = require("firebase-admin");
admin.initializeApp();

function seoulDay(date) {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone:"Asia/Seoul", year:"numeric", month:"2-digit", day:"2-digit"
  }).format(date);
}
function maskEmail(value) {
  const email=String(value||"");
  const at=email.indexOf("@");
  if(at<0)return "이메일 없음";
  const local=email.slice(0,at);
  return local.slice(0,Math.min(2,local.length))+"***"+email.slice(at);
}

// On-demand live Authentication summary. Never expose auth user lists to Firestore client reads.
exports.getAdminMemberOverview=onCall({region:"asia-northeast3",memory:"256MiB",timeoutSeconds:120,maxInstances:2,cors:true},async(request)=>{
  if(!request.auth||request.auth.token.email_verified!==true)
    throw new HttpsError("unauthenticated","이메일 인증된 계정만 사용할 수 있어요.");
  const uid=request.auth.uid;
  const role=await admin.firestore().doc("admins/"+uid).get();
  if(!role.exists||role.data().enabled!==true||role.data().role!=="superadmin")
    throw new HttpsError("permission-denied","MOA 관리자만 회원 현황을 확인할 수 있어요.");

  const now=new Date(),today=seoulDay(now),weekAgo=new Date(now.getTime()-7*86400000);
  const monthAgo=new Date(now.getTime()-30*86400000);
  let total=0,todayJoined=0,last7Days=0,verified=0,active30Days=0;
  const recent=[];
  let pageToken;
  do{
    const batch=await admin.auth().listUsers(1000,pageToken);
    for(const user of batch.users){
      total++;
      const created=new Date(user.metadata.creationTime);
      const signIn=user.metadata.lastSignInTime?new Date(user.metadata.lastSignInTime):null;
      if(Number.isFinite(created.getTime())){
        if(seoulDay(created)===today)todayJoined++;
        if(created>=weekAgo)last7Days++;
      }
      if(user.emailVerified)verified++;
      if(signIn&&signIn>=monthAgo)active30Days++;
      // Display an admin-only, privacy-reduced list of newest members.
      recent.push({
        uid:user.uid,
        email:maskEmail(user.email),
        joinedAt:Number.isFinite(created.getTime())?created.toISOString():null,
        lastLoginAt:signIn&&Number.isFinite(signIn.getTime())?signIn.toISOString():null,
        verified:!!user.emailVerified
      });
      if(recent.length>200)recent.sort((a,b)=>String(b.joinedAt||"").localeCompare(String(a.joinedAt||""))).splice(20);
    }
    pageToken=batch.pageToken;
    // Avoid silently reporting incomplete totals for unexpectedly large databases.
    if(total>=100000&&pageToken)throw new HttpsError("resource-exhausted","가입자 수가 집계 한도를 넘었어요. 백엔드 집계 방식 변경이 필요해요.");
  }while(pageToken);
  recent.sort((a,b)=>String(b.joinedAt||"").localeCompare(String(a.joinedAt||"")));
  return {
    registeredUsers:total, todayJoined, last7Days, verifiedUsers:verified,
    active30Days, recentMembers:recent.slice(0,20), updatedAt:now.toISOString(),
    timezone:"Asia/Seoul"
  };
});
