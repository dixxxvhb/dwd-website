/* ═══════════════════════════════════════════════
   DWD — Campaign Command Center
   Access code: dwdps2026
   ═══════════════════════════════════════════════ */

(function () {
  'use strict';

  var ACCESS_CODE = 'dwdps2026';
  var STORAGE_KEY_AUTH = 'dwd_campaign_auth';
  var STORAGE_KEY_POSTED = 'dwd_campaign_posted';
  var STORAGE_KEY_NOTES = 'dwd_campaign_notes';

  // ── CAMPAIGN DATA ──
  var campaignPosts = [
    // ── WEEK 1: THE MYSTERY (Apr 1-7) ──
    {
      date: '2026-04-01', week: 1, label: 'Apr 1',
      type: 'Static Post + Story Carousel',
      account: '@dwdproseries',
      description: '"I\'m done building for someone else" — personal journey to "Something is coming". Feed static should lead with a photo, not text. Caption stays cryptic — no hashtags, no program name. Close with "Stay close." or similar.',
      images: [
        { file: 'week1/Apr1_Static_dwdproseries.png', label: 'Feed Static' },
        { file: 'week1/Apr1_Story_S1_ImDone_dwdproseries.png', label: 'Story 1: I\'m Done' },
        { file: 'week1/Apr1_Story_S2_DoneBuilding_dwdproseries.png', label: 'Story 2: Done Building' },
        { file: 'week1/Apr1_Story_S3_15Years_dwdproseries.png', label: 'Story 3: 15 Years' },
        { file: 'week1/Apr1_Story_S4_BuildMyOwn_dwdproseries.png', label: 'Story 4: Build My Own' },
        { file: 'week1/Apr1_Story_S5_SomethingIsComing_dwdproseries.png', label: 'Story 5: Something Is Coming' }
      ]
    },
    {
      date: '2026-04-01', week: 1, label: 'Apr 1',
      type: 'Story Post',
      account: '@dancewithdixon',
      description: 'Same day as the @dwdproseries opener. Dixon posts a simple story on his main account: a dark/moody photo or 15-second clip with "Something\'s coming." and a "follow @dwdproseries" tag. This funnels existing followers to the new account from day one.',
      images: []
    },
    {
      date: '2026-04-03', week: 1, label: 'Apr 3',
      type: 'Story Post',
      account: '@dwdproseries',
      description: 'Tension hold — black screen or 2-second rehearsal clip, no context. Just "..." or a single question mark. Keeps mystery alive between opener and poll.',
      images: []
    },
    {
      date: '2026-04-04', week: 1, label: 'Apr 4',
      type: 'Poll Post',
      account: '@dwdproseries',
      description: '"Don\'t Look Away" with engagement hook',
      images: [
        { file: 'week1/Apr4_Poll_dwdproseries.png', label: 'Poll Post' }
      ]
    },
    {
      date: '2026-04-05', week: 1, label: 'Apr 5',
      type: 'Countdown Carousel',
      account: '@dwdproseries',
      description: 'Building anticipation — 4-slide countdown. Keep each slide visual-first with minimal text. One image, one short phrase per slide. Don\'t explain yet — still in mystery phase.',
      images: [
        { file: 'week1/Apr5_Countdown_p1of4_dwdproseries.png', label: 'Slide 1' },
        { file: 'week1/Apr5_Countdown_p2of4_dwdproseries.png', label: 'Slide 2' },
        { file: 'week1/Apr5_Countdown_p3of4_dwdproseries.png', label: 'Slide 3' },
        { file: 'week1/Apr5_Countdown_p4of4_dwdproseries.png', label: 'Slide 4' }
      ]
    },
    {
      date: '2026-04-06', week: 1, label: 'Apr 6',
      type: 'Tap Stories',
      account: '@dwdproseries',
      description: 'Dance moments with mystery vibe — tap-through stories',
      images: [
        { file: 'week1/Apr6_Tap1_StandingSplit_dwdproseries.png', label: 'Tap 1: Standing Split' },
        { file: 'week1/Apr6_Tap2_DancerLeap_dwdproseries.png', label: 'Tap 2: Dancer Leap' },
        { file: 'week1/Apr6_Tap3_GroupOnStage_dwdproseries.png', label: 'Tap 3: Group On Stage' }
      ]
    },
    {
      date: '2026-04-07', week: 1, label: 'Apr 7',
      type: 'Story Series',
      account: '@dwdproseries',
      description: '"Built by Director", "This is Personal", "Tomorrow You\'ll Know"',
      images: [
        { file: 'week1/Apr7_S1_BuiltByDirector_dwdproseries.png', label: 'Story 1: Built By Director' },
        { file: 'week1/Apr7_S2_ThisIsPersonal_dwdproseries.png', label: 'Story 2: This Is Personal' },
        { file: 'week1/Apr7_S3_DetailsDropping_dwdproseries.png', label: 'Story 3: Tomorrow You\'ll Know' }
      ]
    },

    // ── WEEK 2: THE REVEAL (Apr 8-14) ──
    {
      date: '2026-04-08', week: 2, label: 'Apr 8',
      type: 'Carousel (5 slides)',
      account: '@dwdproseries',
      description: 'Director Reveal — Slide 1 MUST be a portrait of Dixon (not text, not a logo). Face stops the scroll. Slides 2\u20135 tell the story: 15-year background, Disney + NYC, 9 years building a program from 9 to 23 dancers, now building his own. End with "This is Dance With Dixon."',
      images: [
        { file: 'week2/Apr8_DirectorReveal_p1of5_dwdproseries.png', label: 'Slide 1' },
        { file: 'week2/Apr8_DirectorReveal_p2of5_dwdproseries.png', label: 'Slide 2' },
        { file: 'week2/Apr8_DirectorReveal_p3of5_dwdproseries.png', label: 'Slide 3' },
        { file: 'week2/Apr8_DirectorReveal_p4of5_dwdproseries.png', label: 'Slide 4' },
        { file: 'week2/Apr8_DirectorReveal_p5of5_dwdproseries.png', label: 'Slide 5' }
      ]
    },
    {
      date: '2026-04-09', week: 2, label: 'Apr 9',
      type: 'Reel (60-90 sec)',
      account: '@dancewithdixon + @dwdproseries',
      description: 'Philosophy video — Dixon speaks directly to camera about what\'s broken in youth dance training. Raw, unscripted energy. Don\'t overproduce this — the authenticity IS the content. Post to @dancewithdixon first, share to @dwdproseries.',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-10', week: 2, label: 'Apr 10',
      type: 'Feed Post',
      account: '@dancewithdixon',
      description: 'Personal account funnel post — Dixon posts on his main account directing followers to @dwdproseries. "I\'ve been building something. If you\'ve been watching the @dwdproseries account, now you know who\'s behind it. Go follow. This is just the beginning." This is how the existing audience finds the new account.',
      images: []
    },
    {
      date: '2026-04-11', week: 2, label: 'Apr 11',
      type: 'Carousel (6 slides)',
      account: '@dwdproseries',
      description: '"What If?" — Cut to 4\u20135 slides max. Each slide = one direct question to the parent over a strong image. "What if your dancer\'s choreography was created by a working director — not pulled from a syllabus?" "What if the person running rehearsal was the same person who built the program?" Last slide: "That\'s ProSeries." + @dwdproseries',
      images: [
        { file: 'week2/Apr11_WhatIf_p1of6_dwdproseries.png', label: 'Slide 1' },
        { file: 'week2/Apr11_WhatIf_p2of6_dwdproseries.png', label: 'Slide 2' },
        { file: 'week2/Apr11_WhatIf_p3of6_dwdproseries.png', label: 'Slide 3' },
        { file: 'week2/Apr11_WhatIf_p4of6_dwdproseries.png', label: 'Slide 4' },
        { file: 'week2/Apr11_WhatIf_p5of6_dwdproseries.png', label: 'Slide 5' },
        { file: 'week2/Apr11_WhatIf_p6of6_dwdproseries.png', label: 'Slide 6' }
      ]
    },
    {
      date: '2026-04-12', week: 2, label: 'Apr 12',
      type: 'Reel/Story (15-30 sec)',
      account: '@dancewithdixon',
      description: 'Behind-the-scenes clip of teaching/rehearsing',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-13', week: 2, label: 'Apr 13',
      type: 'Story Poll (3 slides)',
      account: '@dwdproseries + @DWDCollective',
      description: '"What matters most in training?" — Make poll options feel like genuine choices, not leading questions. Example options: "Technique" / "Artistry" / "Stage presence" / "The teacher." Let answers be real — no obvious "right" answer.',
      images: [
        { file: 'week2/Apr13_StoryPoll_S1_dwdproseries.png', label: 'Poll Slide 1' },
        { file: 'week2/Apr13_StoryPoll_S2_dwdproseries.png', label: 'Poll Slide 2' },
        { file: 'week2/Apr13_StoryPoll_S3_dwdproseries.png', label: 'Poll Slide 3' }
      ]
    },

    // ── WEEK 3: THE PROGRAM (Apr 15-21) ──
    {
      date: '2026-04-15', week: 3, label: 'Apr 15',
      type: 'Carousel (7 slides)',
      account: '@dwdproseries',
      description: 'PROGRAM OVERVIEW — Most important post of campaign. 7 slides. Every slide must earn its spot. Last slide = crystal clear CTA: "Registration opens May 1. Link in bio." Don\'t bury the action in other info. This post needs to be saved and shared by parents.',
      images: [
        { file: 'week3/Apr15_ProgramOverview_p1of7_dwdproseries.png', label: 'Slide 1' },
        { file: 'week3/Apr15_ProgramOverview_p2of7_dwdproseries.png', label: 'Slide 2' },
        { file: 'week3/Apr15_ProgramOverview_p3of7_dwdproseries.png', label: 'Slide 3' },
        { file: 'week3/Apr15_ProgramOverview_p4of7_dwdproseries.png', label: 'Slide 4' },
        { file: 'week3/Apr15_ProgramOverview_p5of7_dwdproseries.png', label: 'Slide 5' },
        { file: 'week3/Apr15_ProgramOverview_p6of7_dwdproseries.png', label: 'Slide 6' },
        { file: 'week3/Apr15_ProgramOverview_p7of7_dwdproseries.png', label: 'Slide 7' }
      ]
    },
    {
      date: '2026-04-17', week: 3, label: 'Apr 17',
      type: 'Carousel (5 slides)',
      account: '@dwdproseries',
      description: '"Not Your Average Program" — Reframe from comparison to aspiration. Don\'t name or trash other studios — parents\' kids are currently AT those studios. Instead: "What if training looked like this?" Show what ProSeries does without directly calling out what others don\'t. Same message, no bridge-burning. Frame it as an upgrade, not an insult.',
      images: [
        { file: 'week3/Apr17_NotAverage_p1of5_dwdproseries.png', label: 'Slide 1' },
        { file: 'week3/Apr17_NotAverage_p2of5_dwdproseries.png', label: 'Slide 2' },
        { file: 'week3/Apr17_NotAverage_p3of5_dwdproseries.png', label: 'Slide 3' },
        { file: 'week3/Apr17_NotAverage_p4of5_dwdproseries.png', label: 'Slide 4' },
        { file: 'week3/Apr17_NotAverage_p5of5_dwdproseries.png', label: 'Slide 5' }
      ]
    },
    {
      date: '2026-04-18', week: 3, label: 'Apr 18',
      type: 'Reel (15-30 sec)',
      account: '@dwdproseries + @dancewithdixon',
      description: 'Competition highlight clip — shows artistry standard',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-19', week: 3, label: 'Apr 19',
      type: 'Story Series (5 slides)',
      account: '@dwdproseries',
      description: 'Parent Q&A — location, format, ages, signup process',
      images: [
        { file: 'week3/Apr19_ParentQA_S1_dwdproseries.png', label: 'Q&A Slide 1' },
        { file: 'week3/Apr19_ParentQA_S2_dwdproseries.png', label: 'Q&A Slide 2' },
        { file: 'week3/Apr19_ParentQA_S3_dwdproseries.png', label: 'Q&A Slide 3' },
        { file: 'week3/Apr19_ParentQA_S4_dwdproseries.png', label: 'Q&A Slide 4' },
        { file: 'week3/Apr19_ParentQA_S5_dwdproseries.png', label: 'Q&A Slide 5' }
      ]
    },
    {
      date: '2026-04-20', week: 3, label: 'Apr 20',
      type: 'Cross-post',
      account: '@DWDCollective',
      description: 'Share Apr 15 Program Overview carousel to @DWDCollective with a DWDC-specific caption: "The same director building your adult company is now launching something for the next generation. Two programs. One standard. One choreographer." Make the cross-post feel intentional — not a lazy reshare.',
      images: [],
      isCrossPost: true
    },

    // ── WEEK 4: THE PUSH (Apr 22-30) ──
    {
      date: '2026-04-22', week: 4, label: 'Apr 22',
      type: 'Countdown Carousel (4 slides)',
      account: '@dwdproseries',
      description: '"9 days. Registration May 1." — Let urgency breathe. Don\'t cram everything into slide 1. Slide 1: the number (9). Slide 2: "Registration opens May 1." Slide 3: "Three tracks. Limited spots. One director\'s vision." Slide 4: strong photo of Dixon teaching + "Link in bio."',
      images: [
        { file: 'week4/Apr22_Countdown_p1of4_dwdproseries.png', label: 'Slide 1' },
        { file: 'week4/Apr22_Countdown_p2of4_dwdproseries.png', label: 'Slide 2' },
        { file: 'week4/Apr22_Countdown_p3of4_dwdproseries.png', label: 'Slide 3' },
        { file: 'week4/Apr22_Countdown_p4of4_dwdproseries.png', label: 'Slide 4' }
      ]
    },
    {
      date: '2026-04-23', week: 4, label: 'Apr 23',
      type: 'Reel (60-90 sec)',
      account: '@dancewithdixon + @dwdproseries',
      description: 'Dixon speaks personally — "Why this matters to me" — emotional hook',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-25', week: 4, label: 'Apr 25',
      type: 'Testimonial Carousel (5 slides)',
      account: '@dwdproseries',
      description: 'Social proof — parent + student quotes with REAL NAMES and attribution. "Sarah M., dance parent" hits harder than anonymous. If possible, pair quotes with photos of the parent or dancer. Slide 1: "What dancers and parents are saying." Slides 2\u20134: individual quotes. Slide 5: "Registration opens May 1."',
      images: [
        { file: 'week4/Apr25_Testimonial_p1of5_dwdproseries.png', label: 'Slide 1' },
        { file: 'week4/Apr25_Testimonial_p2of5_dwdproseries.png', label: 'Slide 2' },
        { file: 'week4/Apr25_Testimonial_p3of5_dwdproseries.png', label: 'Slide 3' },
        { file: 'week4/Apr25_Testimonial_p4of5_dwdproseries.png', label: 'Slide 4' },
        { file: 'week4/Apr25_Testimonial_p5of5_dwdproseries.png', label: 'Slide 5' }
      ]
    },
    {
      date: '2026-04-26', week: 4, label: 'Apr 26',
      type: 'Reel (15-30 sec)',
      account: '@dwdproseries',
      description: 'Raw rehearsal/class energy clip',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-28', week: 4, label: 'Apr 28',
      type: 'Carousel (3 slides)',
      account: '@dwdproseries',
      description: 'FINAL DETAILS — location reveal, class schedule, registration info',
      images: [
        { file: 'week4/Apr28_FinalDetails_p1of3_dwdproseries.png', label: 'Slide 1' },
        { file: 'week4/Apr28_FinalDetails_p2of3_dwdproseries.png', label: 'Slide 2' },
        { file: 'week4/Apr28_FinalDetails_p3of3_dwdproseries.png', label: 'Slide 3' }
      ]
    },
    {
      date: '2026-04-30', week: 4, label: 'Apr 30',
      type: 'Recap Carousel (8 slides) + Stories',
      account: 'All accounts',
      description: 'Month recap — trim to 5\u20136 strongest moments, not all 8. "In case you missed it." Last slide must be the LOUDEST thing in the entire campaign: "TOMORROW. Registration opens. Link in bio." Full stop. Post across all three accounts with countdown sticker on stories.',
      images: [
        { file: 'week4/Apr30_Recap_p1of8_dwdproseries.png', label: 'Slide 1' },
        { file: 'week4/Apr30_Recap_p2of8_dwdproseries.png', label: 'Slide 2' },
        { file: 'week4/Apr30_Recap_p3of8_dwdproseries.png', label: 'Slide 3' },
        { file: 'week4/Apr30_Recap_p4of8_dwdproseries.png', label: 'Slide 4' },
        { file: 'week4/Apr30_Recap_p5of8_dwdproseries.png', label: 'Slide 5' },
        { file: 'week4/Apr30_Recap_p6of8_dwdproseries.png', label: 'Slide 6' },
        { file: 'week4/Apr30_Recap_p7of8_dwdproseries.png', label: 'Slide 7' },
        { file: 'week4/Apr30_Recap_p8of8_dwdproseries.png', label: 'Slide 8' }
      ]
    },
    {
      date: '2026-05-01', week: 4, label: 'May 1',
      type: 'Feed Post + Stories',
      account: 'All accounts (@dwdproseries + @dancewithdixon + @DWDCollective)',
      description: 'LAUNCH DAY. Registration is live. Clean graphic + link. "DWD ProSeries. Season 1. Registration is open. Three tracks. Limited spots. Link in bio." Stories on all accounts with link sticker. This is the post the entire campaign has been building toward — do not skip it.',
      images: []
    }
  ];

  var weekNames = {
    1: 'Week 1: The Mystery',
    2: 'Week 2: The Reveal',
    3: 'Week 3: The Program',
    4: 'Week 4: The Push'
  };

  var weekDates = {
    1: 'Apr 1 \u2013 7',
    2: 'Apr 8 \u2013 14',
    3: 'Apr 15 \u2013 21',
    4: 'Apr 22 \u2013 May 1'
  };

  // ── STORAGE HELPERS ──
  function getPosted() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_POSTED)) || {}; } catch (e) { return {}; }
  }
  function setPosted(data) {
    localStorage.setItem(STORAGE_KEY_POSTED, JSON.stringify(data));
  }
  function getNotes() {
    try { return JSON.parse(localStorage.getItem(STORAGE_KEY_NOTES)) || {}; } catch (e) { return {}; }
  }
  function setNotes(data) {
    localStorage.setItem(STORAGE_KEY_NOTES, JSON.stringify(data));
  }
  function isAuthenticated() {
    return localStorage.getItem(STORAGE_KEY_AUTH) === ACCESS_CODE;
  }
  function authenticate() {
    localStorage.setItem(STORAGE_KEY_AUTH, ACCESS_CODE);
  }

  // ── RENDER ──
  function getPostId(post) {
    return post.date + '_' + post.type.replace(/[^a-zA-Z0-9]/g, '');
  }

  function renderProgressBar(container) {
    var posted = getPosted();
    var total = campaignPosts.length;
    var done = 0;
    campaignPosts.forEach(function (p) {
      if (posted[getPostId(p)]) done++;
    });
    var pct = Math.round((done / total) * 100);

    container.innerHTML =
      '<div class="campaign-progress">' +
        '<div class="campaign-progress-label">' + done + ' / ' + total + ' posts complete (' + pct + '%)</div>' +
        '<div class="campaign-progress-bar"><div class="campaign-progress-fill" style="width:' + pct + '%"></div></div>' +
      '</div>';
  }

  function renderDashboard() {
    var page = document.getElementById('campaign-dashboard');
    if (!page) return;

    var posted = getPosted();
    var notes = getNotes();

    // Progress bar
    var progressEl = document.getElementById('campaign-progress');
    renderProgressBar(progressEl);

    // Brand notes section (below progress bar)
    var brandNotesHTML =
      '<div class="campaign-brand-notes">' +
        '<h3 class="campaign-section-title">Campaign Notes</h3>' +
        '<ul>' +
          '<li><strong>DWDPS brand palette:</strong> Electric green (#00D68F) + soft pink (#FF8FAB) on dark/black backgrounds. Week 1 stays moody/dark (mystery phase). Starting Week 2, begin introducing the ProSeries colors to signal "something new" in the feed.</li>' +
          '<li><strong>Photo-first slides outperform text-first slides.</strong> Lead with faces and movement. Save text-heavy slides for mid-carousel, never slide 1.</li>' +
        '</ul>' +
      '</div>';
    progressEl.insertAdjacentHTML('afterend', brandNotesHTML);

    // Highlight covers section
    var highlightsEl = document.getElementById('campaign-highlights');
    highlightsEl.innerHTML =
      '<h3 class="campaign-section-title">Highlight Covers</h3>' +
      '<div class="campaign-highlight-warning" style="background:rgba(255,143,171,0.15);border:1px solid rgba(255,143,171,0.4);border-radius:8px;padding:10px 16px;margin-bottom:16px;color:#FF8FAB;font-size:0.9rem;font-weight:500;">Covers need final designs before Apr 1 launch.</div>' +
      '<div class="campaign-highlights-grid">' +
        '<div class="campaign-highlight-item"><img src="images/campaign/highlights/highlight-about.png" alt="About Highlight" loading="lazy"><span>About</span></div>' +
        '<div class="campaign-highlight-item"><img src="images/campaign/highlights/highlight-auditions.png" alt="Auditions Highlight" loading="lazy"><span>Auditions</span></div>' +
        '<div class="campaign-highlight-item"><img src="images/campaign/highlights/highlight-faq.png" alt="FAQ Highlight" loading="lazy"><span>FAQ</span></div>' +
        '<div class="campaign-highlight-item"><img src="images/campaign/highlights/highlight-tracks.png" alt="Tracks Highlight" loading="lazy"><span>Tracks</span></div>' +
      '</div>';

    // Week sections
    var weeksEl = document.getElementById('campaign-weeks');
    weeksEl.innerHTML = '';

    [1, 2, 3, 4].forEach(function (weekNum) {
      var weekPosts = campaignPosts.filter(function (p) { return p.week === weekNum; });
      var weekPostedCount = 0;
      weekPosts.forEach(function (p) { if (posted[getPostId(p)]) weekPostedCount++; });

      var weekSection = document.createElement('div');
      weekSection.className = 'campaign-week';
      weekSection.id = 'campaign-week-' + weekNum;

      var weekHeader = document.createElement('div');
      weekHeader.className = 'campaign-week-header';
      weekHeader.innerHTML =
        '<div class="campaign-week-title">' +
          '<h3>' + weekNames[weekNum] + '</h3>' +
          '<span class="campaign-week-dates">' + weekDates[weekNum] + '</span>' +
        '</div>' +
        '<div class="campaign-week-status">' + weekPostedCount + '/' + weekPosts.length + ' posted</div>' +
        '<button class="campaign-week-toggle" aria-label="Toggle week">&blacktriangledown;</button>';

      weekHeader.addEventListener('click', function () {
        weekSection.classList.toggle('collapsed');
        var toggle = weekHeader.querySelector('.campaign-week-toggle');
        toggle.innerHTML = weekSection.classList.contains('collapsed') ? '&#9654;' : '&blacktriangledown;';
      });

      var weekBody = document.createElement('div');
      weekBody.className = 'campaign-week-body';

      weekPosts.forEach(function (post) {
        var postId = getPostId(post);
        var isPosted = !!posted[postId];
        var noteText = notes[postId] || '';

        var postEl = document.createElement('div');
        postEl.className = 'campaign-post' + (isPosted ? ' posted' : '');
        postEl.dataset.postId = postId;

        // Post header
        var headerHTML =
          '<div class="campaign-post-header">' +
            '<div class="campaign-post-meta">' +
              '<span class="campaign-post-date">' + post.label + '</span>' +
              '<span class="campaign-post-type">' + post.type + '</span>' +
              '<span class="campaign-post-account">' + post.account + '</span>' +
              (post.isVideo ? '<span class="campaign-badge-video">NEEDS FILMING</span>' : '') +
              (post.isCrossPost ? '<span class="campaign-badge-crosspost">CROSS-POST</span>' : '') +
            '</div>' +
            '<label class="campaign-posted-toggle">' +
              '<input type="checkbox"' + (isPosted ? ' checked' : '') + '>' +
              '<span class="campaign-posted-label">' + (isPosted ? 'Posted' : 'Mark Posted') + '</span>' +
            '</label>' +
          '</div>';

        // Description
        var descHTML = '<div class="campaign-post-desc">' + post.description + '</div>';

        // Images
        var imagesHTML = '';
        if (post.images.length > 0) {
          imagesHTML = '<div class="campaign-post-images">';
          post.images.forEach(function (img) {
            imagesHTML +=
              '<div class="campaign-thumb" data-full="images/campaign/' + img.file + '">' +
                '<img src="images/campaign/' + img.file + '" alt="' + img.label + '" loading="lazy">' +
                '<span class="campaign-thumb-label">' + img.label + '</span>' +
              '</div>';
          });
          imagesHTML += '</div>';
        }

        // Notes
        var notesHTML =
          '<div class="campaign-post-notes">' +
            '<textarea placeholder="Notes, edit suggestions, reminders..." rows="2">' + noteText + '</textarea>' +
          '</div>';

        postEl.innerHTML = headerHTML + descHTML + imagesHTML + notesHTML;

        // Event: toggle posted
        var checkbox = postEl.querySelector('input[type="checkbox"]');
        checkbox.addEventListener('change', function () {
          var p = getPosted();
          if (checkbox.checked) {
            p[postId] = Date.now();
            postEl.classList.add('posted');
            postEl.querySelector('.campaign-posted-label').textContent = 'Posted';
          } else {
            delete p[postId];
            postEl.classList.remove('posted');
            postEl.querySelector('.campaign-posted-label').textContent = 'Mark Posted';
          }
          setPosted(p);
          renderProgressBar(progressEl);
          // Update week count
          var wc = 0;
          weekPosts.forEach(function (wp) { if (p[getPostId(wp)]) wc++; });
          weekHeader.querySelector('.campaign-week-status').textContent = wc + '/' + weekPosts.length + ' posted';
        });

        // Event: save notes on blur
        var textarea = postEl.querySelector('textarea');
        textarea.addEventListener('blur', function () {
          var n = getNotes();
          if (textarea.value.trim()) {
            n[postId] = textarea.value.trim();
          } else {
            delete n[postId];
          }
          setNotes(n);
        });

        // Event: click thumbnail to open lightbox
        postEl.querySelectorAll('.campaign-thumb').forEach(function (thumb) {
          thumb.addEventListener('click', function () {
            openCampaignLightbox(thumb.dataset.full);
          });
        });

        weekBody.appendChild(postEl);
      });

      weekSection.appendChild(weekHeader);
      weekSection.appendChild(weekBody);
      weeksEl.appendChild(weekSection);
    });
  }

  // ── LIGHTBOX (reuses site lightbox if possible, else simple overlay) ──
  function openCampaignLightbox(src) {
    var lightbox = document.getElementById('lightbox');
    var lightboxImg = document.getElementById('lightbox-img');
    if (lightbox && lightboxImg) {
      lightboxImg.src = src;
      lightboxImg.alt = 'Campaign graphic';
      lightbox.classList.add('open');
      lightbox.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
      // Hide prev/next for single image view
      var prevBtn = lightbox.querySelector('.lightbox-prev');
      var nextBtn = lightbox.querySelector('.lightbox-next');
      if (prevBtn) prevBtn.style.display = 'none';
      if (nextBtn) nextBtn.style.display = 'none';
      // Restore on close
      var restore = function () {
        if (prevBtn) prevBtn.style.display = '';
        if (nextBtn) nextBtn.style.display = '';
        lightbox.removeEventListener('click', onClose);
      };
      var onClose = function (e) {
        if (e.target === lightbox || e.target.classList.contains('lightbox-close')) {
          restore();
        }
      };
      lightbox.addEventListener('click', onClose);
    }
  }

  // ── ACCESS CODE GATE ──
  function initCampaignAuth() {
    var gate = document.getElementById('campaign-gate');
    var dashboard = document.getElementById('campaign-dashboard');
    if (!gate || !dashboard) return;

    if (isAuthenticated()) {
      gate.style.display = 'none';
      dashboard.style.display = 'block';
      renderDashboard();
      return;
    }

    gate.style.display = 'flex';
    dashboard.style.display = 'none';

    var form = document.getElementById('campaign-auth-form');
    var input = document.getElementById('campaign-code-input');
    var error = document.getElementById('campaign-auth-error');

    if (form) {
      form.addEventListener('submit', function (e) {
        e.preventDefault();
        if (input.value.trim() === ACCESS_CODE) {
          authenticate();
          gate.style.display = 'none';
          dashboard.style.display = 'block';
          renderDashboard();
          // Also unlock ProSeries full view
          window.dwdCampaignUnlocked = true;
          if (typeof window.applyProSeriesReveal === 'function') {
            window.applyProSeriesReveal();
          }
        } else {
          error.style.display = 'block';
          input.value = '';
          input.focus();
        }
      });
    }
  }

  // ── PROSERIES PROGRESSIVE REVEAL ──
  // Date thresholds for what to show on the public ProSeries page
  var revealDates = {
    tracks: '2026-04-15',    // Track cards + pricing revealed with Program Overview post
    fees: '2026-04-28',      // Fee schedule revealed with Final Details post
    timeline: '2026-04-28',  // Timeline revealed with Final Details post
    form: '2026-05-01'       // Interest form goes live when registration opens
  };

  function getTodayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  window.applyProSeriesReveal = function () {
    var today = getTodayStr();
    var unlocked = window.dwdCampaignUnlocked || isAuthenticated();

    document.querySelectorAll('[data-reveal-after]').forEach(function (el) {
      var revealDate = el.dataset.revealAfter;
      if (unlocked || today >= revealDate) {
        el.style.display = '';
        // Hide the corresponding coming-soon banner
        var banner = el.previousElementSibling;
        if (banner && banner.classList.contains('coming-soon-banner')) {
          banner.style.display = 'none';
        }
      } else {
        el.style.display = 'none';
        // Show the coming-soon banner
        var banner = el.previousElementSibling;
        if (banner && banner.classList.contains('coming-soon-banner')) {
          banner.style.display = '';
        }
      }
    });

    // Update hero CTA: point to coming-soon signup if form is hidden
    var heroCta = document.getElementById('ps-hero-cta');
    var interestForm = document.getElementById('proseries-interest');
    if (heroCta && interestForm) {
      if (interestForm.style.display === 'none') {
        heroCta.href = '#cs-tracks';
        heroCta.textContent = 'Get Notified';
      } else {
        heroCta.href = '#proseries-interest';
        heroCta.textContent = 'Express Interest';
      }
    }
  };

  // ── INIT ──
  // Run on page load and hash change
  function initCampaign() {
    var page = document.getElementById('page-campaign');
    if (page && (window.location.hash === '#campaign' || window.location.hash.startsWith('#campaign?'))) {
      initCampaignAuth();
    }
    window.applyProSeriesReveal();
  }

  // Set campaign unlock flag if previously authenticated
  if (isAuthenticated()) {
    window.dwdCampaignUnlocked = true;
  }

  // Run on load
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initCampaign);
  } else {
    initCampaign();
  }

  // Re-run when hash changes
  window.addEventListener('hashchange', function () {
    setTimeout(initCampaign, 50);
  });

})();
