Add-Type -AssemblyName System.Drawing
$ErrorActionPreference = 'Stop'

$root = 'C:\Users\Home\CoreWise\ryanportfolio-showpiece'
$src  = Join-Path $root '.tmp\shots'
$dst  = Join-Path $root 'assets\img'
New-Item -ItemType Directory -Force -Path $dst | Out-Null

# Crop a source rect then resample to the target box. One helper for every asset
# so the whole set shares interpolation quality and nothing gets a bespoke path.
function Convert-Image {
  param(
    [string]$In, [string]$Out,
    [int]$SrcX, [int]$SrcY, [int]$SrcW, [int]$SrcH,
    [int]$OutW, [int]$OutH, [long]$Quality = 82
  )
  $img = [System.Drawing.Image]::FromFile($In)
  try {
    if ($SrcW -le 0) { $SrcW = $img.Width }
    if ($SrcH -le 0) { $SrcH = $img.Height }
    $bmp = New-Object System.Drawing.Bitmap $OutW, $OutH, ([System.Drawing.Imaging.PixelFormat]::Format24bppRgb)
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
    $g.PixelOffsetMode   = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
    $g.SmoothingMode     = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
    $srcRect = New-Object System.Drawing.Rectangle $SrcX, $SrcY, $SrcW, $SrcH
    $dstRect = New-Object System.Drawing.Rectangle 0, 0, $OutW, $OutH
    $g.DrawImage($img, $dstRect, $srcRect, [System.Drawing.GraphicsUnit]::Pixel)
    $g.Dispose()

    $codec = [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() | Where-Object { $_.MimeType -eq 'image/jpeg' }
    $ep = New-Object System.Drawing.Imaging.EncoderParameters 1
    $ep.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter ([System.Drawing.Imaging.Encoder]::Quality), $Quality
    $bmp.Save($Out, $codec, $ep)
    $bmp.Dispose()
  } finally { $img.Dispose() }
  '{0}  {1}x{2}  {3:N0} KB' -f (Split-Path $Out -Leaf), $OutW, $OutH, ((Get-Item $Out).Length / 1KB)
}

# --- generated art: crop the calm cream margin, keep the central band ---------
Convert-Image -In "$src\hero-raw.png"   -Out "$dst\hero.jpg"   -SrcX 0 -SrcY 190 -SrcW 1536 -SrcH 670 -OutW 1200 -OutH 523
Convert-Image -In "$src\review-raw.png" -Out "$dst\review.jpg" -SrcX 0 -SrcY 150 -SrcW 1536 -SrcH 740 -OutW 1200 -OutH 578

# --- prototypes: the real fullbuild.ai/prototype hero -------------------------
Convert-Image -In "$src\proto-hero.png" -Out "$dst\prototypes.jpg" -SrcX 0 -SrcY 0 -SrcW 1440 -SrcH 700 -OutW 1200 -OutH 583

# --- products: normalise every capture to one 1.9:1 card ---------------------
# 1440x760 viewport, cropped to the top 1440x757 band then resampled.
$shots = @(
  @{ f = 'shot-truenote.png';   o = 'truenote.jpg' },
  @{ f = 'shot-corewise.png';   o = 'corewise.jpg' },
  @{ f = 'shot-willaicite.png'; o = 'willaicite.jpg' },
  @{ f = 'shot-kinefractal.png';o = 'kine-fractal.jpg' },
  @{ f = 'shot-academy.png';    o = 'corewise-academy.jpg' }
)
foreach ($s in $shots) {
  Convert-Image -In "$src\$($s.f)" -Out "$dst\$($s.o)" -SrcX 0 -SrcY 0 -SrcW 1440 -SrcH 757 -OutW 800 -OutH 420
}

# MAIMCOIL ships its own 460x215 Steam capsule; centre-crop it to the same ratio.
Convert-Image -In "$src\maimcoil.jpg" -Out "$dst\maimcoil.jpg" -SrcX 0 -SrcY 13 -SrcW 460 -SrcH 242 -OutW 800 -OutH 420
