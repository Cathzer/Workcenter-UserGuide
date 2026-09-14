# Sansico Workcenter User Guide

Panduan penggunaan statis untuk Sansico Quality Workspace. Situs ini dipisahkan dari aplikasi utama agar dokumentasi dapat diperbarui dan dipublikasikan tanpa memengaruhi deployment aplikasi.

## Menjalankan secara lokal

Buka `index.html` langsung di browser, atau jalankan static server dari root repository.

## Deployment

Push ke branch `main` akan menjalankan workflow **Deploy user guide to GitHub Pages**. Artifact yang dipublikasikan hanya berisi:

- `index.html`
- `styles.css`
- `guide.js`
- folder `assets/`
- folder `fonts/`

Repository ini tidak memerlukan environment variable maupun credential aplikasi.
