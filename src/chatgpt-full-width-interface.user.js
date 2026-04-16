// ==UserScript==
// @name         ChatGPT Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.2.0
// @description  ChatGPTのUIを最適化。チャットエリアの横幅を広げます。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://chat.openai.com/*
// @match        https://chatgpt.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @icon         https://chat.openai.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/chatgpt-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/chatgpt-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	// --- 1. 初期設定 ---
	const config = {
		maxWidth: GM_getValue('maxWidth', '90rem')
	};

	// --- 2. CSS定義 ---
	// ChatGPTは --thread-content-max-width CSS変数で幅を制御している
	// デフォルト: 40rem, 大画面(@w-lg/main): 48rem
	const layoutCss = /* language=CSS */ `
		/* =========================
		   中央寄せ（コンテンツのみ）
		   ========================= */
		main [class*="thread-content-max-width"],
		main article > div,
		main [class*="group/turn-messages"] {
			margin-left: auto !important;
			margin-right: auto !important;
		}

		/* =========================
		   幅の拡張（コンテンツのみ）
		   ========================= */
		main [class*="thread-content-max-width"],
		main .mx-auto[class*="max-w-"] {
			--thread-content-max-width: ${config.maxWidth} !important;
			max-width: ${config.maxWidth} !important;
		}

		main article > div,
		main article .mx-auto {
			--thread-content-max-width: ${config.maxWidth} !important;
			max-width: ${config.maxWidth} !important;
		}

		main [class*="group/turn-messages"] {
			--thread-content-max-width: ${config.maxWidth} !important;
			max-width: ${config.maxWidth} !important;
		}

		/* Tailwindの変数ベースmax-width上書き */
		main .max-w-\\(--thread-content-max-width\\),
		main [class*="max-w-(--thread-content-max-width)"] {
			max-width: ${config.maxWidth} !important;
		}

		/* =========================
		   入力欄（安全制御）
		   ========================= */

		/* コンテナのみ中央寄せ（幅は触らない） */
		/* 入力欄コンテナの幅制御 */
		main form {
			width: clamp(640px, 90vw, 1200px) !important;
			margin-left: auto !important;
			margin-right: auto !important;
		}

		/* 念のため内部も追従 */
		main form textarea {
			width: 100% !important;
			text-align: left !important;
		}

		/* =========================
		   コードブロック
		   ========================= */
		pre {
			white-space: pre-wrap !important;
		}
	`;

	// --- 3. DOM操作 ---
	const styleId = 'chatgpt-full-width-style';

	function injectStyle() {
		if (document.getElementById(styleId)) return;
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = layoutCss;
		(document.head || document.documentElement).appendChild(style);
		console.log('ChatGPT Full-Width: Style Injected');
	}

	// 初回実行
	injectStyle();

	// 監視設定（SPAのため、スタイルが消えた場合に再注入）
	const observer = new MutationObserver(() => {
		if (!document.getElementById(styleId)) injectStyle();
	});

	observer.observe(document.documentElement, {childList: true, subtree: true});

	// --- 4. メニュー ---
	GM_registerMenuCommand("最大幅設定", () => {
		const m = prompt("最大幅 (例: 90rem, 1200px, 95%)", config.maxWidth);
		if (m) {
			GM_setValue('maxWidth', m);
			location.reload();
		}
	});

	console.log("ChatGPT Full-Width v1.1.0: Initialized.");
})();
