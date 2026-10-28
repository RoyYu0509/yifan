// 主页内容，来自简历。电话 / 年龄 / 性别 / 照片没有放进来 (公开网页不适合)。
export interface Bullet { lead: string; text: string }
export interface Entry {
  title: string;
  role?: string;
  period: string;
  intro?: string;
  links?: { label: string; href: string }[];
  bullets: Bullet[];
}
export interface Edu { school: string; degree: string; period: string; notes: string[]; courses: string }
export interface SkillGroup { group: string; items: string }

export const profile = {
  fullName: '余逸凡 · Yifan Yu',
  headline: 'AI Infra · AI 算法优化 · 算法研究',
  tagline: 'NUS 数据科学与机器学习硕士 · 2026',
  highlights: [
    { v: '9.4×', l: 'Triton FlashAttention2 较朴素 attention 提速（4K，RTX 3090 Ti）' },
    { v: '86%', l: '自研 NCCL DDP 双卡扩展效率，追平 PyTorch 官方 DDP' },
    { v: '70%', l: '自研推理引擎吞吐，对标 SGLang 同功能集（32 并发）' },
    { v: 'JCP', l: '第一作者：Local CP 不确定性量化方法（J. Comput. Phys.）' },
  ],
  pitch: '从零实现 190M 参数 LLM 的训练与推理全栈；以第一作者在 JCP 发表不确定性量化方法；构建并评测 Agent 科研系统（投稿 ICLR 2027）。',
  summary:
    '从零实现 190M 参数 LLM 的模型架构、训练与推理全栈（Triton FA2 较朴素 attention 快 9.4×，DDP 扩展效率 86%，自研推理引擎吞吐达 SGLang 同功能集的 70%）；负责构建并评测 Agent 科研系统（投稿 ICLR 2027）；以第一作者在 JCP 发表机器学习不确定性量化方法。',
  links: [
    { label: 'GitHub', href: 'https://github.com/RoyYu0509' },
    { label: 'Email', href: 'mailto:royyu0509@gmail.com' },
  ],

  projects: [
    {
      title: '从零搭建并优化 LLM 训练与推理全栈',
      role: '独立开发者 · 个人项目',
      period: '2025.11 — 至今',
      intro: '不依赖 HF / vLLM 等训练推理框架，基于 PyTorch + Triton + NCCL 实现 LLM 训练与推理全栈。',
      links: [{ label: 'github.com/RoyYu0509/llm-stack', href: 'https://github.com/RoyYu0509/llm-stack' }],
      bullets: [
        { lead: '核心组件', text: '从 0 手写 Llama 关键组件：C++ BPE Tokenizer / MHA / RMS Pre-Norm / RoPE / SwiGLU FFN / AdamW / top-p sampling；转为 HF 官方 LlamaForCausalLM 后，logits 最大误差 2.2e-5。' },
        { lead: 'Triton Flash Attention 算子优化', text: '用 Nsight Systems 定位系统耗时瓶颈，使用 Triton 实现 FlashAttention2 混合精度算子；前向计算在 RTX 3090 Ti 上，4K Attention kernel 显存由 9.2 GB 降至 49 MB，较朴素 Attention 快 9.4×，较 torch.compile 版快 3.0×，显存与 PyTorch SDPA(flash) 持平。' },
        { lead: '基于 NCCL 手写多卡分布式训练', text: '实现端到端分布式训练流水线，自研 NCCL DDP 通信重叠与梯度分桶机制；双卡 RTX 3090 扩展效率达 86%（吞吐 27.7k tok/s），性能追平 PyTorch 官方 DDP（27.6k tok/s），显存额外开销仅 +3.7%。' },
        { lead: '自研推理框架', text: '基于 Python AsyncIO 从零设计异步推理框架，请求接收与推理异步并行推进，调度策略可调（每轮 prefill 准入数），支持立即 / 排空（drain）两种停机方式；FP32 下贪心输出与 HF generate 逐 token 一致。' },
        { lead: '连续批处理优化', text: '引入 continuous batching 与批量 prefill，接入 flash-attn decode kernel 与 torch.compile；3090 Ti 单卡并发 32 请求时，吞吐由串行 47 tok/s 提升至 1,948 tok/s，TPOT 较基础版 CB 由 43 ms 降至 16 ms。' },
        { lead: '对标 SGLang', text: '同机、同 workload、同功能集下，自研推理引擎在 32 条并发时吞吐为 SGLang 的 70%，平均每输出 token 时间（TPOT）约 16 ms vs 11 ms（SGLang）。' },
      ],
    },
  ] as Entry[],

  research: [
    {
      title: '个性化科研 Agent Pipeline 的构建与评测',
      role: 'ICLR 2027 审稿中 · NUS 资助',
      period: '2026.05 — 2026.09',
      intro: '构建个性化 agentic 科研系统，设计并实现 arXiv 论文召回 → idea 生成 → 理论核查 → 实验核查的四阶段 agent pipeline；自建评测集并开展实验：检索评测、组件消融、失败模式分析和 token 成本效益评估。',
      links: [{ label: 'github.com/RoyYu0509/ideation-claude', href: 'https://github.com/RoyYu0509/ideation-claude' }],
      bullets: [
        { lead: '自建论文推荐评测集，优化召回效果', text: '从 12 周约 3 万篇 arXiv 新论文中均匀抽样 2,574 篇，由专家逐篇按相关性打分，并用该数据集对 3,000+ 召回配置做 config search，由交叉验证选定 RRF 融合最优配置；Precision@100 达 84%，优于 SPECTER2 语义匹配（61%）、BM25（51%）与随机基线（8.5%）。' },
        { lead: '设计精排对照实验，根据结果移除精排阶段', text: '在上线配置产出的候选集上测试 cross-encoder 与 Sonnet 5.5 listwise 重排（基础 / 带排序引导两种 prompt）三种精排方法，均降低了排序效果，nDCG@100 由 0.86 降至 0.68–0.71；另测试 Claude Code（Opus 5.5，多 agents）通读整周论文，在随机 3 位研究者画像上与上线配置效果持平，但单次需额外 15–29M tokens。' },
        { lead: '评测 idea 核查的效果', text: '对 4 周 79 个候选问题逐级核查（前提 / 理论推导 / 新颖性），淘汰 49 个、保留 30 个；使用另一模型族，在对齐专家打分后对所有候选问题盲评，淘汰组 82% 为低分档、保留组为 40%，降低了后选集中低质量问题的比例。' },
        { lead: '工程设计', text: '采用 orchestrator–worker 架构，设计四阶段 agentic 科研工作流：orchestrator agent 读取磁盘状态，按固定流程调度 worker agents 或 agentic loop 负责当次科研任务；设计问询机制，让研究者可中途介入 agentic loop、实时调整每一轮 worker agent 行为；磁盘文件作为 shared memory 与 checkpoint，中断后可从落盘状态恢复。' },
      ],
    },
    {
      title: '提出创新校准方法，让预测区间真正覆盖 95%',
      role: 'J. Comput. Phys. 顶刊一作',
      period: '2025.04 — 2026.05',
      intro: '针对当前区间预测模型统计保证较差的问题：实测 5 种 UQ 模型的 95% 预测区间，覆盖率最低仅 12%。提出事后校准方法 Local CP：不重训原模型，与模型结构、任务无关，使用一部分数据校准，让预测区间保证目标覆盖率，并让宽度自适应局部噪声。',
      links: [
        { label: 'github.com/RoyYu0509/Local-Conformal-Prediction-Torch', href: 'https://github.com/RoyYu0509/Local-Conformal-Prediction-Torch' },
        { label: 'doi.org/10.1016/j.jcp.2026.114979', href: 'https://doi.org/10.1016/j.jcp.2026.114979' },
      ],
      bullets: [
        { lead: '创新不确定性预测方法', text: '提出 Local CP：在基础 CP 之上加一个轻量 quantile MLP，学习局部噪声强度，使高噪声域预测区间变宽、平滑域预测区间变窄；方法只依赖数据可交换性，相比基础 CP 无需额外数据，与前置模型结构和任务无关。' },
        { lead: '设计对照实验', text: '5 种 baseline × 3 个 benchmark 中，Local CP 比标准 CP 更精确地校准高噪声区覆盖率：由 0.76 提升至 0.94（目标 0.95），全域偏离度降低 77%，预测区间宽度降低 30%，显著改善局部校准度和预测区间的信息密度。' },
        { lead: '测量方法额外计算开销与鲁棒性', text: 'Local CP 训练耗时约为重训 baseline 模型的 1/3～1/20；校准数据降至原有 5%–30% 时，总覆盖率（高噪声区域 + 平滑区域）偏离仍显著低于标准 CP。开源基于 PyTorch 的方法实现。' },
      ],
    },
  ] as Entry[],

  experience: [
    {
      title: 'Pacific Life Re（太平洋人寿再保险），新加坡',
      role: '战略分析实习生',
      period: '2024.10 — 2025.02',
      bullets: [
        { lead: '健康数据处理管线搭建', text: '基于 JMDC 体检数据库搭建生存分析数据管线，使用 SQL 从 Redshift 中关联多表，在 800M 条记录中过滤保留相关的 4.5M 条，并使用 Polars lazy evaluation 完成 60+ features 的处理。' },
        { lead: '数据分析报告', text: '为数据集编写 5 项测试（初始年份、窗口连续性、同年记录唯一性、组间无泄露、准入年份）并随机采样抽查，测量连续窗口长度对数据保留量的影响：窗口由 3 年增至 10 年，成员保留率从约 76% 降到 31%；可视化数据内容与关键特征统计值并向 director 汇报，为后续生存分析项目提供可复用的全量数据工程管道。' },
        { lead: '半结构化数据采集', text: '为公司可穿戴健康数据项目（越南）采集公开参照数据：用 Python（requests / BeautifulSoup）把 CDC NHANES 网页解析成 5.2 万行特征映射目录，核对跨周期可用性（320 类表中仅 73 类全周期存在），并解析死亡关联文件，产出生存分析标签。' },
      ],
    },
  ] as Entry[],

  education: [
    {
      school: '新加坡国立大学',
      degree: '理学硕士，数据科学与机器学习',
      period: '2024.08 — 2026.07',
      notes: ['专业课程均分 4.67/5.0；专业排名约 top 5%；参与多项科研项目'],
      courses: '大语言模型、高等线性代数、可扩展计算、数据库系统、数据结构与算法、大数据算法、机器学习理论、高等非线性优化',
    },
    {
      school: '多伦多大学',
      degree: '高优荣誉理学学士，统计学与经济学双专业，数学辅修',
      period: '2020.09 — 2024.07',
      notes: ['专业课程均分 3.92/4.0；专业排名约 top 5%；入选院长名单 2022、2023、2024'],
      courses: '机器学习、线性代数、线性/非线性优化、多元微积分、概率论、软件工程、回归分析、计算机架构、商业金融、中级（微/宏）观经济、数据分析、时序分析',
    },
  ] as Edu[],

  publications: [
    { text: 'Yifan Yu, Cheuk Hin Ho, Yangshuai Wang. “A conformal prediction framework for uncertainty quantification in physics-informed neural networks.”', venue: 'Journal of Computational Physics, 2026.', href: 'https://doi.org/10.1016/j.jcp.2026.114979' },
    { text: 'Yifan Yu, Jiale Linghu, Yangshuai Wang. “Arxidea: An Agentic System for Personalized Research Ideation and Evidence-Backed Verification.”', venue: 'ICLR 2027, under review.', href: '' },
    { text: 'Yifan Yu, Yangshuai Wang. “Geometry-preserving nudged elastic band and dimer methods under anisotropic force uncertainty.”', venue: 'arXiv:2605.24401.', href: 'https://arxiv.org/abs/2605.24401' },
  ],

  skills: [
    { group: '编程语言', items: 'Python · C++（了解）· R' },
    { group: 'LLM 系统', items: 'PyTorch · Triton · CUDA（了解）· NCCL · Nsight Systems · PyTorchProfiler · NumPy' },
    { group: 'Agent', items: 'Claude Code · Codex' },
    { group: 'Data & Cloud', items: 'SQL · Polars · PySpark · Pandas · AWS Redshift · SageMaker' },
  ] as SkillGroup[],
};
