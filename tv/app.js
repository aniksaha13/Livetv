// ===== Firebase Configuration (আপনার নিজের কনফিগ দিয়ে প্রতিস্থাপন করুন) =====
const firebaseConfig = {
    apiKey: "YOUR_API_KEY",
    authDomain: "YOUR_PROJECT.firebaseapp.com",
    databaseURL: "https://YOUR_PROJECT-default-rtdb.firebaseio.com",
    projectId: "YOUR_PROJECT",
    storageBucket: "YOUR_PROJECT.appspot.com",
    messagingSenderId: "YOUR_SENDER_ID",
    appId: "YOUR_APP_ID"
};

// Firebase Initialize
firebase.initializeApp(firebaseConfig);
const database = firebase.database();

// ===== DOM এলিমেন্টসমূহ =====
const video = document.getElementById('video');
const sidebar = document.getElementById('sidebar');
const controls = document.getElementById('controls');
const loader = document.getElementById('loaderOverlay');
const errorOverlay = document.getElementById('errorOverlay');
const fullscreenBtn = document.getElementById('fullscreen');
const mobileFsBtn = document.getElementById('mobileFsBtn');
const closeErrorBtn = document.getElementById('closeErrorBtn');
const list = document.getElementById('channelList') || document.getElementById('channelsContainer');

let timeout;
let hlsInstance = null;
let serverTimeOffset = 0;
let currentSelectedIndex = 0;
let channels = [];
let fullscreenState = 0;

// সার্ভার লিঙ্কসমূহ
const PREMIUM_SERVER_URL = "https://iptv.aboxbdix.workers.dev";
const IPTV_SERVER_URL = "https://iptv.aboxbdix.workers.dev";
const SECRET_KEY = "my_super_secret_tv_key_2026";

// প্রিমিয়াম চ্যানেল আইডি
const premiumChannelIds = [
    'A-Sports', 'Star-Sports-Select-1', 'star-Sports-Select-2',
    'Sony-Ten-1', 'Sony-Ten-2', 'Sony-Ten-5', 'STAR-SPORTS-1',
    'Star-Sports-2', 'colors-bangla', 'jalsha-movies-hd',
    'star-jalsa-hd', 'zee-bangla', 'BTV'
];

// ===== Firebase থেকে চ্যানেল লিস্ট লোড করা =====
async function fetchChannels() {
    try {
        const snapshot = await database.ref('channels').once('value');
        const data = snapshot.val();
        if (data && Array.isArray(data) && data.length > 0) {
            channels = data;
            console.log('✅ Firebase থেকে চ্যানেল লোড হয়েছে:', channels.length);
        } else {
            console.warn('⚠️ Firebase-এ কোনো চ্যানেল পাওয়া যায়নি, ফলব্যাক চ্যানেল ব্যবহার করা হচ্ছে।');
            // ফলব্যাক চ্যানেল (যদি Firebase-এ ডেটা না থাকে)
            channels = getFallbackChannels();
        }
    } catch (e) {
        console.error('❌ Firebase থেকে ডেটা আনতে ব্যর্থ:', e);
        showError();
        channels = getFallbackChannels();
    }
}

// ফলব্যাক চ্যানেল (যদি Firebase কাজ না করে)
function getFallbackChannels() {
    return [
        { "id": "ntv", "name": "NTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ntv.png" },
        { "id": "rtv", "name": "RTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/rtv.png" },
        { "id": "somoytv", "name": "Somoy TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/somoytv.png" },
        { "id": "channeli", "name": "Channel i", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channeli.png" }
    ];
}

// ===== অন্যান্য ফাংশন =====

// উন্নত মোবাইল ডিভাইস সনাক্তকরণ
function isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    const isTV = /tv|smarttv|googletv|appletv|tizen|webos|hbbtv|netcast|viera|firetv|boxee|rokutv|mediaroom|slcomm|digian|xtreamer/i.test(ua);
    if (isTV) return false;
    const isMobileUA = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua);
    const hasTouch = ('ontouchstart' in window) || (navigator.maxTouchPoints > 0);
    return isMobileUA && hasTouch && (window.innerWidth <= 768);
}

// নির্দিষ্ট পাথ ম্যাপিং
function getChannelPath(id) {
    const pathMap = {
        'colors-bangla': '/COLORS-BANGLA/index.fmp4.m3u8',
        'jalsha-movies-hd': '/JALSHA-MOVIES/index.fmp4.m3u8',
        'star-jalsa-hd': '/STAR-JALSHA/index.fmp4.m3u8',
        'zee-bangla': '/ZEE-BANGLA/index.fmp4.m3u8',
        'BTV': '/BTV/index.fmp4.m3u8'
    };
    return pathMap[id] || `/${id.toUpperCase()}/index.fmp4.m3u8`;
}

// আকামাই টাইম সিঙ্ক
async function syncServerTime() {
    try {
        const start = Date.now();
        const response = await fetch("https://time.akamai.com/");
        if (response.ok) {
            const text = await response.text();
            const serverTimeSec = parseInt(text.trim());
            if (!isNaN(serverTimeSec)) {
                const serverTimeMs = serverTimeSec * 1000;
                const localTimeMs = start + (Date.now() - start) / 2;
                serverTimeOffset = serverTimeMs - localTimeMs;
            }
        }
    } catch (e) {
        console.warn("Time sync error, using local clock.");
    }
}

// টোকেন জেনারেটর
function generateIPTVUrl(channelId) {
    const synchronizedTimeMs = Date.now() + serverTimeOffset;
    const timeInSeconds = Math.floor(synchronizedTimeMs / 1000);
    const hash = md5(channelId + timeInSeconds + SECRET_KEY).toLowerCase();
    return `${IPTV_SERVER_URL}/live/${channelId}.m3u8?token=${hash}&time=${timeInSeconds}`;
}

// চ্যানেল লিস্ট রেন্ডারিং
function buildChannelList() {
    if (!list) return;
    list.innerHTML = "";
    channels.forEach((ch, index) => {
        const div = document.createElement('div');
        div.className = 'channel-item';
        div.setAttribute('data-index', index);
        
        const logoUrl = ch.logo || 'https://via.placeholder.com/50?text=TV';
        div.innerHTML = `<span class="live-badge">LIVE</span><img src="${logoUrl}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/50?text=TV'"> <span class="channel-name">${ch.name}</span>`;
        
        div.onclick = () => {
            selectAndPlay(index);
        };
        list.appendChild(div);
    });
}

// চ্যানেল প্লে করা
async function selectAndPlay(index) {
    if (channels.length === 0) return;
    currentSelectedIndex = index;
    
    document.querySelectorAll('.channel-item').forEach((el, idx) => {
        el.classList.remove('active');
        if (idx === index) {
            el.classList.add('active');
            el.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
        }
    });
    
    hideError();
    showLoader(true);
    resetTimer();

    const channel = channels[index];
    const isPremium = premiumChannelIds.includes(channel.id);

    try {
        if (isPremium) {
            const channelPath = getChannelPath(channel.id);
            const response = await fetch(`${PREMIUM_SERVER_URL}/api/get-link?path=${encodeURIComponent(channelPath)}`);
            if (!response.ok) throw new Error('Premium API response failed');
            const serverData = await response.json();
            playHLS(serverData.link);
        } else {
            const iptvUrl = generateIPTVUrl(channel.id);
            playHLS(iptvUrl);
        }
    } catch (error) {
        console.warn("Selected server play failed. Attempting fallback to standard IPTV URL.", error);
        const fallbackUrl = generateIPTVUrl(channel.id);
        playHLS(fallbackUrl);
    }
}

// HLS প্লেব্যাক
function playHLS(url) {
    if (hlsInstance) {
        hlsInstance.destroy();
    }

    if (Hls.isSupported()) {
        hlsInstance = new Hls({ 
            maxMaxBufferLength: 10, 
            enableWorker: true,
            lowLatencyMode: true 
        });
        hlsInstance.loadSource(url);
        hlsInstance.attachMedia(video);
        
        hlsInstance.on(Hls.Events.ERROR, function (event, data) {
            if (data.fatal) {
                showError();
            }
        });
        
        video.play()
            .then(() => { video.muted = false; })
            .catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play()
            .then(() => { video.muted = false; })
            .catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
    }
}

// অটোপ্লে সাউন্ড ইম্প্রুভ
function enableAutoplaySound() {
    const handleFirstInteraction = () => {
        if (video && video.muted) {
            video.muted = false;
            video.volume = 1.0;
            const volInput = document.getElementById('volume');
            if (volInput) volInput.value = 1.0;
        }
        document.removeEventListener('click', handleFirstInteraction);
        document.removeEventListener('touchstart', handleFirstInteraction);
    };
    document.addEventListener('click', handleFirstInteraction);
    document.addEventListener('touchstart', handleFirstInteraction);
}

// ইভেন্ট লিসেনার
if (video) {
    video.addEventListener('waiting', () => showLoader(true));
    video.addEventListener('playing', () => { showLoader(false); hideError(); });
    video.addEventListener('error', () => showError());
}

function showLoader(status) {
    if (loader) loader.style.display = status ? 'flex' : 'none';
}
function showError() {
    showLoader(false);
    if (errorOverlay) errorOverlay.style.display = 'flex';
}
function hideError() {
    if (errorOverlay) errorOverlay.style.display = 'none';
}

// অ্যাপ স্টার্ট
async function autoStartApp() {
    if (video) {
        video.muted = false;
        video.volume = 1.0;
    }
    const volInput = document.getElementById('volume');
    if (volInput) volInput.value = 1.0;

    enableAutoplaySound();
    await syncServerTime();
    await fetchChannels();   // Firebase থেকে ডেটা নেয়া হবে
    buildChannelList();     // চ্যানেল লিস্ট রেন্ডার
    if (channels.length > 0) {
        selectAndPlay(0);      
    }
    resetTimer();
}

window.addEventListener('DOMContentLoaded', () => {
    autoStartApp();
});

// রিমোট কন্ট্রোল অটো-হাইড
function resetTimer() {
    const isPortrait = isMobileDevice() && window.innerHeight > window.innerWidth && !document.fullscreenElement;
    
    if (sidebar && !isPortrait) sidebar.classList.remove('hidden');
    if (controls) controls.classList.remove('hidden');
    if (mobileFsBtn) mobileFsBtn.classList.remove('hidden');

    clearTimeout(timeout);
    timeout = setTimeout(() => {
        if (sidebar && !isPortrait) sidebar.classList.add('hidden');
        if (controls) controls.classList.add('hidden');
        if (mobileFsBtn) mobileFsBtn.classList.add('hidden');
    }, 4000);
}

if (video) video.addEventListener('click', resetTimer);
document.addEventListener('mousemove', resetTimer);
document.addEventListener('touchstart', resetTimer);

// কীবোর্ড শর্টকাট
document.addEventListener('keydown', (e) => {
    if (errorOverlay && errorOverlay.style.display === 'flex') {
        if (e.key === 'ArrowDown' || e.key === 'ArrowUp' || e.key === 'Escape') {
            hideError();
        }
    }
    if (channels.length === 0) return;

    if (e.key === 'ArrowDown') {
        e.preventDefault();
        currentSelectedIndex = (currentSelectedIndex + 1) % channels.length;
        selectAndPlay(currentSelectedIndex);
    } 
    else if (e.key === 'ArrowUp') {
        e.preventDefault();
        currentSelectedIndex = (currentSelectedIndex - 1 + channels.length) % channels.length;
        selectAndPlay(currentSelectedIndex);
    } 
    else if (e.key === 'ArrowRight') {
        e.preventDefault();
        if (video) {
            const currentVol = video.volume;
            const newVol = Math.min(1.0, currentVol + 0.1);
            video.volume = Number(newVol.toFixed(1)); 
            video.muted = false;
            const volInput = document.getElementById('volume');
            if (volInput) volInput.value = video.volume;
        }
        resetTimer();
    } 
    else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        if (video) {
            const currentVol = video.volume;
            const newVol = Math.max(0.0, currentVol - 0.1);
            video.volume = Number(newVol.toFixed(1));
            video.muted = (video.volume === 0);
            const volInput = document.getElementById('volume');
            if (volInput) volInput.value = video.volume;
        }
        resetTimer();
    }
    else if (e.key === 'Enter') {
        e.preventDefault();
        handleFullscreenCycle();
    }
});

// ফুলস্ক্রিন টগল
async function handleFullscreenCycle() {
    const wrapper = document.getElementById('playerWrapper');
    if (!wrapper || !video) return;

    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        try {
            if (wrapper.requestFullscreen) {
                await wrapper.requestFullscreen();
            } else if (wrapper.webkitRequestFullscreen) {
                await wrapper.webkitRequestFullscreen();
            }
            if (screen.orientation && screen.orientation.lock) {
                await screen.orientation.lock('landscape').catch(() => {});
            }
            video.style.setProperty('object-fit', 'contain', 'important');
            fullscreenState = 1;
        } catch (err) {
            console.error("Fullscreen entry failed:", err);
        }
    } else if (fullscreenState === 1) {
        video.style.setProperty('object-fit', 'fill', 'important');
        fullscreenState = 2;
    } else {
        if (document.exitFullscreen) {
            await document.exitFullscreen().catch(() => {});
        } else if (document.webkitExitFullscreen) {
            await document.webkitExitFullscreen().catch(() => {});
        }
        video.style.setProperty('object-fit', 'contain', 'important');
        fullscreenState = 0;
    }
}

const releaseOrientation = () => {
    if (!document.fullscreenElement && !document.webkitFullscreenElement) {
        if (screen.orientation && screen.orientation.unlock) {
            screen.orientation.unlock();
        }
        if (video) video.style.setProperty('object-fit', 'contain', 'important');
        fullscreenState = 0;
    }
};
document.addEventListener('fullscreenchange', releaseOrientation);
document.addEventListener('webkitfullscreenchange', releaseOrientation);

// ভলিউম স্লাইডার
const volumeSlider = document.getElementById('volume');
if (volumeSlider) {
    volumeSlider.oninput = (e) => {
        if (video) {
            video.volume = e.target.value;
            video.muted = e.target.value == 0;
        }
    };
}

if (fullscreenBtn) fullscreenBtn.onclick = handleFullscreenCycle;
if (mobileFsBtn) mobileFsBtn.onclick = handleFullscreenCycle;
if (closeErrorBtn) closeErrorBtn.onclick = hideError;

// সিকিউরিটি
document.addEventListener('contextmenu', function(e) {
    e.preventDefault();
});
document.addEventListener('keydown', function(e) {
    if (e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && e.key === 'u' || e.ctrlKey && e.key === 'U')) {
        e.preventDefault();
        return false;
    }
});

console.log('✅ ABOX BDIX অ্যাপ সফলভাবে লোড হয়েছে!');
