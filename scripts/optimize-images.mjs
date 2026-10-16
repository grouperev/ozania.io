import sharp from 'sharp';
import { stat } from 'node:fs/promises';
import path from 'node:path';

const jobs = [
  { input: 'assets/originals/workshop-14mm-low-angle.jpg', output: 'public/images/team-workshop.webp', width: 1920 },
  { input: 'assets/originals/stock-14mm-low-angle.jpg', output: 'public/images/team-stock.webp', width: 1920 },
  { input: 'assets/originals/training-14mm-low-angle.jpg', output: 'public/images/team-training.webp', width: 1200 },
];

for (const job of jobs) {
  const info = await sharp(job.input)
    .rotate()
    .resize({ width: job.width, withoutEnlargement: true })
    .webp({ quality: 80, effort: 5 })
    .toFile(job.output);

  const { size } = await stat(job.output);
  const kb = (size / 1024).toFixed(1);
  console.log(`${path.normalize(job.output)}  ${info.width}x${info.height}  ${kb} KB`);
}
