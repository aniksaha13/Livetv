// DOM এলিমেন্টসমূহ
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
let fullscreenState = 0; // ০: নরমাল, ১: ফুলস্ক্রিন (ফিট ছাড়া), ২: ফুলস্ক্রিন (সম্পূর্ণ ফিট)

// চ্যানেল লিস্ট
const CHANNELS = [
  { "id": "ananda-tv", "name": "Ananda TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/anandatv.png" },
  { "id": "asian-tv", "name": "Asian TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/asiantv.png" },
  { "id": "atn-bangla", "name": "ATN Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/atnbangla.png" },
  { "id": "atn-bangla-uk", "name": "ATN Bangla UK", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/atnbanglauk.png" },
  { "id": "atn-news", "name": "ATN News", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/atnnews.png" },
  { "id": "ayna-tv", "name": "Ayna TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/aynatv.png" },
  { "id": "azan-tv-canada", "name": "Azan TV Canada", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/azantvcanada.png" },
  { "id": "akash-8-tv", "name": "AKASH 8 TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/aakash-aath-tv.png" },
  { "id": "colors-bangla", "name": "Colors Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Colors_Bangla.png" },
  { "id": "enter-10", "name": "ENTERR 10", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ENTERR_10.png" },
  { "id": "jalsha-movies-hd", "name": "Jalsha Movies", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/jalshamovies.png" },
  { "id": "kolkata-tv", "name": "Kolkata TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Kolkata_TV.png" },
  { "id": "rongeen-tv", "name": "Rongeen TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Rongeen_TV.png" },
  { "id": "star-jalsa-hd", "name": "Star Jalsha", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/starjalsha.png" },
  { "id": "tv9-bangla", "name": "TV9 Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/TV9_Bangla.png" },
  { "id": "zee-bangla", "name": "Zee Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/zeebangla.png" },
  { "id": "zee-24-ghanta", "name": "ZEE 24 GHANTA", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ZEE_24_GHANTA.png" },
  { "id": "banglavision", "name": "Banglavision", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/banglavision.png" },
  { "id": "bijoy-tv", "name": "BIJOY TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/BIJOY_TV_Logo_BD.png" },
  { "id": "boishakhi-tv", "name": "Boishakhi TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/boishakhitv.png" },
  { "id": "BTV", "name": "BTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/btv.png" },
  { "id": "sngsd-bangladesh", "name": "Sngsd Bangladesh", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/sngsd-bangladesh.png" },
  { "id": "channel-1", "name": "Channel 1", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channel1.png" },
  { "id": "channel-24", "name": "Channel 24", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channel24.png" },
  { "id": "channel-9", "name": "Channel 9", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channel9.png" },
  { "id": "channel-s-bd", "name": "Channel S BD", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channelsbd.png" },
  { "id": "channel-s-uk", "name": "Channel S UK", "logo":  "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channelsuk.png" },
  { "id": "channeli", "name": "Channel i", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/channeli.png" },
  { "id": "dbc-news", "name": "DBC News", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/dbcnews.png" },
  { "id": "deen-tv-uk", "name": "Deen TV UK", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/deentvuk.png" },
  { "id": "desh-tv", "name": "Desh TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/deshtv.png" },
  { "id": "deepto-tv", "name": "Deepto TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Deepto-TV.png" },
  { "id": "deshebideshe-tv-canada", "name": "Deshebideshe TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/deshebideshetv.png" },
  { "id": "deshi-tv", "name": "Deshi TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/deshitv.png" },
  { "id": "ekattor-tv", "name": "Ekattor TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ekattortv.png" },
  { "id": "ekhon-tv", "name": "Ekhon TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ekhontv.png" },
  { "id": "ekushey-tv", "name": "Ekushey TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ekusheytv.png" },
  { "id": "ep-tv", "name": "EP TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/eptv.png" },
  { "id": "galaxy-tv", "name": "Galaxy TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/galaxytv.png" },
  { "id": "gazi-television-gtv", "name": "GTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/gtv.png" },
  { "id": "g-series", "name": "G SERIES", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/G-SERIES.png" },
  { "id": "global-tv-bangladesh", "name": "Global TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/globaltv.png" },
  { "id": "green-tv", "name": "Green TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/greentv.png" },
  { "id": "iqra-bangla-tv-uk", "name": "Iqra Bangla TV UK", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/iqrabanglatvuk.png" },
  { "id": "islam-ch-bangla", "name": "Islam Ch Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/islamchbangla.png" },
  { "id": "jago-news-24", "name": "Jago News 24", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/jagonews24.png" },
  { "id": "jamuna", "name": "Jamuna", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/jamuna.png" },
  { "id": "madani-ch-bangla", "name": "Madani Ch Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/madanichbangla.png" },
  { "id": "makkah-live", "name": "Makkah Live", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/makkahlive.png" },
  { "id": "makkah-tv", "name": "Makkah TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/makkahtv.png" },
  { "id": "maasranga-tv", "name": "Maasranga TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Maasranga_TV.png" },
  { "id": "medina-live", "name": "Medina Live", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/medinalive.png" },
  { "id": "mohona-tv", "name": "Mohona TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/mohonatv.png" },
  { "id": "movie-bangla", "name": "Movie Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/moviebangla.png" },
  { "id": "my-tv", "name": "MY TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/mytv.png" },
  { "id": "news24-tv", "name": "News 24 TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/news24tv.png" },
  { "id": "nexus-tv", "name": "Nexus TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/nexustv.png" },
  { "id": "ntv", "name": "NTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ntv.png" },
  { "id": "peace-tv-bangla", "name": "Peace TV Bangla", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/peacetvbangla.png" },
  { "id": "rtv", "name": "RTV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/rtv.png" },
  { "id": "rajdhani-tv", "name": "RAJDHANI TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/rajdhanitv.png" },
  { "id": "sa-tv", "name": "SA TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/satv.png" },
  { "id": "somoytv", "name": "Somoy TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/somoytv.png" },
  { "id": "star-news", "name": "STAR NEWS", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/STAR-NEWS.png" },
  { "id": "srk-tv", "name": "SRK TV", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/SRK-TV.png" },
  { "id": "T_Sports", "name": "T Sports", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/tsports.png" },
  { "id": "a-sports", "name": "A Sports", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/asports.png" },
  { "id": "Star_Spts_1", "name": "Star Sports 1", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/starsports1.png" },
  { "id": "Star_Sports_2", "name": "Star Sports 2", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/starsports2.png" },
  { "id": "Sony_Sports_Ten_1", "name": "Sony Sports Ten 1", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/sonysportsten1.png" },
  { "id": "Sony_Sports_Ten_2", "name": "Sony Sports Ten 2", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/sonysportsten2.png" },
  { "id": "Sony_Sports_Ten_5", "name": "Sony Sports Ten 5", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/sonysportsten5.png" },
  { "id": "Star-Sports-Select-1", "name": "Star Sports Select", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/Star-Sports-Select-1.png" },
  { "id": "star-Sports-Select-2", "name": "Star Sports Select 2", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/star-Sports-Select-2.png" },
  { "id": "Ten_Cricket_HD", "name": "Ten Cricket HD", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/tencrickethd.png" },
  { "id": "Ptv_sports", "name": "Ptv Sports", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/ptvsports.png" },
  { "id": "Fox_Sports_2", "name": "Fox Sports", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/foxsports.png" },
  { "id": "WILLOW_LIVE", "name": "WILLOW LIVE", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/willowlive.png" },
  { "id": "Bein_Sports_2", "name": "Bein Sports", "logo": "https://raw.githubusercontent.com/ryvoxtb/image/refs/heads/main/tv-chanel-logo/beinsports.png" }
];

// সার্ভার লিঙ্কসমূহ
const PREMIUM_SERVER_URL = "https://aboxbdix.mdabdullahsheikh017-924.workers.dev";
const IPTV_SERVER_URL = "https://aboxbdix-main-server.mdabdullahsheikh017-924.workers.dev";
const SECRET_KEY = "my_super_secret_tv_key_2026"; 

// প্রিমিয়াম চ্যানেলসমূহ
const premiumChannelIds = [ 'A-Sports', 'Star-Sports-Select-1', 'star-Sports-Select-2', 'Sony-Ten-1', 'Sony-Ten-2', 'Sony-Ten-5', 'STAR-SPORTS-1', 'Star-Sports-2', 'colors-bangla', 'jalsha-movies-hd', 'star-jalsa-hd', 'zee-bangla', 'BTV'];

// উন্নত মোবাইল ও স্মার্ট টিভি ডিভাইস সনাক্তকরণ
function isMobileDevice() {
    const ua = navigator.userAgent.toLowerCase();
    
    // অ্যান্ড্রয়েড টিভি, ফায়ার টিভি, বা যেকোনো স্মার্ট টিভি ডিটেক্ট করা
    const isTV = /tv|smarttv|googletv|appletv|tizen|webos|hbbtv|netcast|viera|firetv|boxee|rokutv|mediaroom|slcomm|digian|xtreamer/i.test(ua);
    if (isTV) return false; // টিভি হলে মোবাইল লেআউট ব্যবহার করবে না
    
    // শুধুমাত্র মোবাইল ফোন এবং ট্যাবলেট
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

// চ্যানেল ডাটা লোড করা
async function fetchChannels() {
    try {
        channels = CHANNELS;
    } catch (e) {
        console.error(e);
        showError();
    }
}

// আকামাই সার্ভার টাইম ট্র্যাকিং
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

// টোকেন ও লিংক জেনারেটর
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
        div.innerHTML = `<img src="${logoUrl}" alt="${ch.name}" onerror="this.src='https://via.placeholder.com/50?text=TV'"> <span>${ch.name}</span>`;
        
        div.onclick = () => {
            selectAndPlay(index);
        };
        list.appendChild(div);
    });
}

// চ্যানেল প্লে করার মূল ফাংশন
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

// HLS ভিডিও প্লেব্যাক সিস্টেম (অটোপ্লে ব্লকিং প্রতিরোধের জন্য মডিফাইড)
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
        
        // প্রথমে স্বাভাবিকভাবে প্লে করার চেষ্টা করবে, ব্রাউজার ব্লক করলে মিউটেড অবস্থায় প্লে করবে
        video.play()
            .then(() => {
                video.muted = false;
            })
            .catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
    } else if (video.canPlayType('application/vnd.apple.mpegurl')) {
        video.src = url;
        video.play()
            .then(() => {
                video.muted = false;
            })
            .catch(() => {
                video.muted = true;
                video.play().catch(() => {});
            });
    }
}

// ব্রাউজারে ব্যবহারকারীর প্রথম স্পর্শ/ক্লিকেই অডিও স্বয়ংক্রিয়ভাবে চালু করার ট্রিগার
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

// ইভেন্ট লিসেনারস
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

// অ্যাপ অটো স্টার্ট
async function autoStartApp() {
    if (video) {
        video.muted = false;
        video.volume = 1.0;
    }
    const volInput = document.getElementById('volume');
    if (volInput) volInput.value = 1.0;

    enableAutoplaySound(); // সাউন্ড পলিসি বাইপাস ফাংশন অ্যাক্টিভেট করা হলো
    await syncServerTime();
    await fetchChannels(); 
    buildChannelList();    
    if (channels.length > 0) {
        selectAndPlay(0);      
    }
    resetTimer();
}

window.addEventListener('DOMContentLoaded', () => {
    autoStartApp();
});

// রিমোট কন্ট্রোল, মোবাইল বাটন এবং সাইডবার অটো-হাইড লজিক
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

// কীবোর্ড এবং টিভির রিমোট কন্ট্রোল বাইন্ডিংস
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

// ডাবল স্টেজ ফুলস্ক্রিন ও অটো-রোটেশন মেকানিজম (Contain -> Stretch -> Normal)
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

// ওরিয়েন্টেশন ও ফুলস্ক্রিন স্টেজ রিলিজ লিসেনার
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

// স্লাইডার ভলিউম ইভেন্ট
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

// সিকিউরিটি বাইন্ডিং
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