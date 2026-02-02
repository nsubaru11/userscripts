// ==UserScript==
// @name         Wakayama University Moodle Mark as Read
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.1
// @description  和歌山大学の moodle で未読の通知を全て既読にします。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @include      /^https:\/\/moodle.*\.wakayama-u\.ac\.jp\/.*$/
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mark-as-read.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mark-as-read.user.js
// ==/UserScript==

(function () {
	'use strict';

	const BTN_ID = 'mark-all-read-btn';
	const STYLE_ID = 'moodle-fix-style';
	const btnStyle = `
        #${BTN_ID} {
            background: linear-gradient(to bottom, #ffffff, #f1f3f5) !important;
            color: #201799 !important;
            border: 1px solid #adb5bd !important;
            padding: 4px 12px !important;
            border-radius: 6px !important;
            font-size: 12px !important;
            font-weight: bold !important;
            text-decoration: none !important;
            box-shadow: 0 1px 3px rgba(0,0,0,0.15) !important;
            display: inline-flex !important;
            align-items: center !important;
            margin-right: 12px !important;
            cursor: pointer !important;
            transition: all 0.2s ease !important;
        }
        #${BTN_ID}:hover {
            background: #ffffff !important;
            border-color: #201799 !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
            transform: translateY(-1px);
        }
    `;

	const injectStyle = () => {
		if (document.getElementById(STYLE_ID)) return true;
		if (!document.head) return false;
		if (!document.getElementById(STYLE_ID)) {
			const style = document.createElement('style');
			style.id = STYLE_ID;
			style.textContent = btnStyle;
			document.head.appendChild(style);
		}
		return true;
	};

	let isMarking = false;
	const markAllAsRead = async (e) => {
		e.preventDefault();
		if (isMarking) return;
		const btn = document.getElementById(BTN_ID);
		if (!btn) return;
		const cfg = window.M?.cfg;
		if (!cfg?.userId || !cfg?.sesskey || !cfg?.wwwroot) {
			btn.textContent = '❌ 失敗（情報不足）';
			return;
		}

		isMarking = true;
		btn.textContent = '⌛ 処理中...';
		btn.style.opacity = '0.6';
		btn.style.pointerEvents = 'none';

		try {
			// MoodleのWebサービスAPIを呼び出す
			// core_message_mark_all_notifications_as_read を使用
			const payload = [{
				index: 0,
				methodname: 'core_message_mark_all_notifications_as_read',
				args: {
					useridto: cfg.userId
				}
			}];

			const response = await fetch(`${cfg.wwwroot}/lib/ajax/service.php?sesskey=${cfg.sesskey}`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(payload)
			});

			if (response.ok) {
				// UI上の未読表示をすべてリセット
				document.querySelectorAll('.notification.unread').forEach(el => {
					el.classList.remove('unread');
				});

				// 通知バッジ（赤い数字）を消す
				const badge = document.querySelector('[data-region="count-container"]');
				if (badge) badge.classList.add('d-none');

				btn.textContent = '✅ 完了しました';
				console.log("Moodle: All notifications marked as read via API.");
			} else {
				throw new Error("API Response Error");
			}
		} catch (err) {
			console.error('一括既読化に失敗しました:', err);
			btn.textContent = '❌ 失敗（再試行）';
		} finally {
			setTimeout(() => {
				btn.textContent = '✅ すべて既読';
				btn.style.opacity = '1';
				btn.style.pointerEvents = '';
				isMarking = false;
			}, 2000);
		}
	};

	const addReadButton = () => {
		const actions = document.querySelector('.popover-region-header-actions');
		if (actions && !document.getElementById(BTN_ID)) {
			if (!injectStyle()) return;
			const btn = document.createElement('a');
			btn.id = BTN_ID;
			btn.href = '#';
			btn.textContent = '✅ すべて既読';
			btn.setAttribute('role', 'button');
			btn.addEventListener('click', markAllAsRead);
			actions.prepend(btn);
		}
	};

	const observer = new MutationObserver(addReadButton);
	if (document.body) {
		observer.observe(document.body, {childList: true, subtree: true});
	} else {
		window.addEventListener('DOMContentLoaded', () => {
			if (document.body) {
				observer.observe(document.body, {childList: true, subtree: true});
			}
		}, {once: true});
	}
})();
