(function () {
  'use strict';

  const digits = {
    h1: document.getElementById('h1'),
    h2: document.getElementById('h2'),
    m1: document.getElementById('m1'),
    m2: document.getElementById('m2'),
    s1: document.getElementById('s1'),
    s2: document.getElementById('s2'),
    s3: document.getElementById('s3'),
  };

  const negSign = document.getElementById('negSign');
  const realTimeEl = document.getElementById('realTime');

  // Formats a non-negative ms value as HH:MM:SS.S (hours capped at 99).
  function formatRealTime(ms) {
    const neg = ms < 0;
    ms = Math.abs(ms);
    const totalTenths = Math.floor(ms / 100);
    const tenths = totalTenths % 10;
    const totalSec = Math.floor(totalTenths / 10);
    const hours = Math.floor(totalSec / 3600);
    const mins  = Math.floor((totalSec % 3600) / 60);
    const secs  = totalSec % 60;
    const hh = String(Math.min(hours, 99)).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    return `${neg ? '-' : ''}${hh}:${mm}:${ss}.${tenths}`;
  }

  function renderRealTime() {
    realTimeEl.textContent = formatRealTime(time_elapsed);
  }

  const numberSrc = (n) => `Assets/Number - ${n}.png`;

  // Preload digit images so there's no flicker when they swap.
  for (let i = 0; i <= 9; i++) {
    const img = new Image();
    img.src = numberSrc(i);
  }

  // Real time (ms) the stopwatch has been running — incremented exactly by the
  // wall-clock delta on every tick.
  let time_elapsed = 0;
  // Time (ms) actually shown in the display — incremented by (delta * multiplier)
  // on every tick, so it can run faster or slower than real time.
  let display_time_elapsed = 0;
  // Multiplier applied to each tick delta before it's added to display_time_elapsed.
  // 1 = real time, 2 = display runs twice as fast, etc.
  let display_increment_multiplier = 1;

  let lastTickTime = 0;  // wall-clock ms of the previous tick (while running)
  let intervalId = null;
  let chanceTimeId = null;

  let CHANCE_TIME_INTERVAL = 10 * 1000;

  function render(totalMs) {
    // Show the negative overlay when the display counter is negative, then
    // render the absolute value so the digits themselves stay unsigned.
    negSign.hidden = totalMs >= 0;
    totalMs = Math.abs(totalMs);

    // Work in tenths of a second so the displayed decimal actually ticks in 0.1s steps.
    const totalTenths = Math.floor(totalMs / 100);
    const tenths = totalTenths % 10;
    const totalSec = Math.floor(totalTenths / 10);
    // const hours = Math.floor(totalSec / 100); // Intentionally Wrong, should be divided by 3600
    // const mins  = Math.floor((totalSec % 3600) / 10); // Intentionally Wrong, should be divided by 60
    // const secs  = totalSec % 60;

    const hours = Math.floor(totalSec / 1000);
    const mins = Math.floor(totalSec / 10) % 1000;
    const secs = totalSec % 10;

    // Cap hours at 99 so we stay in HH:MM:SS.S format.
    const hh = String(Math.min(hours, 99)).padStart(2, '0');
    const mm = String(mins).padStart(2, '0');
    const ss = String(secs).padStart(2, '0');
    const t  = String(tenths);

    digits.h1.src = numberSrc(hh[0]);
    digits.h2.src = numberSrc(hh[1]);
    digits.m1.src = numberSrc(mm[0]);
    digits.m2.src = numberSrc(mm[1]);
    digits.s1.src = numberSrc(ss[0]);
    digits.s2.src = numberSrc(ss[1]);
    digits.s3.src = numberSrc(t);
  }

  function tick() {
    const now = Date.now();
    const delta = now - lastTickTime;
    lastTickTime = now;

    time_elapsed += delta;
    display_time_elapsed += delta * display_increment_multiplier;

    render(display_time_elapsed);
    renderRealTime();
  }

  function start() {
    if (inconsistent_button(0.25)) return; // make it hard to click because lol

    if (intervalId !== null) return; // already running
    lastTickTime = Date.now();
    intervalId = setInterval(tick, 50);

    // Kick off the 30s chance_time tick once, on the first successful start press.
    if (chanceTimeId === null) {
      chanceTimeId = setInterval(chance_time, CHANCE_TIME_INTERVAL);
    }
  }

  function stop() {
    if (inconsistent_button(0.6)) return; // make it hard to click because lol

    if (intervalId === null) return; // already stopped
    // Flush the trailing sub-tick delta so no time is lost between the last
    // tick and the stop press.
    const now = Date.now();
    const delta = now - lastTickTime;
    lastTickTime = now;
    time_elapsed += delta;
    display_time_elapsed += delta * display_increment_multiplier;

    clearInterval(intervalId);
    intervalId = null;
    renderRealTime();

    // Cancel the 30s chance_time ticker so it stops firing until the next start press.
    if (chanceTimeId !== null) {
      clearInterval(chanceTimeId);
      chanceTimeId = null;
    }
  }

  function reset() {
    if (inconsistent_button(0.1)) return; // make it hard to click because lol

    // Reset keeps the timer running because lmao
    // if (intervalId !== null) {
    //   clearInterval(intervalId);
    //   intervalId = null;
    // }
    time_elapsed = 0;
    display_time_elapsed = 0;
    display_increment_multiplier = 1;
    lastTickTime = Date.now(); // so the next tick's delta doesn't jump
    render(0);
    renderRealTime();
  }

  function chance_time() {
    display_increment_multiplier = -1;
  }

  function inconsistent_button(chance) {
    // Random number in [0, 1). If the number is lower than "chance," return true. Otherwise false.
    const roll = Math.random();
    
    if (roll < chance) return true;
    return false;
  }

  document.getElementById('startBtn').addEventListener('click', start);
  document.getElementById('stopBtn').addEventListener('click', stop);
  document.getElementById('resetBtn').addEventListener('click', reset);

  render(0);
})();
