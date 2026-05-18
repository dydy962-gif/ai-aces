# FujiGrade Netlify → Vercel 이전 작업 로그

**날짜:** 2026-05-18
**버전:** v22

## 배포 정보
- 배포 URL: https://fujigrade-ed2iieop0-dydy962-7186s-projects.vercel.app
- 레포: https://github.com/dydy962-gif/fujigrade (main 브랜치)
- 커밋: d7eefd0 "v22: Vercel 이전 + 평균내기 추가"

## Vercel 프로젝트 설정
- Vercel Team: dydy962-7186's projects (Hobby 플랜)
- Project Name: fujigrade
- Framework Preset: Other
- Root Directory: ./
- Build Command: (없음)
- Output Directory: (없음)
- Install Command: (없음)

## 환경변수
- REPLICATE_API_TOKEN: **All Environments** (Production + Preview + Development)
- Settings → Environment Variables에서 Edit 후 3개 환경 모두 체크
- Redeploy는 Dismiss 처리 (Production은 이미 동작 중, 다음 push 때 자동 반영)

## 보존된 항목 (Netlify 복구 대비)
- netlify/ 폴더 그대로
- netlify.toml 그대로
- index_backup_2026-05-15.html 백업 파일 그대로

## 추가된 파일 (v22)
- index.html (349,879 bytes - 메인 HTML)
- vercel.json (Vercel 설정 - functions/headers)
- api/sam-yolo.js (Replicate API serverless function, maxDuration 30s)

## 다음 단계
- 배포 URL 접속해서 사과 사진 업로드 테스트
- 함수 호출 정상 작동 확인 (500 에러 시 환경변수 재확인)
- (선택) 커스텀 도메인 연결: Settings → Domains
