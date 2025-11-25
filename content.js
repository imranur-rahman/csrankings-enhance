// Content script for CSRankings Enhance
// Communicates with pageScript.js (running in MAIN world) via custom events
(function () {
  console.log('csr-enhance: content script loaded');

  let pendingCallbacks = {};

  // -------- UI --------
  function createUI() {
    if (document.getElementById('csr-enhance-root')) return;
    const root = document.createElement('div');
    root.id = 'csr-enhance-root';
    root.className = 'csr-enhance-root';

    const btnRaw = document.createElement('button');
    btnRaw.id = 'csr-btn-raw';
    btnRaw.className = 'csr-enhance-btn';
    btnRaw.textContent = 'authors (raw)';

    const btnAdj = document.createElement('button');
    btnAdj.id = 'csr-btn-adj';
    btnAdj.className = 'csr-enhance-btn';
    btnAdj.textContent = 'authors (adj)';

    const btnReset = document.createElement('button');
    btnReset.id = 'csr-btn-reset';
    btnReset.className = 'csr-enhance-btn';
    btnReset.textContent = 'reset';

    root.appendChild(btnRaw);
    root.appendChild(btnAdj);
    root.appendChild(btnReset);
    document.body.appendChild(root);

    // Overlay
    const overlay = document.createElement('div');
    overlay.id = 'csr-enhance-overlay';
    overlay.className = 'csr-enhance-overlay';
    overlay.innerHTML = '<div id="csr-enhance-panel" class="csr-enhance-panel"><div class="csr-enhance-panel-head">'
      + '<span id="csr-enhance-title"></span><button id="csr-enhance-close" class="csr-enhance-close">✖</button></div>'
      + '<div id="csr-enhance-content" class="csr-enhance-content">Loading...</div></div>';
    document.body.appendChild(overlay);

    document.getElementById('csr-enhance-close').addEventListener('click', () => {
      overlay.style.display = 'none';
      window.dispatchEvent(new CustomEvent('csr-enhance-reset'));
    });

    btnReset.addEventListener('click', () => {
      overlay.style.display = 'none';
      window.dispatchEvent(new CustomEvent('csr-enhance-reset'));
    });

    btnRaw.addEventListener('click', () => {
      console.log('csr-enhance: authors (raw) clicked');
      fetchAndRender(false);
    });
    btnAdj.addEventListener('click', () => {
      console.log('csr-enhance: authors (adj) clicked');
      fetchAndRender(true);
    });
  }

  function fetchAndRender(useAdjusted) {
    const reqId = Math.random().toString(36).slice(2);
    pendingCallbacks[reqId] = function(result) {
      console.log('csr-enhance: got data from page, rows=' + (result.rows ? result.rows.length : 0), result.error || '');
      renderTable(result.rows || [], useAdjusted ? 'Authors (adjusted)' : 'Authors (raw)', useAdjusted, result.error);
    };
    window.dispatchEvent(new CustomEvent('csr-enhance-request', { detail: { useAdjusted: useAdjusted, reqId: reqId } }));
  }

  // Listen for response from pageScript
  window.addEventListener('csr-enhance-response', function(e) {
    const { reqId, result } = e.detail || {};
    if (reqId && pendingCallbacks[reqId]) {
      pendingCallbacks[reqId](result);
      delete pendingCallbacks[reqId];
    }
  });

  function renderTable(rows, title, isAdjusted, errorMsg) {
    const overlay = document.getElementById('csr-enhance-overlay');
    const titleElt = document.getElementById('csr-enhance-title');
    const content = document.getElementById('csr-enhance-content');
    console.log(`csr-enhance: renderTable rows=${rows ? rows.length : 0} title=${title}`);
    titleElt.textContent = title;
    if (errorMsg) {
      content.innerHTML = `<p style="color:red;">${escapeHtml(errorMsg)}</p><p>Make sure the CSRankings page has finished loading and try again.</p>`;
      overlay.style.display = 'block';
      return;
    }
    if (!rows || rows.length === 0) {
      content.innerHTML = '<p>No authors found for the selected areas/years/region.</p>';
      overlay.style.display = 'block';
      return;
    }
    let html = '<div class="csr-enhance-results"><table class="csr-enhance-table"><thead><tr>'
      + '<th>#</th><th>Author</th><th>Affiliation</th><th>Country</th><th>' + (isAdjusted ? 'Adj. Count' : 'Raw Count') + '</th></tr></thead><tbody>';
    let i = 1;
    for (const r of rows) {
      html += `<tr><td>${i}</td><td>${escapeHtml(r.name)}</td><td>${escapeHtml(r.dept || '')}</td><td>${escapeHtml(r.country || '')}</td><td style="text-align:right">${Number.isInteger(r.count) ? r.count : r.count.toFixed(2)}</td></tr>`;
      i++;
    }
    html += '</tbody></table></div>';
    content.innerHTML = html;
    overlay.style.display = 'block';
  }

  function escapeHtml(str) {
    if (!str && str !== 0) return '';
    return String(str).replace(/[&<>"]/g, function (c) {
      return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'}[c];
    });
  }

  // -------- Init --------
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', createUI);
  } else {
    createUI();
  }
})();
