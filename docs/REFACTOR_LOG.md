# 🧩 개인 리팩토링 로그 (refactor 브랜치)

### 설정: next/image 외부 이미지 정책 조정

- **문제**: remotePatterns 전면 허용("\*\*") 제거 후 dev 환경에서 게시판 이미지 렌더링 에러 발생
- **판단**: 외부 이미지 출처를 제한하되, S3 및 불특정 외부 이미지는 폴백으로 안전 처리
- **개선**: S3 허용("/Coworkers/user/\*\*") + 외부 이미지 폴백 적용
- **결과**: 개발 환경 에러 제거, 이미지 렌더링 안정화 및 보안 범위 축소

### /tasklist: 삭제 실패 시 URL 유지 & 모달 클릭 전파 차단

- **문제**
  - 삭제 요청이 예외(`catch`)로 처리되는 경우, 실패임에도 후속 URL 정리 로직이 실행될 수 있음
  - List에서 삭제하기 확인버튼 클릭했을 때, task 쿼리가 일시적으로 생성되는 현상 발생
- **판단**
  - handleDeleteTask의 `catch` 경로에도 return을 추가하여 이후 URL 정리 방지
  - task 쿼리를 set하는 코드가 handleTaskClick 한 곳뿐이며,삭제 confirm 클릭 이벤트가 List의 onClick까지 전파되는 이벤트 버블링 원인 파악
- **개선**
  - `catch`도 실패로 처리, 실패 시 return하여 URL 정리 로직이 실행되지 않도록 수정
  - BaseModal(삭제 confirm에 사용)에서 `stopPropagation()`을 적용해 모달 클릭 이벤트가 상위(List)로 전파되지 않도록 차단
- **결과**
  - 삭제 실패 시 URL(task 쿼리)과 상세 상태가 불필요하게 변경되지 않는 상태 일관성 유지
  - 삭제 confirm 클릭 시 task 쿼리가 잠시 생성되는 현상 제거되어 URL-UI 불일치 및 UX 흔들림 감소
