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

### /tasklist: 초기 빈 화면 해소 및 로그인 리다이렉트 UX 보강

- **문제**
  - /tasklist 초기 진입 시 `if (loading) return null`로 인해 본문이 빈 화면(먹통처럼 보임)
  - 해당 컴포너트는 클라이언트 컴포넌트로 app/loading.tsx가 적용되지 않음
- **판단**
  - 로딩 상태의 의미를 “그룹 목록(getGroup) 초기 로딩”으로 제한해 책임을 명확히 함
  - 비로그인 상태는 데이터 로딩이 아니라 “이동 중” 상태이므로, 로딩 UI와 분리해 안내 제공
  - hydration 구간은 헤더에서 이미 로딩 UI 제공하기 때문에 본문에 로딩 없앰(중복 로딩 X)
- **개선**
  - loading을 isGroupLoading으로 의미 분리
  - getGroup 패칭은 finally에서 로딩 종료를 보장해 종료 조건을 명확화
  - !isLogin 구간에서 router.push("/login") 전, “로그인 페이지로 이동 중…” 안내 UI 노출
- **결과**:
  - /tasklist 초기 진입 시 빈 화면 구간을 줄이고, 사용자가 상태를 인지할 수 있도록 UX 개선
  - 로딩 상태의 책임 범위를 명확하게 하여 추후 리팩토링에서 로딩/가드 혼선 줄일 기반 확보

### /tasklist: optimistic update 레이스 차단 및 부분 롤백 적용

- **문제**
  - 연타/중복 요청이 가능해 API 응답 전 UI 변경 및 toast 중복 발생
  - 실패 시 전체 스냅샷 롤백으로 최신 상태가 덮어써질 위험
  - 삭제 실패 시 상세 패널이 닫히거나 URL이 변경되는 등 과격한 UI 전환 발생
- **판단**
  - task 단위 pending으로 중복 요청을 차단하고, 롤백 범위를 해당 task로 축소
  - 성공 시 서버 응답(task)으로 상태를 동기화하여 클라이언트/서버 불일치 최소화
  - 삭제는 비낙관적으로 처리해 confirm 이후에도 모달/상세 패널을 유지하고, 성공/실패가 확정될 때까지 버튼을 disabled+loading 처리
- **개선**
  - pending/disable: pendingTaskIds(Set) 도입 + 핸들러/버튼 가드로 동일 task 중복 액션 차단
  - 부분 롤백: 실패 시 snapshot 기반으로 해당 task만 복구
  - 삭제 안정화:
    - 상세/리스트 모두 삭제 성공 시에만 리스트 제거
    - 실패 시 상태/URL 유지 + toast만 노출
  - 상세 수정 안정화: 수정 실패 시 편집 모드를 유지해 입력값 유실 방지
- **결과**
  - 동일 task 연타 시에도 UI가 “마지막 의도” 기준으로 안정적으로 유지
  - 실패 상황에서도 화면이 닫히거나 삭제된 것처럼 보이는 혼란 제거
  - URL, 모달, 상세 패널 상태가 성공/실패 결과와 일관되게 유지되어 신뢰 가능한 UX 제공

### /tasklist: 날짜 SSOT(startDate) 정규화 및 KST 날짜-only 정책 통일

- **문제**
  - UTC ↔ KST 변환 과정에서 날짜가 하루 밀리는 이슈가 발생할 수 있었음
  - 생성 시 “9시 고정” 같은 임시 로직이 존재해 정책이 불명확했음
  - Date 객체와 문자열(date param)이 혼용되어 URL·UI·API 간 기준이 달랐음
  - 서버 응답이 date 또는 startDate로 혼재되어 타입 안정성이 낮았음
- **판단**
  - tasklist 화면은 “시간이 아닌 날짜 중심” 도메인이므로 날짜-only 정책으로 단순화
  - 클라이언트 SSOT를 startDate로 통일하고 API 응답은 프론트에서 정규화
  - Date 객체 기반 계산 대신 KST YYYY-MM-DD param 기반 흐름으로 변경
  - 생성 payload는 로컬 날짜 → 00:00Z ISO로 정규화하여 서버와 일관성 유지
- **개선**
  - 날짜 유틸 추가: `toKstDateParam`, `getTodayKstParam`, `kstParamToStartDateISO`
  - DateNavigator를 Date 객체 대신 KST param 기반 로직으로 전환
  - **TaskCreateModal**
    - startDate 상태를 Date → string param으로 변경
    - “9시 고정” 로직 제거 후 제출 시 00:00Z 정규화
  - **getTaskList**: `startDate ?? date` 기반으로 Task 정규화 후 SSOT 통일
  - **TaskListContainer**: 날짜 계산을 KST param 기준으로 변경
  - **TaskDetailsContainer**: 시간 UI 제거 (날짜-only 정책 반영)
- **결과**
  - UTC/KST 혼용으로 인한 날짜 밀림 가능성 제거
  - 생성/조회/URL/렌더링이 동일한 날짜 기준으로 동작
  - 날짜 관련 코드가 Date 객체 의존에서 문자열 param 기반으로 단순화
  - 서버 응답 구조가 달라도 프론트 내부 모델(Task)이 안정적으로 유지됨
  - 불필요한 시간 처리 로직 제거로 유지보수성과 가독성 개선
