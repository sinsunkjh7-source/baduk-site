'use strict';
/* Explicit static production mode only. No accounts, storage, API calls or owner fallback. */
(function(){
 const mode=document.querySelector('meta[name="bks-deployment"]')?.content;
 if(mode!=='static')return;
 const unavailable=()=>Promise.reject(new Error('회원 기능 준비 중'));
 window.BKSRuntime=Object.freeze({mode:'static',ready:Promise.resolve(),status:()=>({mode:'static',loading:false,connected:false,authenticated:false,ownerConfigured:false,actor:null,error:''}),login:unavailable,register:unavailable,logout:unavailable,refresh:async()=>{}});
 const protectedRoute=route=>route==='teacher'||route==='manage'||route.startsWith('manage/')||['profile','settings'].includes(route);
 const match=route=>['login','signup','account'].includes(route)||protectedRoute(route);
 function render(route){
  if(route==='teacher'){document.getElementById('auth-screen').innerHTML="<div class=\"empty-inner\"><a class=\"back-link\" href=\"#home\">← 홈으로</a><p class=\"page-label\">바둑스쿨 · 강사모드</p><div class=\"empty-heading\"><div><h1>강사모드</h1><p>강사용 수업·관리 공간</p></div></div><div class=\"empty-state\"><h2>강사 기능 준비 중</h2><p>강사모드 메뉴와 공간을 먼저 연결했습니다.<br>수업·반 관리 등의 온라인 기능을 이곳에 차례로 연결할 예정입니다.</p><a class=\"return-button\" href=\"#home\">홈 화면으로 돌아가기</a></div></div>";document.title='강사모드 | 바둑스쿨';return;}
  document.getElementById('auth-screen').innerHTML='<div class="auth-wrap"><a class="auth-back" href="#home">홈으로</a><div class="auth-card"><p class="auth-eyebrow">BADUKSCHOOL</p><h1>회원 기능 준비 중</h1><p>현재는 새 디자인과 메뉴 구조를 먼저 공개한 사이트입니다. 로그인·회원가입·강사 및 관리 기능은 아직 제공하지 않습니다.</p><p class="auth-note">이 사이트에서는 아이디·비밀번호나 가입 신청을 받지 않습니다. 회원 기능은 안전한 서비스가 준비되면 안내하겠습니다.</p><a class="mg-button mg-primary" href="#home">홈 화면으로 돌아가기</a></div></div>';
  document.title='회원 기능 준비 중 | 바둑스쿨';
 }
 window.BKSAuth=Object.freeze({match,render,updateHeader:()=>{}});
 window.BKSManagement=Object.freeze({match:()=>false,routeBlocked:()=>null,render:()=>{}});
 document.querySelectorAll('[data-site-management],[data-org-management],[data-auth-account],[data-auth-logout],.avatar-dropdown').forEach(el=>el.remove());
 const notice=document.getElementById('runtime-notice');if(notice){notice.hidden=true;notice.textContent='';}
})();
