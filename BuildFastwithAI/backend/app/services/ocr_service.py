"""OCR for images using Windows' built-in OCR engine (Windows.Media.Ocr).

Runs via PowerShell interop — no extra packages needed. English is the primary
supported language on this machine; other languages fall back to whatever
recognizer packs Windows has installed.
"""
import os
import subprocess
import tempfile
import uuid

_SCRIPT = r"""
param([string]$ImagePath, [string]$LangTag)
Add-Type -AssemblyName System.Runtime.WindowsRuntime
[Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime] | Out-Null
[Windows.Globalization.Language,Windows.Foundation,ContentType=WindowsRuntime] | Out-Null
[Windows.Storage.StorageFile,Windows.Foundation,ContentType=WindowsRuntime] | Out-Null
[Windows.Graphics.Imaging.BitmapDecoder,Windows.Foundation,ContentType=WindowsRuntime] | Out-Null

$null = [Windows.Media.Ocr.OcrEngine,Windows.Foundation,ContentType=WindowsRuntime]

# WinRT async helper
AsTask = $null
function Await($WinRtTask, $ResultType) {
    $asTaskGeneric = ([System.WindowsRuntimeSystemExtensions].GetMethods() | Where-Object { $_.Name -eq 'AsTask' -and $_.GetParameters().Count -eq 1 -and $_.GetParameters()[0].ParameterType.Name -eq 'IAsyncOperation`1' })[0]
    $asTask = $asTaskGeneric.MakeGenericMethod($ResultType)
    $netTask = $asTask.Invoke($null, @($WinRtTask))
    $netTask.Wait(-1) | Out-Null
    $netTask.Result
}

try {
    if ($LangTag) {
        $lang = New-Object Windows.Globalization.Language($LangTag)
        if (-not [Windows.Media.Ocr.OcrEngine]::IsLanguageSupported($lang)) {
            $lang = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | Select-Object -First 1
        }
    } else {
        $lang = [Windows.Media.Ocr.OcrEngine]::AvailableRecognizerLanguages | Select-Object -First 1
    }
    if (-not $lang) { Write-Output ""; exit }

    $engine = [Windows.Media.Ocr.OcrEngine]::TryCreateFromLanguage($lang)
    if (-not $engine) { Write-Output ""; exit }

    $file = Await ([Windows.Storage.StorageFile]::GetFileFromPathAsync($ImagePath)) ([Windows.Storage.StorageFile])
    $stream = Await ($file.OpenAsync([Windows.Storage.FileAccessMode]::Read)) ([Windows.Storage.Streams.IRandomAccessStream])
    $decoder = Await ([Windows.Graphics.Imaging.BitmapDecoder]::CreateAsync($stream)) ([Windows.Graphics.Imaging.BitmapDecoder])
    $bitmap = Await ($decoder.GetSoftwareBitmapAsync()) ([Windows.Graphics.Imaging.SoftwareBitmap])

    $result = Await ($engine.RecognizeAsync($bitmap)) ([Windows.Media.Ocr.OcrResult])

    $stream.Dispose()
    $bitmap.Dispose()

    # Reconstruct line structure for better text flow
    $sb = New-Object System.Text.StringBuilder
    foreach ($line in $result.Lines) {
        [void]$sb.AppendLine($line.Text)
    }
    Write-Output $sb.ToString()
} catch {
    Write-Output ""
}
"""

# The script uses a function definition; fix the broken first line
_SCRIPT = _SCRIPT.replace("AsTask = $null\n", "")


def _preprocess_for_ocr(image_path: str) -> str:
    """Upscale small images 2x and boost contrast for better OCR accuracy.
    Returns path to a temp preprocessed image (or the original on any failure)."""
    try:
        from PIL import Image, ImageOps
        img = Image.open(image_path)
        # Upscale if small (OCR engines do much better on >= 1500px width)
        if img.width < 1500:
            scale = min(3.0, 1500 / img.width)
            img = img.resize((int(img.width * scale), int(img.height * scale)), Image.LANCZOS)
        img = ImageOps.grayscale(img)
        img = ImageOps.autocontrast(img)
        out = image_path + "__ocr.png"
        img.save(out)
        return out
    except Exception:
        return image_path


def extract_text_from_image(image_path: str, lang_hint: str = "en") -> str:
    """Extract text from an image file using Windows OCR. Returns '' on failure."""
    if not os.path.exists(image_path):
        return ""

    lang_map = {"en": "en-US", "hi": "hi-IN", "ta": "ta-IN", "te": "te-IN"}
    lang_tag = lang_map.get(lang_hint, "en-US")
    processed = _preprocess_for_ocr(image_path)

    script_path = os.path.join(tempfile.gettempdir(), f"ocr_{uuid.uuid4().hex[:8]}.ps1")
    with open(script_path, "w", encoding="utf-8-sig") as f:
        f.write(_SCRIPT)

    try:
        result = subprocess.run(
            ["powershell", "-NoProfile", "-ExecutionPolicy", "Bypass",
             "-File", script_path, "-ImagePath", os.path.abspath(processed), "-LangTag", lang_tag],
            capture_output=True, text=True, timeout=90, encoding="utf-8", errors="replace",
        )
        text = (result.stdout or "").strip()
        return text
    except Exception as e:
        print(f"OCR failed for {image_path}: {e}")
        return ""
    finally:
        for p in (script_path, processed if processed != image_path else None):
            if p:
                try:
                    os.remove(p)
                except Exception:
                    pass
