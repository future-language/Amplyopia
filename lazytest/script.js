/* ======================== GAMES ARRAY ======================= */
const levels = [
    {
        name: "Level 1",
        games: [
            { name: "Different Color", play: differentColorGame },
            { name: "Butterflies", play: butterfliesGame },
            { name: "Color Word Match", play: colorWordMatchGame }
        ]
    },
    {
        name: "Level 2",
        games: [
            { name: "Memory Positioning", play: memoryPositioningGame },
            { name: "Slide Puzzle", play: slidePuzzleGame },
            { name: "Which is Brighter?", play: whichIsBrighterGame }
        ]
    }
];

let currentLevel = 0;
let currentGame = 0;
let levelScores = [[], []];
let completedGames = [[], []];

/* ======================== ELEMENTS ========================== */
const mainMenu = document.getElementById('main-menu');
const videosBtn = document.getElementById('videos-btn');
const videoSection = document.getElementById('video-section');
const backFromVideoBtn = document.getElementById('back-from-video');
const levelGames = document.getElementById('level-games');
const gamesList = document.getElementById('games-list');
const gameArea = document.getElementById('game-area');
const gameResult = document.getElementById('game-result');
const resultMsg = document.getElementById('result-msg');
const scoreMsg = document.getElementById('score-msg');
const giftScreen = document.getElementById('gift-screen');
const giftMsg = document.getElementById('gift-msg');
const continueBtn = document.getElementById('continue-btn');
const finalScreen = document.getElementById('final-screen');
const finalScore = document.getElementById('final-score');
const playAgainBtn = document.getElementById('play-again');
const returnMainBtn = document.getElementById('return-main');
const levelTitle = document.getElementById('level-title');
const backMainBtn = document.getElementById('back-main');
const backToGamesBtn = document.getElementById('back-to-games');
const level1Btn = document.getElementById('level1-btn');
const level2Btn = document.getElementById('level2-btn');

function show(el) { el.classList.remove('hidden'); }
function hide(...els) { els.forEach(e => e.classList.add('hidden')); }

/* =========== MAIN MENU & LEVEL LOGIC =========== */
level1Btn.onclick = () => openLevel(0);
level2Btn.onclick = () => openLevel(1);

function openLevel(lvl) {
    currentLevel = lvl;
    updateGamesList();
    levelTitle.textContent = levels[lvl].name;
    show(levelGames);
    hide(mainMenu, gameArea, gameResult, giftScreen, finalScreen);
}
backMainBtn.onclick = () => {
    hide(levelGames);
    show(mainMenu);
}

/* =========== UPDATE GAMES LIST =========== */
function updateGamesList() {
    gamesList.innerHTML = '';
    levels[currentLevel].games.forEach((game, i) => {
        const card = document.createElement('div');
        card.className = 'game-card' + (completedGames[currentLevel][i] ? ' completed' : '');
        card.textContent = game.name;
        card.onclick = () => startGame(i);
        gamesList.appendChild(card);
    });
}

/* =========== START GAME =========== */
function startGame(idx) {
    currentGame = idx;
    levels[currentLevel].games[idx].play(() => {
        // callback after game finished
    });
}

/* =========== SHOW RESULT AFTER GAME =========== */
function showGameResult(score, encouragement, callback) {
    hide(gameArea);
    show(gameResult);
    resultMsg.textContent = encouragement;
    scoreMsg.textContent = `You scored: ${score}`;
    levelScores[currentLevel][currentGame] = score;
    completedGames[currentLevel][currentGame] = true;
    backToGamesBtn.onclick = () => {
        hide(gameResult);
        updateGamesList();
        show(levelGames);

        if (completedGames[currentLevel].filter(Boolean).length === levels[currentLevel].games.length) {
            setTimeout(showGiftScreen, 700);
        }
    }
}

/* =========== GIFT SCREEN & FINAL =========== */
function showGiftScreen() {
    hide(levelGames, gameResult, gameArea);
    show(giftScreen);
    let total = levelScores[currentLevel].reduce((a,b)=>a+b,0);

    // أضف الأنيميشن لو انت في Level 1
    if(currentLevel === 0){
        giftMsg.innerHTML = `
            <div style="width:180px; margin:0 auto 1rem auto;">
                <img src="Animation - 1752044468269.gif" style="width:100%;" alt="Gift Animation">
            </div>
            <b>Your total score: ${total}</b><br/>Enjoy your reward! 🎁<br/>
        `;
    }else{
        giftMsg.innerHTML = `<b>Your total score: ${total}</b><br/>Enjoy your reward! 🎁<br/>`;
    }

    playGiftSound();

    continueBtn.onclick = () => {
        hide(giftScreen);
        if(currentLevel===0){
            level2Btn.disabled = false;
            openLevel(1);
        }else{
            show(finalScreen);
            finalScore.innerHTML = `<b>Total Score: ${levelScores.flat().reduce((a,b)=>a+b,0)}</b>`;
        }
    }
}

function playGiftSound() {
    let audio = new Audio('https://cdn.pixabay.com/audio/2022/07/26/audio_124bfa5c47.mp3');
    audio.play();
}
playAgainBtn.onclick = () => {
    currentLevel = 0;
    currentGame = 0;
    levelScores = [[],[]];
    completedGames = [[],[]];
    level2Btn.disabled = true;
    hide(finalScreen, gameArea, gameResult, giftScreen, levelGames);
    show(mainMenu);
}
returnMainBtn.onclick = () => {
    hide(finalScreen, gameArea, gameResult, giftScreen, levelGames);
    show(mainMenu);
}

/* =========== SPLASH =========== */
window.onload = () => {
    show(document.getElementById("splash"));
    hide(mainMenu, levelGames, gameArea, gameResult, giftScreen, finalScreen);
    setTimeout(() => {
        document.getElementById("splash").classList.add('hide');
        setTimeout(() => {
            hide(document.getElementById("splash"));
            show(mainMenu);
            level2Btn.disabled = true;
        }, 600);
    }, 1700);
}

/* =========== HOVER SOUND EFFECT =========== */
document.addEventListener('DOMContentLoaded', function () {
    const hoverAudio = document.getElementById('btn-hover-sound');
    function isInGameBox(el) {
        let p = el.parentElement;
        while (p) {
            if (
                p.id === 'game-area' ||
                p.id === 'bf-container' ||
                p.classList.contains('bf-exit-btn-custom')
            ) return true;
            p = p.parentElement;
        }
        if (el.id && el.id.startsWith('bf-')) return true;
        if (el.className && el.className.indexOf('bf-') !== -1) return true;
        return false;
    }
    document.body.addEventListener('mouseenter', function (e) {
        if (
            (e.target.tagName === 'BUTTON' || e.target.classList.contains('game-card'))
            && !isInGameBox(e.target)
        ) {
            if (hoverAudio) {
                hoverAudio.currentTime = 0;
                hoverAudio.play();
            }
        }
    }, true);
});

/* ================== GAMES ================== */

/* 1. Butterflies Game */
let butterflyGameState = null;
function butterfliesGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    gameArea.innerHTML = `
    <div id="bf-container" style="position:relative;">
      <div id="bf-header">
        <h1>Butterfly Hunt</h1>
        <div id="bf-score-board">
          <span id="bf-score">Stars: 0</span>
          <span id="bf-timer">Time: 02:00</span>
        </div>
      </div>
      <div id="bf-area"></div>
      <div id="bf-message"></div>
      <div id="bf-cert"></div>
      <button id="bf-play-again" style="display:none;">Play Again</button>
      <button id="bf-finish-btn2" class="small-btn" style="display:none;margin-left:1.5rem;">Back to Games</button>
      <button id="bf-exit-btn" class="small-btn bf-exit-btn-custom" style="position:absolute;bottom:20px;right:22px;">⟵ Back</button>
      <audio id="bf-sound-correct" src="correct-156911.mp3" preload="auto"></audio>
      <audio id="bf-sound-wrong" src="wrong-47985.mp3" preload="auto"></audio>
    </div>
    `;

    let score = 0, timer = 120, level = 1, butterflies = [];
    let timerInterval, spawnInterval;
    let finished = false;

    if (butterflyGameState && butterflyGameState.active) {
        ({ score, timer, level } = butterflyGameState);
    }

    const scoreElement = document.getElementById('bf-score');
    const timerElement = document.getElementById('bf-timer');
    const messageElement = document.getElementById('bf-message');
    const certElement = document.getElementById('bf-cert');
    const area = document.getElementById('bf-area');
    const playAgainBtn = document.getElementById('bf-play-again');
    const finishBtn2 = document.getElementById('bf-finish-btn2');
    const exitBtn = document.getElementById('bf-exit-btn');
    const sndCorrect = document.getElementById('bf-sound-correct');
    const sndWrong = document.getElementById('bf-sound-wrong');

  const butterflyImages = [
  'img/butterfly (1).png','img/butterfly (2).png','img/butterfly (3).png',
  'img/butterfly.png','img/butterfly (6).png','img/silk-butterfly.png',
  'img/butterfly (9).png','img/butterfly (10).png','img/butterfly (11).png',
  'img/butterfly (12).png','img/butterfly (13).png','img/butterfly (15).png',
  'img/butterfly (16).png','img/butterfly (17).png','img/butterfly (18).png',
  'img/butterfly (19).png','img/nature.png','img/butterfly (20).png',
  'img/retro.png','img/stripes-wings-light-butterfly-beautiful-design-from-top-view.png',
  'img/summer (1).png','img/butterfly (21).png','img/butterfly (23).png',
  'img/butterfly (24).png','img/butterfly (26).png','img/butterfly (27).png',
  'img/nature (1).png','img/butterfly (28).png','img/butterfly (29).png',
  'img/butterfly (30).png','img/fly.png','img/butterfly (31).png',
  'img/butterfly (32).png','img/hand.png'
];


    function start(isResume = false) {
      updateUI();
      messageElement.textContent = '';
      certElement.textContent = '';
      butterflies = [];
      finished = false;
      area.innerHTML = '';
      area.style.backgroundImage = "url('./Register - Login.gif')";
      area.style.backgroundSize = "cover";
      area.style.backgroundPosition = "center";
      area.style.borderRadius = "10px";
      area.style.overflow = "hidden";
      area.style.height = "300px";
      area.style.position = "relative";
      playAgainBtn.style.display = "none";
      finishBtn2.style.display = "none";
      exitBtn.style.display = ""; // Show back btn
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      spawnButterflies();
      timerInterval = setInterval(() => {
          if (finished) return;
          timer--;
          updateUI();
          if (timer === 0 || score >= 20) {
            endGame();
          }
          saveState();
      }, 1000);
    }

    function updateUI() {
      scoreElement.textContent = `Stars: ${score}`;
      timerElement.textContent = `Time: ${formatTime(timer)}`;
    }

    function formatTime(seconds) {
      const minutes = Math.floor(seconds / 60);
      const remainingSeconds = seconds % 60;
      return `${String(minutes).padStart(2, '0')}:${String(remainingSeconds).padStart(2, '0')}`;
    }

    function spawnButterflies() {
      clearButterflies();
      clearInterval(spawnInterval);

      let isHarder = score >= 10;
      let butterflySize = isHarder ? 32 : 50;
      let totalButterflies = isHarder ? (15 + Math.floor(score / 2)) : (7 + level);

      const differentButterflyIndex = Math.floor(Math.random() * totalButterflies);
      const availableImages = [...butterflyImages];
      const differentImage = availableImages.splice(Math.floor(Math.random() * availableImages.length), 1)[0];

      messageElement.innerHTML = `Find the butterfly with this image: <img src="${differentImage}" style="width:40px;vertical-align:middle;">`;

      let i = 0;
      butterflies = [];
      spawnInterval = setInterval(() => {
        if (finished) {
          clearInterval(spawnInterval);
          return;
        }
        if (i >= totalButterflies) {
          clearInterval(spawnInterval);
          return;
        }
        const isDifferent = i === differentButterflyIndex;
        const butterfly = document.createElement('div');
        butterfly.classList.add('butterfly');
        const img = document.createElement('img');
        img.src = isDifferent ? differentImage : availableImages.splice(Math.floor(Math.random() * availableImages.length), 1)[0];
        img.style.width = '100%'; img.style.height = '100%';
        butterfly.appendChild(img);
        butterfly.style.left = `${Math.random() * 85}%`;
        butterfly.style.top = `${Math.random() * 72}%`;
        butterfly.style.position = 'absolute';
        butterfly.style.width = butterflySize + "px";
        butterfly.style.height = butterflySize + "px";
        butterfly.style.animation = 'fly 2s ease-in-out infinite';

        butterfly.onclick = function() {
          if (finished) return;
          if (isDifferent) {
            sndCorrect.currentTime = 0; sndCorrect.play();
            score++;
            updateUI();
            messageElement.textContent = 'Great job! Next level...';
            messageElement.style.color = "#0d954f";
            clearInterval(spawnInterval);
            setTimeout(() => {
              if (score === 20) {
                endGame();
              } else {
                level++;
                spawnButterflies();
              }
            }, 800);
          } else {
            sndWrong.currentTime = 0; sndWrong.play();
            messageElement.textContent = 'Oops! Try again.';
            messageElement.style.color = "red";
            setTimeout(() => {
              messageElement.innerHTML = `Find the butterfly with this image: <img src="${differentImage}" style="width:40px;vertical-align:middle;">`;
              messageElement.style.color = "#ff66b2";
            }, 1100);
          }
        };
        area.appendChild(butterfly);
        butterflies.push(butterfly);
        i++;
      }, 220);
    }

    function clearButterflies() {
      butterflies.forEach(bf => bf.remove());
      butterflies = [];
      area.innerHTML = '';
      clearInterval(spawnInterval);
    }

    function endGame() {
      finished = true;
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      clearButterflies();
      certElement.textContent = `You caught ${score} stars!`;
      playAgainBtn.style.display = '';
      finishBtn2.style.display = '';
      messageElement.textContent = "Game Over! Click Play Again or Back to Games";
      messageElement.style.color = "#0d954f";
      exitBtn.style.display = "none";
      butterflyGameState = null;
    }

    playAgainBtn.onclick = function() {
      butterflyGameState = null;
      score = 0; level = 1; timer = 120;
      start();
    }

    finishBtn2.onclick = function() {
      butterflyGameState = null;
      showGameResult(score, "Well done!", startGameCallback);
    }

    exitBtn.onclick = function() {
      clearInterval(timerInterval);
      clearInterval(spawnInterval);
      let percent = Math.floor((score / 20) * 100);
      percent = percent > 100 ? 100 : percent;
      saveState(true);
      alert(`You finished ${percent}% of the game.`);
      hide(gameArea);
      updateGamesList();
      show(levelGames);
    };

    function saveState(active=true) {
      butterflyGameState = {
        score,
        timer,
        level,
        active
      };
    }

    // CSS حركة و زر الرجوع لو مش متعرف فوق
    if (!document.getElementById('bf-fly-style')) {
      const style = document.createElement('style');
      style.id = 'bf-fly-style';
      style.innerHTML = `
      @keyframes fly {
        0% { transform: translateY(0);}
        50% { transform: translateY(-10px);}
        100% { transform: translateY(0);}
      }
      .bf-exit-btn-custom {
        position: absolute !important;
        right: 22px !important;
        bottom: 20px !important;
        min-width: 90px;
        font-size: 1rem;
        background: #ffd3e7;
        color: #333;
        z-index: 15;
      }
      @media (max-width: 600px) {
        .bf-exit-btn-custom { right: 2px !important; bottom: 12px !important;}
      }
      `;
      document.head.appendChild(style);
    }

    if (butterflyGameState && butterflyGameState.active) {
      start(true);
    } else {
      start();
    }
}

/* 2. Different Color */
// ========== Different Color Game WITH SOUNDS ==========

let differentColorState = null;
function differentColorGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 50, finished = false;
    if (differentColorState && !differentColorState.finished) {
        ({ score, timer, finished } = differentColorState);
    }
    let timerInterval;

    // --------- أصوات الإجابة ---------
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }
    // --------- END الأصوات ---------

    gameArea.innerHTML = `
    <div id="fdc-container" style="
        max-width: 520px;
        margin: 35px auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px #c9d7e866;
        padding: 30px 20px 26px 20px;
        border: 4px solid #f8b6d6;
        text-align:center;
        position:relative;
    ">
        <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;letter-spacing:1px;">Find the Different Color</h1>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
            <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Score: <span id="fdc-score">${score}</span></span>
            <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="fdc-timer">${timer}</span>s</span>
        </div>
        <div id="fdc-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:22px;margin-bottom:22px;min-height:310px;"></div>
        <div id="fdc-message" style="
            margin:16px 0 6px 0;
            min-height:27px;
            padding:8px 0;
            background:#fff5e0;
            border-radius:8px;
            color:#ae8d40;
            font-size:1.1rem;
            font-family:'Comic Sans MS';
        "></div>
        <button id="fdc-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
    </div>
    `;

    const grid = document.getElementById("fdc-grid");
    const scoreSpan = document.getElementById("fdc-score");
    const timerSpan = document.getElementById("fdc-timer");
    const msg = document.getElementById("fdc-message");

    function getRandomColor() {
        const base = Math.floor(Math.random() * 130 + 90);
        const sat = Math.floor(Math.random() * 30 + 40);
        return `hsl(${Math.floor(Math.random() * 360)},${sat}%,${base / 3}%)`;
    }
    function getSimilarColor(base, diff = 10) {
        let parts = base.match(/\d+/g).map(Number);
        parts[0] = (parts[0] + Math.floor(Math.random() * diff * 2 - diff) + 360) % 360;
        return `hsl(${parts[0]},${parts[1]}%,${parts[2]}%)`;
    }

    function renderGrid() {
        let gridSize = score < 5 ? 3 : score < 10 ? 4 : 5;
        grid.style.gridTemplateColumns = `repeat(${gridSize}, 1fr)`;
        grid.innerHTML = "";

        const mainColor = getRandomColor();
        const diffColor = getSimilarColor(mainColor, 12 + Math.max(1, 16 - score));
        const diffIdx = Math.floor(Math.random() * gridSize * gridSize);

        for (let i = 0; i < gridSize * gridSize; i++) {
            const cell = document.createElement("div");
            cell.style.background = (i === diffIdx) ? diffColor : mainColor;
            cell.style.borderRadius = "15px";
            cell.style.height = "105px";
            cell.style.width = "100%";
            cell.style.transition = "transform 0.16s, box-shadow 0.16s";
            cell.style.cursor = "pointer";
            cell.style.boxShadow = "0 2px 12px #bbbcf077";
            cell.onmouseenter = () => cell.style.transform = "scale(1.07)";
            cell.onmouseleave = () => cell.style.transform = "scale(1.0)";
            cell.onclick = function () {
                if (finished) return;
                if (i === diffIdx) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    scoreSpan.textContent = score;
                    msg.textContent = "Correct!";
                    msg.style.color = "#12af33";
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    msg.textContent = "Try again!";
                    msg.style.color = "#e12727";
                }
                saveState();
                setTimeout(nextRound, 720);
            };
            grid.appendChild(cell);
        }
    }

    function nextRound() {
        if (finished) return;
        if (score >= 13) { showEnd(); return; }
        msg.textContent = "";
        msg.style.color = "#ae8d40";
        renderGrid();
    }

    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        differentColorState = null;
        msg.textContent = `Game Over! Your score: ${score}`;
        msg.style.color = "#098810";
        setTimeout(() => {
            showGameResult(score, "Well done!", startGameCallback);
        }, 1200);
    }

    document.getElementById("fdc-back-btn").onclick = function () {
        clearInterval(timerInterval);
        saveState();
        let percent = Math.floor((score / 13) * 100);
        alert(`You finished ${percent}% of the game.`);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    function saveState() {
        differentColorState = { score, timer, finished };
    }

    timerSpan.textContent = timer;
    nextRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        saveState();
        if (timer <= 0) showEnd();
    }, 1000);
}


// ========== Color Word Match Game WITH SOUNDS ==========

let colorWordMatchState = null;
function colorWordMatchGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 60, finished = false, lastTarget = null;
    if (colorWordMatchState && !colorWordMatchState.finished) {
        ({ score, timer, finished, lastTarget } = colorWordMatchState);
    }
    let timerInterval;

    // --------- أصوات الإجابة ---------
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }
    // --------- END الأصوات ---------

    const colorWords = [
        { word: "orange", color: "#FFA500" },
        { word: "red",    color: "#FF0000" },
        { word: "green",  color: "#008000" },
        { word: "yellow", color: "#FFFF00" },
        { word: "blue",   color: "#0033FF" },
        { word: "purple", color: "#88187d" }
    ];

    gameArea.innerHTML = `
    <div id="cwm-container" style="
        max-width: 520px;
        margin: 35px auto;
        background: #fff;
        border-radius: 20px;
        box-shadow: 0 10px 30px #c9d7e866;
        padding: 30px 20px 26px 20px;
        border: 4px solid #f8b6d6;
        text-align:center;
        position:relative;
    ">
        <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;letter-spacing:1px;">Match the Color Word</h1>
        <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
            <span style="font-size:1.3rem;font-weight:bold;color:#396485;">Score: <span id="cwm-score">${score}</span></span>
            <span style="font-size:1.3rem;font-weight:bold;color:#396485;">Time: <span id="cwm-timer">${timer}</span>s</span>
        </div>
        <div id="cwm-grid" style="display:grid;grid-template-columns:repeat(3, 1fr);gap:20px;margin-bottom:20px;"></div>
        <div id="cwm-card" style="
            margin:20px 0 10px 0;
            padding: 18px 0;
            background: #8c44a0;
            border-radius: 12px;
            font-size:1.2rem;
            font-weight:bold;
            color:#fff;
            letter-spacing:1px;
        ">
            Color Card: <span id="cwm-card-word"></span>
        </div>
        <div id="cwm-message" style="font-family:'Comic Sans MS';font-size:1.08rem;color:#672176;min-height:32px;">
            Choose the color matching: <span id="cwm-choose-word"></span>
        </div>
        <button id="cwm-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
    </div>
    `;

    const scoreSpan = document.getElementById("cwm-score");
    const timerSpan = document.getElementById("cwm-timer");
    const grid = document.getElementById("cwm-grid");
    const card = document.getElementById("cwm-card");
    const cardWordSpan = document.getElementById("cwm-card-word");
    const message = document.getElementById("cwm-message");
    const chooseWordSpan = document.getElementById("cwm-choose-word");

    let currentTarget;

    function shuffleArray(arr) {
        return arr.map(a => [a, Math.random()]).sort((a, b) => a[1] - b[1]).map(a => a[0]);
    }

    function nextRound() {
        if (finished) return;
        if (score >= 12) { showEnd(); return; }
        if (lastTarget) {
            currentTarget = lastTarget;
            lastTarget = null;
        } else {
            currentTarget = colorWords[Math.floor(Math.random() * colorWords.length)];
        }
        card.style.background = currentTarget.color;
        cardWordSpan.textContent = currentTarget.word.charAt(0).toUpperCase() + currentTarget.word.slice(1);
        cardWordSpan.style.color = "#2d1226";
        chooseWordSpan.textContent = currentTarget.word.charAt(0).toUpperCase() + currentTarget.word.slice(1);

        let shuffled = shuffleArray(colorWords);
        grid.innerHTML = "";
        shuffled.forEach(item => {
            let btn = document.createElement("div");
            btn.style.background = item.color;
            btn.style.color = "#fff";
            btn.style.borderRadius = "15px";
            btn.style.height = "150px";
            btn.style.display = "flex";
            btn.style.alignItems = "center";
            btn.style.justifyContent = "center";
            btn.style.fontSize = "1.45rem";
            btn.style.fontWeight = "bold";
            btn.style.boxShadow = "0 2px 16px #b4b4b48c";
            btn.style.cursor = "pointer";
            btn.style.transition = "transform 0.19s, box-shadow 0.19s";
            btn.style.textTransform = "lowercase";
            btn.style.marginBottom = "0";
            btn.textContent = item.word;
            btn.onmouseenter = () => btn.style.transform = "scale(1.06)";
            btn.onmouseleave = () => btn.style.transform = "scale(1.00)";
            btn.onclick = function () {
                if (finished) return;
                if (item.word === currentTarget.word) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    scoreSpan.textContent = score;
                    message.textContent = "Correct!";
                    message.style.color = "#12af33";
                    lastTarget = null;
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    message.textContent = "Try again!";
                    message.style.color = "#e12727";
                    lastTarget = currentTarget;
                }
                saveState();
                setTimeout(nextRound, 700);
            }
            grid.appendChild(btn);
        });
    }

    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        colorWordMatchState = null;
        setTimeout(() => {
            showGameResult(score, "Well done!", startGameCallback);
        }, 850);
    }

    document.getElementById("cwm-back-btn").onclick = function () {
        clearInterval(timerInterval);
        saveState();
        let percent = Math.floor((score / 12) * 100);
        alert(`You finished ${percent}% of the game.`);
        hide(gameArea);
        updateGamesList();
        show(levelGames);
    };

    function saveState() {
        colorWordMatchState = { score, timer, finished, lastTarget };
    }

    timerSpan.textContent = timer;
    nextRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        timerSpan.textContent = timer;
        saveState();
        if (timer <= 0) showEnd();
    }, 1000);
}
/* 4. Memory Positioning Game (NEW!) */
let memoryPositioningState = null;
function memoryPositioningGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    // أصوات الإجابة
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }

    let state = memoryPositioningState && !memoryPositioningState.finished
        ? { ...memoryPositioningState }
        : { round: 0, totalScore: 0, finished: false, timer: 0 };
    let { round, totalScore, finished } = state;
    let mainTimer = null;

    // الرموز والراوندات
    const allSymbols = ["⭐", "❤️", "⬛", "🍀", "🔵", "🐶", "🍎", "🎈", "🌟", "🌸", "🚗", "🍓", "🥕", "🍔", "🧩"];
    // لكل راوند (10 راوندات) زمن خاص
    const rounds = [
        { n: 2, grid: 3, time: 18 },
        { n: 3, grid: 3, time: 20 },
        { n: 4, grid: 3, time: 22 },
        { n: 5, grid: 4, time: 24 },
        { n: 6, grid: 4, time: 26 },
        { n: 7, grid: 4, time: 28 },
        { n: 8, grid: 5, time: 30 },
        { n: 9, grid: 5, time: 33 },
        { n:10, grid: 5, time: 35 },
        { n:11, grid: 5, time: 37 }
    ];

    // زرار الباك خارج البوكس دايمًا يمين
    renderOuter();

    function renderOuter(innerHTML = "") {
        gameArea.innerHTML = `
        <div style="display:flex;justify-content:center;align-items:center;min-height:86vh;position:relative;">
            <div id="memory-box-holder">
                ${innerHTML}
            </div>
        </div>
        <button id="mp-back-btn" class="small-btn"
            style="position:fixed;right:32px;top:50%;transform:translateY(-50%);
                   background:#e9f0ff;border-radius:18px;box-shadow:0 2px 8px #dbe3ffb1;
                   font-size:1.18rem;color:#222;padding:11px 36px;z-index:1990;">
            &#8592; Back
        </button>
        `;
        setTimeout(() => {
            document.getElementById("mp-back-btn").onclick = function () {
                clearInterval(mainTimer);
                memoryPositioningState = { round, totalScore, finished };
                hide(gameArea);
                updateGamesList();
                show(levelGames);
            };
        }, 30);
        setTimeout(() => nextRound(), 80);
    }

    function nextRound() {
        if (finished) return;
        if (round >= rounds.length) {
            finished = true;
            memoryPositioningState = null;
            let encouragements = ["Amazing memory!", "Super job!", "You're a star!", "Wow, so sharp!"];
            setTimeout(() => showGameResult(totalScore, encouragements[Math.floor(Math.random()*encouragements.length)], startGameCallback), 1100);
            return;
        }

        let { n, grid: gridSize, time } = rounds[round];
        let symbols = allSymbols.slice(0, n);
        let gridArr = Array(gridSize * gridSize).fill(null);

        let positions = [];
        let spots = [];
        while (spots.length < n) {
            let idx = Math.floor(Math.random() * gridArr.length);
            if (!spots.includes(idx)) spots.push(idx);
        }
        spots.forEach((idx, i) => {
            gridArr[idx] = symbols[i];
            positions[i] = idx;
        });

        // شاشة الحفظ
        let html = `
            <div id="mp-container" style="
                width: min(420px,88vw);
                margin:0 auto;
                background:#fff;
                border-radius:25px;
                box-shadow:0 2px 18px #e8e8f3b2;
                padding:32px 18px 22px 18px;
                position:relative;
                ">
                <h2 style="color:#f54baf;font-family:'Comic Sans MS';font-size:2rem;margin-bottom:7px;font-weight:bold;">Memory Positioning</h2>
                <div style="color:#3553a6;font-size:1.22rem;font-weight:bold;margin-bottom:15px;">Round ${round+1} of 10</div>
                <div class="mp-grid" style="display:grid;grid-template-columns:repeat(${gridSize}, 1fr);gap:15px;justify-items:center;">
        `;
        gridArr.forEach(symbol => {
            html += `<div class="mp-cell" style="font-size:2.25rem;display:flex;align-items:center;justify-content:center;width:63px;height:63px;border-radius:15px;background:#f7f3fa;box-shadow:0 0 0.5px #e8e8f3c2;">${symbol ? symbol : ""}</div>`;
        });
        html += `</div>
            <div style="margin-top:18px;color:#aa955c;font-size:1.06rem;text-align:center;">Memorize the positions!</div>
        </div>`;

        document.getElementById("memory-box-holder").innerHTML = html;

        setTimeout(() => {
            askUser(time, positions, symbols, gridSize);
        }, 1900 + round * 70);
    }

    function askUser(time, positions, symbols, gridSize) {
        let gridArr = Array(gridSize * gridSize).fill(null);

        let html = `
            <div id="mp-container" style="
                width: min(420px,88vw);
                margin:0 auto;
                background:#fff;
                border-radius:25px;
                box-shadow:0 2px 18px #e8e8f3b2;
                padding:32px 18px 22px 18px;
                position:relative;
                ">
                <h2 style="color:#f54baf;font-family:'Comic Sans MS';font-size:2rem;margin-bottom:7px;font-weight:bold;">Memory Positioning</h2>
                <div style="color:#3553a6;font-size:1.22rem;font-weight:bold;margin-bottom:7px;float:left;text-align:left;">Round ${round+1} of 10</div>
                <div id="mp-timer" style="color:#d058d8;font-size:1.12rem;font-weight:bold;margin-bottom:7px;float:right;text-align:right;">Time: ${time}s</div>
                <div style="clear:both"></div>
                <div class="mp-grid" id="mp-answers" style="display:grid;grid-template-columns:repeat(${gridSize}, 1fr);gap:15px;justify-items:center;margin-bottom:8px;">
        `;
        for (let i = 0; i < gridArr.length; i++) {
            html += `<div class="mp-cell mp-select" data-idx="${i}" style="width:63px;height:63px;background:#f7f3fa;display:flex;align-items:center;justify-content:center;font-size:2.1rem;border-radius:15px;box-shadow:0 0 0.5px #e8e8f3c2;cursor:pointer;"></div>`;
        }
        html += `</div>
                <div class="mp-symbols" style="margin-top:7px;text-align:center;">`;
        symbols.forEach((symbol, i) => {
            html += `<button class="mp-symbol-btn" data-symbol="${i}" style="margin:0 8px 0 8px;font-size:1.35rem;border-radius:9px;padding:7px 14px;background:#fbe3fa;border:none;cursor:pointer;border:2px solid #f8daf5;">${symbol}</button>`;
        });
        html += `
                </div>
                <div id="mp-help" style="margin:12px 0 0 0;color:#aa8d58;font-size:1.06rem;">Click a symbol, then click its place!</div>
                <button id="mp-finish" class="small-btn" style="margin-top:18px;display:none;">Finish</button>
            </div>`;

        document.getElementById("memory-box-holder").innerHTML = html;

        let selectedSymbol = null;
        let answers = Array(symbols.length).fill(null);
        let finishedThisRound = false;

        // Timer setup
        let timeLeft = time;
        let timerEl = document.getElementById("mp-timer");
        clearInterval(mainTimer);
        mainTimer = setInterval(() => {
            if (finishedThisRound) return;
            timeLeft--;
            timerEl.textContent = "Time: " + timeLeft + "s";
            if (timeLeft <= 0) {
                clearInterval(mainTimer);
                handleFinish(positions, answers, symbols, gridSize, false);
            }
        }, 1000);

        document.querySelectorAll('.mp-symbol-btn').forEach(btn => {
            btn.onclick = function () {
                selectedSymbol = parseInt(btn.dataset.symbol);
                document.querySelectorAll('.mp-symbol-btn').forEach(b => b.style.background = "#fbe3fa");
                btn.style.background = "#f6b0ed";
                document.getElementById("mp-help").textContent = `Now click where "${symbols[selectedSymbol]}" was.`;
            }
        });
        document.querySelectorAll('.mp-select').forEach(cell => {
            cell.onclick = function () {
                if (selectedSymbol === null || finishedThisRound) return;
                let idx = parseInt(cell.dataset.idx);
                if (answers.includes(idx)) return;
                cell.textContent = symbols[selectedSymbol];
                answers[selectedSymbol] = idx;
                selectedSymbol = null;
                document.querySelectorAll('.mp-symbol-btn').forEach(b => b.style.background = "#fbe3fa");
                if (answers.every(a => a !== null)) {
                    document.getElementById("mp-finish").style.display = '';
                    document.getElementById("mp-help").textContent = "All done! Click Finish.";
                }
            }
        });
        document.getElementById("mp-finish").onclick = function () {
            handleFinish(positions, answers, symbols, gridSize, true);
        };

        // ======== finish logic and show results ========
        function handleFinish(positions, answers, symbols, gridSize, isManualFinish) {
            if (finishedThisRound) return;
            finishedThisRound = true;
            clearInterval(mainTimer);
            let correct = 0, wrongIdxs = [];
            answers.forEach((ans, i) => {
                if (ans === positions[i]) {
                    correct++;
                    sndRight.currentTime = 0; sndRight.play();
                } else {
                    wrongIdxs.push(i);
                    sndWrong.currentTime = 0; sndWrong.play();
                }
            });
            let score = correct * 2;
            totalScore += score;

            let gridCells = document.querySelectorAll('.mp-select');
            // الأماكن الصح
            positions.forEach((pos, i) => {
                if (answers[i] !== pos) {
                    gridCells[pos].style.background = "#d6ffd4";
                    gridCells[pos].style.border = "2.5px solid #11bb4c";
                    gridCells[pos].innerHTML = `<span style="opacity:0.68;">${symbols[i]}</span>`;
                }
            });
            // الأماكن الغلط
            wrongIdxs.forEach(i => {
                if (answers[i] !== null) {
                    gridCells[answers[i]].style.background = "#ffd3d3";
                    gridCells[answers[i]].style.border = "2.5px solid #ff2727";
                }
            });
            // الصح اللي اختارها فعلاً
            answers.forEach((ans, i) => {
                if (ans === positions[i]) {
                    gridCells[ans].style.background = "#d7ffda";
                    gridCells[ans].style.border = "2.5px solid #28b957";
                }
            });

            document.getElementById("mp-help").innerHTML = `
                <span>Correct: ${correct} | Wrong: ${wrongIdxs.length}</span><br>
                <span style="color:#444;">
                    <b>Green</b> shows where each symbol should have gone.<br>
                    <b>Red</b> are your wrong answers.
                </span>
                <br>
                <b>Your score this round: ${score}</b>
            `;
            document.getElementById("mp-finish").disabled = true;

            setTimeout(() => {
                round++;
                saveState();
                renderOuter();
            }, 2200);
        }
    }

    function saveState() {
        memoryPositioningState = { round, totalScore, finished };
    }
}

// ================= SLIDE PUZZLE GAME =================

let slidePuzzleState = null;
function slidePuzzleGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    // Cartoon images - replace with your real images
    const images = [
        "img/cartoon1.png", 
        "img/cartoon2.jpg",
        "img/cartoon3.jpg",
        "img/cartoon4.jpg"
    ];
    // Get random image on reload
    const chosenImg = images[Math.floor(Math.random() * images.length)];
    const N = 3; // 3x3 grid
    let board, emptyPos, moves = 0, finished = false, timer = 90, timerInterval;

    // Reset state
    slidePuzzleState = null;

    // Build puzzle UI
    gameArea.innerHTML = `
        <div id="sp-container" style="
            max-width: 520px;
            margin: 35px auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Slide Puzzle</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:18px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Moves: <span id="sp-moves">0</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="sp-timer">90</span>s</span>
            </div>
            <div id="sp-board" style="display:grid;grid-template-columns:repeat(${N}, 1fr);gap:8px;margin:20px auto;justify-content:center;width:320px;height:320px;"></div>
            <div id="sp-message" style="font-size:1.15rem;color:#ae8d40;margin-top:10px;min-height:28px;"></div>
            <button id="sp-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    // puzzle logic
    function createBoard() {
        let arr = [];
        for (let i = 0; i < N * N; i++) arr.push(i);
        do {
            arr = arr.sort(() => Math.random() - 0.5);
        } while (!isSolvable(arr));
        board = arr;
        emptyPos = board.indexOf(0);
    }
    function isSolvable(arr) {
        // for 3x3, check inversions
        let inv = 0;
        for (let i = 0; i < arr.length; i++) for (let j = i + 1; j < arr.length; j++)
            if (arr[i] && arr[j] && arr[i] > arr[j]) inv++;
        return inv % 2 === 0;
    }
    function renderBoard() {
        const brd = document.getElementById('sp-board');
        brd.innerHTML = "";
        board.forEach((n, idx) => {
            const row = Math.floor(idx / N), col = idx % N;
            const tile = document.createElement('div');
            tile.style.width = tile.style.height = (320 / N - 8) + 'px';
            tile.style.borderRadius = '14px';
            tile.style.background = n === 0 ? "#f8f7fb" : "#eee";
            tile.style.cursor = n === 0 ? 'default' : 'pointer';
            tile.style.position = "relative";
            tile.style.overflow = "hidden";
            tile.style.transition = "0.12s";
            tile.style.boxShadow = n === 0 ? "" : "0 2px 10px #cacaff30";
            if (n !== 0) {
                // puzzle image part
                tile.style.backgroundImage = `url('${chosenImg}')`;
                tile.style.backgroundSize = `${N * 100}% ${N * 100}%`;
                tile.style.backgroundPosition = `${(n - 1) % N * (100 / (N - 1))}% ${Math.floor((n - 1) / N) * (100 / (N - 1))}%`;
            }
            tile.onclick = () => moveTile(idx);
            brd.appendChild(tile);
        });
    }
    function moveTile(idx) {
        if (finished) return;
        const diff = Math.abs(emptyPos - idx);
        if ((diff === 1 && Math.floor(emptyPos / N) === Math.floor(idx / N)) || diff === N) {
            [board[emptyPos], board[idx]] = [board[idx], board[emptyPos]];
            emptyPos = idx;
            moves++;
            document.getElementById('sp-moves').textContent = moves;
            renderBoard();
            if (isSolved()) showEnd();
        }
    }
    function isSolved() {
        for (let i = 0; i < board.length - 1; i++) if (board[i] !== i + 1) return false;
        return board[N * N - 1] === 0;
    }
    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        document.getElementById('sp-message').textContent = `Puzzle solved! Moves: ${moves}`;
        setTimeout(() => showGameResult(15 - Math.min(moves, 15), "Well done!", startGameCallback), 1000);
    }
    document.getElementById('sp-back-btn').onclick = () => {
        clearInterval(timerInterval);
        hide(gameArea); updateGamesList(); show(levelGames);
    }
    function startGame() {
        moves = 0;
        createBoard();
        document.getElementById('sp-moves').textContent = moves;
        renderBoard();
    }
    startGame();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        document.getElementById('sp-timer').textContent = timer;
        if (timer <= 0) showEnd();
    }, 1000);
}

// ================= WHICH IS BRIGHTER GAME =============

let whichBrighterState = null;
function whichIsBrighterGame(startGameCallback) {
    hide(levelGames);
    show(gameArea);

    let score = 0, timer = 45, finished = false, timerInterval;

    // الأصوات
    let sndRight = document.getElementById("snd-rightanswer");
    let sndWrong = document.getElementById("snd-wronganswer");
    if (!sndRight) {
        sndRight = document.createElement("audio");
        sndRight.id = "snd-rightanswer";
        sndRight.src = "rightanswer-95219.mp3";
        sndRight.preload = "auto";
        document.body.appendChild(sndRight);
    }
    if (!sndWrong) {
        sndWrong = document.createElement("audio");
        sndWrong.id = "snd-wronganswer";
        sndWrong.src = "wronganswer-37702.mp3";
        sndWrong.preload = "auto";
        document.body.appendChild(sndWrong);
    }

    gameArea.innerHTML = `
        <div id="wb-container" style="
            max-width: 520px;
            margin: 35px auto;
            background: #fff;
            border-radius: 20px;
            box-shadow: 0 10px 30px #c9d7e866;
            padding: 30px 20px 26px 20px;
            border: 4px solid #f8b6d6;
            text-align:center;
            position:relative;
        ">
            <h1 style="font-family:'Comic Sans MS',cursive;font-size:2.5rem;color:#f875b9;margin-bottom:12px;">Which is Brighter?</h1>
            <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:22px;">
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Score: <span id="wb-score">0</span></span>
                <span style="font-size:1.18rem;font-weight:bold;color:#396485;">Time: <span id="wb-timer">45</span>s</span>
            </div>
            <div id="wb-circles" style="display:flex;justify-content:center;align-items:center;gap:54px;margin-bottom:24px;"></div>
            <div id="wb-message" style="font-size:1.18rem;color:#ae8d40;min-height:38px;"></div>
            <button id="wb-back-btn" class="small-btn" style="position:absolute;bottom:18px;right:24px;">⟵ Back</button>
        </div>
    `;

    function randomColorPair() {
        let h = Math.floor(Math.random() * 360);
        let s = 65 + Math.random() * 25;
        let l1 = 75 + Math.random() * 15; // bright
        let l2 = l1 - (16 + Math.random() * 18); // darker
        return [
            `hsl(${h},${s}%,${l1}%)`,
            `hsl(${h},${s}%,${l2}%)`
        ];
    }
    function renderRound() {
        if (finished) return;
        const [bright, dark] = randomColorPair();
        const order = Math.random() < 0.5 ? [bright, dark] : [dark, bright];
        const correctIdx = order[0] === bright ? 0 : 1;

        const ctn = document.getElementById('wb-circles');
        ctn.innerHTML = "";
        for (let i = 0; i < 2; i++) {
            const circ = document.createElement("div");
            circ.style.width = circ.style.height = "125px";
            circ.style.borderRadius = "50%";
            circ.style.background = order[i];
            circ.style.boxShadow = "0 2px 20px #ececec";
            circ.style.cursor = "pointer";
            circ.onclick = () => {
                if (finished) return;
                if (i === correctIdx) {
                    sndRight.currentTime = 0; sndRight.play();
                    score++;
                    document.getElementById('wb-message').textContent = "Correct!";
                    document.getElementById('wb-message').style.color = "#12af33";
                } else {
                    sndWrong.currentTime = 0; sndWrong.play();
                    document.getElementById('wb-message').textContent = "Try again!";
                    document.getElementById('wb-message').style.color = "#e12727";
                }
                document.getElementById('wb-score').textContent = score;
                setTimeout(renderRound, 650);
            }
            ctn.appendChild(circ);
        }
    }
    document.getElementById('wb-back-btn').onclick = () => {
        clearInterval(timerInterval);
        hide(gameArea); updateGamesList(); show(levelGames);
    }
    renderRound();
    timerInterval = setInterval(() => {
        if (finished) return;
        timer--;
        document.getElementById('wb-timer').textContent = timer;
        if (timer <= 0) showEnd();
    }, 1000);
    function showEnd() {
        finished = true;
        clearInterval(timerInterval);
        setTimeout(() => showGameResult(score, "Well done!", startGameCallback), 900);
    }
}

// ================ تعديل showGiftScreen لـ Level 2 ================

function showGiftScreen() {
    hide(levelGames, gameResult, gameArea);
    show(giftScreen);
    let total = levelScores[currentLevel].reduce((a,b)=>a+b,0);

    // Animation for both levels
    let animationHTML = '';
    if (currentLevel === 0 || currentLevel === 1) {
        animationHTML = `<img src="Animation - 1752044468269.gif" style="width:120px;display:block;margin:16px auto 2px auto;" alt="gift">`;
    }

    giftMsg.innerHTML = animationHTML + `<b>Your total score: ${total}</b><br/>Enjoy your reward! 🎁<br/>`;
    playGiftSound();

    continueBtn.onclick = () => {
        hide(giftScreen);
        if(currentLevel===0){
            level2Btn.disabled = false;
            openLevel(1);
        }else{
            // All levels finished: compute full session results and send to Lazy-eye Firebase
            try {
                const gamesSummary = [];
                for (let lvl = 0; lvl < levels.length; lvl++) {
                    const lvlScoresArr = levelScores[lvl] || [];
                    for (let gi = 0; gi < levels[lvl].games.length; gi++) {
                        const gameDef = levels[lvl].games[gi];
                        const score = typeof lvlScoresArr[gi] === 'number' ? lvlScoresArr[gi] : 0;
                        gamesSummary.push({
                            level: lvl + 1,
                            gameIndex: gi,
                            gameName: gameDef.name,
                            score
                        });
                    }
                }
                const sessionTotal = gamesSummary.reduce((sum, g) => sum + g.score, 0);
                // Get patient name and age from localStorage (set in step 2 of wizard)
                const patientName = localStorage.getItem('userName') || '';
                const patientAge = localStorage.getItem('userAge') || '';
                const payload = {
                    when: new Date().toISOString(),
                    sessionTotal,
                    games: gamesSummary,
                    patientName: patientName,
                    patientAge: patientAge
                };
                window.LazyDB?.saveLazySessionResult(payload);
            } catch (_) {}

            show(finalScreen);
            finalScore.innerHTML = `<b>Total Score: ${levelScores.flat().reduce((a,b)=>a+b,0)}</b>`;
        }
    }
}

document.addEventListener('DOMContentLoaded', function () {
    // ... أي أكواد أخرى ...
    const videosCard = document.getElementById('videos-card');
    const videoScreen = document.getElementById('video-screen');
    const mainMenu = document.getElementById('main-menu');
    const videoBackBtn = document.getElementById('video-back-btn');
    if (videosCard && videoScreen && mainMenu && videoBackBtn) {
        videosCard.onclick = () => {
            mainMenu.classList.add('hidden');
            videoScreen.classList.remove('hidden');
        }
        videoBackBtn.onclick = () => {
            videoScreen.classList.add('hidden');
            mainMenu.classList.remove('hidden');
        }
    }
});

        // دوال مساعدة للعرض والإخفاء
        function show(el) { el.classList.remove('hidden'); }
        function hide(...els) { els.forEach(e => e && e.classList.add('hidden')); }


window.onload = function () {
    // بعد 2.5 ثانية (مدة الـ intro.gif تقريبًا) نخفي splash ونظهر welcome animation
    setTimeout(function () {
        document.getElementById('intro-splash').style.display = 'none';
        let welcome = document.getElementById('welcome-anim');
        welcome.style.opacity = 1;
        welcome.style.pointerEvents = 'auto';

        // بعد 2.4 ثانية نخفي welcome animation ونظهر الموقع الأساسي
        setTimeout(function () {
            welcome.style.opacity = 0;
            welcome.style.pointerEvents = 'none';
            // إظهار المينيو الرئيسي
            document.getElementById('main-menu').classList.remove('hidden');
        }, 2400);
    }, 2400);
};




