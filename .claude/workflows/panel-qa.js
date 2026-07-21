export const meta = {
  name: 'panel-qa',
  description: 'Dinamik panel QA: bug + görsel hata + buton/fonksiyon taraması, adversarial doğrulama, yapılandırılmış rapor',
  whenToUse:
    'Panelde dönemsel kalite taraması istendiğinde ("panel-qa koş", "debug/görsel/buton taraması yap"). ' +
    'args ile kapsam daraltılabilir: { scope: "gorevler" } yalnız o bölümü tarar; argsız tüm panel.',
  phases: [
    { title: 'Bul', detail: 'paralel bulucular: bug · buton · rota · hata-yutma · görsel' },
    { title: 'Doğrula', detail: 'her bulguya çürütücü (adversarial) doğrulama' },
    { title: 'Rapor', detail: 'dedupe + önem sırası + otomatik-düzeltilebilir işareti' },
  ],
}

// ── Şema ────────────────────────────────────────────────────────────────────
const FINDINGS = {
  type: 'object',
  required: ['findings'],
  properties: {
    findings: {
      type: 'array',
      items: {
        type: 'object',
        required: ['file', 'line', 'category', 'description', 'severity', 'auto_fixable'],
        properties: {
          file: { type: 'string' },
          line: { type: 'integer' },
          category: { type: 'string' },
          description: { type: 'string' },
          severity: { type: 'string', enum: ['high', 'medium', 'low'] },
          auto_fixable: { type: 'boolean' },
        },
      },
    },
  },
}
const VERDICT = {
  type: 'object',
  required: ['real', 'reason'],
  properties: { real: { type: 'boolean' }, reason: { type: 'string' } },
}

const scope = args?.scope ? ` KAPSAM: yalnız "${args.scope}" bölümü/rotası ve onun bileşenleri.` : ''
const ctx =
  'Repo: /home/user/JadeGoldNYC — Next.js 16 (App Router, React 19, async params/searchParams AWAIT edilmeli), ' +
  'Supabase, Tailwind v4, Türkçe UI, para=cent+currency. Kanıt = dosya:satır; grep tek başına yetmez, çevre kodu OKU. ' +
  'Sahte-pozitif üretme: emin olmadığın bulguyu yazma.' + scope

// ── Faz 1: Bul — beş bağımsız mercek ────────────────────────────────────────
phase('Bul')
const LENSES = [
  {
    key: 'bug',
    prompt: `${ctx} MERCEK: mantık hataları. Ters koşullar, yanlış karşılaştırma, off-by-one, ` +
      `farklı kurları tek sayıya toplama, display-limit'li sorgudan sayı türetme (.length 50'de doyar), ` +
      `await edilmeyen params/searchParams/cookies, .maybeSingle() çoklu-satır patlaması, snapshot dedupe eksiği.`,
  },
  {
    key: 'buton',
    prompt: `${ctx} MERCEK: buton/fonksiyon tepkiselliği. Async server action tetikleyen ama pending/disabled ` +
      `durumu OLMAYAN butonlar (çift tık riski), useFormStatus'suz submit'ler, sonucu kullanıcıya hiç ` +
      `bildirmeyen action'lar (toast/feedback yok), sessizce return eden hata yolları.`,
  },
  {
    key: 'rota',
    prompt: `${ctx} MERCEK: kırık bağlantılar. components/ ve app/ içindeki href/router.push hedeflerini ` +
      `app/(dashboard) rota dizinleriyle çapraz kontrol et; olmayan rotaya link, yanlış dinamik segment, ` +
      `redirect hedefi kayıp sayfalar.`,
  },
  {
    key: 'hata-yutma',
    prompt: `${ctx} MERCEK: hata yutma. lib/db/queries/*.ts içinde "const { data }" ile .error'u hiç ` +
      `okumayan sorgular (özellikle kullanıcıya görünen sayı/karar besleyenler), count ?? 0 deseni, ` +
      `boş catch blokları, console.error'suz sessiz fallback'ler.`,
  },
  {
    key: 'gorsel',
    prompt: `${ctx} MERCEK: koddan görülebilir görsel hatalar. JSX'te {ifade}kelime bitişikliği (boşluksuz), ` +
      `truncation'sız uzun metin hücreleri, yalnız-dark ya da yalnız-light tanımlı stiller, negatif z-index ` +
      `kapanları, sabit piksel genişlikler (responsive kırılma), kontrast riski (muted üstüne muted).`,
  },
]

// ── Faz 2: Doğrula — her mercek biter bitmez bulguları çürütücüye ver ──────
const verified = await pipeline(
  LENSES,
  (l) => agent(l.prompt, { label: `bul:${l.key}`, phase: 'Bul', schema: FINDINGS }),
  (res, l) =>
    parallel(
      (res?.findings ?? []).slice(0, 12).map((f) => () =>
        agent(
          `${ctx} GÖREV: şu bulguyu ÇÜRÜTMEYE çalış (adversarial). Dosyayı ve çevresini oku; bulgu ` +
            `gerçek bir kusur mu yoksa yanlış alarm mı? Kararsızsan real=false. Bulgu: ${f.file}:${f.line} ` +
            `[${f.category}] ${f.description}`,
          { label: `dogrula:${l.key}`, phase: 'Doğrula', schema: VERDICT, effort: 'low' },
        ).then((v) => ({ ...f, lens: l.key, verdict: v })),
      ),
    ),
)

// ── Faz 3: Rapor — dedupe + sırala ─────────────────────────────────────────
phase('Rapor')
const all = verified.filter(Boolean).flat().filter(Boolean)
const confirmed = all.filter((f) => f.verdict?.real)
const seen = new Set()
const unique = confirmed.filter((f) => {
  const k = `${f.file}:${f.line}`
  if (seen.has(k)) return false
  seen.add(k)
  return true
})
const order = { high: 0, medium: 1, low: 2 }
unique.sort((a, b) => (order[a.severity] ?? 3) - (order[b.severity] ?? 3))
log(`${all.length} aday → ${unique.length} doğrulanmış bulgu`)
return {
  confirmed: unique,
  rejected: all.length - confirmed.length,
  note: 'auto_fixable=true olanlar güvenle uygulanabilir; diğerleri insan kararı ister.',
}
