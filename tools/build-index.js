// Régénère content/index.json à partir des fichiers content/days/day-XX.json
// et vérifie que chaque sujet respecte le format (voir CONTENT_GUIDE.md).
// Usage : node tools/build-index.js
const fs = require('fs');
const path = require('path');

const root = path.join(__dirname, '..');
const dir = path.join(root, 'content', 'days');
const files = fs.readdirSync(dir).filter(f => /^day-\d+\.json$/.test(f)).sort();

const days = [];
const problems = [];
for (const f of files) {
  let t;
  try { t = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')); }
  catch (e) { problems.push(`${f}: JSON invalide (${e.message})`); continue; }

  const p = msg => problems.push(`${f}: ${msg}`);
  if (`day-${String(t.day).padStart(2, '0')}.json` !== f) p(`le champ "day" (${t.day}) ne correspond pas au nom du fichier`);
  for (const k of ['domain', 'title', 'subtitle', 'emoji']) if (!t[k]) p(`champ "${k}" manquant`);
  const cards = t.cards || [];
  if (cards.length < 11 || cards.length > 13) p(`${cards.length} cartes (attendu 11 à 13)`);
  if (cards[0]?.type !== 'hook') p('la 1re carte doit être de type "hook"');
  if (cards.at(-1)?.type !== 'takeaways') p('la dernière carte doit être "takeaways"');
  if (cards.at(-1)?.items?.length !== 3) p('"takeaways" doit avoir 3 items');
  if (!cards.some(c => c.type === 'france')) p('carte "france" manquante');
  cards.forEach((c, i) => {
    if (!['hook', 'text', 'figure', 'quote', 'france', 'takeaways'].includes(c.type)) p(`carte ${i + 1}: type inconnu "${c.type}"`);
    if (c.type === 'figure' && (!c.value || !c.label)) p(`carte ${i + 1}: figure sans value/label`);
    if (c.type === 'quote' && (!c.quote || !c.author)) p(`carte ${i + 1}: citation sans auteur`);
    if (['hook', 'text', 'france'].includes(c.type) && !c.body) p(`carte ${i + 1}: body vide`);
  });
  const quiz = t.quiz || [];
  if (quiz.length !== 4) p(`${quiz.length} questions (attendu 4)`);
  quiz.forEach((q, i) => {
    if (q.choices?.length !== 4) p(`question ${i + 1}: il faut 4 choix`);
    if (!(q.answer >= 0 && q.answer <= 3)) p(`question ${i + 1}: "answer" invalide`);
  });
  if (!(t.sources?.length >= 3)) p('au moins 3 sources attendues');
  (t.sources || []).forEach((s, i) => { if (!/^https?:\/\//.test(s.url || '')) p(`source ${i + 1}: URL invalide`); });

  days.push({ day: t.day, domain: t.domain, title: t.title, subtitle: t.subtitle, emoji: t.emoji });
}

days.sort((a, b) => a.day - b.day);
fs.writeFileSync(path.join(root, 'content', 'index.json'),
  JSON.stringify({ generated: new Date().toISOString(), count: days.length, days }, null, 2) + '\n');

console.log(`${days.length} sujets indexés.`);
if (problems.length) { console.log('\nProblèmes :\n- ' + problems.join('\n- ')); process.exitCode = 1; }
