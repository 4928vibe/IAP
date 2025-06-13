// ✅ server.js (이메일 X, 점수 시스템 O, 좌표 이탈 방지)
require('dotenv').config();
const express = require('express');
const fs = require('fs');
const path = require('path');
const nodemailer = require('nodemailer');

const app = express();
const port = 3000;

app.use(express.static(path.join(__dirname, '../public')));
app.use(express.json());

let words = [];
let emails = [];
let currentTheme = '여름';
let lastSentScore = 0;

const POINTS_PATH = path.join(__dirname, 'points_summer.json');
let points = [];

if (fs.existsSync(POINTS_PATH)) {
  console.log('📌 기존 여름 좌표 로드됨');
  points = JSON.parse(fs.readFileSync(POINTS_PATH, 'utf-8'));
} else {
  console.log('🆕 여름 좌표 생성 중...');
  points = generateComplexPoints(400); // 🎨 복잡한 여름 이미지용 포인트 증가
  fs.writeFileSync(POINTS_PATH, JSON.stringify(points, null, 2));
}

function generateComplexPoints(count) {
  let result = [];
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const radius = Math.random() * 250 + 50;
    const cx = 400 + Math.cos(angle) * radius + (Math.random() * 30 - 15);
    const cy = 300 + Math.sin(angle) * radius + (Math.random() * 30 - 15);
    result.push({ x: Math.floor(cx), y: Math.floor(cy) });
  }
  return result;
}

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

function sendScoreEmail(score, toList) {
  const mailOptions = {
    from: process.env.EMAIL_USER,
    to: process.env.EMAIL_USER,
    bcc: toList,
    subject: `🎉 워드아트 점수 ${score}점 도달!`,
    text: `축하합니다! 워드아트 프로젝트가 ${score}점에 도달했습니다.`,
    attachments: [
      {
        filename: 'art.png',
        path: './public/art_capture.png'
      }
    ]
  };

  transporter.sendMail(mailOptions, (error, info) => {
    if (error) console.error('메일 전송 실패:', error);
    else console.log(`✅ ${toList.length}명에게 메일 발송 완료!`);
  });
}

app.post('/add_word', (req, res) => {
  const { word, email } = req.body;

  const existing = words.find(w => w.word === word);
  if (existing) {
    existing.count++;
  } else {
    words.push({ word, count: 1 });
  }

  if (email && !emails.includes(email)) {
    emails.push(email);
  }

  const score = words.reduce((sum, w) => sum + w.count, 0);
  if (score >= 1000 && score % 1000 === 0 && score !== lastSentScore) {
    lastSentScore = score;
    sendScoreEmail(score, emails);
  }

  res.json({ success: true, totalScore: score });
});

app.get('/get_words', (req, res) => {
  const totalScore = words.reduce((sum, w) => sum + w.count, 0);
  res.json({ words, totalScore });
});

app.get('/get_points', (req, res) => {
  res.json({ points });
});

app.get('/set_theme', (req, res) => {
  const { theme } = req.query;
  if (!theme) return res.status(400).json({ error: 'theme 파라미터가 필요해요.' });
  currentTheme = theme;
  console.log(`✅ 주제가 '${currentTheme}'(으)로 변경됨`);
  res.json({ success: true, theme: currentTheme });
});

app.get('/seed_words', (req, res) => {
  const count = parseInt(req.query.count) || 200;
  words = [];
  for (let i = 0; i < count; i++) {
    words.push({ word: `단어${i + 1}`, count: Math.floor(Math.random() * 5) + 1 });
  }
  console.log(`✅ ${count}개의 단어가 자동 생성되었습니다.`);
  res.json({ success: true, count });
});

app.listen(port, () => {
  console.log(`✅ 서버 실행 중: http://localhost:${port}`);
});
