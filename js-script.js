import { initializeApp } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-app.js";
import { getDatabase, ref, set, get, child } from "https://www.gstatic.com/firebasejs/10.8.0/firebase-database.js";

// ফায়ারবেস কনফিগারেশন
const firebaseConfig = {
    apiKey: "AIzaSyBCpqt6OVooTsN__jWBlqbphaSVfkZDjR0",
    authDomain: "flawless-parity-486609-t3.firebaseapp.com",
    databaseURL: "https://flawless-parity-486609-t3-default-rtdb.firebaseio.com",
    projectId: "flawless-parity-486609-t3",
    storageBucket: "flawless-parity-486609-t3.firebasestorage.app",
    messagingSenderId: "121220208254",
    appId: "1:121220208254:web:bae0698f231f0881da6a2f",
    measurementId: "G-TY1D29X4JL"
};

// ফায়ারবেস ইনিশিয়ালাইজেশন
const app = initializeApp(firebaseConfig);
const db = getDatabase(app);

// সোর্স কোড সুরক্ষার জন্য রাইট-ক্লিক এবং কিবোর্ড শর্টকাট ব্লক করা
document.addEventListener('contextmenu', (e) => e.preventDefault());

document.addEventListener('keydown', (e) => {
    // F12, Ctrl+Shift+I, Ctrl+Shift+J, Ctrl+U, Ctrl+S ব্লক
    if (
        e.key === 'F12' || 
        (e.ctrlKey && e.shiftKey && (e.key === 'I' || e.key === 'J' || e.key === 'C')) || 
        (e.ctrlKey && (e.key === 'U' || e.key === 's' || e.key === 'S'))
    ) {
        e.preventDefault();
        return false;
    }
});

/* ========================================================
   ডিভাইস ফিঙ্গারপ্রিন্ট জেনারেশন
   ======================================================== */
function generateHardwareFingerprint() {
    const navigatorInfo = navigator.userAgent + navigator.language;
    const screenInfo = window.screen.width + "x" + window.screen.height + window.screen.colorDepth;
    const hardwareConcurrency = navigator.hardwareConcurrency || 4;
    
    const rawString = navigatorInfo + screenInfo + hardwareConcurrency;
    let hash = 0;
    for (let i = 0; i < rawString.length; i++) {
        const char = rawString.charCodeAt(i);
        hash = (hash << 5) - hash + char;
        hash = hash & hash;
    }
    return 'hw_' + Math.abs(hash);
}

function detectDeviceModel() {
    const ua = navigator.userAgent;
    if (/SmartTV|Tizen|WebOS|MapItem|AppleTV|Boxee|Kylo|Roku/i.test(ua)) return "Smart TV Platform";
    if (/android/i.test(ua)) {
        if (/mobile/i.test(ua)) return "Android Phone";
        return "Android TV / Tablet";
    }
    if (/iPad|iPhone|iPod/.test(ua)) return "iOS Device";
    if (/Windows/.test(ua)) return "Windows PC";
    if (/Macintosh/.test(ua)) return "Mac Device";
    return "Smart Device/Browser Container";
}

// এলিমেন্ট রেফারেন্স
const loginCard = document.getElementById('login-card');
const otpCard = document.getElementById('otp-card');
const loginBtn = document.getElementById('login-btn');
const whatsappInput = document.getElementById('whatsapp-number');
const otpInputs = document.querySelectorAll('.otp-input');

// কাস্টম অ্যালার্ট এলিমেন্ট রেফারেন্স
const customAlert = document.getElementById('custom-alert');
const alertTitle = document.getElementById('alert-title');
const alertMessage = document.getElementById('alert-message');
const alertOkBtn = document.getElementById('alert-ok-btn');

let generatedOTP = "";
let currentNumber = "";
const hardwareId = generateHardwareFingerprint();
const deviceModel = detectDeviceModel();

/* ========================================================
   ওয়ান-টাইম লগইন অটো-রিডাইরেক্ট ও স্প্ল্যাশ স্ক্রিন চেক
   ======================================================== */
const isLoggedIn = localStorage.getItem('isLoggedIn');

if (isLoggedIn === 'true') {
    // ব্যবহারকারী লগইন করা থাকলে সরাসরি হোম পেজে রিডাইরেক্ট হবে
    window.location.href = 'home-page/home.html';
} else {
    // লগইন করা না থাকলে স্প্ল্যাশ স্ক্রিন অ্যানিমেশনটি সম্পন্ন হবে
    window.addEventListener('DOMContentLoaded', () => {
        setTimeout(() => {
            const splash = document.getElementById('app-splash');
            if (splash) {
                splash.classList.add('splash-fade-out');
                setTimeout(() => {
                    splash.remove();
                    // প্রথম ইনপুট এলিমেন্টে ফোকাস সেট
                    if (whatsappInput) {
                        whatsappInput.focus();
                    }
                }, 800);
            }
        }, 3500);
    });
}

// কাস্টম অ্যালার্ট মডাল ফাংশন
let alertCallback = null;
function showAlert(title, message, callback = null) {
    alertTitle.innerText = title;
    alertMessage.innerText = message;
    customAlert.classList.remove('hidden');
    alertOkBtn.focus(); 
    alertCallback = callback;
}

// অ্যালার্ট বন্ধ করার ইভেন্ট
alertOkBtn.addEventListener('click', () => {
    customAlert.classList.add('hidden');
    if (alertCallback) {
        alertCallback();
        alertCallback = null;
    } else {
        whatsappInput.focus();
    }
});

// লগইন বাটন ইভেন্ট হ্যান্ডলার
loginBtn.addEventListener('click', async () => {
    currentNumber = whatsappInput.value.trim();
    
    if(currentNumber === "" || currentNumber.length < 10) {
        showAlert("ত্রুটি", "দয়া করে সঠিক WhatsApp নম্বরটি প্রদান করুন।");
        return;
    }

    try {
        const dbRef = ref(db);
        
        // সিকিউরিটি ১: ডিভাইস লক চেক
        const deviceSnapshot = await get(child(dbRef, `hardware_locks/${hardwareId}`));
        
        if (deviceSnapshot.exists()) {
            const lockedNumber = deviceSnapshot.val().number;
            if (lockedNumber !== currentNumber) {
                showAlert(
                    "Security Violation", 
                    "এই ডিভাইস থেকে ইতিমধ্যে অন্য একটি মোবাইল নম্বর নিবন্ধিত করা হয়েছে! আপনি এই ডিভাইসে নতুন কোনো নম্বর ব্যবহার করতে পারবেন না।"
                );
                return;
            }
        } else {
            // সিকিউরিটি ২: নম্বর লক চেক
            const numberSnapshot = await get(child(dbRef, `secure_users/${currentNumber}`));
            if (numberSnapshot.exists()) {
                const registeredHardware = numberSnapshot.val().hardwareId;
                if (registeredHardware !== hardwareId) {
                    showAlert(
                        "Security Violation", 
                        "এই মোবাইল নম্বরটি ইতিমধ্যে অন্য একটি ডিভাইসে ব্যবহার করা হয়েছে! এক অ্যাকাউন্টে কেবল একটি ডিভাইস অনুমোদিত।"
                    );
                    return;
                }
            }
        }

        // ওটিপি জেনারেশন
        generatedOTP = Math.floor(1000 + Math.random() * 9000).toString();
        
        loginCard.classList.add('hidden');
        otpCard.classList.remove('hidden');

        // অটোমেটিক ওটিপি ফিল-আপ অ্যানিমেশন
        setTimeout(() => {
            otpInputs.forEach((input, index) => {
                setTimeout(() => {
                    input.value = generatedOTP[index];
                    if(index === 3) {
                        setTimeout(() => executeFinalSecureLogin(), 800);
                    }
                }, index * 350); 
            });
        }, 1200);

    } catch (error) {
        console.error("Database connection issue: ", error);
        showAlert("সার্ভার ত্রুটি", "ডাটাবেজ সংযোগে সমস্যা হচ্ছে। অনুগ্রহ করে আবার চেষ্টা করুন।");
    }
});

// ফাইনাল সিকিউর সাবমিশন এবং রিডাইরেকশন
async function executeFinalSecureLogin() {
    let fetchedIp = "Unknown/VPN Protected";
    try {
        const res = await fetch('https://api.ipify.org?format=json');
        const data = await res.json();
        fetchedIp = data.ip;
    } catch(e) { console.log("IP detection blocked or failed"); }

    const finalPayload = {
        number: currentNumber,
        hardwareId: hardwareId,
        deviceModel: deviceModel,
        ipAddress: fetchedIp,
        loginTimestamp: new Date().toLocaleString()
    };

    try {
        await set(ref(db, 'secure_users/' + currentNumber), finalPayload);
        await set(ref(db, 'hardware_locks/' + hardwareId), { number: currentNumber });

        // সেশন সংরক্ষণ ও রিডাইরেক্ট
        localStorage.setItem('isLoggedIn', 'true');
        localStorage.setItem('userNumber', currentNumber);
        
        window.location.href = 'home-page/home.html';
    } catch (error) {
        showAlert("সংরক্ষণ ত্রুটি", "লগইন তথ্য সংরক্ষণ করা সম্ভব হয়নি। আবার চেষ্টা করুন।");
    }
}

/* ========================================================
   টিভি এবং রিমোট কন্ট্রোল কিবোর্ড নেভিগেশন ইঞ্জিন
   ======================================================== */
const focusableElements = [whatsappInput, loginBtn, alertOkBtn];
let currentFocusIndex = 0;

document.addEventListener('keydown', (e) => {
    if (!customAlert.classList.contains('hidden')) {
        if (e.key === 'Enter' || e.key === 'Ok' || e.keyCode === 13) {
            alertOkBtn.click();
            e.preventDefault();
        }
        return;
    }

    if (e.key === 'ArrowDown' || e.key === 'ArrowRight') {
        currentFocusIndex = (currentFocusIndex + 1) % 2; 
        focusableElements[currentFocusIndex].focus();
        e.preventDefault();
    } else if (e.key === 'ArrowUp' || e.key === 'ArrowLeft') {
        currentFocusIndex = (currentFocusIndex - 1 + 2) % 2;
        focusableElements[currentFocusIndex].focus();
        e.preventDefault();
    } else if (e.key === 'Enter' || e.keyCode === 13) {
        if (document.activeElement === whatsappInput) {
            loginBtn.click();
            e.preventDefault();
        }
    }
});