(() => {
	let app = null;
	let db = null;

	function initFirebase() {
		try {
			if (!window.firebase) return;
			if (app && db) return;
			const cfg = window.FIREBASE_CONFIG || null;
			if (!cfg || !cfg.apiKey || !cfg.projectId) {
				console.warn('Firebase config missing. Results will be stored locally.');
				return;
			}
			app = window.firebase.initializeApp(cfg);
			db = window.firebase.firestore();
		} catch (e) {
			console.warn('Firebase init failed:', e);
		}
	}

	async function saveVisionResult(payload) {
		try {
			// Get patient name and age from localStorage (set in step 2 of wizard)
			const patientName = localStorage.getItem('userName') || '';
			const patientAge = localStorage.getItem('userAge') || '';
			
			console.log('Saving vision result with patient info:', { patientName, patientAge });
			
			// Add patient information to payload
			const fullPayload = {
				...payload,
				patientName: patientName,
				patientAge: patientAge
			};
			
			console.log('Full payload to save:', fullPayload);
			
			if (!db) {
				console.log('Firebase not initialized, saving to local storage only');
				// Fallback to local storage history
				const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
				history.push(fullPayload);
				localStorage.setItem('visionHistory', JSON.stringify(history));
				console.log('Saved to local storage with patient name:', patientName);
				return { ok: true, local: true };
			}
			
			console.log('Saving to Firestore...');
			const col = db.collection('visionTests');
			const docRef = await col.add(fullPayload);
			console.log('✅ Successfully saved to Firestore with ID:', docRef.id, 'Patient Name:', patientName);
			return { ok: true, id: docRef.id };
		} catch (e) {
			console.warn('Saving to Firestore failed, falling back to local:', e);
			const patientName = localStorage.getItem('userName') || '';
			const patientAge = localStorage.getItem('userAge') || '';
			const fullPayload = {
				...payload,
				patientName: patientName,
				patientAge: patientAge
			};
			console.log('Saving to local storage (fallback) with patient name:', patientName);
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			history.push(fullPayload);
			localStorage.setItem('visionHistory', JSON.stringify(history));
			return { ok: true, local: true };
		}
	}

	async function getLatestVisionResult() {
		// Try Firestore first
		try {
			if (db) {
				const col = db.collection('visionTests');
				const snap = await col.orderBy('when', 'desc').limit(1).get();
				if (!snap.empty) {
					const doc = snap.docs[0];
					return { id: doc.id, ...doc.data() };
				}
			}
		} catch (e) {
			console.warn('Reading from Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage history
		try {
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			if (Array.isArray(history) && history.length > 0) {
				return history[history.length - 1];
			}
		} catch (e) {
			console.warn('Reading local visionHistory failed:', e);
		}
		return null;
	}

	async function getVisionResultsByPatientName(patientName) {
		if (!patientName || patientName.trim() === '') {
			return [];
		}
		
		const searchName = patientName.trim().toLowerCase();
		console.log('Searching for patient name:', searchName);
		
		// Try Firestore first
		try {
			if (db) {
				const col = db.collection('visionTests');
				// Get all documents ordered by when (desc) and filter by name in JavaScript
				// This avoids needing a composite index
				const snap = await col.orderBy('when', 'desc').get();
				
				// Filter for exact case-insensitive match
				const results = [];
				snap.forEach(doc => {
					const data = doc.data();
					const patientNameLower = data.patientName ? data.patientName.toLowerCase() : '';
					console.log('Checking document:', { id: doc.id, patientName: data.patientName, matches: patientNameLower === searchName });
					if (patientNameLower === searchName) {
						results.push({ id: doc.id, ...data });
					}
				});
				console.log('Firestore search results:', results.length);
				return results;
			}
		} catch (e) {
			console.warn('Searching Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage history
		try {
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			console.log('Local history length:', history.length);
			if (Array.isArray(history)) {
				const results = history
					.map((item, index) => ({ ...item, id: item.id || `local-${index}` }))
					.filter(item => {
						const itemName = item.patientName ? item.patientName.toLowerCase() : '';
						const matches = itemName === searchName;
						console.log('Checking local item:', { index, patientName: item.patientName, matches });
						return matches;
					});
				// Sort by date descending
				results.sort((a, b) => {
					const dateA = new Date(a.when || 0);
					const dateB = new Date(b.when || 0);
					return dateB - dateA;
				});
				console.log('Local search results:', results.length);
				return results;
			}
		} catch (e) {
			console.warn('Reading local visionHistory failed:', e);
		}
		return [];
	}

	async function getVisionResultById(resultId) {
		// Try Firestore first
		try {
			if (db && resultId) {
				const doc = await db.collection('visionTests').doc(resultId).get();
				if (doc.exists) {
					return { id: doc.id, ...doc.data() };
				}
			}
		} catch (e) {
			console.warn('Reading from Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage history
		try {
			const history = JSON.parse(localStorage.getItem('visionHistory') || '[]');
			if (Array.isArray(history)) {
				const result = history.find(item => item.id === resultId);
				if (result) return result;
			}
		} catch (e) {
			console.warn('Reading local visionHistory failed:', e);
		}
		return null;
	}

	async function clearAllVisionResults() {
		try {
			// Clear local storage
			localStorage.removeItem('visionHistory');
			
			// Try to clear Firestore (this may require admin rules or may not work depending on security rules)
			if (db) {
				try {
					const col = db.collection('visionTests');
					const snap = await col.get();
					
					// Delete each document
					const deletePromises = [];
					snap.forEach(doc => {
						deletePromises.push(col.doc(doc.id).delete());
					});
					
					await Promise.all(deletePromises);
					console.log(`Deleted ${deletePromises.length} documents from Firestore`);
				} catch (firestoreError) {
					console.warn('Could not delete from Firestore (may require admin privileges):', firestoreError);
					// Continue even if Firestore deletion fails - local storage is cleared
				}
			}
			
			return { ok: true, message: 'All vision test data cleared successfully' };
		} catch (e) {
			console.error('Error clearing vision test data:', e);
			return { ok: false, message: 'Error clearing data: ' + e.message };
		}
	}

	// Expose minimal API
	window.VisionDB = { 
		initFirebase, 
		saveVisionResult, 
		getLatestVisionResult,
		getVisionResultsByPatientName,
		getVisionResultById,
		clearAllVisionResults
	};

	// ---- Lazy-eye project helpers (use separate Firebase app) ----
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
			lazyApp = window.firebase.initializeApp(cfg, 'lazy-eye');
			lazyDb = window.firebase.firestore(lazyApp);
		} catch (e) {
			console.warn('Lazy-eye Firebase init failed:', e);
		}
	}

	async function saveLazySessionResult(payload) {
		try {
			// Ensure patient name and age are included (might already be in payload from lazytest/script.js)
			if (!payload.patientName || !payload.patientAge) {
				const patientName = localStorage.getItem('userName') || '';
				const patientAge = localStorage.getItem('userAge') || '';
				payload.patientName = payload.patientName || patientName;
				payload.patientAge = payload.patientAge || patientAge;
			}
			
			if (!lazyDb) {
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

	async function getLazySessionsByPatientName(patientName) {
		if (!patientName || patientName.trim() === '') {
			return [];
		}
		
		const searchName = patientName.trim().toLowerCase();
		
		// Try Firestore first
		try {
			if (lazyDb) {
				const col = lazyDb.collection('lazySessions');
				const snap = await col.orderBy('when', 'desc').get();
				
				const results = [];
				snap.forEach(doc => {
					const data = doc.data();
					const patientNameLower = data.patientName ? data.patientName.toLowerCase() : '';
					if (patientNameLower === searchName) {
						results.push({ id: doc.id, ...data });
					}
				});
				return results;
			}
		} catch (e) {
			console.warn('Searching lazy sessions from Firestore failed, falling back to local:', e);
		}

		// Fallback to local storage
		try {
			const history = JSON.parse(localStorage.getItem('lazySessionsHistory') || '[]');
			if (Array.isArray(history)) {
				const results = history
					.map((item, index) => ({ ...item, id: item.id || `local-lazy-${index}` }))
					.filter(item => {
						const itemName = item.patientName ? item.patientName.toLowerCase() : '';
						return itemName === searchName;
					});
				results.sort((a, b) => {
					const dateA = new Date(a.when || 0);
					const dateB = new Date(b.when || 0);
					return dateB - dateA;
				});
				return results;
			}
		} catch (e) {
			console.warn('Reading local lazySessionsHistory failed:', e);
		}
		return [];
	}

	async function getLatestLazySession() {
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

	async function clearAllLazySessions() {
		try {
			// Clear local storage
			localStorage.removeItem('lazySessionsHistory');
			
			// Try to clear Firestore (this may require admin rules or may not work depending on security rules)
			if (lazyDb) {
				try {
					const col = lazyDb.collection('lazySessions');
					const snap = await col.get();
					
					// Delete each document
					const deletePromises = [];
					snap.forEach(doc => {
						deletePromises.push(col.doc(doc.id).delete());
					});
					
					await Promise.all(deletePromises);
					console.log(`Deleted ${deletePromises.length} lazy eye session documents from Firestore`);
				} catch (firestoreError) {
					console.warn('Could not delete lazy sessions from Firestore (may require admin privileges):', firestoreError);
					// Continue even if Firestore deletion fails - local storage is cleared
				}
			}
			
			return { ok: true, message: 'All lazy eye session data cleared successfully' };
		} catch (e) {
			console.error('Error clearing lazy eye session data:', e);
			return { ok: false, message: 'Error clearing lazy eye data: ' + e.message };
		}
	}

	window.LazyDB = { 
		initLazyFirebase, 
		saveLazySessionResult, 
		getLatestLazySession, 
		getLazySessionsByPatientName,
		clearAllLazySessions
	};

	// Initialize on load
	window.addEventListener('load', initFirebase);
})();


