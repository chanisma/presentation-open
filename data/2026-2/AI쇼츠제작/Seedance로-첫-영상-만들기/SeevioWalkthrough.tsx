import { useLayoutEffect, useRef, useState, type CSSProperties } from 'react';
import { useSceneTime } from '../../../../src/scene';
import { Pointer, typed, clickFlash } from '../../../../src/walkthrough';

// Labels, hierarchy and defaults observed in the seevio.ai Korean UI (https://seevio.ai/ko), 2026-09-17.
// Research captures and DOM dumps: tmp/seevio-real/. No sign-in and no paid generation performed.
const ENTRY = { select: 2, arrive: 2.6, end: 8 };
const GEN = { input: .4, resolution: 4.2, duration: 6.2, ratio: 8.2, check: 10.4, done: 11.2, end: 14 };
const RATIOS: [string, string][] = [['자동',''],['16:9','16/9'],['9:16','9/16'],['1:1','1/1'],['4:3','4/3'],['3:4','3/4'],['21:9','21/9']];
const pulse = (t:number, at:number) => ({boxShadow:`0 0 0 ${clickFlash(t,at)*7}px #9333ea66`});

// Measure actual target centers so the pointer follows the same UI at projector sizes.
function useTargets(t:number){
 const ref=useRef<HTMLDivElement>(null);const [points,setPoints]=useState<Record<string,{x:number;y:number}>>({});
 useLayoutEffect(()=>{const scene=ref.current?.closest('[data-scene-root]');if(!scene)return;const measure=()=>{const r=scene.getBoundingClientRect();const next:typeof points={};scene.querySelectorAll<HTMLElement>('[data-pt]').forEach(el=>{const b=el.getBoundingClientRect();next[el.dataset.pt!]={x:(b.x+b.width/2-r.x)/r.width*100,y:(b.y+b.height/2-r.y)/r.height*100};});setPoints(old=>JSON.stringify(old)===JSON.stringify({...old,...next})?old:{...old,...next});};measure();const observer=new ResizeObserver(measure);observer.observe(scene);return()=>observer.disconnect();},[t]);
 return {ref,at:(id:string)=>points[id]??{x:0,y:0}};
}

// 사이트 머리줄 — 두 장면이 같은 사이트를 보여주므로 같은 마크업을 쓴다.
function SiteBar(){
 return <div className="sv-sitebar"><b><i className="sv-logo"/>Seedance 2</b>
  <nav><span>AI 비디오</span><span>AI 이미지</span><span>Seedance 2.5</span><span>가이드</span><span>가격</span></nav>
  <span className="sv-lang">한국어 ⌄</span><span className="sv-signin">로그인</span></div>;
}
function Tabs({active,flash}:{active:number;flash?:CSSProperties}){
 return <div className="sv-tabs">{['다중 참조','이미지-동영상','텍스트-동영상'].map((label,i)=>
  <span key={label} data-pt={i===2?'t2v':undefined} className={i===active?'on':''} style={i===2?flash:undefined}>{label}</span>)}</div>;
}
function Aside({kicker,title,body,note,className=''}:{kicker:string;title:string;body:string;note:string;className?:string}){
 return <aside className={`sv-aside ${className}`}><span className="sd-kicker">{kicker}</span><h2>{title}</h2><p>{body}</p><small>{note}</small></aside>;
}
function Preview(){return <div className="sv-preview"><b>▶</b><span>사이트가 보여주는 예시 영상</span></div>;}
// 입력 칸 아래에 그대로 놓인 설정 줄 — 두 장면이 같은 화면의 같은 부분을 보여준다.
function Settings({t,gen}:{t:number;gen?:{resolution:number;duration:number;ratio:number;ratioOn:boolean}}){
 return <>
  <div className="sv-label">해상도</div>
  <div className="sv-choice">{['480p','720p','1080p'].map(v=><span key={v} data-pt={gen&&v==='480p'?'resolution':undefined} className={v==='480p'?'on':''} style={gen&&v==='480p'?pulse(t,gen.resolution):undefined}>{v}</span>)}</div>
  <div className="sv-label">길이</div>
  <div className="sv-slider"><i><b data-pt={gen?'duration':undefined} style={gen?pulse(t,gen.duration):undefined}/></i><span>5초</span></div>
  <div className="sv-label">가로 세로 비율</div>
  <div className="sv-ratios">{RATIOS.map(([label,ar])=>{
   const on=label===(gen?.ratioOn?'9:16':'자동');
   return <span key={label} data-pt={gen&&label==='9:16'?'ratio':undefined} className={on?'on':''} style={gen&&label==='9:16'?pulse(t,gen.ratio):undefined}>
    {ar?<i style={{aspectRatio:ar}}/>:<i className="sv-auto">✳</i>}{label}</span>;})}</div>
 </>;
}

export function EntryWalk(){
 const t=useSceneTime();const arrived=t>=ENTRY.arrive;const {ref,at}=useTargets(t);
 return <>
  <div ref={ref} className="sv-window">
   <SiteBar/>
   <div className="sv-hero"><span className="sv-pill">Seedance 2.5 출시 · 한 번에 최대 30초 영상 생성</span><b>Seedance 2.0</b></div>
   <div className="sv-stage">
    {/* 아래로 더 이어지는 화면 — 카드 끝을 흐리게 잘라 스크롤이 남았음을 보인다 */}
    <div className="sv-card sv-more">
     <Tabs active={arrived?2:0} flash={pulse(t,ENTRY.select)}/>
     <div className="sv-label">AI 모델</div>
     <div className={`sv-model${arrived?' on':''}`}><i/><div><b>Seedance 2.5</b><em>새로운</em><em>인기</em><em>오디오 포함</em><small>최대 50개의 다중 모드 참조 및 30초 비디오 출력</small></div><span>⌄</span></div>
     {!arrived ? <>
      <div className="sv-label">참조 자료 <small>0/50</small></div>
      <div className="sv-upload">클릭하여 이미지, 동영상 또는 오디오 업로드<small>jpeg, png, webp, mp4, mov, mp3, wav</small></div>
      <div className="sv-toggle">마지막 프레임 반환<i/></div>
      <div className="sv-label">프롬프트</div>
      <div className="sv-promptbox"><span className="sv-ph">업로드된 자료를 참조하려면 @을 입력하세요…</span></div>
     </> : <>
      <div className="sv-label">프롬프트</div>
      <div className="sv-promptbox"><span className="sv-ph">만들고 싶은 동영상을 설명하세요…</span><small>0/10000</small></div>
      <Settings t={t}/>
     </>}
    </div>
    <Preview/>
   </div>
  </div>
  {arrived
   ? <Aside kicker="② 영상 생성 화면" title="AI 모델이 Seedance인지 확인" body="프롬프트 칸과 아래 설정이 보이면 준비됐습니다." note="한 사이트가 여러 모델을 함께 제공합니다. 사이트는 도구함, Seedance는 그 안에서 고르는 도구입니다."/>
   : <Aside kicker="① 첫 화면" title="텍스트-동영상 탭을 선택" body="문장만으로 만드는 화면이라 올릴 파일이 없습니다." note="실제 공개 화면의 배치와 라벨을 재현했습니다. 제공 모델은 확인 당시 예시입니다. 로그인은 오른쪽 위 로그인 버튼."/>}
  <Pointer path={[{t:.5,x:52,y:80},{t:ENTRY.select,...at('t2v'),click:true,label:'텍스트-동영상 선택'},{t:ENTRY.arrive,...at('t2v'),hide:true}]} timelineEnd={ENTRY.end}/>
 </>;
}

export function GenerateWalk(){
 const t=useSceneTime();const {ref,at}=useTargets(t);
 const input='공이 왼쪽에서 오른쪽으로 굴러가다가 멈춘다.';
 const text=typed(t,input,GEN.input,13);
 const ratio=t>GEN.ratio+.2?'9:16':'자동';
 const step=t<GEN.resolution?0:t<GEN.duration?1:t<GEN.ratio?2:t<GEN.check?3:4;
 const aside=[
  {kicker:'① 문장 입력',title:'프롬프트 칸에 문장 넣기',body:'만들고 싶은 장면을 그대로 적습니다.',note:'텍스트-동영상 탭에서는 참조 파일 없이 문장만 씁니다.'},
  {kicker:'② 설정 확인',title:'해상도 → 480p 확인',body:'설정은 메뉴 안이 아니라 입력 칸 아래에 그대로 보입니다.',note:'480p와 5초는 이 사이트의 기본값입니다. 눌러서 그대로인지 확인합니다.'},
  {kicker:'② 설정 확인',title:'길이 → 5초 확인',body:'손잡이를 왼쪽 끝에 두면 가장 짧은 4초까지 줄어듭니다.',note:'첫 연습은 짧게 만들어야 움직임 하나를 확인하기 쉽습니다.'},
  {kicker:'② 설정 확인',title:'가로 세로 비율 → 9:16으로',body:'기본값 자동에서 세로 화면으로 바꿉니다.',note:'여기가 오늘 실제로 바꾸는 값입니다. 나머지는 확인만 합니다.'},
  {kicker:'③ 생성 전 마지막 확인',title:'480p · 5초 · 9:16',body:'모델과 설정을 다시 본 뒤 생성을 누릅니다.',note:'해상도와 길이에 따라 차감되는 크레딧이 달라집니다. 여기는 설정까지의 시연이며 실제 생성은 본인 계정에서 확인합니다.'},
 ][step];
 return <>
  <div ref={ref} className="sv-window">
   <SiteBar/>
   <div className="sv-stage sv-stage-tall">
    <div className="sv-card">
     <Tabs active={2}/>
     <div className="sv-model sv-slim"><i/><div><b>Seedance 2.5</b><em>오디오 포함</em></div><span>⌄</span></div>
     <div className="sv-label">프롬프트</div>
     <div className="sv-promptbox sv-typing">{text}<span className="sv-caret">│</span><small>{text.length}/10000</small></div>
     <Settings t={t} gen={{resolution:GEN.resolution,duration:GEN.duration,ratio:GEN.ratio,ratioOn:ratio==='9:16'}}/>
     <div className="sv-batch">일괄 생성<b>1</b></div>
     <div data-pt="generate" className="sv-generate">생성</div>
    </div>
    <Preview/>
   </div>
  </div>
  <Aside className="sv-aside-gen" {...aside}/>
  <Pointer path={[{t:GEN.input,x:30,y:30,hide:true},{t:GEN.resolution,...at('resolution'),click:true,label:'해상도 480p 확인'},{t:GEN.duration,...at('duration'),click:true,label:'길이 5초 확인'},{t:GEN.ratio,...at('ratio'),click:true,label:'9:16 선택'},{t:GEN.check,...at('generate'),label:'설정 다시 확인'},{t:GEN.done,...at('generate'),hide:true}]} timelineEnd={GEN.end}/>
 </>;
}
