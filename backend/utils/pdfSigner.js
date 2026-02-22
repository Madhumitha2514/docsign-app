const fs = require('fs')
const path = require('path')
const axios = require('axios')
const { PDFDocument, rgb } = require('pdf-lib')

/**
 * Embeds signature AND optional fields into PDF
 */
async function embedSignature(originalPath, signature, optionalFields = []) {

  console.log('\n🔧 ===== STARTING PDF EMBEDDING =====')
  console.log('📄 Source:', originalPath)

  let pdfBytes

  // ================================
  // NEW: HANDLE CLOUDINARY URL
  // ================================
  if (originalPath.startsWith('http')) {
    console.log('☁️ Downloading PDF from Cloudinary...')

    const response = await axios.get(originalPath, {
      responseType: 'arraybuffer'
    })

    pdfBytes = response.data
  } 
  else {
    console.log('📁 Loading local file...')
    pdfBytes = fs.readFileSync(originalPath)
  }

  const pdfDoc = await PDFDocument.load(pdfBytes)
  const pages = pdfDoc.getPages()

  // ================================
  // SIGNATURE POSITION
  // ================================
  const sigPage = pages[signature.page - 1] || pages[0]
  const { width, height } = sigPage.getSize()

  const sigX = (signature.xPercent / 100) * width
  const sigY = height - ((signature.yPercent / 100) * height)

  console.log(`📍 Signature at: (${sigX.toFixed(0)}, ${sigY.toFixed(0)})`)

  // ================================
  // IMAGE SIGNATURE
  // ================================
  if (signature.signatureImage) {

    let base64Data = signature.signatureImage
    if (base64Data.includes('base64,')) {
      base64Data = base64Data.split('base64,')[1]
    }

    const imgBuffer = Buffer.from(base64Data, 'base64')

    let sigImage
    try {
      sigImage = await pdfDoc.embedPng(imgBuffer)
    } catch {
      sigImage = await pdfDoc.embedJpg(imgBuffer)
    }

    const scale = 0.25
    const sigWidth = sigImage.width * scale
    const sigHeight = sigImage.height * scale

    sigPage.drawImage(sigImage, {
      x: sigX - sigWidth / 2,
      y: sigY - sigHeight / 2,
      width: sigWidth,
      height: sigHeight
    })
  }

  // ================================
  // TEXT SIGNATURE
  // ================================
  else if (signature.signatureText) {

    sigPage.drawText(signature.signatureText, {
      x: sigX - 50,
      y: sigY - 10,
      size: 20,
      color: rgb(0, 0, 0.8)
    })
  }

  // ================================
  // NAME FALLBACK
  // ================================
  else {
    sigPage.drawText(signature.signerName || 'Signed', {
      x: sigX - 40,
      y: sigY - 10,
      size: 16,
      color: rgb(0, 0, 0.8)
    })
  }

  // ================================
  // OPTIONAL FIELDS
  // ================================
  if (optionalFields && optionalFields.length > 0) {

    optionalFields.forEach(field => {

      if (!field.value) return

      const fieldPage = pages[field.page - 1] || pages[0]
      const pageSize = fieldPage.getSize()

      const fieldX = (field.x / 100) * pageSize.width
      const fieldY = pageSize.height - ((field.y / 100) * pageSize.height)

      fieldPage.drawText(field.value, {
        x: fieldX,
        y: fieldY,
        size: 12,
        color: rgb(0, 0, 0.7)
      })
    })
  }

  // ================================
  // SAVE OUTPUT (LOCAL TEMP FILE)
  // ================================
  const signedBytes = await pdfDoc.save()

  const fileName = `signed-${Date.now()}.pdf`
  const outputPath = path.join('uploads', fileName)

  fs.writeFileSync(outputPath, signedBytes)

  console.log('✅ Signed PDF generated')

  return fileName
}

module.exports = { embedSignature 
}