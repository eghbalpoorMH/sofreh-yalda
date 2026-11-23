/**
 * Sofreh Yalda (سفره یلدا) - Complete Match-3 Puzzle Engine & Arvan Edge Client
 */

const PERSIAN_DIGITS = ['۰', '۱', '۲', '۳', '۴', '۵', '۶', '۷', '۸', '۹'];
function toFa(num) {
  if (num === null || num === undefined) return '۰';
  return String(num).replace(/\d/g, (d) => PERSIAN_DIGITS[Number(d)]);
}

class SofrehYaldaGame {
  constructor() {
    this.canvas = document.getElementById('game-canvas');
    this.renderer = new window.YaldaRenderer(this.canvas);

    // Persistent Player Progress (saved in localStorage)
    this.state = this.loadPlayerState();

    // Active Level / Gameplay State
    this.mode = 'saga'; // 'saga' or 'daily'
    this.currentLevelConfig = null;
    this.gridSize = 7;
    this.numTypes = 5;
    this.cellSize = 80;
    this.grid = []; // 2D array of cells

    this.movesLeft = 0;
    this.movesUsed = 0;
    this.score = 0;
    this.combo = 0;
    this.totalCascades = 0;
    this.bombsTriggered = 0;
    this.objectives = []; // [{ type, itemId, count, current, label }]
    this.starThresholds = [1000, 2000, 3000];

    // Edge Session Info
    this.edgeSession = null;
    this.dailyChallengeData = null;

    // Input & Animation State
    this.isBusy = false;
    this.gameEnded = false;
    this.selectedCell = null;
    this.dragStartCell = null;
    this.dragStartPos = null;
    this.activeBooster = null; // 'hammer' | 'swap' | null
    this.lastActionTime = performance.now();
    this.hintPair = null;

    // Visual FX Lists
    this.particles = [];
    this.floatingTexts = [];
    this.laserBeams = []; // [{ x1, y1, x2, y2, color, alpha, width }]
    this.shockwaves = []; // [{ x, y, r, maxR, color, alpha }]

    this.initUI();
    this.fetchDailyChallenge();
    this.renderSagaMap();
    this.updateTopHeaderStats();

    // Start 60fps render loop
    this.lastFrameTime = performance.now();
    requestAnimationFrame((t) => this.loop(t));
  }

  loadPlayerState() {
    const defaultState = {
      playerName: 'مهمان یلدا',
      unlockedLevel: 1,
      levelStars: {}, // { 1: 3, 2: 2, ... }
      levelHighScores: {},
      coins: 120,
      streak: 1,
      lastPlayedDate: new Date().toISOString().slice(0, 10),
      boosters: {
        hammer: 3,
        swap: 2,
        shuffle: 2
      }
    };
    try {
      const raw = localStorage.getItem('sofreh_yalda_save_v1');
      if (!raw) return defaultState;
      const parsed = JSON.parse(raw);
      return {
        ...defaultState,
        ...parsed,
        boosters: { ...defaultState.boosters, ...(parsed.boosters || {}) }
      };
    } catch (e) {
      return defaultState;
    }
  }

  savePlayerState() {
    try {
      localStorage.setItem('sofreh_yalda_save_v1', JSON.stringify(this.state));
    } catch (e) {
      // Ignore storage quota errors
    }
    this.updateTopHeaderStats();
  }

  getTotalStars() {
    return Object.values(this.state.levelStars).reduce((acc, s) => acc + (Number(s) || 0), 0);
  }

  getTotalSagaScore() {
    return Object.values(this.state.levelHighScores).reduce((acc, s) => acc + (Number(s) || 0), 0);
  }

  updateTopHeaderStats() {
    document.getElementById('total-stars-val').textContent = toFa(this.getTotalStars());
    document.getElementById('coins-val').textContent = toFa(this.state.coins);
    document.getElementById('streak-val').textContent = `${toFa(this.state.streak)} روز`;
    document.getElementById('display-player-name').textContent = this.state.playerName;

    // Booster counts
    document.getElementById('count-hammer').textContent =
      this.state.boosters.hammer > 0 ? toFa(this.state.boosters.hammer) : '۲۰🪙';
    document.getElementById('count-swap').textContent =
      this.state.boosters.swap > 0 ? toFa(this.state.boosters.swap) : '۲۰🪙';
    document.getElementById('count-shuffle').textContent =
      this.state.boosters.shuffle > 0 ? toFa(this.state.boosters.shuffle) : '۲۰🪙';
  }

  initUI() {
    // Navigation & Header Buttons
    document.getElementById('btn-home-logo').addEventListener('click', () => this.showMapScreen());
    document.getElementById('btn-back-map').addEventListener('click', () => this.showMapScreen());

    document.getElementById('btn-sound').addEventListener('click', () => {
      const enabled = window.yaldaAudio.toggle();
      document.getElementById('sound-icon').textContent = enabled ? '🔊' : '🔇';
      this.showToast(enabled ? 'صدای سنتور و افکت‌ها فعال شد' : 'صدای بازی بی‌صدا شد');
    });

    document.getElementById('btn-fal').addEventListener('click', () => this.openFalModal());
    document.getElementById('btn-new-fal').addEventListener('click', () => this.openFalModal(true));
    document.getElementById('btn-share-fal').addEventListener('click', () => this.shareCurrentFal());

    document.getElementById('btn-leaderboard').addEventListener('click', () => this.openLeaderboardModal('saga'));
    document.getElementById('tab-lb-saga').addEventListener('click', () => this.switchLeaderboardTab('saga'));
    document.getElementById('tab-lb-daily').addEventListener('click', () => this.switchLeaderboardTab('daily'));

    document.getElementById('btn-save-name').addEventListener('click', () => {
      const val = document.getElementById('input-player-name').value.trim();
      if (val) {
        this.state.playerName = val.slice(0, 20);
        this.savePlayerState();
        this.showToast(`نام شما به «${this.state.playerName}» تغییر یافت!`);
        this.openLeaderboardModal(this.activeLbTab || 'saga');
      }
    });

    document.getElementById('btn-change-name').addEventListener('click', () => {
      this.openLeaderboardModal('saga');
      setTimeout(() => document.getElementById('input-player-name').focus(), 100);
    });

    document.getElementById('btn-guide').addEventListener('click', () => {
      this.openModal('modal-guide');
    });

    // Daily challenge start button
    document.getElementById('btn-play-daily').addEventListener('click', () => {
      this.openDailyBriefing();
    });

    // Level Briefing Start Confirmation
    document.getElementById('btn-confirm-start-level').addEventListener('click', () => {
      this.closeModal('modal-level-brief');
      if (this.pendingLevelConfig) {
        this.startLevel(this.pendingLevelConfig, this.pendingLevelMode);
      }
    });

    // Victory Modal actions
    document.getElementById('btn-next-level').addEventListener('click', () => {
      this.closeModal('modal-victory');
      if (this.mode === 'daily') {
        this.showMapScreen();
        return;
      }
      const nextId = (this.currentLevelConfig.id || 1) + 1;
      const nextLvl = window.YALDA_LEVELS.find((l) => l.id === nextId);
      if (nextLvl) {
        this.openLevelBriefing(nextLvl, 'saga');
      } else {
        this.showMapScreen();
      }
    });

    document.getElementById('btn-share-victory').addEventListener('click', () => {
      this.shareVictoryRecord();
    });

    document.getElementById('btn-victory-map').addEventListener('click', () => {
      this.closeModal('modal-victory');
      this.showMapScreen();
    });

    // Defeat Modal actions
    document.getElementById('btn-buy-moves').addEventListener('click', () => {
      if (this.state.coins < 25) {
        this.showToast('گردوی طلایی کافی ندارید! با رد کردن مراحل گردو بگیرید 🪙');
        return;
      }
      this.state.coins -= 25;
      this.savePlayerState();
      this.movesLeft += 5;
      this.gameEnded = false;
      this.closeModal('modal-defeat');
      this.updateHUD();
      window.yaldaAudio.playBombCreate();
      this.showBoardBanner('➕ ۵ حرکت اضافه شد!');
    });

    document.getElementById('btn-retry-level').addEventListener('click', () => {
      this.closeModal('modal-defeat');
      if (this.currentLevelConfig) {
        this.startLevel(this.currentLevelConfig, this.mode);
      }
    });

    document.getElementById('btn-defeat-map').addEventListener('click', () => {
      this.closeModal('modal-defeat');
      this.showMapScreen();
    });

    // Boosters Dock
    document.getElementById('booster-hammer').addEventListener('click', () => this.toggleBooster('hammer'));
    document.getElementById('booster-swap').addEventListener('click', () => this.toggleBooster('swap'));
    document.getElementById('booster-shuffle').addEventListener('click', () => this.useShuffleBooster());
    document.getElementById('btn-cancel-booster').addEventListener('click', () => this.clearActiveBooster());

    // Close modal buttons
    document.querySelectorAll('[data-close]').forEach((btn) => {
      btn.addEventListener('click', () => {
        const target = btn.getAttribute('data-close');
        this.closeModal(target);
      });
    });

    // Canvas Pointer / Touch / Mouse Events
    this.setupCanvasInputs();
  }

  openModal(id) {
    document.getElementById(id).classList.remove('hidden');
  }

  closeModal(id) {
    document.getElementById(id).classList.add('hidden');
  }

  showToast(text) {
    const container = document.getElementById('toast-container');
    const el = document.createElement('div');
    el.className = 'toast-msg';
    el.textContent = text;
    container.appendChild(el);
    setTimeout(() => {
      el.remove();
    }, 2900);
  }

  showBoardBanner(text) {
    const banner = document.getElementById('board-floating-banner');
    banner.textContent = text;
    banner.classList.remove('hidden');
    clearTimeout(this.bannerTimeout);
    this.bannerTimeout = setTimeout(() => {
      banner.classList.add('hidden');
    }, 1500);
  }

  showMapScreen() {
    this.clearActiveBooster();
    document.getElementById('screen-game').classList.remove('active');
    document.getElementById('screen-map').classList.add('active');
    this.renderSagaMap();
  }

  showGameScreen() {
    document.getElementById('screen-map').classList.remove('active');
    document.getElementById('screen-game').classList.add('active');
  }

  /**
   * Renders the 15 Classic Saga Level Nodes on the Yalda Map
   */
  renderSagaMap() {
    const container = document.getElementById('saga-nodes-grid');
    container.innerHTML = '';

    window.YALDA_LEVELS.forEach((lvl) => {
      const isUnlocked = lvl.id <= this.state.unlockedLevel;
      const isCurrent = lvl.id === this.state.unlockedLevel;
      const earnedStars = this.state.levelStars[lvl.id] || 0;

      const card = document.createElement('div');
      card.className = `level-node-card ${isUnlocked ? '' : 'locked'} ${isCurrent ? 'current' : ''}`;

      const starsHtml = [1, 2, 3]
        .map((s) => `<span class="${s <= earnedStars ? 'star-earned' : 'star-empty'}">⭐</span>`)
        .join('');

      card.innerHTML = `
        <div class="node-num-circle">${isUnlocked ? toFa(lvl.id) : '🔒'}</div>
        <div class="node-title">${lvl.title}</div>
        <div class="node-feature-pill">${lvl.featureTag}</div>
        <div class="node-stars">${starsHtml}</div>
      `;

      card.addEventListener('click', () => {
        if (!isUnlocked) {
          window.yaldaAudio.playInvalid();
          this.showToast(`ابتدا مرحله ${toFa(lvl.id - 1)} را کامل کنید!`);
          return;
        }
        window.yaldaAudio.playSelect();
        this.openLevelBriefing(lvl, 'saga');
      });

      container.appendChild(card);
    });
  }

  getObjectiveIcon(target) {
    if (target.type === 'ice') return '❄️';
    if (target.type === 'box') return '🎁';
    const treat = window.YALDA_TREATS[target.itemId] || window.YALDA_TREATS[0];
    return treat.emoji;
  }

  openLevelBriefing(levelConfig, mode = 'saga') {
    this.pendingLevelConfig = levelConfig;
    this.pendingLevelMode = mode;

    document.getElementById('brief-level-badge').textContent =
      mode === 'daily' ? '⚡ چالش روزانه لبه' : `مرحله ${toFa(levelConfig.id)}`;
    document.getElementById('brief-level-title').textContent = levelConfig.title;
    document.getElementById('brief-level-desc').textContent = levelConfig.description || levelConfig.subtitle || '';
    document.getElementById('brief-moves-count').textContent = toFa(levelConfig.moves);

    const listEl = document.getElementById('brief-targets-list');
    listEl.innerHTML = '';
    levelConfig.targets.forEach((t) => {
      const chip = document.createElement('div');
      chip.className = 'obj-chip';
      chip.innerHTML = `
        <span class="obj-icon">${this.getObjectiveIcon(t)}</span>
        <span>${toFa(t.count)} ${t.label}</span>
      `;
      listEl.appendChild(chip);
    });

    this.openModal('modal-level-brief');
  }

  async fetchDailyChallenge() {
    try {
      const res = await fetch('/api/daily');
      const data = await res.json();
      this.dailyChallengeData = data;
      if (data && data.modifier) {
        document.getElementById('daily-title').textContent = `⚡ ${data.modifier.title}`;
        document.getElementById('daily-subtitle').textContent = data.modifier.subtitle;
        document.getElementById('daily-node-badge').textContent = `🌐 نود لبه: ${data.edgeNode}`;
      }
    } catch (e) {
      // Fallback offline daily challenge
    }
  }

  openDailyBriefing() {
    const mod = (this.dailyChallengeData && this.dailyChallengeData.modifier) || {
      id: 'ruby_pomegranate_rain',
      title: 'باران انار یاقوتی (چالش روزانه)',
      subtitle: 'انارها را جمع کنید و قندیل‌های یخ و جعبه‌های شیرینی را بشکنید!',
      moves: 22,
      gridSize: 8,
      targets: [
        { type: 'item', itemId: 1, count: 24, label: 'انار یاقوتی' },
        { type: 'ice', count: 10, label: 'قندیل یخ' },
        { type: 'box', count: 6, label: 'جعبه شیرینی' }
      ],
      starThresholds: [1800, 3400, 5200]
    };

    const dailyLevelConfig = {
      id: 99,
      title: mod.title,
      description: mod.subtitle,
      gridSize: 8,
      numTypes: 6,
      moves: mod.moves,
      targets: mod.targets,
      icePositions: [
        [1, 2, 1], [1, 5, 1],
        [2, 2, 2], [2, 3, 1], [2, 4, 1], [2, 5, 2],
        [5, 2, 1], [5, 3, 1], [5, 4, 1], [5, 5, 1]
      ],
      boxPositions: [
        [3, 1], [3, 3], [3, 4], [3, 6],
        [4, 3], [4, 4]
      ],
      starThresholds: mod.starThresholds || [1800, 3400, 5200]
    };

    window.yaldaAudio.playSelect();
    this.openLevelBriefing(dailyLevelConfig, 'daily');
  }

  /**
   * Starts a Match-3 Level (Saga or Edge Daily Challenge)
   */
  async startLevel(levelConfig, mode = 'saga') {
    this.mode = mode;
    this.currentLevelConfig = levelConfig;
    this.gridSize = levelConfig.gridSize || 7;
    this.numTypes = levelConfig.numTypes || 5;
    this.cellSize = this.canvas.width / this.gridSize;

    this.movesLeft = levelConfig.moves;
    this.movesUsed = 0;
    this.score = 0;
    this.combo = 0;
    this.totalCascades = 0;
    this.bombsTriggered = 0;
    this.starThresholds = levelConfig.starThresholds || [1000, 2000, 3000];
    this.objectives = levelConfig.targets.map((t) => ({
      ...t,
      current: 0
    }));

    this.selectedCell = null;
    this.hintPair = null;
    this.isBusy = false;
    this.gameEnded = false;
    this.particles = [];
    this.floatingTexts = [];
    this.laserBeams = [];
    this.shockwaves = [];
    this.clearActiveBooster();

    this.buildInitialBoard(levelConfig);
    this.showGameScreen();
    this.updateHUD();
    this.lastActionTime = performance.now();

    // Request signed Edge session token from Arvan Edge Worker
    try {
      const res = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ levelId: levelConfig.id, mode })
      });
      this.edgeSession = await res.json();
    } catch (e) {
      this.edgeSession = null;
    }
  }

  buildInitialBoard(levelConfig) {
    const N = this.gridSize;
    this.grid = Array.from({ length: N }, () => Array(N).fill(null));

    const boxSet = new Set((levelConfig.boxPositions || []).map(([r, c]) => `${r},${c}`));
    const iceMap = new Map((levelConfig.icePositions || []).map(([r, c, layers]) => [`${r},${c}`, layers || 1]));

    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const key = `${r},${c}`;
        if (boxSet.has(key)) {
          this.grid[r][c] = {
            r,
            c,
            type: -1,
            isBox: true,
            ice: 0,
            special: null,
            x: (c + 0.5) * this.cellSize,
            y: (r + 0.5) * this.cellSize,
            scale: 1
          };
          continue;
        }

        // Choose a treat type that doesn't create an initial 3-match
        let type = Math.floor(Math.random() * this.numTypes);
        let tries = 0;
        while (
          tries < 20 &&
          ((c >= 2 &&
            this.grid[r][c - 1] &&
            this.grid[r][c - 2] &&
            !this.grid[r][c - 1].isBox &&
            this.grid[r][c - 1].type === type &&
            this.grid[r][c - 2].type === type) ||
            (r >= 2 &&
              this.grid[r - 1][c] &&
              this.grid[r - 2][c] &&
              !this.grid[r - 1][c].isBox &&
              this.grid[r - 1][c].type === type &&
              this.grid[r - 2][c].type === type))
        ) {
          type = (type + 1) % this.numTypes;
          tries++;
        }

        this.grid[r][c] = {
          r,
          c,
          type,
          isBox: false,
          ice: iceMap.get(key) || 0,
          special: null,
          x: (c + 0.5) * this.cellSize,
          y: (r + 0.5) * this.cellSize - N * this.cellSize * 0.35,
          scale: 1
        };
      }
    }

    // Ensure at least one valid move exists
    if (!this.findValidMove()) {
      this.shuffleBoardTiles(false);
    }
  }

  updateHUD() {
    document.getElementById('hud-level-num').textContent =
      this.mode === 'daily' ? '⚡ چالش روزانه' : `مرحله ${toFa(this.currentLevelConfig.id)}`;
    document.getElementById('hud-level-name').textContent = this.currentLevelConfig.title;
    document.getElementById('hud-moves').textContent = toFa(this.movesLeft);

    const movesBox = document.getElementById('hud-moves-box');
    if (this.movesLeft <= 5) {
      movesBox.classList.add('low-moves');
    } else {
      movesBox.classList.remove('low-moves');
    }

    document.getElementById('hud-score').textContent = toFa(this.score);

    const comboEl = document.getElementById('hud-combo');
    if (this.combo > 1) {
      comboEl.textContent = `کمبو ×${toFa(this.combo)}`;
      comboEl.classList.remove('hidden');
    } else {
      comboEl.classList.add('hidden');
    }

    // Star progress bar
    const maxT = this.starThresholds[2] || 3000;
    const pct = Math.min(100, Math.round((this.score / maxT) * 100));
    document.getElementById('star-progress-fill').style.width = `${pct}%`;

    [1, 2, 3].forEach((idx) => {
      const marker = document.getElementById(`star-marker-${idx}`);
      if (this.score >= this.starThresholds[idx - 1]) {
        marker.classList.add('earned');
      } else {
        marker.classList.remove('earned');
      }
    });

    // Objectives chips
    const objContainer = document.getElementById('hud-objectives');
    objContainer.innerHTML = '';
    this.objectives.forEach((obj) => {
      const done = obj.current >= obj.count;
      const chip = document.createElement('div');
      chip.className = `obj-chip ${done ? 'completed' : ''}`;
      chip.innerHTML = `
        <span class="obj-icon">${this.getObjectiveIcon(obj)}</span>
        <span>${done ? '✅' : `${toFa(obj.current)}/${toFa(obj.count)}`}</span>
      `;
      objContainer.appendChild(chip);
    });
  }

  /**
   * Canvas Input Handling (Mouse & Touch Drag + Click-to-Swap)
   */
  setupCanvasInputs() {
    const getGridCoords = (clientX, clientY) => {
      const rect = this.canvas.getBoundingClientRect();
      const scaleX = this.canvas.width / rect.width;
      const scaleY = this.canvas.height / rect.height;
      const x = (clientX - rect.left) * scaleX;
      const y = (clientY - rect.top) * scaleY;
      const c = Math.floor(x / this.cellSize);
      const r = Math.floor(y / this.cellSize);
      if (r < 0 || r >= this.gridSize || c < 0 || c >= this.gridSize) return null;
      return { r, c, x, y };
    };

    const onPointerDown = (clientX, clientY) => {
      if (this.isBusy || this.gameEnded) return;
      this.lastActionTime = performance.now();
      this.hintPair = null;

      const coords = getGridCoords(clientX, clientY);
      if (!coords) return;
      const cell = this.grid[coords.r][coords.c];
      if (!cell) return;

      // Booster 1: Nutcracker Hammer (چکش گردوشکن)
      if (this.activeBooster === 'hammer') {
        this.executeHammerBooster(coords.r, coords.c);
        return;
      }

      if (cell.isBox) {
        window.yaldaAudio.playInvalid();
        this.showToast('جعبه شیرینی تکان نمی‌خورد! خوراکی‌های کنارش را جور کنید 🎁');
        return;
      }

      this.dragStartCell = { r: coords.r, c: coords.c };
      this.dragStartPos = { x: coords.x, y: coords.y };

      if (!this.selectedCell) {
        this.selectedCell = { r: coords.r, c: coords.c };
        window.yaldaAudio.playSelect();
      } else {
        const dr = Math.abs(this.selectedCell.r - coords.r);
        const dc = Math.abs(this.selectedCell.c - coords.c);
        if (dr + dc === 1) {
          const first = this.selectedCell;
          this.selectedCell = null;
          this.dragStartCell = null;
          this.attemptSwap(first.r, first.c, coords.r, coords.c);
        } else if (dr === 0 && dc === 0) {
          this.selectedCell = null;
        } else {
          this.selectedCell = { r: coords.r, c: coords.c };
          window.yaldaAudio.playSelect();
        }
      }
    };

    const onPointerMove = (clientX, clientY) => {
      if (!this.dragStartCell || !this.dragStartPos || this.isBusy || this.gameEnded) return;
      const rect = this.canvas.getBoundingClientRect();
      const x = (clientX - rect.left) * (this.canvas.width / rect.width);
      const y = (clientY - rect.top) * (this.canvas.height / rect.height);
      const dx = x - this.dragStartPos.x;
      const dy = y - this.dragStartPos.y;
      const threshold = this.cellSize * 0.36;

      if (Math.abs(dx) > threshold || Math.abs(dy) > threshold) {
        let tr = this.dragStartCell.r;
        let tc = this.dragStartCell.c;
        if (Math.abs(dx) > Math.abs(dy)) {
          tc += dx > 0 ? 1 : -1;
        } else {
          tr += dy > 0 ? 1 : -1;
        }
        const sr = this.dragStartCell.r;
        const sc = this.dragStartCell.c;
        this.dragStartCell = null;
        this.dragStartPos = null;
        this.selectedCell = null;

        if (tr >= 0 && tr < this.gridSize && tc >= 0 && tc < this.gridSize) {
          this.attemptSwap(sr, sc, tr, tc);
        }
      }
    };

    const onPointerUp = () => {
      this.dragStartCell = null;
      this.dragStartPos = null;
    };

    this.canvas.addEventListener('mousedown', (e) => onPointerDown(e.clientX, e.clientY));
    window.addEventListener('mousemove', (e) => onPointerMove(e.clientX, e.clientY));
    window.addEventListener('mouseup', onPointerUp);

    this.canvas.addEventListener(
      'touchstart',
      (e) => {
        if (e.touches.length > 0) {
          e.preventDefault();
          onPointerDown(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: false }
    );
    this.canvas.addEventListener(
      'touchmove',
      (e) => {
        if (e.touches.length > 0) {
          e.preventDefault();
          onPointerMove(e.touches[0].clientX, e.touches[0].clientY);
        }
      },
      { passive: false }
    );
    this.canvas.addEventListener('touchend', onPointerUp);
  }

  /**
   * Boosters (چکش گردوشکن، جابه‌جایی آزاد، بر زدن سفره)
   */
  canAffordOrUseBooster(type) {
    if (this.state.boosters[type] > 0) return true;
    if (this.state.coins >= 20) return true;
    this.showToast('موجودی این ابزار تمام شده و به ۲۰ گردوی طلایی 🪙 نیاز دارد!');
    window.yaldaAudio.playInvalid();
    return false;
  }

  consumeBoosterCharge(type) {
    if (this.state.boosters[type] > 0) {
      this.state.boosters[type] -= 1;
    } else {
      this.state.coins = Math.max(0, this.state.coins - 20);
    }
    this.savePlayerState();
  }

  toggleBooster(type) {
    if (this.isBusy || this.gameEnded) return;
    if (this.activeBooster === type) {
      this.clearActiveBooster();
      return;
    }
    if (!this.canAffordOrUseBooster(type)) return;

    this.activeBooster = type;
    this.selectedCell = null;
    window.yaldaAudio.playSelect();

    document.querySelectorAll('.booster-btn').forEach((b) => b.classList.remove('active'));
    document.getElementById(`booster-${type}`).classList.add('active');

    const banner = document.getElementById('booster-active-banner');
    const textEl = document.getElementById('booster-active-text');
    banner.classList.remove('hidden');

    if (type === 'hammer') {
      textEl.textContent = '🔨 چکش گردوشکن فعال است: روی هر خوراکی، قندیل یخ یا جعبه شیرینی کلیک کنید تا بشکند!';
    } else if (type === 'swap') {
      textEl.textContent = '🔄 جابه‌جایی آزاد فعال است: دو خانه مجاور را بدون نیاز به جور شدن جابه‌جا کنید!';
    }
  }

  clearActiveBooster() {
    this.activeBooster = null;
    document.querySelectorAll('.booster-btn').forEach((b) => b.classList.remove('active'));
    document.getElementById('booster-active-banner').classList.add('hidden');
  }

  async executeHammerBooster(r, c) {
    const cell = this.grid[r][c];
    if (!cell) return;

    this.isBusy = true;
    this.consumeBoosterCharge('hammer');
    this.clearActiveBooster();

    const cx = (c + 0.5) * this.cellSize;
    const cy = (r + 0.5) * this.cellSize;
    this.addShockwave(cx, cy, '#f5c542', this.cellSize * 1.3);
    window.yaldaAudio.playAreaBoom();

    if (cell.isBox) {
      this.damageBoxCell(r, c);
    } else if (cell.ice > 0) {
      this.damageIceOnCell(cell);
      this.collectAndClearCell(r, c, 'hammer');
    } else {
      await this.detonateOrClearCell(r, c);
    }

    this.updateHUD();
    await this.sleep(240);
    await this.applyGravityAndCascade();
    this.isBusy = false;
    this.checkEndOfTurnConditions();
  }

  async useShuffleBooster() {
    if (this.isBusy || this.gameEnded) return;
    if (!this.canAffordOrUseBooster('shuffle')) return;

    this.consumeBoosterCharge('shuffle');
    this.clearActiveBooster();
    this.shuffleBoardTiles(true);
  }

  shuffleBoardTiles(withEffect = true) {
    const movableCells = [];
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.isBox) {
          movableCells.push({ type: cell.type, special: cell.special });
        }
      }
    }

    // Fisher-Yates shuffle
    for (let i = movableCells.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [movableCells[i], movableCells[j]] = [movableCells[j], movableCells[i]];
    }

    let idx = 0;
    for (let r = 0; r < this.gridSize; r++) {
      for (let c = 0; c < this.gridSize; c++) {
        const cell = this.grid[r][c];
        if (cell && !cell.isBox) {
          cell.type = movableCells[idx].type;
          cell.special = movableCells[idx].special;
          cell.y = (r + 0.5) * this.cellSize - 40;
          idx++;
        }
      }
    }

    if (withEffect) {
      window.yaldaAudio.playColorDivan();
      this.showBoardBanner('🎲 سفره یلدا بُر خورد!');
    }
  }

  /**
   * Swapping & Match-3 Resolution Pipeline
   */
  async attemptSwap(r1, c1, r2, c2) {
    if (this.isBusy || this.gameEnded) return;
    const cell1 = this.grid[r1][c1];
    const cell2 = this.grid[r2][c2];
    if (!cell1 || !cell2 || cell1.isBox || cell2.isBox) {
      window.yaldaAudio.playInvalid();
      return;
    }

    this.isBusy = true;
    const isFreeSwap = this.activeBooster === 'swap';

    // Perform logical swap
    this.swapGridCells(r1, c1, r2, c2);
    window.yaldaAudio.playSwap();
    await this.sleep(210);

    // Check if either cell is a Special Hafez Divan Color Bomb or if two Special Bombs were swapped together
    const isColorCombo = cell1.special === 'color' || cell2.special === 'color';
    const isDoubleSpecial = cell1.special && cell2.special;

    if (isColorCombo || isDoubleSpecial) {
      if (isFreeSwap) {
        this.consumeBoosterCharge('swap');
        this.clearActiveBooster();
      } else {
        this.movesLeft = Math.max(0, this.movesLeft - 1);
        this.movesUsed += 1;
      }
      this.combo = 1;
      await this.triggerSpecialCombo(cell1, cell2);
      await this.applyGravityAndCascade();
      this.isBusy = false;
      this.checkEndOfTurnConditions();
      return;
    }

    // Standard match check
    const matchGroups = this.findAllMatchGroups();
    if (matchGroups.length === 0 && !isFreeSwap) {
      // Invalid swap -> bounce back!
      window.yaldaAudio.playInvalid();
      this.swapGridCells(r1, c1, r2, c2);
      await this.sleep(210);
      this.isBusy = false;
      return;
    }

    if (isFreeSwap) {
      this.consumeBoosterCharge('swap');
      this.clearActiveBooster();
      this.showBoardBanner('🔄 جابه‌جایی آزاد انجام شد!');
    } else {
      this.movesLeft = Math.max(0, this.movesLeft - 1);
      this.movesUsed += 1;
    }

    this.combo = 0;
    this.updateHUD();

    if (matchGroups.length > 0) {
      await this.resolveMatchesAndCascades({ r1, c1, r2, c2 });
    }

    this.isBusy = false;
    this.checkEndOfTurnConditions();
  }

  swapGridCells(r1, c1, r2, c2) {
    const temp = this.grid[r1][c1];
    this.grid[r1][c1] = this.grid[r2][c2];
    this.grid[r2][c2] = temp;

    if (this.grid[r1][c1]) {
      this.grid[r1][c1].r = r1;
      this.grid[r1][c1].c = c1;
    }
    if (this.grid[r2][c2]) {
      this.grid[r2][c2].r = r2;
      this.grid[r2][c2].c = c2;
    }
  }

  /**
   * Finds all connected horizontal & vertical match groups (length >= 3)
   * and classifies them into:
   * - normal (3 tiles)
   * - 'line_h' / 'line_v' (4 tiles in a line -> ترقه خطی)
   * - 'bomb' (L or T intersection -> بمب انار انفجاری)
   * - 'color' (5+ tiles in a straight line -> دیوان حافظ رنگ‌پاک‌کن)
   */
  findAllMatchGroups() {
    const N = this.gridSize;
    const horizRuns = [];
    const vertRuns = [];

    // Horizontal runs
    for (let r = 0; r < N; r++) {
      let c = 0;
      while (c < N) {
        const cell = this.grid[r][c];
        if (!cell || cell.isBox || cell.type < 0 || cell.special === 'color') {
          c++;
          continue;
        }
        let end = c + 1;
        while (
          end < N &&
          this.grid[r][end] &&
          !this.grid[r][end].isBox &&
          this.grid[r][end].type === cell.type &&
          this.grid[r][end].special !== 'color'
        ) {
          end++;
        }
        const len = end - c;
        if (len >= 3) {
          const cells = [];
          for (let k = c; k < end; k++) cells.push({ r, c: k });
          horizRuns.push({ type: cell.type, cells, orientation: 'h', len });
        }
        c = end;
      }
    }

    // Vertical runs
    for (let c = 0; c < N; c++) {
      let r = 0;
      while (r < N) {
        const cell = this.grid[r][c];
        if (!cell || cell.isBox || cell.type < 0 || cell.special === 'color') {
          r++;
          continue;
        }
        let end = r + 1;
        while (
          end < N &&
          this.grid[end][c] &&
          !this.grid[end][c].isBox &&
          this.grid[end][c].type === cell.type &&
          this.grid[end][c].special !== 'color'
        ) {
          end++;
        }
        const len = end - r;
        if (len >= 3) {
          const cells = [];
          for (let k = r; k < end; k++) cells.push({ r: k, c });
          vertRuns.push({ type: cell.type, cells, orientation: 'v', len });
        }
        r = end;
      }
    }

    // Merge intersecting runs of the same type to detect L/T shapes
    const usedVert = new Set();
    const groups = [];

    horizRuns.forEach((hRun) => {
      const hSet = new Set(hRun.cells.map((p) => `${p.r},${p.c}`));
      let intersected = false;
      let combinedCells = [...hRun.cells];
      let maxLineLen = hRun.len;

      vertRuns.forEach((vRun, vIdx) => {
        if (usedVert.has(vIdx) || vRun.type !== hRun.type) return;
        const overlap = vRun.cells.some((p) => hSet.has(`${p.r},${p.c}`));
        if (overlap) {
          intersected = true;
          usedVert.add(vIdx);
          maxLineLen = Math.max(maxLineLen, vRun.len);
          vRun.cells.forEach((p) => {
            if (!hSet.has(`${p.r},${p.c}`)) {
              hSet.add(`${p.r},${p.c}`);
              combinedCells.push(p);
            }
          });
        }
      });

      let spawnSpecial = null;
      if (maxLineLen >= 5) {
        spawnSpecial = 'color'; // دیوان حافظ
      } else if (intersected) {
        spawnSpecial = 'bomb'; // بمب انار L/T
      } else if (hRun.len === 4) {
        spawnSpecial = 'line_v'; // ترقه خطی
      }

      groups.push({
        type: hRun.type,
        cells: combinedCells,
        spawnSpecial
      });
    });

    vertRuns.forEach((vRun, vIdx) => {
      if (usedVert.has(vIdx)) return;
      let spawnSpecial = null;
      if (vRun.len >= 5) {
        spawnSpecial = 'color';
      } else if (vRun.len === 4) {
        spawnSpecial = 'line_h';
      }
      groups.push({
        type: vRun.type,
        cells: vRun.cells,
        spawnSpecial
      });
    });

    return groups;
  }

  async resolveMatchesAndCascades(swapContext = null) {
    let groups = this.findAllMatchGroups();

    while (groups.length > 0) {
      this.combo += 1;
      this.totalCascades += 1;
      window.yaldaAudio.playMatch(this.combo);

      if (this.combo === 3) {
        this.showBoardBanner('🔥 کمبو یلدایی ×۳!');
      } else if (this.combo >= 4) {
        this.showBoardBanner(`🌟 طوفان شب چله ×${toFa(this.combo)}!`);
      }

      const cellsToClear = new Map();
      const specialsToSpawn = [];
      const adjacentBoxDamageSet = new Set();

      groups.forEach((group) => {
        // Decide where to spawn a special bomb if earned
        let spawnCoord = null;
        if (group.spawnSpecial) {
          // Prefer user-swapped tile if it's part of this group
          if (swapContext) {
            const matchSwap = group.cells.find(
              (p) =>
                (p.r === swapContext.r1 && p.c === swapContext.c1) ||
                (p.r === swapContext.r2 && p.c === swapContext.c2)
            );
            if (matchSwap) spawnCoord = matchSwap;
          }
          if (!spawnCoord) {
            spawnCoord = group.cells[Math.floor(group.cells.length / 2)];
          }
          specialsToSpawn.push({
            r: spawnCoord.r,
            c: spawnCoord.c,
            type: group.type,
            special: group.spawnSpecial
          });
        }

        group.cells.forEach((p) => {
          cellsToClear.set(`${p.r},${p.c}`, p);
          // Mark orthogonally adjacent cells to check for Sweet Boxes (جعبه شیرینی)
          const dirs = [[-1, 0], [1, 0], [0, -1], [0, 1]];
          dirs.forEach(([dr, dc]) => {
            const nr = p.r + dr;
            const nc = p.c + dc;
            if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
              adjacentBoxDamageSet.add(`${nr},${nc}`);
            }
          });
        });
      });

      swapContext = null;

      // Damage adjacent Sweet Boxes (جعبه شیرینی)
      adjacentBoxDamageSet.forEach((key) => {
        const [br, bc] = key.split(',').map(Number);
        const bCell = this.grid[br][bc];
        if (bCell && bCell.isBox) {
          this.damageBoxCell(br, bc);
        }
      });

      // Clear matched tiles & trigger any pre-existing special bombs inside the match
      for (const p of cellsToClear.values()) {
        await this.detonateOrClearCell(p.r, p.c);
      }

      // Spawn newly created Special Bombs (ترقه خطی، بمب انار، دیوان حافظ)
      specialsToSpawn.forEach((sp) => {
        window.yaldaAudio.playBombCreate();
        const cx = (sp.c + 0.5) * this.cellSize;
        const cy = (sp.r + 0.5) * this.cellSize;
        const label =
          sp.special === 'color' ? '📘 دیوان حافظ!' :
          sp.special === 'bomb' ? '💣 بمب انار!' : '💥 ترقه خطی!';
        this.addFloatingText(cx, cy, label, '#fef08a');
        this.addShockwave(cx, cy, '#f5c542', this.cellSize * 1.1);

        this.grid[sp.r][sp.c] = {
          r: sp.r,
          c: sp.c,
          type: sp.type,
          isBox: false,
          ice: 0,
          special: sp.special,
          x: cx,
          y: cy,
          scale: 1.25
        };
      });

      this.updateHUD();
      await this.sleep(230);
      await this.applyGravityAndCascade();
      groups = this.findAllMatchGroups();
    }
  }

  /**
   * Handles Special Bomb + Special Bomb or Hafez Divan Color Bomb swaps
   */
  async triggerSpecialCombo(cell1, cell2) {
    this.bombsTriggered += 1;
    const cx1 = (cell1.c + 0.5) * this.cellSize;
    const cy1 = (cell1.r + 0.5) * this.cellSize;
    const cx2 = (cell2.c + 0.5) * this.cellSize;
    const cy2 = (cell2.r + 0.5) * this.cellSize;

    // Case 1: Hafez Divan + Hafez Divan -> Full Board Supernova!
    if (cell1.special === 'color' && cell2.special === 'color') {
      window.yaldaAudio.playColorDivan();
      this.showBoardBanner('🌟 معجزه دیوان حافظ! کل سفره پاک شد!');
      this.addShockwave(this.canvas.width / 2, this.canvas.height / 2, '#fde047', this.canvas.width);

      cell1.special = null;
      cell2.special = null;
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          const t = this.grid[r][c];
          if (!t) continue;
          if (t.isBox) {
            this.damageBoxCell(r, c);
          } else {
            this.collectAndClearCell(r, c, 'supernova');
          }
        }
      }
      this.updateHUD();
      await this.sleep(360);
      return;
    }

    // Case 2: Hafez Divan + Any Treat or Bomb
    if (cell1.special === 'color' || cell2.special === 'color') {
      const divan = cell1.special === 'color' ? cell1 : cell2;
      const other = divan === cell1 ? cell2 : cell1;
      const targetType = other.type;
      const transformToSpecial = other.special; // 'line_h', 'line_v', 'bomb', or null

      window.yaldaAudio.playColorDivan();
      this.showBoardBanner(
        transformToSpecial ? '⚡ طوفان بمب‌های دیوان حافظ!' : '📜 صاعقه دیوان حافظ!'
      );

      const divanX = (divan.c + 0.5) * this.cellSize;
      const divanY = (divan.r + 0.5) * this.cellSize;
      divan.special = null;
      this.collectAndClearCell(divan.r, divan.c, 'color');

      const targets = [];
      for (let r = 0; r < this.gridSize; r++) {
        for (let c = 0; c < this.gridSize; c++) {
          const t = this.grid[r][c];
          if (t && !t.isBox && t.type === targetType) {
            targets.push(t);
            const tx = (c + 0.5) * this.cellSize;
            const ty = (r + 0.5) * this.cellSize;
            this.laserBeams.push({
              x1: divanX,
              y1: divanY,
              x2: tx,
              y2: ty,
              color: '#fde047',
              alpha: 1,
              width: 5
            });
            if (transformToSpecial) {
              t.special =
                transformToSpecial === 'bomb'
                  ? 'bomb'
                  : Math.random() < 0.5
                  ? 'line_h'
                  : 'line_v';
            }
          }
        }
      }

      await this.sleep(280);
      for (const t of targets) {
        if (this.grid[t.r][t.c]) {
          await this.detonateOrClearCell(t.r, t.c);
        }
      }
      this.updateHUD();
      await this.sleep(240);
      return;
    }

    // Case 3: Two Line/Area Bombs swapped together (e.g. Line+Line, Line+Bomb, Bomb+Bomb)
    window.yaldaAudio.playAreaBoom();
    this.showBoardBanner('💥 انفجار ترکیبی یلدایی!');
    cell1.special = null;
    cell2.special = null;

    // Blast a 3-row & 3-column cross centered at cell2
    const cr = cell2.r;
    const cc = cell2.c;
    this.addShockwave(cx2, cy2, '#ff2e5b', this.cellSize * 3.5);

    for (let d = -1; d <= 1; d++) {
      const rr = cr + d;
      if (rr >= 0 && rr < this.gridSize) {
        this.laserBeams.push({
          x1: 0,
          y1: (rr + 0.5) * this.cellSize,
          x2: this.canvas.width,
          y2: (rr + 0.5) * this.cellSize,
          color: '#fef08a',
          alpha: 1,
          width: 14
        });
        for (let c = 0; c < this.gridSize; c++) {
          await this.hitCellWithExplosion(rr, c);
        }
      }
      const col = cc + d;
      if (col >= 0 && col < this.gridSize) {
        this.laserBeams.push({
          x1: (col + 0.5) * this.cellSize,
          y1: 0,
          x2: (col + 0.5) * this.cellSize,
          y2: this.canvas.height,
          color: '#fef08a',
          alpha: 1,
          width: 14
        });
        for (let r = 0; r < this.gridSize; r++) {
          await this.hitCellWithExplosion(r, col);
        }
      }
    }

    this.updateHUD();
    await this.sleep(260);
  }

  async detonateOrClearCell(r, c) {
    const cell = this.grid[r][c];
    if (!cell) return;

    if (cell.isBox) {
      this.damageBoxCell(r, c);
      return;
    }

    const special = cell.special;
    cell.special = null;

    if (!special) {
      this.collectAndClearCell(r, c);
      return;
    }

    this.bombsTriggered += 1;
    const cx = (c + 0.5) * this.cellSize;
    const cy = (r + 0.5) * this.cellSize;

    if (special === 'line_h') {
      // Blast entire row r
      window.yaldaAudio.playLineBlast();
      this.laserBeams.push({
        x1: 0,
        y1: cy,
        x2: this.canvas.width,
        y2: cy,
        color: '#fde047',
        alpha: 1,
        width: 18
      });
      this.collectAndClearCell(r, c, 'line');
      for (let col = 0; col < this.gridSize; col++) {
        if (col !== c) await this.hitCellWithExplosion(r, col);
      }
    } else if (special === 'line_v') {
      // Blast entire column c
      window.yaldaAudio.playLineBlast();
      this.laserBeams.push({
        x1: cx,
        y1: 0,
        x2: cx,
        y2: this.canvas.height,
        color: '#fde047',
        alpha: 1,
        width: 18
      });
      this.collectAndClearCell(r, c, 'line');
      for (let row = 0; row < this.gridSize; row++) {
        if (row !== r) await this.hitCellWithExplosion(row, c);
      }
    } else if (special === 'bomb') {
      // Pomegranate 3x3 Area Bomb
      window.yaldaAudio.playAreaBoom();
      this.addShockwave(cx, cy, '#ff2e5b', this.cellSize * 2.1);
      this.collectAndClearCell(r, c, 'bomb');
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr >= 0 && nr < this.gridSize && nc >= 0 && nc < this.gridSize) {
            await this.hitCellWithExplosion(nr, nc);
          }
        }
      }
    } else if (special === 'color') {
      // Zaps random most-common treat type on the board
      window.yaldaAudio.playColorDivan();
      const targetType = Math.floor(Math.random() * this.numTypes);
      this.collectAndClearCell(r, c, 'color');
      for (let row = 0; row < this.gridSize; row++) {
        for (let col = 0; col < this.gridSize; col++) {
          const t = this.grid[row][col];
          if (t && !t.isBox && t.type === targetType) {
            await this.hitCellWithExplosion(row, col);
          }
        }
      }
    }
  }

  async hitCellWithExplosion(r, c) {
    const cell = this.grid[r][c];
    if (!cell) return;
    if (cell.isBox) {
      this.damageBoxCell(r, c);
      return;
    }
    if (cell.special) {
      await this.detonateOrClearCell(r, c);
    } else {
      this.collectAndClearCell(r, c, 'blast');
    }
  }

  damageIceOnCell(cell) {
    if (!cell || cell.ice <= 0) return;
    cell.ice -= 1;
    window.yaldaAudio.playIceBreak();
    const cx = (cell.c + 0.5) * this.cellSize;
    const cy = (cell.r + 0.5) * this.cellSize;
    this.spawnParticles(cx, cy, '#7dd3fc', 10);

    // If ice layer reached 0, count toward 'ice' objective
    if (cell.ice === 0) {
      this.objectives.forEach((obj) => {
        if (obj.type === 'ice' && obj.current < obj.count) {
          obj.current += 1;
        }
      });
      this.score += 120;
      this.addFloatingText(cx, cy - 10, '❄️ یخ شکست!', '#7dd3fc');
    }
  }

  damageBoxCell(r, c) {
    const cell = this.grid[r][c];
    if (!cell || !cell.isBox) return;
    window.yaldaAudio.playBoxBreak();

    const cx = (c + 0.5) * this.cellSize;
    const cy = (r + 0.5) * this.cellSize;
    this.spawnParticles(cx, cy, '#f5c542', 14);
    this.addFloatingText(cx, cy, '🎁 +۱۵۰', '#fde047');

    this.score += 150;
    this.objectives.forEach((obj) => {
      if (obj.type === 'box' && obj.current < obj.count) {
        obj.current += 1;
      }
    });

    this.grid[r][c] = null;
  }

  collectAndClearCell(r, c, reason = 'match') {
    const cell = this.grid[r][c];
    if (!cell || cell.isBox) return;

    const cx = (c + 0.5) * this.cellSize;
    const cy = (r + 0.5) * this.cellSize;

    // Damage ice if present
    if (cell.ice > 0) {
      this.damageIceOnCell(cell);
      // If 1 layer of ice still remains (from 2-layer ice), don't remove the treat underneath yet!
      if (cell.ice > 0) {
        return;
      }
    }

    const treat = window.YALDA_TREATS[cell.type] || window.YALDA_TREATS[0];
    this.spawnParticles(cx, cy, treat.color, 11);

    const pts = Math.round((reason === 'match' ? 60 : 90) * Math.max(1, this.combo * 0.8));
    this.score += pts;

    if (Math.random() < 0.45 || reason !== 'match') {
      this.addFloatingText(cx, cy, `+${toFa(pts)}`, treat.glow);
    }

    // Update treat collection objective
    this.objectives.forEach((obj) => {
      if (obj.type === 'item' && obj.itemId === cell.type && obj.current < obj.count) {
        obj.current += 1;
      }
    });

    this.grid[r][c] = null;
  }

  /**
   * Gravity Cascade: drops treats into empty cells below and spawns new treats from top
   */
  async applyGravityAndCascade() {
    const N = this.gridSize;

    for (let c = 0; c < N; c++) {
      let writeRow = N - 1;
      for (let r = N - 1; r >= 0; r--) {
        const cell = this.grid[r][c];
        if (!cell) continue;
        if (cell.isBox) {
          // Immovable box acts as a floor for tiles above it
          writeRow = r - 1;
          continue;
        }
        if (r !== writeRow) {
          this.grid[writeRow][c] = cell;
          this.grid[r][c] = null;
          cell.r = writeRow;
          cell.c = c;
        }
        writeRow--;
      }

      // Fill remaining empty slots above the top-most blocker with fresh treats
      for (let r = writeRow; r >= 0; r--) {
        if (!this.grid[r][c]) {
          const type = Math.floor(Math.random() * this.numTypes);
          this.grid[r][c] = {
            r,
            c,
            type,
            isBox: false,
            ice: 0,
            special: null,
            x: (c + 0.5) * this.cellSize,
            y: -((writeRow - r + 1) * this.cellSize),
            scale: 1
          };
        }
      }
    }

    await this.sleep(250);
  }

  /**
   * Finds a valid move pair for the auto-hint & deadlock system
   */
  findValidMove() {
    const N = this.gridSize;
    if (!this.grid || this.grid.length < N) return null;
    for (let r = 0; r < N; r++) {
      if (!this.grid[r]) continue;
      for (let c = 0; c < N; c++) {
        const cell = this.grid[r][c];
        if (!cell || cell.isBox) continue;

        const neighbors = [
          [r, c + 1],
          [r + 1, c]
        ];
        for (const [nr, nc] of neighbors) {
          if (nr >= N || nc >= N) continue;
          const nCell = this.grid[nr][nc];
          if (!nCell || nCell.isBox) continue;

          if (cell.special === 'color' || nCell.special === 'color' || (cell.special && nCell.special)) {
            return [{ r, c }, { r: nr, c: nc }];
          }

          this.swapGridCells(r, c, nr, nc);
          const hasMatch = this.findAllMatchGroups().length > 0;
          this.swapGridCells(r, c, nr, nc);
          if (hasMatch) {
            return [{ r, c }, { r: nr, c: nc }];
          }
        }
      }
    }
    return null;
  }

  areAllObjectivesComplete() {
    return this.objectives.every((obj) => obj.current >= obj.count);
  }

  async checkEndOfTurnConditions() {
    this.updateHUD();

    if (this.areAllObjectivesComplete()) {
      this.gameEnded = true;
      await this.handleLevelVictory();
      return;
    }

    if (this.movesLeft <= 0) {
      this.gameEnded = true;
      this.handleLevelDefeat();
      return;
    }

    // Deadlock check: if no valid moves remain, auto-shuffle the board!
    if (!this.findValidMove()) {
      this.shuffleBoardTiles(true);
    }
  }

  async handleLevelVictory() {
    this.isBusy = true;
    window.yaldaAudio.playVictory();

    // Bonus Sugar-Crush style Yalda Celebration for remaining moves!
    if (this.movesLeft > 0) {
      this.showBoardBanner(`✨ جشن پایان مرحله! +${toFa(this.movesLeft * 200)} امتیاز`);
      while (this.movesLeft > 0) {
        this.movesLeft -= 1;
        this.score += 200;
        const rr = Math.floor(Math.random() * this.gridSize);
        const rc = Math.floor(Math.random() * this.gridSize);
        const cx = (rc + 0.5) * this.cellSize;
        const cy = (rr + 0.5) * this.cellSize;
        this.spawnParticles(cx, cy, '#fde047', 12);
        this.addFloatingText(cx, cy, '+۲۰۰', '#fde047');
        this.updateHUD();
        await this.sleep(110);
      }
    }

    // Calculate earned stars (1 to 3)
    let stars = 1;
    if (this.score >= this.starThresholds[2]) stars = 3;
    else if (this.score >= this.starThresholds[1]) stars = 2;

    // Update persistent Saga progress
    if (this.mode === 'saga') {
      const lvlId = this.currentLevelConfig.id;
      this.state.levelStars[lvlId] = Math.max(this.state.levelStars[lvlId] || 0, stars);
      this.state.levelHighScores[lvlId] = Math.max(this.state.levelHighScores[lvlId] || 0, this.score);
      if (lvlId >= this.state.unlockedLevel && lvlId < window.YALDA_LEVELS.length) {
        this.state.unlockedLevel = lvlId + 1;
      }
    }

    const rewardCoins = stars * 15 + (this.mode === 'daily' ? 30 : 0);
    this.state.coins += rewardCoins;
    this.savePlayerState();

    // Populate Victory Modal
    const starEls = document.querySelectorAll('#victory-stars .v-star');
    starEls.forEach((el, idx) => {
      if (idx < stars) el.classList.add('earned');
      else el.classList.remove('earned');
    });

    document.getElementById('victory-title').textContent =
      this.mode === 'daily' ? '⚡ چالش روزانه لبه فتح شد!' : `🎉 مرحله ${toFa(this.currentLevelConfig.id)} کامل شد!`;
    document.getElementById('victory-score').textContent = toFa(this.score);
    document.getElementById('victory-coins').textContent = `+${toFa(rewardCoins)} 🪙`;

    const nextBtn = document.getElementById('btn-next-level');
    if (this.mode === 'daily' || this.currentLevelConfig.id >= window.YALDA_LEVELS.length) {
      nextBtn.textContent = '🗺️ بازگشت به نقشه';
    } else {
      nextBtn.textContent = `⏭️ مرحله ${toFa(this.currentLevelConfig.id + 1)}`;
    }

    this.openModal('modal-victory');

    // Submit score to Arvan Edge Compute API for anti-cheat verification & Leaderboard update
    await this.submitScoreToEdge(stars);
    this.isBusy = false;
  }

  async submitScoreToEdge(stars) {
    const checksList = document.getElementById('edge-checks-list');
    const tokenEl = document.getElementById('edge-ver-token');
    const rankEl = document.getElementById('victory-rank');

    checksList.innerHTML = '<li>در حال اعتبارسنجی امتیاز روی پردازش لبه آروان‌کلاد...</li>';

    try {
      const payload = {
        playerName: this.state.playerName,
        mode: this.mode,
        levelId: this.currentLevelConfig.id,
        score: this.score,
        stars,
        totalStars: this.getTotalStars(),
        totalScore: this.getTotalSagaScore(),
        maxLevel: this.state.unlockedLevel,
        movesUsed: Math.max(1, this.movesUsed),
        movesLeft: this.movesLeft,
        cascades: this.totalCascades,
        bombsTriggered: this.bombsTriggered,
        sessionId: this.edgeSession ? this.edgeSession.sessionId : '',
        startedAt: this.edgeSession ? this.edgeSession.startedAt : 0,
        signature: this.edgeSession ? this.edgeSession.signature : ''
      };

      const res = await fetch('/api/submit-score', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();

      tokenEl.textContent = data.verificationToken || 'EDGE-OK';
      rankEl.textContent = `#${toFa(data.rank || 1)}`;
      checksList.innerHTML = (data.checks || [])
        .map((c) => `<li>${c}</li>`)
        .join('');
    } catch (e) {
      tokenEl.textContent = 'LOCAL-OK';
      rankEl.textContent = '#۱';
      checksList.innerHTML = '<li>امتیاز با موفقیت ذخیره شد</li>';
    }
  }

  handleLevelDefeat() {
    window.yaldaAudio.playInvalid();
    const listEl = document.getElementById('defeat-targets-list');
    listEl.innerHTML = '';
    this.objectives.forEach((obj) => {
      const done = obj.current >= obj.count;
      const chip = document.createElement('div');
      chip.className = `obj-chip ${done ? 'completed' : ''}`;
      chip.innerHTML = `
        <span class="obj-icon">${this.getObjectiveIcon(obj)}</span>
        <span>${toFa(obj.current)} / ${toFa(obj.count)} ${obj.label}</span>
      `;
      listEl.appendChild(chip);
    });
    this.openModal('modal-defeat');
  }

  /**
   * Fal-e Hafez & Leaderboard Modals
   */
  async openFalModal() {
    window.yaldaAudio.playFalChord();
    this.openModal('modal-fal');

    try {
      const res = await fetch('/api/fal');
      const fal = await res.json();
      this.currentFal = fal;
      document.getElementById('fal-ghazal-title').textContent = fal.title;
      document.getElementById('fal-poem').innerHTML = (fal.poem || [])
        .map((line) => `<div>${line}</div>`)
        .join('');
      document.getElementById('fal-interp-text').textContent = fal.interpretation;
      document.getElementById('fal-lucky-treat').textContent = `شگون امشب: ${fal.luckyTreat}`;
      document.getElementById('fal-bonus-hint').textContent = `💡 ${fal.bonusHint}`;
    } catch (e) {
      // Fallback
    }
  }

  shareCurrentFal() {
    if (!this.currentFal) return;
    const text = `📜 فال حافظ شب یلدا در بازی «سفره یلدا»:\n\n${this.currentFal.poem.join('\n')}\n\n✨ تفسیر: ${this.currentFal.interpretation}\n🍉 ${window.location.href}`;
    this.copyOrShareText(text, 'متن فال حافظ کپی شد! برای دوستانتان بفرستید 🍉');
  }

  shareVictoryRecord() {
    const lvlTitle = this.currentLevelConfig ? this.currentLevelConfig.title : 'سفره یلدا';
    const text = `🍉 من در بازی «سفره یلدا» (پردازش لبه آروان‌کلاد) مرحله «${lvlTitle}» را با امتیاز ${toFa(this.score)} و مجموع ${toFa(this.getTotalStars())}⭐ فتح کردم!\nتو هم بیا رکوردت رو ثبت کن:\n${window.location.href}`;
    this.copyOrShareText(text, 'رکورد شما کپی شد! با دوستانتان به اشتراک بگذارید 🏆');
  }

  copyOrShareText(text, toastMsg) {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(() => this.showToast(toastMsg));
    } else {
      this.showToast(toastMsg);
    }
  }

  async openLeaderboardModal(tab = 'saga') {
    this.activeLbTab = tab;
    document.getElementById('input-player-name').value = this.state.playerName;
    this.openModal('modal-leaderboard');
    await this.switchLeaderboardTab(tab);
  }

  async switchLeaderboardTab(tab) {
    this.activeLbTab = tab;
    document.getElementById('tab-lb-saga').classList.toggle('active', tab === 'saga');
    document.getElementById('tab-lb-daily').classList.toggle('active', tab === 'daily');

    const container = document.getElementById('lb-list-container');
    container.innerHTML = '<div style="text-align:center;padding:18px;">در حال دریافت جدول رده‌بندی از نود لبه آروان...</div>';

    try {
      const res = await fetch('/api/leaderboard');
      const data = await res.json();
      const rows = tab === 'daily' ? data.dailyLeaderboard : data.sagaLeaderboard;

      container.innerHTML = '';
      (rows || []).forEach((item, idx) => {
        const isMe = item.name === this.state.playerName;
        const rowEl = document.createElement('div');
        rowEl.className = `lb-row ${isMe ? 'is-player' : ''}`;

        const rankMedal = idx === 0 ? '🥇' : idx === 1 ? '🥈' : idx === 2 ? '🥉' : `#${toFa(idx + 1)}`;
        const rightMeta =
          tab === 'daily'
            ? `${toFa(item.score)} امتیاز (${toFa(item.stars)}⭐)`
            : `${toFa(item.stars)}⭐ | ${toFa(item.score)} امتیاز`;

        rowEl.innerHTML = `
          <span class="lb-rank">${rankMedal}</span>
          <div class="lb-player-info">
            <strong>${item.name}</strong>
            ${item.badge ? `<span class="lb-badge">${item.badge}</span>` : ''}
          </div>
          <span class="lb-score-col">${rightMeta}</span>
        `;
        container.appendChild(rowEl);
      });
    } catch (e) {
      container.innerHTML = '<div style="text-align:center;padding:18px;">خطا در ارتباط با سرور لبه</div>';
    }
  }

  /**
   * Visual FX Helpers & 60fps Canvas Render Loop
   */
  spawnParticles(x, y, color, count = 10) {
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.6 + Math.random() * 4.5;
      this.particles.push({
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        r: 3 + Math.random() * 4.5,
        color,
        alpha: 1
      });
    }
  }

  addFloatingText(x, y, text, color = '#fef08a') {
    this.floatingTexts.push({
      x,
      y,
      text,
      color,
      alpha: 1,
      vy: -1.3
    });
  }

  addShockwave(x, y, color, maxR) {
    this.shockwaves.push({
      x,
      y,
      r: 8,
      maxR,
      color,
      alpha: 0.9
    });
  }

  sleep(ms) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  loop(now) {
    requestAnimationFrame((t) => this.loop(t));
    const dt = Math.min(0.05, (now - this.lastFrameTime) / 1000);
    this.lastFrameTime = now;
    this.renderer.time += dt;

    // Auto-hint check after 4.5s of inactivity (only when a board is active)
    if (
      this.grid &&
      this.grid.length === this.gridSize &&
      !this.isBusy &&
      !this.gameEnded &&
      !this.hintPair &&
      now - this.lastActionTime > 4500
    ) {
      this.hintPair = this.findValidMove();
    }

    this.drawBoard(dt);
  }

  drawBoard(dt) {
    const ctx = this.renderer.ctx;
    const W = this.canvas.width;
    const H = this.canvas.height;
    ctx.clearRect(0, 0, W, H);

    if (!this.grid || this.grid.length === 0) return;

    const N = this.gridSize;
    const cs = this.cellSize;

    // 1. Draw subtle Persian Gereh-Chini checkerboard grid cells
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const isEven = (r + c) % 2 === 0;
        ctx.fillStyle = isEven ? 'rgba(56, 14, 42, 0.72)' : 'rgba(36, 8, 28, 0.72)';
        ctx.strokeStyle = 'rgba(245, 197, 66, 0.14)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.roundRect(c * cs + 3, r * cs + 3, cs - 6, cs - 6, 12);
        ctx.fill();
        ctx.stroke();
      }
    }

    // 2. Highlight Selected Cell & Auto-Hint Cells
    if (this.selectedCell) {
      const { r, c } = this.selectedCell;
      ctx.save();
      ctx.strokeStyle = '#fde047';
      ctx.lineWidth = 3.5;
      ctx.shadowColor = '#f59e0b';
      ctx.shadowBlur = 12;
      ctx.beginPath();
      ctx.roundRect(c * cs + 4, r * cs + 4, cs - 8, cs - 8, 13);
      ctx.stroke();
      ctx.restore();
    } else if (this.hintPair) {
      const pulse = 0.45 + 0.45 * Math.sin(this.renderer.time * 6);
      ctx.save();
      ctx.strokeStyle = `rgba(110, 231, 183, ${pulse})`;
      ctx.lineWidth = 3;
      this.hintPair.forEach(({ r, c }) => {
        ctx.beginPath();
        ctx.roundRect(c * cs + 5, r * cs + 5, cs - 10, cs - 10, 12);
        ctx.stroke();
      });
      ctx.restore();
    }

    // 3. Draw Grid Contents (Treats, Special Bombs, Sweet Boxes, and Winter Frost Overlays)
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const cell = this.grid[r][c];
        if (!cell) continue;

        const targetX = (c + 0.5) * cs;
        const targetY = (r + 0.5) * cs;

        // Smooth spring interpolation toward target grid position
        cell.x += (targetX - cell.x) * Math.min(1, dt * 18);
        cell.y += (targetY - cell.y) * Math.min(1, dt * 18);
        cell.scale += (1 - cell.scale) * Math.min(1, dt * 14);

        if (cell.isBox) {
          this.renderer.drawSweetBox(ctx, cell.x, cell.y, cs);
        } else {
          const radius = cs * 0.41 * cell.scale;
          this.renderer.drawTreat(ctx, cell.type, cell.x, cell.y, radius, cell.special, this.renderer.time);
          if (cell.ice > 0) {
            this.renderer.drawIceOverlay(ctx, cell.x, cell.y, cs, cell.ice);
          }
        }
      }
    }

    // 4. Draw Laser Beams (from Line Blasters & Hafez Divan Color Bomb)
    for (let i = this.laserBeams.length - 1; i >= 0; i--) {
      const b = this.laserBeams[i];
      ctx.save();
      ctx.strokeStyle = b.color;
      ctx.globalAlpha = b.alpha;
      ctx.lineWidth = b.width;
      ctx.lineCap = 'round';
      ctx.shadowColor = b.color;
      ctx.shadowBlur = 16;
      ctx.beginPath();
      ctx.moveTo(b.x1, b.y1);
      ctx.lineTo(b.x2, b.y2);
      ctx.stroke();
      ctx.restore();

      b.alpha -= dt * 3.2;
      b.width *= 0.96;
      if (b.alpha <= 0) this.laserBeams.splice(i, 1);
    }

    // 5. Draw Shockwaves
    for (let i = this.shockwaves.length - 1; i >= 0; i--) {
      const sw = this.shockwaves[i];
      ctx.save();
      ctx.strokeStyle = sw.color;
      ctx.globalAlpha = sw.alpha;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(sw.x, sw.y, sw.r, 0, Math.PI * 2);
      ctx.stroke();
      ctx.restore();

      sw.r += (sw.maxR - sw.r) * dt * 10;
      sw.alpha -= dt * 2.8;
      if (sw.alpha <= 0) this.shockwaves.splice(i, 1);
    }

    // 6. Draw Juicy Particles
    for (let i = this.particles.length - 1; i >= 0; i--) {
      const p = this.particles[i];
      ctx.save();
      ctx.fillStyle = p.color;
      ctx.globalAlpha = p.alpha;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
      ctx.fill();
      ctx.restore();

      p.x += p.vx;
      p.y += p.vy;
      p.vy += 0.16; // Gravity
      p.alpha -= dt * 1.9;
      if (p.alpha <= 0) this.particles.splice(i, 1);
    }

    // 7. Draw Floating Persian Score & Combo Popups
    for (let i = this.floatingTexts.length - 1; i >= 0; i--) {
      const ft = this.floatingTexts[i];
      ctx.save();
      ctx.font = '900 18px Vazirmatn, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillStyle = ft.color;
      ctx.globalAlpha = ft.alpha;
      ctx.shadowColor = '#000000';
      ctx.shadowBlur = 6;
      ctx.fillText(ft.text, ft.x, ft.y);
      ctx.restore();

      ft.y += ft.vy;
      ft.alpha -= dt * 1.15;
      if (ft.alpha <= 0) this.floatingTexts.splice(i, 1);
    }
  }
}

window.addEventListener('DOMContentLoaded', () => {
  window.sofrehGame = new SofrehYaldaGame();
});
