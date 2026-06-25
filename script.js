const SCORE_MAP = { 1: 3, 2: 2, 3: 1, 4: 0, 5: -1, 6: -2, 7: -3 };

const axes = [
  {
    id: 'origin', title: 'A. 起点性：S / R', left: 'S', right: 'R', leftName: 'Statement', rightName: 'Response',
    note: '左：配信者起点 / 右：コメント起点',
    comments: {
      left: '配信者が話題を提示し、リスナーが反応する構造です。',
      right: 'コメントが話題の起点になりやすい構造です。',
      neutral: '配信者起点とコメント起点が同じくらい混ざっています。'
    },
    questions: [
      ['この雑談では、配信者が先に話題を提示し、リスナーがそれに反応している。', 'リスナーのコメントや質問が起点となって、話題が広がっている。'],
      ['話題の方向性は、配信者がある程度コントロールしている。', '話題の方向性は、コメント欄の流れによって変わりやすい。'],
      ['コメントは、配信者の話への相槌・共感・ツッコミとして機能している。', 'コメントそのものが次の話題を生み出している。'],
      ['配信者が話したいことを持って配信している印象が強い。', 'リスナーの反応を見ながら話す内容を決めている印象が強い。'],
      ['コメントが少なくても、配信者の語りだけで一定時間成立する。', 'コメントが少ないと、話題の展開が止まりやすい。']
    ]
  },
  {
    id: 'publicity', title: 'B. 公共性：P / L', left: 'P', right: 'L', leftName: 'Public', rightName: 'Local',
    note: '左：初見にも共有しやすい / 右：配信者・コミュニティ固有',
    comments: {
      left: '初見にも共有しやすい話題が多いです。',
      right: '配信者やコミュニティ固有の濃さが出やすいです。',
      neutral: '公共的な話題とローカルな話題が同じくらい混ざっています。'
    },
    questions: [
      ['話題は、初見でも前提知識なしに理解しやすい。', '話題を理解するには、配信者やコミュニティの文脈を知っている必要がある。'],
      ['天気、季節、食べ物、流行、生活あるあるなど、広く共有できる話題が多い。', '配信者個人、仕事、家族、ペット、過去配信、常連ネタなど固有の話題が多い。'],
      ['初見でも自分の経験をコメントしやすい。', '常連や継続視聴者ほどコメントしやすい。'],
      ['話題の魅力は、一般的な共感しやすさにある。', '話題の魅力は、配信者本人やコミュニティ固有の濃さにある。'],
      ['誰が話してもある程度成立しそうな話題である。', 'その配信者だからこそ意味が出る話題である。']
    ]
  },
  {
    id: 'theme', title: 'C. テーマ性：T / F', left: 'T', right: 'F', leftName: 'Theme', rightName: 'Free',
    note: '左：テーマあり / 右：流れで展開',
    comments: {
      left: '話題が整理されやすく、アーカイブで追いやすいです。',
      right: 'ライブ感や偶発性が出やすいです。',
      neutral: 'テーマ性と自由な展開が同じくらいあります。'
    },
    questions: [
      ['この雑談には、最初から話すテーマやお題がある。', 'この雑談は、その場の流れで話題が決まっている。'],
      ['配信タイトルや冒頭説明から、何について話す配信か分かりやすい。', '配信タイトルや冒頭説明だけでは、何を話すか分かりにくい。'],
      ['話題が脱線しても、元のテーマに戻る力がある。', '話題が脱線すると、そのまま別の話題へ流れていく。'],
      ['アーカイブで見たとき、どの部分が何の話か整理しやすい。', 'アーカイブで見たとき、話題の区切りが分かりにくい。'],
      ['トークの中心になる話題が明確に存在する。', 'トークの中心は定まらず、話題の移動そのものを楽しむ。']
    ]
  },
  {
    id: 'body', title: 'D. 本体性：C / U', left: 'C', right: 'U', leftName: 'Content', rightName: 'Utility',
    note: '左：雑談が主目的 / 右：別目的のための雑談',
    comments: {
      left: '雑談そのものがコンテンツとして成立しています。',
      right: '雑談が別目的を達成するための機能になっています。',
      neutral: '雑談自体の価値と、別目的を支える役割が同じくらいあります。'
    },
    questions: [
      ['この雑談は、雑談そのものを楽しませることが主目的である。', 'この雑談は、高評価、登録、初見コメント、待機、進行維持など別目的のために使われている。'],
      ['視聴者は、このトークを聞くために配信へ来ている。', '視聴者は、耐久、歌、ゲーム、企画、告知など別の本編を目当てに来ている。'],
      ['雑談部分だけを切り出しても、コンテンツとして成立しやすい。', '雑談部分だけを切り出すと、場つなぎや進行補助に見えやすい。'],
      ['アーカイブ視聴でも、この雑談には価値が残りやすい。', 'この雑談の価値は、リアルタイムの場や達成目標に強く依存している。'],
      ['交流そのものが目的になっている。', '交流は、初見獲得・登録促進・コメント増加・耐久達成のための手段になっている。']
    ]
  }
];

const typeDefinitions = {
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

const form = document.querySelector('#checksheet');
const resultEl = document.querySelector('#result');
const messageEl = document.querySelector('#validation-message');

function renderQuestions() {
  form.innerHTML = axes.map(axis => `
    <section class="card axis" aria-labelledby="${axis.id}-title">
      <div class="axis-header">
        <div><h2 id="${axis.id}-title">${axis.title}</h2><p>${axis.leftName} / ${axis.rightName}</p></div>
        <p>${axis.note}</p>
      </div>
      ${axis.questions.map((question, index) => renderQuestion(axis, question, index)).join('')}
    </section>
  `).join('');
}

function renderQuestion(axis, question, index) {
  const name = `${axis.id}-${index}`;
  return `
    <div class="question">
      <p class="question-title">${index + 1}. どちらに近いですか？</p>
      <div class="pair"><span>${question[0]}</span><span>↔</span><span>${question[1]}</span></div>
      <div class="scale" role="radiogroup" aria-label="${axis.title} ${index + 1}問目">
        ${[1, 2, 3, 4, 5, 6, 7].map(value => `
          <label><input type="radio" name="${name}" value="${value}"><span>${value}</span></label>
        `).join('')}
      </div>
    </div>
  `;
}

function getAnswers() {
  return axes.flatMap(axis => axis.questions.map((_, index) => {
    const checked = form.querySelector(`input[name="${axis.id}-${index}"]:checked`);
    return checked ? Number(checked.value) : null;
  }));
}

function calculateAxisScores() {
  return axes.map(axis => {
    const score = axis.questions.reduce((sum, _, index) => {
      const checked = form.querySelector(`input[name="${axis.id}-${index}"]:checked`);
      return sum + SCORE_MAP[checked.value];
    }, 0);
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
  if (total <= 15) return '低い。中間的な雑談です。';
  if (total <= 30) return '中程度。一部の軸に傾向があります。';
  if (total <= 45) return '高い。かなり明確な型です。';
  return '非常に高い。タイプ傾向が強く出ています。';
}

function archiveComment(archiveCount) {
  if (archiveCount >= 3) return 'この雑談は、比較的アーカイブ視聴にも残りやすい型です。';
  if (archiveCount === 2) return 'この雑談は、アーカイブ向きとリアタイ向きの要素が半々です。';
  return 'この雑談は、リアルタイムの空気や参加感が強い型です。';
}

function buildResultText(scores, code, typeName, typeDescription, archiveCount, realtimeCount, confidence) {
  const scoreLines = scores.map(({ axis, score }) => `${axis.title.replace(/^[A-D]\. /, '')}：${score >= 0 ? '+' : ''}${score} / ${scoreLabel(score, axis.left, axis.right)}`);
  return [`${code}型：${typeName}`, typeDescription, '', ...scoreLines, '', `アーカイブ向き：${archiveCount} / 4`, `リアタイ向き：${realtimeCount} / 4`, `信頼度：${confidence} / 60（${confidenceText(confidence)}）`].join('\n');
}

function showResult() {
  const answers = getAnswers();
  const unanswered = answers.filter(answer => answer === null).length;
  if (unanswered > 0) {
    resultEl.hidden = true;
    messageEl.textContent = `未回答が${unanswered}問あります。すべて回答してください。`;
    return;
  }

  const scores = calculateAxisScores();
  const code = scores.map(item => item.symbol).join('');
  const [typeName, typeDescription] = typeDefinitions[code];
  const archiveCount = scores.filter(item => ['S', 'P', 'T', 'C'].includes(item.symbol)).length;
  const realtimeCount = 4 - archiveCount;
  const confidence = scores.reduce((sum, item) => sum + Math.abs(item.score), 0);
  const resultText = buildResultText(scores, code, typeName, typeDescription, archiveCount, realtimeCount, confidence);

  messageEl.textContent = '';
  resultEl.hidden = false;
  resultEl.innerHTML = `
    <h2>判定結果</h2>
    <div class="type-code">${code}型</div>
    <h3>${typeName}</h3>
    <p>${typeDescription}</p>
    <h3>各軸スコア</h3>
    <div class="score-grid">
      ${scores.map(({ axis, score }) => `<div class="pill">${axis.title.replace(/^[A-D]\. /, '')}：${score >= 0 ? '+' : ''}${score} / ${scoreLabel(score, axis.left, axis.right)}</div>`).join('')}
    </div>
    <h3>各軸の短評</h3>
    <ul>${scores.map(({ axis, score }) => `<li>${score === 0 ? axis.comments.neutral : score > 0 ? axis.comments.left : axis.comments.right}</li>`).join('')}</ul>
    <h3>アーカイブ向き / リアタイ向き</h3>
    <div class="tendency"><div class="pill">アーカイブ向き：${archiveCount} / 4</div><div class="pill">リアタイ向き：${realtimeCount} / 4</div></div>
    <p>${archiveComment(archiveCount)}</p>
    <h3>信頼度</h3>
    <p><strong>${confidence} / 60</strong>：${confidenceText(confidence)}</p>
    <p class="notice">この分類は配信者の能力評価ではなく、雑談の構造を整理するためのものです。同じ配信内でも時間帯や話題によってタイプは変化します。</p>
    <button type="button" id="copy-result">結果をコピー</button>
  `;
  document.querySelector('#copy-result').addEventListener('click', async () => {
    await navigator.clipboard.writeText(resultText);
    messageEl.textContent = '結果をコピーしました。';
  });
  resultEl.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

function resetAnswers() {
  form.reset();
  resultEl.hidden = true;
  resultEl.innerHTML = '';
  messageEl.textContent = '回答をリセットしました。';
  window.scrollTo({ top: 0, behavior: 'smooth' });
}

renderQuestions();
document.querySelector('#show-result').addEventListener('click', showResult);
document.querySelector('#reset-answers').addEventListener('click', resetAnswers);
