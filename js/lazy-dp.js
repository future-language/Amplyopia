(() => {
	let lazyApp = null;
	let lazyDb = null;

	function initLazyFirebase() {
		try {
			if (!window.firebase) return;
			if (lazyApp && lazyDb) return;
			const cfg = window.LAZY_FIREBASE_CONFIG || null;
			if (!cfg || !cfg.apiKey || !cfg.projectId) {
				console.warn('Lazy-eye Firebase config missing. Lazy game results will be stored locally.');
				return;
			}
			// Use a named app so it doesn't clash with the vision-test Firebase app
			lazyApp = window.firebase.initializeApp(cfg, 'lazy-eye');
			lazyDb = window.firebase.firestore(lazyApp);
		} catch (e) {
			console.warn('Lazy-eye Firebase init failed:', e);
		}
	}

	async function saveLazySessionResult(payload) {
		try {
			if (!lazyDb) {
				// Fallback to local storage history
				const history = JSON.parse(localStorage.getItem('lazySessionsHistory') || '[]');
				history.push(payload);
				localStorage.setItem('lazySessionsHistory', JSON.stringify(history));
				return { ok: true, local: true };
			}
			const col = lazyDb.collection('lazySessions');
			const docRef = await col.add(payload);
			return { ok: true, id: docRef.id };
		} catch (e) {
			console.warn('Saving lazy-eye session to Firestore failed, falling back to local:', e);
			const history = JSON.parse(localStorage.getItem('lazySessionsHistory') || '[]');
			history.push(payload);
			localStorage.setItem('lazySessionsHistory', JSON.stringify(history));
			return { ok: true, local: true };
		}
	}

	async function getLatestLazySession() {
		// Try Firestore first
		try {
			if (lazyDb) {
				const col = lazyDb.collection('lazySessions');
				const snap = await col.orderBy('when', 'desc').limit(1).get();
				if (!snap.empty) {
					const doc = snap.docs[0];
					return { id: doc.id, ...doc.data() };
				}
			}
		} catch (e) {
			console.warn('Reading lazy-eye sessions from Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage history
		try {
			const history = JSON.parse(localStorage.getItem('lazySessionsHistory') || '[]');
			if (Array.isArray(history) && history.length > 0) {
				return history[history.length - 1];
			}
		} catch (e) {
			console.warn('Reading local lazySessionsHistory failed:', e);
		}
		return null;
	}

	// Expose minimal API
	window.LazyDB = { initLazyFirebase, saveLazySessionResult, getLatestLazySession };

	// Initialize on load (best-effort)
	window.addEventListener('load', initLazyFirebase);
})();



