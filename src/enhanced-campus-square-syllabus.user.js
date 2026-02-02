// ==UserScript==
// @name         Enhanced CampusSquare Syllabus
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.1.0
// @description  検索に便利な週間カレンダーを表示します。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://kmags.wakayama-u.ac.jp/campusweb/*
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// @icon         https://kmags.wakayama-u.ac.jp/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/enhanced-campus-square-syllabus.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/enhanced-campus-square-syllabus.user.js
// ==/UserScript==

(function () {
	'use strict';

	const CALENDAR_ID = 'my-custom-filter-cal';
	const HIGHLIGHT_CLASS = 'my-custom-filter-cal-active';

	function isSyllabusTabActive() {
		const tab = document.querySelector('#tab-sb');
		return !!(tab && tab.classList.contains('tabcell-sel'));
	}

	// =========================================================================
	// 1. 大型カレンダー生成 (マージン追加)
	// =========================================================================
	function createBigCalendar() {
		const container = document.createElement('div');
		container.id = CALENDAR_ID;

		// コンテナのスタイル
		Object.assign(container.style, {
			margin: "5px",
			padding: "15px",
			backgroundColor: "#f0f8ff",
			border: "1px solid #cce5ff",
			borderRadius: "8px",
			overflowY: "auto",
			maxHeight: "85vh",
			boxShadow: "0 2px 5px rgba(0,0,0,0.1)"
		});

		// タイトル
		const title = document.createElement('h3');
		title.innerText = "📅 時間割検索";
		Object.assign(title.style, {
			margin: "0 0 15px 0",
			fontSize: "18px",
			fontWeight: "bold",
			textAlign: "center",
			color: "#0056b3"
		});
		container.appendChild(title);

		const table = document.createElement('table');
		Object.assign(table.style, {
			borderCollapse: "collapse",
			width: "100%",
			textAlign: "center",
			backgroundColor: "#fff",
			fontSize: "16px"
		});

		// データ定義
		const days = [
			{label: "月", value: "1"},
			{label: "火", value: "2"},
			{label: "水", value: "3"},
			{label: "木", value: "4"},
			{label: "金", value: "5"},
			{label: "土", value: "6"}
		];
		const periods = [1, 2, 3, 4, 5, 6, 7];

		// --- ヘッダー行（曜日） ---
		const thead = document.createElement('tr');
		const emptyTh = document.createElement('th');
		Object.assign(emptyTh.style, {
			backgroundColor: "#e9ecef",
			position: "sticky", top: "0", zIndex: "10",
			padding: "8px", border: "1px solid #dee2e6"
		});
		thead.appendChild(emptyTh);

		days.forEach(d => {
			const th = document.createElement('th');
			th.innerText = d.label;
			Object.assign(th.style, {
				padding: "10px 2px",
				backgroundColor: "#e9ecef",
				border: "1px solid #dee2e6",
				position: "sticky", top: "0", zIndex: "10",
				minWidth: "35px"
			});
			thead.appendChild(th);
		});
		table.appendChild(thead);

		// --- データ行（時限） ---
		periods.forEach(p => {
			const tr = document.createElement('tr');

			// 時限見出し
			const th = document.createElement('th');
			th.innerText = p;
			Object.assign(th.style, {
				padding: "8px",
				backgroundColor: "#e9ecef",
				border: "1px solid #dee2e6",
				fontWeight: "bold"
			});
			tr.appendChild(th);

			// 各セル
			days.forEach(d => {
				const td = document.createElement('td');
				td.innerText = "🔍";
				td.title = `${d.label}曜 ${p}限 を検索`;
				Object.assign(td.style, {
					border: "1px solid #dee2e6",
					cursor: "pointer",
					height: "50px",
					fontSize: "18px"
				});

				// ホバーエフェクト
				td.onmouseover = () => {
					td.style.backgroundColor = "#cce5ff";
				};
				td.onmouseout = () => {
					td.style.backgroundColor = "#fff";
				};

				// クリック動作
				td.onclick = () => {
					executeFilter(d.value, p.toString());
					const allTds = container.querySelectorAll('td');
					allTds.forEach(c => {
						c.style.backgroundColor = '#fff';
						c.classList.remove(HIGHLIGHT_CLASS);
					});
					td.style.backgroundColor = '#b3d9ff';
					td.classList.add(HIGHLIGHT_CLASS);
					td.onmouseout = () => {
						td.style.backgroundColor = '#b3d9ff';
					};
				};

				tr.appendChild(td);
			});
			table.appendChild(tr);
		});

		container.appendChild(table);

		// リセットボタン
		const resetBtn = document.createElement('button');
		resetBtn.innerText = "条件クリア";
		Object.assign(resetBtn.style, {
			width: "100%", marginTop: "15px", padding: "10px",
			backgroundColor: "#6c757d", color: "white",
			border: "none", borderRadius: "6px", cursor: "pointer",
			fontSize: "16px", fontWeight: "bold"
		});
		resetBtn.onclick = () => {
			executeFilter('', '');
			const allTds = container.querySelectorAll('td');
			allTds.forEach(c => {
				c.style.backgroundColor = '#fff';
				c.classList.remove(HIGHLIGHT_CLASS);
			});
		};
		container.appendChild(resetBtn);

		return container;
	}

	// =========================================================================
	// 2. フィルタ実行ロジック
	// =========================================================================
	function executeFilter(yobiVal, jigenVal) {
		const iframes = document.querySelectorAll('iframe');
		iframes.forEach(iframe => {
			try {
				if (iframe.contentWindow && iframe.contentWindow.document) {
					const doc = iframe.contentWindow.document;
					const yobi = doc.getElementById('yobi');
					const jigen = doc.getElementById('jigen');

					let searchBtn = doc.querySelector('input[value*="検索開始"]');
					if (!searchBtn) searchBtn = doc.querySelector('input[type="button"][onclick*="search"]');

					if (yobi && jigen) {
						yobi.value = yobiVal;
						jigen.value = jigenVal;
						if (searchBtn) searchBtn.click();
					}
				}
			} catch (e) {
				// cross-origin iframe
			}
		});
	}

	// =========================================================================
	// 3. レイアウト制御 (左は無視、右だけ置換、中央拡大)
	// =========================================================================
	function updateLayout() {
		if (!isSyllabusTabActive()) return;
		const allTds = document.querySelectorAll('td');

		allTds.forEach(td => {
			const text = td.innerText || "";

			// ■ 右カラムの特定と置換
			// 「各種申請」「Myリンク」「アンケート」がある場所（かつ左カラムでない）
			if ((text.includes("各種申請ポートレット") || text.includes("Myリンク") || text.includes("アンケート"))
				&& !text.includes("MYスケジュール")
				&& td.offsetWidth < window.innerWidth * 0.4) {

				// まだカレンダーになっていなければ置換実行
				if (!td.querySelector(`#${CALENDAR_ID}`)) {
					td.innerHTML = ''; // 中身を消去
					td.appendChild(createBigCalendar());

					// 右カラムの幅設定
					td.style.display = 'table-cell';
					td.style.width = '320px';
					td.style.minWidth = '320px';
					td.style.verticalAlign = 'top';
					td.style.backgroundColor = '#fff';
				}
			}

			// ■ 中央カラム（シラバス）の拡大
			// iframeを持っているセルは、幅制限をかけずに広げる
			if (td.querySelector('iframe')) {
				// 自動幅調整に任せる
				// td.style.width = 'auto';
			}
		});
	}

	// =========================================================================
	// 4. iframe高さ調整 & 幅制限解除
	// =========================================================================
	function adjustIframe() {
		if (!isSyllabusTabActive()) return;
		// 幅固定の解除
		const tabs = document.getElementById('tabs');
		if (tabs) tabs.setAttribute('style', 'padding: 5px; width: 100% !important; box-sizing: border-box;');

		// 高さ自動調整
		const iframes = document.querySelectorAll('iframe');
		iframes.forEach(iframe => {
			try {
				if (iframe.contentWindow && iframe.contentWindow.document) {
					const h = iframe.contentWindow.document.body.scrollHeight;
					if (h > 100 && Math.abs(iframe.offsetHeight - h) > 30) {
						iframe.style.height = (h + 30) + 'px';
					}
				}
			} catch (e) {
				// cross-origin iframe
			}
		});
	}

	// =========================================================================
	// メインループ
	// =========================================================================
	function main() {
		if (!isSyllabusTabActive()) return;
		updateLayout();
		adjustIframe();
	}

	let scheduled = false;
	function scheduleMain() {
		if (scheduled) return;
		scheduled = true;
		requestAnimationFrame(() => {
			scheduled = false;
			main();
		});
	}

	window.addEventListener('load', main);
	setInterval(adjustIframe, 1200);

	const observer = new MutationObserver(() => scheduleMain());
	try {
		observer.observe(document.body || document.documentElement, {childList: true, subtree: true});
	} catch (e) {
		// ignore
	}

	// CSS補正
	GM_addStyle(`
        #jikanwariSearchForm table { width: 100% !important; }
        iframe { overflow: hidden !important; width: 100% !important; }
        #${CALENDAR_ID} td.${HIGHLIGHT_CLASS} { background-color: #b3d9ff !important; }
    `);

})();
