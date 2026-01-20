// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.9.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せ・濃い青背景にします（配置・描画修正版）。
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

        /* --- 2. ユーザー入力エリアのレイアウト（右寄せ固定） --- */
        
        /* 親要素の幅を強制的に100%にする（ここが狭いと中央に寄って見える） */
        user-query,
        user-query-content,
        .user-query-container {
            display: block !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 実際のコンテンツを含むコンテナをFlex化し、右端(flex-end)に寄せる */
        user-query-content > div.user-query-container {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important; /* これで子要素全てが右端へ */
            width: 100% !important;
            margin: 0 !important;
            padding: 0 !important;
        }

        /* --- 3. 添付ファイルエリアの修正 --- */
        /* コンテナ自体は透明・余白なしにする（ファイルが無い時に消えるように） */
        .file-preview-container,
        user-query-file-carousel {
            background: none !important;
            border: none !important;
            margin: 0 !important;
            padding: 0 !important;
            width: auto !important;
            max-width: 100% !important;
            align-self: flex-end !important; /* 右寄せ */
        }

        /* 実際にファイルがある場合の中身（チップ）だけに色を付ける */
        .new-file-preview-container,
        user-query-file-preview .file-preview-container,
        .preview-image-button {
            background-color: var(--gemini-user-bg) !important;
            border-radius: 12px !important;
            padding: 8px !important;
            margin-bottom: 8px !important; /* テキストとの間隔 */
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
            
            /* Flexアイテムとしての右寄せ */
            margin-left: auto !important; 
            margin-right: 0 !important;
        }

        /* --- 5. 編集・コピーボタン等の調整 --- */
        .query-content {
            display: flex !important;
            width: 100% !important;
            justify-content: flex-end !important; /* 右寄せ */
            margin-top: 4px !important;
        }

        /* テキスト内部の余白 */
        .query-text-line {
            padding: 8px 12px !important;
            background-color: transparent !important;
            margin: 0 !important;
        }

        /* --- 6. 入力エリア（フッター） --- */
        footer,
        .input-area,
        .bottom-container,
        div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
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

	console.log("Gemini Full-Width Script Applied (v1.9.0 - Layout Fixes).");
})();