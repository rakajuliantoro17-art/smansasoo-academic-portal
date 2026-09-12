/*
==========================================================
SMANSASOO Graduation Portal
Utility Functions
Version : 2.0.0
==========================================================

Kumpulan fungsi utilitas yang digunakan oleh seluruh
modul aplikasi.

==========================================================
*/

window.Utils = (() => {

    /* ==================================================
       SELECTOR
    ================================================== */

    const $ = selector => document.querySelector(selector);

    const $$ = selector => document.querySelectorAll(selector);

    /* ==================================================
       STRING
    ================================================== */

    function trim(value) {

        return String(value ?? "").trim();

    }

    function capitalize(text) {

        if (!text) return "";

        return text
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

    }

    function escapeHTML(text) {

        return String(text ?? "")
            .replace(/&/g, "&amp;")
            .replace(/</g, "&lt;")
            .replace(/>/g, "&gt;")
            .replace(/"/g, "&quot;")
            .replace(/'/g, "&#39;");

    }

    /* ==================================================
       VALIDATION
    ================================================== */

    function isEmpty(value) {

        return trim(value) === "";

    }

    function isNumeric(value) {

        return /^\d+$/.test(trim(value));

    }

    function isNIS(value) {

        return /^\d{4,20}$/.test(trim(value));

    }

    function isNISN(value) {

        return /^\d{10}$/.test(trim(value));

    }

    /* ==================================================
       DATE
    ================================================== */

    function getCurrentYear() {

        return new Date().getFullYear();

    }

    function formatDate(dateString) {

        if (!dateString) return "-";

        return new Date(dateString).toLocaleDateString("id-ID", {

            day: "2-digit",

            month: "long",

            year: "numeric"

        });

    }

    /* ==================================================
       ASYNC
    ================================================== */

    function sleep(ms) {

        return new Promise(resolve => setTimeout(resolve, ms));

    }

    function debounce(callback, delay = 300) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                callback(...args);

            }, delay);

        };

    }

    /* ==================================================
       AUDIO
    ================================================== */

    function playAudio(audio) {

        if (!audio) return;

        audio.currentTime = 0;

        audio.play().catch(() => {});

    }

    function stopAudio(audio) {

        if (!audio) return;

        audio.pause();

        audio.currentTime = 0;

    }

    /* ==================================================
       COPY
    ================================================== */

    async function copy(text) {

        try {

            if (navigator.clipboard) {

                await navigator.clipboard.writeText(text);

                return true;

            }

            const input = document.createElement("textarea");

            input.value = text;

            document.body.appendChild(input);

            input.select();

            document.execCommand("copy");

            input.remove();

            return true;

        }

        catch {

            return false;

        }

    }

    /* ==================================================
       RANDOM ID
    ================================================== */

    function uuid() {

        if (window.crypto?.randomUUID) {

            return crypto.randomUUID();

        }

        return "id-" + Date.now() + "-" +

            Math.random().toString(36).substring(2, 9);

    }

    /* ==================================================
       STORAGE
    ================================================== */

    function save(key, value) {

        localStorage.setItem(

            key,

            JSON.stringify(value)

        );

    }

    function load(key) {

        const value = localStorage.getItem(key);

        return value

            ? JSON.parse(value)

            : null;

    }

    function remove(key) {

        localStorage.removeItem(key);

    }

    function clearStorage() {

        localStorage.clear();

    }

    /* ==================================================
       DOM
    ================================================== */

    function fadeIn(element) {

        if (!element) return;

        element.classList.remove("hidden");

        element.classList.add("fade-in");

    }

    function fadeOut(element) {

        if (!element) return;

        element.classList.add("hidden");

    }

    function toggleClass(element, className) {

        if (!element) return;

        element.classList.toggle(className);

    }

    function scrollToTop() {

        window.scrollTo({

            top: 0,

            behavior: "smooth"

        });

    }

    /* ==================================================
       DEVICE
    ================================================== */

    function isMobile() {

        return window.innerWidth <= 768;

    }

    /* ==================================================
       LOG
    ================================================== */

    function log(...args) {

        if (CONFIG.ENABLE_CONSOLE_LOG) {

            console.log(

                `[${CONFIG.APP_NAME}]`,

                ...args

            );

        }

    }

    /* ==================================================
       PUBLIC
    ================================================== */

    return {

        $,

        $$,

        trim,

        capitalize,

        escapeHTML,

        isEmpty,

        isNumeric,

        isNIS,

        isNISN,

        getCurrentYear,

        formatDate,

        sleep,

        debounce,

        playAudio,

        stopAudio,

        copy,

        uuid,

        save,

        load,

        remove,

        clearStorage,

        fadeIn,

        fadeOut,

        toggleClass,

        scrollToTop,

        isMobile,

        log

    };

})();
