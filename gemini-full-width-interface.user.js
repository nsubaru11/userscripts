// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      2.3.0
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せにします。形を崩さず、幅や背景色のカスタマイズ、ダークモードに対応しています。Googleの標準CSSに負けない詳細度と、最速の適用速度を備えています。
// @author       You
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://gemini.google.com/*
// @run-at       document-start
// @grant        GM_getValue
// @grant        GM_setValue
// @grant        GM_registerMenuCommand
// @noframes
// @icon         https://gemini.google.com/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/gemini-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/gemini-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	// 設定の即時読み込み
	const config = {
		width: GM_getValue('width', '95%'),
		maxWidth: GM_getValue('maxWidth', '1200px'),
		useBgColor: GM_getValue('useBgColor', false),
		userBgColor: GM_getValue('userBgColor', '#d0ebff')
	};

	// CSSの構築（詳細度を強化するため、すべてのセレクタに :root または body を付与）
	const colorOverrides = config.useBgColor ? `
        :root body {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }

        /* ダークモード設定 */
        :root body[data-theme="dark"] {
            --gemini-user-bg: ${config.userBgColor === '#d0ebff' ? 'rgba(208, 235, 255, 0.2)' : config.userBgColor};
            --gemini-user-text: #e3e3e3;
        }

        /* ライトモード設定 */
        :root body[data-theme="light"] {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }

        /* 実際に色だけを適用するセレクタ */
        :root body [class*="user-query-bubble"],
        :root body [class*="new-file-preview-container"],
        :root body user-query-file-preview [class*="file-preview-container"],
        :root body [class*="preview-image-button"] {
            background-color: var(--gemini-user-bg) !important;
            color: var(--gemini-user-text) !important;
        }

        /* 内部テキストの色を継承させる */
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            color: inherit !important;
        }
    ` : '';

	const fullWidthCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
        }

        ${colorOverrides}

        /* --- 1. 画面幅の拡張 --- */
        :root body [class*="conversation-container"],
        :root body infinite-scroller,
        :root body [class*="infinite-scroller"],
        :root body main [class*="user-content"],
        :root body main [class*="model-content"],
        :root body main [class*="input-area-container"] {
            width: var(--gemini-chat-width) !important;
            max-width: var(--gemini-chat-max-width) !important;
            margin: 0 auto !important;
        }

        /* --- 2. ユーザー入力エリアのレイアウト（右寄せ） --- */
        :root body user-query,
        :root body user-query-content,
        :root body [class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 添付ファイルエリアの右寄せ */
        :root body user-query-file-carousel {
            align-self: flex-end !important;
            width: auto !important;
            max-width: 100% !important;
        }

        /* ユーザーの吹き出し自体のレイアウト調整 */
        :root body [class*="user-query-bubble"] {
            max-width: 85% !important;
            margin-left: auto !important;
            margin-right: 0 !important;
        }

        /* 内部のテキスト行の調整 */
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            background-color: transparent !important;
        }

        /* --- 3. 編集・コピーボタン等の調整 --- */
        :root body [class*="query-content"] {
            display: flex !important;
            width: 100% !important;
            justify-content: flex-end !important;
            margin-top: 4px !important;
        }

        /* --- 4. 入力エリア（フッター） --- */
        :root body footer,
        :root body [class*="input-area"],
        :root body [class*="bottom-container"],
        :root body div[role="contentinfo"] > div {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        :root body pre {
            white-space: pre-wrap !important;
        }
    `;

	// 最速のタイミングでスタイルを注入
	const style = document.createElement('style');
	style.textContent = fullWidthCss;
	document.documentElement.appendChild(style);

	// メニューコマンドの登録（実行自体には影響しないため後回し）
	GM_registerMenuCommand(config.useBgColor ? "カスタム背景色を無効にする（デフォルトに戻す）" : "カスタム背景色を有効にする", () => {
		GM_setValue('useBgColor', !config.useBgColor);
		location.reload();
	});

	GM_registerMenuCommand("カスタム背景色を変更する", () => {
		const newColor = prompt("背景色のカラーコードを入力してください（例: #d0ebff, rgba(208, 235, 255, 0.5)）", config.userBgColor);
		if (newColor !== null) {
			GM_setValue('userBgColor', newColor);
			GM_setValue('useBgColor', true);
			location.reload();
		}
	});

	GM_registerMenuCommand("表示幅を変更する", () => {
		const newWidth = prompt("チャット画面の幅を入力してください（例: 95%, 100%）", config.width);
		if (newWidth !== null) {
			GM_setValue('width', newWidth);
			location.reload();
		}
	});

	GM_registerMenuCommand("最大幅を変更する", () => {
		const newMax = prompt("チャット画面の最大幅を入力してください（例: 1200px, none）", config.maxWidth);
		if (newMax !== null) {
			GM_setValue('maxWidth', newMax);
			location.reload();
		}
	});

	console.log("Gemini Full-Width Script Applied (v2.3.0).");
})();