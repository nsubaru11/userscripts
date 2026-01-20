// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.6.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします（余白調整版）。
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

        /* 1. コンテナ設定: 縦並び・右寄せ・隙間詰め */
        /* justify-content: flex-end ではなく normal/flex-start にして引き伸ばしを防止 */
        user-query-content .user-query-container,
        div[class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;  /* 右端に寄せる */
            justify-content: flex-start !important; /* 上下に引き伸ばさず詰める */
            gap: 10px !important; /* ファイルとテキストの間隔を10pxに固定 */
            height: auto !important; /* 高さを中身に合わせる */
            min-height: 0 !important; /* 最小高さをリセット */
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
            margin-left: auto !important; 
            margin-right: 0 !important;
        }

        /* 3. 添付ファイルプレビューの装飾 */
        .file-preview-container,
        user-query-file-carousel {
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            padding: 8px !important;
            width: fit-content !important;
            max-width: 80% !important;
            
            /* 配置とマージンリセット */
            margin: 0 !important; 
            margin-left: auto !important; 
            margin-right: 0 !important;
        }

        /* 4. ボタン類（編集・コピー）の位置調整 */
        .query-content {
            display: flex !important;
            flex-direction: row !important;
            justify-content: flex-end !important;
            align-items: center !important;
            width: 100% !important;
            margin: 0 !important; /* 余計なマージンを削除 */
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

	console.log("Gemini Full-Width Script Applied (v1.6.0 - Compact Gap).");
})();