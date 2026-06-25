const SCORE_MAP = { 1: 3, 2: 2, 3: 1, 4: 0, 5: -1, 6: -2, 7: -3 };
const RESULT_ENDPOINT = ''; // Google Apps ScriptのWebアプリURLを入れてください。
const SYMBOLS = [['S', 'R'], ['P', 'L'], ['T', 'F'], ['C', 'U']];
const COMPATIBILITY_WEIGHTS = [25, 25, 20, 30];

const broadcasterAxes = [
  { id: 'origin', title: 'A. 起点性：S / R', left: 'S', right: 'R', leftName: 'Statement', rightName: 'Response', note: '左：配信者起点 / 右：コメント起点', comments: { left: '配信者が話題を提示し、リスナーが反応する構造です。', right: 'コメントが話題の起点になりやすい構造です。', neutral: '配信者起点とコメント起点が同じくらい混ざっています。' } },
  { id: 'publicity', title: 'B. 公共性：P / L', left: 'P', right: 'L', leftName: 'Public', rightName: 'Local', note: '左：初見にも共有しやすい / 右：配信者・コミュニティ固有', comments: { left: '初見にも共有しやすい話題が多いです。', right: '配信者やコミュニティ固有の濃さが出やすいです。', neutral: '公共的な話題とローカルな話題が同じくらい混ざっています。' } },
  { id: 'theme', title: 'C. テーマ性：T / F', left: 'T', right: 'F', leftName: 'Theme', rightName: 'Free', note: '左：テーマあり / 右：流れで展開', comments: { left: '話題が整理されやすく、アーカイブで追いやすいです。', right: 'ライブ感や偶発性が出やすいです。', neutral: 'テーマ性と自由な展開が同じくらいあります。' } },
  { id: 'body', title: 'D. 本体性：C / U', left: 'C', right: 'U', leftName: 'Content', rightName: 'Utility', note: '左：雑談が主目的 / 右：別目的のための雑談', comments: { left: '雑談そのものがコンテンツとして成立しています。', right: '雑談が別目的を達成するための機能になっています。', neutral: '雑談自体の価値と、別目的を支える役割が同じくらいあります。' } }
];

const broadcasterQuestions = [
  [['この雑談では、配信者が先に話題を提示し、リスナーがそれに反応している。', 'リスナーのコメントや質問が起点となって、話題が広がっている。'], ['話題の方向性は、配信者がある程度コントロールしている。', '話題の方向性は、コメント欄の流れによって変わりやすい。'], ['コメントは、配信者の話への相槌・共感・ツッコミとして機能している。', 'コメントそのものが次の話題を生み出している。'], ['配信者が話したいことを持って配信している印象が強い。', 'リスナーの反応を見ながら話す内容を決めている印象が強い。'], ['コメントが少なくても、配信者の語りだけで一定時間成立する。', 'コメントが少ないと、話題の展開が止まりやすい。']],
  [['話題は、初見でも前提知識なしに理解しやすい。', '話題を理解するには、配信者やコミュニティの文脈を知っている必要がある。'], ['天気、季節、食べ物、流行、生活あるあるなど、広く共有できる話題が多い。', '配信者個人、仕事、家族、ペット、過去配信、常連ネタなど固有の話題が多い。'], ['初見でも自分の経験をコメントしやすい。', '常連や継続視聴者ほどコメントしやすい。'], ['話題の魅力は、一般的な共感しやすさにある。', '話題の魅力は、配信者本人やコミュニティ固有の濃さにある。'], ['誰が話してもある程度成立しそうな話題である。', 'その配信者だからこそ意味が出る話題である。']],
  [['この雑談には、最初から話すテーマやお題がある。', 'この雑談は、その場の流れで話題が決まっている。'], ['配信タイトルや冒頭説明から、何について話す配信か分かりやすい。', '配信タイトルや冒頭説明だけでは、何を話すか分かりにくい。'], ['話題が脱線しても、元のテーマに戻る力がある。', '話題が脱線すると、そのまま別の話題へ流れていく。'], ['アーカイブで見たとき、どの部分が何の話か整理しやすい。', 'アーカイブで見たとき、話題の区切りが分かりにくい。'], ['トークの中心になる話題が明確に存在する。', 'トークの中心は定まらず、話題の移動そのものを楽しむ。']],
  [['この雑談は、雑談そのものを楽しませることが主目的である。', 'この雑談は、高評価、登録、初見コメント、待機、進行維持など別目的のために使われている。'], ['視聴者は、このトークを聞くために配信へ来ている。', '視聴者は、耐久、歌、ゲーム、企画、告知など別の本編を目当てに来ている。'], ['雑談部分だけを切り出しても、コンテンツとして成立しやすい。', '雑談部分だけを切り出すと、場つなぎや進行補助に見えやすい。'], ['アーカイブ視聴でも、この雑談には価値が残りやすい。', 'この雑談の価値は、リアルタイムの場や達成目標に強く依存している。'], ['交流そのものが目的になっている。', '交流は、初見獲得・登録促進・コメント増加・耐久達成のための手段になっている。']]
];

const listenerAxes = [
  { id: 'origin', title: 'A. 起点嗜好：S / R', left: 'S', right: 'R', leftName: 'Statement嗜好', rightName: 'Response嗜好', note: '左：配信者の語り / 右：コメント起点', comments: { left: '配信者が話題を提示し、それに反応する雑談を好みやすいです。', right: 'コメントや質問を起点に話が広がる雑談を好みやすいです。', neutral: '配信者の語りとコメント起点のどちらにも寄りすぎない中間傾向です。' } },
  { id: 'topic', title: 'B. 話題嗜好：P / L', left: 'P', right: 'L', leftName: 'Public嗜好', rightName: 'Local嗜好', note: '左：初見にも共有しやすい / 右：固有で濃い話題', comments: { left: '初見でも共有しやすい、公共性の高い話題を好みやすいです。', right: '配信者やコミュニティ固有の濃い話題を好みやすいです。', neutral: '公共的な話題と固有の濃い話題を同じくらい楽しめる中間傾向です。' } },
  { id: 'structure', title: 'C. 構造嗜好：T / F', left: 'T', right: 'F', leftName: 'Theme嗜好', rightName: 'Free嗜好', note: '左：テーマあり / 右：偶発的な流れ', comments: { left: 'テーマやお題があり、見通しのよい雑談を好みやすいです。', right: '無軌道で、偶発性やライブ感のある雑談を好みやすいです。', neutral: 'テーマの分かりやすさと偶発的な流れのどちらも楽しめる中間傾向です。' } },
  { id: 'value', title: 'D. 視聴価値：C / U', left: 'C', right: 'U', leftName: 'Content嗜好', rightName: 'Utility嗜好', note: '左：雑談そのもの / 右：参加・応援・場づくり', comments: { left: '雑談そのものをコンテンツとして楽しみやすいです。', right: '雑談を通じた参加、応援、場づくり、達成感に価値を感じやすいです。', neutral: '雑談そのものの面白さと、参加・応援の価値を同じくらい見ています。' } }
];

const listenerQuestions = [
  [['配信者が自分から話し始める雑談を聞くのが好きだ。', 'コメントや質問から話が広がる雑談が好きだ。'], ['コメントをしなくても、配信者の語りだけで満足できる。', '自分や他のリスナーのコメントが拾われる方が楽しい。'], ['雑談では、配信者の考えや体験談を聞きたい。', '雑談では、コメント欄とのやり取りを見たい。'], ['ラジオのように聞ける雑談が好きだ。', '会話に参加している感覚がある雑談が好きだ。'], ['コメント欄が静かでも、配信者が話していれば楽しめる。', 'コメント欄が動いていないと、雑談として少し物足りない。']],
  [['初見でも分かる話題が多い雑談の方が入りやすい。', 'その配信者を知っている人向けの話題の方が楽しい。'], ['天気、食べ物、季節、流行などの話が好きだ。', '配信者の生活、仕事、ペット、過去配信の話が好きだ。'], ['自分の経験をコメントしやすい話題があると参加しやすい。', 'その配信者固有の話を深く聞ける方が満足度が高い。'], ['誰でも入れる空気の雑談が好きだ。', '常連だからこそ分かる空気の雑談が好きだ。'], ['話題の分かりやすさを重視する。', '話題の濃さや親密さを重視する。']],
  [['何について話す配信か分かる雑談の方が見やすい。', '何を話すか分からない雑談の方が楽しい。'], ['テーマやお題がある雑談が好きだ。', 'その場の流れで話題が変わる雑談が好きだ。'], ['アーカイブで見返しやすい雑談が好きだ。', 'リアルタイムで流れに乗る雑談が好きだ。'], ['話題が整理されている方が安心して聞ける。', '話題が脱線していく方がライブ感があって好きだ。'], ['「今日はこの話」と決まっている方が見に行きやすい。', '「何も決めてない」雑談の方が気軽に見られる。']],
  [['雑談そのものを聞くために配信を見ることが多い。', '雑談を通じて配信を盛り上げたり応援したりするのが好きだ。'], ['アーカイブでも楽しめる雑談に価値を感じる。', 'リアルタイムで参加してこそ価値がある雑談に惹かれる。'], ['配信者の話がコンテンツとして面白いかを重視する。', 'コメント、初見対応、高評価、登録などで場が動くことを重視する。'], ['雑談だけで1本の配信として成立している方が好きだ。', '歌枠、ゲーム、耐久、企画の中で発生する雑談の方が参加しやすい。'], ['「聞いてよかった」と思える話を求める。', '「参加して支えられた」と思える場を求める。']]
];

function withQuestions(axes, questionGroups) {
  return axes.map((axis, index) => ({ ...axis, questions: questionGroups[index] }));
}

const broadcasterTypeDescriptions = {
  SPTC: ['公共テーマ語り型', '配信者が、誰でも分かりやすいテーマを提示し、それ自体を雑談コンテンツとして語る型。初見にも入りやすく、アーカイブ価値も高い。'],
  SPTU: ['公共テーマ補助型', '配信者が、別目的の配信中に公共性のあるテーマを話す型。場を温めやすく、初見も反応しやすいが、雑談自体は主役ではない。'],
  SPFC: ['公共フリートーク型', '配信者が、明確なテーマを決めずに公共性の高い話題を自由に話す型。聞き流しやすく、軽いラジオ感がある。'],
  SPFU: ['公共場つなぎ型', '別目的の配信中に、配信者が天気・食べ物・季節などの軽い話題で場をつなぐ型。リアタイの空気維持に強いが、アーカイブ価値は低め。'],
  SLTC: ['個人テーマ語り型', '配信者が、自分個人や活動に関するテーマを提示し、それ自体を雑談として語る型。配信者本人の魅力が出やすいが、説明不足だと初見には入りづらい。'],
  SLTU: ['個人テーマ補助型', '別目的の配信中に、配信者個人のテーマを補助的に話す型。本編に人柄を足すが、長くなりすぎると本来の目的を邪魔する。'],
  SLFC: ['個人フリートーク型', 'テーマを明確に決めず、配信者の近況・生活・思い出・活動周辺を自由に話す型。常連には強いが、初見には文脈が見えにくい場合がある。'],
  SLFU: ['個人場つなぎ型', '別目的の配信中に、配信者個人の小話で場をつなぐ型。距離の近さは出るが、アーカイブでは流されやすい。'],
  RPTC: ['公共お題コメント型', '公共性のあるテーマについて、リスナーコメントを起点に広げていく型。初見がコメントしやすく、参加型雑談として強い。'],
  RPTU: ['公共コメント補助型', '別目的の配信中に、公共性のあるテーマでコメントを拾い、場や進行を支える型。コメント欄を動かすための雑談として機能する。'],
  RPFC: ['公共反応フリー型', '明確なお題はないが、リスナーコメントから公共性のある話題が自然発生する型。ライブ感が強く、初見も入りやすい。'],
  RPFU: ['公共反応つなぎ型', '別目的の配信中に、リスナーの軽いコメントを拾って公共的な話題で場をつなぐ型。テンポよく拾えると場が温まるが、アーカイブには残りにくい。'],
  RLTC: ['身内テーマ共有型', 'ローカルなテーマについて、リスナーコメントを起点に共有・展開する型。コミュニティの濃度が出るが、初見には前提が必要になりやすい。'],
  RLTU: ['身内テーマ補助型', '別目的の配信中に、ローカルなテーマのコメントを拾って進行や場づくりに使う型。常連満足度を上げやすいが、多用すると閉じた空気になりやすい。'],
  RLFC: ['井戸端身内型', 'テーマを決めず、リスナーコメントを起点に、配信者やコミュニティ固有の話題が自由に転がる型。常連には居心地がよいが、初見には最も入りづらくなりやすい。'],
  RLFU: ['完全リアタイ場つなぎ型', '別目的の配信中に、常連コメントやローカルな反応を拾いながら、その場を維持する型。リアルタイム性が最も強く、アーカイブ視聴価値は低くなりやすい。']
};

const listenerTypeDescriptions = {
  SPTC: ['公共テーマ視聴型', '配信者が公共性の高いテーマを語る雑談を好むタイプ。天気、季節、食べ物、流行、生活あるあるなど、分かりやすい話題を配信者の語りで楽しみたい。初見にも入りやすい雑談や、アーカイブで追いやすい雑談と相性がよい。'],
  SPTU: ['公共テーマ参加支援型', '公共性の高いテーマを使いながら、耐久・告知・企画・初見対応などを支える雑談を好むタイプ。雑談そのものより、分かりやすい話題を通じて配信が動くことに価値を感じる。'],
  SPFC: ['公共ラジオ視聴型', '配信者が公共性の高い話題を、明確なテーマなしにゆるく話す雑談を好むタイプ。聞き流しやすい雑談、作業用BGMのような雑談、軽いラジオ感のある雑談と相性がよい。'],
  SPFU: ['公共場つなぎ許容型', '天気、食べ物、季節などの軽い世間話で場を保つ雑談を好むタイプ。高評価耐久、ゲーム待機、歌枠の曲間など、本編を支える軽い雑談に参加しやすい。'],
  SLTC: ['個人テーマ深掘り型', '配信者本人の仕事、生活、ペット、活動方針、過去の経験などをテーマとして深く聞きたいタイプ。配信者本人への関心が強く、アーカイブでじっくり追う雑談とも相性がよい。'],
  SLTU: ['個人支援参加型', '配信者個人の話を聞きながら、耐久・告知・活動支援・新規獲得などに参加したいタイプ。配信者を応援している感覚や、場を一緒に支えている感覚に価値を感じる。'],
  SLFC: ['生活密着視聴型', '配信者の近況、生活、思い出、活動周辺の話を自由に聞くのが好きなタイプ。明確なテーマがなくても、配信者の生活感や空気そのものを楽しめる。'],
  SLFU: ['個人場つなぎ親密型', '歌枠、ゲーム、耐久、作業配信などの合間に出る配信者個人の小話を楽しむタイプ。本編の合間に見える距離の近さや、人柄のにじみ出る瞬間に価値を感じる。'],
  RPTC: ['公共コメント参加型', '公共性の高いお題にコメントし、配信者に拾われながら話題が広がる雑談を好むタイプ。「みんなの好きな食べ物」「おすすめ作品」「最近買ってよかったもの」のような参加しやすい雑談と相性がよい。'],
  RPTU: ['公共コメント支援型', '公共性の高いコメントを通じて、耐久・企画・初見対応・場の活性化を支えることを好むタイプ。自分のコメントが配信の流れや達成目標に貢献することに価値を感じる。'],
  RPFC: ['公共反応ライブ型', '明確なお題がなくても、コメントから公共性のある話題が自然発生する雑談を好むタイプ。その場の流れで「寒い」「お腹すいた」「仕事終わった」などのコメントから話が広がる配信と相性がよい。'],
  RPFU: ['公共リアタイ支援型', '軽い公共的なコメント反応を通じて、場を温めたり、配信を支えたりすることを好むタイプ。アーカイブよりもリアルタイム参加に価値を感じやすい。'],
  RLTC: ['身内テーマ共有型', '配信者やコミュニティ固有のテーマについて、コメントを通じて共有・展開する雑談を好むタイプ。過去配信、定番ネタ、配信者のペットや活動事情など、知っているからこそ楽しめる話題に強い。'],
  RLTU: ['身内支援型', '常連文脈やローカルな話題を使って、耐久・企画・告知・場づくりを支えることを好むタイプ。配信者やコミュニティへの帰属感が強く、リアルタイムで場を支えることに価値を感じる。'],
  RLFC: ['井戸端常連型', 'テーマを決めず、リスナーコメントを起点に配信者やコミュニティ固有の話題が転がる雑談を好むタイプ。常連としての居心地や、その場の空気を楽しむ力が高い。'],
  RLFU: ['完全リアタイ常連支援型', '別目的の配信中に、常連コメントやローカルな反応で場を維持する雑談を好むタイプ。初見向き・アーカイブ向きというより、リアルタイムで配信を支えることに最も価値を感じる。']
};

const modes = {
  broadcaster: { label: 'あなたは配信者として回答中', shortLabel: '配信者', axes: withQuestions(broadcasterAxes, broadcasterQuestions), types: broadcasterTypeDescriptions, notice: 'この分類は配信者の能力評価ではなく、雑談の構造を整理するためのものです。同じ配信内でも時間帯や話題によってタイプは変化します。' },
  listener: { label: 'あなたはリスナーとして回答中', shortLabel: 'リスナー', axes: withQuestions(listenerAxes, listenerQuestions), types: listenerTypeDescriptions, notice: 'この診断はリスナーの優劣を示すものではなく、どのような雑談に視聴価値や居心地を感じやすいかを整理するものです。実際の好みは配信者本人への関心や、その日の気分によっても変わります。' }
};

const startScreen = document.querySelector('#start-screen');
const diagnosisScreen = document.querySelector('#diagnosis-screen');
const nicknameInput = document.querySelector('#nickname');
const form = document.querySelector('#checksheet');
const resultEl = document.querySelector('#result');
const messageEl = document.querySelector('#validation-message');
const modeLabel = document.querySelector('#mode-label');
let currentMode = '';
let latestListenerCode = '';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function getNickname() { return nicknameInput.value.trim(); }
function getAxes() { return currentMode ? modes[currentMode].axes : []; }
function formatSigned(score) { return `${score >= 0 ? '+' : ''}${score}`; }

function renderQuestions() {
  form.innerHTML = getAxes().map(axis => `
    <section class="card axis" aria-labelledby="${axis.id}-title">
      <div class="axis-header"><div><h2 id="${axis.id}-title">${axis.title}</h2><p>${axis.leftName} / ${axis.rightName}</p></div><p>${axis.note}</p></div>
      ${axis.questions.map((question, index) => renderQuestion(axis, question, index)).join('')}
    </section>`).join('');
}
function renderQuestion(axis, question, index) {
  const name = `${axis.id}-${index}`;
  return `<div class="question"><p class="question-title">${index + 1}. どちらに近いですか？</p><div class="pair"><span>${question[0]}</span><span>↔</span><span>${question[1]}</span></div><div class="scale" role="radiogroup" aria-label="${axis.title} ${index + 1}問目">${[1,2,3,4,5,6,7].map(value => `<label><input type="radio" name="${name}" value="${value}"><span>${value}</span></label>`).join('')}</div></div>`;
}
function getAnswers() {
  return getAxes().flatMap(axis => axis.questions.map((_, index) => form.querySelector(`input[name="${axis.id}-${index}"]:checked`)?.value ?? null));
}
function calculateAxisScores() {
  return getAxes().map(axis => {
    const score = axis.questions.reduce((sum, _, index) => sum + SCORE_MAP[form.querySelector(`input[name="${axis.id}-${index}"]:checked`).value], 0);
    return { axis, score, symbol: score >= 0 ? axis.left : axis.right };
  });
}
function scoreLabel(score, left, right) {
  if (score >= 6) return `${left}強め`;
  if (score >= 1) return `${left}やや強め`;
  if (score === 0) return `中間傾向（タイプコード上は${left}を採用）`;
  if (score >= -5) return `${right}やや強め`;
  return `${right}強め`;
}
function confidenceText(total) {
  if (total <= 15) return '低い。中間的な傾向です。';
  if (total <= 30) return '中程度。一部の軸に傾向があります。';
  if (total <= 45) return '高い。かなり明確な型です。';
  return '非常に高い。タイプ傾向が強く出ています。';
}
function typeDistance(a, b) { return [...a].filter((char, index) => char !== b[index]).length; }
function relatedTypes(code, distance) { return Object.keys(listenerTypeDescriptions).filter(type => typeDistance(code, type) === distance); }
function buildResultText(nickname, scores, code, typeName, typeDescription, confidence) {
  const scoreLines = scores.map(({ axis, score }) => `${axis.title.replace(/^[A-D]\. /, '')}：${formatSigned(score)} / ${scoreLabel(score, axis.left, axis.right)}`);
  return [`${nickname}さんの診断結果`, `${code}型：${typeName}`, typeDescription, '', ...scoreLines, '', `信頼度：${confidence} / 60（${confidenceText(confidence)}）`].join('\n');
}
function buildResultPayload(nickname, scores, code, typeName, confidence) {
  const payload = { submittedAt: new Date().toISOString(), mode: currentMode, nickname, code, typeName, confidence };
  scores.forEach(({ axis, score }) => { payload[`${axis.id}Score`] = score; payload[`${axis.id}Symbol`] = score >= 0 ? axis.left : axis.right; });
  return payload;
}
async function sendResultToSheet(payload) {
  if (!RESULT_ENDPOINT) { messageEl.textContent = '結果を表示しました。スプレッドシート送信先は未設定です。'; return; }
  try {
    await fetch(RESULT_ENDPOINT, { method: 'POST', mode: 'no-cors', headers: { 'Content-Type': 'text/plain;charset=utf-8' }, body: JSON.stringify(payload) });
    messageEl.textContent = '結果を表示し、スプレッドシートへ送信しました。';
  } catch (error) { messageEl.textContent = '結果は表示しましたが、スプレッドシート送信に失敗しました。'; }
}
function compatibility(listenerCode, broadcasterCode) {
  const matches = [], mismatches = [];
  const score = [...listenerCode].reduce((sum, char, index) => {
    const pair = SYMBOLS[index].join('/');
    if (char === broadcasterCode[index]) { matches.push(pair); return sum + COMPATIBILITY_WEIGHTS[index]; }
    mismatches.push(pair); return sum;
  }, 0);
  const rating = score >= 90 ? '非常に相性がよい' : score >= 70 ? '相性がよい' : score >= 50 ? '条件次第で楽しめる' : score >= 30 ? 'ズレを感じやすい' : 'かなり相性が悪い';
  return { score, rating, matches, mismatches };
}
function compatibilityDetail(listenerCode, broadcasterCode, result) {
  if (!result.mismatches.length) return '4軸すべてが一致しているため、居心地や参加感にズレが出にくい組み合わせです。';
  return `一致：${result.matches.join(' / ') || 'なし'}。不一致：${result.mismatches.join(' / ')}。不一致の軸では、求める雑談の起点・話題・流れ・価値が変わるため、参加の手応えに差が出る可能性があります。`;
}
function renderCompatibilityTool() {
  const options = Object.entries(broadcasterTypeDescriptions).map(([code, [name]]) => `<option value="${code}">${code}：${name}</option>`).join('');
  return `<h3>配信者タイプとの相性を見る</h3><div class="compatibility-box"><label for="broadcaster-type">配信者タイプ</label><select id="broadcaster-type">${options}</select><button type="button" id="check-compatibility">相性を見る</button><div id="compatibility-result" class="notice" hidden></div></div>`;
}
function updateCompatibility() {
  const broadcasterCode = document.querySelector('#broadcaster-type').value;
  const result = compatibility(latestListenerCode, broadcasterCode);
  const el = document.querySelector('#compatibility-result');
  el.hidden = false;
  el.innerHTML = `<strong>${result.score}点：${result.rating}</strong><ul><li>一致している軸：${result.matches.join(' / ') || 'なし'}</li><li>ズレている軸：${result.mismatches.join(' / ') || 'なし'}</li><li>${compatibilityDetail(latestListenerCode, broadcasterCode, result)}</li><li>ヒント：一致している軸を楽しみつつ、ズレる軸は「今日はそういう配信」と受け取ると見やすくなります。</li></ul>`;
}
function showResult() {
  const nickname = getNickname();
  if (!nickname) { messageEl.textContent = 'ニックネームを入力してください。'; startScreen.hidden = false; diagnosisScreen.hidden = true; resultEl.hidden = true; nicknameInput.focus(); return; }
  const unanswered = getAnswers().filter(answer => answer === null).length;
  if (unanswered > 0) { resultEl.hidden = true; messageEl.textContent = `未回答が${unanswered}問あります。すべて回答してください。`; return; }

  const scores = calculateAxisScores();
  const code = scores.map(item => item.symbol).join('');
  const [typeName, typeDescription] = modes[currentMode].types[code];
  const confidence = scores.reduce((sum, item) => sum + Math.abs(item.score), 0);
  const resultText = buildResultText(nickname, scores, code, typeName, typeDescription, confidence);
  latestListenerCode = currentMode === 'listener' ? code : '';

  messageEl.textContent = '';
  startScreen.hidden = true;
  diagnosisScreen.hidden = true;
  resultEl.hidden = false;
  resultEl.innerHTML = `<h2>判定結果</h2><p class="result-nickname">${escapeHtml(nickname)}さんの結果</p><div class="type-code">${code}型</div><h3>${typeName}</h3><p>${typeDescription}</p><h3>各軸スコア</h3><div class="score-grid">${scores.map(({ axis, score }) => `<div class="pill">${axis.title.replace(/^[A-D]\. /, '')}：${formatSigned(score)} / ${scoreLabel(score, axis.left, axis.right)}</div>`).join('')}</div><h3>各軸の短評</h3><ul>${scores.map(({ axis, score }) => `<li>${score === 0 ? axis.comments.neutral : score > 0 ? axis.comments.left : axis.comments.right}</li>`).join('')}</ul>${currentMode === 'listener' ? `<h3>向いている配信タイプ</h3><p><strong>${code}型</strong>、${relatedTypes(code, 1).join('型、')}型</p><h3>苦手になりやすい配信タイプ</h3><p>${[...relatedTypes(code, 3), ...relatedTypes(code, 4)].join('型、')}型</p>${renderCompatibilityTool()}` : ''}<h3>信頼度</h3><p><strong>${confidence} / 60</strong>：${confidenceText(confidence)}</p><p class="notice">${modes[currentMode].notice}</p><div class="result-actions"><button type="button" id="copy-result">結果をコピー</button><button type="button" id="restart-diagnosis" class="secondary">回答をリセット</button></div>`;
  document.querySelector('#copy-result').addEventListener('click', async () => { await navigator.clipboard.writeText(resultText); messageEl.textContent = '結果をコピーしました。'; });
  document.querySelector('#restart-diagnosis').addEventListener('click', resetAnswers);
  document.querySelector('#check-compatibility')?.addEventListener('click', updateCompatibility);
  sendResultToSheet(buildResultPayload(nickname, scores, code, typeName, confidence));
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}
function resetAnswers() {
  form.reset(); startScreen.hidden = false; diagnosisScreen.hidden = true; resultEl.hidden = true; resultEl.innerHTML = ''; messageEl.textContent = '回答をリセットしました。'; window.scrollTo({ top: 0, behavior: 'smooth' });
}
function startDiagnosis(mode) {
  if (!getNickname()) { messageEl.textContent = 'ニックネームを入力してください。'; nicknameInput.focus(); return; }
  if (!modes[mode]) { messageEl.textContent = '配信者 / リスナーを選択してください。'; return; }
  currentMode = mode; modeLabel.textContent = modes[currentMode].label; renderQuestions(); messageEl.textContent = `${modes[currentMode].shortLabel}向けの設問に切り替えました。`; startScreen.hidden = true; diagnosisScreen.hidden = false; resultEl.hidden = true; diagnosisScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.start-diagnosis').forEach(button => button.addEventListener('click', () => startDiagnosis(button.dataset.mode)));
nicknameInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); messageEl.textContent = '配信者 / リスナーを選択してください。'; } });
form.addEventListener('change', () => { if (getAnswers().every(answer => answer !== null)) showResult(); });
document.querySelector('#show-result').addEventListener('click', showResult);
document.querySelector('#reset-answers').addEventListener('click', resetAnswers);

window.diagnosisTestApi = { SCORE_MAP, modes, calculateTypeFromScores: scores => scores.map((score, index) => score >= 0 ? SYMBOLS[index][0] : SYMBOLS[index][1]).join(''), scoreLabel, compatibility };
