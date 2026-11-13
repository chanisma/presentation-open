import { createElement, forwardRef, useEffect, useImperativeHandle, useRef, type CSSProperties } from 'react';
import { useDeck } from '../deck/DeckContext';

/* 교육용 파이썬 실행기 <py-runner>의 React 감싸개.
   화면 부품 본체는 assets/pyrun/py-runner.js (정적 HTML 활동지와 같은 파일)이고,
   여기서는 서빙 URL에서 동적 import 한다(번들하면 import.meta.url 경로가 깨진다 —
   live/runtime 과 같은 규칙). 사용법은 assets/pyrun/README.md.

   덱 썸네일·그리드(isStatic)에서는 lazy 로 붙여 엔진을 내려받지 않는다. */

let loading: Promise<{ preload: () => void }> | null = null;

/** 부품 모듈을 불러온다 (한 번만). */
export function loadPyRunner() {
  if (!loading) {
    const href = new URL('assets/pyrun/py-runner.js', document.baseURI).href;
    loading = import(/* @vite-ignore */ href);
  }
  return loading;
}

/** 덱을 열 때 미리 파이썬 엔진을 내려받기 시작한다. */
export function preloadPython() {
  loadPyRunner()
    .then((m) => m.preload())
    .catch(() => {});
}

export type PyRunResult = {
  code: string;
  output: string;
  /** 프로그램 출력만 (안내 문구·입력 메아리 제외) */
  prog?: string;
  inputs?: string[];
  status?: string;
  error: null | { type: string; msg: string; line: number | null };
  vars: [string, { t: string; r: string }][];
  info: Record<string, unknown>;
  checks: { label: string; ok: boolean }[] | null;
  prediction: string | null;
};

export type PyStep = {
  step: number;
  steps: number;
  line: number | null;
  vars: [string, { t: string; r: string }][];
  frames: { name: string; vars: [string, { t: string; r: string }][] }[];
  output: string;
};

export type PyRunnerHandle = {
  el: HTMLElement | null;
  run: () => Promise<unknown>;
  setCode: (s: string) => void;
  next: () => Promise<void>;
  prev: () => Promise<void>;
  reset: () => void;
  /** 기다리는 입력 줄에 값을 보낸다 */
  sendInput: (s: string) => Promise<boolean>;
};

type Props = {
  code: string;
  /** 변수 상자 보이기 */
  vars?: boolean;
  /** 한 줄씩 보기 단추 보이기 */
  step?: boolean;
  /** 'step' 이면 실행이 한 줄씩 보기로 동작 */
  mode?: 'run' | 'step';
  dots?: boolean;
  layout?: 'side' | 'stack';
  rows?: number;
  readonly?: boolean;
  /** 가릴 줄 "2-3" */
  mask?: string;
  predict?: boolean;
  label?: string;
  /** 미리 넣은 입력 — input()이 차례로 받는다 */
  inputs?: string[];
  /** 변수 상자에 자료형 이름(str·int·float) 표시 */
  types?: boolean;
  /** 편집 글자 크기(px) — 덱 설계 좌표 기준 */
  font?: number;
  ui?: number;
  style?: CSSProperties;
  className?: string;
  onRun?: (r: PyRunResult) => void;
  onStep?: (s: PyStep) => void;
  onChange?: (code: string) => void;
  /** 입력을 기다리기 시작할 때 */
  onInput?: (d: { prompt: string; inputs: string[] }) => void;
};

const flag = (b?: boolean) => (b ? '' : undefined);

const PyRunner = forwardRef<PyRunnerHandle, Props>(function PyRunner(
  { code, vars, step, mode, dots, layout, rows, readonly, mask, predict, label, inputs, types, font = 24, ui = 20, style, className, onRun, onStep, onChange, onInput },
  ref,
) {
  const { isStatic } = useDeck();
  const elRef = useRef<HTMLElement & Record<string, any>>(null);
  const onRunRef = useRef(onRun);
  onRunRef.current = onRun;
  const onStepRef = useRef(onStep);
  onStepRef.current = onStep;
  const onChangeRef = useRef(onChange);
  onChangeRef.current = onChange;
  const onInputRef = useRef(onInput);
  onInputRef.current = onInput;

  useEffect(() => {
    loadPyRunner().catch(() => {});
  }, []);

  useEffect(() => {
    const el = elRef.current;
    if (!el) return;
    const h = (e: Event) => onRunRef.current?.((e as CustomEvent).detail);
    const hs = (e: Event) => onStepRef.current?.((e as CustomEvent).detail);
    const hc = (e: Event) => onChangeRef.current?.((e as CustomEvent).detail.code);
    el.addEventListener('pyrun-run', h);
    el.addEventListener('pyrun-step', hs);
    el.addEventListener('pyrun-change', hc);
    const hi = (e: Event) => onInputRef.current?.((e as CustomEvent).detail);
    el.addEventListener('pyrun-input', hi);
    return () => {
      el.removeEventListener('pyrun-input', hi);
      el.removeEventListener('pyrun-run', h);
      el.removeEventListener('pyrun-step', hs);
      el.removeEventListener('pyrun-change', hc);
    };
  }, []);

  useImperativeHandle(ref, () => ({
    get el() {
      return elRef.current;
    },
    run: () => elRef.current?.run?.(),
    setCode: (s: string) => elRef.current?.setCode?.(s),
    next: () => elRef.current?.next?.(),
    prev: () => elRef.current?.prev?.(),
    reset: () => elRef.current?.reset?.(),
    sendInput: (s: string) => elRef.current?.sendInput?.(s) ?? Promise.resolve(false),
  }));

  return createElement(
    'py-runner',
    {
      ref: elRef,
      className,
      vars: flag(vars),
      step: flag(step),
      mode,
      dots: flag(dots),
      layout,
      rows,
      readonly: flag(readonly),
      mask,
      predict: flag(predict),
      label,
      inputs: inputs ? JSON.stringify(inputs) : undefined,
      types: flag(types),
      lazy: flag(isStatic),
      style: { display: 'block', ['--pyrun-font' as string]: `${font}px`, ['--pyrun-ui-font' as string]: `${ui}px`, ...style },
    },
    createElement('script', { type: 'text/x-python', dangerouslySetInnerHTML: { __html: code } }),
  );
});

export default PyRunner;
