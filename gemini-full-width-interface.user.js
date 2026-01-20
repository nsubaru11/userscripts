// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.8.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします（ファイル表示修正版）。
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
		width: '95%',
		maxWidth: 'none',
		userBgColor: '#d0ebff'
	};

	const fullWidthCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
            --gemini-user-bg: ${config.userBgColor};
        }

        /* --- 1. 画面幅の拡張 --- */
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

        /* --- 2. ユーザー入力エリアの右寄せレイアウト --- */
        /* 親コンテナを縦並び(Flex-Column)にし、アイテムを右端(flex-end)に寄せる */
        user-query-content .user-query-container,
        div[class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important; /* ここで右寄せを強制 */
            width: 100% !important;
            margin-right: 0 !important;
        }

        /* --- 3. 添付ファイルの装飾 --- */
        /* コンテナ自体には背景をつけず、中身のファイルチップにだけ色をつける */
        .file-preview-container,
        user-query-file-carousel {
            background-color: transparent !important; /* 透明に */
            padding: 0 !important;
            margin: 0 !important;
            width: auto !important;
            max-width: 100% !important;
        }

        /* 実際のファイル表示部分（存在するときのみ描画される要素） */
        .new-file-preview-container,
        user-query-file-preview {
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            padding: 8px !important;
            margin-bottom: 5px !important; /* テキストとの間隔 */
            display: inline-block !important;
        }

        /* --- 4. テキスト吹き出しの装飾 --- */
        .user-query-bubble-with-background,
        span[class*="user-query-bubble-with-background"] {
            background-color: var(--gemini-user-bg) !important;
            color: #0b1c33 !important;
            border-radius: 12px !important;
            text-align: left !important;
            max-width: 80% !important;
            display: inline-block !important;
            
            /* 個別に右寄せ指定（念のため） */
            margin-left: auto !important; 
            margin-right: 0 !important;
        }

        /* --- 5. 入力エリア等の調整 --- */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* テキスト内部の余白 */
        .query-text-line {
            padding: 8px 12px !important;
            background-color: transparent !important;
            margin: 0 !important;
        }
        
        /* 編集ボタン類も右寄せ */
        .query-content {
            display: flex !important;
            justify-content: flex-end !important;
            width: 100% !important;
        }

        pre {
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

	console.log("Gemini Full-Width Script Applied (v1.8.0 - Right Align & No Empty Box).");
})();