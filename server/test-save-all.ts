/**
 * Save All 통합 테스트
 * 실행: npx tsx server/test-save-all.ts
 */

const BASE = "http://localhost:3001/api/scoreboard/game";

async function request(method: string, path: string, body?: unknown) {
  const res = await fetch(`${BASE}${path}`, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  const text = await res.text();
  let data: unknown;
  try { data = JSON.parse(text); } catch { data = text; }
  return { status: res.status, data };
}

async function run() {
  console.log("=== Save All 테스트 ===\n");

  // 1. 게임 생성
  console.log("1. 게임 생성 (POST /game)");
  const created = await request("POST", "", {
    ownerId: "test-owner",
    title: "Save All 테스트 경기",
    homeTeam: "홈팀",
    awayTeam: "원정팀",
    status: "IN_PROGRESS",
    players: [
      { name: "홍길동", team: "HOME", position: "투수", backNumber: "1", lineupOrder: 1 },
      { name: "김철수", team: "HOME", position: "포수", backNumber: "2", lineupOrder: 2 },
    ],
  });
  const gameId = (created.data as { id: number }).id;
  console.log(`  → status: ${created.status}, gameId: ${gameId}\n`);

  // 2. Save All (PUT) — game + players + innings 전체 교체
  console.log("2. Save All (PUT /game/:id)");
  const saveAll = await request("PUT", `/${gameId}`, {
    title: "Save All 테스트 경기",
    status: "IN_PROGRESS",
    homeTeam: "홈팀",
    awayTeam: "원정팀",
    homeScore: 3,
    awayScore: 1,
    players: [
      { name: "홍길동", team: "HOME", position: "투수", backNumber: "1", lineupOrder: 1 },
      { name: "김철수", team: "HOME", position: "포수", backNumber: "2", lineupOrder: 2 },
    ],
    innings: [
      { inningNumber: 1, topBottom: "TOP",    runs: 0, hits: 1, errors: 0 },
      { inningNumber: 1, topBottom: "BOTTOM", runs: 2, hits: 2, errors: 0 },
      { inningNumber: 2, topBottom: "TOP",    runs: 1, hits: 1, errors: 0 },
      { inningNumber: 2, topBottom: "BOTTOM", runs: 1, hits: 2, errors: 1 },
    ],
  });
  const saved = saveAll.data as { players: {id:number}[]; innings: {id:number}[] };
  console.log(`  → status: ${saveAll.status}`);
  console.log(`  → players: ${saved.players?.length}명, innings: ${saved.innings?.length}개\n`);

  // 3. 타격 기록 추가 (POST /bat)
  console.log("3. 타격 기록 추가 (POST /game/:id/bat)");
  const playerId = saved.players?.[0]?.id;
  const bat = await request("POST", `/${gameId}/bat`, {
    playerId,
    playerName: "홍길동",
    position: "투수",
    batOrder: 1,
    inningNo: 1,
    result: "SINGLE",
  });
  const batId = (bat.data as { id: string }).id;
  console.log(`  → status: ${bat.status}, recordId: ${batId}\n`);

  // 4. 투수 기록 추가 (POST /pitch)
  console.log("4. 투수 기록 추가 (POST /game/:id/pitch)");
  const pitch = await request("POST", `/${gameId}/pitch`, {
    playerId,
    playerName: "홍길동",
    innings: 5.0,
    hits: 3,
    runs: 1,
    earnedRuns: 1,
    walks: 2,
    strikeouts: 7,
    homeRuns: 0,
  });
  const pitchId = (pitch.data as { id: string }).id;
  console.log(`  → status: ${pitch.status}, recordId: ${pitchId}\n`);

  // 5. 저장된 게임 전체 조회로 검증
  console.log("5. 저장 결과 검증 (GET /game/:id)");
  const fetched = await request("GET", `/${gameId}`);
  const g = fetched.data as {
    homeScore: number; awayScore: number;
    players: unknown[]; innings: unknown[];
  };
  console.log(`  → homeScore: ${g.homeScore}, awayScore: ${g.awayScore}`);
  console.log(`  → players: ${g.players?.length}명, innings: ${g.innings?.length}개`);

  const bats = await request("GET", `/${gameId}/bat`);
  const pitches = await request("GET", `/${gameId}/pitch`);
  console.log(`  → batRecords: ${(bats.data as unknown[]).length}개`);
  console.log(`  → pitchRecords: ${(pitches.data as unknown[]).length}개\n`);

  // 6. 정리
  console.log("6. 테스트 게임 삭제");
  const del = await request("DELETE", `/${gameId}`);
  console.log(`  → status: ${del.status}`);

  console.log("\n=== 완료 ===");
}

run().catch(console.error);
