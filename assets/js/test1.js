import { CONFIG } from './config.js';
import { bankA } from './bankA.js';
import { bankB } from './bankB.js';
import { Quiz, esc } from './engine.js';
import { scoreBank, classify, answerLabels } from './scoring.js';
import { generateUniqueCode } from './code.js';
import { store, progress, driver } from './storage.js';

const app = document.getElementById('app');
const KEY = 'test1';
const qs = (sel, root = app) => root.querySelector(sel);
const nowISO = () => new Date().toISOString();
const delayDays = Number(CONFIG.flow.test2DelayDays) || 0;

function makeId() {
  return globalThis.crypto?.randomUUID?.()
    || `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function makeState() {
  return {
    step: 'intro',
    startedAt: null,
    finishedAt: null,
    answersA: {},
    answerSecondsA: {},
    pageA: 0,
    dims: null,
    type: null,
    video: null,
    answersB: {},
    answerSecondsB: {},
    pageB: 0,
    timings: {},
    submissionId: null,
    code: null,
    saved: false,
    saveError: '',
  };
}

let state = Object.assign(makeState(), progress.load(KEY) || {});
const save = () => progress.save(KEY, state);

function render() {
  window.scrollTo(0, 0);
  switch (state.step) {
    case 'bankA': return renderBankA();
    case 'result': return renderResult();
    case 'video': return renderVideo();
    case 'bankB': return renderBankB();
    case 'code': return renderCode();
    default: return renderIntro();
  }
}

/* ---------------- 步骤 0：说明 ---------------- */

function renderIntro() {
  app.innerHTML = `
  <section class="card hero">
    <p class="eyebrow">一测 · 第一次参与</p>
    <h1>${esc(CONFIG.studyTitle)}</h1>
    <p class="lead">${esc(CONFIG.studyIntro)}</p>
    <ul class="facts">
      <li><b>第一部分</b><span>人格测验，约 3 分钟</span></li>
      <li><b>第二部分</b><span>观看一段短视频</span></li>
      <li><b>第三部分</b><span>问卷作答，约 4 分钟</span></li>
      <li><b>结束后</b><span>生成 16 位编号，${delayDays > 0 ? `${delayDays} 天后可参加二测` : '可直接参加二测'}</span></li>
    </ul>
    <button class="btn btn-primary btn-block" data-act="start">开始作答</button>
    <p class="hint">作答过程请尽量一次完成；如果中途刷新或关闭页面，重新打开会接着上次的进度。</p>
  </section>`;

  qs('[data-act="start"]').addEventListener('click', () => {
    state.startedAt = state.startedAt || nowISO();
    state.step = 'bankA';
    save();
    render();
  });
}

/* ---------------- 步骤 1：人格测验 ---------------- */

function renderBankA() {
  app.innerHTML = `
  <section class="card">
    <p class="eyebrow">第一部分</p>
    <h2>${esc(bankA.title)}</h2>
    <p class="muted">${esc(bankA.intro)}</p>
    <div id="quiz"></div>
  </section>`;

  new Quiz({
    bank: bankA,
    container: qs('#quiz'),
    answers: state.answersA,
    answerSeconds: state.answerSecondsA,
    page: state.pageA,
    pageSize: CONFIG.pageSize,
    onChange: (answers) => { state.answersA = answers; save(); },
    onTiming: (seconds) => { state.answerSecondsA = seconds; save(); },
    onPage: (page) => { state.pageA = page; save(); },
    onComplete: (answers) => {
      state.answersA = answers;
      state.dims = scoreBank(bankA, answers);
      state.type = classify(bankA, state.dims, answers);
      state.timings.bankAFinishedAt = nowISO();
      state.step = 'result';
      save();
      render();
    },
  });
}

/* ---------------- 步骤 2：结果（不展示人格类型） ---------------- */

function renderResult() {
  const info = bankA.types?.[state.type];
  const show = CONFIG.flow.showResultToParticipant && Boolean(info);

  app.innerHTML = `
  <section class="card">
    <p class="eyebrow">第一部分完成</p>
    <h2>${show ? `你的人格类型：${esc(info.name)}` : '第一部分已完成'}</h2>
    ${show && info.desc ? `<p class="lead">${esc(info.desc)}</p>` : '<p class="lead">接下来请观看一段短视频，然后继续完成后面的问卷。</p>'}
    <p class="muted">请找一个安静的环境，独自观看，看完后继续作答。</p>
    <button class="btn btn-primary btn-block" data-act="next">继续</button>
  </section>`;

  qs('[data-act="next"]').addEventListener('click', () => {
    state.timings.videoStartedAt = state.timings.videoStartedAt || nowISO();
    state.step = 'video';
    save();
    render();
  });
}

/* ---------------- 步骤 3：视频 ---------------- */

function renderVideo() {
  const conf = bankA.videos?.[state.type] || null;

  if (!state.video || state.video.type !== state.type) {
    state.video = {
      type: state.type,
      src: conf?.src || '',
      title: conf?.title || '',
      ended: false,
      skipped: false,
      watched: 0,
    };
    save();
  }

  const v = state.video;
  const requireWatch = CONFIG.flow.requireFullVideo && Boolean(v.src);
  const canProceed = !requireWatch || v.ended || v.skipped;

  app.innerHTML = `
  <section class="card">
    <p class="eyebrow">第二部分</p>
    <h2>${esc(conf?.title || '请观看下面这段视频')}</h2>
    <p class="muted">请完整观看视频，播放结束后再点击下面的按钮。</p>
    ${v.src
      ? `<div class="video-wrap"><video id="video" src="${esc(v.src)}" controls playsinline preload="metadata"></video></div>`
      : '<div class="video-missing">视频文件还没有配置，请联系主试。</div>'}
    <div class="alert ${v.ended || v.skipped ? 'alert-ok' : ''}" data-el="alert" ${v.ended || v.skipped ? '' : 'hidden'}>
      ${v.skipped ? '已跳过视频，请稍后联系主试补看。' : '视频已观看完毕。'}
    </div>
    <button class="btn btn-primary btn-block" data-act="afterVideo" ${canProceed ? '' : 'disabled'}>看完了，继续</button>
    <p class="hint center"><button type="button" class="linkish" data-act="videoHelp">视频无法播放？</button></p>
  </section>`;

  const nextBtn = qs('[data-act="afterVideo"]');
  nextBtn.addEventListener('click', () => {
    state.step = 'bankB';
    save();
    render();
  });

  qs('[data-act="videoHelp"]').addEventListener('click', handleVideoError);

  const video = qs('#video');
  if (video) {
    video.addEventListener('timeupdate', () => {
      if (video.currentTime > (state.video.watched || 0)) state.video.watched = video.currentTime;
    });
    video.addEventListener('ended', () => {
      state.video.ended = true;
      state.timings.videoFinishedAt = state.timings.videoFinishedAt || nowISO();
      save();
      nextBtn.disabled = false;
      const alertEl = qs('[data-el="alert"]');
      if (alertEl) {
        alertEl.hidden = false;
        alertEl.classList.add('alert-ok');
        alertEl.textContent = '视频已观看完毕。';
      }
    });
    video.addEventListener('error', handleVideoError);
  }
}

function handleVideoError() {
  const alertEl = qs('[data-el="alert"]');
  if (CONFIG.flow.videoFallback === 'allow') {
    state.video.skipped = true;
    state.timings.videoFinishedAt = state.timings.videoFinishedAt || nowISO();
    save();
    const nextBtn = qs('[data-act="afterVideo"]');
    if (nextBtn) nextBtn.disabled = false;
    if (alertEl) {
      alertEl.hidden = false;
      alertEl.textContent = '视频加载失败，已允许继续。请稍后联系主试补看。';
    }
  } else if (alertEl) {
    alertEl.hidden = false;
    alertEl.textContent = '视频加载失败，请检查网络后刷新页面；如果仍然无法播放，请联系主试。';
  }
}

/* ---------------- 步骤 4：第二阶段问卷 ---------------- */

function renderBankB() {
  app.innerHTML = `
  <section class="card">
    <p class="eyebrow">第三部分</p>
    <h2>${esc(bankB.title)}</h2>
    <p class="muted">${esc(bankB.intro)}</p>
    <div id="quiz"></div>
  </section>`;

  new Quiz({
    bank: bankB,
    container: qs('#quiz'),
    answers: state.answersB,
    answerSeconds: state.answerSecondsB,
    page: state.pageB,
    pageSize: CONFIG.pageSize,
    onChange: (answers) => { state.answersB = answers; save(); },
    onTiming: (seconds) => { state.answerSecondsB = seconds; save(); },
    onPage: (page) => { state.pageB = page; save(); },
    onComplete: (answers) => {
      state.answersB = answers;
      state.timings.bankBFinishedAt = nowISO();
      save();
      finishTest();
    },
  });
}

function buildRecord() {
  const info = bankA.types?.[state.type];
  return {
    submissionId: state.submissionId,
    code: state.code,
    createdAt: state.startedAt || nowISO(),
    finishedAt: state.finishedAt || nowISO(),
    answersA: state.answersA,
    answerTextA: answerLabels(bankA, state.answersA),
    answerSecondsA: state.answerSecondsA,
    dims: state.dims,
    type: state.type,
    typeName: info?.name || state.type,
    video: state.video,
    answersB: state.answersB,
    answerTextB: answerLabels(bankB, state.answersB),
    answerSecondsB: state.answerSecondsB,
    bankVersion: { A: bankA.version, B: bankB.version },
    timings: state.timings,
    meta: {
      ua: navigator.userAgent,
      screen: `${screen.width}x${screen.height}`,
      lang: navigator.language,
      storage: driver,
    },
  };
}

function reasonText(reason) {
  if (reason === 'invalid_code') return '编号格式不正确';
  if (reason === 'code_exists') return '编号冲突，请刷新后重试';
  return '服务器暂时不可用，请稍后重试';
}

async function finishTest() {
  state.step = 'code';
  state.finishedAt = state.finishedAt || nowISO();
  state.submissionId = state.submissionId || makeId();
  save();

  if (state.saved) {
    render();
    return;
  }

  for (let attempt = 0; attempt < 5 && !state.saved; attempt += 1) {
    try {
      if (!state.code) {
        state.code = await generateUniqueCode({
          isTaken: (candidate) => store.codeExists(candidate),
        });
        save();
      }

      const result = await store.submitTest1(buildRecord());

      if (result.ok) {
        state.saved = true;
        state.saveError = '';
        break;
      }

      if (result.reason === 'code_exists') {
        state.code = null;
        save();
        continue;
      }

      state.saveError = `编号保存失败：${reasonText(result.reason)}`;
      break;
    } catch (err) {
      console.error(err);
      state.saveError = `数据保存失败：${err.message || err}`;
      break;
    }
  }

  if (!state.saved && !state.saveError) {
    state.saveError = '编号保存失败：多次生成都发生冲突，请刷新后重试';
  }

  save();
  render();
}

/* ---------------- 步骤 5：编号 ---------------- */

function renderCode() {
  const sameDevice = driver === 'local';

  if (!state.saved) {
    app.innerHTML = `
    <section class="card">
      <p class="eyebrow">一测完成</p>
      <h2>正在保存编号</h2>
      <p class="muted">你的作答已经完成，正在把编号和作答写入服务器，请不要关闭页面。</p>
      ${state.saveError ? `<div class="alert alert-danger">${esc(state.saveError)}</div>` : '<div class="alert">正在保存，请稍候…</div>'}
      <button class="btn btn-primary btn-block" data-act="retry">重试保存</button>
      <p class="hint">如果多次失败，请截图本页并联系主试。</p>
    </section>`;

    qs('[data-act="retry"]').addEventListener('click', () => {
      state.saveError = '';
      save();
      finishTest();
    });
    return;
  }

  app.innerHTML = `
  <section class="card">
    <p class="eyebrow">一测完成</p>
    <h2>请保存你的专属编号</h2>
    <p class="muted">这个 16 位编号是参加二测的唯一凭证，请立即截图或复制保存。本次作答已一并保存。</p>
    <div class="code-box"><span id="my-code">${esc(state.code)}</span></div>
    <div class="row">
      <button class="btn btn-ghost" data-act="copy">复制编号</button>
      <a class="btn btn-primary" href="./test2.html?code=${encodeURIComponent(state.code)}">前往二测</a>
    </div>
    <p class="hint">
      ${sameDevice ? '当前是本机存储模式，二测需要在同一台设备的同一个浏览器里完成。' : ''}
      ${delayDays > 0
        ? `二测需要在一测完成 ${delayDays} 天后才能进入，到时候凭这个编号参加。`
        : '二测随时可以凭这个编号参加。'}
    </p>
    <p class="hint center"><button type="button" class="linkish" data-act="restart">我是下一位被试，重新开始</button></p>
  </section>`;

  qs('[data-act="copy"]').addEventListener('click', async () => {
    try {
      await navigator.clipboard.writeText(state.code);
      toast('编号已复制');
    } catch (_) {
      const range = document.createRange();
      range.selectNodeContents(qs('#my-code'));
      const sel = window.getSelection();
      sel.removeAllRanges();
      sel.addRange(range);
      toast('请长按选中后手动复制');
    }
  });

  qs('[data-act="restart"]').addEventListener('click', () => {
    if (!confirm('重新开始会清空本次未提交的作答（已经保存的记录不受影响），确定吗？')) return;
    progress.clear(KEY);
    state = makeState();
    render();
  });
}

function toast(text) {
  const el = document.createElement('div');
  el.className = 'toast';
  el.textContent = text;
  document.body.appendChild(el);
  setTimeout(() => el.remove(), 1800);
}

// 刷新恰好发生在“编号还没写入”的瞬间时，自动继续保存
if (state.step === 'code' && !state.saved) {
  finishTest();
} else {
  render();
}
