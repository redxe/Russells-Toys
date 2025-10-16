document.addEventListener('DOMContentLoaded', () => {
    const crown = document.querySelector('.crown');

    const btn1 = document.getElementById('btn1');
    const btn2 = document.getElementById('btn2');
    const btn3 = document.getElementById('btn3');
    const btn4 = document.getElementById('btn4');
    const btn5 = document.getElementById('btn5');
    const btn6 = document.getElementById('btn6');
    const btn7 = document.getElementById('btn7');
    const btn8 = document.getElementById('btn8');
    const btn9 = document.getElementById('btn9');
    const btn10 = document.getElementById('btn10');

    const helloKitty = document.getElementById('hello-kitty-img');
    const kpopCat = document.getElementById('kpop-cat-img');
    const jackSkellington = document.getElementById('jack-skellington-img');
    const thomasTheTrain = document.getElementById('thomas-train-img');

    // Call this to set/reset the background image of #btn1
    window.setBtnBackground = (btn, url) => {
        if (!url) {
            btn.style.backgroundImage = '';
            btn.style.backgroundColor = '#00000055';
            return;
        }
        btn.style.backgroundImage = `url("${url}")`;
        btn.style.backgroundColor = 'transparent';
        btn.style.backgroundSize = 'cover';
        btn.style.backgroundPosition = 'center';
        btn.style.backgroundRepeat = 'no-repeat';
        btn.style.color = '#fff';
        btn.style.textShadow = '0 1px 2px rgba(0, 0, 0, 0.8)';
        btn.style.overflow = 'hidden';
        btn.innerText = '';
    };

    window.setBtnBackground(btn1, 'https://preview.redd.it/in-kpop-demon-hunters-2025-the-kpop-singers-are-allowed-to-v0-y90z6oh0kt9f1.jpeg?width=640&crop=smart&auto=webp&s=26a454dc55215d1e2db704e825c8ab0e066defc0');
    window.setBtnBackground(btn2, 'https://www.goldderby.com/wp-content/uploads/2025/08/kpop-demon-hunters.jpg');
    window.setBtnBackground(btn3, 'https://media.tenor.com/SPbvx93AUdkAAAAe/rumi-kpop-demon-hunters.png');
    window.setBtnBackground(btn4, 'https://ichef.bbci.co.uk/ace/ws/640/cpsprodpb/ad58/live/f096f370-5883-11f0-bdfb-73c69043696b.jpg.webp');
    window.setBtnBackground(btn5, 'https://i.guim.co.uk/img/media/f1b1c326ce1d90fb445ce359ebfa5e316087b636/473_0_1004_804/master/1004.jpg?width=465&dpr=1&s=none&crop=none');
    window.setBtnBackground(btn6, 'https://www.salon.com/app/uploads/2025/07/kpop-demon-hunters-netflix-10.jpg');
    window.setBtnBackground(btn7, 'https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcSlK7cRkl5xlNSa3vhSa1E-LMryhTeXe6b3Iw&s');
    window.setBtnBackground(btn8, 'https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEjyv4R68szipz_BHWCM93lIy7LqERT8R5IeG-NF0t0CwYzuBs2AR8zPi2S6em3K3fLFDLvMVBhIB6BaS19zCMbLoKDpJJkwcNz23OBYw2-63RzUIZwbLgjb-LJCtxwQ6fPZJncRz5epBUGP0xRcSX1RTrQVGW3EpqcfsqOEh7Ki10feCX0Oo7g2DtDMmuU/s782/Saja-Boys-KPop-Demon-Hunters-IMAGE-3.jpg');
    window.setBtnBackground(btn9, 'https://static0.polygonimages.com/wordpress/wp-content/uploads/2025/08/derp.jpg?q=49&fit=crop&w=825&dpr=2');
    window.setBtnBackground(btn10, 'https://mediaproxy.tvtropes.org/width/1200/https://static.tvtropes.org/pmwiki/pub/images/img_3514_1.jpeg');


    // Track the currently playing audio
    let currentAudio = null;
    let audioCtx = null; // fallback Web Audio beep

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

    // Function to stop any currently playing audio and play new one
    const playSound = (url) => {
        // Stop any existing audio
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

        // Fallback: short beep if no URL provided
        try {
            audioCtx = audioCtx || new(window.AudioContext || window.webkitAudioContext)();
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.type = 'sine';
            osc.frequency.value = 523.25; // C5
            osc.connect(gain);
            gain.connect(audioCtx.destination);

            const now = audioCtx.currentTime;
            gain.gain.setValueAtTime(0.0001, now);
            gain.gain.exponentialRampToValueAtTime(0.2, now + 0.02);
            gain.gain.exponentialRampToValueAtTime(0.0001, now + 0.5);

            setCrownPlaying(true);
            osc.start();
            osc.stop(now + 0.5);
            osc.onended = () => setCrownPlaying(false);
        } catch {
            setCrownPlaying(false);
        }
    };

    crown.addEventListener('click', () => {
        stopCurrent();
    });

    // Update event listeners to use the new function
    btn1.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/soda-pop-kpop-demon-hunters-saja-boys-mp3.mp3');
    });

    btn2.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/kpop-demon-hunters-golden.mp3');
    });

    btn3.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/kpop-demon-hunters-take-down.mp3');
    });

    btn4.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/jessinununana-1.mp3');
    });
    
    btn5.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/kpop-demon-hunters_u8VvaM4.mp3');
    });
    
    btn6.addEventListener('click', () => {
        // playSound('https://www.myinstants.com/media/sounds/takedown-pre-chorus.mp3');
        playSound('https://www.myinstants.com/media/sounds/jinu-giggle.mp3');
    });
    
    btn7.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/saja-boys-your-idol.mp3');
    });
    
    btn8.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/bts-money-money-money.mp3');
    });
    
    btn9.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/dudududududu.mp3');
    });
    
    btn10.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/saja-boys-mmmrah-but-clean.mp3');
    });

    helloKitty.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/hello-this-is-kitty.mp3');
    });

    kpopCat.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/angry4.mp3');
    });

    jackSkellington.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/jacks_lament_-_lyrics_mp3cut_3.mp3');
    });

    thomasTheTrain.addEventListener('click', () => {
        playSound('https://www.myinstants.com/media/sounds/thomas.mp3');
    });
});