// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.4.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします。
// @author       You
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://gemini.google.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// @icon         https://gemini.google.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/gemini-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/gemini-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	const config = {
		width: '95%',           // 全体の幅
		maxWidth: 'none',       // 最大幅制限
		userBgColor: '#d0ebff'  // 背景色: 少し濃いめの青 (前回は #e3f2fd)
	};

	const fullWidthCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
            --gemini-user-bg: ${config.userBgColor};
        }

        /* --- メインレイアウト --- */
        .conversation-container,
        infinite-scroller,
        .infinite-scroller,
        main .user-content,
        main .model-content,
        main .input-area-container {
            width: var(--gemini-chat-width) !important;
            max-width: var(--gemini-chat-max-width) !important;
            margin: 0 auto !important;
        }

        /* --- ユーザー入力 (右寄せ・青背景) の強力な適用 --- */
        
        /* 1. コンテナレベルで右寄せを強制 */
        .user-query-container,
        div[class*="user-query-container"],
        app-user-content {
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-end !important; /* 右端に寄せる */
            width: 100% !important;
            margin-right: 0 !important;
            padding-right: 0 !important;
        }

        /* 2. バブル本体 (ご指摘のクラス) の装飾と配置 */
        .user-query-bubble-with-background,
        span[class*="user-query-bubble-with-background"] {
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            margin-left: auto !important;   /* 左側を余白で埋めて右へ */
            margin-right: 0 !important;
            display: inline-block !important; /* 幅をコンテンツに合わせる */
            max-width: 80% !important;      /* さすがに画面全幅だと読みづらいので制限 */
            text-align: left !important;    /* バブル内の文章は左揃えが自然 */
            color: #0b1c33 !important;      /* 文字色を濃くしてコントラスト確保 */
        }

        /* 3. 内部テキストの余白調整 */
        .query-text-line {
            padding: 8px 12px !important;
            background-color: transparent !important; /* 親の色を使うため透明に */
            margin: 0 !important;
        }

        /* --- 入力エリア --- */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* --- その他 --- */
        div[class*="message-content"],
        div[class*="text-container"],
        app-model-content {
            max-width: 100% !important;
        }
        pre {
            max-width: 100% !important;
            white-space: pre-wrap !important;
        }
    `;

	if (typeof GM_addStyle !== 'undefined') {
		GM_addStyle(fullWidthCss);
	} else {
		const style = document.createElement('style');
		style.textContent = fullWidthCss;
		document.head.appendChild(style);
	}

	console.log("Gemini Full-Width Script Applied (v1.4.0).");
})();