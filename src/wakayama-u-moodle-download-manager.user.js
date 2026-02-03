// ==UserScript==
// @name         Wakayama University Moodle Download Manager
// @namespace    https://github.com/nsubaru11/userscripts
// @version      1.0.0
// @description  和歌山大学の moodle でファイル一括ダウンロード機能を拡張します。
// @author       nsubaru11
// @license      MIT
// @homepageURL  https://github.com/nsubaru11/userscripts/tree/main
// @supportURL   https://github.com/nsubaru11/userscripts/issues
// @include      /^https:\/\/moodle.*\.wakayama-u\.ac\.jp\/.*$/
// @run-at       document-start
// @grant        none
// @noframes
// @updateURL    https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-download-manager.user.js
// @downloadURL  https://raw.githubusercontent.com/nsubaru11/userscripts/main/src/wakayama-u-moodle-download-manager.user.js
// ==/UserScript==

(function () {
	'use strict';

	// ==========================================
	// 1. CSSスタイル定義
	// ==========================================
	const style = document.createElement('style');
	style.innerHTML = `
        /* --------------------------------------
           ページ内チェックボックスのスタイル
           -------------------------------------- */
        /* アイコンとチェックボックスをまとめる新しいラッパー */
        .bd-icon-wrapper {
            display: flex !important;
            align-items: center !important;
            /* 元のアイコンが持っていたマージンや配置設定を引き継ぐため、
               ここでは最低限のスタイルのみ定義 */
        }

        /* チェックボックスのラッパー（微調整用） */
        .bd-checkbox-wrapper {
            display: inline-flex !important;
            align-items: center !important;
            margin-right: 8px !important; /* アイコンとの間隔 */
        }

        /* チェックボックス本体 */
        .batch-download-checkbox {
            width: 16px !important;
            height: 16px !important;
            cursor: pointer;
            margin: 0 !important;
            accent-color: #0f6cbf;
        }

        /* 以前のCSSで activity-icon に flex を当てていた記述は削除しました。
           これによりアイコンの変形（バグ）が解消されます。 */

        /* --------------------------------------
           サイドバー（右側パネル）のスタイル
           -------------------------------------- */
        /* トグルボタン */
        #bd-sidebar-toggle {
            position: fixed;
            top: 50%;
            right: 0;
            transform: translateY(-50%);
            width: 30px;
            height: 60px;
            background-color: #333;
            color: #fff;
            border-radius: 8px 0 0 8px;
            cursor: pointer;
            z-index: 10001;
            display: flex;
            align-items: center;
            justify-content: center;
            font-weight: bold;
            box-shadow: -2px 0 5px rgba(0,0,0,0.2);
            transition: right 0.3s ease;
        }
        #bd-sidebar-toggle:hover {
            background-color: #555;
        }

        /* サイドバー本体 */
        #bd-sidebar {
            position: fixed;
            top: 0;
            right: -320px;
            width: 300px;
            height: 100vh;
            background-color: #fff;
            box-shadow: -4px 0 15px rgba(0,0,0,0.1);
            z-index: 10000;
            transition: right 0.3s ease;
            display: flex;
            flex-direction: column;
            border-left: 1px solid #ddd;
        }

        #bd-sidebar.open {
            right: 0;
        }
        #bd-sidebar.open + #bd-sidebar-toggle {
            right: 300px;
        }

        /* サイドバー内コンテンツ */
        .bd-sidebar-header {
            padding: 15px;
            background-color: #f8f9fa;
            border-bottom: 1px solid #eee;
            display: flex;
            justify-content: space-between;
            align-items: center;
        }
        .bd-sidebar-header h3 {
            margin: 0;
            font-size: 1.1rem;
            color: #333;
        }

        .bd-sidebar-content {
            flex: 1;
            overflow-y: auto;
            padding: 10px;
        }

        .bd-sidebar-footer {
            padding: 15px;
            border-top: 1px solid #eee;
            background-color: #fff;
            text-align: center;
        }

        .bd-list-item {
            display: flex;
            align-items: center;
            padding: 8px;
            border-bottom: 1px solid #f0f0f0;
            font-size: 0.85rem;
        }
        .bd-list-item:hover {
            background-color: #f2f8ff;
        }
        .bd-list-item input {
            margin-right: 10px;
        }
        .bd-list-item span {
            white-space: nowrap;
            overflow: hidden;
            text-overflow: ellipsis;
            color: #333;
        }

        .bd-btn {
            width: 100%;
            padding: 10px;
            margin-bottom: 10px;
            border: none;
            border-radius: 4px;
            cursor: pointer;
            font-weight: bold;
        }
        .bd-btn-primary {
            background-color: #0f6cbf;
            color: white;
        }
        .bd-btn-primary:disabled {
            background-color: #ccc;
            cursor: not-allowed;
        }
        .bd-btn-secondary {
            background-color: #e9ecef;
            color: #333;
        }

        .bd-status {
            font-size: 0.8rem;
            color: #666;
            margin-top: 5px;
        }
    `;
	document.head.appendChild(style);


	// ==========================================
	// 2. ロジック部
	// ==========================================

	// 状態管理
	let fileResources = [];

	// ダウンロード処理
	const downloadFiles = (selectedFiles) => {
		if (selectedFiles.length === 0) return;

		if (!confirm(`${selectedFiles.length} 個のファイルをダウンロードします。\n\n※「ポップアップブロック」が表示された場合は許可してください。`)) {
			return;
		}

		let delay = 0;
		const statusEl = document.getElementById('bd-status-msg');

		selectedFiles.forEach((file, index) => {
			setTimeout(() => {
				const downloadUrl = file.url.includes('?') ? `${file.url}&redirect=1` : `${file.url}?redirect=1`;

				const link = document.createElement('a');
				link.href = downloadUrl;
				link.download = '';
				link.target = '_blank';
				link.style.display = 'none';
				document.body.appendChild(link);
				link.click();

				setTimeout(() => document.body.removeChild(link), 1000);

				if (statusEl) statusEl.textContent = `${index + 1} / ${selectedFiles.length} を処理中...`;

				if (index === selectedFiles.length - 1) {
					setTimeout(() => { if (statusEl) statusEl.textContent = '完了しました'; }, 1000);
				}
			}, delay);
			delay += 1000;
		});
	};

	// UI更新
	const updateUI = () => {
		const selectedCount = fileResources.filter(f => f.checked).length;
		const btn = document.getElementById('bd-btn-download');
		const countSpan = document.getElementById('bd-selected-count');

		if (btn) btn.disabled = selectedCount === 0;
		if (countSpan) countSpan.textContent = `選択中: ${selectedCount}`;
	};

	// チェック状態の同期
	const toggleCheck = (index, isChecked) => {
		fileResources[index].checked = isChecked;

		if (fileResources[index].pageCheckbox) {
			fileResources[index].pageCheckbox.checked = isChecked;
		}
		if (fileResources[index].listCheckbox) {
			fileResources[index].listCheckbox.checked = isChecked;
		}
		updateUI();
	};

	// 全選択/解除
	const toggleAll = () => {
		const anyUnchecked = fileResources.some(f => !f.checked);
		const newState = anyUnchecked;

		fileResources.forEach((f, i) => {
			toggleCheck(i, newState);
		});
	};

	// ==========================================
	// 3. 描画・初期化処理
	// ==========================================

	const createSidebar = () => {
		if (document.getElementById('bd-sidebar')) return;

		const sidebar = document.createElement('div');
		sidebar.id = 'bd-sidebar';
		sidebar.innerHTML = `
            <div class="bd-sidebar-header">
                <h3>📥 ファイルリスト</h3>
                <button id="bd-btn-close" style="background:none;border:none;cursor:pointer;font-size:1.2rem;">×</button>
            </div>
            <div class="bd-sidebar-content" id="bd-file-list"></div>
            <div class="bd-sidebar-footer">
                <button id="bd-btn-select-all" class="bd-btn bd-btn-secondary">すべて選択 / 解除</button>
                <button id="bd-btn-download" class="bd-btn bd-btn-primary" disabled>ダウンロード</button>
                <div id="bd-selected-count" class="bd-status">選択中: 0</div>
                <div id="bd-status-msg" class="bd-status" style="color:#0f6cbf;"></div>
            </div>
        `;
		document.body.appendChild(sidebar);

		const toggleBtn = document.createElement('div');
		toggleBtn.id = 'bd-sidebar-toggle';
		toggleBtn.innerHTML = '＜';
		sidebar.after(toggleBtn);

		const toggleSidebar = () => {
			sidebar.classList.toggle('open');
			toggleBtn.innerHTML = sidebar.classList.contains('open') ? '＞' : '＜';
		};

		toggleBtn.addEventListener('click', toggleSidebar);
		document.getElementById('bd-btn-close').addEventListener('click', toggleSidebar);

		document.getElementById('bd-btn-select-all').addEventListener('click', toggleAll);
		document.getElementById('bd-btn-download').addEventListener('click', () => {
			const selected = fileResources.filter(f => f.checked);
			downloadFiles(selected);
		});
	};

	const scanAndInject = () => {
		const listContainer = document.getElementById('bd-file-list');
		if (!listContainer) return;

		listContainer.innerHTML = '';
		fileResources = [];

		// 対象：ファイルリソース
		const resources = document.querySelectorAll('li.modtype_resource');

		resources.forEach((activity, index) => {
			const link = activity.querySelector('a.aalink') || activity.querySelector('a');
			if (!link) return;

			const name = activity.querySelector('.instancename')?.textContent?.replace(' ファイル', '') || link.textContent;
			const url = link.href;

			// --- ページ内チェックボックスの作成 ---

			// 既にラッパーがある場合は一旦中身をリセットするか、再構築する
			// 既存のチェックボックスを削除
			const existingCb = activity.querySelector('.batch-download-checkbox');
			if (existingCb) {
				// ラッパーごと削除はせず、親が自分で作った bd-icon-wrapper ならそれも考慮するが、
				// DOM整合性を保つため、bd-icon-wrapperがあればアンラップ（元に戻す）してから再処理が理想だが、
				// 簡易的に、既存のチェックボックス要素だけ消して再作成する
				const wrapper = existingCb.closest('.bd-checkbox-wrapper');
				if (wrapper) wrapper.remove();
			}

			// 新しいチェックボックス作成
			const pageCheckbox = document.createElement('input');
			pageCheckbox.type = 'checkbox';
			pageCheckbox.className = 'batch-download-checkbox';

			const checkboxWrapper = document.createElement('div');
			checkboxWrapper.className = 'bd-checkbox-wrapper';
			checkboxWrapper.appendChild(pageCheckbox);
			checkboxWrapper.addEventListener('click', (e) => e.stopPropagation());

			// --- 挿入位置の修正（バグ修正版） ---
			// .activity-icon (アイコン要素) を探す
			const icon = activity.querySelector('.activity-icon');

			if (icon) {
				// すでに bd-icon-wrapper で包まれているか確認
				let container = icon.parentElement;
				if (!container.classList.contains('bd-icon-wrapper')) {
					// まだ包まれていない場合、新しいラッパーを作成
					container = document.createElement('div');
					container.className = 'bd-icon-wrapper';

					// アイコンの元の場所にラッパーを挿入
					icon.parentNode.insertBefore(container, icon);

					// アイコンをラッパーの中に移動
					container.appendChild(icon);

					// レイアウト崩れ防止：アイコンが持っていた align-self-start などのクラスがあれば
					// ラッパーにも適用して、上揃えなどを維持する
					if (icon.classList.contains('align-self-start')) {
						container.classList.add('align-self-start');
					}
				}

				// ラッパー内の先頭（アイコンの左）にチェックボックスを挿入
				// 重複防止のため、既存の .bd-checkbox-wrapper がないか確認
				if (!container.querySelector('.bd-checkbox-wrapper')) {
					container.insertBefore(checkboxWrapper, container.firstChild);
				} else {
					// すでにある場合は置き換える（イベントリスナー更新のため）
					container.querySelector('.bd-checkbox-wrapper').replaceWith(checkboxWrapper);
				}

			} else {
				// アイコンが見つからない場合（レアケース）はリンクの前に
				link.parentNode.insertBefore(checkboxWrapper, link);
			}

			// --- サイドバー内リストアイテム ---
			const listItem = document.createElement('div');
			listItem.className = 'bd-list-item';

			const listCheckbox = document.createElement('input');
			listCheckbox.type = 'checkbox';

			const label = document.createElement('span');
			label.textContent = name;
			label.title = name;

			listItem.appendChild(listCheckbox);
			listItem.appendChild(label);
			listContainer.appendChild(listItem);

			// --- データ登録 ---
			const resourceObj = {
				id: index,
				name: name,
				url: url,
				checked: false,
				pageCheckbox: pageCheckbox,
				listCheckbox: listCheckbox
			};

			pageCheckbox.addEventListener('change', (e) => toggleCheck(index, e.target.checked));
			listCheckbox.addEventListener('change', (e) => toggleCheck(index, e.target.checked));

			fileResources.push(resourceObj);
		});

		updateUI();
	};

	const init = () => {
		createSidebar();
		scanAndInject();
	};

	window.addEventListener('load', init);

	// Moodleの動的読み込み監視
	const observer = new MutationObserver((mutations) => {
		const shouldUpdate = mutations.some(m => m.target.classList && m.target.classList.contains('course-content'));
		if (shouldUpdate) {
			scanAndInject();
		}
	});

	const mainContent = document.getElementById('region-main') || document.body;
	observer.observe(mainContent, {childList: true, subtree: true});

	if (document.readyState === 'loading') {
		document.addEventListener('DOMContentLoaded', init);
	} else {
		init();
	}

})();
