/* ── live/runtime 모듈의 타입드 로더 ──────────────────────────────────
   라이브 런타임(driver·charts·code-runner·archive·config)은 레거시 덱과
   공유하는 단일 소스다. 번들에 넣으면 import.meta.url 기반 경로(vendor,
   join URL)가 깨지므로 반드시 서빙 URL에서 동적 import한다. */

export type Channel = {
  ok: boolean;
  send(payload?: Record<string, unknown>): void;
  close(): void;
};

export type LiveActivity = {
  id: string;
  kind: string;
  prompt: string;
  status: 'draft' | 'open' | 'closed' | 'revealed';
  round?: number;
  currentRound?: number;
  config: Record<string, any>;
  gamify?: boolean;
  slideKey?: string;
  slideIndex?: number | null;
  roundCounts?: [number, number];
  responseCount?: number;
  aggregates?: Record<string, any>;
  aggregates2?: Record<string, any>;
  revealedAt?: string | null;
};

export type JoinResult = {
  sessionId: string;
  participantId: string;
  code: string;
  title?: string;
  nameMode: 'anonymous' | 'named';
  myStudentNo?: string | null;
  currentActivity: LiveActivity | null;
  currentSlide?: number;
  deckPath?: string | null;
  /** 학생 미러 화면의 클릭 차단이 풀렸는지 (교사 토글, v11) */
  allowInteract?: boolean;
  myResponses?: { activityId: string; round?: number }[];
};

export type StudentState = {
  status: 'open' | 'ended';
  currentActivity: LiveActivity | null;
  currentSlide?: number;
  allowInteract?: boolean;
  revealedAggregates?: Record<string, any> | null;
};

export type HostState = {
  session: { gamify?: boolean; allowInteract?: boolean; [k: string]: any };
  participantCount: number;
  participants: { nickname?: string; studentNo?: string | null }[];
  leaderboard?: { studentNo?: string; nickname?: string; score: number }[];
  activities: LiveActivity[];
};

export type Driver = {
  createSession(o: {
    title?: string;
    deckPath?: string | null;
    nameMode?: string;
    gamify?: boolean;
  }): Promise<{ sessionId: string; code: string; hostToken: string }>;
  resumeSession(code: string, hostToken: string): Promise<any>;
  setSlide(sessionId: string, hostToken: string, i: number): Promise<unknown>;
  /** 학생 미러 화면의 클릭 차단 해제/재잠금 (v11 — lp_set_interact) */
  setInteract(sessionId: string, hostToken: string, on: boolean): Promise<{ allowInteract?: boolean }>;
  openActivity(
    sessionId: string,
    hostToken: string,
    o: { slideKey: string; slideIndex?: number | null; kind: string; prompt: string; config: any }
  ): Promise<LiveActivity>;
  closeActivity(sessionId: string, hostToken: string, activityId: string): Promise<unknown>;
  advanceRound(sessionId: string, hostToken: string, activityId: string): Promise<LiveActivity>;
  revealActivity(sessionId: string, hostToken: string, activityId: string): Promise<any>;
  endSession(sessionId: string, hostToken: string): Promise<unknown>;
  hostState(sessionId: string, hostToken: string): Promise<HostState>;
  exportSession(sessionId: string, hostToken: string): Promise<any>;
  codeSubmissions(
    sessionId: string,
    hostToken: string,
    activityId: string
  ): Promise<{ studentNo?: string; nickname?: string; passed?: number; total?: number; code?: string }[]>;
  join(code: string, o: { clientId: string; nickname?: string; studentNo?: string | null }): Promise<JoinResult>;
  submit(
    activityId: string,
    participantId: string,
    clientId: string,
    payload: Record<string, unknown>,
    round?: number
  ): Promise<{ ok: boolean; reason?: string; round?: number; updated?: boolean }>;
  studentState(code: string, clientId: string): Promise<StudentState>;
  connectChannel(code: string, onPing: (p: Record<string, any>) => void): Promise<Channel>;
};

export type ConfigModule = {
  getConfig(): Record<string, any>;
  setConfig(patch: Record<string, any>): void;
  joinUrl(code?: string): string;
  getClientId(): string;
  saveHostSession(info: Record<string, any>): void;
  loadHostSession(code: string): Record<string, any> | null;
  listHostSessions(): Record<string, any>[];
  removeHostSession(code: string): void;
};

export type PythonRunner = {
  preload(): void;
  run(
    code: string,
    tests: { call: string; expected: string }[],
    timeoutMs?: number
  ): Promise<{ stdout: string; error: string | null; results: { call: string; expected: string; got: string; ok: boolean }[] }>;
  destroy(): void;
};

const url = (p: string) => new URL(p, document.baseURI).href;

export const loadConfig = (): Promise<ConfigModule> =>
  import(/* @vite-ignore */ url('live/runtime/config.js'));

export async function loadDriver(): Promise<Driver> {
  const m = await import(/* @vite-ignore */ url('live/runtime/driver.js'));
  return m.createDriver();
}

export const loadCharts = (): Promise<{
  renderAggregates(el: HTMLElement, activity: { kind: string; config: any }, agg: any, opts?: { theme?: string }): void;
}> => import(/* @vite-ignore */ url('live/runtime/charts.js'));

export const loadCodeRunner = (): Promise<{
  createPythonRunner(o: { onStatus?: (s: string) => void }): PythonRunner;
  renderWebPreview(iframe: HTMLIFrameElement, code: string): void;
}> => import(/* @vite-ignore */ url('live/runtime/code-runner.js'));

export const loadArchive = (): Promise<{
  archiveToSheet(dump: any, targetUrl?: string): Promise<{ status: string; rows: { responses: number; activities: number }; sheetUrl?: string }>;
}> => import(/* @vite-ignore */ url('live/runtime/archive.js'));

/* qrcode.js는 ESM이 아니라 window.qrcode 전역 스크립트 */
let qrPromise: Promise<any> | null = null;
export function loadQrLib(): Promise<any> {
  const w = window as any;
  if (w.qrcode) return Promise.resolve(w.qrcode);
  if (!qrPromise) {
    qrPromise = new Promise((resolve, reject) => {
      const s = document.createElement('script');
      s.src = url('live/vendor/qrcode.js?v=1');
      s.onload = () => resolve(w.qrcode);
      s.onerror = () => reject(new Error('qrcode.js 로드 실패'));
      document.head.appendChild(s);
    });
  }
  return qrPromise;
}
