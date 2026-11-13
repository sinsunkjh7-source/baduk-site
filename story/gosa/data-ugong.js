/**
 * Paper Theater Story Data: 우공이산 (愚公移山)
 * ===============================================
 * 표준 규격 스펙:
 * - id, title, hanja, badge, summary, duration
 * - scenes: [ { id, start, end, chapter, subtitle, layers, animate(slideEl, p, localT, globalT, isPlaying) } ]
 * - study: { hanja: [...], badukWisdom, quiz: { question, options, correctMsg, wrongMsg } }
 */

window.STORY_UGONG = {
  id: 'ugong',
  title: '우공이산',
  hanja: '愚公移山',
  badge: '🎬 다층 종이 극장 쇼츠',
  summary: '매 장면마다 다층 종이 레이어가 살아 숨쉬는 48초 종이 극장 명작',
  duration: 48.0,

  scenes: [
    {
      id: 'scene1',
      start: 0,
      end: 6,
      chapter: '제1장 · 길을 막은 두 산',
      subtitle: '옛날 중국 북산에 아흔 살이 된 ‘우공’ 할아버지가 살았어요. 집 바로 앞을 거대한 태행산과 왕옥산 두 산이 가로막고 있어, 마을 사람들은 매일 먼 길을 빙 돌아가야 했지요.',
      layers: [
        { type: 'image', src: 'assets/layer_sky.jpg', alt: '하늘 배경' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_mtn_left.png', alt: '태행산', className: 'layer-mountains layer-mtn-l' },
        { type: 'image', src: 'assets/layer_mtn_right.png', alt: '왕옥산', className: 'layer-mountains layer-mtn-r' },
        { type: 'image', src: 'assets/layer_village.png', alt: '마을과 우공', className: 'layer-village' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p) {
        var mtnL = slideEl.querySelector('.layer-mtn-l');
        var mtnR = slideEl.querySelector('.layer-mtn-r');
        if (mtnL) mtnL.style.transform = 'translate3d(' + (p * 8).toFixed(1) + 'px, ' + (-p * 14).toFixed(1) + 'px, 0) scale(' + (1 + p * 0.04).toFixed(3) + ')';
        if (mtnR) mtnR.style.transform = 'translate3d(' + (-p * 8).toFixed(1) + 'px, ' + (-p * 14).toFixed(1) + 'px, 0) scale(' + (1 + p * 0.04).toFixed(3) + ')';
      }
    },
    {
      id: 'scene2',
      start: 6,
      end: 12,
      chapter: '제2장 · 가족과의 결심',
      subtitle: '어느 날 우공은 온 가족을 불러 모아 말했어요. “우리가 힘을 합쳐 저 두 산을 깎아 평평한 길을 내자꾸나!” 식구들은 모두 기쁘게 고개를 끄덕였습니다.',
      layers: [
        { type: 'image', src: 'assets/layer_sky.jpg', alt: '창밖 하늘', className: 's2-outside-sky' },
        { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_mountains.png', alt: '창밖 거대한 산', className: 's2-outside-mtn' },
        { type: 'image', src: 'assets/scene2_room.png', alt: '한옥 방 안 우공 가족', className: 's2-room' }
      ],
      animate: function (slideEl, p) {
        var sky = slideEl.querySelector('.s2-outside-sky');
        var mtn = slideEl.querySelector('.s2-outside-mtn');
        if (sky) sky.style.transform = 'translateX(' + (16 - p * 24).toFixed(1) + 'px) scale(1.12)';
        if (mtn) mtn.style.transform = 'translate(' + (115 - p * 38).toFixed(1) + 'px, 26px) scale(0.66)';
      }
    },
    {
      id: 'scene3',
      start: 12,
      end: 18,
      chapter: '제3장 · 첫 삽을 뜨다',
      subtitle: '다음 날 아침, 우공과 자식·손자들은 삽과 삼태기를 들고 산기슭으로 나섰어요. 커다란 바위를 깨고 흙을 퍼 담아 저 멀리 바닷가까지 부지런히 날랐지요.',
      layers: [
        { type: 'image', src: 'assets/scene3.jpg', alt: '제3장 삽과 바구니로 흙을 나르는 우공과 손자들', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="mist-band band-1"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무', className: 'layer-pines' }
      ],
      animate: function (slideEl, p, localT, globalT, isPlaying) {
        var img = slideEl.querySelector('.slide-base-img img');
        if (img) img.style.transform = 'scale(' + (1.0 + p * 0.05).toFixed(3) + ')';
        var pines = slideEl.querySelector('.layer-pines');
        if (pines && isPlaying) {
          var sway = Math.sin(globalT * 1.5) * 4;
          pines.style.transform = 'translateX(' + sway.toFixed(1) + 'px)';
        }
      }
    },
    {
      id: 'scene4',
      start: 18,
      end: 24,
      chapter: '제4장 · 이웃의 비웃음',
      subtitle: '그 모습을 본 이웃 노인 ‘지소’가 혀를 차며 웃었어요. “아흔 살 노인이 어찌 그 큰 산을 옮긴단 말이오? 흙 한 줌도 다 못 옮기고 기력이 다할 텐데요!”',
      layers: [
        { type: 'image', src: 'assets/scene4.jpg', alt: '제4장 비웃는 이웃 지소와 묵묵히 웃는 우공', className: 'slide-base-img' },
        { type: 'custom', content: '<div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '앞쪽 소나무', className: 'layer-pines' }
      ],
      animate: function (slideEl, p) {
        var img = slideEl.querySelector('.slide-base-img img');
        if (img) img.style.transform = 'scale(' + (1.0 + p * 0.04).toFixed(3) + ') translate3d(' + (-p * 8).toFixed(1) + 'px, 0, 0)';
      }
    },
    {
      id: 'scene5',
      start: 24,
      end: 36,
      chapter: '제5-6장 · 우공의 대답과 낮아지는 산',
      subtitle: '우공은 빙긋 웃으며 답했어요. “내가 죽으면 자식이, 자식이 죽으면 손자가 대를 이을 걸세. 산은 자라지 않으니 언젠간 평지가 되지 않겠소?” 그 끈기에 두 산이 낮아지기 시작했어요.',
      layers: [
        { type: 'image', src: 'assets/layer_sky.jpg', alt: '하늘 배경' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_mtn_left.png', alt: '낮아지는 왼쪽 산', className: 'layer-mountains layer-mtn-l' },
        { type: 'image', src: 'assets/layer_mtn_right.png', alt: '낮아지는 오른쪽 산', className: 'layer-mountains layer-mtn-r' },
        { type: 'image', src: 'assets/layer_village.png', alt: '우공과 마을 사람들', className: 'layer-village' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p, localT, globalT, isPlaying) {
        var mtnL = slideEl.querySelector('.layer-mtn-l');
        var mtnR = slideEl.querySelector('.layer-mtn-r');
        var village = slideEl.querySelector('.layer-village');
        var eased = p * p * (3 - 2 * p);
        var dropY = (eased * 145).toFixed(1);
        if (mtnL) mtnL.style.transform = 'translateY(' + dropY + 'px)';
        if (mtnR) mtnR.style.transform = 'translateY(' + dropY + 'px)';
        if (village) {
          var digBob = isPlaying ? Math.abs(Math.sin(globalT * 3.6)) * -3.5 : 0;
          village.style.transform = 'translateY(' + digBob.toFixed(2) + 'px)';
        }
      }
    },
    {
      id: 'scene7',
      start: 36,
      end: 42,
      chapter: '제7장 · 하늘의 감동',
      subtitle: '비가 오나 바람이 부나 하루도 쉬지 않는 우공 가족의 정성을, 하늘의 신(천제)이 굽어보고 크게 감동해 힘센 신령들을 내려보냈지요.',
      layers: [
        { type: 'image', src: 'assets/scene7.jpg', alt: '제7장 하늘의 신이 감동하는 장면', className: 'slide-base-img' },
        { type: 'custom', content: '', className: 's5-sunbeam' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' }
      ],
      animate: function (slideEl, p) {
        var beam = slideEl.querySelector('.s5-sunbeam');
        if (beam) beam.style.opacity = (0.2 + p * 0.7).toFixed(2);
      }
    },
    {
      id: 'scene8',
      start: 42,
      end: 48.0,
      chapter: '제8장 · 산이 움직이다',
      subtitle: '마침내 신령들이 두 산을 번쩍 들어 다른 곳으로 옮겨 주었답니다. 포기하지 않는 꾸준함이 거대한 산도 움직인 거예요!',
      particlesClass: 'blossoms',
      layers: [
        { type: 'image', src: 'assets/scene8.jpg', alt: '제8장 환하게 열린 길', className: 'slide-base-img' },
        { type: 'image', src: 'assets/layer_mtn_left.png', alt: '물러나는 왼쪽 산', className: 'layer-mountains layer-mtn-l' },
        { type: 'image', src: 'assets/layer_mtn_right.png', alt: '물러나는 오른쪽 산', className: 'layer-mountains layer-mtn-r' }
      ],
      animate: function (slideEl, p) {
        var mtnL = slideEl.querySelector('.layer-mtn-l');
        var mtnR = slideEl.querySelector('.layer-mtn-r');
        var eased = p * p * (3 - 2 * p);
        if (mtnL) mtnL.style.transform = 'translateX(' + (-eased * 420).toFixed(1) + 'px)';
        if (mtnR) mtnR.style.transform = 'translateX(' + (eased * 420).toFixed(1) + 'px)';
      }
    }
  ],

  study: {
    hanja: [
      { char: '愚', meaning: '어리석을 우' },
      { char: '公', meaning: '공 공 (할아버지)' },
      { char: '移', meaning: '옮길 이' },
      { char: '山', meaning: '뫼 산' }
    ],
    badukWisdom: '처음엔 바둑판이 넓고 불리해 보여도, 포기하지 않고 한 수 한 수 정성을 다해 두면 결국 승리의 길을 열 수 있어요!',
    quiz: {
      question: '‘우공이산’이 가르쳐 주는 가장 중요한 마음가짐은 무엇일까요?',
      options: [
        { text: '어려우면 빨리 포기하기', correct: false },
        { text: '끈기 있게 꾸준히 노력하기', correct: true },
        { text: '남에게 전부 미루기', correct: false }
      ],
      correctMsg: '🎉 정답입니다! 어렵더라도 포기하지 않고 꾸준히 노력하는 마음이 바로 우공이산이에요.',
      wrongMsg: '다시 한 번 생각해 볼까요? 우공 할아버지가 산을 옮긴 비결을 떠올려 보세요!'
    }
  }
};
