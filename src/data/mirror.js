// Offline, rule-based reply engine for Mirror AI.
// Replaced by a real LLM (behind the backend, with safety filters) later; keep the same
// `reply(text, context)` contract so the screen doesn't change.

const CRISIS_PATTERNS = [
  /kill(ing)? my ?self/, /suicid/, /end(ing)? (my|it all|my life)/, /self[- ]?harm/, /hurt(ing)? my ?self/,
  /cut(ting)? my ?self/, /(don'?t|do not) want to (live|be alive|exist)/, /better off dead/, /no reason to live/,
  /want to die/, /overdose/, /take my (own )?life/,
];

export const isCrisis = (text) => CRISIS_PATTERNS.some((re) => re.test(text.toLowerCase()));

export const QUICK_PROMPTS = [
  "I'm feeling anxious",
  'Help me process a situation',
  'Daily reflection',
  'Give me a CBT tool',
  'Set a personal goal',
];

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)];

const TOOLS = {
  breathing:
    "Let's try box breathing together 🌿\n\n1. Breathe in through your nose for 4 seconds\n2. Hold for 4 seconds\n3. Breathe out slowly for 4 seconds\n4. Hold for 4 seconds\n\nRepeat 4–5 rounds. Notice your shoulders softening. How do you feel afterwards?",
  grounding:
    "Here's the 5-4-3-2-1 grounding exercise:\n\n• 5 things you can see\n• 4 things you can touch\n• 3 things you can hear\n• 2 things you can smell\n• 1 thing you can taste\n\nTake your time with each one. It gently brings your attention back to the present.",
  thoughtRecord:
    "A thought record can help untangle a difficult moment:\n\n1. Situation — what happened? (who, where, when)\n2. Feelings — name them and rate 0–100\n3. Automatic thought — what went through your mind?\n4. Evidence for the thought\n5. Evidence against it\n6. A more balanced thought\n7. Re-rate your feelings\n\nWould you like to walk through step 1 with me now?",
  activation:
    "Behavioural activation is a simple, powerful tool: when mood is low, small actions come first and motivation follows.\n\nPick one small, doable activity for today — a 10-minute walk, a shower, texting a friend, tidying one surface. Schedule it for a specific time. Afterwards, notice your mood even if the change is small. What could your one thing be?",
  breathing478:
    "Try 4-7-8 breathing:\n\n• Inhale quietly through your nose for 4\n• Hold for 7\n• Exhale fully through your mouth for 8\n\nDo 4 cycles. It's especially helpful before sleep.",
};

const REFLECTIONS = [
  'What is one moment from today you would like to remember?',
  'What drained your energy today, and what gave you energy?',
  'What is something you handled better than you expected recently?',
  'If you could tell your morning self one thing, what would it be?',
  'What are you grateful for right now — even something very small?',
];

const RULES = [
  { test: /(anxious|anxiety|panic|nervous|on edge|worr)/, reply: () => `It makes sense to feel anxious sometimes — your body is trying to protect you. Let's slow things down for a moment.\n\n${TOOLS.breathing}` },
  { test: /(stress|overwhelm|too much|burn ?out|pressure)/, reply: () => `That sounds like a lot to carry. When everything feels urgent, it can help to write down every task, then circle just one you can do in the next hour.\n\nWould a quick grounding exercise help first?\n\n${TOOLS.grounding}` },
  { test: /(sad|down|depress|low|empty|hopeless|unmotivated)/, reply: () => `I'm sorry you're feeling low. Those feelings are real and they deserve care, not judgement.\n\n${TOOLS.activation}` },
  { test: /(sleep|insomnia|can'?t sleep|tired)/, reply: () => `Rest matters so much for how we feel. A steady wake-up time, less screen light in the last hour, and a wind-down routine can help.\n\n${TOOLS.breathing478}` },
  { test: /(cbt|tool|technique|exercise|skill)/, reply: () => pick([TOOLS.thoughtRecord, TOOLS.grounding, TOOLS.activation, TOOLS.breathing]) },
  { test: /(ground|calm down|breath)/, reply: () => pick([TOOLS.grounding, TOOLS.breathing, TOOLS.breathing478]) },
  { test: /(process|situation|happened|argument|fight|conflict)/, reply: () => "I'm here to listen. Let's take it step by step.\n\nWhat happened, in a few sentences? Try to describe it like a camera would — just the facts. Then we can look at the feelings and thoughts that came with it." },
  { test: /(reflect|journal|today|day was)/, reply: () => `Let's take a quiet moment for reflection 🌅\n\n${pick(REFLECTIONS)}` },
  { test: /(angry|anger|frustrat|annoyed|irritat)/, reply: () => "Anger often tells us that something important to us was crossed. Before reacting, try pausing for 90 seconds — the physical surge usually peaks and fades in that time.\n\nWhat do you think the anger is protecting?" },
  { test: /(lonely|alone|isolat)/, reply: () => "Feeling lonely is painful, and it's more common than it seems. Is there one person you could send a simple message to today — even just \"thinking of you\"?\n\nSmall connections count." },
  { test: /(thank|thanks|helpful|better)/, reply: () => "I'm really glad that helped. Remember — progress isn't a straight line, and you're showing up for yourself. 💙" },
  { test: /(therapist|psychologist|psychiatrist|professional|session)/, reply: () => "Talking with a professional can make a real difference. You can browse psychologists and psychiatrists in Find My Match and book a session that suits you." },
  { test: /^(hi|hello|hey|salam|marhaba)\b/, reply: (ctx) => `Hi ${ctx.name} 👋 How are you feeling right now?` },
];

const FALLBACKS = [
  'Thank you for sharing that with me. How did that make you feel?',
  "I hear you. What feels most important about this for you right now?",
  'That sounds meaningful. What would you like to happen next?',
  "Let's stay with that for a moment. Where do you notice it in your body?",
  'What would you say to a close friend who told you this?',
];

export const CRISIS_REPLY =
  "I'm really sorry you're feeling this way, and I'm glad you told me. You deserve support right now from a real person.\n\nIf you're in immediate danger, please call emergency services. You can also reach a crisis line — tap \"Get help now\" below. You don't have to go through this alone. 💙";

// Returns { text, crisis?, goal? }. `context.awaitingGoal` means the previous AI turn asked for a goal.
export function reply(text, context) {
  const t = text.toLowerCase().trim();
  if (isCrisis(t)) return { text: CRISIS_REPLY, crisis: true };

  if (context.awaitingGoal) {
    return {
      text: `Wonderful — I've added "${text.trim()}" to your goals in My Journey. 🎯\n\nWhat's one tiny first step you could take toward it this week?`,
      goal: text.trim(),
    };
  }

  if (/(goal|intention|want to (start|change|improve))/.test(t)) {
    return {
      text: "Setting a goal is a great step. Try making it specific and small enough to start this week — for example \"walk for 10 minutes after lunch, 3 times this week\".\n\nWhat goal would you like to set?",
      asksGoal: true,
    };
  }

  const rule = RULES.find((r) => r.test.test(t));
  return { text: rule ? rule.reply(context) : pick(FALLBACKS) };
}
