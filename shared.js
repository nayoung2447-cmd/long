/* ============================================================
   shared.js  —  도구 목록 · 데이터 저장 · 공통 헤더
   허브(index.html)와 탭(tabs.html)이 아래 TOOLS 하나만 읽습니다.
   새 도구를 만들면 TOOLS 배열에 한 줄만 추가하세요.
   ============================================================ */
window.APP = {
  name: "투자 도구 모음",
  mark: "◈",                  // 앱바 왼쪽 작은 마크
  // ---- 여기에 도구를 등록 (파일은 같은 폴더에 두세요) ----
  TOOLS: [
    { id:"pie1",    name:"포트폴리오_국장", desc:"국장 비중 파이/도넛 — 매입금액·수익률→평가·비중 자동", file:"portfolio_pie.html",    accent:"#c5221f", glyph:"◕" },
    { id:"pieus",   name:"포트폴리오_미장", desc:"미장 비중 파이/도넛 — 매입금액·수익률→평가·비중 자동", file:"portfolio_pie_us.html", accent:"#1f6feb", glyph:"◑" },
    { id:"journal", name:"매매일지", desc:"매매 이유·복기, 실현손익, 종목별 타임라인",                    file:"trade_journal.html", accent:"#c5221f", glyph:"✎" },
    { id:"opinion", name:"투자의견", desc:"미장·국장별 목표가·긍정·부정·비고",                          file:"opinion.html",       accent:"#00838f", glyph:"◎" },
    { id:"rebal",   name:"리밸런싱", desc:"국장·미장 각각 목표 비중 대비 매수·매도 계산",             file:"rebalance.html",     accent:"#188038", glyph:"⇄" },
    { id:"pnl",     name:"양도세계산",   desc:"해외주식 손익·양도세(250만 공제·22%)·손실통산 절세",           file:"pnl_tax.html",       accent:"#8430ce", glyph:"₩" },
  ]
};

/* ------------------------------------------------------------
   Store — 도구 데이터 저장 (자동저장 + JSON 백업/복원)
   • 자동저장: localStorage (호스팅/파일 실행 시 동작.
     ※ claude.ai 미리보기 안에서는 막혀 있어 저장이 안 될 수 있어요.)
   • 백업/복원: JSON 파일 내보내기/불러오기 — 어디서나 동작.
   사용 예)  Store.save("pie1", data)  /  const d = Store.load("pie1", [])
   ------------------------------------------------------------ */
window.Store = {
  ns: "toolkit:",
  save(key, val){ try{ localStorage.setItem(this.ns+key, JSON.stringify(val)); return true; }catch(e){ return false; } },
  load(key, fallback){ try{ const r = localStorage.getItem(this.ns+key); return r==null ? (fallback ?? null) : JSON.parse(r); }catch(e){ return fallback ?? null; } },
  remove(key){ try{ localStorage.removeItem(this.ns+key); }catch(e){} },
  keys(){ try{ return Object.keys(localStorage).filter(k=>k.startsWith(this.ns)).map(k=>k.slice(this.ns.length)); }catch(e){ return []; } },

  // 전체 백업 → JSON 파일 다운로드
  exportAll(filename){
    const data = {};
    this.keys().forEach(k => data[k] = this.load(k));
    _download(JSON.stringify({ _app:"toolkit", _version:1, _ts:new Date().toISOString(), data }, null, 2),
              filename || ("toolkit-backup-" + _today() + ".json"));
  },
  // 한 도구만 백업
  exportOne(key, filename){
    _download(JSON.stringify({ _app:"toolkit", _version:1, _key:key, data:{[key]:this.load(key)} }, null, 2),
              filename || (key + "-" + _today() + ".json"));
  },
  // JSON 파일 불러오기 → 저장 후 콜백 (보통 location.reload())
  importFile(onDone){
    _pickFile(text => {
      try{
        const j = JSON.parse(text);
        if(j && j._app === "toolkit" && j.data){
          Object.entries(j.data).forEach(([k,v]) => this.save(k, v));
          onDone ? onDone(j) : location.reload();
        }else{
          alert("이 백업 파일 형식이 아니에요. (toolkit 백업 JSON을 선택해 주세요)");
        }
      }catch(e){ alert("불러오기 실패: 올바른 JSON 파일이 아닙니다."); }
    });
  }
};
function _download(text, filename){
  try{
    const blob = new Blob([text], {type:"application/json"});
    const url  = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = filename; document.body.appendChild(a); a.click();
    a.remove(); setTimeout(()=>URL.revokeObjectURL(url), 1000);
  }catch(e){ alert("내보내기가 이 환경에서 막혀 있어요. 파일을 다운로드해 브라우저에서 열면 동작합니다."); }
}
function _pickFile(cb){
  const i = document.createElement("input");
  i.type = "file"; i.accept = ".json,application/json";
  i.onchange = () => { const f = i.files[0]; if(!f) return; const r = new FileReader(); r.onload = () => cb(r.result); r.readAsText(f); };
  i.click();
}
function _today(){ return new Date().toISOString().slice(0,10); }

/* ------------------------------------------------------------
   mountAppbar(activeId) — 공통 상단 헤더
   • 도구 페이지에서: mountAppbar("pie1")  → "← 허브" 링크 표시
   • 허브에서:        mountAppbar("hub")
   페이지에 <div id="appbar"></div> 를 두고 호출하세요.
   ------------------------------------------------------------ */
window.mountAppbar = function(activeId){
  const host = document.getElementById("appbar");
  if(!host) return;
  const isHub = activeId === "hub";
  host.className = "appbar";
  host.innerHTML =
    '<div class="appbar-in">' +
      (isHub ? "" : '<a class="back" href="index.html">← 홈</a>') +
      '<span class="brand"><span class="mark">'+ (APP.mark||"·") +'</span>'+ APP.name +'</span>' +
      '<span class="spacer"></span>' +
      '<span class="acts">' +
        '<button class="btn" id="_bkup">백업</button>' +
        '<button class="btn" id="_rstr">복원</button>' +
      '</span>' +
    '</div>';
  host.querySelector("#_bkup").onclick = () => Store.exportAll();
  host.querySelector("#_rstr").onclick = () => Store.importFile();
};
