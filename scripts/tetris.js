(() => {
  const W = 10, H = 20, TILE = 30; // canvas size set in HTML (300x600)
  const GRAVITY_START_MS = 800;
  const GRAVITY_MIN_MS = 80;

  const $ = sel => document.querySelector(sel);
  const boardCanvas = $('#board');
  const nextCanvas = $('#next');
  const holdCanvas = $('#hold');
  const ctx = boardCanvas.getContext('2d');
  const nextCtx = nextCanvas.getContext('2d');
  const holdCtx = holdCanvas.getContext('2d');

  const scoreEl = $('#score'), levelEl = $('#level'), linesEl = $('#lines'), bestEl = $('#best');
  const startBtn = $('#startBtn'), pauseBtn = $('#pauseBtn'), resetBtn = $('#resetBtn');
  const themeSelect = $('#themeSelect'), themeFile = $('#themeFile'), loadThemeBtn = $('#loadThemeBtn'), applyThemeBtn = $('#applyThemeBtn');

  // Shapes
  const SHAPES = {
    I:[[0,0,0,0],[1,1,1,1],[0,0,0,0],[0,0,0,0]],
    J:[[1,0,0],[1,1,1],[0,0,0]],
    L:[[0,0,1],[1,1,1],[0,0,0]],
    O:[[1,1],[1,1]],
    S:[[0,1,1],[1,1,0],[0,0,0]],
    Z:[[1,1,0],[0,1,1],[0,0,0]],
    T:[[0,1,0],[1,1,1],[0,0,0]],
  };
  const PIECES = Object.keys(SHAPES);

  // Theme system
  const imageCache = {}; // {I: HTMLImageElement, ...}
  const DEFAULT_THEME = {
    name: 'classic',
    colors: {
      bg: getCss('--tetris-bg'),
      panel: getCss('--tetris-panel'),
      board: getCss('--tetris-board'),
      grid: getCss('--tetris-grid'),
      text: getCss('--tetris-text'),
      ghost: getCss('--tetris-ghost'),
      outline: getCss('--tetris-outline'),
    },
    pieces: {
      I: getCss('--piece-I') || '#00f0f0',
      J: getCss('--piece-J') || '#4169e1',
      L: getCss('--piece-L') || '#f0a000',
      O: getCss('--piece-O') || '#f0e000',
      S: getCss('--piece-S') || '#00d070',
      Z: getCss('--piece-Z') || '#e14b4b',
      T: getCss('--piece-T') || '#b060f0',
    },
    ghost: getCss('--tetris-ghost') || 'rgba(255,255,255,0.28)',
    outline: getCss('--tetris-outline') || 'rgba(0,0,0,0.24)',
    images: {
      // optional: per-piece { I:'url.png', O:'sprite.svg', ... }
    },
    sounds: {
      // optional: { move:'url', rotate:'url', drop:'url', line:'url', gameOver:'url' }
    }
  };
  const BUILT_THEMES = {
    neon: { name:'neon' },
    pastel: { name:'pastel' },
    mono: { name:'mono' },
  };

  function getCss(name){
    return getComputedStyle(document.documentElement).getPropertyValue(name).trim();
  }
  function mergeTheme(base, override){
    const out = JSON.parse(JSON.stringify(base));
    if (!override) return out;
    for (const k of Object.keys(override)){
      if (typeof override[k] === 'object' && override[k] && !Array.isArray(override[k])){
        out[k] = mergeTheme(out[k] || {}, override[k]);
      } else {
        out[k] = override[k];
      }
    }
    return out;
  }

  let THEME = DEFAULT_THEME;

  async function applyTheme(themeLike){
    // If themeLike matches a built-in name, set data-theme for CSS vars
    if (typeof themeLike === 'string' && BUILT_THEMES[themeLike]){
      document.body.setAttribute('data-theme', themeLike);
    } else if (themeLike && themeLike.name && BUILT_THEMES[themeLike.name]){
      document.body.setAttribute('data-theme', themeLike.name);
    } else if (!themeLike){
      document.body.removeAttribute('data-theme');
    }

    // Re-read CSS variables after potentially changing data-theme
    const cssVars = {
      colors:{
        bg: getCss('--tetris-bg'),
        panel: getCss('--tetris-panel'),
        board: getCss('--tetris-board'),
        grid: getCss('--tetris-grid'),
        text: getCss('--tetris-text'),
        ghost: getCss('--tetris-ghost'),
        outline: getCss('--tetris-outline'),
      },
      pieces:{
        I: getCss('--piece-I'),
        J: getCss('--piece-J'),
        L: getCss('--piece-L'),
        O: getCss('--piece-O'),
        S: getCss('--piece-S'),
        Z: getCss('--piece-Z'),
        T: getCss('--piece-T'),
      }
    };
    const merged = mergeTheme(DEFAULT_THEME, cssVars);
    THEME = mergeTheme(merged, typeof themeLike === 'string' ? {} : (themeLike || {}));

    // Preload images if provided
    await preloadImages(THEME.images || {});
    redrawAll();
  }

  function preloadImages(map){
    const entries = Object.entries(map || {});
    return Promise.all(entries.map(([k, url]) => new Promise((resolve)=>{
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = ()=>{ imageCache[k]=img; resolve(); };
      img.onerror = ()=>resolve(); // ignore
      img.src = url;
    })));
  }

  // Public helpers to set theme from outside
  window.applyTetrisTheme = async function(obj){ await applyTheme(obj); };
  window.loadTetrisThemeFromUrl = async function(url){
    const res = await fetch(url);
    const json = await res.json();
    await applyTheme(json);
  };

  // Sounds (optional)
  const audio = {};
  function playSnd(name){
    const url = THEME?.sounds?.[name];
    if (!url) return;
    if (!audio[name]) audio[name] = new Audio(url);
    try { audio[name].currentTime = 0; audio[name].play(); } catch {}
  }

  // Game state
  let board = createMatrix(W, H);
  let score = 0, level = 1, lines = 0, best = +(localStorage.getItem('tetris:best')||0);
  bestEl.textContent = best;

  let bag = [];
  let holdPiece = null;
  let canHold = true;

  let piece = null;
  let nextPiece = randomPiece();
  let dropTimer = 0;
  let dropInterval = GRAVITY_START_MS;
  let running = false;
  let paused = false;
  let lastT = 0;
  let rafId;

  function createMatrix(w,h){ return Array.from({length:h},()=>Array(w).fill(null)); }
  function randomPiece(){
    if (bag.length === 0){
      bag = shuffle([...PIECES, ...PIECES]); // 14 to smooth randomness a bit
    }
    const type = bag.pop();
    return makePiece(type);
  }
  function shuffle(a){ for(let i=a.length-1;i>0;i--){const j=(Math.random()* (i+1))|0; [a[i],a[j]]=[a[j],a[i]];} return a; }
  function makePiece(type){
    const shape = SHAPES[type].map(r=>r.slice());
    return {
      type, shape,
      x: Math.floor((W - shape[0].length)/2),
      y: -getTopInset(shape),
    };
  }
  function getTopInset(shape){ for(let y=0;y<shape.length;y++){ if (shape[y].some(v=>v)) return y; } return 0; }

  function rotate(shape, dir){
    // dir: +1 clockwise, -1 counter-clockwise
    const n = shape.length, m = shape[0].length;
    const out = Array.from({length:m},()=>Array(n).fill(0));
    if (dir > 0){
      // CW: (x,y) -> (y, n-1-x)
      for (let y=0;y<n;y++) for (let x=0;x<m;x++) out[x][n-1-y] = shape[y][x];
    } else {
      // CCW: (x,y) -> (m-1-x, y)
      for (let y=0;y<n;y++) for (let x=0;x<m;x++) out[m-1-x][y] = shape[y][x];
    }
    return out;
  }

  function collide(b, p){
    for(let y=0;y<p.shape.length;y++){
      for(let x=0;x<p.shape[y].length;x++){
        if (!p.shape[y][x]) continue;
        const bx = p.x + x, by = p.y + y;
        if (by<0) continue;
        if (bx<0 || bx>=W || by>=H) return true;
        if (b[by][bx]) return true;
      }
    }
    return false;
  }

  function merge(b,p){
    for(let y=0;y<p.shape.length;y++){
      for(let x=0;x<p.shape[y].length;x++){
        if (p.shape[y][x]){
          const by = p.y + y, bx = p.x + x;
          if (by>=0) b[by][bx] = p.type;
        }
      }
    }
  }

  function clearLines(){
    let cleared = 0;
    outer: for(let y=H-1;y>=0;y--){
      for(let x=0;x<W;x++){ if (!board[y][x]) { continue outer; } }
      // full line
      const row = board.splice(y,1)[0].fill(null);
      board.unshift(row);
      cleared++;
      y++;
    }
    if (cleared){
      const add = [0,40,100,300,1200][cleared] * Math.max(1, level);
      score += add;
      lines += cleared;
      level = 1 + Math.floor(lines / 10);
      dropInterval = Math.max(GRAVITY_MIN_MS, GRAVITY_START_MS - (level-1)*60);
      playSnd('line');
      updateStats();
    }
  }

  function hardDrop(){
    if (!piece) return;
    let dy = 0;
    while(!collide(board, {...piece, y:piece.y+dy+1})) dy++;
    piece.y += dy;
    tickDown(true);
    playSnd('drop');
  }

  function tickDown(force=false){
    if (!piece) return;
    const next = {...piece, y: piece.y + 1};
    if (!collide(board, next)){
      piece = next;
    } else {
      // lock
      merge(board, piece);
      playSnd('drop');
      clearLines();
      canHold = true;
      piece = nextPiece;
      nextPiece = randomPiece();
      if (collide(board, piece)){
        // game over
        running = false;
        playSnd('gameOver');
        saveBest();
      }
    }
    redrawAll();
  }

  function saveBest(){
    if (score > best){ best = score; localStorage.setItem('tetris:best', String(best)); bestEl.textContent = best; }
  }
  function updateStats(){
    scoreEl.textContent = score;
    levelEl.textContent = level;
    linesEl.textContent = lines;
    bestEl.textContent = best;
  }

  // Drawing
  function clearCanvas(c2d){ c2d.clearRect(0,0,c2d.canvas.width,c2d.canvas.height); }
  function drawBoard(){
    clearCanvas(ctx);
    // grid
    const grid = THEME.colors.grid || 'rgba(255,255,255,0.06)';
    ctx.save();
    for(let x=0;x<=W;x++){
      ctx.strokeStyle = grid;
      ctx.beginPath();
      ctx.moveTo(x*TILE+0.5,0);
      ctx.lineTo(x*TILE+0.5,H*TILE);
      ctx.stroke();
    }
    for(let y=0;y<=H;y++){
      ctx.strokeStyle = grid;
      ctx.beginPath();
      ctx.moveTo(0,y*TILE+0.5);
      ctx.lineTo(W*TILE,y*TILE+0.5);
      ctx.stroke();
    }
    ctx.restore();

    // settled blocks
    for(let y=0;y<H;y++){
      for(let x=0;x<W;x++){
        const t = board[y][x];
        if (t) drawCell(ctx, x, y, t, 1);
      }
    }

    // ghost
    if (piece){
      let g = {...piece};
      while(!collide(board, {...g, y:g.y+1})) g.y++;
      drawPiece(g, 0.35, true);
    }
    // active
    if (piece) drawPiece(piece, 1, false);
  }

  function drawPiece(p, alpha=1, ghost=false){
    for(let y=0;y<p.shape.length;y++){
      for(let x=0;x<p.shape[y].length;x++){
        if (!p.shape[y][x]) continue;
        const bx = p.x + x, by = p.y + y;
        if (by<0) continue;
        drawCell(ctx, bx, by, p.type, alpha, ghost);
      }
    }
  }

  function drawCell(c2d, x, y, type, alpha=1, ghost=false){
    const px = x*TILE, py = y*TILE;
    c2d.save();
    c2d.globalAlpha = alpha;
    const img = imageCache[type];
    if (img && !ghost){
      // draw image padded to tile
      c2d.drawImage(img, px, py, TILE, TILE);
    } else {
      const col = ghost ? (THEME.ghost || 'rgba(255,255,255,0.28)') : (THEME.pieces?.[type] || '#fff');
      c2d.fillStyle = col;
      c2d.fillRect(px, py, TILE, TILE);
      // bevel
      if (!ghost){
        c2d.fillStyle = 'rgba(255,255,255,0.18)';
        c2d.fillRect(px, py, TILE, 5);
        c2d.fillStyle = THEME.outline || 'rgba(0,0,0,0.24)';
        c2d.fillRect(px, py+TILE-4, TILE, 4);
      }
      // outline
      c2d.strokeStyle = THEME.outline || 'rgba(0,0,0,0.24)';
      c2d.strokeRect(px+0.5, py+0.5, TILE-1, TILE-1);
    }
    c2d.restore();
  }

  function drawMini(ctx2d, p){
    clearCanvas(ctx2d);
    if (!p) return;
    // center the piece
    const block = 24;
    const pad = 6;
    const w = ctx2d.canvas.width, h = ctx2d.canvas.height;
    // compute piece rect
    const rows = p.shape.length, cols = p.shape[0].length;
    const px = Math.floor((w - cols*block)/2);
    const py = Math.floor((h - rows*block)/2);
    for(let y=0;y<rows;y++){
      for(let x=0;x<cols;x++){
        if (!p.shape[y][x]) continue;
        const img = imageCache[p.type];
        ctx2d.save();
        if (img){
          ctx2d.drawImage(img, px + x*block, py + y*block, block, block);
        } else {
          ctx2d.fillStyle = THEME.pieces?.[p.type] || '#fff';
          ctx2d.fillRect(px + x*block, py + y*block, block, block);
          ctx2d.strokeStyle = THEME.outline || 'rgba(0,0,0,0.24)';
          ctx2d.strokeRect(px + x*block+0.5, py + y*block+0.5, block-1, block-1);
        }
        ctx2d.restore();
      }
    }
  }

  function redrawAll(){
    drawBoard();
    drawMini(nextCtx, nextPiece);
    drawMini(holdCtx, holdPiece);
    updateStats();
  }

  // Input
  document.addEventListener('keydown', (e)=>{
    if (!running || paused) {
      if (e.key.toLowerCase()==='p'){ togglePause(); }
      return;
    }
    switch(e.key){
      case 'ArrowLeft': move(-1); e.preventDefault(); break;
      case 'ArrowRight': move(1); e.preventDefault(); break;
      case 'ArrowDown': softDrop(); e.preventDefault(); break;
      case ' ': hardDrop(); e.preventDefault(); break;
      case 'z': case 'Z': rotatePiece(-1); e.preventDefault(); break;
      case 'x': case 'X': rotatePiece(1); e.preventDefault(); break;
      case 'c': case 'C': holdSwap(); e.preventDefault(); break;
      case 'p': case 'P': togglePause(); e.preventDefault(); break;
    }
  });

  function move(dir){
    if (!piece) return;
    const next = {...piece, x: piece.x + dir};
    if (!collide(board, next)){ piece = next; playSnd('move'); redrawAll(); }
  }
  function softDrop(){
    if (!piece) return;
    const next = {...piece, y: piece.y + 1};
    if (!collide(board, next)){ piece = next; score += 1; redrawAll(); }
  }
  function rotatePiece(dir){
    if (!piece) return;
    const rotated = rotate(piece.shape, dir);
    const trial = {...piece, shape: rotated};
    // basic wall-kick
    const kicks = [0,-1,1,-2,2];
    for(const dx of kicks){
      const cand = {...trial, x: piece.x + dx};
      if (!collide(board, cand)){ piece = cand; playSnd('rotate'); redrawAll(); return; }
    }
  }
  function holdSwap(){
    if (!piece || !canHold) return;
    playSnd('move');
    if (!holdPiece){
      holdPiece = makePiece(piece.type);
      piece = nextPiece;
      nextPiece = randomPiece();
    } else {
      const t = holdPiece;
      holdPiece = makePiece(piece.type);
      piece = makePiece(t.type);
    }
    canHold = false;
    redrawAll();
  }

  // Loop
  function loop(ts){
    if (!running || paused){ lastT = ts; rafId = requestAnimationFrame(loop); return; }
    const dt = ts - lastT;
    lastT = ts;
    dropTimer += dt;
    if (dropTimer >= dropInterval){
      dropTimer = 0;
      tickDown();
    }
    rafId = requestAnimationFrame(loop);
  }

  // Buttons
  startBtn.addEventListener('click', startGame);
  pauseBtn.addEventListener('click', togglePause);
  resetBtn.addEventListener('click', resetGame);
  loadThemeBtn.addEventListener('click', async ()=>{
    const f = themeFile.files && themeFile.files[0];
    if (!f) return;
    try {
      const text = await f.text();
      const obj = JSON.parse(text);
      await applyTheme(obj);
    } catch {}
  });
  applyThemeBtn.addEventListener('click', async ()=>{
    const val = themeSelect.value || '';
    await applyTheme(val || null);
  });

  function startGame(){
    if (!running){
      initRound();
      running = true;
      paused = false;
      cancelAnimationFrame(rafId);
      requestAnimationFrame((t)=>{ lastT=t; rafId = requestAnimationFrame(loop); });
    } else if (paused){
      togglePause();
    }
  }
  function togglePause(){
    if (!running) return;
    paused = !paused;
  }
  function resetGame(){
    running = false; paused = false;
    initRound(true);
    redrawAll();
  }
  function initRound(full=false){
    if (full){
      score = 0; lines = 0; level = 1; dropInterval = GRAVITY_START_MS;
    }
    board = createMatrix(W, H);
    bag = [];
    piece = randomPiece();
    nextPiece = randomPiece();
    holdPiece = null;
    canHold = true;
    dropTimer = 0;
    updateStats();
  }

  // Boot: choose theme precedence
  (async function boot(){
    // 1) ?theme=...
    const params = new URLSearchParams(location.search);
    const qTheme = params.get('theme');
    if (qTheme && BUILT_THEMES[qTheme]) document.body.setAttribute('data-theme', qTheme);

    // 2) body[data-theme] already applied (CSS vars)
    // 3) global window.TETRIS_THEME to merge/override
    const override = window.TETRIS_THEME || null;
    await applyTheme(override || (qTheme || document.body.dataset.theme || null));

    initRound(true);
    redrawAll();
  })();

})();