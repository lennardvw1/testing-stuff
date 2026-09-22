const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');

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
  gravity: 0.30,
  maxFallSpeed: 7,
};

const state = {
  score: 0,
  lives: 3,
  coins: 0,
  win: false,
  gameOver: false,
};

function rectsIntersect(a, b) {
  return (
    a.x < b.x + b.w &&
    a.x + a.w > b.x &&
    a.y < b.y + b.h &&
    a.y + a.h > b.y
  );
}

const level = {
  width: 4200,
  height: canvas.height,
  groundY: 470,
  solids: [],
  enemies: [],
  coins: [],
  flagpole: { x: 3880, y: 120, h: 300, w: 12 },
};

function makeGround() {
  const ground = { x: 0, y: 490, w: level.width, h: 52, type: 'ground' };
  level.solids.push(ground);

  const staticBlocks = [
    { x: 460, y: 390, w: 52, h: 52, type: 'brick' },
    { x: 560, y: 350, w: 52, h: 52, type: 'brick' },
    { x: 620, y: 350, w: 52, h: 52, type: 'brick' },
    { x: 780, y: 405, w: 52, h: 52, type: 'brick' },
    { x: 1250, y: 390, w: 52, h: 52, type: 'question' },
    { x: 1310, y: 390, w: 52, h: 52, type: 'question' },
    { x: 1600, y: 420, w: 90, h: 70, type: 'pipe' },
    { x: 1880, y: 360, w: 90, h: 130, type: 'pipe' },
    { x: 2160, y: 420, w: 90, h: 70, type: 'pipe' },
    { x: 2460, y: 390, w: 52, h: 52, type: 'brick' },
    { x: 2520, y: 330, w: 52, h: 52, type: 'brick' },
    { x: 2580, y: 270, w: 52, h: 52, type: 'brick' },
    { x: 2900, y: 420, w: 90, h: 70, type: 'pipe' },
    { x: 3200, y: 390, w: 52, h: 52, type: 'question' },
    { x: 3280, y: 390, w: 52, h: 52, type: 'brick' },
    { x: 3340, y: 390, w: 52, h: 52, type: 'brick' },
    { x: 3525, y: 350, w: 52, h: 52, type: 'brick' },
    { x: 3585, y: 290, w: 52, h: 52, type: 'brick' },
    { x: 3645, y: 230, w: 52, h: 52, type: 'brick' },
  ];

  level.solids.push(...staticBlocks);
}

function makeCoins() {
  const positions = [
    520, 600, 660, 820, 1245, 1315, 2490, 2525, 2590, 3200, 3320, 3555, 3615,
  ];

  positions.forEach((x) => {
    level.coins.push({ x, y: 330, r: 8, collected: false, bob: Math.random() * Math.PI * 2 });
  });
}

function makeEnemies() {
  level.enemies = [
    { x: 780, y: 460, w: 26, h: 26, vx: -1.2, alive: true },
    { x: 1520, y: 460, w: 26, h: 26, vx: -1.1, alive: true },
    { x: 1720, y: 460, w: 26, h: 26, vx: 1.15, alive: true },
    { x: 2400, y: 460, w: 26, h: 26, vx: -1.2, alive: true },
    { x: 3050, y: 460, w: 26, h: 26, vx: 1.3, alive: true },
    { x: 3450, y: 460, w: 26, h: 26, vx: -1.25, alive: true },
  ];
}

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

function resetGame() {
  state.score = 0;
  state.lives = 3;
  state.coins = 0;
  state.win = false;
  state.gameOver = false;
  player.x = 80;
  player.y = 320;
  player.vx = 0;
  player.vy = 0;
  player.onGround = false;
  player.dir = 1;
  player.invuln = 0;
  level.solids = [];
  level.coins = [];
  makeGround();
  makeCoins();
  makeEnemies();
  cameraX = 0;
}

window.addEventListener('keydown', (event) => {
  const key = event.key.toLowerCase();
  if (['arrowleft', 'arrowright', 'arrowup', ' ', 'a', 'd', 'w'].includes(key)) {
    event.preventDefault();
  }
  keys[key] = true;
});

window.addEventListener('keyup', (event) => {
  keys[event.key.toLowerCase()] = false;
});

function updatePlayer() {
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
      player.x = 80;
      player.y = 300;
      player.vx = 0;
      player.vy = 0;
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

  if (player.x > level.flagpole.x - 20) {
    state.win = true;
  }
}

function updateEnemies() {
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
  if (state.win || state.gameOver) {
    return;
  }

  timer += 1;
  updatePlayer();
  updateEnemies();

  const targetCamera = player.x - canvas.width * 0.35;
  cameraX += (targetCamera - cameraX) * 0.12;
  cameraX = Math.max(0, Math.min(cameraX, level.width - canvas.width));
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
      const tileSize = 52;
      for (let y = 0; y < solid.h; y += tileSize) {
        for (let x = 0; x < solid.w; x += tileSize) {
          ctx.drawImage(
            groundSprite,
            sx + x,
            solid.y + y,
            tileSize,
            tileSize
          );
        }
      }
      return;
    }
  }

  if (solid.type === 'brick' || solid.type === 'question') {
    const sprite = worldSprites.brick;
    if (sprite.complete && sprite.naturalWidth > 0) {
      const tileSize = 52;
      ctx.drawImage(sprite, sx, solid.y, tileSize, tileSize);
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
  const x = level.flagpole.x - cameraX;
  const poleX = x;
  ctx.fillStyle = '#e5d9b2';
  ctx.fillRect(poleX, level.flagpole.y, 10, level.flagpole.h);
  ctx.fillStyle = '#f74747';
  ctx.fillRect(poleX + 10, 150, 70, 40);
  ctx.fillStyle = '#fff';
  ctx.fillRect(poleX + 18, 160, 8, 18);
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

function draw() {
  drawBackground();

  for (const solid of level.solids) {
    drawSolid(solid);
  }

  drawCoins();
  drawFlagpole();
  for (const enemy of level.enemies) {
    drawEnemy(enemy);
  }
  drawPlayer();
  drawHUD();
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

window.addEventListener('keydown', (event) => {
  if (event.key.toLowerCase() === 'r') {
    resetGame();
  }
});

resetGame();
requestAnimationFrame(loop);
