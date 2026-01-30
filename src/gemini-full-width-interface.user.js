// ==UserScript==
// @name         Gemini Full-Width Interface
// @namespace    https://github.com/nsubaru11/userscripts
// @version      3.2.0
// @description  GeminiのUIを最適化。送信直後のレイアウト崩れを防ぎ、ボタンをテキストの下に固定します。
// @author       nsubaru11
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
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/gemini-full-width-interface.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/gemini-full-width-interface.user.js
// ==/UserScript==

(function () {
	'use strict';

	// --- 1. 初期設定 ---
	const config = {
		width: GM_getValue('width', '95%'),
		maxWidth: GM_getValue('maxWidth', '1200px'),
		useBgColor: GM_getValue('useBgColor', false),
		userBgColor: GM_getValue('userBgColor', '#d0ebff')
	};

	// --- 2. CSS定義 ---
	const colorOverrides = config.useBgColor ? `
        :root body {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }
        :root body[data-theme="dark"] {
            --gemini-user-bg: ${config.userBgColor === '#d0ebff' ? 'rgba(208, 235, 255, 0.2)' : config.userBgColor};
            --gemini-user-text: #e3e3e3;
        }
        :root body[data-theme="light"] {
            --gemini-user-bg: ${config.userBgColor};
            --gemini-user-text: #0b1c33;
        }
        :root body [class*="user-query-bubble"] {
            background-color: var(--gemini-user-bg) !important;
            color: var(--gemini-user-text) !important;
        }
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            color: inherit !important;
        }
    ` : '';

	const layoutCss = `
        :root {
            --gemini-chat-width: ${config.width};
            --gemini-chat-max-width: ${config.maxWidth};
        }

        /* 読み込み時の位置ズレ（FOUC）を隠すアニメーション */
        @keyframes gemini-slide-in {
            0% { opacity: 0; transform: translateX(10px); }
            100% { opacity: 1; transform: translateX(0); }
        }

        ${colorOverrides}

        /* レイアウト: 画面幅の拡張 */
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

        /* ユーザー入力コンテナ全体: 縦並び・右寄せ */
        :root body user-query,
        :root body user-query-content,
        :root body [class*="user-query-container"] {
            display: flex !important;
            flex-direction: column !important;
            align-items: flex-end !important;
            width: 100% !important;
            max-width: 100% !important;
            animation: gemini-slide-in 0.25s ease-out forwards !important;
        }

        /* 編集モード対応: フォーム表示時は左寄せに戻しアニメーションを無効化 */
        :root body user-query:has(form),
        :root body user-query-content:has(form),
        :root body [class*="user-query-container"]:has(form) {
            align-items: flex-start !important;
            animation: none !important;
        }

        :root body user-query form,
        :root body [class*="user-query-container"] form {
            width: 100% !important;
            max-width: 100% !important;
        }

        /* 添付ファイルエリアの調整 */
        :root body user-query-file-carousel {
            align-self: flex-end !important;
            width: auto !important;
            max-width: 100% !important;
            order: 0 !important; /* 最上部に配置 */
        }

        /* ユーザー吹き出し: 形状を維持したまま右寄せ */
        :root body [class*="user-query-bubble"] {
            max-width: 85% !important;
            margin-left: auto !important;
            margin-right: 0 !important;

            /* 【重要】表示順序の強制 */
            order: 1 !important;
        }

        /* 既定の左パディングを打ち消して余白を除去 */
        :root body [class*="user-query-container"] [class*="query-content"] {
            padding-left: 0 !important;
            padding-inline-start: 0 !important;
        }

        /* 吹き出し内テキストの背景透過設定 */
        :root body [class*="user-query-bubble"] [class*="query-text-line"] {
            background-color: transparent !important;
        }

        /* --- JS生成要素のスタイル --- */

        /* 1. query-content自体を縦並び（Column）にする */
        :root body [class*="query-content"]:has([class*="user-query-bubble"]) {
            display: flex !important;
            flex-direction: column !important; /* テキストの下にボタンエリアを積む */
            align-items: flex-end !important;  /* 右端揃え */
            gap: 4px !important;
            width: 100% !important;            /* 幅を確保 */
            max-width: 100% !important;
            min-width: 0 !important;
        }

        /* 2. JSでまとめたボタンエリア (.gemini-user-actions) */
        :root body .gemini-user-actions {
            display: inline-flex !important;   /* ボタン同士は横並び */
            gap: 6px !important;
            align-items: center !important;
            justify-content: flex-end !important;
            margin-right: 0 !important;
            opacity: 0.8;

            /* 【重要】必ずバブルの下に来るように順序を強制 */
            order: 2 !important;
            margin-top: 4px !important;
        }

        /* ホバー時のみ少し強調（任意） */
        :root body .gemini-user-actions:hover {
            opacity: 1;
        }

        /* 処理前のボタンが変な位置に出ないようにする */
        :root body user-query-content > div:not(.gemini-user-actions):not([class*="user-query-bubble"]):has(button) {
            /* JSが移動させるまで一時的に見えなくする（ちらつき防止） */
            opacity: 0;
            pointer-events: none;
        }

        /* フッター（入力エリア）の外枠幅を制限 */
        :root body footer,
        :root body [class*="bottom-container"] {
             width: var(--gemini-chat-width) !important;
             max-width: var(--gemini-chat-max-width) !important;
             margin: 0 auto !important;
        }

        /* 入力ボックス自体の幅を維持（崩れ防止） */
        :root body [class*="input-area"],
        :root body div[role="contentinfo"] > div {
             width: 100% !important;
             max-width: 100% !important;
        }

        :root body pre {
            white-space: pre-wrap !important;
        }
    `;

	// --- 3. DOM操作と監視 (DOM Restructuring) ---
	const styleId = 'gemini-full-width-style';
	const actionsClass = 'gemini-user-actions';
	const queryContentSelector = 'user-query-content [class*="query-content"]';
	const bubbleSelector = ':scope > [class*="user-query-bubble"]';
	const buttonWrapperSelector = ':scope > div';
	let normalizePending = false;

	// ボタン要素を適切なコンテナに移動させる関数
	function normalizeUserQueryActions() {
		if (!document.body) return;

		const queryContents = document.querySelectorAll(queryContentSelector);
		queryContents.forEach((queryContent) => {
			// 編集モード中は操作しない
			if (queryContent.querySelector('form')) return;

			const bubble = queryContent.querySelector(bubbleSelector);
			if (!bubble) return;

			// まだ移動されていないボタンのラッパーのみを取得
			const buttonWrappers = Array.from(queryContent.querySelectorAll(buttonWrapperSelector))
				.filter((wrapper) => {
					// 既に作成したコンテナ自身や、バブル本体は除外
					return wrapper.querySelector('button') &&
						!wrapper.classList.contains(actionsClass) &&
						!wrapper.className.includes('user-query-bubble');
				});

			if (buttonWrappers.length === 0) return;

			// コンテナの取得または作成
			let actions = queryContent.querySelector(`:scope > .${actionsClass}`);
			if (!actions) {
				actions = document.createElement('div');
				actions.className = actionsClass;
			}

			// ボタンラッパーをコンテナに移動
			buttonWrappers.forEach((wrapper) => {
				// opacity0で見えなくしていたのを戻す
				wrapper.style.opacity = '1';
				wrapper.style.pointerEvents = 'auto';
				actions.appendChild(wrapper);
			});

			// コンテナをDOM内の適切な位置に配置
			if (actions.parentElement !== queryContent) {
				queryContent.appendChild(actions);
			}
			// バブルの直後に配置 (orderを使っているが念のためDOM順序も整える)
			if (actions.previousSibling !== bubble) {
				bubble.insertAdjacentElement('afterend', actions);
			}
		});
	}

	function scheduleNormalize() {
		if (normalizePending) return;
		normalizePending = true;
		requestAnimationFrame(() => {
			normalizePending = false;
			normalizeUserQueryActions();
		});
	}

	function injectStyle() {
		if (document.getElementById(styleId)) return;
		const style = document.createElement('style');
		style.id = styleId;
		style.textContent = layoutCss;
		(document.head || document.documentElement).appendChild(style);
		console.log('Gemini Full-Width: Style Injected');
	}

	// 初回実行
	injectStyle();
	scheduleNormalize();

	// 監視設定
	const observer = new MutationObserver(() => {
		if (!document.getElementById(styleId)) injectStyle();
		scheduleNormalize();
	});

	observer.observe(document.documentElement, {childList: true, subtree: true});

	// --- 4. メニューコマンド ---
	GM_registerMenuCommand(config.useBgColor ? "カスタム背景色をOFF" : "カスタム背景色をON", () => {
		GM_setValue('useBgColor', !config.useBgColor);
		location.reload();
	});

	GM_registerMenuCommand("背景色設定", () => {
		const c = prompt("色を指定 (例: #d0ebff)", config.userBgColor);
		if (c) {
			GM_setValue('userBgColor', c);
			GM_setValue('useBgColor', true);
			location.reload();
		}
	});

	GM_registerMenuCommand("幅設定", () => {
		const w = prompt("幅 (例: 95%)", config.width);
		if (w) {
			GM_setValue('width', w);
			location.reload();
		}
	});

	GM_registerMenuCommand("最大幅設定", () => {
		const m = prompt("最大幅 (例: 1200px)", config.maxWidth);
		if (m) {
			GM_setValue('maxWidth', m);
			location.reload();
		}
	});

	console.log("Gemini Full-Width v3.2.0: Layout stabilized with JS grouping.");
})();
