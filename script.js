const SCORE_MAP = { 1: 3, 2: 2, 3: 1, 4: 0, 5: -1, 6: -2, 7: -3 };
const AGREEMENT_SCORE_MAP = { 1: -3, 2: -2, 3: -1, 4: 1, 5: 2, 6: 3 };
const AXIS_DIRECTIONS = {
  origin: { positive: 'S', negative: 'R' },
  publicity: { positive: 'P', negative: 'L' },
  theme: { positive: 'T', negative: 'F' },
  body: { positive: 'C', negative: 'U' }
};
const AGREEMENT_LABELS = {
  1: 'いいえ',
  2: 'どちらかといえば、いいえ',
  3: 'やや、いいえ',
  4: 'やや、はい',
  5: 'どちらかといえば、はい',
  6: 'はい'
};
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
  { id: 'bq-01', text: '雑談では、自分から話題を提供するようにしている。', group: 'S/R：起点性', scoring: [{ axis: 'origin', direction: 1, weight: 1.0 }] },
  { id: 'bq-02', text: 'コメントが少なくても、自分の語りだけで雑談を続けられる。', group: 'S/R：起点性', scoring: [{ axis: 'origin', direction: 1, weight: 1.0 }] },
  { id: 'bq-03', text: '盛り上がる話題は、リスナー発信で始まることが多い。', group: 'S/R：起点性', scoring: [{ axis: 'origin', direction: -1, weight: 1.0 }] },
  { id: 'bq-04', text: 'コメント欄の反応が薄いと、話しづらくなることがある。', group: 'S/R：起点性', scoring: [{ axis: 'origin', direction: -1, weight: 1.0 }] },
  { id: 'bq-05', text: '初見さんでも入ってこられる話題を選ぶように心がけている。', group: 'P/L：公共性', scoring: [{ axis: 'publicity', direction: 1, weight: 1.0 }] },
  { id: 'bq-06', text: '天気、食べ物、季節、流行など、広く共有できる話題をよく扱う。', group: 'P/L：公共性', scoring: [{ axis: 'publicity', direction: 1, weight: 1.0 }] },
  { id: 'bq-07', text: '内輪ネタに走り過ぎたと反省することがある。', group: 'P/L：公共性', scoring: [{ axis: 'publicity', direction: -1, weight: 1.0 }] },
  { id: 'bq-08', text: '一般的なトークより、リスナーとの掛け合いやチャンネル内のノリを扱っている時間が長い。', group: 'P/L：公共性', scoring: [{ axis: 'publicity', direction: -1, weight: 1.0 }] },
  { id: 'bq-09', text: '配信前に、話す内容をある程度決めている。', group: 'T/F：テーマ性', scoring: [{ axis: 'theme', direction: 1, weight: 1.0 }] },
  { id: 'bq-10', text: '話題が脱線しても、最終的には元のテーマに戻せる自信がある。', group: 'T/F：テーマ性', scoring: [{ axis: 'theme', direction: 1, weight: 1.0 }] },
  { id: 'bq-11', text: '何を話すかは、その場のノリで決めがちである。', group: 'T/F：テーマ性', scoring: [{ axis: 'theme', direction: -1, weight: 1.0 }] },
  { id: 'bq-12', text: '話題が脱線したら、そのまま面白い方向へ流すことが多い。', group: 'T/F：テーマ性', scoring: [{ axis: 'theme', direction: -1, weight: 1.0 }] },
  { id: 'bq-13', text: '雑談だけで、配信として成立させたい。', group: 'C/U：本体性', scoring: [{ axis: 'body', direction: 1, weight: 1.0 }] },
  { id: 'bq-14', text: 'アーカイブで見返しても楽しめる雑談を意識している。', group: 'C/U：本体性', scoring: [{ axis: 'body', direction: 1, weight: 1.0 }] },
  { id: 'bq-15', text: '雑談には、企画、耐久、歌、ゲームなど別の目的を組み合わせたい。', group: 'C/U：本体性', scoring: [{ axis: 'body', direction: -1, weight: 1.0 }] },
  { id: 'bq-16', text: 'その場にいるリスナーが参加して楽しめることを優先している。', group: 'C/U：本体性', scoring: [{ axis: 'body', direction: -1, weight: 1.0 }] },
  { id: 'bq-17', text: 'テーマを決めて、掘り下げるようなトークテーマ型の雑談が好きだ。', group: '複合設問', scoring: [{ axis: 'origin', direction: 1, weight: 0.75 }, { axis: 'theme', direction: 1, weight: 0.75 }] },
  { id: 'bq-18', text: 'コメントから始まった話題でも、ちゃんと結論やオチをつけてから次へ進みたい。', group: '複合設問', scoring: [{ axis: 'origin', direction: -1, weight: 0.75 }, { axis: 'theme', direction: 1, weight: 0.75 }] },
  { id: 'bq-19', text: '話題に困ったら、自分の近況やチャンネル内で通じる話をしがちである。', group: '複合設問', scoring: [{ axis: 'origin', direction: 1, weight: 0.75 }, { axis: 'publicity', direction: -1, weight: 0.75 }] },
  { id: 'bq-20', text: '初見コメントを見かけて、初見さんでも入ってこられるように話題を修正することがある。', group: '複合設問', scoring: [{ axis: 'origin', direction: -1, weight: 0.75 }, { axis: 'publicity', direction: 1, weight: 0.75 }] },
  { id: 'bq-21', text: '天気や時事ネタなど、広く共有できる話題だけで1枠喋れる自信がある。', group: '複合設問', scoring: [{ axis: 'publicity', direction: 1, weight: 0.75 }, { axis: 'body', direction: 1, weight: 0.75 }] },
  { id: 'bq-22', text: '自分のチャンネルの魅力は、リスナーとの掛け合いにあると思う。', group: '複合設問', scoring: [{ axis: 'publicity', direction: -1, weight: 0.75 }, { axis: 'body', direction: -1, weight: 0.75 }] },
  { id: 'bq-23', text: '全然予想していない流れでも、上手く乗りこなして面白い雑談にできる自信がある。', group: '複合設問', scoring: [{ axis: 'theme', direction: -1, weight: 0.75 }, { axis: 'body', direction: 1, weight: 0.75 }] },
  { id: 'bq-24', text: 'その場のノリやコメントの流れに助けられて、配信が成立したと感じることがある。', group: '複合設問', scoring: [{ axis: 'theme', direction: -1, weight: 0.75 }, { axis: 'body', direction: -1, weight: 0.75 }] }
];

const listenerAxes = [
  { id: 'origin', title: 'A. 起点嗜好：S / R', left: 'S', right: 'R', leftName: 'Statement嗜好', rightName: 'Response嗜好', note: '左：配信者の語り / 右：コメント起点', comments: { left: '配信者が話題を提示し、それに反応する雑談を好みやすいです。', right: 'コメントや質問を起点に話が広がる雑談を好みやすいです。', neutral: '配信者の語りとコメント起点のどちらにも寄りすぎない中間傾向です。' } },
  { id: 'publicity', title: 'B. 話題嗜好：P / L', left: 'P', right: 'L', leftName: 'Public嗜好', rightName: 'Local嗜好', note: '左：初見にも共有しやすい / 右：固有で濃い話題', comments: { left: '初見でも共有しやすい、公共性の高い話題を好みやすいです。', right: '配信者やコミュニティ固有の濃い話題を好みやすいです。', neutral: '公共的な話題と固有の濃い話題を同じくらい楽しめる中間傾向です。' } },
  { id: 'theme', title: 'C. 構造嗜好：T / F', left: 'T', right: 'F', leftName: 'Theme嗜好', rightName: 'Free嗜好', note: '左：テーマあり / 右：偶発的な流れ', comments: { left: 'テーマやお題があり、見通しのよい雑談を好みやすいです。', right: '無軌道で、偶発性やライブ感のある雑談を好みやすいです。', neutral: 'テーマの分かりやすさと偶発的な流れのどちらも楽しめる中間傾向です。' } },
  { id: 'body', title: 'D. 視聴価値：C / U', left: 'C', right: 'U', leftName: 'Content嗜好', rightName: 'Utility嗜好', note: '左：雑談そのもの / 右：参加・応援・場づくり', comments: { left: '雑談そのものをコンテンツとして楽しみやすいです。', right: '雑談を通じた参加、応援、場づくり、達成感に価値を感じやすいです。', neutral: '雑談そのものの面白さと、参加・応援の価値を同じくらい見ています。' } }
];

const listenerQuestions = [
  { id: 'lq-01', text: '配信者の話が聞きたくて雑談を見に行っている。', group: 'S/R：起点嗜好', scoring: [{ axis: 'origin', direction: 1, weight: 1.0 }] },
  { id: 'lq-02', text: 'ROM専だ。', group: 'S/R：起点嗜好', scoring: [{ axis: 'origin', direction: 1, weight: 1.0 }] },
  { id: 'lq-03', text: 'ガンガンチャットしておしゃべりしたい。', group: 'S/R：起点嗜好', scoring: [{ axis: 'origin', direction: -1, weight: 1.0 }] },
  { id: 'lq-04', text: 'コメント欄の反応によって、配信の流れが変わる方が楽しい。', group: 'S/R：起点嗜好', scoring: [{ axis: 'origin', direction: -1, weight: 1.0 }] },
  { id: 'lq-05', text: '初見でも入りやすい話題が多い配信を見たい。', group: 'P/L：公共性嗜好', scoring: [{ axis: 'publicity', direction: 1, weight: 1.0 }] },
  { id: 'lq-06', text: '今日あったことなどを言い合う配信が好きだ。', group: 'P/L：公共性嗜好', scoring: [{ axis: 'publicity', direction: 1, weight: 1.0 }] },
  { id: 'lq-07', text: '内輪に寄った話題が好きだ。', group: 'P/L：公共性嗜好', scoring: [{ axis: 'publicity', direction: -1, weight: 1.0 }] },
  { id: 'lq-08', text: '配信者と自分や他のリスナーの掛け合いを楽しんでいる。', group: 'P/L：公共性嗜好', scoring: [{ axis: 'publicity', direction: -1, weight: 1.0 }] },
  { id: 'lq-09', text: 'トークテーマがはっきりしている雑談が好きだ。', group: 'T/F：テーマ性嗜好', scoring: [{ axis: 'theme', direction: 1, weight: 1.0 }] },
  { id: 'lq-10', text: 'オチが気になるから脱線しないでほしい。', group: 'T/F：テーマ性嗜好', scoring: [{ axis: 'theme', direction: 1, weight: 1.0 }] },
  { id: 'lq-11', text: '無軌道なその場のノリの雑談が好きだ。', group: 'T/F：テーマ性嗜好', scoring: [{ axis: 'theme', direction: -1, weight: 1.0 }] },
  { id: 'lq-12', text: '脱線しっぱなしでも、面白ければそれでよい。', group: 'T/F：テーマ性嗜好', scoring: [{ axis: 'theme', direction: -1, weight: 1.0 }] },
  { id: 'lq-13', text: 'アーカイブでも推しの雑談の面白さは変わらないと思う。', group: 'C/U：視聴価値', scoring: [{ axis: 'body', direction: 1, weight: 1.0 }] },
  { id: 'lq-14', text: 'アーカイブで見返しても楽しめる雑談に価値を感じる。', group: 'C/U：視聴価値', scoring: [{ axis: 'body', direction: 1, weight: 1.0 }] },
  { id: 'lq-15', text: '雑談だけより、企画、耐久、歌、ゲームなどと組み合わさっている配信が好きだ。', group: 'C/U：視聴価値', scoring: [{ axis: 'body', direction: -1, weight: 1.0 }] },
  { id: 'lq-16', text: 'コメントをするために見に行っている。', group: 'C/U：視聴価値', scoring: [{ axis: 'body', direction: -1, weight: 1.0 }] },
  { id: 'lq-17', text: '配信者の話をじっくり深掘りする、語り合うような雑談が好きだ。', group: '複合設問', scoring: [{ axis: 'origin', direction: 1, weight: 0.75 }, { axis: 'theme', direction: 1, weight: 0.75 }] },
  { id: 'lq-18', text: 'ちゃんと話にオチをつけてほしいと思うことがある。', group: '複合設問', scoring: [{ axis: 'origin', direction: -1, weight: 0.75 }, { axis: 'theme', direction: 1, weight: 0.75 }] },
  { id: 'lq-19', text: '自分やほかのリスナーの話題が出てきても気にならない。', group: '複合設問', scoring: [{ axis: 'origin', direction: 1, weight: 0.75 }, { axis: 'publicity', direction: -1, weight: 0.75 }] },
  { id: 'lq-20', text: '初見さん向けに話題を変えたと察知して、乗ったことがある。', group: '複合設問', scoring: [{ axis: 'origin', direction: -1, weight: 0.75 }, { axis: 'publicity', direction: 1, weight: 0.75 }] },
  { id: 'lq-21', text: '誰でも入っていける話題を振ってくれるとありがたい。', group: '複合設問', scoring: [{ axis: 'publicity', direction: 1, weight: 0.75 }, { axis: 'body', direction: 1, weight: 0.75 }] },
  { id: 'lq-22', text: 'そのチャンネルならではのリスナーとの掛け合いを、リアルタイムで楽しみたい。', group: '複合設問', scoring: [{ axis: 'publicity', direction: -1, weight: 0.75 }, { axis: 'body', direction: -1, weight: 0.75 }] },
  { id: 'lq-23', text: '予想外の方向へ話題が転がっても、雑談として面白ければ楽しめる。', group: '複合設問', scoring: [{ axis: 'theme', direction: -1, weight: 0.75 }, { axis: 'body', direction: 1, weight: 0.75 }] },
  { id: 'lq-24', text: 'リアタイでコメントをすることに価値を感じている。', group: '複合設問', scoring: [{ axis: 'theme', direction: -1, weight: 0.75 }, { axis: 'body', direction: -1, weight: 0.75 }] }
];


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
  broadcaster: { label: 'あなたは配信者として回答中', shortLabel: '配信者', axes: broadcasterAxes, types: broadcasterTypeDescriptions, notice: 'この分類は配信者の能力評価ではなく、雑談の構造を整理するためのものです。同じ配信内でも時間帯や話題によってタイプは変化します。' },
  listener: { label: 'あなたはリスナーとして回答中', shortLabel: 'リスナー', axes: listenerAxes, types: listenerTypeDescriptions, notice: 'この診断はリスナーの優劣を示すものではなく、どのような雑談に視聴価値や居心地を感じやすいかを整理するものです。実際の好みは配信者本人への関心や、その日の気分によっても変わります。' }
};

const startScreen = document.querySelector('#start-screen');
const diagnosisScreen = document.querySelector('#diagnosis-screen');
const nicknameInput = document.querySelector('#nickname');
const form = document.querySelector('#checksheet');
const resultEl = document.querySelector('#result');
const messageEl = document.querySelector('#validation-message');
const modeLabel = document.querySelector('#mode-label');
const diagnosisDescription = document.querySelector('#diagnosis-description');
const scaleHelp = document.querySelector('#scale-help');
let currentMode = '';
let latestListenerCode = '';

function escapeHtml(value) {
  return String(value).replace(/[&<>'"]/g, char => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[char]));
}
function getNickname() { return nicknameInput.value.trim(); }
function getAxes() { return currentMode ? modes[currentMode].axes : []; }
function formatScore(score) { return Number.isInteger(score) ? String(score) : score.toFixed(2).replace(/0+$/, '').replace(/\.$/, ''); }
function formatSigned(score) { return `${score >= 0 ? '+' : ''}${formatScore(score)}`; }
function isBroadcasterMode() { return currentMode === 'broadcaster'; }

function renderQuestions() {
  form.innerHTML = renderAgreementQuestions(isBroadcasterMode() ? broadcasterQuestions : listenerQuestions, modes[currentMode].shortLabel);
}
function renderAgreementQuestions(questions, titlePrefix) {
  return `<section class="card axis" aria-labelledby="agreement-questions-title">
    <div class="axis-header"><div><h2 id="agreement-questions-title">${titlePrefix}向け設問</h2><p>6段階回答</p></div><p>単文設問</p></div>
    ${questions.map(renderAgreementQuestion).join('')}
  </section>`;
}
function renderAgreementQuestion(question, index) {
  return `<div class="question"><p class="question-title">${index + 1}. ${question.text}</p><p class="question-group">${question.group}</p><div class="scale agreement-scale" role="radiogroup" aria-label="${index + 1}問目">${Object.entries(AGREEMENT_LABELS).map(([value, label]) => `<label><input type="radio" name="${question.id}" value="${value}"><span>${value}</span><small>${label}</small></label>`).join('')}</div></div>`;
}
function getCurrentQuestions() {
  return isBroadcasterMode() ? broadcasterQuestions : listenerQuestions;
}
function getAgreementAnswersFromForm(questions = getCurrentQuestions()) {
  return Object.fromEntries(questions.map(question => [question.id, form.querySelector(`input[name="${question.id}"]:checked`)?.value ?? null]));
}
function getAnswers() {
  return Object.values(getAgreementAnswersFromForm());
}
function calculateAxisScores() {
  return calculateScoredQuestionAxisScores(getCurrentQuestions(), getAgreementAnswersFromForm(), getAxes());
}
function calculateScoredQuestionAxisScores(questions, answers, axes) {
  const scoresByAxis = Object.fromEntries(axes.map(axis => [axis.id, { axis, score: 0, maxScore: 0 }]));
  questions.forEach(question => {
    const answer = answers[question.id];
    if (!answer) return;
    const answerScore = AGREEMENT_SCORE_MAP[answer];
    question.scoring.forEach(({ axis, direction, weight }) => {
      scoresByAxis[axis].score += answerScore * direction * weight;
      scoresByAxis[axis].maxScore += 3 * weight;
    });
  });
  return axes.map(axis => {
    const item = scoresByAxis[axis.id];
    const direction = AXIS_DIRECTIONS[axis.id];
    return { ...item, symbol: item.score >= 0 ? direction.positive : direction.negative };
  });
}
function calculateBroadcasterAxisScores(answers = getAgreementAnswersFromForm(broadcasterQuestions)) {
  return calculateScoredQuestionAxisScores(broadcasterQuestions, answers, broadcasterAxes);
}
function calculateListenerAxisScores(answers = getAgreementAnswersFromForm(listenerQuestions)) {
  return calculateScoredQuestionAxisScores(listenerQuestions, answers, listenerAxes);
}
function scoreLabel(score, left, right, maxScore = 15) {
  const ratio = maxScore ? score / maxScore : 0;
  if (ratio >= 0.55) return `${left}強め`;
  if (ratio >= 0.15) return `${left}やや強め`;
  if (ratio > -0.15) return `中間傾向（タイプコード上は${left}を採用）`;
  if (ratio > -0.55) return `${right}やや強め`;
  return `${right}強め`;
}
function confidenceText(total, maxTotal = 60) {
  const ratio = maxTotal ? total / maxTotal : 0;
  if (ratio <= 0.25) return '低い。中間的な傾向です。';
  if (ratio <= 0.5) return '中程度。一部の軸に傾向があります。';
  if (ratio <= 0.75) return '高い。かなり明確な型です。';
  return '非常に高い。タイプ傾向が強く出ています。';
}
function typeDistance(a, b) { return [...a].filter((char, index) => char !== b[index]).length; }
function relatedTypes(code, distance) { return Object.keys(listenerTypeDescriptions).filter(type => typeDistance(code, type) === distance); }
function viewingTendencyText(archiveCount, realtimeCount) {
  if (archiveCount >= 3) return 'この診断結果は、比較的アーカイブ視聴にも残りやすい傾向です。';
  if (realtimeCount >= 3) return 'この診断結果は、リアルタイム参加やその場の空気に価値が出やすい傾向です。';
  return 'アーカイブ視聴とリアルタイム参加の要素が半々に出ています。';
}
function countViewingTendency(code) {
  const archiveSymbols = ['S', 'P', 'T', 'C'];
  const archiveCount = [...code].filter((char, index) => char === archiveSymbols[index]).length;
  return { archiveCount, realtimeCount: 4 - archiveCount };
}
function buildResultText(nickname, scores, code, typeName, typeDescription, confidence, tendency) {
  const modeName = modes[currentMode].shortLabel;
  const maxConfidence = scores.reduce((sum, item) => sum + item.maxScore, 0);
  const scoreLines = scores.map(({ axis, score, maxScore }) => `${axis.title.replace(/^[A-D]\. /, '')}：${formatSigned(score)} / ${scoreLabel(score, axis.left, axis.right, maxScore)}`);
  return [`${nickname}さんの診断結果`, `診断モード：${modeName}`, `${code}型：${typeName}`, typeDescription, '', `アーカイブ向き：${tendency.archiveCount} / 4`, `リアタイ向き：${tendency.realtimeCount} / 4`, viewingTendencyText(tendency.archiveCount, tendency.realtimeCount), '', ...scoreLines, '', `信頼度：${formatScore(confidence)} / ${formatScore(maxConfidence)}（${confidenceText(confidence, maxConfidence)}）`].join('\n');
}
function buildResultPayload(nickname, scores, code, typeName, confidence) {
  const tendency = countViewingTendency(code);
  const payload = { submittedAt: new Date().toISOString(), mode: currentMode, nickname, code, typeName, archiveCount: tendency.archiveCount, realtimeCount: tendency.realtimeCount, confidence };
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
  if (!result.mismatches.length) return ['4軸すべてが一致しているため、居心地や参加感にズレが出にくい組み合わせです。'];
  const mismatchDescriptions = [
    '話題の始まり方にズレがあります。片方は配信者の語りを好み、もう片方はコメント起点の展開を好みます。',
    '話題の広さにズレがあります。片方は初見にも開かれた話題を好み、もう片方は配信者やコミュニティ固有の濃い話題を好みます。',
    '話題の構造にズレがあります。片方はテーマのある見通しのよい雑談を好み、もう片方はその場の流れや偶発性を好みます。',
    '雑談の価値にズレがあります。片方は雑談そのものをコンテンツとして楽しみ、もう片方は参加・応援・達成への貢献に価値を感じます。'
  ];
  return [...listenerCode].flatMap((char, index) => char === broadcasterCode[index] ? [] : mismatchDescriptions[index]);
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
  el.innerHTML = `<strong>${result.score}点：${result.rating}</strong><ul><li>一致している軸：${result.matches.join(' / ') || 'なし'}</li><li>ズレている軸：${result.mismatches.join(' / ') || 'なし'}</li>${compatibilityDetail(latestListenerCode, broadcasterCode, result).map(detail => `<li>${detail}</li>`).join('')}<li>ヒント：一致している軸を楽しみつつ、ズレる軸は「今日はそういう配信」と受け取ると見やすくなります。</li></ul>`;
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
  const tendency = countViewingTendency(code);
  const resultText = buildResultText(nickname, scores, code, typeName, typeDescription, confidence, tendency);
  latestListenerCode = currentMode === 'listener' ? code : '';

  messageEl.textContent = '';
  startScreen.hidden = true;
  diagnosisScreen.hidden = true;
  resultEl.hidden = false;
  const maxConfidence = scores.reduce((sum, item) => sum + item.maxScore, 0);
  resultEl.innerHTML = `<h2>判定結果</h2><p class="result-nickname">${escapeHtml(nickname)}さんの結果</p><div class="type-code">${code}型</div><h3>${typeName}</h3><p>${typeDescription}</p><h3>視聴傾向</h3><p>アーカイブ向き：${tendency.archiveCount} / 4<br>リアタイ向き：${tendency.realtimeCount} / 4</p><p>${viewingTendencyText(tendency.archiveCount, tendency.realtimeCount)}</p><h3>各軸スコア</h3><div class="score-grid">${scores.map(({ axis, score, maxScore }) => `<div class="pill">${axis.title.replace(/^[A-D]\. /, '')}：${formatSigned(score)} / ${scoreLabel(score, axis.left, axis.right, maxScore)}</div>`).join('')}</div><h3>各軸の短評</h3><ul>${scores.map(({ axis, score }) => `<li>${score === 0 ? axis.comments.neutral : score > 0 ? axis.comments.left : axis.comments.right}</li>`).join('')}</ul>${currentMode === 'listener' ? `<h3>向いている配信タイプ</h3><p><strong>${code}型</strong>、${relatedTypes(code, 1).join('型、')}型</p><h3>苦手になりやすい配信タイプ</h3><p>${[...relatedTypes(code, 3), ...relatedTypes(code, 4)].join('型、')}型</p>${renderCompatibilityTool()}` : ''}<h3>信頼度</h3><p><strong>${formatScore(confidence)} / ${formatScore(maxConfidence)}</strong>：${confidenceText(confidence, maxConfidence)}</p><p class="notice">${modes[currentMode].notice}</p><div class="result-actions"><button type="button" id="copy-result">結果をコピー</button><button type="button" id="restart-diagnosis" class="secondary">回答をリセット</button></div>`;
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
  currentMode = mode;
  modeLabel.textContent = modes[currentMode].label;
  diagnosisDescription.textContent = isBroadcasterMode() ? '各設問について、どの程度そう思うかを6段階で選んでください。' : '各設問について、あなたにどの程度当てはまるかを6段階で選んでください。';
  scaleHelp.innerHTML = Object.entries(AGREEMENT_LABELS).map(([value, label]) => `<span>${value}：${label}</span>`).join('');
  renderQuestions(); messageEl.textContent = `${modes[currentMode].shortLabel}向けの設問に切り替えました。`; startScreen.hidden = true; diagnosisScreen.hidden = false; resultEl.hidden = true; diagnosisScreen.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

document.querySelectorAll('.start-diagnosis').forEach(button => button.addEventListener('click', () => startDiagnosis(button.dataset.mode)));
nicknameInput.addEventListener('keydown', event => { if (event.key === 'Enter') { event.preventDefault(); messageEl.textContent = '配信者 / リスナーを選択してください。'; } });
document.querySelector('#show-result').addEventListener('click', showResult);
document.querySelector('#reset-answers').addEventListener('click', resetAnswers);

function buildTestAnswers(questions, value) {
  return Object.fromEntries(questions.map(question => [question.id, String(value)]));
}
function buildBroadcasterTestAnswers(value) {
  return buildTestAnswers(broadcasterQuestions, value);
}
function buildListenerTestAnswers(value) {
  return buildTestAnswers(listenerQuestions, value);
}
function calculateTypeFromScoreItems(scores) {
  return scores.map(item => item.symbol).join('');
}

window.diagnosisTestApi = {
  SCORE_MAP,
  AGREEMENT_SCORE_MAP,
  AXIS_DIRECTIONS,
  broadcasterQuestions,
  listenerQuestions,
  broadcasterQuestionCount: () => broadcasterQuestions.length,
  listenerQuestionCount: () => listenerQuestions.length,
  modes,
  countViewingTendency,
  buildResultPayload,
  setCurrentMode: mode => { currentMode = mode; },
  buildBroadcasterTestAnswers,
  calculateBroadcasterAxisScores,
  calculateListenerAxisScores,
  buildListenerTestAnswers,
  calculateBroadcasterType: answers => calculateTypeFromScoreItems(calculateBroadcasterAxisScores(answers)),
  calculateListenerType: answers => calculateTypeFromScoreItems(calculateListenerAxisScores(answers)),
  calculateTypeFromScores: scores => scores.map((score, index) => score >= 0 ? SYMBOLS[index][0] : SYMBOLS[index][1]).join(''),
  scoreLabel,
  compatibility,
  compatibilityDetail
};
