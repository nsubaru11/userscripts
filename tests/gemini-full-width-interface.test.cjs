const assert = require('node:assert/strict');
const { readFileSync } = require('node:fs');
const { test } = require('node:test');
const { runInNewContext } = require('node:vm');

const source = readFileSync(require('node:path').join(__dirname,
	'../src/gemini-full-width-interface.user.js'), 'utf8');

// Minimal DOM doubles test observer routing and scheduling, not browser layout.
function element({ query = false, ignored = false, action = false, children = [] } = {}) {
	return {
		nodeType: 1, isConnected: true, parentElement: null, scans: 0,
		matches(selector) {
			if (selector === 'user-query-content') return query;
			if (selector === '.gemini-user-actions') return action;
			return ignored;
		},
		closest(selector) {
			return this.matches(selector) ? this : this.parentElement?.closest(selector) || null;
		},
		querySelectorAll(selector) {
			this.scans++;
			return selector === 'user-query-content' ? children : [];
		}
	};
}

function setup() {
	const history = Array.from({ length: 100 }, () => element({ query: true }));
	const root = element({ children: history });
	const frames = [];
	let callback;
	let style;
	const document = {
		documentElement: root,
		head: { appendChild(node) { style = node; } },
		getElementById() { return style; },
		createElement() { return {}; }
	};
	runInNewContext(source, {
		document, GM_getValue: (_, fallback) => fallback,
		GM_registerMenuCommand() {}, console: { log() {} },
		requestAnimationFrame: (fn) => frames.push(fn),
		MutationObserver: class {
			constructor(fn) { callback = fn; }
			observe() {}
		}
	});
	const flush = () => { while (frames.length) frames.shift()(); };
	flush();
	return { history, root, frames, flush, notify: (records) => callback(records),
		removeStyle: () => { style = null; }, getStyle: () => style };
}

const record = (target, addedNodes = [], removedNodes = []) => ({ target, addedNodes, removedNodes });

test('paste and response mutations do not rescan conversation history', () => {
	const state = setup();
	const editor = element({ ignored: true });
	state.notify(Array.from({ length: 5000 }, () => record(editor, [element()])));
	assert.equal(state.frames.length, 0);
	assert.equal(state.root.scans, 1);
	assert.ok(state.history.every((query) => query.scans === 1));
});

test('only the changed query is normalized, once per frame', () => {
	const state = setup();
	const target = state.history[50];
	state.notify(Array.from({ length: 100 }, () => record(target, [element()])));
	assert.equal(state.frames.length, 1);
	state.flush();
	assert.equal(target.scans, 2);
	assert.ok(state.history.filter((query) => query !== target).every((query) => query.scans === 1));
});

test('new conversations are discovered and detached ones are skipped', () => {
	const state = setup();
	const query = element({ query: true });
	const container = element({ children: [query] });
	query.parentElement = container;
	state.notify([record(state.root, [container]), record(container, [query])]);
	state.flush();
	assert.equal(container.scans, 1);
	assert.equal(query.scans, 1);
	state.notify([record(query, [element()])]);
	query.isConnected = false;
	state.flush();
	assert.equal(query.scans, 1);
});

test('own button moves and text-only changes do not schedule another frame', () => {
	const state = setup();
	const query = state.history[0];
	const actions = element({ action: true, ignored: true });
	const wrapper = element();
	wrapper.parentElement = actions;
	state.notify([record(query, [actions]), record(query, [], [wrapper]),
		record(actions, [wrapper]), record(query, [{ nodeType: 3 }])]);
	assert.equal(state.frames.length, 0);
});

test('leaving edit mode schedules normalization and removed styles are restored', () => {
	const state = setup();
	state.removeStyle();
	state.notify([record(state.history[0], [], [element()])]);
	assert.ok(state.getStyle());
	assert.equal(state.frames.length, 1);
	state.flush();
	assert.equal(state.history[0].scans, 2);
});

test('buttons stay untouched during editing and move only once after editing', () => {
	const state = setup();
	const query = state.history[0];
	let editing = true;
	let moves = 0;
	const wrappers = [{
		style: {}, className: 'buttons', classList: { contains: () => false },
		querySelector: () => ({})
	}];
	const wrapper = wrappers[0];
	const bubble = {};
	const actions = {
		previousSibling: bubble,
		appendChild(node) {
			moves++;
			node.parentElement = this;
			wrappers.splice(wrappers.indexOf(node), 1);
		}
	};
	const content = {
		querySelector(selector) {
			if (selector === 'form') return editing ? {} : null;
			if (selector === 'textarea') return null;
			if (selector === ':scope > [class*="user-query-bubble"]') return bubble;
			if (selector === ':scope > .gemini-user-actions') return actions;
			throw new Error(`Unexpected selector: ${selector}`);
		},
		querySelectorAll: () => wrappers
	};
	actions.parentElement = content;
	query.querySelectorAll = () => [content];
	const update = () => {
		state.notify([record(query, [element()])]);
		state.flush();
	};
	update();
	assert.equal(moves, 0);
	assert.deepEqual(wrapper.style, {});
	editing = false;
	update();
	assert.equal(moves, 1);
	assert.equal(wrapper.parentElement, actions);
	assert.deepEqual(wrapper.style, { opacity: '1', pointerEvents: 'auto', display: 'flex' });
	update();
	assert.equal(moves, 1);
});
