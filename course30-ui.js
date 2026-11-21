/* 30-stage curriculum adapter. The board and controls are Teaching Zone's shared engine. */
(function () {
  'use strict';
  var courseTitle='단계별 학습관 | 바둑스쿨';
  function keepCourseTitle(){if(document.title!==courseTitle)document.title=courseTitle;}
  keepCourseTitle();
  new MutationObserver(keepCourseTitle).observe(document.querySelector('title'),{childList:true,subtree:true,characterData:true});
  var data, dataPromise, role = 'body', tab = 'problem', currentBook;
  var params = new URLSearchParams(location.search);
  var requestedStage = Number(params.get('stage'));
  var requestedUnit = params.get('unit');
  var view = requestedUnit ? 'lesson' : requestedStage ? 'units' : 'stages';
  var cur = params.get('c') || 'claude';
  var isClaude = cur === 'claude';
  if (!params.get('c') && !requestedStage && !requestedUnit) view = 'curricula';
  var ready = false;
  var $ = function (id) { return document.getElementById(id); };
  var escape = function (text) { return String(text == null ? '' : text).replace(/[&<>"']/g, function(c){return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c];}); };
  function stageNumber() { return currentBook ? currentBook.courseStage : 30; }
  function chapter() { var s=window.teacherState; return s && s.currentBook && s.currentBook.chapters[s.currentChapterIndex]; }
  function stage() { return data && data.stages.find(function(s){return s.stage===stageNumber();}); }
  function ensureStage(n) {
    if (!isClaude) return Promise.resolve();
    data.loaded = data.loaded || {};
    if (!data.loaded[n]) data.loaded[n] = fetch('/course30-claude/stage_' + n + '.json?v=claude-v4-13').then(function(r){if(!r.ok)throw new Error('단계 문제 자료를 불러오지 못했습니다 ('+r.status+')');return r.json();}).then(function(j){Object.assign(data.records, j.records);});
    return data.loaded[n];
  }
  function claudeUnit() {
    var st = stage(), c = chapter();
    return st && c ? st.units.find(function(u){return u.key === c.courseUnit;}) : null;
  }
  function loadData() {
    if (!dataPromise && isClaude) dataPromise = fetch('/course30-claude/meta.json?v=claude-v4-13').then(function(r){if(!r.ok)throw new Error('클로드 커리큘럼 자료를 불러오지 못했습니다 ('+r.status+')');return r.json();}).then(function(d){ d.records = {}; data = d; return d; });
    if (!dataPromise) dataPromise = (window.BKSCourse30TestData ? Promise.resolve(window.BKSCourse30TestData) : fetch('/course30-data-v1.json?v=teacher-reuse-20261107').then(function(r){if(!r.ok)throw new Error('교육과정 자료를 불러오지 못했습니다 ('+r.status+')');return r.json();})).then(function(d){ data=d; return d; });
    return dataPromise;
  }
  function cloneProblem(id) {
    var r=data.records[id];
    if (!r) throw new Error('누락된 원문 문항: '+id);
    var p=Object.assign({},r.source);
    p._course={sourceID:id,format:r.formatAndRuleCheck && r.formatAndRuleCheck.mode || '',source:r.source};
    return p;
  }
  function canGrade(p) {
    if (!p || !/^(1|2|3)$/.test(String(p.type))) return false;
    var fields=[];
    for(var i=1;i<=5;i++){var a=String(p['answer'+i]||'').trim();if(a)fields.push(a);}
    if(!fields.length || fields.some(function(a){return !/^(?:;[BW]\[[a-s]{2}\])+$/.test(a);}))return false;
    var first=null;
    return fields.every(function(a){
      var moves=Array.from(a.matchAll(/;([BW])\[([a-s]{2})\]/g));
      if(!moves.length)return false;
      if(first===null)first=moves[0][1];
      if(moves[0][1]!==first)return false;
      var allSame=moves.every(function(m){return m[1]===moves[0][1];});
      if(!allSame){for(var j=1;j<moves.length;j++)if(moves[j][1]===moves[j-1][1])return false;}
      return true;
    });
  }
  function points(p) {
    var out=[];
    ['data','answer1','answer2','answer3','answer4','answer5'].forEach(function(k){
      var re=/(?:;|^)(?:BW|TR|CR|SQ|MA|LB|[BWTCMSL])\[([a-s])([a-s])(?::[^\]]*)?\]/gi,m;
      while((m=re.exec(String(p[k]||''))))out.push({x:m[1].toLowerCase().charCodeAt(0)-97,y:m[2].toLowerCase().charCodeAt(0)-97});
    });
    return out;
  }
  function boardSpec(p) {
    var ps=points(p), native9=String(p.size)==='9' && ps.every(function(q){return q.x<=8&&q.y<=8;});
    if(native9)return {cols:9,rows:9,isFull19:true,quadrant:'FULL9',native9:true};
    var full={cols:19,rows:19,isFull19:true,quadrant:'FULL19'};
    if(provider.fullBoard || String(p.size)==='1' || String(p.size)==='2' || !ps.length)return full;
    var candidates=[['BR',9,9],['BL',0,9],['TL',0,0],['TR',9,0]];
    for(var i=0;i<candidates.length;i++){
      var c=candidates[i];
      if(ps.every(function(q){return q.x>=c[1]&&q.x<c[1]+10&&q.y>=c[2]&&q.y<c[2]+10 && !(c[1]===9&&q.x===9) && !(c[2]===9&&q.y===9) && !(c[1]===0&&q.x===9) && !(c[2]===0&&q.y===9);})){return {cols:10,rows:10,isFull19:false,quadrant:c[0]};}
    }
    return full;
  }
  function resizeBoard() { requestAnimationFrame(function(){window.dispatchEvent(new Event('resize'));}); }
  function setView(next) {
    view=next;
    var s=window.teacherState;
    if(s&&s.autoNextTimer){clearTimeout(s.autoNextTimer);s.autoNextTimer=null;}
    renderView();
    resizeBoard();
  }
  function chooseStage(n) {
    role='body'; tab='problem'; view='units';
    $('bookSelect').value='course30_s'+n;
    $('bookSelect').dispatchEvent(new Event('change'));
  }
  function chooseUnit(idx) {
    role='body';tab='problem';view='lesson';
    $('chapterSelect').value=String(idx);
    $('chapterSelect').dispatchEvent(new Event('change'));
  }
  function renderView() {
    if(!data)return;
    var route=new URL(location.href);
    if(view==='curricula'){route.searchParams.delete('stage');route.searchParams.delete('unit');route.searchParams.delete('c');}
    else{ if(cur)route.searchParams.set('c',cur);
    if(view==='stages'){route.searchParams.delete('stage');route.searchParams.delete('unit');}
    else {route.searchParams.set('stage',stageNumber());if(view==='units')route.searchParams.delete('unit');} }
    history.replaceState(null,'',route);
    document.body.classList.toggle('course-selecting',view!=='lesson');
    document.body.classList.toggle('course-theory',view==='lesson'&&tab==='theory');
    $('coursePicker').hidden=view==='lesson';
    $('courseTheory').hidden=!(view==='lesson'&&tab==='theory');
    $('boardContainer').hidden=view!=='lesson'||tab==='theory';
    $('courseLessonControls').hidden=view!=='lesson';
    $('courseProblemMode').hidden=view!=='lesson'||tab==='theory';
    $('courseTheoryTab').setAttribute('aria-pressed',String(tab==='theory'));
    $('courseProblemTab').setAttribute('aria-pressed',String(tab==='problem'));
    var st=stage(), ch=chapter();
    $('courseHeading').textContent=(view==='stages'||view==='curricula')?'단계별 학습관':stageNumber()+'단계 · '+(view==='units'?'단원 선택':ch?ch.title:'문제 학습');
    $('courseStatus').textContent=isClaude?'클로드 30단계 v4 · 1단계 원본 문제 · 2단계부터 교재 임시 · 빌드 4-13':(stageNumber()>=28?'입문 후보 · ':'편성 v1 · ')+'이론 준비 중';
    var info=$('courseStageInfo');if(!info){info=document.createElement('div');info.id='courseStageInfo';info.className='course-stage-info';$('courseCards').parentNode.insertBefore(info,$('courseCards'));}
    info.hidden=true;info.innerHTML='';
    if(view==='curricula'){
      $('coursePickerTitle').textContent='교육과정 선택';
      $('coursePickerDescription').textContent='보고 싶은 교육과정을 선택하세요. 새 편성안이 생기면 이 목록에 번호를 붙여 추가합니다. 1번은 검수를 위해 단계마다 단원과 임시 문제가 배치되어 있습니다.';
      $('courseCards').innerHTML='<button type="button" class="course-card" data-curriculum="claude"><small>1</small><strong>클로드 30단계 커리큘럼</strong><span>3대 시리즈 분석 기반 · 1단계(입문)부터 30단계까지</span><small>455단원 · 1단계 원본 문제 288개 · 2단계부터 교재 문제 임시 배치</small></button>';
    }else if(view==='stages'&&isClaude){
      $('coursePickerTitle').textContent='1. 클로드 30단계 커리큘럼 · 1단계부터 30단계까지';
      $('coursePickerDescription').textContent='학습할 단계를 선택하세요. 단계 주제와 학습 목표를 보고, 단원을 눌러 임시 배치된 문제를 풀어 볼 수 있습니다. 1단계는 새로 만든 원본 문제이고, 2단계부터는 검수를 위해 교재 문제를 임시로 넣은 것이며 이후 원본 문제로 교체합니다.';
      $('courseCards').innerHTML=data.stages.map(function(s){return '<button type="button" class="course-card" data-course-stage="'+s.stage+'"><small>'+s.units.length+'단원 · '+s.units.reduce(function(n,u){return n+u.bodyIDs.length;},0)+'문항</small><strong>'+s.stage+'단계</strong><span>'+escape(s.title)+'</span></button>';}).join('');
    }else if(view==='stages'){
      $('coursePickerTitle').textContent='30단계부터 1단계까지';
      $('coursePickerDescription').textContent='학습할 단계를 선택하세요. 30~28단계는 입문 후보이며, 27~1단계는 실제 문항을 배치한 1차 편집본입니다.';
      $('courseCards').innerHTML=data.stages.map(function(s){return '<button type="button" class="course-card" data-course-stage="'+s.stage+'"><strong>'+s.stage+'단계</strong><span>'+escape(s.title)+'</span><small>'+s.units.length+'단원 · '+(s.stage>=28?'입문 후보':'문항 편성 v1')+'</small></button>';}).join('');
    }else if(view==='units'&&st){
      $('coursePickerTitle').textContent=st.stage+'단계 · '+st.title;
      $('coursePickerDescription').textContent='단원을 선택하면 Teaching Zone의 바둑판과 학습 메뉴로 이어집니다.';
      if(isClaude){
        info.innerHTML='<h3>학습 목표</h3><ul>'+st.goals.map(function(g){return '<li>'+escape(g)+'</li>';}).join('')+'</ul>'+(st.newTopics&&st.newTopics.length?'<h3>새로 배우는 주제</h3><div class="course-chips">'+st.newTopics.map(function(t){return '<span>'+escape(t)+'</span>';}).join('')+'</div>':'')+(st.alpha&&st.alpha.length?'<h3>알파바둑 선택 과정</h3><p>'+st.alpha.map(escape).join(' · ')+'</p>':'');info.hidden=false;
        $('courseCards').innerHTML=st.units.map(function(u,i){return '<button type="button" class="course-card" data-course-unit="'+i+'"><small>'+String(i+1).padStart(2,'0')+' · '+escape(u.field)+'</small><strong>'+escape(u.title)+'</strong><span>'+(u.original?'원본 ':u.mixed?'교재 '+u.nBase+' + 보충 '+u.nSupp+' = ':'')+u.bodyIDs.length+'문항'+(u.extraIDs.length?' · 추가 연습 '+u.extraIDs.length+'문항':'')+'</span><small>'+escape(u.concept)+(u.original?' · 정답 검증 완료':u.mixed?' · 표시 있는 문제 먼저':' · 교재 임시')+'</small></button>';}).join('');
      }else{
        $('courseCards').innerHTML=st.units.map(function(u,i){return '<button type="button" class="course-card" data-course-unit="'+i+'"><small>'+String(i+1).padStart(2,'0')+' · '+escape(u.field)+'</small><strong>'+escape(u.title)+'</strong><span>'+u.bodyIDs.length+'문항'+(u.extraIDs.length?' · 추가 연습 '+u.extraIDs.length+'문항':'')+'</span></button>';}).join('');
      }
    }
    if(isClaude&&view==='lesson'&&tab==='theory'){
      var cu=claudeUnit();
      if(cu&&st){var srcs=function(a){return a.map(function(x){return '<li>'+escape(x.series)+' · '+escape(x.book)+' · '+escape(x.chapter)+'</li>';}).join('');};
        $('courseTheory').innerHTML='<h2 id="courseTheoryTitle"></h2><p><b>'+escape(st.stage+'단계 · '+st.title)+'</b> · '+escape(cu.field)+' · '+escape(cu.concept)+'</p><div class="course-stage-info"><h3>이 단계의 학습 목표</h3><ul>'+st.goals.map(function(g){return '<li>'+escape(g)+'</li>';}).join('')+'</ul><h3>이 단원의 문제 구성</h3><p>'+(cu.original?'원본 문제 ':'본문 ')+cu.bodyIDs.length+'문항'+(cu.original?' · 바둑 규칙으로 정답을 검증했고, 교재와 같은 배치는 제외했습니다':'')+(cu.extraIDs.length?' · 추가 연습(알파 보강) '+cu.extraIDs.length+'문항':'')+(cu.pulled?' · 선생님 조건에 따라 앞 단계로 당겨 온 단원':'')+'</p><h3>'+(cu.original?'문제 출처':'임시 문제 출처(교재)')+'</h3><ul>'+srcs(cu.sources)+'</ul>'+(cu.alphaSources.length?'<h3>추가 연습 출처</h3><ul>'+srcs(cu.alphaSources)+'</ul>':'')+'<p>이 단원의 설명과 영상, 원본 문제는 검수 후 제작합니다.</p></div>';}
    }
    if(ch){
      $('courseExtra').disabled=!ch.extraProblems.length;
      $('courseBody').setAttribute('aria-pressed',String(role==='body'));
      $('courseExtra').setAttribute('aria-pressed',String(role==='extra'));
      $('courseTheoryTitle').textContent=ch.title;
    }
  }
  function displayAnswer(p) {
    var s=window.teacherState, panel=$('courseStoredAnswer');
    if(!panel.hidden){panel.hidden=true;return;}
    panel.replaceChildren();
    var heading=document.createElement('strong');heading.textContent='원문에 저장된 참고 정답';panel.appendChild(heading);
    var count=0,labels=['A','B','C','D','E','F','G','H','J','K','L','M','N','O','P','Q','R','S','T'];
    for(var i=1;i<=5;i++){
      var a=String(p['answer'+i]||'').trim();if(!a)continue;
      var line=document.createElement('p'),positions=[];
      var re=/(?:;|^)([BWTCMSL]|TR|CR|SQ|MA|LB)\[([a-s])([a-s])(?::([^\]]*))?\]/gi,m;
      while((m=re.exec(a))){var x=m[2].toLowerCase().charCodeAt(0)-97-s.shiftX,y=m[3].toLowerCase().charCodeAt(0)-97-s.shiftY;positions.push(m[4]||((m[1].toUpperCase()==='B'?'흑 ':m[1].toUpperCase()==='W'?'백 ':'표시 ')+(labels[x]||'?')+(s.boardRows-y)));}
      line.textContent='참고 '+(++count)+': '+(positions.length?positions.join(', '):a);panel.appendChild(line);
    }
    if(!count){var empty=document.createElement('p');empty.textContent=p.answer||'저장 정답의 입력 형식을 확인 중입니다.';panel.appendChild(empty);}
    var note=document.createElement('small');note.textContent='저장된 항목을 각각 표시합니다. 연속 수순이나 완전한 해설로 확정한 것은 아닙니다.';panel.appendChild(note);panel.hidden=false;
  }
  function onProblemLoaded(s,p) {
    ready=true;
    s._courseLoadVersion=(s._courseLoadVersion||0)+1;
    var supported=canGrade(p);
    if(!supported){s.trialMode=true;$('btnToggleTrial').classList.add('active');}
    $('courseStoredAnswer').hidden=true;
    $('courseFormatNote').textContent=supported?'저장된 정답 수와 비교합니다. 정답의 최선성·유일성이나 모든 응수는 별도 검토 중입니다.':'직접 놓아보며 학습하는 문항입니다. 응답 형식 확인 전에는 자동 정오 판정을 하지 않습니다.';
    $('courseBoardNote').textContent=s.boardSpec.native9?'원문 9줄 판입니다.':s.boardSpec.isFull19?'원문 19줄 전체 문맥을 표시합니다.':'19줄 판의 10줄 부분 보기입니다. 열린 선 쪽은 원래 판의 끝이 아닙니다.';
    $('courseFullBoard').textContent=provider.fullBoard?'기본 판 보기':'원문 전체 보기';
    $('courseSourceInfo').textContent=p.book+' · '+p.chapter+' · 원문 '+p.code;
    $('courseSourceLink').href=p.sourceURL||'#';
    var ch=chapter();
    if(view==='lesson'&&ch){var u=new URL(location.href);u.searchParams.set('stage',stageNumber());u.searchParams.set('unit',ch.courseUnit);history.replaceState(null,'',u);}
    renderView();
    requestAnimationFrame(function(){if($('teachingBoard'))$('teachingBoard').classList.add('is-ready');});
  }
  var provider=window.BKSCourse30={
    fullBoard:false,
    catalog:function(){return loadData().then(function(d){
      if(requestedStage && d.stages.some(function(s){return s.stage===requestedStage;})){
        localStorage.setItem('course30_last_series','0');localStorage.setItem('course30_last_book','course30_s'+requestedStage);
        var selected=d.stages.find(function(s){return s.stage===requestedStage;}), idx=selected.units.findIndex(function(u){return u.key===requestedUnit;});
        localStorage.setItem('course30_last_chapter',String(Math.max(0,idx)));localStorage.setItem('course30_last_problem','0');
      }
      if(isClaude&&!requestedStage){['series','book','chapter','problem'].forEach(function(k){try{localStorage.removeItem('course30_last_'+k);}catch(e){}});}
      if(isClaude)return [{title:'1. 클로드 30단계 커리큘럼 (v4)',books:d.stages.map(function(s){return {code:'course30_s'+s.stage,title:s.stage+'단계 · '+s.title,totalProblems:s.units.reduce(function(n,u){return n+u.bodyIDs.length;},0)};})}];
      return [{title:'30단계 교육과정 · 편성 v1',books:d.stages.map(function(s){return {code:'course30_s'+s.stage,title:s.stage+'단계 · '+s.title,totalProblems:s.units.reduce(function(n,u){return n+u.bodyIDs.length;},0)};})}];
    });},
    book:function(code){return loadData().then(function(d){var n0=Number(String(code).replace('course30_s',''));return ensureStage(n0).then(function(){return d;});}).then(function(d){
      var n=Number(String(code).replace('course30_s','')),st=d.stages.find(function(s){return s.stage===n;});if(!st)throw new Error('없는 학습 단계입니다.');
      currentBook={title:n+'단계 · '+st.title,book:n+'단계 · '+st.title,courseStage:n,chapters:st.units.map(function(u,i){return {title:u.title,chapter:(i+1)+'. '+u.title,courseUnit:u.key,field:u.field,problems:u.bodyIDs.map(cloneProblem),extraProblems:u.extraIDs.map(cloneProblem)};})};return currentBook;
    });},
    problems:function(ch){return role==='extra'&&ch.extraProblems.length?ch.extraProblems:ch.problems;},
    boardSpec:boardSpec,canGrade:canGrade,onProblemLoaded:onProblemLoaded,
    onAnswerClick:function(s,p){if(!canGrade(p)){displayAnswer(p);return true;}return false;},
    onError:function(err){$('coursePickerDescription').textContent='자료를 불러오지 못했습니다. 새로고침해 다시 시도해 주세요.';$('courseStatus').textContent='자료 로드 실패';console.error(err);},
    audit:function(){if(!data)return {ready:false};var missing=[];data.stages.forEach(function(s){s.units.forEach(function(u){u.bodyIDs.concat(u.extraIDs).forEach(function(id){if(!data.records[id])missing.push(id);});});});return {ready:ready,stages:data.stages.length,units:data.stages.reduce(function(n,s){return n+s.units.length;},0),missing:missing,view:view,role:role,sourceID:window.teacherState&&window.teacherState.currentProblems[window.teacherState.currentProblemIndex]?.code};}
  };
  $('bookSelect').addEventListener('change',function(){view='units';role='body';tab='problem';});
  $('chapterSelect').addEventListener('change',function(){view='lesson';role='body';tab='problem';});
  (function(){var act=document.querySelector('.course-actions');if(act&&!$('courseCurricula')){var b=document.createElement('button');b.type='button';b.id='courseCurricula';b.textContent='교육과정 선택';b.addEventListener('click',function(){location.href=location.pathname;});act.insertBefore(b,act.firstChild);}})();
  $('courseCards').addEventListener('click',function(e){var b=e.target.closest('button');if(!b)return;if(b.dataset.curriculum){location.href=location.pathname+'?c='+b.dataset.curriculum;return;}if(b.dataset.courseStage)chooseStage(Number(b.dataset.courseStage));else if(b.dataset.courseUnit!==undefined)chooseUnit(Number(b.dataset.courseUnit));});
  $('courseStages').addEventListener('click',function(){setView('stages');});
  $('courseUnits').addEventListener('click',function(){setView('units');});
  $('courseTheoryTab').addEventListener('click',function(){tab='theory';renderView();});
  $('courseProblemTab').addEventListener('click',function(){tab='problem';renderView();resizeBoard();});
  ['courseBody','courseExtra'].forEach(function(id){$(id).addEventListener('click',function(){role=id==='courseExtra'?'extra':'body';if(window.BKSCourse30ReloadChapter)window.BKSCourse30ReloadChapter();});});
  $('courseFullBoard').addEventListener('click',function(){provider.fullBoard=!provider.fullBoard;var s=window.teacherState,idx=s.currentProblemIndex;if(window.BKSCourse30LoadProblem)window.BKSCourse30LoadProblem(idx);resizeBoard();});
  new ResizeObserver(function(){if(ready&&view==='lesson'&&tab==='problem')resizeBoard();}).observe($('boardContainer'));
})();
