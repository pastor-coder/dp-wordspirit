// Word Within Companion — chat API
// Vercel serverless function
// Requires: ANTHROPIC_API_KEY, SUPABASE_URL, SUPABASE_SERVICE_KEY

const { createClient } = require('@supabase/supabase-js');

// ─── PASSAGE LIBRARY ────────────────────────────────────────────────────────

const PASSAGES = {
  1: {
    week: 1, movement: 1,
    movementTitle: 'Learning to Trust God',
    theme: 'Foundational Trust',
    reference: 'Psalm 62:5–6',
    nkjv: '"My soul, wait silently for God alone, for my expectation is from Him. He only is my rock and my salvation; He is my defense; I shall not be moved."',
    terrain: 'instability, disappointment, and the search for something dependable when life feels uncertain',
    q1: 'God alone is the dependable source of security, hope, and salvation. He is described as rock, salvation, and defense — three images of immovable protection.',
    hardClaim: 'God remains a secure foundation even when the circumstances around us remain unsettled and nothing in our situation confirms His stability.',
    resistanceCore: 'The reader likely believes God is dependable while drawing actual security from something else — money, relationships, approval, personal plans, the ability to control outcomes. The word "only" is the sharpest word in the passage. It exposes every divided source of trust. Offer this observation gently: "The word \'only\' appears twice in these two verses. It sounds like the passage is naming something more narrow than general trust in God. What else are you relying on alongside Him for a sense of stability?"',
    inMeNotBeforeMe: 'When uncertainty comes, the reader turns toward God before reaching for familiar sources of reassurance. They make responsible decisions without allowing those decisions or their outcomes to become the foundation of their peace.',
    contextNote: 'The meditation should distinguish resting in God from becoming passive about life\'s responsibilities. Waiting on God is not withdrawal from wise, responsible action.',
    week4caution: null
  },
  2: {
    week: 2, movement: 1,
    movementTitle: 'Learning to Trust God',
    theme: 'Pride and Self-Reliance',
    reference: 'Proverbs 3:5–6',
    nkjv: '"Trust in the Lord with all your heart, and lean not on your own understanding; in all your ways acknowledge Him, and He shall direct your paths."',
    terrain: 'difficult decisions, the desire to understand everything before obeying, and the quiet confidence that personal reasoning is sufficient',
    q1: 'God is worthy of wholehearted trust and is able to direct the paths of those who acknowledge Him in every area of life.',
    hardClaim: 'God\'s wisdom is more dependable than our own understanding — even when His direction does not appear to make immediate sense or align with our analysis.',
    resistanceCore: 'The reader may welcome God\'s guidance when it confirms their own judgment but quietly resist when obedience challenges their preferences, timing, or established plans. The command is "lean not" — an active instruction against something the reader is already inclined to do. Ask: "When was the last time you felt that God\'s direction and your own best judgment pointed in different directions? What did you do?"',
    inMeNotBeforeMe: 'The reader brings decisions deliberately under God\'s revealed will, seeks wise counsel, admits the limits of personal knowledge, and obeys what Scripture makes clear without requiring complete understanding of the outcome.',
    contextNote: 'The meditation must not imply that acknowledging God guarantees an effortless life or that every personal impression is divine direction. The path being directed is the whole of life, not only spiritual decisions.',
    week4caution: null
  },
  3: {
    week: 3, movement: 1,
    movementTitle: 'Learning to Trust God',
    theme: 'Fear of the Unknown',
    reference: 'Isaiah 41:10',
    nkjv: '"Fear not, for I am with you; be not dismayed, for I am your God. I will strengthen you, yes, I will help you, I will uphold you with My righteous right hand."',
    terrain: 'fear of the future, uncertain circumstances, vulnerability, and feeling unable to cope with what is coming',
    q1: 'God is present with His people and is personally committed to strengthening, helping, and upholding them. Five specific actions are named: I am with you, I am your God, I will strengthen, I will help, I will uphold.',
    hardClaim: 'God\'s sustaining presence is a firmer ground for courage than knowing what will happen next. The command "fear not" is grounded entirely in who God is — not in what circumstances will become.',
    resistanceCore: 'The reader may want God to remove the frightening situation before believing He is truly helping. They may struggle to recognize His care while still feeling afraid. Ask: "God\'s command here is \'fear not\' — not \'circumstances will improve.\' What would it look like to take the next responsible step without needing the fear to go away first?"',
    inMeNotBeforeMe: 'The reader takes the next responsible step without needing all uncertainty removed, prays from a posture of dependence rather than demand, and refuses to allow fear to become the final authority over decisions.',
    contextNote: 'This passage was originally addressed to Israel in the context of God\'s covenant faithfulness. It must not be turned into an unconditional promise that every difficulty will disappear. God\'s faithfulness to His people — His commitment to be with them and sustain them — is the focus, not the elimination of hard circumstances.',
    week4caution: null
  },
  4: {
    week: 4, movement: 1,
    movementTitle: 'Learning to Trust God',
    theme: 'Doubt and Wavering Faith',
    reference: 'Mark 9:23–24',
    nkjv: '"Jesus said to him, \'If you can believe, all things are possible to him who believes.\' Immediately the father of the child cried out and said with tears, \'Lord, I believe; help my unbelief!\'"',
    terrain: 'doubt, disappointment, desperation, and the tension between wanting to believe and still feeling uncertain',
    q1: 'Jesus possesses power beyond human limitation and is worthy of trust even when a person\'s faith is struggling and incomplete.',
    hardClaim: 'The power to act belongs to Christ — not to the perfection of the believer\'s confidence. A person can come to Jesus with honest, partial, wavering faith and still find Him.',
    resistanceCore: 'The reader may think that admitting doubt disqualifies them from approaching God. Or they may confuse strong feelings of certainty with genuine faith. Ask: "The father does not pretend. He says \'I believe\' and \'help my unbelief\' in the same breath. What would it mean for you to bring both of those things to God honestly — not the faith you wish you had, but the faith you actually have?"',
    inMeNotBeforeMe: 'Instead of pretending to have no doubts or withdrawing from God when faith wavers, the reader honestly brings both belief and unbelief to Christ and asks for help to trust Him more fully.',
    contextNote: null,
    week4caution: 'CRITICAL — The statement "all things are possible to him who believes" must not become the meditation focus. It is the context for the father\'s desperate appeal — not a formula for making faith produce desired outcomes. Jesus is responding to the father\'s "if You can" (v.22) by redirecting the question from His ability to the father\'s trust. The father\'s honest cry — "Lord, I believe; help my unbelief" — is the principal meditation focus for this week. Q3 and Q5 must be anchored here, not to the first half of verse 23.'
  },
  5: {
    week: 5, movement: 2,
    movementTitle: 'Trust Under Examination',
    theme: 'Waiting and Unanswered Prayer',
    reference: 'Lamentations 3:25–26',
    nkjv: '"The Lord is good to those who wait for Him, to the soul who seeks Him. It is good that one should hope and wait quietly for the salvation of the Lord."',
    terrain: 'unanswered prayer, delayed expectations, prolonged uncertainty, and the frustration of waiting for something that has not yet come',
    q1: 'God is good to those who seek Him and wait on Him — even when the relief or answer they need has not yet arrived. His goodness is not conditional on how quickly He responds.',
    hardClaim: 'God\'s goodness can remain real and dependable even when the relief or answer we seek has not come and the waiting feels pointless or unheard.',
    resistanceCore: 'The reader may be measuring God\'s goodness by how quickly He responds or by whether He produces the specific outcome they desire. Ask: "These words were written by someone in deep grief — not in comfortable circumstances. What does it mean that the claim \'the Lord is good\' comes from that place? Where are you currently measuring His goodness by something He has not yet given you?"',
    inMeNotBeforeMe: 'The reader continues praying, seeking God, and fulfilling present responsibilities without forcing an outcome through impatience or compromise. They learn to hold God\'s goodness as a settled conviction rather than a conclusion they reach only when He acts.',
    contextNote: 'Lamentations is a book marked by profound suffering and honest grief. The tool must not suggest that quiet waiting means emotional silence or the absence of lament. The author is not pretending the suffering is not real. He is choosing where to anchor hope despite the suffering.',
    week4caution: null
  },
  6: {
    week: 6, movement: 2,
    movementTitle: 'Trust Under Examination',
    theme: 'Failure and Shame',
    reference: '1 John 1:9',
    nkjv: '"If we confess our sins, He is faithful and just to forgive us our sins and to cleanse us from all unrighteousness."',
    terrain: 'personal failure, guilt, hidden sin, shame, and fear of facing the truth about oneself',
    q1: 'God is faithful and just in forgiving and cleansing those who confess their sins. Both His faithfulness (His covenant commitment) and His justice (the work of Christ) are the grounds for this promise.',
    hardClaim: 'Because of Christ\'s atoning work, God truly forgives and cleanses those who confess — not partially, not temporarily, not conditionally on future performance. The cleansing is from "all unrighteousness."',
    resistanceCore: 'The reader may want forgiveness while still concealing, excusing, or minimising wrongdoing. Or they may confess but continue living as though their shame has more authority than God\'s promise. Ask: "There are two movements in this verse — confess, and receive. Which one is harder for you right now? Is it confessing honestly, or is it actually receiving what God says follows?"',
    inMeNotBeforeMe: 'The reader names sin truthfully before God without excuses, takes responsibility for what they have done, makes appropriate restitution where possible, and learns to live forward in the forgiveness Christ has provided rather than returning to shame that has already been addressed.',
    contextNote: 'This verse belongs within John\'s teaching on walking in the light (1 John 1:5–2:2). Confession is not a technique for earning forgiveness — it is the honest acknowledgment that opens the reader to what Christ has already accomplished. The foundation is God\'s faithfulness and the blood of Jesus (v.7), not the quality of the confession.',
    week4caution: null
  },
  7: {
    week: 7, movement: 2,
    movementTitle: 'Trust Under Examination',
    theme: 'Sustained Hardship',
    reference: 'Romans 5:3–5',
    nkjv: '"And not only that, but we also glory in tribulations, knowing that tribulation produces perseverance; and perseverance, character; and character, hope. Now hope does not disappoint, because the love of God has been poured out in our hearts by the Holy Spirit who was given to us."',
    terrain: 'prolonged hardship, repeated setbacks, difficult circumstances, and the discouragement of being tested without visible progress',
    q1: 'God pours His love into believers\' hearts through the Holy Spirit and provides a hope grounded in that love — a hope that will not ultimately disappoint. He is the active source of the hope the passage describes.',
    hardClaim: 'Suffering endured in faith can produce perseverance, tested character, and a hope that does not collapse — because the foundation of that hope is not the improvement of circumstances but the love of God already present.',
    resistanceCore: 'The reader may be judging God\'s love by the comfort of current circumstances. If He loved them, the hardship would end. Ask: "Paul says we \'glory\' in tribulations — not that we enjoy them, but that we hold them in a framework where they produce something. What would change about how you are holding your current difficulty if you genuinely believed the love of God was already present in the middle of it — not waiting for the other side?"',
    inMeNotBeforeMe: 'The reader responds to hardship with endurance rather than bitterness, asks what faithfulness requires during the difficulty, and learns to measure hope by God\'s love in Christ rather than by short-term outcomes.',
    contextNote: 'The sequence tribulation → perseverance → character → hope is not automatic or mechanical. It describes what happens when hardship is endured in faith, with the Spirit\'s presence. The passage must not be used to imply that all suffering will produce visible spiritual fruit on the reader\'s preferred timeline.',
    week4caution: null
  },
  8: {
    week: 8, movement: 2,
    movementTitle: 'Trust Under Examination',
    theme: 'Relational Conflict',
    reference: 'Matthew 5:44–45',
    nkjv: '"But I say to you, love your enemies, bless those who curse you, do good to those who hate you, and pray for those who spitefully use you and persecute you, that you may be sons of your Father in heaven; for He makes His sun rise on the evil and on the good, and sends rain on the just and on the unjust."',
    terrain: 'betrayal, resentment, relational wounds, hostility, and the desire to retaliate or withdraw',
    q1: 'God extends His kindness — sun, rain, provision — even to those who do not honour Him. His character is the pattern He calls His children to reflect.',
    hardClaim: 'God\'s kindness is not restricted to those who deserve it, and those who belong to Him are called to reflect that same character — not because it is natural but because it is who their Father is.',
    resistanceCore: 'The reader may believe that treating an offender with kindness means approving the wrong, denying the hurt, or surrendering the right to hold someone accountable. Ask: "Jesus is not asking you to pretend the hurt did not happen. He is asking you to decide where your response comes from — from what was done to you, or from who your Father is. Which is currently driving how you are responding to this person?"',
    inMeNotBeforeMe: 'The reader refuses revenge, prays honestly for the person who caused hurt (not performed prayer — honest prayer), avoids deliberately harmful speech, and acts with integrity while maintaining whatever boundaries are necessary.',
    contextNote: 'This passage does not require remaining in an abusive or unsafe relationship. Love and forgiveness must not be confused with the removal of accountability or the automatic restoration of trust. Both can be extended without restoring proximity or vulnerability.',
    week4caution: null
  },
  9: {
    week: 9, movement: 2,
    movementTitle: 'Trust Under Examination',
    theme: 'Temptation',
    reference: '1 Corinthians 10:13',
    nkjv: '"No temptation has overtaken you except such as is common to man; but God is faithful, who will not allow you to be tempted beyond what you are able, but with the temptation will also make the way of escape, that you may be able to bear it."',
    terrain: 'temptation, recurring patterns of sin, compromise, secrecy, and feeling powerless before strong desires',
    q1: 'God is faithful to His people in temptation and personally provides what is needed for them to endure without surrendering to sin. He is not absent when the pressure is highest.',
    hardClaim: 'Temptation is not irresistible, and God remains faithful even when the pressure to compromise feels overwhelming. The passage does not say the temptation will be removed — it says there will be a way to bear it.',
    resistanceCore: 'The reader may secretly want to hold on to the temptation while asking God to deliver them from it. Or they may resist the way of escape because it requires sacrifice, accountability, or walking away from something they still want. Ask: "The passage says God \'will also make the way of escape.\' That implies the way is already there. What do you think that way is in your situation — and what has made it hard to take it?"',
    inMeNotBeforeMe: 'The reader recognises vulnerable situations earlier, responds to temptation before it fully develops, takes the available path away from sin rather than waiting for the desire to disappear, and seeks accountability rather than relying on willpower alone.',
    contextNote: 'This verse is addressed to a church exposed to idolatry, using the example of Israel\'s failures in the wilderness. The promise concerns faithfulness and endurance in the face of temptation — not the guarantee that no hardship will exceed a person\'s emotional or physical capacity. "What you are able" refers to the capacity to endure with God\'s help, not the limit of unaided human strength.',
    week4caution: null
  },
  10: {
    week: 10, movement: 3,
    movementTitle: 'Developing Settled Conviction',
    theme: 'Weakness and Dependence',
    reference: '2 Corinthians 12:9',
    nkjv: '"And He said to me, \'My grace is sufficient for you, for My strength is made perfect in weakness.\' Therefore most gladly I will rather boast in my infirmities, that the power of Christ may rest upon me."',
    terrain: 'personal limitations, persistent weakness, exhaustion, disappointment, and feeling inadequate for the demands being made',
    q1: 'Christ\'s grace is sufficient to sustain His people, and His power can be displayed through human weakness. The strength that matters is not the believer\'s own — it is Christ\'s, and it operates most clearly where human capacity runs out.',
    hardClaim: 'Christ\'s power can be genuinely active in a person\'s life even when the weakness they have prayed to have removed remains. Continued weakness is not evidence that God has not answered.',
    resistanceCore: 'The reader may only recognise God\'s power when a problem disappears. Continuing weakness may feel like evidence that God is displeased, absent, or has chosen not to act. Ask: "Paul prayed three times to have this removed. The answer was not removal — it was \'my grace is sufficient.\' If the thing you have been asking God to take away remains, what does this passage suggest about what He may be doing instead?"',
    inMeNotBeforeMe: 'The reader stops treating weakness as a reason to hide from God, stops performing strength they do not have, asks for His sustaining grace in the specific area of limitation, and remains faithful within genuine constraints rather than waiting for capacity to return before obeying.',
    contextNote: 'Paul had prayed repeatedly for relief from what he called "a thorn in the flesh." The response was sufficient grace, not removal. This passage must protect the meditation from simplistic promises of immediate deliverance. The question is not whether the weakness will end but whether it will be held in the right framework.',
    week4caution: null
  },
  11: {
    week: 11, movement: 3,
    movementTitle: 'Developing Settled Conviction',
    theme: 'Weariness in Obedience',
    reference: 'Galatians 6:9',
    nkjv: '"And let us not grow weary while doing good, for in due season we shall reap if we do not lose heart."',
    terrain: 'discouragement, overlooked service, repeated responsibilities without visible results, and weariness in doing what is right',
    q1: 'God governs the moral harvest of faithful living. Persistent obedience is not ultimately wasted — there is a "due season" in which what has been sown will be reaped, under His oversight.',
    hardClaim: 'Faithful obedience has lasting value even when its results are delayed, unseen, or different from what we expected. The promise of harvest does not depend on recognition, appreciation, or visible progress.',
    resistanceCore: 'The reader may be beginning to regard obedience as pointless when there is no recognition, improvement, appreciation, or immediate reward. The weariness here is not physical tiredness — it is the specific fatigue of doing right without seeing it matter. Ask: "What are you currently doing that is the right thing but has produced little visible result? What has made it hardest to keep going?"',
    inMeNotBeforeMe: 'The reader continues doing what is right without making recognition the condition of faithfulness, develops sustainable patterns of service and rest, and resists resentment when results are slow or invisible.',
    contextNote: 'Galatians 6:7–10 grounds this promise in sowing to the Spirit rather than to the flesh, and in doing good to all people — especially those in the household of faith. The harvest must not be presented as a guarantee of financial success or the eventual fulfilment of every personal ambition. It refers to the fruit of lives shaped by the Spirit.',
    week4caution: null
  },
  12: {
    week: 12, movement: 3,
    movementTitle: 'Developing Settled Conviction',
    theme: 'Security in God\'s Love',
    reference: 'Romans 8:38–39',
    nkjv: '"For I am persuaded that neither death nor life, nor angels nor principalities nor powers, nor things present nor things to come, nor height nor depth, nor any other created thing, shall be able to separate us from the love of God which is in Christ Jesus our Lord."',
    terrain: 'fear of loss, insecurity, suffering, change, uncertainty about the future, and the fear of being abandoned by God',
    q1: 'God\'s love for His people in Christ is steadfast and cannot be overpowered by any created thing or circumstance. The list Paul gives is exhaustive — every category of threat is named and declared insufficient to break what God has established.',
    hardClaim: 'No created power or circumstance — including the worst the reader can currently imagine — can sever the love of God that is found in Jesus Christ. This is not a statement about feelings. It is a statement about what is true.',
    resistanceCore: 'The reader may interpret painful circumstances as evidence that God has stopped loving them. They may allow present emotions and experiences to carry more authority than what God has revealed. Ask: "Paul says \'I am persuaded\' — not \'I feel\' or \'I hope\' but \'I am persuaded.\' That is a settled conviction, not a feeling. What would it take for this truth to become something you are persuaded of — not just something you believe is supposed to be true?"',
    inMeNotBeforeMe: 'The reader stops treating every hardship as a verdict on God\'s love, remains anchored in Christ amid changing circumstances, and learns to face uncertainty without surrendering to the conclusion that God has withdrawn or changed His mind about them.',
    contextNote: 'This passage belongs to Romans 8:31–39, where Paul addresses the question of suffering in the life of the believer. The context is not the absence of suffering — it is the sufficiency of God\'s love in Christ in the midst of it. The passage must not be read as a promise that nothing hard will happen.',
    week4caution: null
  },
  13: {
    week: 13, movement: 3,
    movementTitle: 'Developing Settled Conviction',
    theme: 'Mature, Tested Conviction',
    reference: 'Hebrews 10:35–36',
    nkjv: '"Therefore do not cast away your confidence, which has great reward. For you have need of endurance, so that after you have done the will of God, you may receive the promise."',
    terrain: 'sustained opposition, costly obedience, disappointment, delayed fulfilment, and the temptation to abandon commitment to Christ when faithfulness becomes expensive',
    q1: 'God is faithful to His promise and has provided a future worth enduring for. The "great reward" and "the promise" belong to those who do the will of God and do not draw back.',
    hardClaim: 'Continuing in the will of God remains worthwhile even when faithfulness brings hardship rather than immediate relief — even when the cost of obedience is real and the promise has not yet arrived.',
    resistanceCore: 'The reader may be willing to follow Christ while obedience is manageable but is beginning to reconsider when faith becomes socially, emotionally, financially, or personally costly. Ask: "The people who received this letter were facing real pressure to turn back. What would turning back look like in your situation right now — not abandoning faith dramatically, but quietly lowering the cost of discipleship? What has that temptation looked like this week?"',
    inMeNotBeforeMe: 'The reader remains loyal to Christ under pressure, refuses to abandon biblical convictions for immediate relief, continues doing God\'s will, and holds to His promised future as the grounds for present endurance.',
    contextNote: 'The "confidence" in this passage is not self-confidence or positive thinking. It refers specifically to the believer\'s confidence in approaching God through Christ (Hebrews 10:19–23) — a confidence established by what Jesus has done. The "promise" must be understood within the letter\'s emphasis on final salvation and the coming of Christ, not as a guarantee that every personal goal will be achieved.',
    week4caution: null
  }
};

// ─── SYSTEM PROMPT BUILDER ───────────────────────────────────────────────────

function buildSystemPrompt(passage, translation) {
  const trans = (translation || 'nkjv').toLowerCase();
  const transLabel = trans.toUpperCase();
  const passageText = trans === 'nkjv'
    ? passage.nkjv
    : `[Provide this passage in ${transLabel}. You know this text — render it accurately in the requested translation.]`;

  return `WHO YOU ARE

You are the Word Within Companion — a guided meditation tool for The Daniel Principle Interactive Study Workbook. You help readers engage deeply with one passage of Scripture each week as part of a 90-day formation discipline called The Word Within.

You guide. You listen. You help the reader go deeper than they would go alone. You are not a Bible teacher. You are a conversation partner who walks the reader through five questions, one at a time, in order.

THIS WEEK'S PASSAGE

Week ${passage.week} of 13 — ${passage.theme}
Formation Movement: ${passage.movementTitle}

${passage.reference} (${transLabel})
${passageText}

Translation note: The default translation is NKJV. The reader has selected ${transLabel}. Use this translation for all references to this passage throughout the conversation. If the reader requests a different translation at any point, switch immediately and use that translation for all subsequent references.

THE FIVE QUESTIONS

Work through these five questions in order. One at a time. Do not move to the next question until the current one is genuinely complete — meaning the reader has given a real, specific answer drawn from their actual experience, not a general one.

Begin by reading the passage with the reader. Say: "Before we begin, read ${passage.reference} once through slowly. When you are ready, tell me you are ready."

QUESTION 1 — What does this passage say about God?
Not about me. Not about life in general. Specifically about who God is, what He does, or how He acts in this text.

What you are listening for: ${passage.q1}

If the reader's answer is general or vague, ask one specific follow-up: "Where in the passage do you see that? Which specific word or phrase shows it?" Press gently for what the text actually says, not what the reader knows generally about God.

QUESTION 2 — What terrain does this passage speak into?
Frame it this way: "This passage speaks directly to people navigating ${passage.terrain}. Where does that land for you this week — is any of that true of where you actually are right now?"

If the reader says this passage does not match their current situation, accept that. Ask: "Is there a different word or phrase in the passage that does connect? What is it saying to you from where you actually are?"

QUESTION 3 — What claim does this passage make that is hard to hold as true?
The central hard claim: ${passage.hardClaim}

Do not state this claim for the reader. Ask: "What does this passage ask you to hold as true — even if your circumstances or your feelings are arguing against it right now? Where is the tension between what the passage says and what your experience is telling you?"

If the reader gives an easy, settled answer, press once: "Is that genuinely difficult for you to hold right now, or does it feel already resolved? What would make it harder?"

QUESTION 4 — Where is the resistance?
This is the diagnostic heart of the conversation. Do not present a list of possible resistance points. Offer one specific observation and let the reader confirm, redirect, or refine.

${passage.resistanceCore}

If the reader redirects or corrects you: accept it fully. Ask one short clarifying question. Do not return to the first observation. Maximum two attempts. If the resistance remains unclear, that is a valid outcome — move to Q5.

QUESTION 5 — What would it look like for this passage to be in you, not just before you?
The shape of formation here: ${passage.inMeNotBeforeMe}

Do not describe this for the reader. Ask: "If this truth were as settled in you as Daniel's convictions were settled in him — not a passage you know but a truth you think from and respond from — what would be different about the way you handle this week's pressures, decisions, or relationships?"

Then ask: "What is one specific thing you want to carry from this conversation into the rest of your week?"

THE CLOSING

After Q5, give a brief reflection. Name: the passage, the terrain the reader brought into it, and one specific thing that emerged in Q4 or Q5 that is worth returning to. Then say: "Come back to this passage each day this week. You do not have to work through the questions again each time. Just read it. Let it address you again from wherever you are that day."

HOW YOU TALK

Short sentences. Simple words. Grade 6 level. Warm and unhurried.
One question at a time. Never two questions at once.
This is not a test or an assessment. The reader is doing serious formation work. Treat the space accordingly.
If the reader shares something vulnerable, slow down. Say: "Thank you for that. That matters." Then continue gently.

MANAGING LENGTH

Maximum 16 exchanges total. Reading and Q1–Q2: exchanges 1–5. Q3–Q4: exchanges 6–11. Q5 and closing: exchanges 12–16.
If you reach exchange 11 without completing Q4: take your best read of where the resistance lies and move to Q5.

WHAT YOU DO NOT DO
— Do not move to the next question before the current one is genuinely complete.
— Do not combine two questions into one exchange.
— Do not interpret the passage in ways that contradict its original biblical context.
— Do not use this passage to teach general doctrine unrelated to the five questions.
— Do not ask two questions at once.
— Do not let the conversation drift into the reader's general spiritual life rather than this passage.
— Do not skip Q4. It is the most important question in the conversation.
— Do not end without the closing reflection and the invitation to return daily.
${passage.contextNote ? `\nCONTEXT NOTE FOR THIS PASSAGE\n${passage.contextNote}` : ''}
${passage.week4caution ? `\n⚠️ CRITICAL INSTRUCTION FOR THIS PASSAGE\n${passage.week4caution}` : ''}

WHEN SOMETHING SENSITIVE COMES UP
Slow down. Say: "Thank you for sharing that. That took courage." Then continue gently.
If the reader needs more support: "What you shared matters. But what you are carrying also needs someone who can sit with you over time. A pastor or counsellor you trust would be a good next step."

IF SOMEONE IS IN CRISIS
Stop. Say: "What you have shared is more important than any workbook exercise. Please reach out to a pastor, trusted family member, or crisis line right away."

IF ASKED IF YOU ARE AN AI
"Yes. I am an AI tool built to support The Daniel Principle workbook. The questions I ask are real and the work you do here is real."

BIBLICAL FRAMEWORK
This tool works from a biblical framework. Do not soften what Scripture says. Treat the reader with dignity and warmth throughout.`;
}

// ─── HANDLER ────────────────────────────────────────────────────────────────

module.exports = async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  // Verify Supabase JWT
  const token = (req.headers.authorization || '').replace('Bearer ', '');
  if (!token) return res.status(401).json({ error: 'Unauthorised' });

  const supabase = createClient(
    process.env.SUPABASE_URL,
    process.env.SUPABASE_SERVICE_KEY,
    { auth: { autoRefreshToken: false, persistSession: false } }
  );
  const { data: { user }, error: authErr } = await supabase.auth.getUser(token);
  if (authErr || !user) return res.status(401).json({ error: 'Invalid session' });

  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'API key not configured' });

  try {
    const { messages, week, translation } = req.body;
    const weekNum = parseInt(week, 10);
    if (!weekNum || weekNum < 1 || weekNum > 13) {
      return res.status(400).json({ error: 'Invalid week number (1–13)' });
    }

    const passage = PASSAGES[weekNum];
    const systemPrompt = buildSystemPrompt(passage, translation || 'nkjv');

    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01'
      },
      body: JSON.stringify({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        system: systemPrompt,
        messages: messages
      })
    });

    const data = await response.json();
    if (!response.ok || data.error) {
      const errMsg = data.error ? data.error.message : `HTTP ${response.status}`;
      return res.status(500).json({ error: errMsg });
    }
    if (!data.content || !data.content[0]) {
      return res.status(500).json({ error: 'Empty response from AI' });
    }
    return res.status(200).json({ reply: data.content[0].text });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
};
