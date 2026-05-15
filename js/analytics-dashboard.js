/* ═══════════════════════════════════════════════
   DWD — Analytics Dashboard v3
   - Today period (24h hourly buckets)
   - Live strip with 60s auto-refresh
   - Direct-traffic spike detection
   - UTM URL builder
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var ACCESS_CODE = 'dwdps2026';
  var STORAGE_KEY = 'dwd_analytics_auth';
  var UTM_HISTORY_KEY = 'dwd_utm_history';
  var LIVE_REFRESH_MS = 60000;

  var gate = document.getElementById('analytics-gate');
  var dashboard = document.getElementById('analytics-dashboard');
  var authForm = document.getElementById('analytics-auth-form');
  var authError = document.getElementById('analytics-auth-error');
  if (!gate || !dashboard) return;

  // ── Auth ──
  function isAuthed() { return localStorage.getItem(STORAGE_KEY) === ACCESS_CODE; }

  function unlock() {
    gate.style.display = 'none';
    dashboard.style.display = 'block';
    loadDashboard('today');
    startLiveStrip();
  }

  if (isAuthed()) unlock();

  if (authForm) {
    authForm.addEventListener('submit', function (e) {
      e.preventDefault();
      var input = document.getElementById('analytics-code-input');
      if (input && input.value.trim() === ACCESS_CODE) {
        localStorage.setItem(STORAGE_KEY, ACCESS_CODE);
        unlock();
      } else {
        authError.style.display = 'block';
        setTimeout(function () { authError.style.display = 'none'; }, 3000);
      }
    });
  }

  // ── State ──
  var currentPeriod = 'today';   // 'today' | 7 | 30 | 90
  var currentTab = 'overview';
  var cachedData = null;
  var cachedMerchData = null;
  var liveTimer = null;

  function getSb() { return window.__dwd_sb || null; }

  function periodToDays(p) { return p === 'today' ? 1 : p; }

  // ── Load ──
  function loadDashboard(period) {
    currentPeriod = period;
    dashboard.innerHTML = '<div class="a-loading">Loading analytics...</div>';
    var client = getSb();
    if (!client) {
      dashboard.innerHTML = '<div class="a-loading">Supabase not available.</div>';
      return;
    }
    Promise.all([
      client.rpc('get_analytics_summary', { days_back: periodToDays(period) }),
      client.rpc('get_merch_poll_stats', { days_back: periodToDays(period) })
    ]).then(function (results) {
      var summary = results[0];
      var merch = results[1];
      if (summary.error) {
        dashboard.innerHTML = '<div class="a-loading">Error: ' + summary.error.message + '</div>';
        return;
      }
      cachedData = summary.data;
      cachedMerchData = (merch && !merch.error) ? merch.data : null;
      render(summary.data);
    });
  }

  // ── Live strip (independent of main render) ──
  function startLiveStrip() {
    if (liveTimer) clearInterval(liveTimer);
    refreshLiveStrip();
    liveTimer = setInterval(refreshLiveStrip, LIVE_REFRESH_MS);
  }

  function refreshLiveStrip() {
    var client = getSb();
    if (!client) return;
    client.rpc('get_analytics_live').then(function (res) {
      if (res.error || !res.data) return;
      var d = res.data;
      var stripEl = document.getElementById('a-live-strip');
      if (!stripEl) return;
      var topPage = d.top_page_last_hour ? formatPage(d.top_page_last_hour) : '—';
      var pulseClass = d.active_now > 0 ? ' is-live' : '';
      stripEl.className = 'a-live-strip' + pulseClass;
      stripEl.innerHTML =
        '<span class="a-live-dot"></span>' +
        '<span class="a-live-stat"><strong>' + d.visitors_last_hour + '</strong> in last hour</span>' +
        '<span class="a-live-sep">·</span>' +
        '<span class="a-live-stat"><strong>' + d.active_now + '</strong> active now</span>' +
        '<span class="a-live-sep">·</span>' +
        '<span class="a-live-stat a-live-page">top: ' + topPage + '</span>';
    });
  }

  // ── Helpers ──
  function formatPage(name) {
    if (!name) return 'Unknown';
    return name.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function pctChange(current, prior) {
    if (!prior || prior === 0) return current > 0 ? { text: 'new', cls: 'a-change-up' } : { text: '--', cls: 'a-change-flat' };
    var pct = Math.round(((current - prior) / prior) * 100);
    if (pct > 0) return { text: '+' + pct + '%', cls: 'a-change-up' };
    if (pct < 0) return { text: pct + '%', cls: 'a-change-down' };
    return { text: '0%', cls: 'a-change-flat' };
  }

  function timeAgo(dateStr) {
    var diff = Date.now() - new Date(dateStr).getTime();
    var mins = Math.floor(diff / 60000);
    if (mins < 60) return mins + 'm ago';
    var hrs = Math.floor(mins / 60);
    if (hrs < 24) return hrs + 'h ago';
    var days = Math.floor(hrs / 24);
    return days + 'd ago';
  }

  function formatHourLabel(iso) {
    var d = new Date(iso);
    var h = d.getHours();
    var ampm = h >= 12 ? 'p' : 'a';
    var h12 = h % 12; if (h12 === 0) h12 = 12;
    return h12 + ampm;
  }

  // ── Render ──
  function render(d) {
    var pp = d.prior_period || {};
    var html = '';

    // Live strip (always pinned at top)
    html += '<div id="a-live-strip" class="a-live-strip">';
    html += '<span class="a-live-dot"></span>';
    html += '<span class="a-live-stat">loading…</span>';
    html += '</div>';

    // Header
    html += '<div class="a-header">';
    html += '<div class="a-title">DWD Analytics</div>';
    html += '<button class="a-refresh" data-action="refresh" aria-label="Refresh analytics" title="Refresh">';
    html += '<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M23 4v6h-6"/><path d="M1 20v-6h6"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10"/><path d="M20.49 15a9 9 0 0 1-14.85 3.36L1 14"/></svg>';
    html += '<span>Refresh</span>';
    html += '</button>';
    html += '</div>';

    // Period pills (Today, 7d, 30d, 90d)
    html += '<div class="a-pills">';
    var periods = [{ k: 'today', l: 'Today' }, { k: 7, l: '7d' }, { k: 30, l: '30d' }, { k: 90, l: '90d' }];
    periods.forEach(function (p) {
      var active = currentPeriod === p.k ? ' active' : '';
      html += '<button class="a-pill' + active + '" data-period="' + p.k + '">' + p.l + '</button>';
    });
    html += '</div>';

    // Tab bar
    html += '<div class="a-tabs">';
    ['overview', 'signups', 'sources'].forEach(function (tab) {
      html += '<button class="a-tab' + (currentTab === tab ? ' active' : '') + '" data-tab="' + tab + '">' + tab.charAt(0).toUpperCase() + tab.slice(1) + '</button>';
    });
    html += '</div>';

    // Tab content
    if (currentTab === 'overview') html += renderOverview(d, pp);
    else if (currentTab === 'signups') html += renderSignups(d);
    else if (currentTab === 'sources') html += renderSources(d);

    dashboard.innerHTML = html;
    bindEvents();
    refreshLiveStrip(); // populate immediately after re-render
  }

  // ── Overview Tab ──
  function renderOverview(d, pp) {
    var isToday = currentPeriod === 'today';

    // Stat values: Today uses 24h-scoped fields; other periods use cutoff-scoped
    var visitors, views, signups, viewsChange, visitorChange, signupChange;
    if (isToday) {
      visitors = d.today_visitors || 0;
      views = d.today_views || 0;
      signups = d.today_signups || 0;
      visitorChange = pctChange(visitors, d.prior_today_visitors);
      viewsChange = pctChange(views, d.prior_today_views);
      signupChange = pctChange(signups, d.prior_today_signups);
    } else {
      visitors = d.unique_visitors || 0;
      views = d.total_views || 0;
      signups = (d.email_signups || 0) + (d.contact_submissions || 0) + (d.early_access_signups || 0);
      visitorChange = pctChange(visitors, pp.unique_visitors);
      viewsChange = pctChange(views, pp.total_views);
      signupChange = pctChange(signups, pp.total_signups);
    }

    var avgDurations = d.avg_duration || [];
    var avgAll = 0;
    if (avgDurations.length) {
      var sum = 0;
      avgDurations.forEach(function (r) { sum += parseFloat(r.avg_seconds) || 0; });
      avgAll = Math.round(sum / avgDurations.length);
    }

    var html = '<div class="a-content">';

    // 2x2 grid
    html += '<div class="a-grid">';
    html += statCard(visitors, 'Visitors', visitorChange);
    html += statCard(views, 'Page Views', viewsChange);
    html += statCard(signups, 'Signups', signupChange, true);
    html += statCard(avgAll + 's', 'Avg Time', { text: d.bounce_rate + '% bounce', cls: 'a-change-flat' });
    html += '</div>';

    // Sparkline — hourly for Today, daily for other periods
    html += '<div class="a-card">';
    html += '<div class="a-card-label">' + (isToday ? 'Hourly Views (last 24h)' : 'Daily Views') + '</div>';
    if (isToday) {
      html += hourlySparkline(d.today_hourly || []);
    } else {
      html += sparkline(d.daily_views || []);
    }
    html += '</div>';

    // Top pages
    html += '<div class="a-card">';
    html += '<div class="a-card-label">Top Pages</div>';
    html += pageList(d.page_views || []);
    html += '</div>';

    // Merch poll summary
    if (cachedMerchData) {
      html += renderMerchCard(cachedMerchData, d);
    }

    html += '</div>';
    return html;
  }

  function renderMerchCard(m, d) {
    var shopViews = 0;
    (d.page_views || []).forEach(function (r) { if (r.page === 'shop') shopViews = r.views; });
    var totalVotes = m.total_votes || 0;
    var conversionPct = shopViews > 0 ? Math.round((totalVotes / shopViews) * 100) : 0;
    var voteChange = pctChange(totalVotes, m.prior_period_votes || 0);
    var catLabels = { everyday: 'Everyday', dance: 'Dance Wear', accessories: 'Accessories' };
    var cats = m.votes_by_category || [];

    var html = '<div class="a-card">';
    html += '<div class="a-card-label">Merch Poll</div>';

    var periodLbl = currentPeriod === 'today' ? '24h' : currentPeriod + 'd';
    html += '<div class="a-grid">';
    html += statCard(totalVotes, 'Votes (' + periodLbl + ')', voteChange, true);
    html += statCard(conversionPct + '%', 'Vote Rate', { text: shopViews + ' shop views', cls: 'a-change-flat' });
    html += '</div>';

    html += '<div class="a-row"><span class="a-row-label">All-time votes</span><span class="a-row-val">' + (m.votes_all_time || 0) + '</span></div>';

    if (cats.length) {
      html += '<div style="margin-top:12px;padding-top:12px;border-top:1px solid rgba(255,255,255,0.08);">';
      html += '<div class="a-card-label" style="margin-bottom:8px;">By category</div>';
      cats.forEach(function (c) {
        var pct = totalVotes > 0 ? Math.round((c.count / totalVotes) * 100) : 0;
        html += '<div class="a-row"><span class="a-row-label">' + (catLabels[c.category] || c.category) + '</span><span class="a-row-val">' + c.count + ' (' + pct + '%)</span></div>';
      });
      html += '</div>';
    } else {
      html += '<div class="a-empty" style="margin-top:12px;">No votes yet</div>';
    }

    html += '</div>';
    return html;
  }

  function statCard(value, label, change, isGreen) {
    var valColor = isGreen ? ' a-val-green' : '';
    return '<div class="a-stat">' +
      '<div class="a-stat-val' + valColor + '">' + value + '</div>' +
      '<div class="a-stat-label">' + label + '</div>' +
      '<div class="' + change.cls + '">' + change.text + '</div>' +
      '</div>';
  }

  function sparkline(rows) {
    if (!rows || !rows.length) return '<div class="a-empty">No data yet</div>';
    var max = 0;
    rows.forEach(function (r) { if (r.views > max) max = r.views; });
    var html = '<div class="a-spark">';
    rows.forEach(function (r) {
      var pct = max > 0 ? Math.max(4, Math.round((r.views / max) * 100)) : 4;
      var day = new Date(r.day);
      var label = (day.getMonth() + 1) + '/' + day.getDate();
      html += '<div class="a-spark-col" title="' + label + ': ' + r.views + '">';
      html += '<div class="a-spark-bar" style="height:' + pct + '%"></div>';
      html += '<span class="a-spark-lbl">' + label + '</span>';
      html += '</div>';
    });
    html += '</div>';
    if (rows.length > 1) {
      var first = new Date(rows[0].day);
      var last = new Date(rows[rows.length - 1].day);
      html += '<div class="a-spark-range"><span>' + (first.getMonth() + 1) + '/' + first.getDate() + '</span><span>' + (last.getMonth() + 1) + '/' + last.getDate() + '</span></div>';
    }
    return html;
  }

  // Hourly sparkline — fills missing hours with 0 across the 24h window
  function hourlySparkline(rows) {
    var now = new Date();
    var buckets = [];
    var start = new Date(now.getTime() - 23 * 3600000);
    start.setMinutes(0, 0, 0);

    var byHour = {};
    rows.forEach(function (r) {
      var key = new Date(r.hour).toISOString().slice(0, 13); // yyyy-mm-ddThh
      byHour[key] = r.views;
    });

    for (var i = 0; i < 24; i++) {
      var hour = new Date(start.getTime() + i * 3600000);
      var key = hour.toISOString().slice(0, 13);
      buckets.push({ hour: hour, views: byHour[key] || 0 });
    }

    var max = 0;
    buckets.forEach(function (b) { if (b.views > max) max = b.views; });

    if (max === 0) return '<div class="a-empty">No views in the last 24 hours</div>';

    var html = '<div class="a-spark a-spark-hourly">';
    buckets.forEach(function (b, i) {
      var pct = max > 0 ? Math.max(2, Math.round((b.views / max) * 100)) : 2;
      var label = formatHourLabel(b.hour.toISOString());
      var showLbl = (i % 4 === 0);
      html += '<div class="a-spark-col" title="' + label + ': ' + b.views + ' views">';
      html += '<div class="a-spark-bar" style="height:' + pct + '%"></div>';
      if (showLbl) html += '<span class="a-spark-lbl a-spark-lbl-hour">' + label + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function pageList(rows) {
    if (!rows || !rows.length) return '<div class="a-empty">No data yet</div>';
    var html = '';
    rows.slice(0, 6).forEach(function (r) {
      html += '<div class="a-row"><span class="a-row-label">' + formatPage(r.page) + '</span><span class="a-row-val">' + r.views + '</span></div>';
    });
    return html;
  }

  // ── Signups Tab ──
  function renderSignups(d) {
    var html = '<div class="a-content">';

    var allEarlyAccess = (d.email_signups || 0) + (d.early_access_signups || 0);
    html += '<div class="a-grid">';
    html += '<div class="a-stat a-stat-green"><div class="a-stat-val a-val-green">' + allEarlyAccess + '</div><div class="a-stat-label">Early Access</div></div>';
    html += '<div class="a-stat a-stat-green"><div class="a-stat-val a-val-green">' + (d.contact_submissions || 0) + '</div><div class="a-stat-label">Contact</div></div>';
    html += '</div>';

    html += '<div class="a-card">';
    html += '<div class="a-card-label">Recent Activity</div>';
    var signups = d.recent_signups || [];
    if (!signups.length) {
      html += '<div class="a-empty">No signups yet</div>';
    } else {
      signups.forEach(function (s) {
        var badgeCls = 'a-badge-gray';
        var badgeText = 'CONTACT';
        if (s.signup_type === 'email' || s.signup_type === 'early-access') { badgeCls = 'a-badge-gold'; badgeText = 'EARLY ACCESS'; }

        html += '<div class="a-activity">';
        html += '<div class="a-activity-top">';
        html += '<div><span class="a-badge ' + badgeCls + '">' + badgeText + '</span><span class="a-activity-email">' + (s.email || s.masked_email || '') + '</span></div>';
        html += '<span class="a-activity-time">' + timeAgo(s.created_at) + '</span>';
        html += '</div>';
        if (s.signup_type === 'contact' && s.source) {
          html += '<div class="a-activity-source">re: ' + formatPage(s.source) + '</div>';
        }
        html += '</div>';
      });
    }
    html += '</div>';

    var funnel = d.conversion_funnel || {};
    html += '<div class="a-card">';
    html += '<div class="a-card-label">Conversion Funnel</div>';
    html += funnelBar('Visited site', funnel.total_visitors || 0, funnel.total_visitors || 1);
    html += funnelBar('Viewed ProSeries', funnel.proseries_viewers || 0, funnel.total_visitors || 1);
    html += funnelBar('Signed up', funnel.total_signups || 0, funnel.total_visitors || 1, true);
    html += '</div>';

    html += '</div>';
    return html;
  }

  function funnelBar(label, count, total, isGreen) {
    var pct = total > 0 ? Math.max(2, Math.round((count / total) * 100)) : 0;
    var barCls = isGreen ? 'a-funnel-fill-green' : 'a-funnel-fill';
    return '<div class="a-funnel-row">' +
      '<div class="a-funnel-meta"><span>' + label + '</span><span class="a-funnel-count">' + count + '</span></div>' +
      '<div class="a-funnel-track"><div class="' + barCls + '" style="width:' + pct + '%"></div></div>' +
      '</div>';
  }

  // ── Sources Tab ──
  function mergeSources(sources) {
    var merged = {};
    var aliases = { ig: 'instagram', instagram: 'instagram' };
    sources.forEach(function (s) {
      var key = aliases[s.source.toLowerCase()] || s.source.toLowerCase();
      if (!merged[key]) merged[key] = { source: key, visits: 0 };
      merged[key].visits += s.visits;
    });
    return Object.keys(merged).map(function (k) { return merged[k]; })
      .sort(function (a, b) { return b.visits - a.visits; });
  }

  function renderSources(d) {
    var html = '<div class="a-content">';
    var sources = mergeSources(d.traffic_sources || []);
    var totalVisits = 0;
    sources.forEach(function (s) { totalVisits += s.visits; });

    var colorMap = { instagram: '#C8614B', ig: '#C8614B', direct: '#6BAF8A', google: '#FF8FAB', facebook: '#7C8CF8', tiktok: '#69C9D0', linktree: '#43e660' };
    var defaultColor = 'rgba(255,255,255,0.15)';

    // ── Spike detector for Direct ──
    var baseline = parseFloat(d.direct_baseline_per_hour) || 0;
    var todayRate = parseFloat(d.direct_per_hour_today) || 0;
    var spikeMultiple = (baseline > 0.05) ? (todayRate / baseline) : 0;
    var hasSpike = spikeMultiple >= 2;
    var spikeLabel = spikeMultiple >= 10 ? '10x+' : (Math.round(spikeMultiple * 10) / 10) + 'x';

    if (sources.length) {
      html += '<div class="a-card">';
      html += '<div class="a-card-label">Where Visitors Come From</div>';
      html += '<div class="a-source-bar">';
      sources.forEach(function (s) {
        var pct = totalVisits > 0 ? Math.max(3, Math.round((s.visits / totalVisits) * 100)) : 0;
        var color = colorMap[s.source.toLowerCase()] || defaultColor;
        html += '<div style="width:' + pct + '%;background:' + color + ';" title="' + s.source + ': ' + pct + '%"></div>';
      });
      html += '</div>';

      sources.forEach(function (s) {
        var pct = totalVisits > 0 ? Math.round((s.visits / totalVisits) * 100) : 0;
        var color = colorMap[s.source.toLowerCase()] || defaultColor;
        var spike = '';
        if (hasSpike && s.source.toLowerCase() === 'direct') {
          spike = ' <span class="a-spike-badge" title="Direct traffic is ' + spikeLabel + ' the prior 7-day baseline (' + baseline.toFixed(1) + '/hr → ' + todayRate.toFixed(1) + '/hr today). Likely from an external mention — Reel, podcast, word of mouth.">↑ ' + spikeLabel + ' Spike</span>';
        }
        html += '<div class="a-row">';
        html += '<span class="a-row-label"><span class="a-dot" style="background:' + color + '"></span>' + formatSource(s.source) + spike + '</span>';
        html += '<span class="a-row-val">' + pct + '%</span>';
        html += '</div>';
      });
      html += '</div>';
    }

    // UTM Campaigns
    var campaigns = d.utm_campaigns || [];
    if (campaigns.length) {
      html += '<div class="a-card">';
      html += '<div class="a-card-label">Campaign Performance</div>';
      campaigns.forEach(function (c) {
        html += '<div class="a-row"><span class="a-row-label">' + c.campaign + '</span><span class="a-row-val">' + c.visits + ' visits</span></div>';
      });
      html += '</div>';
    }

    // ── UTM URL Builder ──
    html += renderUtmBuilder();

    // Devices
    var devices = d.devices || [];
    if (devices.length) {
      var totalSessions = 0;
      var mobile = 0;
      devices.forEach(function (r) {
        totalSessions += r.sessions;
        if (r.device_type === 'mobile') mobile = r.sessions;
      });
      var mobilePct = totalSessions > 0 ? Math.round((mobile / totalSessions) * 100) : 0;
      var desktopPct = 100 - mobilePct;

      html += '<div class="a-card">';
      html += '<div class="a-card-label">Devices</div>';
      html += '<div class="a-device-bar">';
      html += '<div class="a-device-mobile" style="width:' + mobilePct + '%">' + mobilePct + '% mobile</div>';
      html += '<div class="a-device-desktop" style="width:' + desktopPct + '%">' + desktopPct + '% desktop</div>';
      html += '</div>';
      html += '</div>';
    }

    // Top clicks
    var clicks = d.top_clicks || [];
    if (clicks.length) {
      html += '<div class="a-card">';
      html += '<div class="a-card-label">Top Clicked Elements</div>';
      clicks.slice(0, 8).forEach(function (c) {
        html += '<div class="a-row"><span class="a-row-label">' + formatPage(c.element) + '</span><span class="a-row-val">' + c.clicks + '</span></div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function formatSource(name) {
    if (!name) return 'Unknown';
    if (name === 'ig') return 'Instagram';
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  // ── UTM URL Builder ──
  var SOURCE_OPTIONS = [
    { v: 'ig', label: 'Instagram (ig)', medium: 'social' },
    { v: 'linktree', label: 'Linktree', medium: 'link-tree' },
    { v: 'email', label: 'Email', medium: 'email' },
    { v: 'tiktok', label: 'TikTok', medium: 'social' },
    { v: 'facebook', label: 'Facebook', medium: 'social' },
    { v: 'dixonbowles-bio', label: '@dixonbowles bio', medium: 'social' },
    { v: 'dwdproseries-bio', label: '@dwdproseries bio', medium: 'social' },
    { v: 'qr', label: 'QR Code', medium: 'print' }
  ];
  var LANDING_OPTIONS = [
    { v: '', label: 'Home' },
    { v: 'proseries', label: 'ProSeries' },
    { v: 'adult-company', label: 'Adult Company' },
    { v: 'amuse-in-space', label: 'A·Muse in Space' },
    { v: 'early-access', label: 'Early Access' },
    { v: 'contact', label: 'Contact' }
  ];

  function renderUtmBuilder() {
    var html = '<div class="a-card a-utm-builder">';
    html += '<div class="a-card-label">UTM URL Builder</div>';
    html += '<p class="a-utm-help">Generate a tagged link before posting so the visit shows up here as <em>that campaign</em>, not "direct."</p>';

    html += '<div class="a-utm-form">';
    html += '<label class="a-utm-field"><span>Campaign name</span>';
    html += '<input type="text" id="utm-campaign" placeholder="e.g. may15-website-reel" autocomplete="off">';
    html += '</label>';

    html += '<label class="a-utm-field"><span>Source</span>';
    html += '<select id="utm-source">';
    SOURCE_OPTIONS.forEach(function (o) {
      html += '<option value="' + o.v + '" data-medium="' + o.medium + '">' + o.label + '</option>';
    });
    html += '</select></label>';

    html += '<label class="a-utm-field"><span>Medium <em>(auto)</em></span>';
    html += '<input type="text" id="utm-medium" value="social" autocomplete="off">';
    html += '</label>';

    html += '<label class="a-utm-field"><span>Landing page</span>';
    html += '<select id="utm-landing">';
    LANDING_OPTIONS.forEach(function (o) {
      html += '<option value="' + o.v + '">' + o.label + '</option>';
    });
    html += '</select></label>';
    html += '</div>';

    html += '<div class="a-utm-output">';
    html += '<div class="a-utm-url" id="utm-url-output">https://dancewithdixon.com/</div>';
    html += '<button class="a-utm-copy" id="utm-copy-btn" type="button">Copy</button>';
    html += '</div>';

    var history = loadUtmHistory();
    if (history.length) {
      html += '<div class="a-utm-history">';
      html += '<div class="a-utm-history-label">Recent campaigns</div>';
      history.slice(0, 6).forEach(function (h) {
        html += '<div class="a-utm-history-row" data-utm-url="' + escapeAttr(h.url) + '">';
        html += '<span class="a-utm-history-name">' + escapeHtml(h.campaign) + ' <em>· ' + escapeHtml(h.source) + '</em></span>';
        html += '<button class="a-utm-history-copy" type="button">Copy</button>';
        html += '</div>';
      });
      html += '</div>';
    }

    html += '</div>';
    return html;
  }

  function buildUtmUrl() {
    var campaign = (document.getElementById('utm-campaign').value || '').trim().toLowerCase().replace(/\s+/g, '-');
    var source = document.getElementById('utm-source').value;
    var medium = (document.getElementById('utm-medium').value || '').trim();
    var landing = document.getElementById('utm-landing').value;

    var base = 'https://dancewithdixon.com/';
    var params = [];
    if (source) params.push('utm_source=' + encodeURIComponent(source));
    if (medium) params.push('utm_medium=' + encodeURIComponent(medium));
    if (campaign) params.push('utm_campaign=' + encodeURIComponent(campaign));
    var url = base + (params.length ? '?' + params.join('&') : '');
    if (landing) url += '#' + landing;
    return { url: url, campaign: campaign, source: source };
  }

  function loadUtmHistory() {
    try {
      var raw = localStorage.getItem(UTM_HISTORY_KEY);
      return raw ? JSON.parse(raw) : [];
    } catch (e) { return []; }
  }

  function saveUtmToHistory(entry) {
    if (!entry.campaign) return;
    var list = loadUtmHistory();
    list = list.filter(function (h) { return h.url !== entry.url; });
    list.unshift({ url: entry.url, campaign: entry.campaign, source: entry.source, ts: Date.now() });
    list = list.slice(0, 12);
    try { localStorage.setItem(UTM_HISTORY_KEY, JSON.stringify(list)); } catch (e) {}
  }

  function copyToClipboard(text, btn) {
    var done = function () {
      if (!btn) return;
      var orig = btn.textContent;
      btn.textContent = '✓ Copied';
      btn.classList.add('is-copied');
      setTimeout(function () { btn.textContent = orig; btn.classList.remove('is-copied'); }, 1500);
    };
    if (navigator.clipboard && navigator.clipboard.writeText) {
      navigator.clipboard.writeText(text).then(done).catch(function () {});
    } else {
      var ta = document.createElement('textarea');
      ta.value = text; document.body.appendChild(ta); ta.select();
      try { document.execCommand('copy'); done(); } catch (e) {}
      document.body.removeChild(ta);
    }
  }

  function escapeHtml(s) {
    return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) {
      return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
  }
  function escapeAttr(s) { return escapeHtml(s); }

  // ── Event Binding ──
  function bindEvents() {
    // Period pills
    dashboard.querySelectorAll('.a-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var p = btn.dataset.period;
        var period = p === 'today' ? 'today' : parseInt(p, 10);
        loadDashboard(period);
      });
    });

    // Tab buttons
    dashboard.querySelectorAll('.a-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentTab = btn.dataset.tab;
        if (cachedData) render(cachedData);
      });
    });

    // Refresh button
    var refreshBtn = dashboard.querySelector('[data-action="refresh"]');
    if (refreshBtn) {
      refreshBtn.addEventListener('click', function () {
        cachedData = null;
        cachedMerchData = null;
        loadDashboard(currentPeriod);
      });
    }

    // UTM builder live update
    var campaignInput = document.getElementById('utm-campaign');
    var sourceSelect = document.getElementById('utm-source');
    var mediumInput = document.getElementById('utm-medium');
    var landingSelect = document.getElementById('utm-landing');
    var urlOutput = document.getElementById('utm-url-output');
    var copyBtn = document.getElementById('utm-copy-btn');

    function syncUrl() {
      if (!urlOutput) return;
      var built = buildUtmUrl();
      urlOutput.textContent = built.url;
    }
    function syncMedium() {
      if (!sourceSelect || !mediumInput) return;
      var opt = sourceSelect.options[sourceSelect.selectedIndex];
      if (opt) mediumInput.value = opt.dataset.medium || 'social';
      syncUrl();
    }

    if (sourceSelect) sourceSelect.addEventListener('change', syncMedium);
    if (campaignInput) campaignInput.addEventListener('input', syncUrl);
    if (mediumInput) mediumInput.addEventListener('input', syncUrl);
    if (landingSelect) landingSelect.addEventListener('change', syncUrl);
    if (sourceSelect) syncMedium(); // initial

    if (copyBtn) {
      copyBtn.addEventListener('click', function () {
        var built = buildUtmUrl();
        if (!built.campaign) {
          copyBtn.textContent = 'Add a campaign name';
          setTimeout(function () { copyBtn.textContent = 'Copy'; }, 1500);
          return;
        }
        copyToClipboard(built.url, copyBtn);
        saveUtmToHistory(built);
      });
    }

    dashboard.querySelectorAll('.a-utm-history-copy').forEach(function (btn) {
      btn.addEventListener('click', function () {
        var row = btn.closest('.a-utm-history-row');
        if (row && row.dataset.utmUrl) copyToClipboard(row.dataset.utmUrl, btn);
      });
    });
  }

})();
