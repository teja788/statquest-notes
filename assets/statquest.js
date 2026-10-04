/* StatQuest Notes: progress bar, contents sidebar, mark-as-done, play buttons, arrow-key paging */
(function () {
  // Notes that have a game in the arcade: "folder/file.html" -> [game slug, game title]
  var GAMES = {
    '02-machine-learning/56-gradient-descent-step-by-step.html': ['foggy-valley', 'Foggy Valley'],
    '02-machine-learning/57-stochastic-gradient-descent.html': ['foggy-valley', 'Foggy Valley']
  };

  // "folder/file.html" for any URL, so file:// and http:// share the same keys
  function noteKey(href) {
    var parts = new URL(href, location.href).pathname.split('/');
    return parts.slice(-2).join('/');
  }
  function isDone(k) { try { return localStorage.getItem('sq-done:' + k) === '1'; } catch (e) { return false; } }
  function setDone(k, on) { try { on ? localStorage.setItem('sq-done:' + k, '1') : localStorage.removeItem('sq-done:' + k); } catch (e) {} }

  var key = noteKey(location.href);
  var header = document.querySelector('header.lesson');
  var meta = header && header.querySelector('.meta');
  var isNote = !!document.querySelector('nav.pager') && !!meta;

  if (isNote) {
    // Reading progress bar
    var bar = document.createElement('div');
    bar.id = 'sq-progress';
    document.body.appendChild(bar);
    var onScroll = function () {
      var h = document.documentElement.scrollHeight - innerHeight;
      bar.style.width = (h > 0 ? Math.min(100, 100 * scrollY / h) : 100) + '%';
    };
    addEventListener('scroll', onScroll, { passive: true });
    onScroll();

    // Play button
    var g = GAMES[key];
    if (g) {
      var play = document.createElement('a');
      play.className = 'sq-btn play';
      play.href = '../games/' + g[0] + '.html';
      play.textContent = '🎮 Play: ' + g[1];
      meta.insertBefore(play, meta.children[1] || null);
    }

    // Mark as done
    var done = document.createElement('button');
    done.type = 'button';
    done.className = 'sq-btn';
    var paint = function () {
      var on = isDone(key);
      done.classList.toggle('is-done', on);
      done.textContent = on ? '✓ Done' : 'Mark as done';
      done.setAttribute('aria-pressed', on);
    };
    done.onclick = function () { setDone(key, !isDone(key)); paint(); };
    paint();
    meta.appendChild(done);

    // Contents sidebar (wide screens only, via CSS)
    var heads = [].slice.call(document.querySelectorAll('section[id] > h2'));
    if (heads.length > 2) {
      var toc = document.createElement('nav');
      toc.className = 'sq-toc';
      toc.setAttribute('aria-label', 'On this page');
      toc.innerHTML = '<span class="lbl">On this page</span>';
      heads.forEach(function (h) {
        var a = document.createElement('a');
        a.href = '#' + h.parentNode.id;
        a.textContent = h.textContent;
        toc.appendChild(a);
      });
      document.body.appendChild(toc);
      var links = toc.querySelectorAll('a');
      if ('IntersectionObserver' in window) {
        var io = new IntersectionObserver(function (es) {
          es.forEach(function (e) {
            if (!e.isIntersecting) return;
            links.forEach(function (a) { a.classList.toggle('on', a.hash === '#' + e.target.id); });
          });
        }, { rootMargin: '-30% 0px -60% 0px' });
        heads.forEach(function (h) { io.observe(h.parentNode); });
      }
    }

    // Left and right arrow keys move between notes
    var pager = [].slice.call(document.querySelectorAll('nav.pager a'));
    addEventListener('keydown', function (e) {
      if (e.altKey || e.ctrlKey || e.metaKey || /INPUT|TEXTAREA|SELECT/.test(document.activeElement.tagName)) return;
      var want = e.key === 'ArrowLeft' ? 'Previous' : e.key === 'ArrowRight' ? 'Next' : null;
      if (!want) return;
      var a = pager.filter(function (x) { return x.textContent.indexOf(want) === 0; })[0];
      if (a) location.href = a.href;
    });
  }

  // Index pages: tick finished notes and count them
  var rows = document.querySelectorAll('ol.list li');
  if (rows.length) {
    var n = 0;
    rows.forEach(function (li) {
      var a = li.querySelector('a');
      if (a && isDone(noteKey(a.href))) { li.classList.add('done'); n++; }
    });
    var eb = document.querySelector('header.lesson .eyebrow');
    if (eb) eb.textContent += ' · ' + n + ' done';
  }
})();
