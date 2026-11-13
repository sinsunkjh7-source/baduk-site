/**
 * Paper Theater Story Data: 난가대국 (爛柯對局)
 * ===============================================
 * - 더 느리고 따뜻한 동화 구연 톤(rate -12%~-16%, pitch -2Hz)의 8개 스튜디오 MP3 내레이션
 * - 대본에 맞춰 살아 움직이는 다층 한지 겹종이 레이어(나무꾼 컷아웃, 썩은 도끼 컷아웃, 사계절 색감 변화, 안개, 소나무 프레임)
 */

window.STORY_NANGA = {
  id: 'nanga',
  title: '난가대국',
  hanja: '爛柯對局',
  badge: '🎬 다층 종이 극장 · 바둑 전설',
  summary: '신선들의 바둑을 구경하느라 도끼자루가 썩는 줄도 몰랐다는 신비로운 바둑 이야기',
  duration: 71.4,

  scenes: [
    {
      id: 'nanga_s1',
      start: 0,
      end: 8.1,
      chapter: '제1장 · 깊은 산속으로',
      subtitle: '옛날 한 나무꾼이 도끼를 메고, 깊고 깊은 산속으로 나무를 하러 들어갔어요.',
      audio: 'assets/nanga_s1.mp3',
      particlesClass: 'mystic',
      layers: [
        { type: 'image', src: 'assets/scene1_forest.jpg', alt: '깊은 소나무 숲', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'custom', content: '<img src="assets/cutout_woodcutter.png" alt="걸어가는 나무꾼 왕질" class="nanga-woodcutter-sprite" draggable="false">', className: 'layer-woodcutter-wrap' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p, localT, globalT, isPlaying) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.0 + p * 0.06).toFixed(3) + ') translate3d(' + (-p * 10).toFixed(1) + 'px, 0, 0)';
        }
        var sprite = slideEl.querySelector('.nanga-woodcutter-sprite');
        if (sprite) {
          var walkX = p * 115;
          var walkScale = 1.0 - p * 0.14;
          var bob = isPlaying ? Math.abs(Math.sin(globalT * 5.2)) * -6 : 0;
          sprite.style.transform = 'translate3d(' + walkX.toFixed(1) + 'px, ' + bob.toFixed(1) + 'px, 0) scale(' + walkScale.toFixed(3) + ')';
        }
        var pines = slideEl.querySelector('.layer-pines');
        if (pines) {
          pines.style.transform = 'scale(' + (1.03 + p * 0.03).toFixed(3) + ')';
        }
      }
    },
    {
      id: 'nanga_s2',
      start: 8.1,
      end: 16.2,
      chapter: '제2장 · 신선들의 바둑',
      subtitle: '숲속 깊은 바위 쉼터에서, 두 동자가 마주 앉아 조용히 바둑을 두고 있었지요.',
      audio: 'assets/nanga_s2.mp3',
      particlesClass: 'mystic',
      layers: [
        { type: 'image', src: 'assets/scene2_baduk.jpg', alt: '바위 위에서 바둑을 두는 두 동자', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="nanga-board-glow"></div>', className: 'layer-glow-wrap' },
        { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무', className: 'layer-pines' }
      ],
      animate: function (slideEl, p, localT, globalT) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.02 + p * 0.06).toFixed(3) + ')';
        }
        var glow = slideEl.querySelector('.nanga-board-glow');
        if (glow) {
          glow.style.opacity = (0.45 + Math.sin(globalT * 2.2) * 0.25).toFixed(2);
        }
      }
    },
    {
      id: 'nanga_s3',
      start: 16.2,
      end: 25.0,
      chapter: '제3장 · 넋을 잃고 빠져들다',
      subtitle: '나무꾼은 도끼를 바닥에 내려놓고, 신비로운 바둑 대국에 넋을 잃고 빠져들었습니다.',
      audio: 'assets/nanga_s3.mp3',
      particlesClass: 'mystic',
      layers: [
        { type: 'image', src: 'assets/scene2_baduk.jpg', alt: '바둑에 빠져든 나무꾼', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="nanga-board-glow"></div>', className: 'layer-glow-wrap' },
        { type: 'custom', content: '<div class="mist-band band-2"></div>', className: 'layer-mist-back' }
      ],
      animate: function (slideEl, p, localT, globalT) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.08 + p * 0.07).toFixed(3) + ') translate3d(0, ' + (-p * 8).toFixed(1) + 'px, 0)';
        }
        var glow = slideEl.querySelector('.nanga-board-glow');
        if (glow) {
          glow.style.opacity = (0.6 + Math.sin(globalT * 2.8) * 0.3).toFixed(2);
        }
      }
    },
    {
      id: 'nanga_s4',
      start: 25.0,
      end: 35.2,
      chapter: '제4장 · 빠르게 흐르는 사계절',
      subtitle: '바둑돌이 딸깍 놓일 때마다, 산속의 시간은 봄, 여름, 가을, 겨울로 빠르게 흘러갔어요.',
      audio: 'assets/nanga_s4.mp3',
      particlesClass: 'blossoms',
      layers: [
        { type: 'image', src: 'assets/scene2_baduk.jpg', alt: '계절이 변하는 산속 바둑판', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="nanga-season-tint"></div>', className: 'layer-season-wrap' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'custom', content: '<div class="nanga-season-badge">🌸 봄 · 꽃이 피고</div>', className: 'layer-season-badge-wrap' }
      ],
      animate: function (slideEl, p) {
        var tint = slideEl.querySelector('.nanga-season-tint');
        var badge = slideEl.querySelector('.nanga-season-badge');
        var particles = document.querySelector('[data-ref="particles"]');

        if (p < 0.25) {
          if (tint) tint.style.background = 'rgba(255, 192, 215, 0.35)';
          if (badge) badge.textContent = '🌸 봄 · 꽃이 피고';
          if (particles) particles.className = 'pt-depth-layer layer-particles blossoms';
        } else if (p < 0.5) {
          if (tint) tint.style.background = 'rgba(74, 222, 128, 0.28)';
          if (badge) badge.textContent = '🌿 여름 · 녹음이 짙어지고';
          if (particles) particles.className = 'pt-depth-layer layer-particles mystic';
        } else if (p < 0.75) {
          if (tint) tint.style.background = 'rgba(249, 115, 22, 0.36)';
          if (badge) badge.textContent = '🍁 가을 · 단풍이 물들며';
          if (particles) particles.className = 'pt-depth-layer layer-particles autumn';
        } else {
          if (tint) tint.style.background = 'rgba(186, 230, 253, 0.42)';
          if (badge) badge.textContent = '❄️ 겨울 · 흰 눈이 내리고';
          if (particles) particles.className = 'pt-depth-layer layer-particles winter';
        }
      }
    },
    {
      id: 'nanga_s5',
      start: 35.2,
      end: 44.2,
      chapter: '제5장 · 동자의 한마디',
      subtitle: '한참 뒤 동자가 말했지요. “그대의 도끼자루가 이미 다 썩어 없어졌구려.”',
      audio: 'assets/nanga_s5.mp3',
      particlesClass: 'autumn',
      layers: [
        { type: 'image', src: 'assets/scene2_baduk.jpg', alt: '동자의 말에 놀라는 나무꾼', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
        { type: 'custom', content: '<img src="assets/cutout_axe.png" alt="썩어가는 도끼자루" class="nanga-axe-sprite" draggable="false">', className: 'layer-axe-wrap' }
      ],
      animate: function (slideEl, p) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.06 - p * 0.04).toFixed(3) + ')';
        }
        var axe = slideEl.querySelector('.nanga-axe-sprite');
        if (axe) {
          var op = Math.min(1, p * 1.8);
          var y = (1 - Math.min(1, p * 1.4)) * 28;
          axe.style.opacity = op.toFixed(2);
          axe.style.transform = 'translate3d(0, ' + y.toFixed(1) + 'px, 0) scale(' + (0.9 + p * 0.1).toFixed(3) + ')';
        }
      }
    },
    {
      id: 'nanga_s6',
      start: 44.2,
      end: 53.6,
      chapter: '제6장 · 삭아버린 도끼자루',
      subtitle: '깜짝 놀라 발밑을 보니, 단단했던 나무 자루는 삭아 흙이 되고 쇠도끼만 뒹굴고 있었어요.',
      audio: 'assets/nanga_s6.mp3',
      particlesClass: 'autumn',
      layers: [
        { type: 'image', src: 'assets/scene6_axe.jpg', alt: '이끼 속에 삭아버린 도끼자루', className: 'slide-base-img' },
        { type: 'custom', content: '<img src="assets/cutout_axe.png" alt="앞쪽 쇠도끼 컷아웃" class="nanga-axe-sprite" draggable="false">', className: 'layer-axe-wrap' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.0 + p * 0.07).toFixed(3) + ')';
        }
        var axe = slideEl.querySelector('.nanga-axe-sprite');
        if (axe) {
          axe.style.opacity = '0.96';
          axe.style.transform = 'translate3d(' + (-p * 12).toFixed(1) + 'px, 12px, 0) scale(' + (1.02 + p * 0.06).toFixed(3) + ')';
        }
      }
    },
    {
      id: 'nanga_s7',
      start: 53.6,
      end: 63.0,
      chapter: '제7장 · 변해버린 마을',
      subtitle: '서둘러 마을로 내려왔지만, 낯선 사람들뿐이고 이미 수백 년의 세월이 흘러간 뒤였답니다.',
      audio: 'assets/nanga_s7.mp3',
      particlesClass: 'mystic',
      layers: [
        { type: 'image', src: 'assets/scene7_village.jpg', alt: '수백 년이 흘러 변해버린 마을', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'custom', content: '<img src="assets/cutout_woodcutter.png" alt="마을을 내려다보는 왕질" class="nanga-woodcutter-sprite" draggable="false">', className: 'layer-woodcutter-wrap' }
      ],
      animate: function (slideEl, p) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.04 - p * 0.04).toFixed(3) + ')';
        }
        var sprite = slideEl.querySelector('.nanga-woodcutter-sprite');
        if (sprite) {
          sprite.style.transform = 'translate3d(' + (p * 24).toFixed(1) + 'px, 0, 0) scale(0.86)';
        }
      }
    },
    {
      id: 'nanga_s8',
      start: 63.0,
      end: 71.4,
      chapter: '제8장 · 시간마저 잊는 바둑의 묘미',
      subtitle: '이처럼 바둑의 깊은 묘미는, 시간마저 잊게 할 만큼 아름답고 신비롭답니다.',
      audio: 'assets/nanga_s8.mp3',
      particlesClass: 'blossoms',
      layers: [
        { type: 'image', src: 'assets/scene7_village.jpg', alt: '아름다운 노을과 바둑의 세계', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="s5-sunbeam"></div>', className: 'layer-sunbeam' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p) {
        var bg = slideEl.querySelector('.slide-base-img img');
        if (bg) {
          bg.style.transform = 'scale(' + (1.0 + p * 0.05).toFixed(3) + ')';
        }
        var beam = slideEl.querySelector('.s5-sunbeam');
        if (beam) {
          beam.style.opacity = (0.35 + p * 0.5).toFixed(2);
        }
      }
    }
  ],

  study: {
    hanja: [
      { char: '爛', meaning: '썩을 란' },
      { char: '柯', meaning: '도끼자루 가' },
      { char: '對', meaning: '마주할 대' },
      { char: '局', meaning: '판 국' }
    ],
    badukWisdom: '‘난가(爛柯)’는 도끼자루가 썩는 줄도 모르고 빠져들 만큼 재미있고 깊은 ‘바둑’을 뜻하는 또 다른 이름이랍니다. 한 수 한 수 깊이 생각하며 집중하는 즐거움을 느껴보세요!',
    quiz: {
      question: '옛날부터 바둑을 ‘난가(爛柯)’라고 부르게 된 이유는 무엇일까요?',
      options: [
        { text: '도끼로 바둑판을 만들어서', correct: false },
        { text: '바둑 구경에 푹 빠져 도끼자루가 썩는 줄 몰라서', correct: true },
        { text: '도끼를 팔아 바둑돌을 사서', correct: false }
      ],
      correctMsg: '🎉 정답입니다! 바둑에 깊이 몰입하면 시간 가는 줄도 모른다는 뜻에서 바둑을 ‘난가’라고 부르게 되었어요.',
      wrongMsg: '나무꾼 왕질의 손에 들려 있던 도끼에 어떤 일이 일어났는지 떠올려 보세요!'
    }
  }
};
