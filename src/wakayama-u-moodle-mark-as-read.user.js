// ==UserScript==
// @name         Wakayama University Moodle Mark as Read
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  和歌山大学の moodle で未読の通知を全て既読にします。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @include      /^https:\/\/moodle.*\.wakayama-u\.ac\.jp\/.*$/
// @match        https://login.microsoftonline.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mark-as-read.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mark-as-read.user.js
// ==/UserScript==

(function () {
	'use strict';

	const btnStyle = `
        #mark-all-read-btn {
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
        #mark-all-read-btn:hover {
            background: #ffffff !important;
            border-color: #201799 !important;
            box-shadow: 0 2px 5px rgba(0,0,0,0.2) !important;
            transform: translateY(-1px);
        }
    `;

	const injectStyle = () => {
		if (!document.getElementById('moodle-fix-style')) {
			const style = document.createElement('style');
			style.id = 'moodle-fix-style';
			style.innerHTML = btnStyle;
			document.head.appendChild(style);
		}
	};

	const markAllAsRead = async (e) => {
		e.preventDefault();
		const btn = document.getElementById('mark-all-read-btn');

		btn.innerText = '⌛ 処理中...';
		btn.style.opacity = '0.6';

		try {
			// MoodleのWebサービスAPIを呼び出す
			// core_message_mark_all_notifications_as_read を使用
			const payload = [{
				index: 0,
				methodname: 'core_message_mark_all_notifications_as_read',
				args: {
					useridto: M.cfg.userId
				}
			}];

			const response = await fetch(`${M.cfg.wwwroot}/lib/ajax/service.php?sesskey=${M.cfg.sesskey}`, {
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

				btn.innerText = '✅ 完了しました';
				console.log("Moodle: All notifications marked as read via API.");
			} else {
				throw new Error("API Response Error");
			}
		} catch (err) {
			console.error('一括既読化に失敗しました:', err);
			btn.innerText = '❌ 失敗（再試行）';
			btn.style.opacity = '1';
		} finally {
			setTimeout(() => {
				btn.innerText = '✅ すべて既読';
				btn.style.opacity = '1';
			}, 2000);
		}
	};

	const addReadButton = () => {
		const actions = document.querySelector('.popover-region-header-actions');
		if (actions && !document.getElementById('mark-all-read-btn')) {
			injectStyle();
			const btn = document.createElement('a');
			btn.id = 'mark-all-read-btn';
			btn.href = '#';
			btn.innerText = '✅ すべて既読';
			btn.onclick = markAllAsRead;
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
