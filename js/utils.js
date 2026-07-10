/*
==========================================================
SMANSASOO Academic Portal
Utility Functions
Version : 1.0.0
==========================================================
*/

window.Utils = (() => {

    /* ==========================================
       SELECTOR
    ========================================== */

    const $ = (selector) => document.querySelector(selector);

    const $$ = (selector) => document.querySelectorAll(selector);

    /* ==========================================
       STRING
    ========================================== */

    function trim(value) {

        return String(value).trim();

    }

    function capitalize(text) {

        if (!text) return "";

        return text
            .toLowerCase()
            .replace(/\b\w/g, c => c.toUpperCase());

    }

    /* ==========================================
       VALIDATION
    ========================================== */

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

    /* ==========================================
       DATE & TIME
    ========================================== */

    function getCurrentYear() {

        return new Date().getFullYear();

    }

    function formatDate(dateString) {

        const date = new Date(dateString);

        return date.toLocaleDateString("id-ID", {

            day: "2-digit",

            month: "long",

            year: "numeric"

        });

    }

    /* ==========================================
       DEBOUNCE
    ========================================== */

    function debounce(callback, delay = 300) {

        let timeout;

        return (...args) => {

            clearTimeout(timeout);

            timeout = setTimeout(() => {

                callback(...args);

            }, delay);

        };

    }

    /* ==========================================
       COPY
    ========================================== */

    async function copy(text) {

        try {

            await navigator.clipboard.writeText(text);

            return true;

        } catch {

            return false;

        }

    }

    /* ==========================================
       RANDOM ID
    ========================================== */

    function uuid() {

        return crypto.randomUUID();

    }

    /* ==========================================
       STORAGE
    ========================================== */

    function save(key, value) {

        localStorage.setItem(key, JSON.stringify(value));

    }

    function load(key) {

        const data = localStorage.getItem(key);

        return data ? JSON.parse(data) : null;

    }

    function remove(key) {

        localStorage.removeItem(key);

    }

    /* ==========================================
       LOG
    ========================================== */

    function log(...args) {

        if (CONFIG.ENABLE_CONSOLE_LOG) {

            console.log("[SMANSASOO]", ...args);

        }

    }

    /* ==========================================
       PUBLIC
    ========================================== */

    return {

        $,

        $$,

        trim,

        capitalize,

        isEmpty,

        isNumeric,

        isNIS,

        isNISN,

        getCurrentYear,

        formatDate,

        debounce,

        copy,

        uuid,

        save,

        load,

        remove,

        log

    };

})();
