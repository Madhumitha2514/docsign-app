const fs = require('fs')
const path = require('path')
const https = require('https')
const http = require('http')
const { PDFDocument, rgb } = require('pdf-lib')

/**
 * Download file from URL
 */
/**
 * Download file from URL
 */
async function downloadFile(url) {
  return new Promise((resolve, reject) => {
    const protocol = url.startsWith('https') ? require('https') : require('http')
    
    console.log('📥 Downloading:', url)
    
    protocol.get(url, (response) => {
      // Follow redirects
      if (response.statusCode === 301 || response.statusCode === 302) {
        return downloadFile(response.headers.location).then(resolve).catch(reject)
      }
      
      if (response.statusCode !== 200) {
        return reject(new Error(`Failed to download: ${response.statusCode}`))
      }
      
      const chunks = []
      response.on('data', (chunk) => chunks.push(chunk))
      response.on('end', () => {
        console.log('✅ Downloaded:', (Buffer.concat(chunks).length / 1024).toFixed(1), 'KB')
        resolve(Buffer.concat(chunks))
      })
      response.on('error', reject)
    }).on('error', reject)
  })
}

/**
 * Embeds signature AND optional fields into PDF
 */
async function embedSignature(originalPath, signature, optionalFields = []) {
  console.log('\n🔧 ===== STARTING PDF EMBEDDING =====')
  console.log('📄 PDF source:', originalPath)

  // Load PDF (handle both local files and URLs)
  let pdfBytes
  if (originalPath.startsWith('http')) {
    console.log('📥 Downloading from Cloudinary...')
    pdfBytes = await downloadFile(originalPath)
  } else {
    pdfBytes = fs.readFileSync(originalPath)
  }
  
  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()

  // ============================================
  // STEP 1: EMBED SIGNATURE
  // ============================================
  const sigPage = pages[signature.page - 1] || pages[0]
  const { width, height } = sigPage.getSize()
  
  const sigX = (signature.xPercent / 100) * width
  const sigY = height - ((signature.yPercent / 100) * height)
  
  console.log(`📏 PDF size: ${width}x${height}pt`)
  console.log(`📍 Signature at: (${sigX.toFixed(0)}, ${sigY.toFixed(0)})pt`)

  // IMAGE SIGNATURE
  if (signature.signatureImage) {
    console.log('🖼️  Processing IMAGE signature...')
    
    try {
      let base64Data = signature.signatureImage
      if (base64Data.includes('base64,')) {
        base64Data = base64Data.split('base64,')[1]
      }
      
      const imgBuffer = Buffer.from(base64Data, 'base64')
      console.log(`📦 Image buffer: ${(imgBuffer.length / 1024).toFixed(1)}KB`)
      
      let sigImage
      try {
        sigImage = await pdfDoc.embedPng(imgBuffer)
        console.log('✅ PNG embedded')
      } catch (e) {
        sigImage = await pdfDoc.embedJpg(imgBuffer)
        console.log('✅ JPG embedded')
      }
      
      const scale = 0.25
      const sigWidth = sigImage.width * scale
      const sigHeight = sigImage.height * scale
      
      sigPage.drawImage(sigImage, {
        x: sigX - (sigWidth / 2),
        y: sigY - (sigHeight / 2),
        width: sigWidth,
        height: sigHeight,
        opacity: 1
      })
      
      console.log('✅ Signature image embedded')
      
    } catch (error) {
      console.error('❌ Image embed failed:', error.message)
    }
  }
  // TEXT SIGNATURE
  else if (signature.signatureText) {
    console.log('📝 Embedding TEXT signature:', signature.signatureText)
    
    sigPage.drawText(signature.signatureText, {
      x: sigX - 50,
      y: sigY - 10,
      size: 20,
      color: rgb(0, 0, 0.8)
    })
    
    sigPage.drawLine({
      start: { x: sigX - 60, y: sigY - 15 },
      end: { x: sigX + 60, y: sigY - 15 },
      thickness: 1,
      color: rgb(0, 0, 0.8)
    })
    
    console.log('✅ Text signature embedded')
  }
  // NAME FALLBACK
  else {
    console.log('📝 Embedding NAME:', signature.signerName)
    
    sigPage.drawText(signature.signerName || 'Signed', {
      x: sigX - 40,
      y: sigY - 10,
      size: 16,
      color: rgb(0, 0, 0.8)
    })
    
    sigPage.drawLine({
      start: { x: sigX - 50, y: sigY - 15 },
      end: { x: sigX + 50, y: sigY - 15 },
      thickness: 1,
      color: rgb(0, 0, 0.8)
    })
    
    console.log('✅ Name embedded')
  }

  // ============================================
  // STEP 2: EMBED OPTIONAL FIELDS
  // ============================================
  if (optionalFields && optionalFields.length > 0) {
    console.log('\n📝 ===== EMBEDDING OPTIONAL FIELDS =====')
    
    optionalFields.forEach((field, index) => {
      if (!field.value) return
      
      const fieldPage = pages[field.page - 1] || pages[0]
      const pageSize = fieldPage.getSize()
      
      const fieldX = (field.x / 100) * pageSize.width
      const fieldY = pageSize.height - ((field.y / 100) * pageSize.height)
      
      console.log(`  ${index + 1}. ${field.label}: "${field.value}"`)
      
      const fontSize = 12
      const textWidth = field.value.length * fontSize * 0.5
      
      fieldPage.drawText(field.value, {
        x: fieldX - (textWidth / 2),
        y: fieldY - 8,
        size: fontSize,
        color: rgb(0, 0, 0)
      })
      

    })
    
    console.log(`✅ ${optionalFields.filter(f => f.value).length} optional fields embedded`)
  }

  // ============================================
  // STEP 3: UPLOAD TO CLOUDINARY
  // ============================================
  const signedBytes = await pdfDoc.save()
  const fileName = `signed-${Date.now()}.pdf`
  
  // Upload to Cloudinary instead of local storage
  const { cloudinary } = require('../config/cloudinary')
  
  console.log('☁️ Uploading signed PDF to Cloudinary...')
  
  const uploadResult = await new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      {
        folder: 'docsign-files',
        resource_type: 'raw',
        public_id: fileName.split('.')[0],
        format: 'pdf'
      },
      (error, result) => {
        if (error) reject(error)
        else resolve(result)
      }
    )
    
    uploadStream.end(signedBytes)
  })
  
  console.log(`\n💾 Uploaded to Cloudinary: ${uploadResult.secure_url}`)
  console.log('✅ ===== PDF EMBEDDING COMPLETE =====\n')
  
  return uploadResult.secure_url // Return Cloudinary URL instead of filename
}

module.exports = { embedSignature }