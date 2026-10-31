"use client";
import Script from "next/script";
import { usePathname } from "next/navigation";
import { useEffect, useRef } from "react";
import { captureUtm, track } from "@/lib/track";

const GTM = process.env.NEXT_PUBLIC_GTM_ID;
const GA4 = process.env.NEXT_PUBLIC_GA4_ID;
const PIXEL = process.env.NEXT_PUBLIC_META_PIXEL_ID;
const TIKTOK = process.env.NEXT_PUBLIC_TIKTOK_PIXEL_ID;

/**
 * Nạp mã đo lường. Có GTM -> chỉ nạp GTM (GA4/Meta/TikTok/Google Ads cấu hình trong GTM, đọc dataLayer).
 * Không có GTM -> nạp thẳng GA4 / Meta Pixel / TikTok Pixel theo ID có sẵn. Không ID nào -> không nạp gì.
 */
export function Analytics() {
  const path = usePathname();
  const first = useRef(true);
  useEffect(() => captureUtm(), []);
  // Next.js chuyển trang không tải lại: báo lượt xem trang mới (lần đầu đã do mã nạp tự gửi)
  useEffect(() => {
    if (first.current) {
      first.current = false;
      return;
    }
    track.pageView(path);
  }, [path]);

  if (GTM)
    return (
      <Script id="gtm" strategy="afterInteractive">
        {`window.__yalaGtm=true;window.dataLayer=window.dataLayer||[];${internalPush()}(function(w,d,s,l,i){w[l].push({'gtm.start':new Date().getTime(),event:'gtm.js'});var f=d.getElementsByTagName(s)[0],j=d.createElement(s),dl=l!='dataLayer'?'&l='+l:'';j.async=true;j.src='https://www.googletagmanager.com/gtm.js?id='+i+dl;f.parentNode.insertBefore(j,f);})(window,document,'script','dataLayer','${GTM}');`}
      </Script>
    );
  return (
    <>
      {GA4 && (
        <>
          <Script src={`https://www.googletagmanager.com/gtag/js?id=${GA4}`} strategy="afterInteractive" />
          <Script id="ga4" strategy="afterInteractive">
            {`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments);}window.gtag=gtag;gtag('js',new Date());gtag('config','${GA4}',${gaConfig()});`}
          </Script>
        </>
      )}
      {PIXEL && (
        <Script id="meta-pixel" strategy="afterInteractive">
          {`!function(f,b,e,v,n,t,s){if(f.fbq)return;n=f.fbq=function(){n.callMethod?n.callMethod.apply(n,arguments):n.queue.push(arguments)};if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';n.queue=[];t=b.createElement(e);t.async=!0;t.src=v;s=b.getElementsByTagName(e)[0];s.parentNode.insertBefore(t,s)}(window,document,'script','https://connect.facebook.net/en_US/fbevents.js');fbq('init','${PIXEL}');${skipIfInternal("fbq('track','PageView');")}`}
        </Script>
      )}
      {TIKTOK && (
        <Script id="tiktok-pixel" strategy="afterInteractive">
          {`!function(w,d,t){w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"],ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e},ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js";ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var o=d.createElement("script");o.type="text/javascript",o.async=!0,o.src=r+"?sdkid="+e+"&lib="+t;var a=d.getElementsByTagName("script")[0];a.parentNode.insertBefore(o,a)};ttq.load('${TIKTOK}');${skipIfInternal("ttq.page();")}}(window,document,'ttq');`}
        </Script>
      )}
    </>
  );
}

/** Máy nội bộ (?yala_internal=1): GA4 gắn traffic_type=internal để lọc khỏi báo cáo */
const gaConfig = () => `(function(){try{return localStorage.getItem('yala_internal')==='1'?{traffic_type:'internal',debug_mode:true}:{}}catch(e){return {}}})()`;
const internalPush = () => `try{if(localStorage.getItem('yala_internal')==='1')window.dataLayer.push({traffic_type:'internal'})}catch(e){}`;
const skipIfInternal = (code: string) => `try{if(localStorage.getItem('yala_internal')!=='1'){${code}}}catch(e){${code}}`;
