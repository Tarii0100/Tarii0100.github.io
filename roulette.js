const canvas = document.getElementById("roulette");
const ctx = canvas.getContext("2d");
const resultEl = document.getElementById("result");
const spinBtn = document.getElementById("spinBtn");

const options = ["ごはん係", "お茶係", "掃除係", "ラッキー休み", "ジュースGET"];
const colors = ["#ff7675", "#55efc4", "#ffeaa7", "#74b9ff", "#a29bfe"];

let startAngle = 0;
let arc = (2 * Math.PI) / options.length;
let spinAngle = 0;
let spinTime = 0;
let spinTimeTotal = 0;

function drawRoulette() {
  ctx.clearRect(0, 0, canvas.width, canvas.height);
  for (let i = 0; i < options.length; i++) {
    const angle = startAngle + i * arc;
    ctx.fillStyle = colors[i];
    ctx.beginPath();
    ctx.moveTo(150, 150);
    ctx.arc(150, 150, 150, angle, angle + arc, false);
    ctx.fill();

    ctx.save();
    ctx.fillStyle = "#2d3436";
    ctx.translate(150 + Math.cos(angle + arc / 2) * 100, 
                  150 + Math.sin(angle + arc / 2) * 100);
    ctx.rotate(angle + arc / 2 + Math.PI / 2);
    ctx.fillText(options[i], -ctx.measureText(options[i]).width / 2, 0);
    ctx.restore();
  }

  // 矢印
  ctx.fillStyle = "#fff";
  ctx.beginPath();
  ctx.moveTo(150 - 10, 0);
  ctx.lineTo(150 + 10, 0);
  ctx.lineTo(150, 30);
  ctx.fill();
}

function rotateRoulette() {
  spinTime += 30;
  if (spinTime >= spinTimeTotal) {
    stopRotateRoulette();
    return;
  }
  const spinAngleDelta = spinAngle * Math.exp(-0.03 * spinTime);
  startAngle += (spinAngleDelta * Math.PI) / 180;
  drawRoulette();
  requestAnimationFrame(rotateRoulette);
}

function stopRotateRoulette() {
  const degrees = (startAngle * 180) / Math.PI + 90;
  const arcd = (arc * 180) / Math.PI;
  const index = Math.floor((360 - (degrees % 360)) / arcd);
  resultEl.textContent = `結果: ${options[index]}`;
}

spinBtn.addEventListener("click", () => {
  spinAngle = Math.random() * 1000 + 1000;
  spinTime = 0;
  spinTimeTotal = Math.random() * 3000 + 4000;
  rotateRoulette();
});

drawRoulette();
