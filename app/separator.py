import subprocess
import os

def separate_audio(input_path: str, output_dir: str, model: str = "htdemucs"):
    """
    Run Demucs via subprocess to separate audio stems.
    Using subprocess is efficient here as it natively handles ffmpeg decoding/encoding.
    """
    # Using python -m demucs.separate to ensure module is found in the docker env
    cmd = [
        "python", "-m", "demucs.separate",
        "--out", output_dir,
        "--name", model,
        "-d", "cpu",
        input_path
    ]
    
    try:
        # Run demucs command
        result = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
        print("Demucs Output:", result.stdout)
    except subprocess.CalledProcessError as e:
        print("Demucs Stderr:", e.stderr)
        raise RuntimeError(f"Error running Demucs: {e.stderr}")
