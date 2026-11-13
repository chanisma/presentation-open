/* quiz.json 폼 편집기 — 모르는 필드(misconceptions·tests 등)는 건드리지 않고 그대로 보존한다 */
import { useCallback, useEffect, useState } from 'react';
import { api } from './api';

type Activity = {
  id: string;
  slide: number | 'last';
  kind: string;
  prompt: string;
  options?: string[];
  answer?: unknown;
  explanation?: string;
  [extra: string]: unknown;
};
type QuizFile = { version: number; activities: Activity[] };

const KINDS: [string, string][] = [
  ['choice', '객관식'],
  ['ox', 'OX'],
  ['short', '주관식'],
  ['wordcloud', '워드클라우드'],
  ['exit', '출구 티켓'],
  ['code', '코드 실습'],
];
const KNOWN = new Set(['id', 'slide', 'kind', 'prompt', 'options', 'answer', 'explanation']);

export default function QuizEditor({
  file,
  dir,
  slide,
  onSaved,
}: {
  file: string;
  /** 수업 폴더 — 서버가 편집 기록(edits.md)을 남길 자리 */
  dir: string;
  slide: number;
  onSaved: (msg: string, undoCount: number) => void;
}) {
  const [quiz, setQuiz] = useState<QuizFile | null>(null);
  const [exists, setExists] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [error, setError] = useState('');

  const load = useCallback(() => {
    api
      .readJson<QuizFile>(file)
      .then((r) => {
        setExists(r.exists);
        setQuiz(r.data ?? { version: 1, activities: [] });
        setDirty(false);
        setError('');
      })
      .catch((e) => setError(String(e.message)));
  }, [file]);
  useEffect(load, [load]);

  if (error) return <p className="ed-note ed-note--bad">{error}</p>;
  if (!quiz) return <p className="ed-note">문항을 불러오는 중입니다.</p>;

  const update = (i: number, patch: Partial<Activity>) => {
    setQuiz({
      ...quiz,
      activities: quiz.activities.map((a, k) => (k === i ? { ...a, ...patch } : a)),
    });
    setDirty(true);
  };
  const move = (i: number, d: number) => {
    const next = [...quiz.activities];
    const j = i + d;
    if (j < 0 || j >= next.length) return;
    [next[i], next[j]] = [next[j], next[i]];
    setQuiz({ ...quiz, activities: next });
    setDirty(true);
  };
  const remove = (i: number) => {
    if (!confirm('이 문항을 삭제할까요?')) return;
    setQuiz({ ...quiz, activities: quiz.activities.filter((_, k) => k !== i) });
    setDirty(true);
  };
  const add = () => {
    const a: Activity = {
      id: `q-${Date.now().toString(36)}`,
      slide,
      kind: 'choice',
      prompt: '',
      options: ['', ''],
      answer: 0,
    };
    setQuiz({ ...quiz, activities: [...quiz.activities, a] });
    setDirty(true);
  };
  const changeKind = (i: number, kind: string) => {
    const a = quiz.activities[i];
    const patch: Partial<Activity> = { kind };
    if (kind === 'choice') {
      patch.options = a.options?.length ? a.options : ['', ''];
      patch.answer = typeof a.answer === 'number' ? a.answer : 0;
    } else {
      patch.options = undefined;
      patch.answer = kind === 'ox' ? (typeof a.answer === 'boolean' ? a.answer : true) : undefined;
    }
    update(i, patch);
  };
  const save = async () => {
    try {
      // undefined가 된 필드는 JSON.stringify가 알아서 뺀다
      const r = await api.writeJson(file, quiz, dir);
      setDirty(false);
      setExists(true);
      onSaved(`문항 ${quiz.activities.length}개를 ${file.split('/').pop()}에 저장했습니다`, r.undo);
    } catch (e) {
      setError(String((e as Error).message));
    }
  };

  return (
    <div className="ed-quiz">
      <div className="ed-quiz-bar">
        <span className="ed-path" title={file}>
          {exists ? file.split('/').slice(-2).join('/') : '아직 quiz.json이 없습니다'}
        </span>
        <button className={`ed-btn${dirty ? ' ed-btn--primary' : ''}`} disabled={!dirty} onClick={save}>
          {dirty ? '문항 저장' : '저장됨'}
        </button>
      </div>

      {quiz.activities.map((a, i) => {
        const extras = Object.keys(a).filter((k) => !KNOWN.has(k));
        const onThisSlide = a.slide === slide;
        return (
          <section key={a.id + i} className={`ed-act${onThisSlide ? ' is-here' : ''}`}>
            <header className="ed-act-head">
              <select value={a.kind} onChange={(e) => changeKind(i, e.target.value)}>
                {KINDS.map(([v, l]) => (
                  <option key={v} value={v}>
                    {l}
                  </option>
                ))}
                {!KINDS.some(([v]) => v === a.kind) && <option value={a.kind}>{a.kind}</option>}
              </select>
              <label className="ed-act-slide">
                <input
                  type="number"
                  min={1}
                  disabled={a.slide === 'last'}
                  value={a.slide === 'last' ? '' : a.slide + 1}
                  onChange={(e) => update(i, { slide: Math.max(0, Number(e.target.value) - 1) })}
                />
                쪽
              </label>
              <label className="ed-check">
                <input
                  type="checkbox"
                  checked={a.slide === 'last'}
                  onChange={(e) => update(i, { slide: e.target.checked ? 'last' : slide })}
                />
                마지막
              </label>
              <span className="ed-act-tools">
                <button title="현재 보고 있는 쪽으로 옮깁니다" onClick={() => update(i, { slide })}>
                  ⌖
                </button>
                <button title="위로" onClick={() => move(i, -1)}>
                  ↑
                </button>
                <button title="아래로" onClick={() => move(i, 1)}>
                  ↓
                </button>
                <button title="삭제" onClick={() => remove(i)}>
                  ✕
                </button>
              </span>
            </header>

            <textarea
              className="ed-input"
              rows={3}
              placeholder="학생에게 보일 질문을 적습니다"
              value={a.prompt}
              onChange={(e) => update(i, { prompt: e.target.value })}
            />

            {a.kind === 'choice' && (
              <div className="ed-opts">
                {(a.options ?? []).map((o, k) => (
                  <div key={k} className="ed-opt">
                    <input
                      type="radio"
                      name={`ans-${i}`}
                      title="정답으로 지정"
                      checked={a.answer === k}
                      onChange={() => update(i, { answer: k })}
                    />
                    <input
                      className="ed-input"
                      value={o}
                      placeholder={`선택지 ${k + 1}`}
                      onChange={(e) =>
                        update(i, {
                          options: (a.options ?? []).map((x, n) => (n === k ? e.target.value : x)),
                        })
                      }
                    />
                    <button
                      title="선택지 삭제"
                      onClick={() =>
                        update(i, {
                          options: (a.options ?? []).filter((_, n) => n !== k),
                          // 정답 번호는 지운 자리만큼 당긴다 (정답 자체를 지우면 첫 선택지로)
                          answer:
                            typeof a.answer !== 'number'
                              ? a.answer
                              : a.answer === k
                                ? 0
                                : a.answer > k
                                  ? a.answer - 1
                                  : a.answer,
                        })
                      }
                    >
                      ✕
                    </button>
                  </div>
                ))}
                <button
                  className="ed-btn ed-btn--ghost"
                  onClick={() => update(i, { options: [...(a.options ?? []), ''] })}
                >
                  + 선택지
                </button>
              </div>
            )}

            {a.kind === 'ox' && (
              <div className="ed-seg">
                {[true, false].map((v) => (
                  <button
                    key={String(v)}
                    className={a.answer === v ? 'is-on' : ''}
                    onClick={() => update(i, { answer: v })}
                  >
                    정답 {v ? 'O' : 'X'}
                  </button>
                ))}
              </div>
            )}

            <textarea
              className="ed-input"
              rows={2}
              placeholder="해설 (선택)"
              value={a.explanation ?? ''}
              onChange={(e) => update(i, { explanation: e.target.value || undefined })}
            />
            {extras.length > 0 && (
              <p className="ed-note">그대로 보존하는 필드: {extras.join(', ')}</p>
            )}
          </section>
        );
      })}

      <button className="ed-btn ed-btn--ghost ed-add" onClick={add}>
        + {slide + 1}쪽에 문항 추가
      </button>
    </div>
  );
}
