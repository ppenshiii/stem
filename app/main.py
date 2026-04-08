import os
import shutil
import uuid
import zipfile
from fastapi import FastAPI, UploadFile, File, BackgroundTasks, HTTPException
from fastapi.responses import FileResponse, HTMLResponse, JSONResponse
from fastapi.staticfiles import StaticFiles

# MLOps HuggingFace integration
from transformers import pipeline
from app.separator import separate_audio

app = FastAPI(title="SonicSplit AI Pipeline")

os.makedirs("uploads", exist_ok=True)
os.makedirs("outputs", exist_ok=True)

# Serve the web client
app.mount("/static", StaticFiles(directory="app/static"), name="static")

# Instantiate the pre-trained Audio Genre classifier pipeline globally
genre_classifier = pipeline("audio-classification", model="dima806/music_genres_classification", device=-1)

def safe_rmtree(path):
    if os.path.exists(path):
        if os.path.isdir(path):
            shutil.rmtree(path, ignore_errors=True)
        else:
            os.remove(path)

@app.get("/", response_class=HTMLResponse)
async def serve_frontend():
    with open("app/static/index.html", "r", encoding="utf-8") as f:
        return f.read()

@app.post("/api/analyze")
async def analyze_audio(background_tasks: BackgroundTasks, file: UploadFile = File(...)):
    if not file.filename:
        raise HTTPException(status_code=400, detail="No file uploaded")
    
    job_id = str(uuid.uuid4())
    ext = os.path.splitext(file.filename)[1] or ".tmp"
    input_path = f"uploads/{job_id}{ext}"
    out_dir = f"outputs/{job_id}"
    
    with open(input_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)
        
    try:
        # Phase 1: MLOps Genre Classification Pipeline Execution
        preds = genre_classifier(input_path)
        top_genre = preds[0]['label'].title()
        confidence = preds[0]['score']

        # Phase 2: Demucs Stem Separation
        separate_audio(input_path, out_dir)
        
        base_name = os.path.splitext(os.path.basename(input_path))[0]
        separated_folder = os.path.join(out_dir, "htdemucs", base_name)
        
        if not os.path.exists(separated_folder):
            raise Exception("Demucs did not output the expected target folder.")
            
        zip_path = f"outputs/{job_id}.zip"
        with zipfile.ZipFile(zip_path, 'w', zipfile.ZIP_DEFLATED) as zipf:
            for root, _, files in os.walk(separated_folder):
                for f in files:
                    file_path = os.path.join(root, f)
                    arcname = os.path.relpath(file_path, separated_folder)
                    zipf.write(file_path, arcname)
                    
        # Schedule cleanup of the bloated folders avoiding memory leaks
        background_tasks.add_task(shutil.rmtree, out_dir, ignore_errors=True)
        background_tasks.add_task(os.remove, input_path)
        
        # Return structured analysis
        return JSONResponse({
            "job_id": job_id,
            "filename": file.filename,
            "genre": top_genre,
            "confidence": round(confidence * 100, 1)
        })
        
    except Exception as e:
        safe_rmtree(input_path)
        safe_rmtree(out_dir)
        raise HTTPException(status_code=500, detail=f"Pipeline Failure: {str(e)}")

@app.get("/api/download/{job_id}/{filename}")
async def download_stems(job_id: str, filename: str, background_tasks: BackgroundTasks):
    zip_path = f"outputs/{job_id}.zip"
    if not os.path.exists(zip_path):
        raise HTTPException(status_code=404, detail="File not found")
        
    # Free drive space immediately after dispatching download stream
    background_tasks.add_task(os.remove, zip_path)
    return FileResponse(path=zip_path, filename=f"separated_{filename}.zip", media_type="application/zip")
