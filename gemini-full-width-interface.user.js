// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      2.2.1
// @description  Geminiのチャット画面を広げ、ユーザー入力を右寄せにします。形を崩さず、幅や背景色のカスタマイズ、ダークモードに対応しています。Gemini自身のテーマ設定を優先します。
// @author       You
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://gemini.google.com/*
// @run-at       document-start
// @grant        GM_addStyle
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

	// 設定の読み込み（保存されていない場合はデフォルト値を使用）
	const config = {
		width: GM_getValue('width', '95%'),
		maxWidth: GM_getValue('maxWidth', '1200px'),
		useBgColor: GM_getValue('useBgColor', false),
		userBgColor: GM_getValue('userBgColor', '#d0ebff')
	};

	// メニューコマンドの登録
	GM_registerMenuCommand(config.useBgColor ? "カスタム背景色を無効にする（デフォルトに戻す）" : "カスタム背景色を有効にする", () => {
		GM_setValue('useBgColor', !config.useBgColor);
		location.reload();
	});

	GM_registerMenuCommand("カスタム背景色を変更する", () => {
		const newColor = prompt("背景色のカラーコードを入力してください（例: #d0ebff, rgba(208, 235, 255, 0.5)）", config.userBgColor);
		if (newColor !== null) {
			GM_setValue('userBgColor', newColor);
			GM_setValue('useBgColor', true); // 色を変更したら有効にする
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

	// カスタム背景色が有効な場合のスタイル定義
	const colorOverrides = config.useBgColor ? `
        :root {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }

        /* ダークモード設定（カスタム色がデフォルトのままなら半透明にする） */
        body[data-theme="dark"] {
            --gemini-user-bg: ${config.userBgColor === '#d0ebff' ? 'rgba(208, 235, 255, 0.2)' : config.userBgColor};
            --gemini-user-text: #e3e3e3;
        }

        /* ライトモード設定 */
        body[data-theme="light"] {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }

        /* 実際に色だけを適用するセレクタ（形状には干渉しない） */
        [class*="user-query-bubble"],
        [class*="new-file-preview-container"],
        user-query-file-preview [class*="file-preview-container"],
        [class*="preview-image-button"] {
            background-color: var(--gemini-user-bg) !important;
            color: var(--gemini-user-text) !important;
        }

        /* 内部テキストの色を継承させる */
        [class*="user-query-bubble"] [class*="query-text-line"] {
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
        [class*="conversation-container"],
        infinite-scroller,
        [class*="infinite-scroller"],
        main [class*="user-content"],
        main [class*="model-content"],
        main [class*="input-area-container"] {
            width: var(--gemini-chat-width) !important;
            max-width: var(--gemini-chat-max-width) !important;
            margin: 0 auto !important;
        }

        /* --- 2. ユーザー入力エリアのレイアウト（右寄せ） --- */
        
        /* コンテナをFlexboxにして右寄せを実現 */
        user-query,
        user-query-content,
        [class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 添付ファイルエリアの右寄せ */
        user-query-file-carousel {
            align-self: flex-end !important;
            width: auto !important;
            max-width: 100% !important;
        }

        /* ユーザーの吹き出し自体のレイアウト調整（形状は変えない） */
        [class*="user-query-bubble"] {
            max-width: 85% !important;
            margin-left: auto !important;
            margin-right: 0 !important;
        }

        /* 内部のテキスト行の調整（背景色を消してバブルの色を見せる） */
        [class*="user-query-bubble"] [class*="query-text-line"] {
            background-color: transparent !important;
        }

        /* --- 3. 編集・コピーボタン等の調整 --- */
        [class*="query-content"] {
            display: flex !important;
            width: 100% !important;
            justify-content: flex-end !important;
            margin-top: 4px !important;
        }

        /* --- 4. 入力エリア（フッター） --- */
        footer,
        [class*="input-area"],
        [class*="bottom-container"],
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
		(document.head || document.documentElement).appendChild(style);
	}

	console.log("Gemini Full-Width Script Applied (v2.2.1).");
})();