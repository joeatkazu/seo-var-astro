export const prerender = false;

export const GET = async ({ request }: { request: Request }) => {
  const url = new URL(request.url).searchParams.get('url');

  if (!url) {
    return new Response(JSON.stringify({ error: 'URL megadása kötelező' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  const PSI_API_KEY = process.env.PSI_API_KEY;

  if (!PSI_API_KEY || PSI_API_KEY === 'your_pagespeed_insights_api_key_here') {
    return new Response(JSON.stringify({
      error: 'PSI_API_KEY nincs beállítva',
      message: 'Kérjük, add meg a Google PageSpeed Insights API kulcsot a .env fájlban.',
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  try {
    const psiBase = `https://www.googleapis.com/pagespeedonline/v5/runPagespeed?url=${encodeURIComponent(url)}&key=${PSI_API_KEY}&category=PERFORMANCE&category=ACCESSIBILITY&category=BEST_PRACTICES&category=SEO`;
    const [mobileRes, desktopRes] = await Promise.all([
      fetch(`${psiBase}&strategy=mobile`),
      fetch(`${psiBase}&strategy=desktop`),
    ]);

    if (!mobileRes.ok) {
      const err = await mobileRes.json().catch(() => ({}));
      throw new Error(`Mobil audit sikertelen: ${err.error?.message || mobileRes.statusText}`);
    }
    if (!desktopRes.ok) {
      const err = await desktopRes.json().catch(() => ({}));
      throw new Error(`Asztali audit sikertelen: ${err.error?.message || desktopRes.statusText}`);
    }

    const [mobileData, desktopData] = await Promise.all([mobileRes.json(), desktopRes.json()]);

    if (mobileData.error || desktopData.error) {
      throw new Error(mobileData.error?.message || desktopData.error?.message || 'Ismeretlen PSI API hiba');
    }
    if (!mobileData.lighthouseResult || !desktopData.lighthouseResult) {
      throw new Error('Érvénytelen PSI API válasz: hiányzó Lighthouse adatok');
    }

    const analysis = analyzePSIData(mobileData, desktopData, url);
    return new Response(JSON.stringify(analysis), {
      headers: { 'Content-Type': 'application/json' },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Nem sikerült lekérni a PSI adatokat';
    let suggestion = '';

    if (errorMessage.includes('FAILED_DOCUMENT_REQUEST') || errorMessage.includes('ERR_TIMED_OUT')) {
      suggestion = 'Az oldal betöltése túl sokáig tartott. Lehetséges okok:\n1. A weboldal átmenetileg lassú vagy nem elérhető\n2. Az oldal blokkolja az automatizált kéréseket\n3. Próbáld meg néhány perc múlva újra';
    } else if (errorMessage.includes('NO_FCP')) {
      suggestion = 'Az oldal nem renderelt tartalmat. Az oldal blokkolhatja a Google crawlerét.';
    } else if (errorMessage.includes('DNS_FAILURE')) {
      suggestion = 'A domain név nem oldható fel. Ellenőrizd, hogy az URL helyes és az oldal nyilvánosan elérhető.';
    }

    return new Response(JSON.stringify({ error: errorMessage, suggestion, url, timestamp: new Date().toISOString() }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
};

function analyzePSIData(mobile: any, desktop: any, url: string) {
  const mobileAudits = mobile.lighthouseResult?.audits || {};
  const mobileCategories = mobile.lighthouseResult?.categories || {};
  const desktopAudits = desktop.lighthouseResult?.audits || {};
  const desktopCategories = desktop.lighthouseResult?.categories || {};

  const cwv = {
    mobile: {
      lcp: mobileAudits['largest-contentful-paint']?.numericValue || 0,
      fid: mobileAudits['max-potential-fid']?.numericValue || 0,
      cls: mobileAudits['cumulative-layout-shift']?.numericValue || 0,
      ttfb: mobileAudits['server-response-time']?.numericValue || 0,
      fcp: mobileAudits['first-contentful-paint']?.numericValue || 0,
      inp: mobileAudits['interaction-to-next-paint']?.numericValue || 0,
    },
    desktop: {
      lcp: desktopAudits['largest-contentful-paint']?.numericValue || 0,
      fid: desktopAudits['max-potential-fid']?.numericValue || 0,
      cls: desktopAudits['cumulative-layout-shift']?.numericValue || 0,
      ttfb: desktopAudits['server-response-time']?.numericValue || 0,
      fcp: desktopAudits['first-contentful-paint']?.numericValue || 0,
      inp: desktopAudits['interaction-to-next-paint']?.numericValue || 0,
    },
  };

  const scores = {
    mobile: {
      performance: Math.round((mobileCategories['performance']?.score || 0) * 100),
      accessibility: Math.round((mobileCategories['accessibility']?.score || 0) * 100),
      bestPractices: Math.round((mobileCategories['best-practices']?.score || 0) * 100),
      seo: Math.round((mobileCategories['seo']?.score || 0) * 100),
    },
    desktop: {
      performance: Math.round((desktopCategories['performance']?.score || 0) * 100),
      accessibility: Math.round((desktopCategories['accessibility']?.score || 0) * 100),
      bestPractices: Math.round((desktopCategories['best-practices']?.score || 0) * 100),
      seo: Math.round((desktopCategories['seo']?.score || 0) * 100),
    },
  };

  const networkRequests = mobileAudits['network-requests']?.details?.items || [];
  const totalByteWeight = mobileAudits['total-byte-weight']?.numericValue || 0;

  const slowResources = networkRequests
    .filter((req: any) => req.responseTime > 500)
    .map((req: any) => ({ url: req.url, responseTime: req.responseTime, transferSize: req.transferSize }));

  const renderBlocking = mobileAudits['render-blocking-resources']?.details?.items || [];
  const unusedJS = mobileAudits['unused-javascript']?.details?.items || [];
  const unusedJSWasted = mobileAudits['unused-javascript']?.numericValue || 0;
  const redirects = mobileAudits['redirects']?.details?.items || [];
  const redirectChains = detectRedirectChains(redirects);

  const crawlEfficiencyScore = calculateCrawlEfficiency({
    redirectCount: redirects.length,
    slowResourceCount: slowResources.length,
    totalByteWeight,
    renderBlockingCount: renderBlocking.length,
    ttfb: cwv.mobile.ttfb,
  });

  const mobileLCP = mobileAudits['largest-contentful-paint-element'];
  const desktopLCP = desktopAudits['largest-contentful-paint-element'];

  const recommendations = generateRecommendations({
    cwv, scores, totalByteWeight, slowResources, renderBlocking,
    unusedJS, unusedJSWasted, redirectChains,
    mobileLCP, desktopLCP,
  });

  return {
    url,
    timestamp: new Date().toISOString(),
    scores,
    cwv,
    crawlEfficiency: {
      score: crawlEfficiencyScore,
      totalByteWeight,
      redirectCount: redirects.length,
      slowResourceCount: slowResources.length,
      renderBlockingCount: renderBlocking.length,
    },
    lcpElements: {
      mobile: mobileLCP?.details?.items?.[0] || null,
      desktop: desktopLCP?.details?.items?.[0] || null,
    },
    issues: { slowResources, renderBlocking, unusedJS, redirectChains, redirects },
    recommendations,
  };
}

function detectRedirectChains(redirects: any[]) {
  const chains: any[] = [];
  const urlMap = new Map();
  redirects.forEach((r: any) => urlMap.set(r.url, r));
  redirects.forEach((r: any) => {
    if (r.url !== r.endUrl) {
      const chain = [r.url];
      let current = r.endUrl;
      while (urlMap.has(current) && !chain.includes(current)) {
        chain.push(current);
        current = urlMap.get(current)?.endUrl || current;
      }
      if (chain.length > 1) chains.push({ chain, wastedMs: r.wastedMs });
    }
  });
  return chains;
}

function calculateCrawlEfficiency(m: { redirectCount: number; slowResourceCount: number; totalByteWeight: number; renderBlockingCount: number; ttfb: number }) {
  let score = 100;
  score -= m.redirectCount * 10;
  score -= m.slowResourceCount * 5;
  const mb = m.totalByteWeight / (1024 * 1024);
  if (mb > 5) score -= 15; else if (mb > 3) score -= 10; else if (mb > 1) score -= 5;
  score -= m.renderBlockingCount * 3;
  if (m.ttfb > 1000) score -= 15; else if (m.ttfb > 600) score -= 10; else if (m.ttfb > 300) score -= 5;
  return Math.max(0, score);
}

function generateRecommendations(data: any) {
  const recs: Array<{ priority: 'critical' | 'high' | 'medium' | 'low'; category: string; title: string; description: string; impact: string }> = [];

  const get = (obj: any, path: string, def: any = 0) =>
    path.split('.').reduce((acc, k) => (acc == null ? def : acc[k] !== undefined ? acc[k] : def), obj);

  const mobileLCP = get(data, 'cwv.mobile.lcp');
  if (mobileLCP > 4000) {
    const el = get(data, 'lcpElements.mobile.node.nodeLabel', '');
    recs.push({ priority: 'critical', category: 'Core Web Vitals', title: 'LCP kritikusan lassú mobilon', description: `LCP: ${(mobileLCP / 1000).toFixed(2)}s (cél: <2.5s).${el ? ` LCP elem: ${el}` : ''}`, impact: 'Nagy hatás a mobil rangsorolásra' });
  } else if (mobileLCP > 2500) {
    recs.push({ priority: 'high', category: 'Core Web Vitals', title: 'LCP fejlesztést igényel mobilon', description: `LCP: ${(mobileLCP / 1000).toFixed(2)}s. Optimalizáld az LCP elemet.`, impact: 'Javítás növeli a mobil SEO teljesítményt' });
  }

  const mobileCLS = get(data, 'cwv.mobile.cls');
  if (mobileCLS > 0.25) {
    recs.push({ priority: 'critical', category: 'Core Web Vitals', title: 'Magas CLS érték', description: `CLS: ${mobileCLS.toFixed(3)} (cél: <0.1). Elemek csúsznak betöltés közben.`, impact: 'Nagy hatás UX-re és rangsorolásra' });
  }

  const mbWeight = get(data, 'totalByteWeight') / (1024 * 1024);
  if (mbWeight > 3) {
    recs.push({ priority: 'high', category: 'Crawl Budget', title: 'Az oldal túl nehéz a hatékony crawlhoz', description: `Oldalméret: ${mbWeight.toFixed(2)}MB. Nagy oldalak több crawl budget-et fogyasztanak.`, impact: 'A méret csökkentése javítja a crawl sebességét' });
  }

  const slowResources = get(data, 'slowResources', []);
  if (slowResources.length > 0) {
    const slowest = [...slowResources].sort((a: any, b: any) => b.responseTime - a.responseTime)[0];
    recs.push({ priority: 'high', category: 'Teljesítmény', title: `${slowResources.length} lassú erőforrás (>500ms)`, description: `Leglassabb: ${slowest?.url?.substring(0, 60)}... (${slowest?.responseTime}ms)`, impact: 'Javítás növeli az UX-et és crawl hatékonyságot' });
  }

  const renderBlocking = get(data, 'renderBlocking', []);
  if (renderBlocking.length > 0) {
    recs.push({ priority: renderBlocking.length > 3 ? 'critical' : 'high', category: 'Renderelés', title: `${renderBlocking.length} render-blokkoló erőforrás`, description: 'CSS/JS fájlok blokkolják az első festést. Halaszd el a nem kritikus erőforrásokat.', impact: 'Nagy javulás az LCP-ben' });
  }

  const unusedJSWasted = get(data, 'unusedJSWasted');
  if (unusedJSWasted > 100000) {
    recs.push({ priority: 'medium', category: 'JavaScript', title: `${(unusedJSWasted / 1024).toFixed(0)}KB nem használt JavaScript`, description: 'Távolítsd el vagy halaszd el a kezdeti betöltésnél nem szükséges JS-t.', impact: 'Csökkenti az oldalméretet és javítja az interaktivitást' });
  }

  const redirectChains = get(data, 'redirectChains', []);
  if (redirectChains.length > 0) {
    recs.push({ priority: 'high', category: 'Crawl Budget', title: `${redirectChains.length} átirányítási lánc`, description: 'Az átirányítási láncok pazarolják a crawl budget-et. Frissítsd a linkeket a végső URL-ekre.', impact: 'Kritikus a crawl hatékonyság maximalizálásához' });
  }

  const mobileTTFB = get(data, 'cwv.mobile.ttfb');
  if (mobileTTFB > 800) {
    recs.push({ priority: 'critical', category: 'Szerver', title: 'Lassú szerver válaszidő (TTFB)', description: `TTFB: ${mobileTTFB.toFixed(0)}ms. Optimalizáld a szervert vagy használj CDN-t.`, impact: 'A lassú TTFB minden mutatót befolyásol' });
  }

  const mobilePerfScore = get(data, 'scores.mobile.performance', 100);
  if (mobilePerfScore < 50) {
    recs.push({ priority: 'critical', category: 'Teljesítmény', title: 'Kritikusan alacsony mobil teljesítmény pontszám', description: `Pontszám: ${mobilePerfScore}/100. Ez súlyosan érinti a mobil keresési rangsorolást.`, impact: 'Kritikus a mobile-first indexeléshez' });
  }

  const order = { critical: 0, high: 1, medium: 2, low: 3 };
  return recs.sort((a, b) => order[a.priority] - order[b.priority]);
}
