document.addEventListener('DOMContentLoaded', () => {
    const crown = document.querySelector('.crown');
    const tabs = document.querySelectorAll('.sound-tab');

    const buttons = [
        document.getElementById('btn1'),
        document.getElementById('btn2'),
        document.getElementById('btn3'),
        document.getElementById('btn4'),
        document.getElementById('btn5'),
        document.getElementById('btn6'),
        document.getElementById('btn7'),
        document.getElementById('btn8'),
        document.getElementById('btn9'),
        document.getElementById('btn10')
    ];

    const helloKitty = document.getElementById('hello-kitty-img');
    const kpopCat = document.getElementById('kpop-cat-img');
    const jackSkellington = document.getElementById('jack-skellington-img');
    const thomasTheTrain = document.getElementById('thomas-train-img');

    // Helper: set/reset background image for a button
    window.setBtnBackground = (btn, url) => {
        if (!url) {
            btn.style.backgroundImage = '';
            btn.style.backgroundColor = '#00000055';
            btn.style.color = 'white';
            btn.innerText = '—';
            return;
        }
        btn.style.backgroundImage = `url("${url}")`;
        btn.style.backgroundColor = 'transparent';
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';
        btn.style.backgroundRepeat = 'no-repeat';
        btn.style.color = '#fff';
        btn.style.textShadow = '0 1px 2px rgba(0,0,0,0.8)';
        btn.style.overflow = 'hidden';
        btn.innerText = '';
    };

    // Will be loaded from external JSON
    let soundSets = {};

    // Audio tracking
    let currentAudio = null;
    let audioCtx = null;

    const setCrownPlaying = (playing) => {
        if (!crown) return;
        crown.classList.toggle('spinning', playing);
    };

    const stopCurrent = () => {
        if (currentAudio) {
            currentAudio.pause();
            currentAudio = null;
        }
        setCrownPlaying(false);
    };

    const playSound = (url) => {
        stopCurrent();
        if (url) {
            const audio = new Audio(url);
            audio.addEventListener('playing', () => setCrownPlaying(true));
            audio.addEventListener('pause', () => setCrownPlaying(false));
            audio.addEventListener('ended', () => setCrownPlaying(false));
            audio.play().catch(() => setCrownPlaying(false));
            currentAudio = audio;
            return;
        }
        // Fallback beep
        try {
            audioCtx = audioCtx || new (window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 523.25;
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            const now = audioCtx.currentTime;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.25, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.4);
            setCrownPlaying(true);
            osc.start();
            osc.stop(now + 0.4);
            osc.onended = () => setCrownPlaying(false);
        } catch {
            setCrownPlaying(false);
        }
    };

    // Load a sound set by name
    const loadSet = (name) => {
        const set = soundSets[name];
        if (!set) return;
        set.forEach((cfg, i) => {
            const btn = buttons[i];
            if (!btn) return;
            setBtnBackground(btn, cfg.bg);
            btn.onclick = () => playSound(cfg.sound);
        });
    };

    // Tab click handling
    tabs.forEach(tab => {
        tab.addEventListener('click', () => {
            if (tab.classList.contains('active')) return;
            tabs.forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            loadSet(tab.dataset.set);
        });
    });

    // Crown stops audio
    crown.addEventListener('click', stopCurrent);

    // Right-pane images keep existing sounds
    helloKitty.addEventListener('click', () => playSound('https://www.myinstants.com/media/sounds/hello-this-is-kitty.mp3'));
    kpopCat.addEventListener('click', () => playSound('https://www.myinstants.com/media/sounds/angry4.mp3'));
    jackSkellington.addEventListener('click', () => playSound('https://www.myinstants.com/media/sounds/jacks_lament_-_lyrics_mp3cut_3.mp3'));
    thomasTheTrain.addEventListener('click', () => playSound('https://www.myinstants.com/media/sounds/thomas.mp3'));

    // Fetch external JSON then load initial set
    fetch('/assets/soundSets.json')
        .then(r => r.json())
        .then(data => {
            soundSets = data;
            loadSet('set1');
        })
        .catch(() => {
            // Fallback: minimal inline set if fetch fails
            soundSets = { set1: buttons.map(() => ({ bg: null, sound: null })) };
            loadSet('set1');
        });
});