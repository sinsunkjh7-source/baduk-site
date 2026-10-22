// ========================================================
// Baduk Book Selector & Library Manager
// 10대 시리즈, 139권 교재, 2,170개 단원, 49,661 문제 브라우저
// ========================================================

class BadukBookSelector {
  constructor(app) {
    this.app = app;
    this.catalog = [];
    this.selectedSeries = null;
    this.selectedBook = null;
    this.selectedChapter = null;
    this.currentBookData = null;
    this.mutationMode = 'none'; // 'none' | 'random' | 'rot90' | 'rot180' | 'rot270' | 'flipH' | 'flipV'

    this.initElements();
    this.bindEvents();
    this.loadCatalog();
  }

  initElements() {
    this.modal = document.getElementById('bookSelectModal');
    this.step1List = document.getElementById('bookStep1List');
    this.step2List = document.getElementById('bookStep2List');
    this.step3List = document.getElementById('bookStep3List');
    this.btnResume = document.getElementById('btnBookResume');
    this.btnStart = document.getElementById('btnBookStart');
    this.mutationSelect = document.getElementById('bookMutationSelect');
    this.btnClose = document.getElementById('btnBookModalClose');
  }

  bindEvents() {
    if (this.btnClose) {
      this.btnClose.addEventListener('click', () => this.hide());
    }

    if (this.btnStart) {
      this.btnStart.addEventListener('click', () => {
        if (this.selectedChapter) {
          this.startSelectedChapter();
        } else {
          alert('먼저 학습할 목차(단원)를 선택해 주세요!');
        }
      });
    }

    if (this.btnResume) {
      this.btnResume.addEventListener('click', () => {
        // 마지막 진행 단원 이어하기
        this.resumeLastChapter();
      });
    }

    if (this.mutationSelect) {
      this.mutationSelect.addEventListener('change', (e) => {
        this.mutationMode = e.target.value;
      });
    }
  }

  show(targetSeriesIndex = null) {
    if (this.modal) {
      this.modal.classList.add('show');
    }
    const applyTargetSeries = () => {
      if (targetSeriesIndex !== null && this.catalog && this.catalog[targetSeriesIndex]) {
        this.selectSeries(this.catalog[targetSeriesIndex]);
      }
    };

    if (!this.catalog || this.catalog.length === 0) {
      const p = this.loadCatalog();
      if (p && typeof p.then === 'function') {
        p.then(() => applyTargetSeries());
      } else {
        setTimeout(applyTargetSeries, 100);
      }
    } else {
      if (this.step1List && this.step1List.children.length === 0) {
        this.renderStep1();
      }
      applyTargetSeries();
    }
  }

  hide() {
    if (this.modal) {
      this.modal.classList.remove('show');
    }
  }

  async loadCatalog() {
    const getGlobalCat = () => {
      if (typeof window !== 'undefined') {
        return window.CATALOG_DATA || window.BADUK_CATALOG || window._CAT || (typeof _CAT !== 'undefined' ? _CAT : null);
      }
      return typeof _CAT !== 'undefined' ? _CAT : null;
    };

    const globalCat = getGlobalCat();
    if (globalCat && Array.isArray(globalCat) && globalCat.length > 0) {
      this.catalog = globalCat;
      this.renderStep1();
      return;
    }

    try {
      // HTTP fetch fallback
      const resp = await fetch('data/catalog.json?v=' + Date.now());
      if (!resp.ok) throw new Error('Catalog fetch failed: ' + resp.status);
      this.catalog = await resp.json();
      this.renderStep1();
    } catch (err) {
      console.warn('Catalog load error, checking global window fallback:', err);
      const fallbackCat = getGlobalCat();
      if (fallbackCat && Array.isArray(fallbackCat) && fallbackCat.length > 0) {
        this.catalog = fallbackCat;
        this.renderStep1();
      } else if (this.step1List) {
        this.step1List.innerHTML = '<div class="empty-state-msg">카탈로그를 불러오지 못했습니다.</div>';
      }
    }
  }

  renderStep1() {
    if (!this.step1List) return;
    this.step1List.innerHTML = '';

    this.catalog.forEach((series, idx) => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'selector-item series-item';
      item.dataset.seriesTitle = series.title;
      if (this.selectedSeries && this.selectedSeries.title === series.title) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <span class="item-badge">🎖️</span>
        <span class="item-title">${series.title}</span>
        <span class="item-count">${series.bookCount}권</span>
      `;
      item.addEventListener('click', () => {
        this.selectSeries(series);
      });
      this.step1List.appendChild(item);
    });

    // 기본 첫 번째 시리즈 자동 선택
    if (this.catalog.length > 0 && !this.selectedSeries) {
      this.selectSeries(this.catalog[0]);
    }
  }

  selectSeries(series) {
    this.selectedSeries = series;
    this.selectedBook = null;
    this.selectedChapter = null;

    // STEP1 active 클래스 갱신 (정확한 시리즈 일치 검사)
    const buttons = this.step1List.querySelectorAll('.series-item');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.seriesTitle === series.title);
    });

    this.renderStep2();
    this.clearStep3('교재를 선택해 주세요.');
    this.updateStartButton();
  }

  renderStep2() {
    if (!this.step2List || !this.selectedSeries) return;
    this.step2List.innerHTML = '';

    const books = this.selectedSeries.books || [];
    if (books.length === 0) {
      this.step2List.innerHTML = '<div class="empty-state-msg">등록된 교재가 없습니다.</div>';
      return;
    }

    books.forEach(b => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'selector-item book-item';
      item.dataset.bookCode = String(b.code);
      if (this.selectedBook && String(this.selectedBook.code) === String(b.code)) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <span class="item-badge">📘</span>
        <span class="item-title">${b.title}</span>
        <span class="item-count">${b.chapterCount}단원</span>
      `;
      item.addEventListener('click', () => {
        this.selectBook(b);
      });
      this.step2List.appendChild(item);
    });

    // 기본 1권 자동 선택
    if (books.length > 0) {
      this.selectBook(books[0]);
    }
  }

  selectBook(book) {
    this.selectedBook = book;
    this.selectedChapter = null;

    // STEP2 active 클래스 갱신 (정확한 고유 code 기준 일치 검사)
    const buttons = this.step2List.querySelectorAll('.book-item');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.bookCode === String(book.code));
    });

    this.renderStep3();
    this.updateStartButton();
  }

  renderStep3() {
    if (!this.step3List || !this.selectedBook) return;
    this.step3List.innerHTML = '';

    const chapters = this.selectedBook.chapters || [];
    if (chapters.length === 0) {
      this.step3List.innerHTML = '<div class="empty-state-msg">목차가 없습니다.</div>';
      return;
    }

    chapters.forEach(c => {
      const item = document.createElement('button');
      item.type = 'button';
      item.className = 'selector-item chapter-item';
      item.dataset.chapterCode = String(c.code);
      if (this.selectedChapter && String(this.selectedChapter.code) === String(c.code)) {
        item.classList.add('active');
      }
      item.innerHTML = `
        <span class="item-badge">🎯</span>
        <span class="item-title">${c.title}</span>
      `;
      item.addEventListener('click', () => {
        this.selectChapter(c);
      });
      this.step3List.appendChild(item);
    });

    // 기본 1단원 자동 선택
    if (chapters.length > 0) {
      this.selectChapter(chapters[0]);
    }
  }

  selectChapter(chapter) {
    this.selectedChapter = chapter;

    // STEP3 active 클래스 갱신 (정확한 고유 code 기준 일치 검사)
    const buttons = this.step3List.querySelectorAll('.chapter-item');
    buttons.forEach(btn => {
      btn.classList.toggle('active', btn.dataset.chapterCode === String(chapter.code));
    });
    this.updateStartButton();
  }

  clearStep3(msg) {
    if (this.step3List) {
      this.step3List.innerHTML = `<div class="empty-state-msg">${msg}</div>`;
    }
  }

  updateStartButton() {
    if (this.btnStart) {
      if (this.selectedChapter) {
        this.btnStart.disabled = false;
        this.btnStart.textContent = `▶ ${this.selectedChapter.title} 시작하기`;
      } else {
        this.btnStart.disabled = true;
        this.btnStart.textContent = '▶ 시작하기';
      }
    }
  }

  async fetchBookData(bookCode) {
    const getGlobalBook = () => {
      const codeStr = String(bookCode);
      const upper = codeStr.toUpperCase();
      return window[`BOOK_DATA_${codeStr}`] || 
             window[`BOOK_DATA_${upper}`] || 
             window[`__BOOK_${codeStr}`] || 
             window[`BOOK_${upper}`] ||
             (codeStr === 'tier1_intro' ? window.BOOK_TIER1_INTRO : null);
    };
    if (getGlobalBook()) {
      return getGlobalBook();
    }

    // HTTP fetch 시도
    try {
      const resp = await fetch(`data/books/book_${bookCode}.json?v=${Date.now()}`);
      if (resp.ok) {
        return await resp.json();
      }
    } catch (e) {
      // fetch 실패 시 스크립트 태그 동적 삽입
    }

    // file:// 프로토콜 호환: 동적 script 태그 삽입
    return new Promise((resolve, reject) => {
      const script = document.createElement('script');
      script.src = `data/books_js/book_${bookCode}.js?v=${Date.now()}`;
      script.onload = () => {
        const book = getGlobalBook();
        if (book) {
          resolve(book);
        } else {
          reject(new Error(`Failed to load book ${bookCode}`));
        }
      };
      script.onerror = () => reject(new Error(`Script load failed for book ${bookCode}`));
      document.body.appendChild(script);
    });
  }

  async startSelectedChapter() {
    if (!this.selectedBook || !this.selectedChapter) return;

    try {
      const bookData = await this.fetchBookData(this.selectedBook.code);
      this.currentBookData = bookData;

      const rawChapter = bookData.chapters.find(c => 
        (c.chapterCode && String(c.chapterCode) === String(this.selectedChapter.code)) ||
        (c.code && String(c.code) === String(this.selectedChapter.code)) ||
        (c.title && this.selectedChapter.title && c.title.trim() === this.selectedChapter.title.trim()) ||
        (c.chapter && this.selectedChapter.title && c.chapter.trim() === this.selectedChapter.title.trim())
      );
      if (!rawChapter || !rawChapter.problems) {
        alert('해당 단원에 문제가 없습니다.');
        return;
      }

      // 문제를 어댑터로 변환
      const adaptedMissions = this.buildChapterMissions(rawChapter, bookData.book, this.mutationMode);

      // 게임 앱에 장착 및 모드 전환
      this.app.missions = adaptedMissions;
      this.app.solvedMissions.clear();
      this.app.currentBookInfo = {
        series: this.selectedSeries.title,
        book: this.selectedBook.title,
        chapter: this.selectedChapter.title,
        bookCode: String(this.selectedBook.code),
        chapterCode: String(this.selectedChapter.code),
        mutation: this.mutationMode
      };

      // 로컬 스토리지에 마지막 진행 상태 저장 (이어하기 기능)
      localStorage.setItem('baduk_last_study', JSON.stringify({
        seriesTitle: this.selectedSeries.title,
        bookCode: this.selectedBook.code,
        chapterCode: this.selectedChapter.code,
        mutationMode: this.mutationMode
      }));

      this.hide();

      // 헤더 배지 및 타이틀 업데이트
      const badge = document.getElementById('missionBadge');
      if (badge) badge.textContent = `${this.selectedBook.title}`;
      const headerChapterBadge = document.querySelector('.chapter-badge');
      if (headerChapterBadge) headerChapterBadge.textContent = `🟢 ${this.selectedBook.title} - ${this.selectedChapter.title}`;

      this.app.switchMode('missions');
      this.app.loadMission(0);

    } catch (err) {
      console.error('Error starting chapter:', err);
      alert('문제를 불러오는 중 오류가 발생했습니다: ' + err.message);
    }
  }

  // 🌟 원본 문제 목록으로부터 전체 미션 목록 생성 🌟
  buildChapterMissions(rawChapter, bookTitle, mutationMode) {
    const list = [];
    const total = rawChapter.problems.length;
    rawChapter.problems.forEach((rawP, idx) => {
      const origIndex = idx + 1;
      const baseMission = BadukProblemAdapter.adaptProblem(
        rawP,
        origIndex,
        total,
        rawChapter.chapter,
        bookTitle,
        mutationMode
      );
      baseMission.displayNumStr = `${origIndex}`;
      list.push(baseMission);
    });
    return list;
  }

  // 🌟 지정한 책과 단원으로 바로 학습을 시작하는 헬퍼 메서드 🌟
  async startChapterDirectly(seriesTitle, bookCode, chapterCode) {
    try {
      const bookData = await this.fetchBookData(bookCode);
      this.currentBookData = bookData;
      const rawChapter = bookData.chapters.find(c => String(c.chapterCode) === String(chapterCode));
      if (!rawChapter || !rawChapter.problems) {
        alert('해당 단원을 찾을 수 없습니다.');
        return false;
      }

      const adaptedMissions = this.buildChapterMissions(rawChapter, bookData.book, this.mutationMode);

      this.app.missions = adaptedMissions;
      this.app.solvedMissions.clear();
      this.app.currentBookInfo = {
        series: seriesTitle || (this.selectedSeries && this.selectedSeries.title) || '씽크탱크시리즈',
        book: bookData.book,
        chapter: rawChapter.chapter,
        bookCode: String(bookCode),
        chapterCode: String(chapterCode),
        mutation: this.mutationMode
      };

      localStorage.setItem('baduk_last_study', JSON.stringify({
        seriesTitle: this.app.currentBookInfo.series,
        bookCode: String(bookCode),
        chapterCode: String(chapterCode),
        mutationMode: this.mutationMode
      }));

      const badge = document.getElementById('missionBadge');
      if (badge) badge.textContent = `${bookData.book}`;
      const headerChapterBadge = document.querySelector('.chapter-badge');
      if (headerChapterBadge) headerChapterBadge.textContent = `🟢 ${bookData.book} - ${rawChapter.chapter}`;

      this.app.switchMode('missions');
      this.app.loadMission(0);
      return true;
    } catch (err) {
      console.error('Error directly starting chapter:', err);
      alert('다음 단원을 불러오는 중 오류가 발생했습니다: ' + err.message);
      return false;
    }
  }

  async resumeLastChapter() {
    const saved = localStorage.getItem('baduk_last_study');
    if (!saved) {
      alert('이전에 학습한 기록이 없습니다. 새로운 단원을 선택해 주세요!');
      return;
    }
    try {
      const info = JSON.parse(saved);
      const bookData = await this.fetchBookData(info.bookCode);
      const rawChapter = bookData.chapters.find(c => c.chapterCode === info.chapterCode) || bookData.chapters[0];

      const adaptedMissions = this.buildChapterMissions(
        rawChapter,
        bookData.book,
        info.mutationMode || 'none'
      );

      this.app.missions = adaptedMissions;
      this.hide();
      this.app.switchMode('missions');
      this.app.loadMission(0);
    } catch (err) {
      alert('이어하기 데이터를 불러오지 못했습니다. 목록에서 직접 선택해 주세요.');
    }
  }
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = BadukBookSelector;
}
