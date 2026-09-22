const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

const titleScreen = document.getElementById('titleScreen');
const levelSelectScreen = document.getElementById('levelSelectScreen');
const editorScreen = document.getElementById('editorScreen');
const publishScreen = document.getElementById('publishScreen');
const levelList = document.getElementById('levelList');
const publishLinkInput = document.getElementById('publishLinkInput');
const levelNameInput = document.getElementById('levelNameInput');
const saveLevelButton = document.getElementById('saveLevelButton');
const testLevelButton = document.getElementById('testLevelButton');
const publishLevelButton = document.getElementById('publishLevelButton');
const clearEditorButton = document.getElementById('clearEditorButton');
const copyPublishLinkButton = document.getElementById('copyPublishLinkButton');
const openPublishLinkButton = document.getElementById('openPublishLinkButton');

const tileSize = 52;
const keys = {};
let cameraX = 0;
let lastTime = 0;
let timer = 0;

const playerSprites = {
  stand: new Image(),
  run: new Image(),
  jump: new Image(),
};

const worldSprites = {
  ground: new Image(),
  brick: new Image(),
  question: new Image(),
  goomba: new Image(),
};

playerSprites.stand.src = 'assets/mario-stand.png';
playerSprites.run.src = 'assets/mario-run.png';
playerSprites.jump.src = 'assets/mario-jump.png';
worldSprites.ground.src = 'assets/ground-block.png';
worldSprites.brick.src = 'assets/block.png';
worldSprites.question.src = 'assets/block.png';
worldSprites.goomba.src = 'assets/goomba.png';

const movement = {
  walkSpeed: 3.2,
  jumpForce: 10,
  gravity: 0.3,
  maxFallSpeed: 7,
};

const LEVEL_STORAGE_KEY = 'mini-mario-custom-levels';

const state = {
  mode: 'title',
  activeLevel: null,
  score: 0,
  lives: 3,
  coins: 0,
  win: false,
  gameOver: false,
  editorTool: 'ground',
  editorLevel: null,
  editorPainting: false,
  editorHover: null,
};

const player = {
  x: 80,
  y: 320,
  w: 64,
  h: 72,
  vx: 0,
  vy: 0,
  onGround: false,
  dir: 1,
  invuln: 0,
};

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

function cloneData(source) {
  return JSON.parse(JSON.stringify(source));
}

function baseLevelBlueprint() {
  return {
    id: 'custom-' + Date.now(),
    name: 'Custom Level',
    width: 1800,
    spawn: { x: 80, y: 320 },
    flagpole: { x: 1520, y: 120, h: 300, w: 12 },
    solids: [
      { x: 0, y: 490, w: 1800, h: 52, type: 'ground' },
    ],
    enemies: [],
    coins: [
      { x: 300, y: 310 },
      { x: 400, y: 310 },
      { x: 500, y: 310 },
    ],
  };
}

function levelBlueprints() {
  return [
    {
      id: 'meadow-run',
      name: 'Meadow Run',
      width: 2800,
      spawn: { x: 80, y: 320 },
      flagpole: { x: 2550, y: 120, h: 300, w: 12 },
      solids: [
        { x: 0, y: 490, w: 2800, h: 52, type: 'ground' },
        { x: 420, y: 392, w: 52, h: 52, type: 'brick' },
        { x: 540, y: 340, w: 52, h: 52, type: 'brick' },
        { x: 620, y: 340, w: 52, h: 52, type: 'brick' },
        { x: 760, y: 402, w: 52, h: 52, type: 'brick' },
        { x: 1260, y: 390, w: 52, h: 52, type: 'question' },
        { x: 1600, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 1880, y: 360, w: 90, h: 130, type: 'pipe' },
        { x: 2160, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 2480, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 2525, y: 330, w: 52, h: 52, type: 'brick' },
        { x: 2570, y: 270, w: 52, h: 52, type: 'brick' },
      ],
      enemies: [
        { x: 780, y: 460, w: 26, h: 26, vx: -1.2, alive: true },
        { x: 1520, y: 460, w: 26, h: 26, vx: -1.1, alive: true },
        { x: 1760, y: 460, w: 26, h: 26, vx: 1.15, alive: true },
        { x: 2400, y: 460, w: 26, h: 26, vx: -1.25, alive: true },
      ],
      coins: [
        { x: 520, y: 330 }, { x: 610, y: 300 }, { x: 770, y: 340 },
        { x: 1280, y: 330 }, { x: 2510, y: 300 }, { x: 2560, y: 240 },
      ],
    },
    {
      id: 'cliff-hop',
      name: 'Cliff Hop',
      width: 3200,
      spawn: { x: 80, y: 320 },
      flagpole: { x: 2870, y: 120, h: 300, w: 12 },
      solids: [
        { x: 0, y: 490, w: 3200, h: 52, type: 'ground' },
        { x: 350, y: 420, w: 52, h: 52, type: 'brick' },
        { x: 520, y: 370, w: 52, h: 52, type: 'brick' },
        { x: 640, y: 318, w: 52, h: 52, type: 'brick' },
        { x: 820, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 1280, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 1480, y: 360, w: 52, h: 52, type: 'brick' },
        { x: 1535, y: 310, w: 52, h: 52, type: 'brick' },
        { x: 1590, y: 260, w: 52, h: 52, type: 'brick' },
        { x: 1900, y: 402, w: 52, h: 52, type: 'brick' },
        { x: 2200, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 2360, y: 350, w: 52, h: 52, type: 'brick' },
        { x: 2600, y: 420, w: 90, h: 70, type: 'pipe' },
      ],
      enemies: [
        { x: 970, y: 460, w: 26, h: 26, vx: -1.15, alive: true },
        { x: 1720, y: 460, w: 26, h: 26, vx: 1.2, alive: true },
        { x: 2250, y: 460, w: 26, h: 26, vx: -1.18, alive: true },
      ],
      coins: [
        { x: 540, y: 300 }, { x: 640, y: 260 }, { x: 1510, y: 250 },
        { x: 1580, y: 200 }, { x: 2205, y: 330 }, { x: 2360, y: 280 },
      ],
    },
    {
      id: 'pipe-garden',
      name: 'Pipe Garden',
      width: 3500,
      spawn: { x: 80, y: 320 },
      flagpole: { x: 3210, y: 120, h: 300, w: 12 },
      solids: [
        { x: 0, y: 490, w: 3500, h: 52, type: 'ground' },
        { x: 500, y: 430, w: 90, h: 60, type: 'pipe' },
        { x: 730, y: 380, w: 52, h: 52, type: 'brick' },
        { x: 840, y: 340, w: 52, h: 52, type: 'brick' },
        { x: 960, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 1360, y: 390, w: 52, h: 52, type: 'question' },
        { x: 1490, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 1610, y: 350, w: 52, h: 52, type: 'brick' },
        { x: 1920, y: 430, w: 90, h: 60, type: 'pipe' },
        { x: 2300, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 2360, y: 330, w: 52, h: 52, type: 'brick' },
        { x: 2420, y: 270, w: 52, h: 52, type: 'brick' },
        { x: 2820, y: 430, w: 90, h: 70, type: 'pipe' },
      ],
      enemies: [
        { x: 760, y: 460, w: 26, h: 26, vx: 1.2, alive: true },
        { x: 1410, y: 460, w: 26, h: 26, vx: -1.25, alive: true },
        { x: 2060, y: 460, w: 26, h: 26, vx: 1.18, alive: true },
        { x: 2540, y: 460, w: 26, h: 26, vx: -1.22, alive: true },
      ],
      coins: [
        { x: 750, y: 315 }, { x: 840, y: 280 }, { x: 1360, y: 330 },
        { x: 1610, y: 300 }, { x: 2360, y: 270 }, { x: 2420, y: 210 },
      ],
    },
    {
      id: 'castle-run',
      name: 'Castle Run',
      width: 3900,
      spawn: { x: 80, y: 320 },
      flagpole: { x: 3570, y: 120, h: 300, w: 12 },
      solids: [
        { x: 0, y: 490, w: 3900, h: 52, type: 'ground' },
        { x: 460, y: 400, w: 52, h: 52, type: 'brick' },
        { x: 580, y: 360, w: 52, h: 52, type: 'brick' },
        { x: 700, y: 320, w: 52, h: 52, type: 'brick' },
        { x: 1030, y: 430, w: 90, h: 70, type: 'pipe' },
        { x: 1360, y: 390, w: 52, h: 52, type: 'question' },
        { x: 1420, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 1700, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 2100, y: 390, w: 52, h: 52, type: 'brick' },
        { x: 2180, y: 330, w: 52, h: 52, type: 'brick' },
        { x: 2260, y: 270, w: 52, h: 52, type: 'brick' },
        { x: 2590, y: 420, w: 90, h: 70, type: 'pipe' },
        { x: 2950, y: 360, w: 52, h: 52, type: 'brick' },
        { x: 3020, y: 360, w: 52, h: 52, type: 'brick' },
        { x: 3280, y: 430, w: 90, h: 70, type: 'pipe' },
      ],
      enemies: [
        { x: 900, y: 460, w: 26, h: 26, vx: -1.2, alive: true },
        { x: 1730, y: 460, w: 26, h: 26, vx: 1.3, alive: true },
        { x: 2450, y: 460, w: 26, h: 26, vx: -1.2, alive: true },
        { x: 3120, y: 460, w: 26, h: 26, vx: -1.25, alive: true },
      ],
      coins: [
        { x: 560, y: 290 }, { x: 700, y: 250 }, { x: 1360, y: 330 },
        { x: 1420, y: 330 }, { x: 2180, y: 270 }, { x: 2260, y: 210 },
        { x: 2950, y: 300 }, { x: 3020, y: 300 },
      ],
    },
  ];
}

function getCustomLevels() {
  try {
    const raw = localStorage.getItem(LEVEL_STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch (error) {
    return [];
  }
}

function saveCustomLevels(levels) {
  try {
    localStorage.setItem(LEVEL_STORAGE_KEY, JSON.stringify(levels));
  } catch (error) {
    // ignore storage issues in restricted environments
  }
}

function getAllLevels() {
  return [...levelBlueprints(), ...getCustomLevels()];
}

function buildWorldFromBlueprint(levelData) {
  const world = cloneData(levelData);
  const startWidth = world.width || 2000;
  world.width = startWidth;
  world.height = canvas.height;
  world.solids = cloneData(world.solids || []);
  world.enemies = cloneData(world.enemies || []).map((enemy) => ({ ...enemy, alive: true }));
  world.coins = cloneData(world.coins || []).map((coin, index) => ({
    x: coin.x,
    y: coin.y,
    r: 8,
    collected: false,
    bob: (index + 1) * 1.9,
  }));

  if (!world.solids.some((solid) => solid.type === 'ground')) {
    world.solids.unshift({ x: 0, y: 490, w: world.width, h: 52, type: 'ground' });
  }

  return world;
}

function setScreen(name) {
  titleScreen.classList.toggle('hidden', name !== 'title');
  titleScreen.classList.toggle('active', name === 'title');
  levelSelectScreen.classList.toggle('hidden', name !== 'level-select');
  levelSelectScreen.classList.toggle('active', name === 'level-select');
  editorScreen.classList.toggle('hidden', name !== 'editor');
  editorScreen.classList.toggle('active', name === 'editor');
  publishScreen.classList.toggle('hidden', name !== 'publish');
  publishScreen.classList.toggle('active', name === 'publish');
}

function populateLevelList() {
  const allLevels = getAllLevels();
  levelList.innerHTML = allLevels.map((level) => `
    <button class="level-card" data-level-id="${level.id}">
      <h3>${level.name}</h3>
      <p>${level.solids.length} blocks • ${level.enemies.length} enemies</p>
    </button>
  `).join('');
}

function resetPlayerAtSpawn(spawn) {
  player.x = spawn.x;
  player.y = spawn.y;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.dir = 1;
  player.invuln = 0;
  cameraX = 0;
}

function resetGameForLevel(levelData) {
  state.activeLevel = buildWorldFromBlueprint(levelData);
  state.score = 0;
  state.lives = 3;
  state.coins = 0;
  state.win = false;
  state.gameOver = false;
  resetPlayerAtSpawn(levelData.spawn || { x: 80, y: 320 });
}

function startLevel(levelData) {
  resetGameForLevel(levelData);
  state.mode = 'playing';
  setScreen('title');
  titleScreen.classList.add('hidden');
  titleScreen.classList.remove('active');
}

function openLevelSelect() {
  populateLevelList();
  state.mode = 'level-select';
  setScreen('level-select');
}

function openEditor() {
  state.mode = 'editor';
  if (!state.editorLevel) {
    state.editorLevel = baseLevelBlueprint();
  }
  levelNameInput.value = state.editorLevel.name || 'My Custom Level';
  setScreen('editor');
}

function openPublishScreen() {
  state.mode = 'publish';
  setScreen('publish');
}

function createEmptyEditorLevel() {
  const empty = baseLevelBlueprint();
  empty.name = 'My Custom Level';
  empty.width = 1800;
  empty.flagpole = { x: 1500, y: 120, h: 300, w: 12 };
  empty.solids = [{ x: 0, y: 490, w: 1800, h: 52, type: 'ground' }];
  empty.enemies = [];
  empty.coins = [
    { x: 260, y: 330 },
    { x: 360, y: 330 },
    { x: 460, y: 330 },
  ];
  return empty;
}

function ensureGroundBase(level) {
  if (!level) return level;
  const groundWidth = Math.max(level.width || 1800, 1800);
  const ground = level.solids.find((solid) => solid.type === 'ground') || {
    x: 0,
    y: 490,
    w: groundWidth,
    h: 52,
    type: 'ground',
  };

  ground.x = 0;
  ground.y = 490;
  ground.h = 52;
  ground.w = groundWidth;
  ground.type = 'ground';

  level.solids = [ground, ...level.solids.filter((solid) => solid.type !== 'ground')];
  return level;
}

function ensureEditorLevel() {
  if (!state.editorLevel) {
    state.editorLevel = createEmptyEditorLevel();
  }
  ensureGroundBase(state.editorLevel);
  return state.editorLevel;
}

function normalizeSolid(solid) {
  if (solid.type === 'ground' || solid.type === 'brick' || solid.type === 'question') {
    return { ...solid, w: tileSize, h: tileSize };
  }
  if (solid.type === 'pipe') {
    return { ...solid, w: 90, h: 70 };
  }
  return solid;
}

function setEditorTool(tool) {
  state.editorTool = tool;
  document.querySelectorAll('.tool-button').forEach((button) => {
    button.classList.toggle('active', button.dataset.tool === tool);
  });
}

function editorCellFromPointer(event) {
  const rect = canvas.getBoundingClientRect();
  const scaleX = canvas.width / rect.width;
  const scaleY = canvas.height / rect.height;
  const x = (event.clientX - rect.left) * scaleX;
  const y = (event.clientY - rect.top) * scaleY;
  const gridX = Math.floor((x - 30) / tileSize);
  const gridY = Math.floor((y - 80) / tileSize);
  return { x: gridX, y: gridY };
}

function applyEditorToolAtCell(cell) {
  const level = ensureEditorLevel();
  const tileX = cell.x * tileSize;
  const tileY = cell.y * tileSize;

  if (state.editorTool === 'erase') {
    level.solids = level.solids.filter((solid) => {
      if (solid.type === 'ground') return true;
      const inX = solid.x <= tileX + tileSize && solid.x + solid.w >= tileX;
      const inY = solid.y <= tileY + tileSize && solid.y + solid.h >= tileY;
      return !(inX && inY);
    });
    level.enemies = level.enemies.filter((enemy) => {
      const inX = enemy.x <= tileX + tileSize && enemy.x + enemy.w >= tileX;
      const inY = enemy.y <= tileY + tileSize && enemy.y + enemy.h >= tileY;
      return !(inX && inY);
    });
    level.coins = level.coins.filter((coin) => {
      const coinX = coin.x;
      const coinY = coin.y;
      return !(Math.abs(coinX - tileX) < tileSize && Math.abs(coinY - tileY) < tileSize);
    });
    if (level.spawn && Math.abs(level.spawn.x - tileX) < tileSize && Math.abs(level.spawn.y - tileY) < tileSize) {
      level.spawn = { x: 80, y: 320 };
    }
    if (level.flagpole && Math.abs(level.flagpole.x - tileX) < tileSize * 2) {
      level.flagpole = { x: 1500, y: 120, h: 300, w: 12 };
    }
    return;
  }

  if (state.editorTool === 'spawn') {
    level.spawn = { x: tileX, y: tileY };
    return;
  }

  if (state.editorTool === 'flag') {
    level.flagpole = { x: tileX + 12, y: 120, h: 300, w: 12 };
    return;
  }

  if (state.editorTool === 'goomba') {
    const exists = level.enemies.some((enemy) => Math.abs(enemy.x - tileX) < 8 && Math.abs(enemy.y - tileY) < 8);
    if (!exists) {
      level.enemies.push({ x: tileX, y: tileY + 8, w: 26, h: 26, vx: -1.2, alive: true });
    }
    return;
  }

  if (state.editorTool === 'coin') {
    const exists = level.coins.some((coin) => Math.abs(coin.x - (tileX + tileSize / 2)) < 10 && Math.abs(coin.y - (tileY + tileSize / 2)) < 10);
    if (!exists) {
      level.coins.push({ x: tileX + tileSize / 2, y: tileY + tileSize / 2 });
    }
    return;
  }

  const newSolid = {
    x: tileX,
    y: tileY,
    w: state.editorTool === 'pipe' ? 90 : tileSize,
    h: state.editorTool === 'pipe' ? 70 : tileSize,
    type: state.editorTool,
  };

  if (state.editorTool === 'ground') {
    newSolid.y = 490;
    newSolid.h = 52;
    level.solids = level.solids.filter((solid) => solid.type !== 'ground');
    level.solids.unshift(newSolid);
    ensureGroundBase(level);
    return;
  }

  const overlapKey = `${newSolid.x},${newSolid.y},${newSolid.w},${newSolid.h}`;
  const duplicate = level.solids.some((solid) => {
    if (solid.type === 'ground') return false;
    return solid.x === newSolid.x && solid.y === newSolid.y && solid.type === newSolid.type;
  });
  if (!duplicate) {
    level.solids.push(newSolid);
  }
}

function saveEditorLevel() {
  const level = ensureEditorLevel();
  level.name = levelNameInput.value.trim() || 'My Custom Level';
  const saved = getCustomLevels();
  const index = saved.findIndex((item) => item.id === level.id);
  if (index >= 0) {
    saved[index] = level;
  } else {
    saved.push(level);
  }
  saveCustomLevels(saved);
  populateLevelList();
  publishLinkInput.value = 'Saved locally.';
}

function publishCurrentLevel() {
  const level = ensureEditorLevel();
  const cleaned = {
    id: level.id || 'custom-' + Date.now(),
    name: levelNameInput.value.trim() || level.name || 'My Custom Level',
    width: Math.max(level.width || 1800, (level.flagpole?.x || 1500) + 400),
    spawn: level.spawn || { x: 80, y: 320 },
    flagpole: level.flagpole || { x: 1500, y: 120, h: 300, w: 12 },
    solids: level.solids || [],
    enemies: level.enemies || [],
    coins: level.coins || [],
  };

  const shareText = btoa(unescape(encodeURIComponent(JSON.stringify(cleaned))));
  const url = `${window.location.origin}${window.location.pathname}#level=${shareText}`;
  publishLinkInput.value = url;
  if (navigator.clipboard) {
    navigator.clipboard.writeText(url).catch(() => {});
  }
  window.location.hash = `level=${shareText}`;
  openPublishScreen();
}

function loadSharedLevelFromHash() {
  const hash = window.location.hash.startsWith('#level=') ? window.location.hash.slice(7) : '';
  if (!hash) return null;
  try {
    const decoded = decodeURIComponent(escape(atob(hash)));
    const parsed = JSON.parse(decoded);
    return parsed;
  } catch (error) {
    return null;
  }
}

function clearEditor() {
  state.editorLevel = createEmptyEditorLevel();
  levelNameInput.value = 'My Custom Level';
  publishLinkInput.value = '';
}

function updatePlayer() {
  if (state.mode !== 'playing' || !state.activeLevel) return;

  const level = state.activeLevel;
  const moveLeft = keys.a || keys.arrowleft;
  const moveRight = keys.d || keys.arrowright;
  const jump = keys.w || keys.arrowup || keys[' '];

  if (moveLeft) {
    player.vx = -movement.walkSpeed;
    player.dir = -1;
  } else if (moveRight) {
    player.vx = movement.walkSpeed;
    player.dir = 1;
  } else {
    player.vx *= 0.7;
    if (Math.abs(player.vx) < 0.1) {
      player.vx = 0;
    }
  }

  if (jump && player.onGround) {
    player.vy = -movement.jumpForce;
    player.onGround = false;
  }

  player.vy += movement.gravity;
  if (player.vy > movement.maxFallSpeed) player.vy = movement.maxFallSpeed;

  const prevX = player.x;
  player.x += player.vx;
  for (const solid of level.solids) {
    if (solid.type === 'ground') continue;
    if (rectsIntersect(player, solid)) {
      if (player.vx > 0) {
        player.x = solid.x - player.w;
      } else if (player.vx < 0) {
        player.x = solid.x + solid.w;
      }
      player.vx = 0;
    }
  }

  const prevY = player.y;
  player.y += player.vy;
  player.onGround = false;
  for (const solid of level.solids) {
    if (rectsIntersect(player, solid)) {
      if (player.vy > 0 && prevY + player.h <= solid.y + 8) {
        player.y = solid.y - player.h;
        player.vy = 0;
        player.onGround = true;
      } else if (player.vy < 0 && prevY >= solid.y + solid.h - 8) {
        player.y = solid.y + solid.h;
        player.vy = 0;
      } else {
        player.x = prevX;
      }
    }
  }

  if (player.y > canvas.height + 200) {
    state.lives -= 1;
    if (state.lives <= 0) {
      state.gameOver = true;
    } else {
      resetPlayerAtSpawn(level.spawn || { x: 80, y: 320 });
    }
  }

  for (const coin of level.coins) {
    if (!coin.collected) {
      const coinRect = { x: coin.x - coin.r, y: coin.y - coin.r, w: coin.r * 2, h: coin.r * 2 };
      if (rectsIntersect(player, coinRect)) {
        coin.collected = true;
        state.score += 10;
        state.coins += 1;
      }
    }
  }

  if (player.invuln > 0) {
    player.invuln -= 1;
  }

  if (player.x > (level.flagpole?.x || 0) - 20) {
    state.win = true;
  }
}

function updateEnemies() {
  if (state.mode !== 'playing' || !state.activeLevel) return;
  const level = state.activeLevel;

  for (const enemy of level.enemies) {
    if (!enemy.alive) continue;
    enemy.x += enemy.vx;
    const groundHit = level.solids.some((solid) => {
      if (solid.type !== 'ground' && solid.y + solid.h < 490) return false;
      return rectsIntersect({ x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h }, solid);
    });

    if (!groundHit) {
      enemy.vx *= -1;
    }

    const enemyRect = { x: enemy.x, y: enemy.y, w: enemy.w, h: enemy.h };
    if (rectsIntersect(player, enemyRect)) {
      const playerBottom = player.y + player.h;
      const enemyTop = enemy.y;
      if (player.vy > 0 && playerBottom - enemyTop < 18 && player.y < enemy.y) {
        enemy.alive = false;
        player.vy = -8;
        state.score += 100;
      } else if (player.invuln <= 0) {
        state.lives -= 1;
        player.invuln = 80;
        player.x -= 40 * player.dir;
        player.vy = -7;
        if (state.lives <= 0) {
          state.gameOver = true;
        }
      }
    }

    if (enemy.x < 20 || enemy.x > level.width - 40) {
      enemy.vx *= -1;
    }
  }
}

function update() {
  if (state.mode !== 'playing') return;
  if (state.win || state.gameOver) return;

  timer += 1;
  updatePlayer();
  updateEnemies();

  const targetCamera = player.x - canvas.width * 0.35;
  cameraX += (targetCamera - cameraX) * 0.12;
  cameraX = Math.max(0, Math.min(cameraX, (state.activeLevel?.width || canvas.width) - canvas.width));
}

function drawBackground() {
  ctx.fillStyle = '#7ec7ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  ctx.fillStyle = '#f9d875';
  ctx.beginPath();
  ctx.arc(820, 100, 45, 0, Math.PI * 2);
  ctx.fill();

  for (let i = 0; i < 7; i++) {
    const x = 80 + i * 180 - cameraX * 0.2;
    const y = 120 + (i % 3) * 30;
    ctx.fillStyle = 'rgba(255,255,255,0.9)';
    ctx.beginPath();
    ctx.arc(x, y, 26, 0, Math.PI * 2);
    ctx.arc(x + 28, y, 22, 0, Math.PI * 2);
    ctx.arc(x + 52, y, 26, 0, Math.PI * 2);
    ctx.fill();
  }

  ctx.fillStyle = '#7bc96f';
  for (let i = 0; i < 10; i++) {
    const offset = i * 220;
    ctx.beginPath();
    ctx.moveTo(30 + offset - cameraX * 0.5, 470);
    ctx.lineTo(100 + offset - cameraX * 0.5, 300);
    ctx.lineTo(170 + offset - cameraX * 0.5, 470);
    ctx.fill();
  }
}

function drawSolid(solid) {
  const sx = solid.x - cameraX;

  if (solid.type === 'ground') {
    const groundSprite = worldSprites.ground;
    if (groundSprite.complete && groundSprite.naturalWidth > 0) {
      for (let y = 0; y < solid.h; y += 52) {
        for (let x = 0; x < solid.w; x += 52) {
          ctx.drawImage(groundSprite, sx + x, solid.y + y, 52, 52);
        }
      }
      return;
    }
  }

  if (solid.type === 'brick' || solid.type === 'question') {
    const sprite = worldSprites.brick;
    if (sprite.complete && sprite.naturalWidth > 0) {
      ctx.drawImage(sprite, sx, solid.y, solid.w, solid.h);
      return;
    }
  }

  if (solid.type === 'ground') {
    ctx.fillStyle = '#7acb4f';
    ctx.fillRect(sx, solid.y, solid.w, solid.h);
    return;
  }

  if (solid.type === 'brick' || solid.type === 'question') {
    ctx.fillStyle = '#c67c3d';
    ctx.fillRect(sx, solid.y, solid.w, solid.h);
    return;
  }

  if (solid.type === 'pipe') {
    ctx.fillStyle = '#4cc03a';
    ctx.fillRect(sx, solid.y, solid.w, solid.h);
    ctx.fillStyle = '#2d9c2d';
    ctx.fillRect(sx + 8, solid.y + 12, solid.w - 16, 18);
    ctx.fillStyle = '#7ae55d';
    ctx.fillRect(sx + 14, solid.y + 18, solid.w - 28, solid.h - 20);
  }
}

function drawCoins() {
  const level = state.activeLevel;
  if (!level) return;

  for (const coin of level.coins) {
    if (coin.collected) continue;
    const bob = Math.sin(timer * 0.08 + coin.bob) * 5;
    ctx.fillStyle = '#f7db48';
    ctx.beginPath();
    ctx.arc(coin.x - cameraX, coin.y + bob, coin.r, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#fff7a9';
    ctx.fillRect(coin.x - cameraX - 2, coin.y + bob - 5, 4, 10);
  }
}

function drawEnemy(enemy) {
  if (!enemy.alive) return;
  const x = enemy.x - cameraX;
  if (worldSprites.goomba.complete && worldSprites.goomba.naturalWidth > 0) {
    ctx.drawImage(worldSprites.goomba, x, enemy.y, enemy.w, enemy.h);
    return;
  }

  ctx.fillStyle = '#6b3d1a';
  ctx.fillRect(x, enemy.y, enemy.w, enemy.h);
  ctx.fillStyle = '#b9783f';
  ctx.fillRect(x + 4, enemy.y + 6, enemy.w - 8, 10);
  ctx.fillStyle = '#000';
  ctx.fillRect(x + 3, enemy.y + 12, 4, 4);
  ctx.fillRect(x + enemy.w - 7, enemy.y + 12, 4, 4);
}

function drawPlayer() {
  const x = player.x - cameraX;
  const y = player.y;
  const walking = Math.abs(player.vx) > 0.2;
  const runFrame = Math.floor(timer / 8) % 2 === 0;
  const spriteKey = !player.onGround ? 'jump' : walking && runFrame ? 'run' : 'stand';
  const sprite = playerSprites[spriteKey];

  if (!sprite || !sprite.complete || sprite.naturalWidth === 0) {
    return;
  }

  ctx.save();
  ctx.translate(x + player.w / 2, y + player.h / 2);
  ctx.scale(player.dir, 1);
  ctx.translate(-(x + player.w / 2), -(y + player.h / 2));

  if (player.invuln > 0 && Math.floor(player.invuln / 6) % 2 === 0) {
    ctx.globalAlpha = 0.5;
  }

  ctx.drawImage(sprite, x, y, player.w, player.h);
  ctx.restore();
}

function drawFlagpole() {
  const level = state.activeLevel;
  if (!level || !level.flagpole) return;

  const x = level.flagpole.x - cameraX;
  ctx.fillStyle = '#e5d9b2';
  ctx.fillRect(x, level.flagpole.y, 10, level.flagpole.h);
  ctx.fillStyle = '#f74747';
  ctx.fillRect(x + 10, 150, 70, 40);
  ctx.fillStyle = '#fff';
  ctx.fillRect(x + 18, 160, 8, 18);
}

function drawHUD() {
  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(20, 18, 230, 52);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 18px Arial';
  ctx.fillText('MARIO', 32, 38);
  ctx.fillText(String(state.score).padStart(6, '0'), 32, 58);

  ctx.fillStyle = 'rgba(0,0,0,0.35)';
  ctx.fillRect(680, 18, 220, 52);
  ctx.fillStyle = '#fff';
  ctx.fillText('LIVES', 700, 38);
  ctx.fillText(String(state.lives), 700, 58);

  if (state.win) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(250, 170, 460, 170);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('LEVEL CLEAR!', 305, 250);
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press R to play again', 350, 295);
  }

  if (state.gameOver) {
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(250, 170, 460, 170);
    ctx.fillStyle = '#fff';
    ctx.font = 'bold 48px Arial';
    ctx.fillText('GAME OVER', 310, 250);
    ctx.font = 'bold 24px Arial';
    ctx.fillText('Press R to retry', 375, 295);
  }
}

function drawEditorPreview() {
  ctx.fillStyle = '#7ec7ff';
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  const level = ensureEditorLevel();
  const originX = 30;
  const originY = 90;

  ctx.strokeStyle = 'rgba(255,255,255,0.22)';
  ctx.lineWidth = 1;
  for (let x = 0; x <= 24; x += 1) {
    ctx.beginPath();
    ctx.moveTo(originX + x * tileSize, originY);
    ctx.lineTo(originX + x * tileSize, originY + 10 * tileSize);
    ctx.stroke();
  }
  for (let y = 0; y <= 10; y += 1) {
    ctx.beginPath();
    ctx.moveTo(originX, originY + y * tileSize);
    ctx.lineTo(originX + 24 * tileSize, originY + y * tileSize);
    ctx.stroke();
  }

  for (const solid of level.solids) {
    const drawX = originX + solid.x;
    const drawY = originY + solid.y;
    if (solid.type === 'ground') {
      ctx.fillStyle = '#7acb4f';
      ctx.fillRect(drawX, drawY, solid.w, solid.h);
    } else if (solid.type === 'brick' || solid.type === 'question') {
      ctx.fillStyle = '#c67c3d';
      ctx.fillRect(drawX, drawY, solid.w, solid.h);
    } else if (solid.type === 'pipe') {
      ctx.fillStyle = '#4cc03a';
      ctx.fillRect(drawX, drawY, solid.w, solid.h);
    }
  }

  for (const coin of level.coins) {
    ctx.fillStyle = '#f7db48';
    ctx.beginPath();
    ctx.arc(originX + coin.x, originY + coin.y, 8, 0, Math.PI * 2);
    ctx.fill();
  }

  for (const enemy of level.enemies) {
    const drawX = originX + enemy.x;
    const drawY = originY + enemy.y;
    ctx.fillStyle = '#6b3d1a';
    ctx.fillRect(drawX, drawY, enemy.w, enemy.h);
  }

  if (level.spawn) {
    ctx.fillStyle = '#fff';
    ctx.fillRect(originX + level.spawn.x, originY + level.spawn.y, 12, 18);
  }

  if (level.flagpole) {
    ctx.fillStyle = '#e5d9b2';
    ctx.fillRect(originX + level.flagpole.x, originY + 10, 10, 300);
    ctx.fillStyle = '#f74747';
    ctx.fillRect(originX + level.flagpole.x + 10, originY + 18, 70, 40);
  }

  if (state.editorHover) {
    ctx.strokeStyle = '#fff';
    ctx.lineWidth = 2;
    ctx.strokeRect(originX + state.editorHover.x * tileSize, originY + state.editorHover.y * tileSize, tileSize, tileSize);
  }

  ctx.fillStyle = 'rgba(0, 0, 0, 0.45)';
  ctx.fillRect(20, 20, 420, 60);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 22px Arial';
  ctx.fillText('EDITOR MODE: ' + state.editorTool.toUpperCase(), 36, 58);
}

function drawWorld() {
  if (!state.activeLevel) {
    drawBackground();
    return;
  }

  drawBackground();
  for (const solid of state.activeLevel.solids) {
    drawSolid(solid);
  }
  drawCoins();
  drawFlagpole();
  for (const enemy of state.activeLevel.enemies) {
    drawEnemy(enemy);
  }
  drawPlayer();
  drawHUD();
}

function draw() {
  if (state.mode === 'editor') {
    drawEditorPreview();
    return;
  }

  if (state.mode === 'title' || state.mode === 'level-select') {
    drawBackground();
    return;
  }

  drawWorld();
}

function loop(timestamp) {
  const delta = timestamp - lastTime;
  lastTime = timestamp;
  if (delta > 0) {
    update();
    draw();
  }
  requestAnimationFrame(loop);
}

function bindUI() {
  document.addEventListener('click', (event) => {
    const screenTarget = event.target.closest('[data-screen]');
    if (screenTarget) {
      const nextScreen = screenTarget.dataset.screen;
      if (nextScreen === 'title') {
        state.mode = 'title';
        setScreen('title');
      } else if (nextScreen === 'level-select') {
        openLevelSelect();
      } else if (nextScreen === 'editor') {
        openEditor();
      } else if (nextScreen === 'publish') {
        openPublishScreen();
      }
    }

    const actionTarget = event.target.closest('[data-action]');
    if (actionTarget) {
      const action = actionTarget.dataset.action;
      if (action === 'play-first') {
        startLevel(getAllLevels()[0]);
      }
    }

    const levelCard = event.target.closest('[data-level-id]');
    if (levelCard) {
      const found = getAllLevels().find((level) => level.id === levelCard.dataset.levelId);
      if (found) {
        startLevel(found);
      }
    }

    const toolButton = event.target.closest('[data-tool]');
    if (toolButton) {
      setEditorTool(toolButton.dataset.tool);
    }
  });

  document.addEventListener('keydown', (event) => {
    const key = event.key.toLowerCase();
    if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w'].includes(key)) {
      event.preventDefault();
    }
    keys[key] = true;

    if (event.key.toLowerCase() === 'r') {
      if (state.activeLevel) {
        resetGameForLevel(state.activeLevel);
      }
    }
  });

  document.addEventListener('keyup', (event) => {
    keys[event.key.toLowerCase()] = false;
  });

  canvas.addEventListener('pointerdown', (event) => {
    if (state.mode !== 'editor') return;
    const cell = editorCellFromPointer(event);
    state.editorHover = cell;
    state.editorPainting = true;
    applyEditorToolAtCell(cell);
  });

  canvas.addEventListener('pointermove', (event) => {
    if (state.mode !== 'editor') return;
    const cell = editorCellFromPointer(event);
    state.editorHover = cell;
    if (state.editorPainting) {
      applyEditorToolAtCell(cell);
    }
  });

  canvas.addEventListener('pointerup', () => {
    state.editorPainting = false;
  });

  canvas.addEventListener('pointerleave', () => {
    state.editorPainting = false;
  });

  saveLevelButton.addEventListener('click', () => {
    saveEditorLevel();
  });

  testLevelButton.addEventListener('click', () => {
    const level = ensureEditorLevel();
    const finalLevel = {
      ...level,
      name: levelNameInput.value.trim() || level.name || 'My Custom Level',
    };
    startLevel(finalLevel);
  });

  publishLevelButton.addEventListener('click', () => {
    publishCurrentLevel();
  });

  copyPublishLinkButton.addEventListener('click', () => {
    if (!publishLinkInput.value || publishLinkInput.value === 'Saved locally.') return;
    if (navigator.clipboard) {
      navigator.clipboard.writeText(publishLinkInput.value).catch(() => {});
    }
  });

  openPublishLinkButton.addEventListener('click', () => {
    if (publishLinkInput.value && publishLinkInput.value !== 'Saved locally.') {
      window.open(publishLinkInput.value, '_blank');
    }
  });

  clearEditorButton.addEventListener('click', () => {
    clearEditor();
  });
}

function initialize() {
  bindUI();
  setScreen('title');
  state.editorLevel = createEmptyEditorLevel();
  const sharedLevel = loadSharedLevelFromHash();
  if (sharedLevel) {
    state.editorLevel = sharedLevel;
    levelNameInput.value = sharedLevel.name || 'Shared Level';
    publishLinkInput.value = window.location.href;
    setScreen('publish');
    state.mode = 'publish';
  }
  populateLevelList();
  setEditorTool('ground');
  requestAnimationFrame(loop);
}

initialize();
