// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.7.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします（最小構成版）。
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

        /* --- 2. ユーザー入力の右寄せ --- */
        /* コンテナの並び順（Flex/Block）や余白（Gap）はいじらず、
           中身（テキスト・ファイル）のマージン左側を自動にして右へ押しやる */
        
        /* テキストの吹き出し */
        .user-query-bubble-with-background,
        span[class*="user-query-bubble-with-background"] {
            margin-left: auto !important; 
            margin-right: 0 !important;
            
            /* 装飾 */
            background-color: var(--gemini-user-bg) !important;
            color: #0b1c33 !important;
            border-radius: 12px !important;
            text-align: left !important;
            max-width: 80% !important;
            display: inline-block !important; /* 幅を中身に合わせる */
        }

        /* 添付ファイルエリア */
        .file-preview-container,
        user-query-file-carousel {
            margin-left: auto !important;
            margin-right: 0 !important;

            /* 装飾 */
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            padding: 8px !important;
            width: fit-content !important;
            max-width: 80% !important;
        }

        /* --- 3. その他調整 --- */
        /* 入力エリア（フッター）の幅合わせ */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* テキスト内部の余白調整 */
        .query-text-line {
            padding: 8px 12px !important;
            background-color: transparent !important;
            margin: 0 !important;
        }
        
        /* 編集・コピーボタン群も右へ */
        .query-content {
            justify-content: flex-end !important;
        }

        /* コードブロックの折り返し */
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

	console.log("Gemini Full-Width Script Applied (v1.7.0 - Minimalist).");
})();