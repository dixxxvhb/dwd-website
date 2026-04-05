/* ═══════════════════════════════════════════════
   DWD — Analytics Dashboard
   Renders site analytics behind access code gate
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

  // ── Supabase RPC (reuse client from main.js) ──
  function getSb() {
    return window.__dwd_sb || null;
  }

  var currentPeriod = 30;

  function loadDashboard(days) {
    currentPeriod = days;
    dashboard.innerHTML = '<div class="analytics-loading">Loading analytics...</div>';
    var client = getSb();
    if (!client) {
      dashboard.innerHTML = '<div class="analytics-loading">Supabase not available.</div>';
      return;
    }
    client.rpc('get_analytics_summary', { days_back: days }).then(function (res) {
      if (res.error) {
        dashboard.innerHTML = '<div class="analytics-loading">Error loading analytics: ' + res.error.message + '</div>';
        return;
      }
      render(res.data);
    });
  }

  // ── Render ──
  function render(d) {
    var html = '';

    // Header + period toggle
    html += '<div class="analytics-header">';
    html += '<h1>Site Analytics</h1>';
    html += '<div class="analytics-period-toggle">';
    html += '<button class="analytics-period-btn' + (currentPeriod === 7 ? ' active' : '') + '" data-days="7">7 days</button>';
    html += '<button class="analytics-period-btn' + (currentPeriod === 30 ? ' active' : '') + '" data-days="30">30 days</button>';
    html += '<button class="analytics-period-btn' + (currentPeriod === 90 ? ' active' : '') + '" data-days="90">90 days</button>';
    html += '</div></div>';

    // Live now
    var activeNow = d.active_now || 0;
    html += '<div class="analytics-live">';
    html += '<span class="analytics-live-dot"></span>';
    html += '<span class="analytics-live-count">' + activeNow + '</span> ';
    html += '<span class="analytics-live-label">active now</span>';
    html += '</div>';

    // Summary cards
    var totalViews = d.total_views || 0;
    var uniqueVisitors = d.unique_visitors || 0;
    var avgDurations = d.avg_duration || [];
    var avgAll = 0;
    if (avgDurations.length) {
      var sum = 0;
      avgDurations.forEach(function (r) { sum += parseFloat(r.avg_seconds) || 0; });
      avgAll = Math.round(sum / avgDurations.length);
    }

    html += '<div class="analytics-summary">';
    html += card('Total Views', totalViews);
    html += card('Unique Visitors', uniqueVisitors);
    html += card('Avg Time on Page', avgAll + 's');
    html += '</div>';

    // Page popularity
    html += section('Page Popularity', barChart(d.page_views || [], 'page', 'views', 'views'));

    // Daily views sparkline
    html += section('Daily Views', sparkline(d.daily_views || []));

    // Avg time per page
    html += section('Time per Page', rankedList(d.avg_duration || [], 'page', 'avg_seconds', 's'));

    // Top clicks
    html += section('Top Clicked Elements', rankedList(d.top_clicks || [], 'element', 'clicks', ''));

    // Traffic sources
    html += section('Traffic Sources', rankedList(d.traffic_sources || [], 'source', 'visits', ''));

    // Devices
    html += section('Devices', deviceBar(d.devices || []));

    dashboard.innerHTML = html;

    // Period toggle handlers
    dashboard.querySelectorAll('.analytics-period-btn').forEach(function (btn) {
      btn.addEventListener('click', function () {
        loadDashboard(parseInt(btn.dataset.days, 10));
      });
    });
  }

  // ── Helpers ──
  function card(label, value) {
    return '<div class="analytics-card"><div class="analytics-card-value">' + value + '</div><div class="analytics-card-label">' + label + '</div></div>';
  }

  function section(title, content) {
    return '<div class="analytics-section"><h3>' + title + '</h3>' + content + '</div>';
  }

  function formatPage(name) {
    if (!name) return 'unknown';
    return name.replace(/-/g, ' ').replace(/\b\w/g, function (c) { return c.toUpperCase(); });
  }

  function barChart(rows, labelKey, valueKey, suffix) {
    if (!rows || !rows.length) return '<div class="analytics-empty">No data yet</div>';
    var max = 0;
    rows.forEach(function (r) { if (r[valueKey] > max) max = r[valueKey]; });
    var html = '<div class="analytics-bar-chart">';
    rows.forEach(function (r) {
      var pct = max > 0 ? Math.round((r[valueKey] / max) * 100) : 0;
      html += '<div class="analytics-bar-row">';
      html += '<span class="analytics-bar-label">' + formatPage(r[labelKey]) + '</span>';
      html += '<div class="analytics-bar-track"><div class="analytics-bar-fill" style="width:' + pct + '%"></div></div>';
      html += '<span class="analytics-bar-value">' + r[valueKey] + (suffix ? ' ' + suffix : '') + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function sparkline(rows) {
    if (!rows || !rows.length) return '<div class="analytics-empty">No data yet</div>';
    var max = 0;
    rows.forEach(function (r) { if (r.views > max) max = r.views; });
    var html = '<div class="analytics-sparkline">';
    rows.forEach(function (r) {
      var pct = max > 0 ? Math.max(4, Math.round((r.views / max) * 100)) : 4;
      var day = new Date(r.day);
      var label = (day.getMonth() + 1) + '/' + day.getDate();
      html += '<div class="analytics-spark-col" title="' + label + ': ' + r.views + ' views">';
      html += '<div class="analytics-spark-bar" style="height:' + pct + '%"></div>';
      html += '<span class="analytics-spark-label">' + label + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function rankedList(rows, labelKey, valueKey, suffix) {
    if (!rows || !rows.length) return '<div class="analytics-empty">No data yet</div>';
    var html = '<div class="analytics-list">';
    rows.forEach(function (r, i) {
      html += '<div class="analytics-list-row">';
      html += '<span class="analytics-list-rank">' + (i + 1) + '</span>';
      html += '<span class="analytics-list-label">' + formatPage(r[labelKey]) + '</span>';
      html += '<span class="analytics-list-value">' + r[valueKey] + (suffix ? suffix : '') + '</span>';
      html += '</div>';
    });
    html += '</div>';
    return html;
  }

  function deviceBar(rows) {
    if (!rows || !rows.length) return '<div class="analytics-empty">No data yet</div>';
    var total = 0;
    var mobile = 0;
    var desktop = 0;
    rows.forEach(function (r) {
      total += r.sessions;
      if (r.device_type === 'mobile') mobile = r.sessions;
      else desktop = r.sessions;
    });
    if (total === 0) return '<div class="analytics-empty">No data yet</div>';
    var mobilePct = Math.round((mobile / total) * 100);
    var desktopPct = 100 - mobilePct;
    var html = '<div class="analytics-device">';
    html += '<div class="analytics-device-bar">';
    html += '<div class="analytics-device-mobile" style="width:' + mobilePct + '%">' + mobilePct + '% mobile</div>';
    html += '<div class="analytics-device-desktop" style="width:' + desktopPct + '%">' + desktopPct + '% desktop</div>';
    html += '</div>';
    html += '<div class="analytics-device-counts">';
    html += '<span>' + mobile + ' mobile sessions</span>';
    html += '<span>' + desktop + ' desktop sessions</span>';
    html += '</div>';
    html += '</div>';
    return html;
  }

})();
