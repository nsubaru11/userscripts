// ==UserScript==
// @name         ChatGPT Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
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
	const layoutCss = `
        /* --- 幅の拡張 --- */
        /* スレッドコンテンツの最大幅を上書き */
        main [class*="thread-content-max-width"],
        main .mx-auto[class*="max-w-"] {
            --thread-content-max-width: ${config.maxWidth} !important;
            max-width: ${config.maxWidth} !important;
        }

        /* 会話ターンのコンテナ */
        main article > div,
        main article .mx-auto {
            --thread-content-max-width: ${config.maxWidth} !important;
            max-width: ${config.maxWidth} !important;
        }

        /* group/turn-messages コンテナ */
        main [class*="group/turn-messages"] {
            --thread-content-max-width: ${config.maxWidth} !important;
            max-width: ${config.maxWidth} !important;
        }

        /* 入力エリア（コンポーザー） */
        main [class*="composer"],
        main form[class*="mx-auto"],
        main .mb-4.mx-auto {
            --thread-content-max-width: ${config.maxWidth} !important;
            max-width: ${config.maxWidth} !important;
        }

        /* Tailwind の max-w クラスを直接上書き */
        main .max-w-\\(--thread-content-max-width\\),
        main [class*="max-w-(--thread-content-max-width)"] {
            max-width: ${config.maxWidth} !important;
        }

        /* コードブロックの折り返し */
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
