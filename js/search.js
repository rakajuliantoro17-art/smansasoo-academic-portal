/*
==========================================================
SMANSASOO Academic Portal
Search Module
Version : 1.0.0
==========================================================
*/

window.Search = (() => {

    /**
     * ==========================================
     * INITIALIZE
     * ==========================================
     */

    function initialize() {

        const form = document.getElementById("searchForm");

        if (!form) {
            console.error("Search form tidak ditemukan.");
            return;
        }

        form.addEventListener("submit", handleSubmit);

    }

    /**
     * ==========================================
     * HANDLE SUBMIT
     * ==========================================
     */

    async function handleSubmit(event) {

        event.preventDefault();

        const input = document.getElementById("keyword");

        const keyword = input.value.trim();

        clearResult();

        if (keyword === "") {

            showError(CONFIG.MESSAGE.EMPTY_KEYWORD);

            input.focus();

            return;

        }

        await search(keyword);

    }

    /**
     * ==========================================
     * SEARCH
     * ==========================================
     */

    async function search(keyword) {

        showLoading();

        try {

            const response = await API.searchStudent(keyword);

            hideLoading();

            if (!response.success) {

                showError(response.message);

                return;

            }

            showResult(response.data);

        }

        catch(error){

            console.error(error);

            hideLoading();

            showError(CONFIG.MESSAGE.SERVER_ERROR);

        }

    }

    /**
     * ==========================================
     * RESULT
     * ==========================================
     */

    function showResult(student){

        const result = document.getElementById("result");

        if(!result) return;

        result.innerHTML = `

        <div class="result-card success slide-up">

            <h2 class="result-title">
                Pengumuman Kenaikan Kelas
            </h2>

            <div class="result-item">
                <span class="result-label">Nama</span>
                <span class="result-value">${student.name}</span>
            </div>

            <div class="result-item">
                <span class="result-label">NIS</span>
                <span class="result-value">${student.nis}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Status</span>
                <span class="result-value">${student.status}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelas Lama</span>
                <span class="result-value">${student.previous_class}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelas Baru</span>
                <span class="result-value">${student.new_class}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Kelompok Minat</span>
                <span class="result-value">${student.major}</span>
            </div>

            <div class="result-item">
                <span class="result-label">Wali Kelas</span>
                <span class="result-value">${student.homeroom_teacher}</span>
            </div>

        </div>

        `;

    }

    /**
     * ==========================================
     * LOADING
     * ==========================================
     */

    function showLoading(){

        const result=document.getElementById("result");

        if(!result) return;

        result.innerHTML=`

        <div class="loading-box">

            <div class="spinner"></div>

            <p>${CONFIG.MESSAGE.LOADING}</p>

        </div>

        `;

    }

    function hideLoading(){

        // Reserved for future enhancement

    }

    /**
     * ==========================================
     * ERROR
     * ==========================================
     */

    function showError(message){

        const result=document.getElementById("result");

        if(!result) return;

        result.innerHTML=`

        <div class="error-card fade-in">

            ${message}

        </div>

        `;

    }

    /**
     * ==========================================
     * CLEAR
     * ==========================================
     */

    function clearResult(){

        const result=document.getElementById("result");

        if(result){

            result.innerHTML="";

        }

    }

    /**
     * ==========================================
     * PUBLIC
     * ==========================================
     */

    return{

        initialize,

        search

    };

})();
