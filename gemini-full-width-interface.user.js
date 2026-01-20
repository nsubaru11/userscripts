// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.3.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・青背景にします。
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
		userBgColor: '#e3f2fd'  // ユーザー入力の背景色 (薄い青)
	};

	// 適用するCSSスタイル
	const fullWidthCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
            --gemini-user-bg: ${config.userBgColor};
        }

        /* --- メインチャットエリアの全体配置 --- */
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

        /* --- ユーザー入力 (query-text-line) の右寄せ調整 --- */
        /* 指定のクラスと、その親コンテナを右寄せ・幅最大化 */
        .query-text-line,
        .user-content,
        app-user-content {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
            margin-left: auto !important;  /* 左側のマージンを自動にして右へ押しやる */
            margin-right: 0 !important;
            text-align: right !important;   /* テキストを右揃え */
        }

        /* ユーザー入力のテキスト部分に背景色をつける */
        .query-text-line {
            background-color: var(--gemini-user-bg) !important;
            padding: 15px !important;
            border-radius: 8px !important;
            box-sizing: border-box !important;
            color: #1f1f1f !important;
        }

        /* Flexコンテナの方向を右寄せ（flex-end）に強制 */
        div[class*="user-query-container"],
        .user-query-container {
             justify-content: flex-end !important;
             margin-right: 0 !important;
        }

        /* --- 入力エリア（フッター）の拡張 --- */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* --- その他コンテンツの幅調整 --- */
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

	// CSSの適用
	if (typeof GM_addStyle !== 'undefined') {
		GM_addStyle(fullWidthCss);
	} else {
		const style = document.createElement('style');
		style.textContent = fullWidthCss;
		document.head.appendChild(style);
	}

	console.log("Gemini Full-Width Script Applied (User Right & Blue).");
})();