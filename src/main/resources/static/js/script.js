const audio = document.getElementById("audio-player");
const playBtn = document.getElementById("play-btn");
const revBtn = document.getElementById("rev-btn");

let switchState = playBtn.addEventListener("click", () => {
  if (audio.paused) {
    audio.play();
    playBtn.textContent = "Pause";
  } else {
    audio.pause();
    playBtn.textContent = "Play";
  }
});

function checkKey(e) {
  if (e.code === "Space") {
    switchState();
  }
}

revBtn.addEventListener("click", () => {
  audio.currentTime = 0;
});

audio.addEventListener("ended", () => {
  playBtn.textContent = "Play";
});
