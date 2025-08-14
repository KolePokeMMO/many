import * as THREE from "https://esm.sh/three";

const minTileIndex = -8;
const maxTileIndex = 8;
const tilesPerRow = maxTileIndex - minTileIndex + 1;
const tileSize = 42;

function Camera() {
  const size = 300;
  const viewRatio = window.innerWidth / window.innerHeight;
  const width = viewRatio < 1 ? size : size * viewRatio;
  const height = viewRatio < 1 ? size / viewRatio : size;

  const camera = new THREE.OrthographicCamera(
    width / -2, // left
    width / 2, // right
    height / 2, // top
    height / -2, // bottom
    100, // near
    900 // far
  );

  camera.up.set(0, 0, 1);
  camera.position.set(300, -300, 300);
  camera.lookAt(0, 0, 0);

  return camera;
}

function Texture(width, height, rects) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  context.fillStyle = "#ffffff";
  context.fillRect(0, 0, width, height);
  context.fillStyle = "rgba(0,0,0,0.6)";
  rects.forEach((rect) => {
    context.fillRect(rect.x, rect.y, rect.w, rect.h);
  });
  return new THREE.CanvasTexture(canvas);
}

function TombstoneTexture(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");

  // Grey stone background
  context.fillStyle = "#aaaaaa";
  context.fillRect(0, 0, width, height);

  // RIP text
  context.fillStyle = "#222222"; // dark letters
  const fontSize = Math.floor(height * 0.25); // slightly smaller to fit
  context.font = `bold ${fontSize}px Arial`;
  context.textAlign = "center";
  context.textBaseline = "middle";

  context.fillText("RIP", width / 2, height / 2);

  return new THREE.CanvasTexture(canvas);
}

const carriageFrontTexture = new Texture(40, 80, [{ x: 0, y: 10, w: 30, h: 60 }]);
const carriageBackTexture = new Texture(40, 80, [{ x: 10, y: 10, w: 30, h: 60 }]);
const carriageRightSideTexture = new Texture(110, 40, [
  { x: 10, y: 0, w: 50, h: 30 },
  { x: 70, y: 0, w: 30, h: 30 },
]);
const carriageLeftSideTexture = new Texture(110, 40, [
  { x: 10, y: 10, w: 50, h: 30 },
  { x: 70, y: 10, w: 30, h: 30 },
]);

export const hearseFrontTexture = Texture(30, 30, [
  { x: 5, y: 0, w: 10, h: 30 },
]);
export const hearseRightSideTexture = Texture(25, 30, [
  { x: 15, y: 5, w: 10, h: 10 },
]);
export const hearseLeftSideTexture = Texture(25, 30, [
  { x: 15, y: 15, w: 10, h: 10 },
]);




function HauntedCarriageTexture(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Dark carriage body
  ctx.fillStyle = "#333333";
  ctx.fillRect(0, 0, width, height);

  // Ghostly purple wheels
  ctx.fillStyle = "#8e44ad";
  ctx.beginPath();
  ctx.arc(width * 0.2, height - 5, 5, 0, 2 * Math.PI);
  ctx.arc(width * 0.8, height - 5, 5, 0, 2 * Math.PI);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}

function HearseTexture(width, height) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");

  // Sleek black hearse
  ctx.fillStyle = "#111111";
  ctx.fillRect(0, 0, width, height);

  // Subtle windows glowing faintly purple
  ctx.fillStyle = "#4b0082";
  ctx.fillRect(width * 0.2, height * 0.2, width * 0.6, height * 0.4);

  // Wheels
  ctx.fillStyle = "#222222";
  ctx.beginPath();
  ctx.arc(width * 0.2, height - 5, 4, 0, 2 * Math.PI);
  ctx.arc(width * 0.8, height - 5, 4, 0, 2 * Math.PI);
  ctx.fill();

  return new THREE.CanvasTexture(canvas);
}






function Carriage(initialTileIndex, direction) {
  const carriage = new THREE.Group();
  carriage.position.x = initialTileIndex * tileSize;
  if (!direction) carriage.rotation.z = Math.PI;

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(60, 30, 15),
    new THREE.MeshLambertMaterial({ map: HauntedCarriageTexture(60, 30), flatShading: true })
  );
  main.position.z = 12;
  main.castShadow = true;
  main.receiveShadow = true;
  carriage.add(main);

  // Wheels as small cylinders
  const wheelOffsetX = 20;
  const wheelOffsetZ = 5;
  [-1, 1].forEach((side) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(5, 5, 3, 16),
      new THREE.MeshLambertMaterial({ color: 0x8e44ad })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(side * wheelOffsetX, 0, wheelOffsetZ);
    carriage.add(wheel);
  });

  return carriage;
}

function Hearse(initialTileIndex, direction) {
  const hearse = new THREE.Group();
  hearse.position.x = initialTileIndex * tileSize;
  if (!direction) hearse.rotation.z = Math.PI;

  const main = new THREE.Mesh(
    new THREE.BoxGeometry(70, 35, 35),
    new THREE.MeshLambertMaterial({ map: HearseTexture(70, 35), flatShading: true })
  );
  main.position.z = 20;
  main.castShadow = true;
  main.receiveShadow = true;
  hearse.add(main);

  // Wheels
  const wheelOffsetX = 25;
  const wheelOffsetZ = 5;
  [-1, 1].forEach((side) => {
    const wheel = new THREE.Mesh(
      new THREE.CylinderGeometry(4, 4, 3, 16),
      new THREE.MeshLambertMaterial({ color: 0x222222 })
    );
    wheel.rotation.x = Math.PI / 2;
    wheel.position.set(side * wheelOffsetX, 0, wheelOffsetZ);
    hearse.add(wheel);
  });

  return hearse;
}

















function DirectionalLight() {
  const dirLight = new THREE.DirectionalLight();
  dirLight.position.set(-100, -100, 200);
  dirLight.up.set(0, 0, 1);
  dirLight.castShadow = true;

  dirLight.shadow.mapSize.width = 2048;
  dirLight.shadow.mapSize.height = 2048;

  dirLight.shadow.camera.up.set(0, 0, 1);
  dirLight.shadow.camera.left = -400;
  dirLight.shadow.camera.right = 400;
  dirLight.shadow.camera.top = 400;
  dirLight.shadow.camera.bottom = -400;
  dirLight.shadow.camera.near = 50;
  dirLight.shadow.camera.far = 400;

  return dirLight;
}

function Grass(rowIndex) {
  const grass = new THREE.Group();
  grass.position.y = rowIndex * tileSize;

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.BoxGeometry(tilesPerRow * tileSize, tileSize, 3),
      new THREE.MeshLambertMaterial({ color })
    );

  const middle = createSection(0xbaf455);
  middle.receiveShadow = true;
  grass.add(middle);

  const left = createSection(0x99c846);
  left.position.x = -tilesPerRow * tileSize;
  grass.add(left);

  const right = createSection(0x99c846);
  right.position.x = tilesPerRow * tileSize;
  grass.add(right);

  return grass;
}

const metadata = [];

const map = new THREE.Group();

function initializeMap() {
  // Remove all rows
  metadata.length = 0;
  map.remove(...map.children);

  // Add new rows
  for (let rowIndex = 0; rowIndex > -10; rowIndex--) {
    const grass = Grass(rowIndex);
    map.add(grass);
  }
  addRows();
}

function addRows() {
  const newMetadata = generateRows(20);

  const startIndex = metadata.length;
  metadata.push(...newMetadata);

  newMetadata.forEach((rowData, index) => {
    const rowIndex = startIndex + index + 1;

    if (rowData.type === "tombstone") {
      const row = Grass(rowIndex);

      rowData.tombstones.forEach(({ tileIndex, height }) => {
        const three = Tombstone(tileIndex, height);
        row.add(three);
      });

      map.add(row);
    }

    if (rowData.type === "carriage") {
      const row = Road(rowIndex);

      rowData.vehicles.forEach((vehicle) => {
        const carriage = Carriage(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = carriage;
        row.add(carriage);
      });

      map.add(row);
    }

    if (rowData.type === "hearse") {
      const row = Road(rowIndex);

      rowData.vehicles.forEach((vehicle) => {
        const hearse = Hearse(
          vehicle.initialTileIndex,
          rowData.direction,
          vehicle.color
        );
        vehicle.ref = hearse;
        row.add(hearse);
      });

      map.add(row);
    }
  });
}

const player = Player();

function Player() {
  const player = new THREE.Group();

  // -----------------------
  // Main body
  // -----------------------
  const body = new THREE.Mesh(
    new THREE.SphereGeometry(10, 16, 16),
    new THREE.MeshLambertMaterial({ color: 0x5a0ea0, flatShading: true })
  );
  body.position.z = 10;
  body.castShadow = true;
  body.receiveShadow = true;
  player.add(body);

  // -----------------------
  // Ears
  // -----------------------
  const ears = [];
  function createEar(xOffset) {
    const ear = new THREE.Mesh(
      new THREE.ConeGeometry(3, 8, 3),
      new THREE.MeshLambertMaterial({ color: 0x5a0ea0, flatShading: true })
    );
    ear.position.set(xOffset, -3, 18);
    ear.rotation.z = xOffset > 0 ? -0.2 : 0.2;
    player.add(ear);
    ears.push(ear);
  }
  createEar(-6);
  createEar(6);

  // -----------------------
  // Container & hover animation
  // -----------------------
  const playerContainer = new THREE.Group();
  playerContainer.add(player);

  playerContainer.userData.hoverOffset = Math.random() * 100;

  playerContainer.userData.animateHover = function (time) {
    // Floating body
    const hoverHeight = Math.sin(time + this.hoverOffset) * 2;
    player.position.z = 10 + hoverHeight;

  };

  return playerContainer;
}

const position = {
  currentRow: 0,
  currentTile: 0,
};

const movesQueue = [];

function initializePlayer() {
  // Initialize the Three.js player object
  player.position.x = 0;
  player.position.y = 0;
  player.children[0].position.z = 0;

  // Initialize metadata
  position.currentRow = 0;
  position.currentTile = 0;

  // Clear the moves queue
  movesQueue.length = 0;
}

function queueMove(direction) {
  const isValidMove = endsUpInValidPosition(
    {
      rowIndex: position.currentRow,
      tileIndex: position.currentTile,
    },
    [...movesQueue, direction]
  );

  if (!isValidMove) return;

  movesQueue.push(direction);
}

function stepCompleted() {
  const direction = movesQueue.shift();

  if (direction === "forward") position.currentRow += 1;
  if (direction === "backward") position.currentRow -= 1;
  if (direction === "left") position.currentTile -= 1;
  if (direction === "right") position.currentTile += 1;

  // Add new rows if the player is running out of them
  if (position.currentRow > metadata.length - 10) addRows();

  const scoreDOM = document.getElementById("score");
  if (scoreDOM) scoreDOM.innerText = position.currentRow.toString();
}

function Renderer() {
  const canvas = document.querySelector("canvas.game");
  if (!canvas) throw new Error("Canvas not found");

  const renderer = new THREE.WebGLRenderer({
    alpha: true,
    antialias: true,
    canvas: canvas,
  });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.shadowMap.enabled = true;

  return renderer;
}

function Road(rowIndex) {
  const road = new THREE.Group();
  road.position.y = rowIndex * tileSize;

  const createSection = (color) =>
    new THREE.Mesh(
      new THREE.PlaneGeometry(tilesPerRow * tileSize, tileSize),
      new THREE.MeshLambertMaterial({ color })
    );

  const middle = createSection(0x454a59);
  middle.receiveShadow = true;
  road.add(middle);

  const left = createSection(0x393d49);
  left.position.x = -tilesPerRow * tileSize;
  road.add(left);

  const right = createSection(0x393d49);
  right.position.x = tilesPerRow * tileSize;
  road.add(right);

  return road;
}

function Tombstone(tileIndex, height) {
  const tombstone = new THREE.Group();
  tombstone.position.x = tileIndex * tileSize;

  // Base block
  const base = new THREE.Mesh(
    new THREE.BoxGeometry(15, 15, 8),
    new THREE.MeshLambertMaterial({ color: 0x555555, flatShading: true })
  );
  base.position.z = 4;
  tombstone.add(base);

  // "RIP" texture on all four vertical sides
  const ripTexture = TombstoneTexture(64, 128);
  const ripMat = new THREE.MeshLambertMaterial({ map: ripTexture, flatShading: true });
  const plainMat = new THREE.MeshLambertMaterial({ color: 0xaaaaaa, flatShading: true });
  ripTexture.anisotropy = (new THREE.WebGLRenderer()).capabilities.getMaxAnisotropy?.() || 1;


  // BoxGeometry(width=X, height=Y, depth=Z). With Z = up in your scene:
  // materials = [ +X, -X, +Y, -Y, +Z (top), -Z (bottom) ]
  const stone = new THREE.Mesh(new THREE.BoxGeometry(20, 8, height), [
    ripMat,    // +X side
    ripMat,    // -X side
    ripMat,    // +Y side
    ripMat,    // -Y side
    plainMat,  // +Z (top cap)
    plainMat,  // -Z (bottom cap)
  ]);

  stone.position.z = height / 2 + 8;
  stone.castShadow = true;
  stone.receiveShadow = true;
  tombstone.add(stone);

  return tombstone;
}

function Hearse(initialTileIndex, direction, color) {
  const hearse = new THREE.Group();
  hearse.position.x = initialTileIndex * tileSize;
  if (!direction) hearse.rotation.z = Math.PI;

  const cargo = new THREE.Mesh(
    new THREE.BoxGeometry(70, 35, 35),
    new THREE.MeshLambertMaterial({
      color: 0xb4c6fc,
      flatShading: true,
    })
  );
  cargo.position.x = -15;
  cargo.position.z = 25;
  cargo.castShadow = true;
  cargo.receiveShadow = true;
  hearse.add(cargo);

  const cabin = new THREE.Mesh(new THREE.BoxGeometry(30, 30, 30), [
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: hearseFrontTexture,
    }), // front
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
    }), // back
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: hearseLeftSideTexture,
    }),
    new THREE.MeshLambertMaterial({
      color,
      flatShading: true,
      map: hearseRightSideTexture,
    }),
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // top
    new THREE.MeshPhongMaterial({ color, flatShading: true }), // bottom
  ]);
  cabin.position.x = 35;
  cabin.position.z = 20;
  cabin.castShadow = true;
  cabin.receiveShadow = true;

  hearse.add(cabin);

  const frontWheel = Wheel(37);
  hearse.add(frontWheel);

  const middleWheel = Wheel(5);
  hearse.add(middleWheel);

  const backWheel = Wheel(-35);
  hearse.add(backWheel);

  return hearse;
}

function Wheel(x) {
  const wheel = new THREE.Mesh(
    new THREE.BoxGeometry(12, 33, 12),
    new THREE.MeshLambertMaterial({
      color: 0x333333,
      flatShading: true,
    })
  );
  wheel.position.x = x;
  wheel.position.z = 6;
  return wheel;
}

function calculateFinalPosition(currentPosition, moves) {
  return moves.reduce((position, direction) => {
    if (direction === "forward")
      return {
        rowIndex: position.rowIndex + 1,
        tileIndex: position.tileIndex,
      };
    if (direction === "backward")
      return {
        rowIndex: position.rowIndex - 1,
        tileIndex: position.tileIndex,
      };
    if (direction === "left")
      return {
        rowIndex: position.rowIndex,
        tileIndex: position.tileIndex - 1,
      };
    if (direction === "right")
      return {
        rowIndex: position.rowIndex,
        tileIndex: position.tileIndex + 1,
      };
    return position;
  }, currentPosition);
}

function endsUpInValidPosition(currentPosition, moves) {
  // Calculate where the player would end up after the move
  const finalPosition = calculateFinalPosition(currentPosition, moves);

  // Detect if we hit the edge of the board
  if (
    finalPosition.rowIndex === -1 ||
    finalPosition.tileIndex === minTileIndex - 1 ||
    finalPosition.tileIndex === maxTileIndex + 1
  ) {
    // Invalid move, ignore move command
    return false;
  }

  // Detect if we hit a tombstone
  const finalRow = metadata[finalPosition.rowIndex - 1];
  if (
    finalRow &&
    finalRow.type === "tombstone" &&
    finalRow.tombstones.some((tombstone) => tombstone.tileIndex === finalPosition.tileIndex)
  ) {
    // Invalid move, ignore move command
    return false;
  }

  return true;
}

function generateRows(amount) {
  const rows = [];
  for (let i = 0; i < amount; i++) {
    const rowData = generateRow();
    rows.push(rowData);
  }
  return rows;
}

function generateRow() {
  const type = randomElement(["carriage", "hearse", "tombstone"]);
  if (type === "carriage") return generateCarriageLaneMetadata();
  if (type === "hearse") return generateHearseLaneMetadata();
  return generateTombstoneMetadata();
}

function randomElement(array) {
  return array[Math.floor(Math.random() * array.length)];
}

function generateTombstoneMetadata() {
  const occupiedTiles = new Set();
  const tombstones = Array.from({ length: 4 }, () => {
    let tileIndex;
    do {
      tileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(tileIndex));
    occupiedTiles.add(tileIndex);

    const height = randomElement([20, 45, 60]);

    return { tileIndex, height };
  });

  return { type: "tombstone", tombstones };
}

function generateCarriageLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();

  const vehicles = Array.from({ length: 3 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);

    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);

    return { initialTileIndex, color };
  });

  return { type: "carriage", direction, speed, vehicles };
}

function generateHearseLaneMetadata() {
  const direction = randomElement([true, false]);
  const speed = randomElement([125, 156, 188]);

  const occupiedTiles = new Set();

  const vehicles = Array.from({ length: 2 }, () => {
    let initialTileIndex;
    do {
      initialTileIndex = THREE.MathUtils.randInt(minTileIndex, maxTileIndex);
    } while (occupiedTiles.has(initialTileIndex));
    occupiedTiles.add(initialTileIndex - 2);
    occupiedTiles.add(initialTileIndex - 1);
    occupiedTiles.add(initialTileIndex);
    occupiedTiles.add(initialTileIndex + 1);
    occupiedTiles.add(initialTileIndex + 2);

    const color = randomElement([0xa52523, 0xbdb638, 0x78b14b]);

    return { initialTileIndex, color };
  });

  return { type: "hearse", direction, speed, vehicles };
}

const moveClock = new THREE.Clock(false);

function animatePlayer() {
  if (!movesQueue.length) return;

  if (!moveClock.running) moveClock.start();

  const stepTime = 0.2; // Seconds it takes to take a step
  const progress = Math.min(1, moveClock.getElapsedTime() / stepTime);

  setPosition(progress);
  setRotation(progress);

  // Once a step has ended
  if (progress >= 1) {
    stepCompleted();
    moveClock.stop();
  }
}

function setPosition(progress) {
  const startX = position.currentTile * tileSize;
  const startY = position.currentRow * tileSize;
  let endX = startX;
  let endY = startY;

  if (movesQueue[0] === "left") endX -= tileSize;
  if (movesQueue[0] === "right") endX += tileSize;
  if (movesQueue[0] === "forward") endY += tileSize;
  if (movesQueue[0] === "backward") endY -= tileSize;

  player.position.x = THREE.MathUtils.lerp(startX, endX, progress);
  player.position.y = THREE.MathUtils.lerp(startY, endY, progress);
  player.children[0].position.z = Math.sin(progress * Math.PI) * 8;
}

function setRotation(progress) {
  let endRotation = 0;
  if (movesQueue[0] == "forward") endRotation = 0;
  if (movesQueue[0] == "left") endRotation = Math.PI / 2;
  if (movesQueue[0] == "right") endRotation = -Math.PI / 2;
  if (movesQueue[0] == "backward") endRotation = Math.PI;

  player.children[0].rotation.z = THREE.MathUtils.lerp(
    player.children[0].rotation.z,
    endRotation,
    progress
  );
}

const clock = new THREE.Clock();

function animateVehicles() {
  const delta = clock.getDelta();

  // Animate carriages and hearses
  metadata.forEach((rowData) => {
    if (rowData.type === "carriage" || rowData.type === "hearse") {
      const beginningOfRow = (minTileIndex - 2) * tileSize;
      const endOfRow = (maxTileIndex + 2) * tileSize;

      rowData.vehicles.forEach(({ ref }) => {
        if (!ref) throw Error("Vehicle reference is missing");

        if (rowData.direction) {
          ref.position.x =
            ref.position.x > endOfRow
              ? beginningOfRow
              : ref.position.x + rowData.speed * delta;
        } else {
          ref.position.x =
            ref.position.x < beginningOfRow
              ? endOfRow
              : ref.position.x - rowData.speed * delta;
        }
      });
    }
  });
}

document
  .getElementById("forward")
  ?.addEventListener("click", () => queueMove("forward"));

document
  .getElementById("backward")
  ?.addEventListener("click", () => queueMove("backward"));

document
  .getElementById("left")
  ?.addEventListener("click", () => queueMove("left"));

document
  .getElementById("right")
  ?.addEventListener("click", () => queueMove("right"));

window.addEventListener("keydown", (event) => {
  if (event.key === "ArrowUp") {
    event.preventDefault(); // Avoid scrolling the page
    queueMove("forward");
  } else if (event.key === "ArrowDown") {
    event.preventDefault(); // Avoid scrolling the page
    queueMove("backward");
  } else if (event.key === "ArrowLeft") {
    event.preventDefault(); // Avoid scrolling the page
    queueMove("left");
  } else if (event.key === "ArrowRight") {
    event.preventDefault(); // Avoid scrolling the page
    queueMove("right");
  }
});

let gameOver = false;

function hitTest() {
  if (gameOver) return; // Skip if game is over

  const row = metadata[position.currentRow - 1];
  if (!row) return;

  if (row.type === "carriage" || row.type === "hearse") {
    const playerBox = new THREE.Box3().setFromObject(player);

    row.vehicles.forEach(({ ref }) => {
      if (!ref) return;

      const vehicleBox = new THREE.Box3().setFromObject(ref);
      if (playerBox.intersectsBox(vehicleBox)) {
        gameOver = true;
        if (resultDOM && finalScoreDOM) {
          resultDOM.style.visibility = "visible";
          finalScoreDOM.innerText = position.currentRow.toString();
        }
      }
    });
  }
}

const scene = new THREE.Scene();
scene.add(player);
scene.add(map);

const ambientLight = new THREE.AmbientLight();
scene.add(ambientLight);

const dirLight = DirectionalLight();
dirLight.target = player;
player.add(dirLight);

const camera = Camera();
player.add(camera);

const scoreDOM = document.getElementById("score");
const resultDOM = document.getElementById("result-container");
const finalScoreDOM = document.getElementById("final-score");

initializeGame();

document.querySelector("#retry")?.addEventListener("click", () => {
  gameOver = false;
  initializeGame();
});

function initializeGame() {
  initializePlayer();
  initializeMap();

  // Initialize UI
  if (scoreDOM) scoreDOM.innerText = "0";
  if (resultDOM) resultDOM.style.visibility = "hidden";
}

const renderer = Renderer();
renderer.setAnimationLoop(animate);

function animate() {
  const time = performance.now() / 1000; // seconds

  if (!gameOver) {
    animateVehicles();
    animatePlayer();
    hitTest();

    // <-- Add this line for Gengar hover -->
    player.userData.animateHover(time);
  }

  renderer.render(scene, camera);
}
