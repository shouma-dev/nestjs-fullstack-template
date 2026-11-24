import type { ChatMessage, Employee } from '../../shared/api.interface.js';

type Tone = 'formal' | 'warm' | 'energetic' | 'concise' | 'witty';
type Intent = 'greeting' | 'intro' | 'thanks' | 'summarize' | 'translate' | 'write' | 'plan' | 'question' | 'task' | 'default';

const toneNames: Record<Tone, string> = {
  formal: '严谨',
  warm: '亲切',
  energetic: '热情',
  concise: '简洁',
  witty: '轻松',
};

const toneRules: Array<[Tone, RegExp]> = [
  ['warm', /温柔|亲切|耐心|温暖|共情|陪伴|体贴|友好/],
  ['witty', /幽默|轻松|有趣|俏皮|段子|活泼/],
  ['energetic', /热情|积极|活力|主动|冲劲|鼓舞|推进力/],
  ['concise', /简洁|直接|干练|简短|利落|高效/],
  ['formal', /严谨|专业|准确|合规|审慎|冷静|理性/],
];

function hashText(text: string): number {
  let hash = 0;
  for (let index = 0; index < text.length; index += 1) hash = (hash * 31 + text.charCodeAt(index)) >>> 0;
  return hash;
}

function pick<T>(items: readonly T[], seed: number, offset = 0): T {
  return items[(seed + offset) % items.length];
}

function trimTopic(text: string): string {
  const cleaned = text.replace(/\s+/g, ' ').trim();
  return cleaned.length > 42 ? `${cleaned.slice(0, 42)}…` : cleaned;
}

function cleanTopic(text: string): string {
  const cleaned = text
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(请帮我|麻烦帮我|请|麻烦|帮我|帮忙|我想|我要|我需要|你能|能否|可以|可不可以)+/g, '')
    .replace(/[。！？!?，,、；;：:\s]+$/g, '')
    .trim();
  return trimTopic(cleaned || text.trim());
}

function detectTone(prompt: string, role: string): Tone {
  const source = `${role}\n${prompt}`;
  let best: Tone = 'formal';
  let bestScore = 0;
  for (const [tone, pattern] of toneRules) {
    const matches = source.match(new RegExp(pattern.source, 'g'));
    const score = matches?.length ?? 0;
    if (score > bestScore) {
      best = tone;
      bestScore = score;
    }
  }
  return best;
}

function personaRules(prompt: string): string[] {
  const lines = prompt
    .split(/\n+/)
    .map(line => line.replace(/^[\s>*#\-•·]+/, '').replace(/^\d+[.、)）]\s*/, '').trim())
    .filter(line => line.length >= 6 && line.length <= 56);
  const matched = lines.filter(line => /(原则|准则|要求|风格|语气|边界|不要|必须|始终|优先|关注|擅长|保持|先)/.test(line));
  if (matched.length) return [...new Set(matched)].slice(0, 2);
  const clauses = prompt.split(/[；;。]/).map(item => item.trim()).filter(item => item.length >= 6);
  return clauses.slice(1, 3).map(item => (item.length > 56 ? `${item.slice(0, 56)}…` : item));
}

function personaSummary(prompt: string): string {
  const first = prompt.split(/[。\n；;]/).map(item => item.trim()).filter(Boolean)[0] ?? '';
  return first.length > 72 ? `${first.slice(0, 72)}…` : first;
}

function clipSentence(text: string, max = 64): string {
  const value = text.replace(/\s+/g, ' ').trim();
  return value.length > max ? `${value.slice(0, max)}…` : value;
}

function stripSummaryInstruction(text: string): string {
  return text
    .replace(/^(请|麻烦|帮我|帮忙|请帮我|麻烦帮我)+/, '')
    .replace(/^(总结|概括|提炼|摘要|归纳)(一下|这段|这篇|以下)?[：:，,]?\s*/, '')
    .trim();
}

function detectIntent(text: string): Intent {
  const value = text.trim().toLowerCase();
  if (/^(你好|您好|hi|hello|hey|在吗|在不在|早上好|中午好|下午好|晚上好)(呀|啊|哦|呢)?[\s!！。,.，?？~～]*$/.test(value)) return 'greeting';
  if (/(你是谁|介绍一下你自己|自我介绍|你能做什么|你会什么|你的能力|你擅长)/.test(value)) return 'intro';
  if (/^(谢谢|感谢|辛苦了|多谢|thanks|thx)/.test(value)) return 'thanks';
  if (/(总结|概括|提炼|摘要|归纳|summary)/.test(value)) return 'summarize';
  if (/(翻译|译成|英文版|英语版|translate)/.test(value)) return 'translate';
  if (/(写|起草|文案|邮件|稿子|方案|报告|周报|ppt|提纲)/.test(value)) return 'write';
  if (/(计划|安排|排期|日程|待办|清单|步骤|流程|规划)/.test(value)) return 'plan';
  if (/(为什么|如何|怎么|是什么|区别|建议|是否|能不能|可以吗|吗$|[?？]$)/.test(value)) return 'question';
  if (/(帮我|处理|跟进|推进|做一下|搞定|整理)/.test(value)) return 'task';
  return 'default';
}

const genericLeads: Record<Tone, readonly string[]> = {
  formal: ['收到。', '明白，我来说明。'],
  warm: ['好呀，我来帮你。', '收到～'],
  energetic: ['收到，马上安排！', '好，交给我。'],
  concise: ['收到。', '明白。'],
  witty: ['好嘞，这活儿我熟。', '收到，开始。'],
};

export function generateAgentReply(employee: Employee, history: ChatMessage[], content: string): string {
  const intent = detectIntent(content);
  const tone = detectTone(employee.prompt, employee.role);
  const seed = hashText(`${employee.id}|${content}|${history.length}`);
  const role = employee.role || 'AI 同事';
  const topic = cleanTopic(content);
  const rules = personaRules(employee.prompt);
  const capabilities = employee.capabilities.slice(0, 4);
  const previous = [...history].reverse().find(message => message.role === 'user');
  const contextLine = previous && previous.content.trim() !== content.trim() && seed % 2 === 0
    ? `接着前面「${trimTopic(cleanTopic(previous.content))}」的进度，我们继续。\n`
    : '';
  const opener = pick([
    `收到。我以${role}的视角来处理「${topic}」。`,
    `明白。关于「${topic}」，我按${role}的标准梳理如下。`,
  ], seed);
  const lead = pick(genericLeads[tone], seed);

  if (intent === 'greeting') {
    const line = employee.greeting || `我会用${toneNames[tone]}的方式和你一起推进工作。`;
    return [
      `你好，我是${employee.name}，${role}。`,
      line,
      rules.length ? `我会坚持：${rules.join('；')}。` : `我的风格是${toneNames[tone]}，会先确认目标再给下一步。`,
      capabilities.length ? `你可以直接让我做：${capabilities.join('、')}。` : '直接把任务发给我就行，我们只有这一个固定对话。',
    ].join('\n');
  }

  if (intent === 'intro') {
    return [
      `我是${employee.name}，负责${role}。`,
      personaSummary(employee.prompt) ? `人设提示词里写着：${personaSummary(employee.prompt)}。` : '我会严格按你设定的人设回应每一次对话。',
      rules.length ? `我会遵守：${rules.join('；')}。` : `我的风格是${toneNames[tone]}。`,
      capabilities.length ? `我能帮你的方向：${capabilities.join('、')}。` : '我擅长把模糊需求拆成可执行的下一步。',
      '我们的对话是固定的，你随时可以补充背景。',
    ].join('\n');
  }

  if (intent === 'thanks') {
    return [
      `${lead}能帮上就好。`,
      pick(['这件事我会继续盯着，有进展就在这个对话里同步。', '有新的信息直接发我，我会接着前面的上下文往下做。'], seed),
      '需要我顺手整理成下一步清单的话，也可以直接说。',
    ].join('\n');
  }

  if (intent === 'summarize') {
    const details = content
      .split(/[。！？!?\n]+/)
      .map(stripSummaryInstruction)
      .filter(sentence => sentence.length >= 8);
    const substantive = details.join('');
    if (details.length >= 2 && substantive.length >= 40) {
      return [
        `${lead}我先按你发来的内容做一版提炼：`,
        `一句话结论：${clipSentence(details[0])}`,
        '关键信息：',
        ...details.slice(1, 4).map((sentence, index) => `${index + 1}. ${clipSentence(sentence)}`),
        '如果有明确的决策项，把目标补一句，我可以继续压缩成给上级看的版本。',
      ].join('\n');
    }
    return [
      `${lead}把要总结的内容直接发我，原文、要点或会议记录都行。`,
      '我会按这个结构给你：',
      '1. 一句话结论',
      '2. 3–5 个关键信息',
      '3. 需要你决策或跟进的事项',
      '如果你希望更短、更正式或更口语，也一并告诉我。',
    ].join('\n');
  }

  if (intent === 'translate') {
    return [
      `${lead}把原文和目标语言发我，并告诉我使用场景。`,
      '我会先保留原意和语气，再按下面三点检查：',
      '1. 专有名词与数字是否准确',
      '2. 语气是否适合目标读者',
      '3. 长句是否已经拆成更容易读的表达',
      '需要正式商务版还是自然口语版，你定一个方向就行。',
    ].join('\n');
  }

  if (intent === 'write') {
    return [
      `${contextLine}${opener}`,
      `我先按「${topic}」给你一个可直接改写的骨架：`,
      '开头：一句话点明目的与对象。',
      '主体：按“现状—方案—收益”展开，每段先结论后依据。',
      '收尾：给出明确的下一步、负责人和时间点。',
      '你把受众、语气和字数补给我，我再落成完整版本。',
    ].join('\n');
  }

  if (intent === 'plan') {
    return [
      `${contextLine}${opener}`,
      `我先把「${topic}」拆成一个可执行的节奏：`,
      '1. 明确目标与交付物，写清完成标准。',
      '2. 收集输入材料，标出还缺什么。',
      '3. 产出第一版，先求可用再求完善。',
      '4. 复盘并收口，把下一步固定下来。',
      '你告诉我时间范围（今天/本周）和优先级，我可以继续排到具体时段。',
    ].join('\n');
  }

  if (intent === 'question') {
    return [
      `${contextLine}${opener}`,
      '这个问题我建议分三层看：',
      `• 目标：先确认「${topic}」要解决的结果，而不是只描述过程。`,
      '• 约束：把时间、人手和已有资料列出来，能排除一半不可行方案。',
      '• 取舍：优先做验证成本最低的一步，再根据反馈加码。',
      capabilities.length ? `结合我的“${capabilities[0]}”能力，我可以先把第一版框架搭出来。` : '我可以先把第一版框架搭出来，再由你校准。',
      '你补充背景和期望结果，我再收敛到具体动作。',
    ].join('\n');
  }

  if (intent === 'task') {
    return [
      `${contextLine}${opener}`,
      '我会按这个顺序推进：',
      '1. 对齐目标与验收标准，避免做完才发现方向不一致。',
      '2. 收集必要材料，并标出缺失信息。',
      `3. 产出第一版${capabilities.length ? `（重点用上我的“${capabilities[0]}”能力）` : ''}。`,
      '4. 你确认后，我再补风险与下一步。',
      rules.length ? `过程中我会保持“${rules[0]}”。` : `过程中我会保持${toneNames[tone]}的风格。`,
      '现在最需要你补一句：希望什么时候拿到结果？',
    ].join('\n');
  }

  return [
    `${contextLine}${opener}`,
    '我的处理思路是：',
    '1. 先确认你要的结果形态（结论、方案、清单还是草稿）。',
    `2. 我按${role}的标准给出第一版，并标出假设和风险。`,
    '3. 你补充约束后，我再迭代到可执行。',
    '你也可以直接说“给我一版”，我现在就开始。',
  ].join('\n');
}
