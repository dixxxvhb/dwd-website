/* ═══════════════════════════════════════════════
   DWD — Analytics Dashboard v2
   Mobile-first tabbed dashboard with signups,
   sources, conversions, and period comparison
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var ACCESS_CODE = 'dwdps2026';
  var STORAGE_KEY = 'dwd_analytics_auth';

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
    loadDashboard(30);
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
  var currentPeriod = 30;
  var currentTab = 'overview';
  var cachedData = null;

  function getSb() { return window.__dwd_sb || null; }

  // ── Load ──
  function loadDashboard(days) {
    currentPeriod = days;
    dashboard.innerHTML = '<div class="a-loading">Loading analytics...</div>';
    var client = getSb();
    if (!client) {
      dashboard.innerHTML = '<div class="a-loading">Supabase not available.</div>';
      return;
    }
    client.rpc('get_analytics_summary', { days_back: days }).then(function (res) {
      if (res.error) {
        dashboard.innerHTML = '<div class="a-loading">Error: ' + res.error.message + '</div>';
        return;
      }
      cachedData = res.data;
      render(res.data);
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

  // ── Render ──
  function render(d) {
    var pp = d.prior_period || {};
    var html = '';

    // Header
    html += '<div class="a-header">';
    html += '<div class="a-title">DWD Analytics</div>';
    html += '</div>';

    // Period pills
    html += '<div class="a-pills">';
    [7, 30, 90].forEach(function (n) {
      html += '<button class="a-pill' + (currentPeriod === n ? ' active' : '') + '" data-days="' + n + '">' + n + 'd</button>';
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
  }

  // ── Overview Tab ──
  function renderOverview(d, pp) {
    var totalSignups = (d.email_signups || 0) + (d.contact_submissions || 0) + (d.early_access_signups || 0);
    var priorSignups = pp.total_signups || 0;
    var visitorChange = pctChange(d.unique_visitors || 0, pp.unique_visitors);
    var viewsChange = pctChange(d.total_views || 0, pp.total_views);
    var signupChange = pctChange(totalSignups, priorSignups);

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
    html += statCard(d.unique_visitors || 0, 'Visitors', visitorChange);
    html += statCard(d.total_views || 0, 'Page Views', viewsChange);
    html += statCard(totalSignups, 'Signups', signupChange, true);
    html += statCard(avgAll + 's', 'Avg Time', { text: d.bounce_rate + '% bounce', cls: 'a-change-flat' });
    html += '</div>';

    // Daily views
    html += '<div class="a-card">';
    html += '<div class="a-card-label">Daily Views</div>';
    html += sparkline(d.daily_views || []);
    html += '</div>';

    // Top pages
    html += '<div class="a-card">';
    html += '<div class="a-card-label">Top Pages</div>';
    html += pageList(d.page_views || []);
    html += '</div>';

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
    // Date range
    if (rows.length > 1) {
      var first = new Date(rows[0].day);
      var last = new Date(rows[rows.length - 1].day);
      html += '<div class="a-spark-range"><span>' + (first.getMonth() + 1) + '/' + first.getDate() + '</span><span>' + (last.getMonth() + 1) + '/' + last.getDate() + '</span></div>';
    }
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

    // 3-column counts
    html += '<div class="a-grid a-grid-3">';
    html += '<div class="a-stat a-stat-green"><div class="a-stat-val a-val-green">' + (d.email_signups || 0) + '</div><div class="a-stat-label">Email</div></div>';
    html += '<div class="a-stat a-stat-green"><div class="a-stat-val a-val-green">' + (d.contact_submissions || 0) + '</div><div class="a-stat-label">Contact</div></div>';
    html += '<div class="a-stat a-stat-green"><div class="a-stat-val a-val-green">' + (d.early_access_signups || 0) + '</div><div class="a-stat-label">Early Access</div></div>';
    html += '</div>';

    // Recent activity
    html += '<div class="a-card">';
    html += '<div class="a-card-label">Recent Activity</div>';
    var signups = d.recent_signups || [];
    if (!signups.length) {
      html += '<div class="a-empty">No signups yet</div>';
    } else {
      signups.forEach(function (s) {
        var badgeCls = 'a-badge-gray';
        var badgeText = 'CONTACT';
        if (s.signup_type === 'email') { badgeCls = 'a-badge-green'; badgeText = 'EMAIL'; }
        else if (s.signup_type === 'early-access') { badgeCls = 'a-badge-gold'; badgeText = 'EARLY ACCESS'; }

        html += '<div class="a-activity">';
        html += '<div class="a-activity-top">';
        html += '<div><span class="a-badge ' + badgeCls + '">' + badgeText + '</span><span class="a-activity-email">' + s.masked_email + '</span></div>';
        html += '<span class="a-activity-time">' + timeAgo(s.created_at) + '</span>';
        html += '</div>';
        if (s.source && s.signup_type !== 'early-access') {
          html += '<div class="a-activity-source">via ' + formatPage(s.source) + '</div>';
        }
        html += '</div>';
      });
    }
    html += '</div>';

    // Conversion funnel
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
  function renderSources(d) {
    var html = '<div class="a-content">';
    var sources = d.traffic_sources || [];
    var totalVisits = 0;
    sources.forEach(function (s) { totalVisits += s.visits; });

    // Color map
    var colorMap = { instagram: '#e2b955', ig: '#e2b955', direct: '#00D68F', google: '#FF8FAB', facebook: '#7C8CF8', tiktok: '#69C9D0', linktree: '#43e660' };
    var defaultColor = 'rgba(255,255,255,0.15)';

    // Stacked bar
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

      // Source list
      sources.forEach(function (s) {
        var pct = totalVisits > 0 ? Math.round((s.visits / totalVisits) * 100) : 0;
        var color = colorMap[s.source.toLowerCase()] || defaultColor;
        html += '<div class="a-row">';
        html += '<span class="a-row-label"><span class="a-dot" style="background:' + color + '"></span>' + formatSource(s.source) + '</span>';
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

  // ── Event Binding ──
  function bindEvents() {
    // Period pills
    dashboard.querySelectorAll('.a-pill').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadDashboard(parseInt(btn.dataset.days, 10));
      });
    });

    // Tab buttons
    dashboard.querySelectorAll('.a-tab').forEach(function (btn) {
      btn.addEventListener('click', function () {
        currentTab = btn.dataset.tab;
        if (cachedData) render(cachedData);
      });
    });
  }

})();
