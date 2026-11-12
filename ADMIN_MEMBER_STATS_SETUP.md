# MOA 관리자 회원 현황 배포 안내

MOA 공개 웹사이트는 GitHub Pages, 회원 인증은 Firebase Authentication을 사용합니다.
웹브라우저에서 전체 Firebase 사용자 정보를 직접 조회하면 안 되므로,
Firebase Cloud Functions 2세대 Callable API `getAdminMemberOverview`를 별도로 배포해야 관리자 화면의 숫자가 실제로 표시됩니다.

## 1) 전제 조건

- Firebase 프로젝트 ID: `moa-travel-1b87d`
- 프로젝트에서 Cloud Functions 배포가 가능한 요금제(일반적으로 Blaze) 및 필요한 Google Cloud API 활성화
- PC에 Node.js와 Firebase CLI 설치
- Firebase 프로젝트 소유자/관리자 권한 계정으로 CLI 로그인
- **중요:** 브라우저의 GitHub Pages 배포만으로 Cloud Function이 자동 배포되지는 않습니다.

## 2) 배포 명령어

이 저장소를 로컬 PC에 내려받은 뒤 터미널에서:

```bash
npm install -g firebase-tools
firebase login
firebase use moa-travel-1b87d
cd functions
npm install
npm run check
cd ..
firebase deploy --only functions:moa-admin
```

`firebase use`가 프로젝트 접근 권한을 요구하면 로그인 계정과 Firebase 프로젝트 멤버십을 확인하세요.
배포 후 Firebase Console > Build > Functions에서 `getAdminMemberOverview` 함수가
`asia-northeast3`에 존재하는지 확인합니다.

## 3) 관리자 계정 권한

Firebase Console > Firestore Database > Data > `admins/{본인 UID}` 문서를 생성 또는 확인:

```json
{ "enabled": true, "role": "superadmin" }
```

**문서 ID는 실제 본인 Firebase Authentication UID로 설정합니다.**
관리자 권한은 Firebase Console/Admin SDK에서만 부여하며,
일반 사용자 웹앱에서 임의로 설정할 수 없습니다.

## 4) MOA에서 확인

1. 이메일 인증된 관리자 계정으로 로그인
2. 상단 '모아여행장'(계정) → '관리자 센터'
3. '↻ 새로고침' 선택
4. 전체 가입자, 오늘 가입, 최근 7일 가입, 이메일 인증 완료,
   최근 30일 로그인, 최근 가입 회원 20명을 확인

- 집계 시점과 가입 일자 계산은 Asia/Seoul 기준
- 최근 가입자 목록의 이메일 주소는 일부를 가려 표시
- 개인 여행/경비 데이터는 관리자 통계에서 읽지 않음
- 서버에서 `admins/{uid}`의 superadmin 여부를 다시 검증
- 함수 미배포 또는 관리자 권한 미설정 시 실제 수치는 나타나지 않고 '—'로 표시됨

## 5) 운영/비용 안내

이 함수는 관리자가 새로고침할 때 Firebase Auth 사용자 목록을 전체 조회합니다.
회원 수가 많아질 경우 호출 비용과 지연이 늘 수 있으므로 예약 집계로 전환하는 것을 권장합니다.
현재 함수는 10만 명을 넘으면 불완전한 숫자를 반환하지 않고 오류를 표시합니다.
회원 정보 외부 제공, 무단 이메일 공개, 자동화된 대량 내보내기는 구현하지 않았습니다.

## 6) 장애 시

- `functions/not-found`: 함수가 아직 배포되지 않았거나 region이 다릅니다
- `functions/permission-denied`: Firestore 관리자 역할 또는 UID를 확인하세요
- `functions/unauthenticated`: 이메일 인증 상태/로그인을 확인하세요
- CORS/네트워크 문제: Firebase Functions 연결, 프로젝트 설정, 브라우저 콘솔을 점검하세요
