/**
 * Servico de Upload para Cloudinary
 * Armazenamento permanente de imagens na nuvem
 */

const cloudinary = require('cloudinary').v2;

// Configurar Cloudinary com credenciais do ambiente
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

/**
 * Faz upload de uma imagem para o Cloudinary
 * @param {string} filePath - Caminho do arquivo local (temporario)
 * @param {object} options - Opcoes de upload
 * @param {string} options.folder - Pasta no Cloudinary (ex: 'empresas/logos')
 * @param {string} options.public_id - ID publico da imagem (opcional)
 * @param {string} options.transformation - Transformacoes (opcional)
 * @returns {Promise<object>} Resultado do upload com URL
 */
async function uploadImage(filePath, options = {}) {
  try {
    const uploadOptions = {
      folder: options.folder || 'agendaaqui',
      resource_type: 'image',
      // Transformacoes automaticas para otimizar
      transformation: options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    // Se tiver public_id, adiciona (permite sobrescrever imagem existente)
    if (options.public_id) {
      uploadOptions.public_id = options.public_id;
      uploadOptions.overwrite = true;
    }

    const result = await cloudinary.uploader.upload(filePath, uploadOptions);

    return {
      success: true,
      url: result.secure_url,
      public_id: result.public_id,
      width: result.width,
      height: result.height,
      format: result.format,
      bytes: result.bytes
    };

  } catch (error) {
    console.error('Erro no upload para Cloudinary:', error);
    return {
      success: false,
      error: error.message || 'Erro ao fazer upload da imagem'
    };
  }
}

/**
 * Faz upload de uma imagem a partir de um buffer
 * @param {Buffer} buffer - Buffer da imagem
 * @param {object} options - Opcoes de upload
 * @returns {Promise<object>} Resultado do upload com URL
 */
async function uploadImageBuffer(buffer, options = {}) {
  return new Promise((resolve, reject) => {
    const uploadOptions = {
      folder: options.folder || 'agendaaqui',
      resource_type: 'image',
      transformation: options.transformation || [
        { quality: 'auto:good' },
        { fetch_format: 'auto' }
      ]
    };

    if (options.public_id) {
      uploadOptions.public_id = options.public_id;
      uploadOptions.overwrite = true;
    }

    const uploadStream = cloudinary.uploader.upload_stream(
      uploadOptions,
      (error, result) => {
        if (error) {
          console.error('Erro no upload para Cloudinary:', error);
          resolve({
            success: false,
            error: error.message || 'Erro ao fazer upload da imagem'
          });
        } else {
          resolve({
            success: true,
            url: result.secure_url,
            public_id: result.public_id,
            width: result.width,
            height: result.height,
            format: result.format,
            bytes: result.bytes
          });
        }
      }
    );

    // Enviar buffer para o stream
    uploadStream.end(buffer);
  });
}

/**
 * Deleta uma imagem do Cloudinary
 * @param {string} publicId - ID publico da imagem
 * @returns {Promise<object>} Resultado da delecao
 */
async function deleteImage(publicId) {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return {
      success: result.result === 'ok',
      result: result.result
    };
  } catch (error) {
    console.error('Erro ao deletar imagem do Cloudinary:', error);
    return {
      success: false,
      error: error.message
    };
  }
}

/**
 * Gera URL otimizada para uma imagem
 * @param {string} publicId - ID publico da imagem
 * @param {object} options - Opcoes de transformacao
 * @returns {string} URL otimizada
 */
function getOptimizedUrl(publicId, options = {}) {
  return cloudinary.url(publicId, {
    secure: true,
    transformation: [
      { width: options.width || 'auto', crop: 'scale' },
      { quality: 'auto' },
      { fetch_format: 'auto' }
    ]
  });
}

/**
 * Verifica se o Cloudinary esta configurado
 * @returns {boolean}
 */
function isConfigured() {
  return !!(
    process.env.CLOUDINARY_CLOUD_NAME &&
    process.env.CLOUDINARY_API_KEY &&
    process.env.CLOUDINARY_API_SECRET
  );
}

module.exports = {
  uploadImage,
  uploadImageBuffer,
  deleteImage,
  getOptimizedUrl,
  isConfigured,
  cloudinary
};
