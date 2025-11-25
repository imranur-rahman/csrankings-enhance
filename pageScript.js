// Runs in page context (MAIN world) to access window.csr
(function() {
  console.log('csr-enhance: pageScript loaded');

  window.addEventListener('csr-enhance-request', function(e) {
    var useAdjusted = e.detail && e.detail.useAdjusted;
    var reqId = e.detail && e.detail.reqId;
    var result;
    try {
      var csr = window.csr || (window.CSRankings && window.CSRankings.getInstance && window.CSRankings.getInstance());
      if (!csr || !csr.authors || csr.authors.length === 0) {
        result = { error: 'csr.authors not ready', rows: [] };
      } else {
        // read weights
        var weights = {};
        if (typeof csr.updateWeights === 'function') {
          csr.updateWeights(weights);
        } else {
          document.querySelectorAll('input[type=checkbox]').forEach(function(cb) {
            var name = cb.getAttribute('name');
            if (name) weights[name] = cb.checked ? 1 : 0;
          });
        }
        // year range
        var fromSel = document.querySelector('#fromyear');
        var toSel = document.querySelector('#toyear');
        var startYear = fromSel ? parseInt(fromSel.value) : null;
        var endYear = toSel ? parseInt(toSel.value) : null;
        // region
        var regionSel = document.querySelector('#regions');
        var whichRegions = regionSel ? String(regionSel.value) : 'world';
        var map = {};
        for (var i = 0; i < csr.authors.length; i++) {
          var rec = csr.authors[i];
          if (!rec) continue;
          var area = rec.area;
          if (!(area in weights) || weights[area] === 0) continue;
          var y = parseInt(rec.year);
          if ((startYear && y < startYear) || (endYear && y > endYear)) continue;
          // region check
          if (whichRegions && whichRegions !== 'world') {
            if (typeof csr.inRegion === 'function') {
              if (!csr.inRegion(rec.dept, whichRegions)) continue;
            } else if (csr.countryAbbrv) {
              var abbr = csr.countryAbbrv[rec.dept];
              if (abbr !== whichRegions && csr.countryInfo && csr.countryInfo[rec.dept] !== whichRegions) continue;
            }
          }
          var name = rec.name;
          var count = useAdjusted ? parseFloat(rec.adjustedcount || 0) : parseInt(rec.count || 0);
          if (isNaN(count)) count = 0;
          if (!(name in map)) {
            var country = '';
            if (csr.countryAbbrv && rec.dept in csr.countryAbbrv) country = csr.countryAbbrv[rec.dept];
            map[name] = { name: name, dept: rec.dept || '', country: country, count: 0 };
          }
          map[name].count += count;
        }
        var arr = [];
        for (var k in map) arr.push(map[k]);
        arr.sort(function(a, b) {
          if (b.count !== a.count) return b.count - a.count;
          return a.name.localeCompare(b.name);
        });
        result = { rows: arr };
      }
    } catch (ex) {
      result = { error: ex.toString(), rows: [] };
    }
    window.dispatchEvent(new CustomEvent('csr-enhance-response', { detail: { reqId: reqId, result: result } }));
  });

  window.addEventListener('csr-enhance-reset', function() {
    try {
      var csr = window.csr || (window.CSRankings && window.CSRankings.getInstance && window.CSRankings.getInstance());
      if (csr && typeof csr.rank === 'function') csr.rank();
    } catch(e) {}
  });
})();
