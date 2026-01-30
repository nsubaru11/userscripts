// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      3.3.0
// @description  GeminiのUIを最適化。編集モード時の入力欄を、全称セレクタを用いて強制的に最大化します。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://gemini.google.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @icon         https://gemini.google.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/gemini-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/gemini-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	// --- 1. 初期設定 ---
	const config = {
		width: GM_getValue('width', '95%'),
		maxWidth: GM_getValue('maxWidth', '1200px'),
		useBgColor: GM_getValue('useBgColor', false),
		userBgColor: GM_getValue('userBgColor', '#d0ebff')
	};

	// --- 2. CSS定義 ---
	const colorOverrides = config.useBgColor ? `
        :root body {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }
        :root body[data-theme="dark"] {
            --gemini-user-bg: ${config.userBgColor === '#d0ebff' ? 'rgba(208, 235, 255, 0.2)' : config.userBgColor};
            --gemini-user-text: #e3e3e3;
        }
        :root body[data-theme="light"] {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }
        :root body [class*="user-query-bubble"] {
            background-color: var(--gemini-user-bg) !important;
            color: var(--gemini-user-text) !important;
        }
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            color: inherit !important;
        }
    ` : '';

	const layoutCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
        }

        ${colorOverrides}

        /* --- 幅の拡張 --- */
        :root body [class*="conversation-container"],
        :root body infinite-scroller,
        :root body [class*="infinite-scroller"],
        :root body main [class*="user-content"],
        :root body main [class*="model-content"],
        :root body main [class*="input-area-container"] {
            width: var(--gemini-chat-width) !important;
            max-width: var(--gemini-chat-max-width) !important;
            margin: 0 auto !important;
        }

        /* --- ユーザー入力エリア: 通常時は右寄せ・縦並び --- */
        :root body user-query,
        :root body user-query-content,
        :root body [class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        /* --- 【修正】編集モード (超強力版) --- */

        /* 1. コンテナのFlex設定を「左寄せ・全幅」へ強制リセット */
        :root body user-query:has(textarea),
        :root body user-query-content:has(textarea),
        :root body [class*="user-query-container"]:has(textarea),
        :root body user-query:has(form),
        :root body user-query-content:has(form) {
            align-items: stretch !important; /* 幅いっぱいに伸ばす */
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 2. フォーム内の「すべての要素」を強制的に幅100%にする (総当たり) */
        :root body user-query form *,
        :root body [class*="user-query-container"] form * {
            width: 100% !important;
            max-width: 100% !important;
            box-sizing: border-box !important;
        }

        /* 3. ただし、アイコンやボタンなどの小さな要素がつぶれないように例外設定 */
        :root body user-query form mat-icon,
        :root body user-query form button,
        :root body user-query form .mat-mdc-button-touch-target,
        :root body user-query form .mat-mdc-focus-indicator {
            width: auto !important;
            max-width: none !important;
        }

        /* 4. フォーム自体の配置補正 */
        :root body user-query form {
            display: block !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* 5. テキストエリアの高さ確保とリサイズ許可 */
        :root body textarea.mat-mdc-input-element {
            min-height: 60px !important;
            resize: vertical !important;
        }


        /* --- 添付ファイル (最上部) --- */
        :root body user-query-file-carousel {
            align-self: flex-end !important;
            width: auto !important;
            max-width: 100% !important;
            order: 0 !important;
        }

        /* --- テキストバブル (2番目) --- */
        :root body [class*="user-query-bubble"] {
            display: block !important;
            max-width: 85% !important;
            margin-left: auto !important;
            margin-right: 0 !important;
            margin-bottom: 0 !important;
            order: 1 !important;
        }
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            background-color: transparent !important;
        }

        /* --- ボタンエリア (JSで生成・最下部) --- */
        :root body .gemini-user-actions {
            display: inline-flex !important;
            gap: 4px !important;
            align-items: center !important;
            justify-content: flex-end !important;
            margin-right: 0 !important;
            margin-top: 2px !important;
            opacity: 0.8;
            order: 2 !important; /* バブルの下 */
        }
        :root body .gemini-user-actions:hover {
            opacity: 1;
        }

        /* コンテナの隙間調整 */
        :root body [class*="query-content"]:has([class*="user-query-bubble"]) {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            gap: 2px !important;
            width: 100% !important;
            min-width: 0 !important;
        }

        /* ボタンのスタイル調整 */
        :root body .gemini-user-actions > div {
            margin: 0 !important;
            padding: 0 !important;
            display: flex !important;
        }
        :root body .gemini-user-actions button {
            margin: 0 !important;
            padding: 4px !important;
            width: 32px !important;
            height: 32px !important;
        }
        :root body .gemini-user-actions button mat-icon,
        :root body .gemini-user-actions button span[class*="icon"] {
            font-size: 18px !important;
            width: 18px !important;
            height: 18px !important;
            line-height: 18px !important;
        }

        /* フッター */
        :root body footer,
        :root body [class*="bottom-container"] {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }
        :root body [class*="input-area"],
        :root body div[role="contentinfo"] > div {
             width: 100% !important;
             max-width: 100% !important;
        }
        :root body pre {
            white-space: pre-wrap !important;
        }
    `;

	// --- 3. DOM操作 ---
	const styleId = 'gemini-full-width-style';
	const actionsClass = 'gemini-user-actions';
	let normalizePending = false;

	function normalizeUserQueryActions() {
		if (!document.body) return;

		const queryContents = document.querySelectorAll('user-query-content [class*="query-content"]');
		queryContents.forEach((queryContent) => {
			// 編集モード中は操作しない（安全策）
			if (queryContent.querySelector('form') || queryContent.querySelector('textarea')) return;

			const bubble = queryContent.querySelector(':scope > [class*="user-query-bubble"]');
			if (!bubble) return;

			// ボタンを含む要素を探索
			const buttonWrappers = Array.from(queryContent.querySelectorAll(':scope > div'))
				.filter((wrapper) => {
					return wrapper.querySelector('button') &&
						!wrapper.classList.contains(actionsClass) &&
						!wrapper.className.includes('user-query-bubble');
				});

			if (buttonWrappers.length === 0) return;

			let actions = queryContent.querySelector(`:scope > .${actionsClass}`);
			if (!actions) {
				actions = document.createElement('div');
				actions.className = actionsClass;
			}

			buttonWrappers.forEach((wrapper) => {
				// 安全のためスタイルをリセットして移動
				wrapper.style.opacity = '1';
				wrapper.style.pointerEvents = 'auto';
				wrapper.style.display = 'flex';
				actions.appendChild(wrapper);
			});

			if (actions.parentElement !== queryContent) {
				queryContent.appendChild(actions);
			}
			if (actions.previousSibling !== bubble) {
				bubble.insertAdjacentElement('afterend', actions);
			}
		});
	}

	function scheduleNormalize() {
		if (normalizePending) return;
		normalizePending = true;
		requestAnimationFrame(() => {
			normalizePending = false;
			normalizeUserQueryActions();
		});
	}

	function injectStyle() {
		if (document.getElementById(styleId)) return;
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = layoutCss;
		(document.head || document.documentElement).appendChild(style);
		console.log('Gemini Full-Width: Style Injected');
	}

	// 初回実行
	injectStyle();
	scheduleNormalize();

	// 監視設定
	const observer = new MutationObserver(() => {
		if (!document.getElementById(styleId)) injectStyle();
		scheduleNormalize();
	});

	observer.observe(document.documentElement, {childList: true, subtree: true});

	// --- 4. メニュー ---
	GM_registerMenuCommand(config.useBgColor ? "カスタム背景色をOFF" : "カスタム背景色をON", () => {
		GM_setValue('useBgColor', !config.useBgColor);
		location.reload();
	});

	GM_registerMenuCommand("背景色設定", () => {
		const c = prompt("色を指定 (例: #d0ebff)", config.userBgColor);
		if (c) {
			GM_setValue('userBgColor', c);
			GM_setValue('useBgColor', true);
			location.reload();
		}
	});

	GM_registerMenuCommand("幅設定", () => {
		const w = prompt("幅 (例: 95%)", config.width);
		if (w) {
			GM_setValue('width', w);
			location.reload();
		}
	});

	GM_registerMenuCommand("最大幅設定", () => {
		const m = prompt("最大幅 (例: 1200px)", config.maxWidth);
		if (m) {
			GM_setValue('maxWidth', m);
			location.reload();
		}
	});

	console.log("Gemini Full-Width v3.3.0: Force full-width edit form.");
})();