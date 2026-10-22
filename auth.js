// 🔒 바둑 어드벤처 - 선생님 전용 보안 인증 모듈 (비밀번호: 5840)
(function() {
  const SECRET_PIN = "5840";
  const AUTH_KEY = "jh_baduk_auth_token";

  function isAuthorized() {
    return sessionStorage.getItem('jh_site_explicit_lock') !== 'true';
  }

  function applyLockState() {
    const overlay = document.getElementById('siteAuthOverlay');
    const input = document.getElementById('authPinInput');

    if (isAuthorized()) {
      document.body.classList.remove('site-locked');
      if (overlay) overlay.style.display = 'none';
    } else {
      document.body.classList.add('site-locked');
      if (overlay) overlay.style.display = 'flex';
      if (input) {
        setTimeout(() => {
          input.focus();
        }, 120);
      }
    }
  }

  window.checkSiteAuthPin = function() {
    const input = document.getElementById('authPinInput');
    const errorMsg = document.getElementById('authErrorMsg');
    const card = document.querySelector('.site-auth-card');
    const overlay = document.getElementById('siteAuthOverlay');
    if (!input) return;

    const entered = input.value.trim();
    if (entered === SECRET_PIN) {
      if (errorMsg) errorMsg.textContent = '';
      sessionStorage.removeItem('jh_site_explicit_lock');
      document.body.classList.remove('site-locked');

      if (overlay) {
        overlay.classList.add('fade-out');
        setTimeout(() => {
          overlay.style.display = 'none';
        }, 320);
      }

      if (window.badukAudio && window.badukAudio.playDingDong) {
        window.badukAudio.playDingDong();
      }
    } else {
      if (card) {
        card.classList.remove('shake');
        void card.offsetWidth; // CSS 애니메이션 리플로우 강제
        card.classList.add('shake');
      }
      if (errorMsg) {
        errorMsg.textContent = '비밀번호가 올바르지 않습니다. 다시 입력해 주세요.';
      }
      input.value = '';
      input.focus();
    }
  };

  window.lockSiteSession = function() {
    sessionStorage.setItem('jh_site_explicit_lock', 'true');
    location.reload();
  };

  // DOM 로드 시 초기화 및 4자리 자동 감지
  document.addEventListener('DOMContentLoaded', () => {
    applyLockState();

    const input = document.getElementById('authPinInput');
    if (input) {
      input.addEventListener('input', (e) => {
        if (e.target.value.length === 4) {
          window.checkSiteAuthPin();
        }
      });
    }

    const btnLock = document.getElementById('btnHeaderLock');
    if (btnLock) {
      btnLock.addEventListener('click', () => {
        if (confirm('수업 사이트를 잠그시겠습니까?')) {
          window.lockSiteSession();
        }
      });
    }

    const btnHome = document.getElementById('btnHeaderHome');
    if (btnHome) {
      btnHome.addEventListener('click', () => {
        window.showMainPortal();
      });
    }

    const brandLogo = document.getElementById('brandLogoBadge');
    if (brandLogo) {
      brandLogo.addEventListener('click', () => {
        window.showMainPortal();
      });
    }

    const urlParams = new URLSearchParams(window.location.search);
    if (urlParams.get('mode') === 'missions') {
      setTimeout(() => {
        window.enterAppFromPortal('missions');
      }, 150);
    } else {
      // 기본 주소로 접속한 경우 대문이 확실히 전면에 나타나도록 보장
      window.showMainPortal();
    }
  });

  // 🌟 포털 대문 제어 함수
  window.enterAppFromPortal = function(targetMode = 'missions') {
    const portal = document.getElementById('mainPortalOverlay');
    if (portal) {
      portal.classList.add('portal-hidden');
    }
    const app = window.badukApp || window.gameApp;
    if (app && typeof app.switchMode === 'function') {
      app.switchMode(targetMode);
      setTimeout(() => {
        if (typeof app.initCanvasSize === 'function') app.initCanvasSize();
        if (typeof app.render === 'function') app.render();
      }, 50);
    }
    if (window.badukAudio && window.badukAudio.playStone) {
      window.badukAudio.playStone();
    }
  };

  // 🌟 15대 기법별 라이브러리 바로 열기
  window.enterAppAndOpenLibrary = function(seriesIndex = 0) {
    window.enterAppFromPortal('missions');
    setTimeout(() => {
      const app = window.badukApp || window.gameApp;
      if (app && app.bookSelector) {
        app.bookSelector.show(seriesIndex);
      }
    }, 200);
  };

  window.showMainPortal = function() {
    const portal = document.getElementById('mainPortalOverlay');
    if (portal) {
      portal.classList.remove('portal-hidden');
      portal.scrollTop = 0;
    }
    // URL에 남아있던 파라미터를 정리하여 브라우저 새로고침 시에도 대문 유지
    if (window.history && window.history.replaceState) {
      const cleanUrl = window.location.pathname;
      window.history.replaceState({}, document.title, cleanUrl);
    }
    if (window.badukAudio && window.badukAudio.playDingDong) {
      window.badukAudio.playDingDong();
    }
  };

  // 초기 깜빡임 방지용 즉시 체크
  if (!isAuthorized()) {
    if (document.body) {
      document.body.classList.add('site-locked');
    }
  }

  // ==========================================
  // 🌟 체스키드 스타일 네비게이션 드롭다운 & 아바타 스튜디오 로직
  // ==========================================
  let currentAvatarStone = '⚫ 흑돌';
  let currentAvatarItem = '👑 왕관';

  window.toggleNavDropdown = function(dropdownId) {
    const target = document.getElementById(dropdownId);
    const allDropdowns = document.querySelectorAll('.ck-dropdown-menu');
    allDropdowns.forEach(d => {
      if (d !== target) d.classList.remove('active');
    });
    if (target) {
      target.classList.toggle('active');
    }
  };

  // 배경 클릭 시 드롭다운 닫기
  document.addEventListener('click', function(e) {
    if (!e.target.closest('.ck-dropdown-wrap')) {
      document.querySelectorAll('.ck-dropdown-menu').forEach(d => d.classList.remove('active'));
    }
  });

  window.openAvatarStudio = function() {
    const modal = document.getElementById('avatarStudioModal');
    if (modal) {
      modal.style.display = 'flex';
      loadSavedAvatar();
    }
  };

  window.closeAvatarStudio = function() {
    const modal = document.getElementById('avatarStudioModal');
    if (modal) {
      modal.style.display = 'none';
    }
  };

  window.selectAvatarStone = function(stone) {
    currentAvatarStone = stone;
    document.querySelectorAll('#optStones .opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(stone.split(' ')[1]));
    });
    updateAvatarPreview();
  };

  window.selectAvatarItem = function(item) {
    currentAvatarItem = item;
    document.querySelectorAll('#optItems .opt-btn').forEach(btn => {
      btn.classList.toggle('active', btn.textContent.includes(item.split(' ')[1]));
    });
    updateAvatarPreview();
  };

  function updateAvatarPreview() {
    const heroDisp = document.getElementById('avatarHeroDisplay');
    const stoneBg = document.getElementById('avatarBigCanvas');
    if (!heroDisp) return;
    
    const itemEmoji = currentAvatarItem.split(' ')[0] || '👑';
    const stoneName = currentAvatarStone.split(' ')[1] || '흑돌';

    let textColor = '#f8fafc';
    if (stoneName.includes('흑돌')) {
      if (stoneBg) stoneBg.style.background = 'radial-gradient(circle at 35% 35%, #475569, #0f172a 80%)';
      textColor = '#f8fafc';
    } else if (stoneName.includes('백돌')) {
      if (stoneBg) stoneBg.style.background = 'radial-gradient(circle at 35% 35%, #ffffff, #cbd5e1 85%)';
      textColor = '#1e293b';
    } else if (stoneName.includes('황금돌')) {
      if (stoneBg) stoneBg.style.background = 'radial-gradient(circle at 35% 35%, #fef08a, #d97706 85%)';
      textColor = '#78350f';
    } else if (stoneName.includes('루비돌') || stoneName.includes('보석돌')) {
      if (stoneBg) stoneBg.style.background = 'radial-gradient(circle at 35% 35%, #f472b6, #db2777 85%)';
      textColor = '#ffffff';
    }
    heroDisp.innerHTML = '<span style="font-size:42px;line-height:1;display:block;margin-bottom:4px;">' + itemEmoji + '</span><span style="font-size:13px;font-weight:900;color:' + textColor + ';">' + stoneName + '</span>';
  }

  window.saveUserAvatar = function() {
    const nickInput = document.getElementById('avatarNicknameInput');
    const nick = nickInput && nickInput.value.trim() ? nickInput.value.trim() : '바둑이어린이';
    const avatarData = {
      stone: currentAvatarStone,
      item: currentAvatarItem,
      nickname: nick
    };
    try {
      localStorage.setItem('baduk_user_avatar', JSON.stringify(avatarData));
    } catch(e) {}

    applyAvatarToUI(avatarData);
    window.closeAvatarStudio();
    if (window.badukAudio && window.badukAudio.playDingDong) {
      window.badukAudio.playDingDong();
    }
  };

  function applyAvatarToUI(avatarData) {
    const navFace = document.getElementById('navAvatarFace');
    const navCircle = document.getElementById('navAvatarCircle');
    if (!navFace || !avatarData) return;

    const itemEmoji = (avatarData.item || '👑').split(' ')[0];
    navFace.textContent = itemEmoji;

    const stone = avatarData.stone || '흑돌';
    if (navCircle) {
      if (stone.includes('흑돌')) {
        navCircle.style.background = 'radial-gradient(circle at 30% 30%, #475569, #0f172a)';
      } else if (stone.includes('백돌')) {
        navCircle.style.background = 'radial-gradient(circle at 30% 30%, #ffffff, #cbd5e1)';
      } else if (stone.includes('황금돌')) {
        navCircle.style.background = 'radial-gradient(circle at 30% 30%, #fef08a, #d97706)';
      } else if (stone.includes('루비돌') || stone.includes('보석돌')) {
        navCircle.style.background = 'radial-gradient(circle at 30% 30%, #f472b6, #db2777)';
      }
    }
  }

  function loadSavedAvatar() {
    try {
      const saved = localStorage.getItem('baduk_user_avatar');
      if (saved) {
        const data = JSON.parse(saved);
        if (data.stone) window.selectAvatarStone(data.stone);
        if (data.item) window.selectAvatarItem(data.item);
        const nickInput = document.getElementById('avatarNicknameInput');
        if (nickInput && data.nickname) nickInput.value = data.nickname;
        applyAvatarToUI(data);
      } else {
        updateAvatarPreview();
      }
    } catch(e) {
      updateAvatarPreview();
    }
  }

  // 초기 로드 시 저장된 아바타 적용
  document.addEventListener('DOMContentLoaded', () => {
    loadSavedAvatar();
  });

})();
