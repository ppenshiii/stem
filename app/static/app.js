document.addEventListener('DOMContentLoaded', () => {
    const dropZone = document.getElementById('drop-zone');
    const fileUpload = document.getElementById('file-upload');
    const fileInfo = document.getElementById('file-info');
    const fileNameDisplay = document.getElementById('selected-file-name');
    const processBtn = document.getElementById('process-btn');
    
    const loadingScreen = document.getElementById('loading');
    const resultScreen = document.getElementById('result');
    const errorScreen = document.getElementById('error-msg');
    const errorText = document.getElementById('error-text');
    
    const downloadLink = document.getElementById('download-link');
    const retryBtn = document.getElementById('retry-btn');

    let currentFile = null;

    // Drag and drop setup
    ['dragenter', 'dragover', 'dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, preventDefaults, false);
    });

    function preventDefaults(e) {
        e.preventDefault();
        e.stopPropagation();
    }

    ['dragenter', 'dragover'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.add('dragover'), false);
    });

    ['dragleave', 'drop'].forEach(eventName => {
        dropZone.addEventListener(eventName, () => dropZone.classList.remove('dragover'), false);
    });

    dropZone.addEventListener('drop', (e) => {
        let dt = e.dataTransfer;
        let files = dt.files;
        handleFiles(files);
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

    processBtn.addEventListener('click', async () => {
        if (!currentFile) return;

        // UI transition
        fileInfo.classList.add('hidden');
        loadingScreen.classList.remove('hidden');

        const formData = new FormData();
        formData.append('file', currentFile);

        try {
            const response = await fetch('/api/separate', {
                method: 'POST',
                body: formData
            });

            if (!response.ok) {
                const errData = await response.json().catch(() => ({}));
                throw new Error(errData.detail || `Server error: ${response.status}`);
            }

            // It returns a blob (the zip file)
            const blob = await response.blob();
            const downloadUrl = URL.createObjectURL(blob);
            
            loadingScreen.classList.add('hidden');
            resultScreen.classList.remove('hidden');
            
            downloadLink.href = downloadUrl;
            downloadLink.download = `separated_${currentFile.name}.zip`;

        } catch (err) {
            loadingScreen.classList.add('hidden');
            errorScreen.classList.remove('hidden');
            errorText.textContent = err.message || "An unexpected error occurred.";
        }
    });

    retryBtn.addEventListener('click', () => {
        errorScreen.classList.add('hidden');
        currentFile = null;
        fileUpload.value = '';
        dropZone.classList.remove('hidden');
        resultScreen.classList.add('hidden');
    });
});
