const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Criar diretórios se não existirem
const uploadDirs = [
  'uploads',
  'uploads/empresas',
  'uploads/empresas/logos',
  'uploads/empresas/capas',
  'uploads/empresas/perfis',
  'uploads/empresas/carrossel'
];

uploadDirs.forEach(dir => {
  const dirPath = path.join(__dirname, '../../..', dir);
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
});

// Configuração do armazenamento
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const tipo = req.body.tipo || 'outros';
    let folder = 'uploads/empresas';

    switch (tipo) {
      case 'logo':
        folder = 'uploads/empresas/logos';
        break;
      case 'capa':
        folder = 'uploads/empresas/capas';
        break;
      case 'perfil':
        folder = 'uploads/empresas/perfis';
        break;
      case 'carrossel':
        folder = 'uploads/empresas/carrossel';
        break;
    }

    cb(null, folder);
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    const ext = path.extname(file.originalname);
    const empresaSlug = req.body.slug || 'empresa';
    cb(null, `${empresaSlug}-${uniqueSuffix}${ext}`);
  }
});

// Filtro de tipos de arquivo
const fileFilter = (req, file, cb) => {
  const allowedTypes = /jpeg|jpg|png|gif|webp/;
  const extname = allowedTypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = allowedTypes.test(file.mimetype);

  if (mimetype && extname) {
    return cb(null, true);
  } else {
    cb(new Error('Apenas imagens são permitidas (jpeg, jpg, png, gif, webp)'));
  }
};

// Configuração do multer
const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024 // 5MB max
  },
  fileFilter: fileFilter
});

// Middleware para upload de múltiplas imagens
const uploadMultiple = upload.fields([
  { name: 'logo', maxCount: 1 },
  { name: 'capa', maxCount: 1 },
  { name: 'perfil', maxCount: 1 },
  { name: 'carrossel', maxCount: 10 }
]);

// Middleware para upload de imagem única
const uploadSingle = upload.single('imagem');

// Função para deletar arquivo
const deleteFile = (filepath) => {
  const fullPath = path.join(__dirname, '../../..', filepath);
  if (fs.existsSync(fullPath)) {
    fs.unlinkSync(fullPath);
    console.log('Arquivo deletado:', filepath);
  }
};

module.exports = {
  uploadMultiple,
  uploadSingle,
  upload,
  deleteFile
};
