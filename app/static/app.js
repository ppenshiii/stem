document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('selected-file-name');
    
    // Core Elements
    const loadingScreen = document.getElementById('loading');
    const loadingHeader = document.getElementById('loading-header');
    const loadingDesc = document.getElementById('loading-desc');
    const errorScreen = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    
    // Buttons
    const btnGenre = document.getElementById('genre-btn');
    const btnProcess = document.getElementById('process-btn');
    const retryBtn = document.getElementById('retry-btn');
    const backGenreBtn = document.getElementById('back-genre-btn');
    const closeDownloadBtn = document.getElementById('close-download-btn');

    // Genre Screen
    const genreResult = document.getElementById('genre-result');
    const detectedGenre = document.getElementById('detected-genre');
    const confidenceText = document.getElementById('confidence-text');
    const confidenceCircle = document.getElementById('confidence-circle');

    // Stem Result Screen
    const stemResult = document.getElementById('result');
    const downloadLink = document.getElementById('download-link');

    let currentFile = null;

    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) { e.preventDefault(); e.stopPropagation(); }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        handleFiles(e.dataTransfer.files);
    });

    fileUpload.addEventListener('change', function() {
        handleFiles(this.files);
    });

    function handleFiles(files) {
        if (files.length > 0) {
            currentFile = files[0];
            fileNameDisplay.textContent = currentFile.name;
            dropZone.classList.add('hidden');
            fileInfo.classList.remove('hidden');
        }
    }

    // 1. GENRE PIPELINE
    btnGenre.addEventListener('click', async () => {
        if (!currentFile) return;

        fileInfo.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        loadingHeader.innerText = "Analyzing Genre...";
        loadingDesc.innerText = "Deep Neural Labels firing...";

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('/api/classify_genre', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Error extracting Genre");

            const data = await response.json();
            
            // Map JSON properties to UI
            detectedGenre.innerText = data.genre;
            confidenceText.innerText = `${data.confidence}%`;
            // Calculate SVG stroke. 100 max length
            confidenceCircle.setAttribute('stroke-dasharray', `${data.confidence}, 100`);
            
            // Change color dynamically based on confidence
            if(data.confidence > 80) confidenceCircle.style.stroke = "#4ade80"; // green
            else if(data.confidence > 50) confidenceCircle.style.stroke = "#38BDF8"; // blue
            else confidenceCircle.style.stroke = "#fca5a5"; // weak red
            
            loadingScreen.classList.add('hidden');
            genreResult.classList.remove('hidden');

        } catch (err) {
            loadingScreen.classList.add('hidden');
            errorScreen.classList.remove('hidden');
            errorText.textContent = err.message;
        }
    });

    // 2. STEM SEPARATION PIPELINE
    btnProcess.addEventListener('click', async () => {
        if (!currentFile) return;

        fileInfo.classList.add('hidden');
        loadingScreen.classList.remove('hidden');
        loadingHeader.innerText = "Extracting Stems...";
        loadingDesc.innerText = "Demucs is physically slicing frequencies.";

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('/api/separate_stems', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) throw new Error("Error segregating stems");

            const data = await response.json();
            
            loadingScreen.classList.add('hidden');
            stemResult.classList.remove('hidden');
            downloadLink.href = `/api/download/${data.job_id}/${encodeURIComponent(data.filename)}`;

        } catch (err) {
            loadingScreen.classList.add('hidden');
            errorScreen.classList.remove('hidden');
            errorText.textContent = err.message;
        }
    });

    // UI Resets
    const resetUI = () => {
        genreResult.classList.add('hidden');
        stemResult.classList.add('hidden');
        fileInfo.classList.remove('hidden');
    }

    retryBtn.addEventListener('click', () => {
        errorScreen.classList.add('hidden');
        currentFile = null; fileUpload.value = '';
        dropZone.classList.remove('hidden');
    });

    backGenreBtn.addEventListener('click', resetUI);
    closeDownloadBtn.addEventListener('click', resetUI);
});
