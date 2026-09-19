// Copia .env.<target> a .env. Reemplaza los scripts start:local/dev/prd que usaban
// `copy` de cmd (solo Windows) — este es el mismo comando en Windows, macOS y Linux,
// necesario porque el build de iOS solo se puede correr desde Mac.
const fs = require('fs');
const path = require('path');

const VALID_TARGETS = ['local', 'dev', 'prd'];
const target = process.argv[2];

if (!VALID_TARGETS.includes(target)) {
  console.error(`Uso: node scripts/use-env.js <${VALID_TARGETS.join('|')}>`);
  process.exit(1);
}

const root = path.resolve(__dirname, '..');
const source = path.join(root, `.env.${target}`);
const destination = path.join(root, '.env');

if (!fs.existsSync(source)) {
  console.error(`No existe ${path.basename(source)}. Crea uno a partir de .env.example:`);
  console.error(`  cp .env.example .env.${target}`);
  process.exit(1);
}

fs.copyFileSync(source, destination);
console.log(`.env actualizado desde .env.${target}`);
