// ==UserScript==
// @name         Wakayama University Moodle My Course Dropdown
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  和歌山大学の moodle でマイコースのドロップダウンメニューを拡張します。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @include      /^https:\/\/moodle.*\.wakayama-u\.ac\.jp\/.*$/
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mycourse-dropdown.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-mycourse-dropdown.user.js
// ==/UserScript==

(function () {
	'use strict';

	const STYLE_ID = 'mycourses-dropdown-style';
	const DROPDOWN_ID = 'mycourses-dropdown-container';

	// スタイル定義（強制的に色を指定）
	const styleText = `
        /* コンテナ設定：背景白、文字黒を強制 */
        #${DROPDOWN_ID} {
            position: absolute;
            display: none;
            background-color: #ffffff !important;
            color: #333333 !important;
            min-width: 280px;
            max-width: 350px;
            box-shadow: 0 4px 15px rgba(0,0,0,0.2);
            border: 1px solid #ccc;
            border-radius: 4px;
            z-index: 99999;
            top: 100%;
            left: 0;
            padding: 5px 0;
            max-height: 60vh;
            overflow-y: auto;
            text-align: left;
            font-family: sans-serif;
            line-height: 1.5;
        }

        /* 親要素ホバー時に表示 */
        .mycourses-wrapper:hover #${DROPDOWN_ID} {
            display: block;
        }

        /* リンクのスタイル：親テーマの影響を受けないよう !important を多用 */
        #${DROPDOWN_ID} a.course-link {
            display: block !important;
            padding: 10px 15px !important;
            color: #333333 !important; /* 文字色を濃いグレーに強制 */
            background-color: #ffffff !important; /* 背景色を白に強制 */
            text-decoration: none !important;
            font-size: 14px !important;
            border-bottom: 1px solid #eeeeee;
            font-weight: normal !important;
            text-shadow: none !important;
        }

        /* 最後の要素の下線は消す */
        #${DROPDOWN_ID} a.course-link:last-child {
            border-bottom: none;
        }

        /* ホバー時のスタイル */
        #${DROPDOWN_ID} a.course-link:hover {
            background-color: #f0f8ff !important; /* 薄い青 */
            color: #0056b3 !important; /* 濃い青 */
            text-decoration: none !important;
        }

        /* メッセージ表示エリア */
        #${DROPDOWN_ID} .loading-msg,
        #${DROPDOWN_ID} .error-msg {
            padding: 15px;
            text-align: center;
            color: #333333 !important; /* ここも黒文字強制 */
            font-size: 0.9rem;
            background-color: #ffffff !important;
        }

        .mycourses-wrapper {
            position: relative !important;
        }

        .dropdown-indicator {
            font-size: 0.6em;
            margin-left: 5px;
            opacity: 0.8;
            color: inherit; /* 親の文字色に合わせる */
        }
    `;

	const injectStyle = () => {
		if (document.getElementById(STYLE_ID)) return true;
		if (!document.head) return false;
		const style = document.createElement('style');
		style.id = STYLE_ID;
		style.textContent = styleText;
		document.head.appendChild(style);
		return true;
	};

	let cachedCourses = null;
	let isFetching = false;

	const setDropdownMessage = (dropdown, className, message) => {
		dropdown.textContent = '';
		const msg = document.createElement('div');
		msg.className = className;
		msg.textContent = message;
		dropdown.appendChild(msg);
	};

	const renderCourses = (dropdown, courses) => {
		dropdown.textContent = '';
		const fragment = document.createDocumentFragment();
		courses.forEach(course => {
			const link = document.createElement('a');
			link.className = 'course-link';
			link.href = course.viewurl;
			link.title = course.fullname;
			link.textContent = course.fullname;
			fragment.appendChild(link);
		});
		dropdown.appendChild(fragment);
	};

	const findMyCoursesTab = () => {
		let tab = document.querySelector('.nav-item[data-key="mycourses"]');
		if (tab) return tab;

		const links = document.querySelectorAll('.nav-link, .nav-item a');
		for (const link of links) {
			if (link.textContent.trim().includes('マイコース')) {
				return link.closest('.nav-item') || link.parentElement;
			}
		}
		return null;
	};

	// APIでコース取得
	const fetchCoursesFromAPI = async () => {
		try {
			if (typeof window.M === 'undefined' || !window.M.cfg || !window.M.cfg.sesskey) {
				return null;
			}

			const sesskey = window.M.cfg.sesskey;
			const wwwroot = window.M.cfg.wwwroot;

			const args = [{
				index: 0,
				methodname: 'core_course_get_enrolled_courses_by_timeline_classification',
				args: {
					offset: 0,
					limit: 0,
					classification: 'all',
					sort: 'fullname',
					customfieldname: '',
					customfieldvalue: ''
				}
			}];

			const response = await fetch(`${wwwroot}/lib/ajax/service.php?sesskey=${sesskey}&info=core_course_get_enrolled_courses_by_timeline_classification`, {
				method: 'POST',
				headers: {'Content-Type': 'application/json'},
				body: JSON.stringify(args)
			});

			if (!response.ok) {
				throw new Error('API Response Error');
			}

			const responseData = await response.json();

			if (responseData && responseData[0] && !responseData[0].error) {
				return responseData[0].data.courses;
			}
		} catch (e) {
			console.error(e);
		}
		return null;
	};

	const init = () => {
		if (!injectStyle()) return;
		if (document.getElementById(DROPDOWN_ID)) return;

		const targetTab = findMyCoursesTab();
		if (!targetTab) return;

		targetTab.classList.add('mycourses-wrapper');

		const linkTag = targetTab.querySelector('a');
		if (linkTag && !targetTab.querySelector('.dropdown-indicator')) {
			const indicator = document.createElement('span');
			indicator.className = 'dropdown-indicator';
			indicator.innerText = '▼';
			linkTag.appendChild(indicator);
		}

		const dropdown = document.createElement('div');
		dropdown.id = DROPDOWN_ID;
		// 初期表示メッセージも黒文字スタイル適用クラスで囲む
		setDropdownMessage(dropdown, 'loading-msg', '読み込み中...');
		targetTab.appendChild(dropdown);

		const ensureCoursesLoaded = async () => {
			if (cachedCourses) return;
			if (isFetching) return;

			isFetching = true;
			setDropdownMessage(dropdown, 'loading-msg', 'コース情報を取得中...');

			const courses = await fetchCoursesFromAPI();

			if (courses && courses.length > 0) {
				renderCourses(dropdown, courses);
				cachedCourses = courses;
			} else {
				setDropdownMessage(dropdown, 'error-msg', 'コースが見つかりませんでした。（APIエラーまたは登録なし）');
			}

			isFetching = false;
		};

		targetTab.addEventListener('mouseenter', ensureCoursesLoaded);
		targetTab.addEventListener('focusin', ensureCoursesLoaded);
		targetTab.addEventListener('click', ensureCoursesLoaded);
	};

	window.addEventListener('load', init);
	const observer = new MutationObserver((mutations) => {
		if (!document.getElementById(DROPDOWN_ID)) {
			init();
		}
	});
	if (document.body) {
		observer.observe(document.body, {childList: true, subtree: true});
	} else {
		document.addEventListener('DOMContentLoaded', () => {
			if (document.body) {
				observer.observe(document.body, {childList: true, subtree: true});
			}
		}, {once: true});
	}

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
