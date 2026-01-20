// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.5.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします（添付ファイル対応）。
// @author       You
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://gemini.google.com/*
// @run-at       document-idle
// @grant        GM_addStyle
// @noframes
// @icon         https://gemini.google.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/gemini-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/gemini-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	const config = {
		width: '95%',           // 全体の幅
		maxWidth: 'none',       // 最大幅制限
		userBgColor: '#d0ebff'  // 背景色: 少し濃いめの青
	};

	const fullWidthCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
            --gemini-user-bg: ${config.userBgColor};
        }

        /* --- メインレイアウト（全体幅拡張） --- */
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

        /* --- ユーザー入力エリアの右寄せ・装飾 --- */

        /* 1. コンテナ設定: 縦並びにして右端に寄せる */
        /* これにより添付ファイルとテキストが縦に積み重なり、すべて右に寄ります */
        user-query-content .user-query-container,
        div[class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important; /* 縦並びを強制 */
            align-items: flex-end !important;  /* アイテムを右端に寄せる */
            width: 100% !important;
            margin-right: 0 !important;
        }

        /* 2. テキスト吹き出しの装飾 */
        .user-query-bubble-with-background,
        span[class*="user-query-bubble-with-background"] {
            background-color: var(--gemini-user-bg) !important;
            color: #0b1c33 !important;
            border-radius: 12px !important;
            display: inline-block !important;
            text-align: left !important;
            max-width: 80% !important;
            /* Flexアイテムとしての配置調整 */
            margin-left: auto !important; 
            margin-right: 0 !important;
        }

        /* 3. 添付ファイルプレビューの装飾 */
        .file-preview-container,
        user-query-file-carousel {
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            padding: 8px !important;
            margin-bottom: 8px !important; /* テキストとの間隔 */
            width: fit-content !important;
            max-width: 80% !important;
            margin-left: auto !important; /* 右寄せ */
            margin-right: 0 !important;
        }

        /* 4. ボタン類（編集・コピー）の位置調整 */
        /* テキストの左側にボタンが来るように設定 */
        .query-content {
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-end !important;
            align-items: center !important;
            width: 100% !important;
        }

        /* 内部テキストの余白調整 */
        .query-text-line {
            padding: 8px 12px !important;
            background-color: transparent !important;
            margin: 0 !important;
        }

        /* --- 入力エリア（フッター） --- */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* --- その他メッセージエリア --- */
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

	console.log("Gemini Full-Width Script Applied (v1.5.0 - Right Align & File Style).");
})();