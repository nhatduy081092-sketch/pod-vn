import type { Metadata } from "next";
import Link from "next/link";
import { fillMerch, isAiImage, MERCH_PAGES, type MerchPage } from "@pod/shared";
import { getProducts } from "@/lib/api";
import { assetUrl, SITE_URL } from "@/lib/config";
import { PhotoCollage } from "@/components/b2b/PhotoCollage";
import { rise } from "@/components/landing/HomeSections";
import { MaskTitle } from "@/components/motion/MaskTitle";
import { Arrow, Breadcrumb, Faq, h2Big, rowLink } from "@/components/seo/SeoBlocks";
import { TOOL_LINKS } from "@/components/seo/ToolLinks";

export const revalidate = 600;
const PATH = "/ky-thuat-in-logo";
const title = "Kỹ thuật in logo: thêu, in lụa, khắc laser, in UV";
const description = "Các kỹ thuật in logo lên áo, bình, ly, bút, sổ, mũ: thêu, in lụa, chuyển nhiệt, khắc laser, in UV, in pad – chọn theo chất liệu và logo của bạn.";
export const metadata: Metadata = { title: { absolute: `${title} | YALA` }, description, alternates: { canonical: PATH }, openGraph: { title, description } };

/**
 * Hướng dẫn kỹ thuật in logo. Chỉ nêu những gì YALA đã công bố: kỹ thuật theo chất liệu lấy từ MERCH_PAGES.methods
 * (13 trang "in logo" – liên kết tự gom theo tên kỹ thuật), dòng YALA Everyday in DTF/DTG (CMS). Không ghi giá, số ngày.
 */
type Technique = { id: string; name: string; what: string; fit: string; mind: string; match?: RegExp; links?: { href: string; label: string }[] };
const TECHNIQUES: Technique[] = [
  {
    id: "dtf-dtg",
    name: "In DTF / DTG",
    what: "In kỹ thuật số lên vải: DTG phun mực thẳng lên áo, DTF in lên màng rồi ép nhiệt sang áo. Không cần làm khuôn.",
    fit: "Thiết kế nhiều màu, ảnh chi tiết, in tên – số riêng từng người, đơn ít hoặc mỗi áo một nội dung.",
    mind: "Ảnh tải lên cần đủ độ phân giải – Studio ghi số pixel nên có ở từng vùng in.",
    links: [
      { href: "/san-pham/ao-thun-relaxed-fit-yala-everyday", label: "Áo thun cotton" },
      { href: "/san-pham/ao-hoodie-ni-bong-yala-everyday", label: "Hoodie nỉ bông" },
      { href: "/san-pham/ao-sweater-ni-bong-yala-everyday", label: "Sweater nỉ bông" },
      { href: "/san-pham/tui-tote-canvas-yala-everyday", label: "Túi tote canvas" },
    ],
  },
  {
    id: "theu",
    name: "Thêu phẳng, thêu nổi 3D",
    what: "Logo được may bằng chỉ lên vải. Thêu phẳng phổ biến nhất; thêu nổi 3D có lớp đệm để logo nổi khối.",
    fit: "Logo ít màu trên vải dày: áo polo, áo khoác, mũ, balo, túi – trông chỉn chu, không bong khi giặt.",
    mind: "Chữ quá mảnh, chi tiết rất nhỏ hoặc chuyển màu khó thêu – khi đó nên chọn in.",
    match: /thêu/i,
    links: [{ href: "/danh-muc/dong-phuc-may-mac", label: "Áo đồng phục" }],
  },
  {
    id: "in-lua",
    name: "In lụa",
    what: "Mỗi màu của logo một khuôn lưới, mực được gạt qua khuôn xuống bề mặt.",
    fit: "Số lượng lớn cùng một logo 1–2 màu: màu đậm và đều trên cả lô.",
    mind: "Logo càng nhiều màu càng nhiều khuôn – logo nhiều màu, đơn ít nên chọn in chuyển nhiệt hoặc in UV.",
    match: /in lụa/i,
  },
  {
    id: "chuyen-nhiet",
    name: "In chuyển nhiệt",
    what: "Hình in lên giấy chuyển trước, rồi dùng nhiệt ép sang sản phẩm.",
    fit: "Logo nhiều màu, ảnh chi tiết, đơn ít hoặc mỗi chiếc một tên.",
    mind: "Kết quả tuỳ chất liệu bề mặt – YALA chọn cách in theo từng mẫu khi gửi mockup.",
    match: /chuyển nhiệt/i,
  },
  {
    id: "khac-laser",
    name: "Khắc laser",
    what: "Tia laser bóc lớp sơn hoặc khắc thẳng vào bề mặt, không dùng mực.",
    fit: "Logo 1 màu trên inox, kim loại, tre, gỗ, thuỷ tinh – không bong tróc khi rửa, hợp quà dùng lâu.",
    mind: "Chỉ ra một màu (màu của vật liệu). Cần đúng màu nhận diện thì chọn in UV.",
    match: /khắc/i,
  },
  {
    id: "in-uv",
    name: "In UV",
    what: "Mực in phun được làm khô ngay bằng đèn UV, in thẳng lên bề mặt cứng.",
    fit: "Logo nhiều màu, đúng màu nhận diện trên bình, bút, vỏ vali, thuỷ tinh, gỗ.",
    mind: "Cần file logo rõ nét: vector hoặc ảnh độ phân giải cao.",
    match: /\bUV\b/,
  },
  {
    id: "in-pad",
    name: "In pad",
    what: "Mực được ép lên sản phẩm qua đệm silicon mềm, in được trên mặt cong nhỏ.",
    fit: "Logo 1–2 màu trên thân bút nhựa, vỏ nón bảo hiểm.",
    mind: "Vùng in nhỏ – hợp logo gọn, ít chi tiết.",
    match: /pad/i,
  },
  {
    id: "decal",
    name: "In decal nung, decal dán",
    what: "Logo in lên decal, rồi nung cùng lớp men (ly sứ) hoặc dán lên bề mặt (vỏ nón).",
    fit: "Logo nhiều màu trên ly sứ, nón bảo hiểm – giữ đủ màu và chi tiết.",
    mind: "Decal nung bám vào men ly; decal dán hợp bề mặt nhựa trơn.",
    match: /decal/i,
  },
  {
    id: "dap-ep-kim",
    name: "Dập nổi, ép kim",
    what: "Dập nổi, dập chìm ép logo lồi hoặc lõm, không dùng mực; ép kim ép lớp nhũ vàng, bạc bằng nhiệt.",
    fit: "Bìa sổ da, giả da, quà tri ân cần nét chững chạc.",
    mind: "Hợp logo nét rõ, không quá nhỏ.",
    match: /dập|ép kim/i,
  },
  {
    id: "in-giay",
    name: "In offset, in kỹ thuật số",
    what: "Offset in qua bản in, màu chuẩn và đều trên số lượng lớn; kỹ thuật số không cần làm bản.",
    fit: "Lịch, bìa sổ, ấn phẩm giấy. Kỹ thuật số hợp đơn ít hoặc in thử trước.",
    mind: "Đơn lớn in offset thì giá mỗi cuốn giảm khi số lượng tăng.",
    match: /offset|kỹ thuật số/i,
  },
  {
    id: "kim-loai",
    name: "Đúc, gắn logo kim loại",
    what: "Logo đúc thành mặt huy chương, hoặc làm thành tem kim loại, da, cao su rồi gắn lên sản phẩm.",
    fit: "Huy chương dáng riêng, vali, balo cao cấp – logo nổi khối, đi cùng sản phẩm lâu dài.",
    mind: "Làm dáng riêng cần thêm thời gian làm khuôn – nên gửi yêu cầu sớm.",
    match: /đúc|gắn logo kim loại|tem gắn/i,
  },
];

/** Chọn nhanh theo chất liệu – mỗi ô kỹ thuật nhảy tới phần giải thích */
const BY_MATERIAL: { material: string; examples: string; ids: string[] }[] = [
  { material: "Vải", examples: "Áo, túi, balo, mũ", ids: ["dtf-dtg", "theu", "in-lua", "chuyen-nhiet"] },
  { material: "Inox, kim loại", examples: "Bình giữ nhiệt, cốc inox, bút ký", ids: ["khac-laser", "in-uv", "in-lua"] },
  { material: "Sứ", examples: "Ly, cốc sứ", ids: ["decal", "chuyen-nhiet"] },
  { material: "Nhựa", examples: "Bút bi, nón bảo hiểm, vỏ vali", ids: ["in-pad", "in-uv", "decal"] },
  { material: "Tre, gỗ, thuỷ tinh", examples: "Ly tre, kỷ niệm chương", ids: ["khac-laser", "in-uv"] },
  { material: "Giấy", examples: "Lịch, bìa sổ", ids: ["in-giay"] },
  { material: "Da, giả da", examples: "Sổ bìa da", ids: ["dap-ep-kim"] },
];

const BY_LOGO = [
  { t: "Logo 1–2 màu, số lượng lớn", d: "In lụa, in pad – màu đều trên cả lô." },
  { t: "Logo nhiều màu, chi tiết nhỏ", d: "In UV, in chuyển nhiệt, DTF/DTG – giữ đủ màu nhận diện." },
  { t: "Cần bền, trông chững chạc", d: "Thêu, khắc laser, dập nổi – không dùng mực in bề mặt." },
];

const FAQ = [
  {
    q: "Nên in hay thêu logo lên áo đồng phục?",
    a: "Logo ít màu, muốn trông chỉn chu và bền: thêu, hợp áo polo, áo khoác. Logo nhiều màu, chi tiết nhỏ, hoặc cần in tên – số riêng từng người: in. Dòng YALA Everyday (áo thun, hoodie, sweater) in DTF/DTG theo thiết kế; áo đồng phục khác chọn in hay thêu khi báo giá.",
  },
  {
    q: "In lụa và in chuyển nhiệt khác nhau thế nào?",
    a: "In lụa làm một khuôn cho mỗi màu nên hợp số lượng lớn, logo 1–2 màu. In chuyển nhiệt không cần khuôn, in đủ màu và ảnh chi tiết, hợp đơn ít hoặc mỗi chiếc một tên.",
  },
  {
    q: "Khắc laser logo có bị phai không?",
    a: "Khắc laser không dùng mực: logo là phần bề mặt đã được khắc nên không bong tróc khi rửa. Đổi lại logo chỉ có một màu – màu của vật liệu.",
  },
  {
    q: "Cần chuẩn bị file logo như thế nào?",
    a: "Tốt nhất là file vector (AI, PDF, SVG) hoặc PNG nền trong suốt, độ phân giải cao. Trong YALA Studio, mỗi vùng in ghi kích thước thật và số pixel nên có, ảnh quá nhỏ sẽ hiện cảnh báo để bạn thay.",
  },
  {
    q: "Ai chọn kỹ thuật in cho đơn của tôi?",
    a: "Bạn nêu mong muốn khi gửi yêu cầu; YALA đề xuất kỹ thuật hợp chất liệu từng mẫu và ghi rõ trong mockup, báo giá trước khi sản xuất.",
  },
  {
    q: "Có xem logo trên sản phẩm trước khi đặt không?",
    a: "Có, miễn phí. Tự đặt logo lên sản phẩm trong YALA Studio, hoặc gửi file logo để YALA làm mockup giúp – chỉnh đến khi duyệt mới sản xuất.",
  },
];

type Pick = { slug: string; name: string; image: string };

export default async function Page() {
  // 3 mẫu thật đầu tiên của mỗi trang "in logo" -> ảnh cho từng kỹ thuật + khối ảnh đầu trang
  const lists = await Promise.all(MERCH_PAGES.map((m) => getProducts({ category: m.category, sub: m.sub, pageSize: "3" }).then((r) => r.items, () => [])));
  const real = new Map<string, Pick[]>(
    MERCH_PAGES.map((m, i) => [m.slug, lists[i]!.filter((p) => p.images[0] && !isAiImage(p.images[0])).map((p) => ({ slug: p.slug, name: p.name, image: p.images[0]! }))]),
  );
  const used = new Set<string>();
  const take = (pages: MerchPage[]) => {
    for (const m of pages) {
      const p = real.get(m.slug)?.find((x) => !used.has(x.slug));
      if (p) {
        used.add(p.slug);
        return p;
      }
    }
    return null;
  };
  const hero = ["binh-giu-nhiet-in-logo", "so-tay-in-logo", "mu-non-in-logo", "but-in-logo"]
    .map((s) => take(MERCH_PAGES.filter((m) => m.slug === s)))
    .filter((p): p is Pick => !!p);
  const rows = TECHNIQUES.map((t) => {
    const pages = t.match ? MERCH_PAGES.filter((m) => m.methods.some((x) => t.match!.test(x.name))) : [];
    return { ...t, pages, photo: take(pages) };
  });
  const nameOf = new Map(TECHNIQUES.map((t) => [t.id, t.name]));

  const jsonLd = [
    {
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: [
        { "@type": "ListItem", position: 1, name: "Trang chủ", item: SITE_URL },
        { "@type": "ListItem", position: 2, name: "Kỹ thuật in logo", item: `${SITE_URL}${PATH}` },
      ],
    },
    { "@context": "https://schema.org", "@type": "FAQPage", mainEntity: FAQ.map((f) => ({ "@type": "Question", name: f.q, acceptedAnswer: { "@type": "Answer", text: f.a } })) },
  ];

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }} />

      <section className="bg-surface" aria-labelledby="ky-thuat-title">
        <div className="container-site grid gap-10 pb-[clamp(56px,9vh,110px)] pt-10 md:pt-16 lg:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)] lg:items-center lg:gap-14">
          <div>
            <Breadcrumb name="Kỹ thuật in logo" />
            <h1 id="ky-thuat-title" className="font-display text-[clamp(40px,5vw,76px)] font-bold leading-[1.02] tracking-[-0.035em] [text-wrap:balance]">
              Kỹ thuật in logo
            </h1>
            <p className="mt-5 max-w-[34rem] text-lg leading-relaxed md:text-xl">
              Thêu, in lụa, khắc laser, in UV… mỗi cách hợp một chất liệu và một kiểu logo. Xem nhanh nên chọn cách nào cho áo, bình, ly, bút hay sổ của đơn vị bạn.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#chat-lieu" className="btn-primary px-6">
                Chọn theo chất liệu
              </a>
              <Link href="/doanh-nghiep#bao-gia" className="btn-outline bg-white px-6">
                Nhận báo giá
              </Link>
            </div>
          </div>
          {hero.length >= 4 && (
            <div {...rise(1)}>
              <PhotoCollage images={hero.map((p) => ({ src: p.image, alt: p.name }))} className="mx-auto w-full max-w-[34rem]" />
            </div>
          )}
        </div>
      </section>

      {/* Chọn nhanh: chất liệu -> kỹ thuật thường dùng; theo kiểu logo */}
      <section id="chat-lieu" className="container-site scroll-mt-24 py-[clamp(72px,12vh,150px)]" aria-labelledby="chon-nhanh">
        <div className="grid gap-5 lg:grid-cols-[minmax(0,1.4fr)_minmax(0,1fr)] lg:items-end lg:gap-12">
          <MaskTitle id="chon-nhanh" className={h2Big}>
            Chọn nhanh theo chất liệu
          </MaskTitle>
          <p className="max-w-[34rem] text-base leading-relaxed md:text-lg lg:pb-1" {...rise(2)}>
            Kỹ thuật cụ thể tuỳ từng mẫu – YALA ghi rõ trong mockup và báo giá trước khi sản xuất.
          </p>
        </div>
        <div className="mt-10 border-b border-ink/15 md:mt-14">
          {BY_MATERIAL.map((r, i) => (
            <div key={r.material} className="relative grid gap-2 py-5 sm:grid-cols-[minmax(0,15rem)_minmax(0,1fr)] sm:items-baseline sm:gap-8" {...rise(i % 4)}>
              <span className="absolute inset-x-0 top-0 h-px bg-ink/15" aria-hidden />
              <div>
                <p className="text-xl font-bold">{r.material}</p>
                <p className="text-[15px] text-ink/70">{r.examples}</p>
              </div>
              <ul className="flex flex-wrap gap-2">
                {r.ids.map((id) => (
                  <li key={id}>
                    <a href={`#${id}`} className="inline-block rounded-lg bg-surface px-3.5 py-2 text-[15px] font-semibold transition-colors hover:bg-ink hover:text-white">
                      {nameOf.get(id)}
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
        <ul className="mt-12 grid gap-x-10 gap-y-8 sm:grid-cols-3">
          {BY_LOGO.map((x, i) => (
            <li key={x.t} {...rise(i)}>
              <span className="draw-rule mb-4 w-12 bg-brand" aria-hidden />
              <p className="text-lg font-bold leading-snug">{x.t}</p>
              <p className="mt-1.5 text-base leading-relaxed">{x.d}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* Từng kỹ thuật: là gì, hợp khi nào, lưu ý, dùng trên sản phẩm nào (ảnh sản phẩm thật) */}
      <section className="bg-sky/60 py-[clamp(72px,12vh,150px)]" aria-labelledby="tung-ky-thuat">
        <div className="container-site">
          <MaskTitle id="tung-ky-thuat" className={h2Big}>
            {TECHNIQUES.length} kỹ thuật YALA đang dùng
          </MaskTitle>
          <ol className="mt-10 border-b border-ink/15 md:mt-14">
            {rows.map((t, i) => (
              <li key={t.id} id={t.id} className="relative grid scroll-mt-24 gap-5 py-8 md:grid-cols-[3rem_minmax(0,1fr)_9rem] md:gap-8 lg:grid-cols-[3rem_minmax(0,14rem)_minmax(0,1fr)_10rem]">
                <span className="absolute inset-x-0 top-0 h-px bg-ink/15" aria-hidden />
                <span className="draw-rule absolute left-0 top-0 w-16 bg-brand" aria-hidden />
                <span aria-hidden className="hidden font-display text-[15px] font-semibold tabular-nums text-brand md:block md:pt-1.5">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <div className="md:col-span-1 lg:col-span-1">
                  <h3 className="text-2xl font-bold leading-tight">{t.name}</h3>
                  <p className="mt-2 text-base leading-relaxed lg:hidden">{t.what}</p>
                </div>
                <div className="space-y-3 text-base leading-relaxed md:col-start-2 md:row-start-2 lg:col-start-3 lg:row-start-1">
                  <p className="max-lg:hidden">{t.what}</p>
                  <p>
                    <b>Hợp khi:</b> {t.fit}
                  </p>
                  <p>
                    <b>Lưu ý:</b> {t.mind}
                  </p>
                  {(t.pages.length > 0 || t.links?.length) && (
                    <p className="flex flex-wrap gap-x-4 gap-y-1 pt-1 text-[15px] font-semibold">
                      {[...(t.links ?? []), ...t.pages.map((m) => ({ href: `/${m.slug}`, label: fillMerch(m.name) }))].map((l) => (
                        <Link key={l.href} href={l.href} className="underline decoration-ink/30 underline-offset-4 hover:decoration-ink">
                          {l.label}
                        </Link>
                      ))}
                    </p>
                  )}
                </div>
                {t.photo ? (
                  <Link href={`/san-pham/${t.photo.slug}`} className="group block w-36 md:col-start-3 md:row-span-2 md:row-start-1 md:w-full lg:col-start-4 lg:row-span-1" title={t.photo.name}>
                    <span className="sticker block aspect-square overflow-hidden bg-white">
                      <img src={assetUrl(t.photo.image)} alt={t.photo.name} loading="lazy" decoding="async" className="h-full w-full object-contain p-[8%] transition-transform duration-500 group-hover:scale-[1.04]" />
                    </span>
                  </Link>
                ) : (
                  <span className="hidden md:block" aria-hidden />
                )}
              </li>
            ))}
          </ol>
        </div>
      </section>

      <Faq items={FAQ} />

      <section className="container-site pb-[clamp(56px,9vh,110px)]" aria-label="Sản phẩm in logo">
        <h2 className="h-section">Xem sản phẩm in logo theo loại</h2>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {MERCH_PAGES.map((m, i) => (
            <li key={m.slug} {...rise(i % 2)}>
              <Link href={`/${m.slug}`} className={rowLink}>
                <span>
                  <span className="block text-lg font-semibold">{fillMerch(m.h1)}</span>
                  <span className="mt-0.5 block text-[15px] opacity-80">{m.methods.map((x) => x.name).join(" · ")}</span>
                </span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <section className="container-site pb-[clamp(72px,12vh,150px)]" aria-label="Công cụ miễn phí">
        <h2 className="h-section">Công cụ miễn phí khác</h2>
        <ul className="mt-6 grid gap-2 md:grid-cols-2">
          {TOOL_LINKS.filter((l) => l.href !== PATH).map((l, i) => (
            <li key={l.href} {...rise(i % 2)}>
              <Link href={l.href} className={`${rowLink} h-full`}>
                <span>
                  <span className="block text-lg font-semibold">{l.title}</span>
                  <span className="mt-0.5 block text-[15px] opacity-80">{l.desc}</span>
                </span>
                <Arrow />
              </Link>
            </li>
          ))}
        </ul>
      </section>
    </>
  );
}
