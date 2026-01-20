// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  Geminiのチャット画面と入力欄を画面幅いっぱいに広げます。
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

(function() {
    'use strict';

    // 適用するCSSスタイル
    const fullWidthCss = `
        /* --- メインチャットエリアの拡張 --- */
        /* 会話コンテナの最大幅制限を解除 */
        .conversation-container,
        infinite-scroller,
        .infinite-scroller,
        main .user-content,
        main .model-content,
        main .input-area-container {
            max-width: 98% !important;
            width: 98% !important;
            margin-left: auto !important;
            margin-right: auto !important;
        }

        /* 個別のメッセージバブルの幅制限を解除 */
        div[class*="message-content"],
        div[class*="text-container"],
        app-user-content,
        app-model-content {
            max-width: 100% !important;
        }

        /* --- 入力エリアの拡張 --- */
        /* 入力ボックス周辺のコンテナ */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             max-width: 98% !important;
        }

        /* コードブロックの横スクロール改善（任意） */
        pre {
            max-width: 100% !important;
            white-space: pre-wrap !important; /* 必要に応じて折り返し */
        }
    `;

    // GM_addStyleが利用可能な場合は使用、なければ手動で注入
    if (typeof GM_addStyle !== 'undefined') {
        GM_addStyle(fullWidthCss);
    } else {
        const style = document.createElement('style');
        style.textContent = fullWidthCss;
        document.head.appendChild(style);
    }

    console.log("Gemini Full-Width Script Applied.");
})();