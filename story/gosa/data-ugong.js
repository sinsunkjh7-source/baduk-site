/**
 * Paper Theater Story Data: 우공이산 (愚公移山)
 * ===============================================
 * 오디오 싱크 최적화 (총 61초 8개 씬):
 * - 스튜디오 고음질 오디오 트랙(narration_scene1~8.mp3) 탑재로 끊김 없이 감미로운 낭독
 * - 브라우저 TTS는 오디오 파일 실패 시 Fallback으로만 동작
 */

window.STORY_UGONG = {
  id: 'ugong',
  title: '우공이산',
  hanja: '愚公移山',
  badge: '🎬 다층 종이 극장 쇼츠',
  summary: '매 장면마다 다층 종이 레이어와 감미로운 내레이션이 살아 숨쉬는 종이 극장',
  duration: 61.0,

  scenes: [
    {
      id: 'scene1',
      start: 0,
      end: 8.7,
      chapter: '제1장 · 길을 막은 두 산',
      subtitle: '옛날 북산에 아흔 살 우공 할아버지가 살았어요. 집 앞 거대한 두 산 때문에 매일 먼 길을 돌아가야 했지요.',
      audio: 'assets/narration_scene1.mp3',
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
      start: 8.7,
      end: 17.9,
      chapter: '제2장 · 가족과의 결심',
      subtitle: '우공은 가족을 모았어요. “저 산을 깎아 평평한 길을 냅시다!” 식구들도 기쁘게 뜻을 모았답니다.',
      audio: 'assets/narration_scene2.mp3',
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
      start: 17.9,
      end: 25.1,
      chapter: '제3장 · 첫 삽을 뜨다',
      subtitle: '다음 날 아침, 우공과 손자들은 삼태기를 메고 바위를 깨며 흙을 멀리 부지런히 날랐어요.',
      audio: 'assets/narration_scene3.mp3',
      layers: [
        { type: 'image', src: 'assets/scene3.jpg', alt: '흙을 나르는 우공과 손자들', className: 'slide-base-img' },
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
      start: 25.1,
      end: 33.7,
      chapter: '제4장 · 이웃의 비웃음',
      subtitle: '이웃 지소가 비웃었어요. “아흔 살 노인이 어찌 큰 산을 옮긴단 말이오? 기력만 다할 텐데!”',
      audio: 'assets/narration_scene4.mp3',
      layers: [
        { type: 'image', src: 'assets/scene4.jpg', alt: '비웃는 이웃 지소와 우공', className: 'slide-base-img' },
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
      start: 33.7,
      end: 41.6,
      chapter: '제5장 · 우공의 대답',
      subtitle: '우공은 웃으며 답했지요. “내가 죽으면 아들이, 아들이 죽으면 손자가 대를 이어 파낼 걸세.”',
      audio: 'assets/narration_scene5.mp3',
      layers: [
        { type: 'image', src: 'assets/layer_sky.jpg', alt: '하늘 배경' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_mtn_left.png', alt: '왼쪽 산', className: 'layer-mountains layer-mtn-l' },
        { type: 'image', src: 'assets/layer_mtn_right.png', alt: '오른쪽 산', className: 'layer-mountains layer-mtn-r' },
        { type: 'image', src: 'assets/layer_village.png', alt: '우공과 가족들', className: 'layer-village' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p, localT, globalT, isPlaying) {
        var village = slideEl.querySelector('.layer-village');
        if (village) {
          var digBob = isPlaying ? Math.abs(Math.sin(globalT * 3.6)) * -3.5 : 0;
          village.style.transform = 'translateY(' + digBob.toFixed(2) + 'px)';
        }
      }
    },
    {
      id: 'scene6',
      start: 41.6,
      end: 47.9,
      chapter: '제6장 · 낮아지는 산',
      subtitle: '“산은 자라지 않지만 우리 자손은 끝없이 이어지니 언젠간 평지가 되지 않겠소?”',
      audio: 'assets/narration_scene6.mp3',
      layers: [
        { type: 'image', src: 'assets/layer_sky.jpg', alt: '하늘 배경' },
        { type: 'custom', content: '<div class="mist-band band-1"></div><div class="mist-band band-2"></div>', className: 'layer-mist-back' },
        { type: 'image', src: 'assets/layer_mtn_left.png', alt: '낮아지는 왼쪽 산', className: 'layer-mountains layer-mtn-l' },
        { type: 'image', src: 'assets/layer_mtn_right.png', alt: '낮아지는 오른쪽 산', className: 'layer-mountains layer-mtn-r' },
        { type: 'image', src: 'assets/layer_village.png', alt: '우공과 가족들', className: 'layer-village' },
        { type: 'image', src: 'assets/layer_pines.png', alt: '소나무 프레임', className: 'layer-pines' }
      ],
      animate: function (slideEl, p) {
        var mtnL = slideEl.querySelector('.layer-mtn-l');
        var mtnR = slideEl.querySelector('.layer-mtn-r');
        var eased = p * p * (3 - 2 * p);
        var dropY = (eased * 135).toFixed(1);
        if (mtnL) mtnL.style.transform = 'translateY(' + dropY + 'px)';
        if (mtnR) mtnR.style.transform = 'translateY(' + dropY + 'px)';
      }
    },
    {
      id: 'scene7',
      start: 47.9,
      end: 54.3,
      chapter: '제7장 · 하늘의 감동',
      subtitle: '쉬지 않고 노력하는 우공 가족의 정성에 마침내 하늘의 신령도 감동했답니다.',
      audio: 'assets/narration_scene7.mp3',
      layers: [
        { type: 'image', src: 'assets/scene7.jpg', alt: '하늘의 신이 감동하는 장면', className: 'slide-base-img' },
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
      start: 54.3,
      end: 61.0,
      chapter: '제8장 · 활짝 열린 큰길',
      subtitle: '신령들이 거대한 두 산을 옮겨 주어 마침내 시원하고 넓은 큰길이 활짝 열렸답니다!',
      audio: 'assets/narration_scene8.mp3',
      particlesClass: 'blossoms',
      layers: [
        { type: 'image', src: 'assets/scene8.jpg', alt: '환하게 열린 길', className: 'slide-base-img' },
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
