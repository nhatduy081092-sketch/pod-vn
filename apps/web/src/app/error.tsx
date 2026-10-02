"use client";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-site py-20 text-center">
      <h1 className="font-display text-[clamp(28px,3.6vw,46px)] font-extrabold leading-[1.04] tracking-[-0.02em] [font-stretch:88%]">Có lỗi xảy ra</h1>
      <p className="mt-1 text-ink/60">Máy chủ đang bận hoặc mất kết nối. Vui lòng thử lại.</p>
      <button onClick={reset} className="btn-primary mt-6">
        Thử lại
      </button>
    </div>
  );
}
