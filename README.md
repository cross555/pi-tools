# Pi-Tools · Images

A simple image converter, compressor and resizer that runs **on your own computer** as a [SoloHost](https://minepi.com/blog/pi2day2026/) app for Pi Desktop. Open it from your phone through Pi Browser or from your PC, drop in a photo, and get a smaller or converted copy back.

## Features

- **Convert** between WebP, AVIF, JPEG and PNG.
- **Compress** with an adjustable quality slider.
- **Resize** by maximum width and/or height (never upscales).
- **iPhone photos:** HEIC/HEIF input is converted automatically.
- **Other inputs:** JPG, PNG, WebP, AVIF, GIF and TIFF.
- **Privacy by default:** metadata (including GPS location) is removed unless you choose to keep it.
- **Mobile-friendly** interface that shows the size saved after each conversion.

## Privacy

Everything is processed inside a container on your own machine.

- Images are held in memory only while they are being converted; nothing is written to disk.
- No images, usage data or analytics are sent anywhere. The app has no accounts, no tracking and no external services.
- The container only listens on `127.0.0.1`.

## Install

1. Install [Pi Desktop](https://minepi.com/) (Docker required).
2. Open the **SoloHost** catalog and install **Pi-Tools · Images**.
3. Optionally adjust the defaults in the install form, then open the app from Pi Desktop or from Pi Browser on your phone.

### Settings

| Setting | Default | Description |
| --- | --- | --- |
| Default output format | WebP | WebP, JPEG, PNG or AVIF. Can be changed per conversion. |
| Default quality | 80 | 10–100. Not used for PNG, which is always lossless. |
| Max image size (MB) | 25 | Per-image upload limit. |

## Development

Run it locally without Docker:

```bash
npm install --omit=dev
PORT=8080 node server.js    # then open http://localhost:8080
```

The image is built and published to GHCR by the workflow in `.github/workflows/publish.yml` when a `v*` tag is pushed. The SoloHost package consists of `docker-compose.yml` and `config_options.yml`; everything else is the source of the image they point to.

## Tech

Node.js, Express, [sharp](https://sharp.pixelplumbing.com/), [heic-convert](https://github.com/catdad-experiments/heic-convert) and multer.

## License

MIT. Dependencies are distributed under their own licenses.
