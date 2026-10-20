/**
 * 题库 A（人格测验）—— 当前是“智商题”占位题库，只为跑通流程。
 *
 * 结构说明：
 *   1. 每题是四选一，options 里用 score 标出该选项给哪个维度加分
 *   2. 正确答案 score 记 1 分，错误答案记 0 分
 *   3. 三个维度各 4 题：V=言语、N=数理、L=逻辑
 *   4. classify 取平均分最高的维度作为“人格类型”（平手时按 V > N > L 的顺序）
 *
 * 以后换成真实人格题库时，把 questions、dimensions、classify、types、videos
 * 一起替换即可，页面和存储都不用动。
 */
export const bankA = {
  id: 'A',
  title: '人格测验',
  intro: '以下为流程测试用的示例题。请为每题选择一个你认为最合适的答案，不要查资料。',

  mode: 'choice',
  pageSize: 6,

  dimensions: [
    { key: 'V', name: '言语理解' },
    { key: 'N', name: '数量关系' },
    { key: 'L', name: '逻辑推理' },
  ],

  questions: [
    {
      id: 'A01', text: '2，4，8，16，（  ）', dim: 'N',
      options: [
        { text: '24', score: { N: 0 } },
        { text: '30', score: { N: 0 } },
        { text: '32', score: { N: 1 } },
        { text: '36', score: { N: 0 } },
      ],
    },
    {
      id: 'A02', text: '1，1，2，3，5，8，（  ）', dim: 'N',
      options: [
        { text: '11', score: { N: 0 } },
        { text: '12', score: { N: 0 } },
        { text: '13', score: { N: 1 } },
        { text: '15', score: { N: 0 } },
      ],
    },
    {
      id: 'A03', text: '一件商品原价 200 元，打八折后再减 20 元，最终价格是：', dim: 'N',
      options: [
        { text: '140 元', score: { N: 1 } },
        { text: '150 元', score: { N: 0 } },
        { text: '160 元', score: { N: 0 } },
        { text: '170 元', score: { N: 0 } },
      ],
    },
    {
      id: 'A04', text: '1，4，9，16，25，（  ）', dim: 'N',
      options: [
        { text: '30', score: { N: 0 } },
        { text: '35', score: { N: 0 } },
        { text: '36', score: { N: 1 } },
        { text: '49', score: { N: 0 } },
      ],
    },
    {
      id: 'A05', text: '医生 : 医院 = 教师 : （  ）', dim: 'V',
      options: [
        { text: '学生', score: { V: 0 } },
        { text: '学校', score: { V: 1 } },
        { text: '课本', score: { V: 0 } },
        { text: '讲台', score: { V: 0 } },
      ],
    },
    {
      id: 'A06', text: '下列哪个与其他三个不同类？', dim: 'V',
      options: [
        { text: '苹果', score: { V: 0 } },
        { text: '香蕉', score: { V: 0 } },
        { text: '白菜', score: { V: 1 } },
        { text: '橘子', score: { V: 0 } },
      ],
    },
    {
      id: 'A07', text: '“画蛇添足”最接近的意思是：', dim: 'V',
      options: [
        { text: '做事很快', score: { V: 0 } },
        { text: '做多余的事', score: { V: 1 } },
        { text: '半途而废', score: { V: 0 } },
        { text: '精益求精', score: { V: 0 } },
      ],
    },
    {
      id: 'A08', text: '与“谨慎”意思最接近的词是：', dim: 'V',
      options: [
        { text: '胆小', score: { V: 0 } },
        { text: '小心', score: { V: 1 } },
        { text: '犹豫', score: { V: 0 } },
        { text: '严肃', score: { V: 0 } },
      ],
    },
    {
      id: 'A09', text: '□ △ ○ □ △ ○ （  ）', dim: 'L',
      options: [
        { text: '△', score: { L: 0 } },
        { text: '○', score: { L: 0 } },
        { text: '□', score: { L: 1 } },
        { text: '无法确定', score: { L: 0 } },
      ],
    },
    {
      id: 'A10', text: '所有 A 都是 B，有些 B 是 C。由此可以推出：', dim: 'L',
      options: [
        { text: '有些 A 是 C', score: { L: 0 } },
        { text: '所有 A 都是 C', score: { L: 0 } },
        { text: '不能确定 A 与 C 的关系', score: { L: 1 } },
        { text: '没有 A 是 C', score: { L: 0 } },
      ],
    },
    {
      id: 'A11', text: '3 台机器 3 分钟生产 3 个零件。100 台机器生产 100 个零件需要：', dim: 'L',
      options: [
        { text: '1 分钟', score: { L: 0 } },
        { text: '3 分钟', score: { L: 1 } },
        { text: '100 分钟', score: { L: 0 } },
        { text: '300 分钟', score: { L: 0 } },
      ],
    },
    {
      id: 'A12', text: '甲比乙高，乙比丙高。三人中最矮的是：', dim: 'L',
      options: [
        { text: '甲', score: { L: 0 } },
        { text: '乙', score: { L: 0 } },
        { text: '丙', score: { L: 1 } },
        { text: '无法判断', score: { L: 0 } },
      ],
    },
  ],

  // 占位判定：哪个维度平均分最高就是哪一型；平手时按 V > N > L 的先后顺序
  classify(dims) {
    const ranked = [
      ['verbal', dims.V ?? 0],
      ['numeric', dims.N ?? 0],
      ['logical', dims.L ?? 0],
    ].sort((a, b) => b[1] - a[1]);
    return ranked[0][0];
  },

  types: {
    verbal: {
      name: '言语型',
      desc: '你对文字和概念之间的关系比较敏感，习惯先理解、再表达，处理信息时更依赖语言线索。',
    },
    numeric: {
      name: '数理型',
      desc: '你对数字和数量关系比较敏感，遇到问题倾向于先算一算、找一个可量化的依据。',
    },
    logical: {
      name: '逻辑型',
      desc: '你擅长从已知条件推导结论，喜欢先理清关系再下判断，对前后矛盾比较警觉。',
    },
  },

  // 文件名故意保持中性，避免被试从视频地址猜到自己的类型。
  // 对应关系：verbal → video-1，numeric → video-2，logical → video-3
  videos: {
    verbal: { src: 'assets/videos/video-1.mp4', title: '请观看下面这段视频' },
    numeric: { src: 'assets/videos/video-2.mp4', title: '请观看下面这段视频' },
    logical: { src: 'assets/videos/video-3.mp4', title: '请观看下面这段视频' },
  },
};
