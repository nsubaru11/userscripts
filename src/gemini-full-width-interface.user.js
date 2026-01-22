// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      3.1.0
// @description  GeminiのUIを最適化します。入力欄の保護、編集モード対応、FOUC対策（アニメーション表示）、SPA遷移対策を完備した安定版です。
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

        /* 読み込み時の位置ズレ（FOUC）を隠すアニメーション */
        @keyframes gemini-slide-in {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }

        ${colorOverrides}

        /* レイアウト: 画面幅の拡張 */
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

        /* ユーザー入力: 右寄せと表示アニメーションの適用 */
        :root body user-query,
        :root body user-query-content,
        :root body [class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            width: 100% !important;
            max-width: 100% !important;
            animation: gemini-slide-in 0.25s ease-out forwards !important;
        }

        /* 編集モード対応: フォーム表示時は左寄せに戻しアニメーションを無効化 */
        :root body user-query:has(form),
        :root body user-query-content:has(form),
        :root body [class*="user-query-container"]:has(form) {
            align-items: flex-start !important;
            animation: none !important;
        }

        :root body user-query form,
        :root body [class*="user-query-container"] form {
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 添付ファイルエリアの調整 */
        :root body user-query-file-carousel {
            align-self: flex-end !important;
            width: auto !important;
            max-width: 100% !important;
        }

        /* ユーザー吹き出し: 形状を維持したまま右寄せ */
        :root body [class*="user-query-bubble"] {
            max-width: 85% !important;
            margin-left: auto !important;
            margin-right: 0 !important;
        }

        /* 吹き出し内テキストの背景透過設定 */
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            background-color: transparent !important;
        }

        /* 操作ボタン（編集・コピー等）の右寄せ */
        :root body [class*="query-content"] {
            display: flex !important;
            width: 100% !important;
            justify-content: flex-end !important;
            margin-top: 4px !important;
        }

        /* フッター（入力エリア）の外枠幅を制限 */
        :root body footer,
        :root body [class*="bottom-container"] {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* 入力ボックス自体の幅を維持（崩れ防止） */
        :root body [class*="input-area"],
        :root body div[role="contentinfo"] > div {
             width: 100% !important;
             max-width: 100% !important;
        }

        :root body pre {
            white-space: pre-wrap !important;
        }
    `;

	// --- 3. スタイル注入と監視 ---
	const styleId = 'gemini-full-width-style-v3';

	function injectStyle() {
		if (document.getElementById(styleId)) return;

		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = layoutCss;

		// headまたはdocumentElementにスタイルを注入（document-start対応）
		(document.head || document.documentElement).appendChild(style);
		console.log('Gemini Full-Width: Style Injected');
	}

	// 初回注入の実行
	injectStyle();

	// SPA遷移やDOM更新によるスタイル削除を監視して再注入
	const observer = new MutationObserver(() => {
		if (!document.getElementById(styleId)) {
			injectStyle();
		}
	});

	observer.observe(document.documentElement, {childList: true, subtree: true});

	// --- 4. メニューコマンド ---
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

	console.log("Gemini Full-Width v3.1.0: Stabilized.");
})();