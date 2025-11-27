// Flip Book Logic
document.addEventListener('DOMContentLoaded', () => {
	const book = document.getElementById('book');
	const pages = Array.from(book.querySelectorAll('.page'));
	const backCover = pages[pages.length - 1];
	const nextBtn = document.getElementById('nextBtn');
	const prevBtn = document.getElementById('prevBtn');
	let isAnimating = false;

	// Inject edge element for thickness illusion
	pages.forEach(p => {
		if (!p.querySelector('.edge')) {
			const edge = document.createElement('div');
			edge.className = 'edge';
			p.appendChild(edge);
		}
	});

	let currentIndex = 0; // index of first unflipped page
	const maxIndex = pages.length - 1; // last page index (back cover)

	function updateButtons() {
		prevBtn.disabled = currentIndex === 0;
		nextBtn.disabled = currentIndex === maxIndex;
	}

	function updateZ() {
		// Flipped pages go below remaining stack; remaining pages descend
		pages.forEach((p, i) => {
			if (p.classList.contains('flipped')) {
				// Earlier flipped pages sit lowest
				p.style.zIndex = i; // increasing i means slightly higher but beneath unflipped
			} else {
				// Remaining pages stack above
				p.style.zIndex = (pages.length * 2) - i; // large separation
			}
		});
		// Ensure flipping page retains peak z during animation
		const anim = pages.find(p => p.classList.contains('animating'));
		if (anim) anim.style.zIndex = (pages.length * 100).toString();
		// Back cover interaction only when we've reached end
		if (currentIndex === maxIndex) {
			backCover.style.pointerEvents = 'auto';
			backCover.classList.add('at-end');
		} else {
			backCover.style.pointerEvents = 'none';
			backCover.classList.remove('at-end');
		}
	}

	function updateRemaining() {
		// Remaining (excluding already flipped & front cover flipped) for side block
		const remaining = Math.max(0, maxIndex - currentIndex);
		book.dataset.remaining = remaining.toString();
	}

	function updatePosition() {
		// Dynamically derive page width for centering logic
		const PAGE_WIDTH = pages[0].offsetWidth + 20; // include small gutter
		// Only shift when book is opened (front cover flipped) and revert when closed
		const offset = currentIndex > 0 ? PAGE_WIDTH / 2 : 0;
		book.style.transform = `translateX(${offset}px)`;
	}

	function flipForward() {
		if (isAnimating || currentIndex >= maxIndex) return;
		const page = pages[currentIndex];
		const wasClosed = currentIndex === 0;
		startAnimatedFlip(page, true, () => {
			currentIndex += 1;
			updateButtons();
			updateZ();
			updateRemaining();
			if (wasClosed) updatePosition(); // shift only on first opening flip
		});
	}

	function flipBackward() {
		if (isAnimating || currentIndex <= 0) return;
		const targetIndex = currentIndex - 1;
		const page = pages[targetIndex];
		startAnimatedFlip(page, false, () => {
			currentIndex = targetIndex;
			updateButtons();
			updateZ();
			updateRemaining();
			if (currentIndex === 0) updatePosition(); // revert shift only when fully closed
		});
	}

	// Clicking right half flips forward; left half flips back
	pages.forEach(page => {
		page.addEventListener('click', (e) => {
			if (isAnimating) return;
			const bounds = page.getBoundingClientRect();
			const x = e.clientX - bounds.left;
			// Special case: back cover right half closes (start backward) when fully open
			if (page === backCover && currentIndex === maxIndex) {
				if (x < bounds.width / 2) { // left half flips backward (normal)
					flipBackward();
				}
				return; // ignore right half while at end to avoid confusion
			}
			if (x > bounds.width / 2) {
				if (pages[currentIndex] === page) {
					flipForward();
				}
			} else {
				if (currentIndex > 0 && pages[currentIndex - 1] === page) {
					flipBackward();
				}
			}
		});
	});

	nextBtn.addEventListener('click', () => { if (!isAnimating) flipForward(); });
	prevBtn.addEventListener('click', () => { if (!isAnimating) flipBackward(); });

	// Keyboard navigation
	document.addEventListener('keydown', (e) => {
		if (isAnimating) return;
		if (e.key === 'ArrowRight') flipForward();
		else if (e.key === 'ArrowLeft') flipBackward();
	});

	// Initial state setup
	updateButtons();
	updateZ();
	updateRemaining();
	updatePosition(); // initial centering (closed state)

	// Elevate page during flip, then finalize
	function startAnimatedFlip(page, forward, finalize) {
		isAnimating = true;
		// Put page on top of everything
		page.style.zIndex = (pages.length * 50).toString();
		page.classList.add('animating');
		// trigger reflow for safety
		page.getBoundingClientRect();
		if (forward) {
			page.classList.add('flipped');
		} else {
			page.classList.remove('flipped');
		}
		// Listen for transform transition end
		const onEnd = (evt) => {
			if (evt.propertyName !== 'transform') return;
			page.classList.remove('animating');
			isAnimating = false;
			finalize();
			// ensure position settles after animation (in case of rapid chain)
			// mid-animation position unchanged unless opening/closing triggers above
		};
		page.addEventListener('transitionend', onEnd, { once: true });
	}
});
