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
      account: '@dixonbowles',
      description: 'Same day as the @dwdproseries opener. Dixon posts a simple story on his main account: a dark/moody photo or 15-second clip with "Something\'s coming." and a "follow @dwdproseries" tag. This funnels existing followers to the new account from day one.',
      images: []
    },
    {
      date: '2026-04-02', week: 1, label: 'Apr 2',
      type: 'Photo Carousel (8 slides)',
      account: '@dwdproseries',
      category: 'MEET DIXON',
      description: '"Meet Your Director" — 8-slide narrative: Dixon\'s headshot, teaching credentials, guest teaching, Disney/NYC/national stages, "Now building something new." Every slide branded with DWDPS logo, color-graded, lower-third text bars.',
      images: [
        { file: 'week1/Apr2_MeetDixon_cover.jpg', label: 'Cover: Meet Your Director' }
      ]
    },
    {
      date: '2026-04-03', week: 1, label: 'Apr 3',
      type: 'Reel + Landscape (22s / 20s)',
      account: '@dwdproseries',
      category: 'THROWBACK',
      description: '"The Room" — Rapid-fire montage of 14 clips across 10+ studios Dixon has taught in. Flash frames in brand pink between sections. Hook text at 0.5s, closing text "10 years. Countless rooms. One standard." DWDPS logo watermark throughout. End card with handle + CTA. Reel (9:16) + landscape (16:9) use different source clips.',
      images: [],
      isVideo: true
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
      account: '@dixonbowles + @dwdproseries',
      description: 'Philosophy video — Dixon speaks directly to camera about what\'s broken in youth dance training. Raw, unscripted energy. Don\'t overproduce this — the authenticity IS the content. Post to @dixonbowles first, share to @dwdproseries.',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-10', week: 2, label: 'Apr 10',
      type: 'Photo Carousel (8 slides)',
      account: '@dwdproseries',
      category: 'MEET DIXON',
      description: '"This Is Where I\'ve Been" — 8-slide guest teaching journey. Photo-led cover, branded lower-thirds on every slide, color-graded. Shows Dixon\'s range across studios and classes. Ends with "Now I\'m bringing it all home" + CTA.',
      images: [
        { file: 'week2/Apr10_GuestTeaching_cover.jpg', label: 'Cover: Guest Teaching' }
      ]
    },
    {
      date: '2026-04-10', week: 2, label: 'Apr 10',
      type: 'Feed Post',
      account: '@dixonbowles',
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
      type: 'Reel + Landscape (24s / 23s)',
      account: '@dwdproseries',
      category: 'STUDIO ENERGY',
      description: '"This Is The Work" — 15-clip rapid-fire training montage. Uses all 8 pre-cut teaching clips + 7 fresh studio clips. Hook text: "This is what training looks like." Flash frames in brand pink between sections. Slower closing section for focus moments. End card with DWDPS logo + CTA. Reel (9:16) uses teaching clips; landscape (16:9) uses competition + b-roll clips.',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-13', week: 2, label: 'Apr 13',
      type: 'Story Poll (3 slides)',
      account: '@dwdproseries + @dwd_collective',
      description: '"What matters most in training?" — Make poll options feel like genuine choices, not leading questions. Example options: "Technique" / "Artistry" / "Stage presence" / "The teacher." Let answers be real — no obvious "right" answer.',
      images: [
        { file: 'week2/Apr13_StoryPoll_S1_dwdproseries.png', label: 'Poll Slide 1' },
        { file: 'week2/Apr13_StoryPoll_S2_dwdproseries.png', label: 'Poll Slide 2' },
        { file: 'week2/Apr13_StoryPoll_S3_dwdproseries.png', label: 'Poll Slide 3' }
      ]
    },

    {
      date: '2026-04-14', week: 2, label: 'Apr 14',
      type: 'Text Carousel (8 slides)',
      account: '@dwdproseries',
      category: 'PHILOSOPHY',
      description: '"Training vs. Taking Class" — Editorial magazine-style text carousel. 8 slides with photo underlays, gradient backgrounds, noise texture. Defines the difference: taking class is a transaction, training is a curriculum with accountability. 3 numbered differences (Structure, Feedback, Standards). Closes with "ProSeries is training. That\'s the whole point." + CTA.',
      images: [
        { file: 'week2/Apr14_TrainingVsClass_cover.jpg', label: 'Cover: Training vs Taking Class' }
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
      date: '2026-04-16', week: 3, label: 'Apr 16',
      type: 'Photo Carousel (8 slides)',
      account: '@dwdproseries',
      category: 'THROWBACK',
      description: '"Then & Now" — Split-image B&W/color cover (young Dixon vs now). 8-slide transformation timeline showing progression from early training through to building ProSeries. Branded throughout.',
      images: [
        { file: 'week3/Apr16_ThenAndNow_cover.jpg', label: 'Cover: Then & Now' }
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
      account: '@dwdproseries + @dixonbowles',
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
      type: 'Reel + Landscape (21s / 18s)',
      account: '@dwdproseries',
      category: 'STUDIO ENERGY',
      description: '"Solo Prep" — Multi-clip montage of solo work + competition solos. 12 clips: 5 from IMG_4841, 3 from IMG_4842, River solo, Fallin\' solo, vertical clips. Alternates between studio prep and competition moments. Fade-from-black hook: "Before the spotlight..." Closing: "The work happens here." DWDPS logo watermark + branded end card.',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-20', week: 3, label: 'Apr 20',
      type: 'Cross-post',
      account: '@dwd_collective',
      description: 'Share Apr 15 Program Overview carousel to @dwd_collective with a DWDC-specific caption: "The same director building your adult company is now launching something for the next generation. Two programs. One standard. One choreographer." Make the cross-post feel intentional — not a lazy reshare.',
      images: [],
      isCrossPost: true
    },

    {
      date: '2026-04-21', week: 3, label: 'Apr 21',
      type: 'This or That Stories',
      account: '@dwdproseries',
      category: 'ENGAGEMENT',
      description: '"This or That" interactive stories — create directly in Instagram (no pre-built assets). Dance-themed choices: "Ballet barre vs. Center floor?", "Competition vs. Showcase?", "Lyrical vs. Contemporary?", "Morning class vs. Evening class?" Use the IG poll sticker on each story. Fun, light engagement between heavier content days.',
      images: []
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
      account: '@dixonbowles + @dwdproseries',
      description: 'Dixon speaks personally — "Why this matters to me" — emotional hook',
      images: [],
      isVideo: true
    },
    {
      date: '2026-04-24', week: 4, label: 'Apr 24',
      type: 'Photo Carousel (10 slides)',
      account: '@dwdproseries',
      category: 'MEET DIXON',
      description: '"Behind the Choreography" — Photo dump with purpose. 10 slides: branded pink-bordered frames, photo grid layout, candid moments from teaching and backstage. Cover: photo-led "Behind the Choreography". Mix of headshots, teaching shots, group energy, and fun candids. DWDPS logo on every slide.',
      images: [
        { file: 'week4/Apr24_Backstage_cover.jpg', label: 'Cover: Behind the Choreography' }
      ]
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
      date: '2026-04-27', week: 4, label: 'Apr 27',
      type: 'Text Carousel (10 slides)',
      account: '@dwdproseries',
      category: 'PHILOSOPHY',
      description: '"What I Look For in an Audition" — 10-slide editorial text carousel. Cover with photo underlay. 6 qualities (Presence, Work Ethic, Coachability, Artistry, Consistency, Heart) each on its own slide with large faded numbers. "What doesn\'t matter" flip slide in different color palette. "What really matters" closer with photo. CTA with DWDPS logo.',
      images: [
        { file: 'week4/Apr27_Audition_cover.jpg', label: 'Cover: What I Look For' }
      ]
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
      date: '2026-04-29', week: 4, label: 'Apr 29',
      type: 'Reel (45s)',
      account: '@dwdproseries + @dixonbowles',
      category: 'THROWBACK',
      description: 'Evolution Reel v2 — B&W-to-color timeline 2016-2026. 45 seconds, 9:16. Uses approved clips + brand fonts (Cormorant Garamond + Outfit) + DWD colors. BUILT, awaiting Dixon review. File at ~/Desktop/DWD/Reel Builds/evolution_reel_v2.mp4',
      images: [],
      isVideo: true
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
      account: 'All accounts (@dwdproseries + @dixonbowles + @dwd_collective)',
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
          '<li><strong>DWDPS brand palette:</strong> Seafoam (#6BAF8A) + soft pink (#FF8FAB) on dark/black backgrounds. Week 1 stays moody/dark (mystery phase). Starting Week 2, begin introducing the ProSeries colors to signal "something new" in the feed.</li>' +
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
  // Elements with `data-reveal-after` are hidden until the given moment.
  // Format accepts either:
  //   - "YYYY-MM-DD"            → fires at midnight local time (legacy)
  //   - Full ISO with offset    → fires at that exact global moment
  //     e.g. "2026-04-15T12:00:00-04:00" for noon Eastern Daylight Time

  function getTodayStr() {
    var d = new Date();
    var m = String(d.getMonth() + 1).padStart(2, '0');
    var day = String(d.getDate()).padStart(2, '0');
    return d.getFullYear() + '-' + m + '-' + day;
  }

  // Preview helper — `?launched=1` (URL) OR `window.__dwdLaunchPreview = true` (eval)
  // forces every era visible at once (both reveal-after AND hide-after gates).
  // Session-scoped only — neither is ever written to localStorage, so the
  // preview can't outlive the tab. Production never sets these.
  function isLaunchPreview() {
    if (window.__dwdLaunchPreview === true) return true;
    try { return new URLSearchParams(window.location.search).get('launched') === '1'; }
    catch (e) { return false; }
  }

  // Pure date compare — has this attr's moment actually passed? No preview
  // short-circuit here; applyProSeriesReveal() applies the preview override
  // itself so it can treat data-reveal-after and data-hide-after oppositely
  // (preview always REVEALS, never HIDES).
  function dateHasPassed(attr) {
    if (!attr) return true;
    // Full ISO datetime — compare timestamps
    if (attr.indexOf('T') !== -1) {
      var revealMs = new Date(attr).getTime();
      if (isNaN(revealMs)) return false;
      return Date.now() >= revealMs;
    }
    // Legacy date-only — compare local-date string
    return getTodayStr() >= attr;
  }

  // Era preview (see-every-era-at-once) is granted ONLY by isLaunchPreview() —
  // `?launched=1` in the URL, or `window.__dwdLaunchPreview = true` set at eval
  // time. Both are session-scoped: neither persists to localStorage, so the
  // preview never outlives the tab/page load. The `dwdps2026` campaign code no
  // longer has any say over what era a visitor sees — it still gates the
  // campaign HQ + analytics pages themselves (initCampaignAuth above), just not
  // the site's date-gated sections. (A5, 2026-07-10 — a campaign-authed browser
  // used to force-reveal every era and suppress every hide, which meant Dixon's
  // own browser never showed him what visitors actually saw.)
  window.applyProSeriesReveal = function () {
    var preview = isLaunchPreview();

    // A single element frequently carries BOTH attributes now (an era window
    // has a start AND an end — e.g. the Summer Intensive surfaces reveal Jun 12
    // and hide Jul 11). Visibility has to be decided once, as one AND of both
    // conditions — NOT as two independent passes. Two independent passes (the
    // original implementation) is a real bug: whichever selector runs second
    // wins outright, so an element that correctly hid itself because its
    // reveal-after moment hasn't arrived yet gets un-hidden a few lines later
    // by the hide-after pass simply because its hide-after moment ALSO hasn't
    // arrived yet. Found live during A1/A2 verification (2026-07-10) once
    // #season-one-cta — reveal Jul 11, hide Aug 10 — started showing up early.
    document.querySelectorAll('[data-reveal-after], [data-hide-after]').forEach(function (el) {
      var revealAttr = el.dataset.revealAfter;
      var hideAttr = el.dataset.hideAfter;
      var revealed = preview || !revealAttr || dateHasPassed(revealAttr);
      var hidden = !preview && !!hideAttr && dateHasPassed(hideAttr);
      var visible = revealed && !hidden;

      if (visible) {
        el.style.display = '';
        // Hide the corresponding coming-soon banner
        var banner = el.previousElementSibling;
        if (banner && banner.classList.contains('coming-soon-banner')) {
          banner.style.display = 'none';
        }
      } else {
        el.style.display = 'none';
        // Show the coming-soon banner (only meaningful for the not-revealed-yet
        // case — an element already revealed-then-hidden doesn't get one back)
        var banner2 = el.previousElementSibling;
        if (revealAttr && !revealed && banner2 && banner2.classList.contains('coming-soon-banner')) {
          banner2.style.display = '';
        }
      }
    });

    // Fold the old .ps-hero away the instant the Season One premiere band is
    // itself revealed (2026-08-03: the band absorbed the hero's identity —
    // logo, label, CTA — so showing both back to back read as a repeat).
    // #s1-premiere's display was just decided by the loop above using the
    // same data-reveal-after gate (and the same preview override), so this
    // naturally follows it under ?launched=1 too: before Aug 10 the hero
    // shows exactly as before, from Aug 10 (or under preview) it's hidden
    // and the band is the one true opener.
    // 2026-08-16: the fold now ends with the season. While Season One is live
    // (premiere/midseason/finale) the band IS the ProSeries hero and the old
    // .ps-hero stays folded away. Once the season wraps, the band drops to
    // archive copy and the evergreen hero comes back — otherwise the page
    // would lose its own opener permanently, which is what the old
    // unconditional fold actually did.
    var s1PremiereEl = document.getElementById('s1-premiere');
    var psPage = document.getElementById('page-proseries');
    if (psPage && s1PremiereEl) {
      var bandUp = s1PremiereEl.style.display !== 'none';
      var seasonLive = s1CurrentState() !== 'wrapped';
      psPage.classList.toggle('s1-hero-folded', bandUp && seasonLive);
    }

    // Update hero CTA by era, in priority order. Bug fixed 2026-08-03: this
    // used to key off el.style.display, which under the `?launched=1`
    // preview is meaningless for era PRIORITY — the preview forces every
    // gated section to display (so Dixon can review every era at once),
    // including ones whose data-hide-after has long since passed. That made
    // a retired era (#proseries-intensive, hidden every real day since Jul 11)
    // outrank the live one under preview, so the hero CTA read "FULL OUT
    // Takeover Intensive" weeks after that intensive ended. isEraActuallyLive()
    // below ignores the preview flag entirely and checks real dates only, so
    // priority is correct in both preview and production — the preview still
    // visually shows every section, it just no longer wins the CTA fight.
    //   1. Standing interest era actually open (real dates) → express-interest.
    //   2. Otherwise (pre-launch) → early-access email capture.
    // (The intensive branch was removed 2026-08-03 along with #proseries-intensive.)
    function isEraActuallyLive(el) {
      if (!el) return false;
      var revealAttr = el.dataset.revealAfter;
      var hideAttr = el.dataset.hideAfter;
      var revealed = !revealAttr || dateHasPassed(revealAttr);
      var hidden = !!hideAttr && dateHasPassed(hideAttr);
      return revealed && !hidden;
    }
    // Both destinations are now the on-site form. This block used to hand the
    // hero CTA back to dwd-director.netlify.app at runtime, which silently
    // undid item 1.1 for this one button no matter what the markup said; the
    // else branch pointed at #early-access, retired in item 2.4. What is left
    // is the copy swap, which still earns its keep.
    var heroCta = document.getElementById('ps-hero-cta');
    var interestForm = document.getElementById('proseries-interest');
    if (heroCta) {
      heroCta.href = '#interest';
      heroCta.innerHTML = isEraActuallyLive(interestForm)
        ? 'Express Interest <span class="btn-arrow" aria-hidden="true">&rarr;</span>'
        : 'Tell me about your dancer <span class="btn-arrow" aria-hidden="true">&rarr;</span>';
    }
  };

  // ── SEASON ONE STATE MACHINE (rewritten 2026-08-16) ──
  // Season One is the ProSeries identity for the whole 40-week season, not a
  // two-week costume. Replaces the old binary premiere-window toggler, which
  // had no exit: it dropped the takeover on Aug 25 but left the announce band
  // up forever reading "Premieres August 10", the hero permanently folded, and
  // the sky accents only half-retreated (the .s1-cta-sky / .s1-ep-code rules
  // are class-based in the markup, so they survived the class going away while
  // the heading and track-tab accents reverted to pink). Four dated states now:
  //
  //   premiere    Aug 10 – Aug 24 2026   full midnight takeover
  //   midseason   Aug 25 – Apr 30 2027   sky accents only, normal page ground
  //   finale      May  1 – May 25 2027   takeover returns for the last stretch
  //   wrapped     after May 25 2027      archive tense, sky retires entirely
  //
  // The state lands on <html data-s1-state> — not just #page-proseries — so
  // surfaces outside the ProSeries page (the nav Express Interest CTA, which
  // carries .s1-cta-sky) can scope off it too. That is what makes sky retire
  // cleanly at 'wrapped' instead of stranding sky buttons on a pink page.
  //
  // #page-proseries still gets the .s1-premiere-window class for premiere AND
  // finale. That class is the expensive, heavily-tuned midnight takeover CSS
  // below — reusing it for the finale is deliberate, not a shortcut: the last
  // three weeks of the season earn the same volume as the first two.
  //
  // Preview: ?launched=1 / window.__dwdLaunchPreview forces 'premiere' as
  // before. ?s1state=midseason|finale|wrapped forces any single state so each
  // one can be reviewed without waiting months for the date.
  var S1_PREMIERE_START_MS = new Date('2026-08-10T00:00:00-04:00').getTime();
  var S1_PREMIERE_END_MS   = new Date('2026-08-24T23:59:59-04:00').getTime();
  var S1_FINALE_START_MS   = new Date('2027-05-01T00:00:00-04:00').getTime();
  var S1_SEASON_END_MS     = new Date('2027-05-25T23:59:59-04:00').getTime();
  var S1_STATES = ['premiere', 'midseason', 'finale', 'wrapped'];

  function s1StateOverride() {
    try {
      var q = new URLSearchParams(window.location.search).get('s1state');
      return q && S1_STATES.indexOf(q) !== -1 ? q : null;
    } catch (e) { return null; }
  }

  function s1CurrentState() {
    var forced = s1StateOverride();
    if (forced) return forced;
    if (isLaunchPreview()) return 'premiere';
    var now = Date.now();
    if (now < S1_PREMIERE_START_MS) return null;          // season hasn't opened
    if (now <= S1_PREMIERE_END_MS) return 'premiere';
    if (now < S1_FINALE_START_MS) return 'midseason';
    if (now <= S1_SEASON_END_MS) return 'finale';
    return 'wrapped';
  }

  window.applyS1PremiereWindow = function () {
    var page = document.getElementById('page-proseries');
    var state = s1CurrentState();

    if (state) {
      document.documentElement.setAttribute('data-s1-state', state);
    } else {
      document.documentElement.removeAttribute('data-s1-state');
    }
    if (!page) return;

    // Full takeover volume for the two bookend states only.
    page.classList.toggle('s1-premiere-window', state === 'premiere' || state === 'finale');
  };

  // ── S1 PREMIERE ENTRANCE CUE (added 2026-08-03) ──
  // One-shot: adds .s1-cue to #s1-premiere the first time it's actually
  // visible AND on-screen, which triggers the CSS entrance sequence in
  // season1.css. The band starts display:none behind its data-reveal-after
  // gate (applyProSeriesReveal flips that later, possibly long after this
  // script runs) — IntersectionObserver recalculates whenever the target's
  // box changes for ANY reason, including a display:none -> '' flip driven
  // by another script, so wiring this once at load (no polling) is enough;
  // it also fires correctly the moment ?launched=1 / the preview override
  // reveals the band immediately on page load.
  (function () {
    var s1el = document.getElementById('s1-premiere');
    if (!s1el) return;
    if (!('IntersectionObserver' in window)) {
      s1el.classList.add('s1-cue');
      return;
    }
    var s1io = new IntersectionObserver(function (entries) {
      entries.forEach(function (entry) {
        if (entry.isIntersecting) {
          s1el.classList.add('s1-cue');
          s1io.unobserve(s1el);
        }
      });
    }, { threshold: 0.2 });
    s1io.observe(s1el);
  })();

  // Re-check every 30s so visitors on the page at an era boundary still see it
  // flip within the minute. These are marketing gates, not live event clocks —
  // they don't need a 2s reflow forever. The function is cheap (a few
  // querySelectorAlls + display flips), so polling forever is fine either way.
  setInterval(function () {
    if (typeof window.applyProSeriesReveal === 'function') {
      window.applyProSeriesReveal();
    }
    if (typeof window.applyS1PremiereWindow === 'function') {
      window.applyS1PremiereWindow();
    }
  }, 30000);

  // ── INIT ──
  // Run on page load and hash change
  function initCampaign() {
    var page = document.getElementById('page-campaign');
    if (page && (window.location.hash === '#campaign' || window.location.hash.startsWith('#campaign?'))) {
      initCampaignAuth();
    }
    window.applyProSeriesReveal();
    if (typeof window.applyS1PremiereWindow === 'function') {
      window.applyS1PremiereWindow();
    }
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

/* AUDITION — countdown + sticky ticker dismiss + .ics IIFE deleted 2026-08-03.
   It only ever targeted #audition-wrap, #audition-clock, and .audition-ticker
   (the last of those already gone from index.html before this pass) — all
   permanently retired June 6, 2026 era elements, and eventIsPast() was true
   in production, so initAudition() always short-circuited before the
   countdown/ticker/ICS code paths ran anyway. See git history for prior code. */

/* ============================================================
   SEASON ONE — live countdown to Aug 10, 2026 kickoff.
   Self-contained: no .ics download, no dismissible sticky ticker,
   no localStorage. That machinery belongs to the retired June 6
   audition surfaces above and stays there — this is a fresh,
   minimal clock for the #season-one-cta hero block (A2).
   ============================================================ */
(function () {
  var SEASON_START_MS = new Date('2026-08-10T00:00:00-04:00').getTime();

  function pad2(n) { return n < 10 ? '0' + n : '' + n; }

  function renderSeasonClock() {
    var grids = document.querySelectorAll('[data-season-clock]');
    if (!grids.length) return;
    var diff = SEASON_START_MS - Date.now();
    grids.forEach(function (grid) {
      if (diff <= 0) {
        grid.innerHTML = '<span class="aclk-now">Underway.</span>';
        return;
      }
      var totalSec = Math.floor(diff / 1000);
      var days = Math.floor(totalSec / 86400);
      var hrs  = Math.floor((totalSec % 86400) / 3600);
      var mins = Math.floor((totalSec % 3600) / 60);
      var secs = totalSec % 60;
      function set(sel, val) {
        var el = grid.querySelector(sel);
        if (el) el.textContent = val;
      }
      set('[data-clk-days]', days);
      set('[data-clk-hrs]', pad2(hrs));
      set('[data-clk-mins]', pad2(mins));
      set('[data-clk-secs]', pad2(secs));
    });
  }

  function initSeasonClock() {
    renderSeasonClock();
    setInterval(renderSeasonClock, 1000);
  }

  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', initSeasonClock);
  } else {
    initSeasonClock();
  }
})();
