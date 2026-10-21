/**
 * 计分：两种题型都支持
 * 1) Likert 量表题：题目上写 dim（维度）和 reverse（是否反向计分）
 * 2) 选择题：选项上写 score: { 维度: 分值 }
 * 返回每个维度的平均分（1~5 分制下，3 分是中间值）。
 */
export function scoreBank(bank, answers) {
  const sums = {};
  const counts = {};

  (bank.dimensions || []).forEach((d) => {
    sums[d.key] = 0;
    counts[d.key] = 0;
  });

  const scaleValues = (bank.scale || []).map((s) => Number(s.value)).filter((v) => !Number.isNaN(v));
  const min = scaleValues.length ? Math.min(...scaleValues) : 1;
  const max = scaleValues.length ? Math.max(...scaleValues) : 5;

  for (const q of bank.questions || []) {
    const raw = answers?.[q.id];
    if (raw === undefined || raw === null || raw === '' || (Array.isArray(raw) && raw.length === 0)) {
      continue;
    }

    if (q.options) {
      const picked = Array.isArray(raw) ? raw : [raw];
      for (const idx of picked) {
        const score = q.options[Number(idx)]?.score || {};
        for (const [key, value] of Object.entries(score)) {
          sums[key] = (sums[key] || 0) + Number(value);
          counts[key] = (counts[key] || 0) + 1;
        }
      }
      continue;
    }

    if (!q.dim) continue;
    let value = Number(raw);
    if (Number.isNaN(value)) continue;
    if (q.reverse) value = min + max - value;
    sums[q.dim] = (sums[q.dim] || 0) + value;
    counts[q.dim] = (counts[q.dim] || 0) + 1;
  }

  const dims = {};
  for (const key of Object.keys(sums)) {
    dims[key] = counts[key] ? sums[key] / counts[key] : 0;
  }
  return dims;
}

/** 人格判定：由题库自带的 classify(dims, answers) 决定，返回类型 key。 */
export function classify(bank, dims, answers) {
  if (typeof bank.classify !== 'function') return null;
  return bank.classify(dims, answers) ?? null;
}

/**
 * 把作答值翻译成被试当时看到的文字。
 * 数据库里只存选项序号/分值，题库一改序号含义就变了，所以提交时一并存文字。
 */
export function answerLabels(bank, answers) {
  const out = {};
  for (const q of bank.questions || []) {
    const raw = answers?.[q.id];
    if (raw === undefined || raw === null || raw === '') continue;

    if (q.options) {
      const picked = Array.isArray(raw) ? raw : [raw];
      out[q.id] = picked
        .map((v) => {
          const opt = (q.options || []).find((o, i) => Number(o.value ?? i + 1) === Number(v));
          return opt?.text ?? opt?.label ?? String(v);
        })
        .join(' / ');
    } else {
      const v = Number(raw);
      out[q.id] = (bank.scale || []).find((s) => Number(s.value) === v)?.label ?? String(v);
    }
  }
  return out;
}

/* ============================================================
 * 研究一计分：规则逐条对应《题库A.docx》各段「计分」
 * ============================================================ */

const CN_DIGIT = { 零: 0, 〇: 0, 一: 1, 二: 2, 两: 2, 三: 3, 四: 4, 五: 5, 六: 6, 七: 7, 八: 8, 九: 9 };

/** 把「四十七」「29 名」「0.05 元」这类作答解析成数字；解析不出返回 null。 */
export function parseAnswerNumber(raw) {
  if (raw === undefined || raw === null) return null;
  const s = String(raw).trim();
  if (!s) return null;

  const m = s.match(/-?\d+(?:\.\d+)?/);
  if (m) return Number(m[0]);

  let run = '';
  for (const c of s) {
    if (c in CN_DIGIT || c === '十' || c === '百') run += c;
    else if (run) break;
  }
  if (!run) return null;

  const hundreds = run.split('百');
  if (hundreds.length === 2) {
    const h = hundreds[0] ? CN_DIGIT[hundreds[0]] ?? 0 : 1;
    return h * 100 + (parseAnswerNumber(hundreds[1]) ?? 0);
  }

  const tens = run.split('十');
  if (tens.length === 2) {
    const t = tens[0] ? CN_DIGIT[tens[0]] ?? 0 : 1;
    const o = tens[1] ? CN_DIGIT[tens[1]] ?? 0 : 0;
    return t * 10 + o;
  }
  return CN_DIGIT[run] ?? null;
}

/** BFI-44：16 题反向（6−x），五个维度取条目均值。 */
export function scoreBFI(answers) {
  const DIMS = {
    E: [1, 6, 11, 16, 21, 26, 31, 36],
    A: [2, 7, 12, 17, 22, 27, 32, 37, 42],
    C: [3, 8, 13, 18, 23, 28, 33, 38, 43],
    N: [4, 9, 14, 19, 24, 29, 34, 39],
    O: [5, 10, 15, 20, 25, 30, 35, 40, 41, 44],
  };
  const REVERSE = new Set([2, 6, 8, 9, 12, 18, 21, 23, 24, 27, 31, 34, 35, 37, 41, 43]);

  const dims = {};
  const used = {};
  for (const [key, items] of Object.entries(DIMS)) {
    let sum = 0;
    let n = 0;
    const ids = [];
    for (const no of items) {
      const raw = Number(answers?.[`BFI${String(no).padStart(2, '0')}`]);
      if (Number.isNaN(raw) || raw === 0) continue;
      sum += REVERSE.has(no) ? 6 - raw : raw;
      n += 1;
      ids.push(no);
    }
    dims[key] = n ? Math.round((sum / n) * 1000) / 1000 : null;
    used[key] = { items: ids, n };
  }
  return { dims, used };
}

/** CRT-7：1–6 数值等价判定，第 7 题选 C（值 3）。 */
const CRT_RULES = [
  ['CRT1', (s, v) => Math.abs(v - 0.05) < 1e-9 || (/毛|分/.test(s) && v === 5)],
  ['CRT2', (s, v) => v === 5],
  ['CRT3', (s, v) => v === 47],
  ['CRT4', (s, v) => v === 4],
  ['CRT5', (s, v) => v === 29],
  ['CRT6', (s, v) => v === 20],
];

export function scoreCRT(answers) {
  const correct = {};
  const normalized = {};
  let total = 0;

  for (const [id, rule] of CRT_RULES) {
    const raw = answers?.[id];
    const s = String(raw ?? '').trim();
    const v = parseAnswerNumber(s);
    normalized[id] = v;
    const ok = v !== null && rule(s, v);
    correct[id] = ok;
    if (ok) total += 1;
  }

  const last = Number(answers?.CRT7);
  correct.CRT7 = last === 3;
  normalized.CRT7 = Number.isNaN(last) ? null : last;
  if (correct.CRT7) total += 1;

  return { total, correct, normalized };
}

/** STAI-S：10 题反向（5−x），20 题求和，20–80 分。 */
export function scoreSTAI(answers) {
  const REVERSE = new Set([1, 2, 5, 8, 10, 11, 15, 16, 19, 20]);
  let total = 0;
  let n = 0;
  const items = {};
  for (let no = 1; no <= 20; no += 1) {
    const raw = Number(answers?.[`STAI${String(no).padStart(2, '0')}`]);
    if (Number.isNaN(raw) || raw === 0) continue;
    const v = REVERSE.has(no) ? 5 - raw : raw;
    items[no] = v;
    total += v;
    n += 1;
  }
  return { total, answered: n, items };
}

/** CSSTNFQ：23–25 反向（6−x），25 题求和，25–125 分。 */
export function scoreCSSTNFQ(answers) {
  const REVERSE = new Set([23, 24, 25]);
  let total = 0;
  let n = 0;
  const items = {};
  for (let no = 1; no <= 25; no += 1) {
    const raw = Number(answers?.[`CS${String(no).padStart(2, '0')}`]);
    if (Number.isNaN(raw) || raw === 0) continue;
    const v = REVERSE.has(no) ? 6 - raw : raw;
    items[no] = v;
    total += v;
    n += 1;
  }
  return { total, answered: n, items };
}

/** 人口学：选项本身已按 1 起编码，年龄取数字，另存原始值。 */
export function codeDemo(answers) {
  const age = parseAnswerNumber(answers?.D2);
  return {
    sex: Number(answers?.D1) || null,
    age,
    grade: Number(answers?.D3) || null,
    major: Number(answers?.D4) || null,
    living: Number(answers?.D5) || null,
    online: Number(answers?.D6) || null,
    raw: {
      sex: answers?.D1 ?? null,
      age: answers?.D2 ?? null,
      grade: answers?.D3 ?? null,
      major: answers?.D4 ?? null,
      living: answers?.D5 ?? null,
      online: answers?.D6 ?? null,
    },
  };
}

/** 三道注意力检测题：直接与题库标注的正确值比对。 */
export function scoreAttention(bank, answers) {
  const out = {};
  let passed = 0;
  let total = 0;
  for (const q of bank.questions || []) {
    if (q.attention === undefined) continue;
    total += 1;
    const ok = Number(answers?.[q.id]) === Number(q.attention);
    out[q.id] = ok;
    if (ok) passed += 1;
  }
  out.passed = passed;
  out.total = total;
  out.allPassed = passed === total;
  return out;
}

/**
 * 研究二分流：高神经质 → V-A；不高但低尽责 → V-B；其余随机 V-C / 无干预对照。
 * 临界分是当场分流用的预设值，可改；真正的「上下 27%」等样本收齐后再复核。
 */
export function assignGroup(dims, rand = Math.random) {
  if (dims?.N >= 3.5) return 'V-A';
  if (dims?.C <= 3.0) return 'V-B';
  return rand() < 0.5 ? 'V-C' : 'control';
}
