// ==UserScript==
// @name         Wakayama University Moodle Auto-Login
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  和歌山大学の moodle に自動でログインを行います。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @include      /^https:\/\/moodle.*\.wakayama-u\.ac\.jp\/.*$/
// @match        https://login.microsoftonline.com/*
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-autologin.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-autologin.user.js
// ==/UserScript==

(function () {
	'use strict';

	const currentUrl = window.location.href;

	// 1. 和歌山大学 Moodle ドメインでの処理
	if (currentUrl.includes('wakayama-u.ac.jp')) {

		// A. ログインページ（index.php または index_form.html）での処理
		// 修正点: index_form.html も条件に追加
		if (currentUrl.includes('login/index.php') || currentUrl.includes('login/index_form.html')) {

			// Microsoft 365 / OIDC ログインボタンを探してクリック
			// セレクタを強化: 画像リンクや特定のクラスを含む場合も考慮
			const oidcButton = document.querySelector('a[href*="/auth/oidc/"], .login-identityprovider-btn a');

			if (oidcButton) {
				// 誤作動防止のためごく短い遅延を入れる
				setTimeout(() => {
					oidcButton.click();
				}, 300);
				return; // 処理終了
			}
		}

		// B. トップページ等で「ログイン」リンクが表示されている場合
		// ログインページに既にいる場合は実行しない
		const loginLink = document.querySelector('.logininfo a[href*="login/index.php"], .login a[href*="login/index.php"]');
		if (loginLink && !currentUrl.includes('login/')) {
			loginLink.click();
		}
	}

	// 2. Microsoft ログインページでの処理
	if (currentUrl.includes('login.microsoftonline.com')) {
		// 「サインインしたままにする」などの確認画面
		const primaryButton = document.querySelector('#idSIButton9, input[type="submit"].btn-primary');
		if (primaryButton) {
			setTimeout(() => {
				primaryButton.click();
			}, 500);
		}
	}
})();