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
