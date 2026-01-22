// ==UserScript==
// @name         Paiza Language Selector
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  paiza の提出ページで、あらかじめ設定した言語に自動切替します。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @match        https://paiza.jp/*
// @run-at       document-idle
// @grant        GM_setValue
// @grant        GM_getValue
// @grant        GM_registerMenuCommand
// @grant        GM_deleteValue
// @grant        GM_listValues
// @noframes
// @icon         https://paiza.jp/favicon.ico
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/paiza-language-selector.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/paiza-language-selector.user.js
// ==/UserScript==

(function () {
	'use strict';

	// 設定：ここを変更することで任意の言語に対応可能
	// 比較用に自動で小文字化します
	const STORAGE_KEY = 'paiza_target_language';
	const DEFAULT_LANGUAGE = 'c++';

	function getTargetLanguage() {
		return (GM_getValue(STORAGE_KEY) || DEFAULT_LANGUAGE).toLowerCase();
	}

	const RETRY_COUNT = 30;
	const RETRY_INTERVAL_MS = 150;
	const UNLOCK_DURATION_MS = 4000;
	const UNLOCK_INTERVAL_MS = 120;
	const POST_SELECTION_DELAY_MS = 600;
	const EDITOR_READY_TIMEOUT_MS = 8000;
	const DOM_OBSERVATION_MS = 5000;

	function sleep(ms) {
		return new Promise(r => setTimeout(r, ms));
	}

	async function waitUntil(predicate, timeoutMs, intervalMs) {
		const start = Date.now();
		while (Date.now() - start < timeoutMs) {
			if (predicate()) return true;
			await sleep(intervalMs);
		}
		return false;
	}

	async function waitForEditorReady() {
		// ACEが無いページでも落ちないように最小条件で待機
		await waitUntil(
			() => !!getAceEditor() || document.querySelector('.ace_text-input') !== null,
			EDITOR_READY_TIMEOUT_MS,
			120
		);
	}

	function getAceEditor() {
		// @grant none なので window オブジェクトへ直接アクセス可能
		const ace = window && window.ace;
		const div = document.getElementById('editor-div');
		if (!ace || !div) return null;
		try {
			return ace.edit(div);
		} catch {
			return null;
		}
	}

	function isEditorWritable() {
		const editor = getAceEditor();
		if (editor && typeof editor.getReadOnly === 'function') {
			try {
				if (editor.getReadOnly()) return false;
			} catch {
				// ignore
			}
		}
		for (const ta of Array.from(document.querySelectorAll('.ace_text-input'))) {
			try {
				if (ta.readOnly || ta.disabled) return false;
			} catch {
				// ignore
			}
		}
		return true;
	}

	function unlockEditorOnce() {
		// 1) ACE editor 側
		const editor = getAceEditor();
		if (editor && typeof editor.setReadOnly === 'function') {
			try {
				editor.setReadOnly(false);
			} catch {
				// ignore
			}
		}

		// 2) 内部 textarea 側
		for (const ta of Array.from(document.querySelectorAll('.ace_text-input'))) {
			try {
				if (ta.hasAttribute('readonly')) ta.removeAttribute('readonly');
				ta.readOnly = false;
				if (ta.disabled) ta.disabled = false;
				if (ta.tabIndex < 0) ta.tabIndex = 0;
			} catch {
				// ignore
			}
		}
	}

	async function unlockEditorForDuration() {
		// エディタ等が無い場合は処理をスキップ
		if (!getAceEditor() && document.querySelectorAll('.ace_text-input').length === 0) return;
		if (isEditorWritable()) return;

		const endAt = Date.now() + UNLOCK_DURATION_MS;
		while (Date.now() < endAt) {
			unlockEditorOnce();
			if (isEditorWritable()) return;
			await sleep(UNLOCK_INTERVAL_MS);
		}
	}

	function normalizeText(s) {
		return String(s || '').trim().replace(/\s+/g, ' ').toLowerCase();
	}

	function findLanguageSelectElement() {
		return (
			document.querySelector('#language_id')
			|| document.querySelector('select[name="language[id]"]')
			|| null
		);
	}

	function findPlaceholderOption(selectEl) {
		for (const opt of Array.from(selectEl.options || [])) {
			if (String(opt.value) === '') return opt;
		}
		return null;
	}

	function findTargetOption(selectEl) {
		const targetLanguage = getTargetLanguage();
		for (const opt of Array.from(selectEl.options || [])) {
			const label = normalizeText(opt.textContent || opt.label || '');
			if (!label) continue;
			// 部分一致による誤検知（例: javascript vs java）を防ぐ
			if (label.startsWith('javascript') && targetLanguage !== 'javascript') continue;

			// 前方一致判定（バージョン番号などが付与されているケースに対応）
			if (label === targetLanguage || label.startsWith(targetLanguage + ' ') || label.startsWith(targetLanguage + '(')) {
				return opt;
			}
		}
		return null;
	}

	function dispatchChangeEvents(el) {
		try {
			el.dispatchEvent(new Event('input', {bubbles: true, cancelable: true}));
			el.dispatchEvent(new Event('change', {bubbles: true, cancelable: true}));
			el.dispatchEvent(new Event('blur', {bubbles: true, cancelable: true}));
		} catch {
			// ignore
		}

		const $ = window && window.jQuery;
		if ($) {
			try {
				$(el).trigger('input');
				$(el).trigger('change');
			} catch {
				// ignore
			}
		}
	}

	function syncHiddenLanguageId(selectEl) {
		if (!selectEl) return;
		for (const id of ['programming_language_id', 'submit_programming_language_id']) {
			const el = document.getElementById(id);
			if (!el) continue;
			try {
				el.value = String(selectEl.value || '');
				el.dispatchEvent(new Event('input', {bubbles: true}));
				el.dispatchEvent(new Event('change', {bubbles: true}));
			} catch {
				// ignore
			}
		}
	}

	function setSelectValueNative(selectEl, value) {
		try {
			const proto = Object.getPrototypeOf(selectEl);
			const desc = proto && Object.getOwnPropertyDescriptor(proto, 'value');
			const setter = desc && desc.set;
			if (setter) {
				setter.call(selectEl, value);
				return;
			}
		} catch {
			// ignore
		}
		selectEl.value = value;
	}

	function applySelectOption(selectEl, opt) {
		if (!opt) return;
		try {
			if (typeof selectEl.focus === 'function') selectEl.focus({preventScroll: true});
		} catch {
			// ignore
		}
		setSelectValueNative(selectEl, opt.value);
		selectEl.selectedIndex = opt.index;
		dispatchChangeEvents(selectEl);
		syncHiddenLanguageId(selectEl);
	}

	function selectTargetLanguageOnce() {
		const sel = findLanguageSelectElement();
		if (!sel || sel.disabled) return false;

		const targetOpt = findTargetOption(sel);
		if (!targetOpt) return false;

		// 2段階選択による初期化トリガー対策
		const placeholder = findPlaceholderOption(sel);
		if (placeholder) applySelectOption(sel, placeholder);
		applySelectOption(sel, targetOpt);

		return String(sel.value) === String(targetOpt.value);
	}

	async function attemptLanguageSelection() {
		for (let i = 0; i < RETRY_COUNT; i++) {
			if (selectTargetLanguageOnce()) return true;
			await sleep(RETRY_INTERVAL_MS);
		}
		return false;
	}

	function registerMenuCommands() {
		const languages = [
			'Python3',
			'C++',
			'Java',
			'C',
			'C#',
			'Kotlin',
			'Go',
			'JavaScript',
			'PHP',
			'Ruby',
			'Swift',
			'Scala',
			'Perl',
			'Python2',
			'Objective-C',
		];

		languages.forEach(lang => {
			const current = getTargetLanguage();
			const label = (current === lang.toLowerCase() ? '★ ' : '☆ ') + lang;
			GM_registerMenuCommand(label, () => {
				GM_setValue(STORAGE_KEY, lang.toLowerCase());
				location.reload();
			});
		});

		GM_registerMenuCommand('その他（手動入力）', () => {
			const current = getTargetLanguage();
			const lang = prompt('自動選択する言語を入力してください（例: c++, python3, c#）', current);
			if (lang !== null) {
				GM_setValue(STORAGE_KEY, lang.trim().toLowerCase());
				location.reload();
			}
		});
	}

	async function initialize() {
		registerMenuCommands();
		await attemptLanguageSelection();

		// テンプレ挿入等の処理待ち
		await sleep(POST_SELECTION_DELAY_MS);
		await waitForEditorReady();
		void unlockEditorForDuration();

		// 遅延DOMロード対策
		const observer = new MutationObserver(() => {
			if (selectTargetLanguageOnce()) {
				setTimeout(() => {
					void waitForEditorReady().then(() => unlockEditorOnce());
				}, POST_SELECTION_DELAY_MS);
				observer.disconnect();
			}
		});
		try {
			observer.observe(document.body || document.documentElement, {childList: true, subtree: true});
			setTimeout(() => observer.disconnect(), DOM_OBSERVATION_MS);
		} catch {
			observer.disconnect();
		}
	}

	void initialize();
})();
