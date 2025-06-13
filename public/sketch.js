let points = [];
let words = [];
let score = 0;
let video;
let motionThreshold = 50; // 움직임 감지 임계값
let motionRadius = 30;    // 좌표 주변 감지 반경
let prevFrame;



function preload() {
  fetch('/get_points')
    .then(res => res.json())
    .then(data => {
      points = data.points;
    });

  fetch('/get_words')
    .then(res => res.json())
    .then(data => {
      words = data.words;
      score = words.reduce((sum, w) => sum + w.count, 0);
      document.getElementById('scoreDisplay').innerText = `이용 점수 : ${score}점`;
    });
}

function setup() {
  let canvas = createCanvas(800, 600);
  canvas.parent('canvas-container');
  textAlign(CENTER, CENTER);
  textSize(12);

  video = createCapture(VIDEO);
  video.size(800, 600);
  video.hide();

  document.getElementById('submitWord').addEventListener('click', async () => {
    const word = document.getElementById('wordInput').value.trim();
    const email = document.getElementById('emailInput').value.trim();
    const agree = document.getElementById('privacyCheck').checked;
    const messageBox = document.getElementById('messageBox');

    if (!word) return;

    if (email && !agree) {
      messageBox.innerHTML = '<p style="color:red;">📌 이메일 입력 시 개인정보 수집 동의가 필요합니다.</p>';
      return;
    }

    const res = await fetch('/add_word', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word, email })
    });

    const result = await res.json();

    document.getElementById('wordInput').value = '';
    document.getElementById('emailInput').value = '';
    document.getElementById('privacyCheck').checked = false;

    score++;
    document.getElementById('scoreDisplay').innerText = `이용 점수 : ${score}점`;
    messageBox.innerHTML = '<p>단어가 등록되었어요.</p>';

    // 갱신된 단어 목록 불러오기
    fetch('/get_words')
      .then(res => res.json())
      .then(data => {
        words = data.words;
      });
  });
}

function draw() {
  background(255);
  video.loadPixels();

  for (let i = 0; i < words.length && i < points.length; i++) {
    const { word, count } = words[i];
    const { x, y } = points[i];

    let size = 10 + count * 5;
    let opacity = map(count, 1, 10, 100, 255);

    // 움직임 감지
    if (prevFrame && video.pixels.length === prevFrame.length) {
      let motion = 0;

      for (let dx = -motionRadius; dx <= motionRadius; dx++) {
        for (let dy = -motionRadius; dy <= motionRadius; dy++) {
          const px = constrain(x + dx, 0, video.width - 1);
          const py = constrain(y + dy, 0, video.height - 1);
          const idx = (py * video.width + px) * 4;

          const currBright = video.pixels[idx];
          const prevBright = prevFrame[idx];

          motion += abs(currBright - prevBright);
        }
      }

      if (motion > motionThreshold * 100) {
        size += 10; // 움직임 감지되면 크기 증가
        opacity = 255;
      }
    }

    fill(30, 30, 200, opacity);
    textSize(size);
    text(word, x, y);
  }

  prevFrame = [...video.pixels];
}
