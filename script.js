(function () {
    var root = document.documentElement;
    root.classList.add('js');
    var reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Theme colour: a palette button (bottom left) on every page. The visitor's pick is kept in
    // their browser; on a light colour the text on buttons turns dark so it stays readable.
    var COLOURS = [['#22d3ee', 'Sky'], ['#8b5cf6', 'Purple'], ['#ff5a1f', 'Orange'], ['#14b8a6', 'Teal'],
                   ['#3b82f6', 'Blue'], ['#22c55e', 'Green'], ['#f5b301', 'Gold'], ['#ec4899', 'Pink']];
    var DEFAULT_COLOUR = COLOURS[0][0];
    function isLight(hex) {
        var c = [1, 3, 5].map(function (i) {
            var v = parseInt(hex.substr(i, 2), 16) / 255;
            return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4);
        });
        return .2126 * c[0] + .7152 * c[1] + .0722 * c[2] > .35;
    }
    function setColour(hex) {
        root.style.setProperty('--accent', hex);
        root.style.setProperty('--on-accent', isLight(hex) ? '#1c1b21' : '#fff');
        var meta = document.querySelector('meta[name="theme-color"]');
        if (meta) meta.setAttribute('content', hex === DEFAULT_COLOUR ? '#1c1b21' : hex);
    }
    var saved = null;
    try { saved = localStorage.getItem('accent'); } catch (e) {}
    if (!saved || !COLOURS.some(function (c) { return c[0] === saved; })) saved = DEFAULT_COLOUR;
    setColour(saved);

    var theme = document.createElement('div');
    theme.className = 'theme';
    theme.innerHTML = '<div class="theme-panel" id="theme-panel" hidden><p>Theme colour</p><div class="theme-swatches"></div></div>' +
        '<button type="button" class="theme-btn" aria-expanded="false" aria-controls="theme-panel" aria-label="Change the theme colour">' +
        '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M12 2a10 10 0 0 0 0 20c1.1 0 2-.9 2-2 0-.5-.2-1-.5-1.3-.3-.4-.5-.8-.5-1.3 0-1.1.9-2 2-2h2.4A5.6 5.6 0 0 0 22 9.8C22 5.5 17.5 2 12 2Zm-5.5 10a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3-4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm5 0a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Zm3 4a1.5 1.5 0 1 1 0-3 1.5 1.5 0 0 1 0 3Z"/></svg></button>';
    document.body.appendChild(theme);
    var themeBtn = theme.querySelector('.theme-btn'), themePanel = theme.querySelector('.theme-panel');
    var swatches = theme.querySelector('.theme-swatches');
    COLOURS.forEach(function (c) {
        var b = document.createElement('button');
        b.type = 'button';
        b.className = 'swatch';
        b.style.setProperty('--sw', c[0]);
        b.style.setProperty('--tick', isLight(c[0]) ? '#1c1b21' : '#fff');
        b.setAttribute('aria-label', c[1]);
        b.setAttribute('aria-pressed', c[0] === saved);
        b.addEventListener('click', function () {
            setColour(c[0]);
            try { localStorage.setItem('accent', c[0]); } catch (e) {}
            swatches.querySelectorAll('.swatch').forEach(function (x) { x.setAttribute('aria-pressed', x === b); });
        });
        swatches.appendChild(b);
    });
    function setPanel(open) { themePanel.hidden = !open; themeBtn.setAttribute('aria-expanded', open); }
    themeBtn.addEventListener('click', function () { setPanel(themePanel.hidden); });
    document.addEventListener('click', function (e) { if (!theme.contains(e.target)) setPanel(false); });
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape') setPanel(false); });

    // Phone menu: open / close, and close after a link is tapped.
    var toggle = document.querySelector('.nav-toggle');
    var links = document.getElementById('nav-links');
    function setMenu(open) {
        links.classList.toggle('is-open', open);
        toggle.setAttribute('aria-expanded', open);
        toggle.setAttribute('aria-label', open ? 'Close menu' : 'Open menu');
    }
    toggle.addEventListener('click', function () { setMenu(!links.classList.contains('is-open')); });
    links.addEventListener('click', function (e) { if (e.target.tagName === 'A') setMenu(false); });

    // "I build ..." - the kinds of systems from the resume, one after another.
    var words = ['CRM systems', 'HR platforms', 'inspection workflows', 'donation platforms', 'REST APIs'];
    var word = document.querySelector('.rotator-word');
    if (word && !reduceMotion) {
        var w = 0;
        setInterval(function () {
            word.classList.add('is-out');
            setTimeout(function () {
                w = (w + 1) % words.length;
                word.textContent = words[w];
                word.classList.remove('is-out');
            }, 300);
        }, 2400);
    }

    // How long at each job, counting both the first and the last month ("Present" = this month).
    var now = new Date();
    document.querySelectorAll('.xp-dur').forEach(function (el) {
        var from = el.dataset.from.split('-'), to = el.dataset.to ? el.dataset.to.split('-') : [now.getFullYear(), now.getMonth() + 1];
        var months = (to[0] - from[0]) * 12 + (to[1] - from[1]) + 1;
        if (months < 1) return;
        var y = Math.floor(months / 12), m = months % 12, parts = [];
        if (y) parts.push(y + (y === 1 ? ' yr' : ' yrs'));
        if (m) parts.push(m + (m === 1 ? ' mo' : ' mos'));
        el.textContent = parts.join(' ');
    });

    // "Show 3 more" on a long job.
    document.querySelectorAll('.more-btn').forEach(function (btn) {
        var label = btn.textContent;
        btn.addEventListener('click', function () {
            var open = btn.closest('.xp-card').classList.toggle('is-open');
            btn.setAttribute('aria-expanded', open);
            btn.textContent = open ? 'Show less' : label;
        });
    });

    // Work: one project at a time, with ← → buttons and the arrow keys.
    var slider = document.querySelector('.slider');
    var showSlide = function () {};
    if (slider) {
        var slides = slider.querySelectorAll('.slide');
        var count = slider.querySelector('.slider-count');
        var at = 0;
        slider.classList.add('js-slider');
        showSlide = function (i) {
            at = (i + slides.length) % slides.length;
            slides.forEach(function (s, k) { s.classList.toggle('is-active', k === at); });
            count.textContent = String(at + 1).padStart(2, '0') + ' / ' + String(slides.length).padStart(2, '0');
        };
        slider.querySelector('.prev').addEventListener('click', function () { showSlide(at - 1); });
        slider.querySelector('.next').addEventListener('click', function () { showSlide(at + 1); });
        document.addEventListener('keydown', function (e) {
            if (slider.closest('[data-tab]').hidden || /INPUT|TEXTAREA/.test(document.activeElement.tagName)) return;
            if (e.key === 'ArrowRight') showSlide(at + 1);
            if (e.key === 'ArrowLeft') showSlide(at - 1);
        });
        showSlide(0);
    }

    // Tabs: one page at a time, picked by the address, so links and Back work.
    // #experience, #education, #skills and #about are the Resume tab's own panels; #projects is Work.
    var sections = document.querySelectorAll('main [data-tab]');
    var navLinks = document.querySelectorAll('#nav-links a, .footer-links a');
    var panels = document.querySelectorAll('.panel[data-panel]');
    var panelLinks = document.querySelectorAll('.resume-tabs a');
    var tabOf = { projects: 'work' };
    panels.forEach(function (p) { tabOf[p.dataset.panel] = 'resume'; });
    var tabs = {};
    sections.forEach(function (s) { tabs[s.dataset.tab] = true; });
    var current = null, currentPanel = null;
    var main = document.querySelector('main');

    function showPanel(name) {
        panels.forEach(function (p) { p.hidden = p.dataset.panel !== name; });
        panelLinks.forEach(function (a) {
            var on = a.dataset.panel === name;
            a.classList.toggle('is-active', on);
            a.setAttribute('aria-selected', on);
        });
        currentPanel = name;
    }

    function showTab() {
        var id = location.hash.slice(1) || 'home';
        var tab = tabOf[id] || id;
        if (!tabs[tab]) return;
        var changed = tab !== current;
        current = tab;
        sections.forEach(function (s) { s.hidden = s.dataset.tab !== tab; });
        navLinks.forEach(function (a) {
            var on = a.getAttribute('href') === '#' + tab && !a.classList.contains('nav-cta');
            a.classList.toggle('is-active', on);
            if (on) a.setAttribute('aria-current', 'page'); else a.removeAttribute('aria-current');
        });
        if (tab === 'resume') {
            var panel = tabOf[id] === 'resume' ? id : (currentPanel || 'experience');
            if (panel !== currentPanel || changed) {
                showPanel(panel);
                if (!changed && window.matchMedia('(max-width: 959px)').matches) document.getElementById(panel).scrollIntoView();
            }
        }
        if (changed) {
            window.scrollTo(0, 0);
            main.classList.remove('tab-in');
            void main.offsetWidth;
            main.classList.add('tab-in');
        }
    }

    if (sections.length) {
        root.classList.add('js-tabs');
        if ('scrollRestoration' in history) history.scrollRestoration = 'manual';
        window.addEventListener('hashchange', showTab);
        showTab();
        // Opened at index.html#work: the browser jumps to where that part was before the
        // other tabs were hidden - start from the top instead.
        window.addEventListener('load', function () { setTimeout(function () { window.scrollTo(0, 0); }, 0); });
    }

    // Case study pages: sections slide in once, as they come into view.
    var reveals = document.querySelectorAll('.reveal');
    if ('IntersectionObserver' in window && !reduceMotion) {
        var seen = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (!entry.isIntersecting) return;
                entry.target.classList.add('is-in');
                seen.unobserve(entry.target);
            });
        }, { rootMargin: '0px 0px -8% 0px' });
        reveals.forEach(function (el) { seen.observe(el); });
    } else {
        reveals.forEach(function (el) { el.classList.add('is-in'); });
    }

    // Header line once the page is scrolled.
    var header = document.querySelector('.site-header');
    function onScroll() { header.classList.toggle('is-scrolled', window.scrollY > 8); }
    window.addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    document.getElementById('year').textContent = new Date().getFullYear();
})();
