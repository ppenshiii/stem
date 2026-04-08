import os
import shutil
import uuid
import zipfile
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, HTMLResponse
from fastapi.staticfiles import StaticFiles
from app.separator import separate_audio

app = FastAPI(title="AI Stem Separator")

# Ensure directories exist
os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Mount static files for the frontend
app.mount("/static", StaticFiles(directory="app/static"), name="static")

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    with open("app/static/index.html", "r", encoding="utf-8") as f:
        return f.read()

def cleanup_files(base_path: str, zip_path: str):
    if os.path.exists(base_path):
        if os.path.isdir(base_path):
            shutil.rmtree(base_path)
        else:
            os.remove(base_path)
    if os.path.exists(zip_path):
        os.remove(zip_path)

@app.post("/api/separate")
async def separate_stems(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    # Generate unique ID for this job
    job_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".tmp"
    input_path = f"uploads/{job_id}{ext}"
    out_dir = f"outputs/{job_id}"
    
    # Save uploaded file
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Run Demucs separation
        separate_audio(input_path, out_dir)
        
        # Determine the generated separated folder (Demucs creates htdemucs/<filename_without_ext>)
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        separated_folder = os.path.join(out_dir, "htdemucs", base_name)
        
        if not os.path.exists(separated_folder):
            raise Exception("Demucs did not output expected folder")
            
        # Create a zip of the stems
        zip_path = f"outputs/{job_id}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(separated_folder):
                for f in files:
                    file_path = os.path.join(root, f)
                    arcname = os.path.relpath(file_path, separated_folder)
                    zipf.write(file_path, arcname)
                    
        # Schedule cleanup after response is sent
        background_tasks.add_task(cleanup_files, input_path, zip_path)
        background_tasks.add_task(shutil.rmtree, out_dir, ignore_errors=True)
        
        return FileResponse(path=zip_path, filename=f"separated_{file.filename}.zip", media_type="application/zip")
        
    except Exception as e:
        cleanup_files(input_path, "")
        if os.path.exists(out_dir):
            shutil.rmtree(out_dir)
        raise HTTPException(status_code=500, detail=f"Separation failed: {str(e)}")
