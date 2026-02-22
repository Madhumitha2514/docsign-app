const fs = require('fs')
const path = require('path')
const { PDFDocument, rgb } = require('pdf-lib')

/**
 * Embeds signature AND optional fields into PDF
 */
async function embedSignature(originalPath, signature, optionalFields = []) {
  console.log('\n🔧 ===== STARTING PDF EMBEDDING =====')
  console.log('📄 PDF file:', originalPath)
  console.log('✍️ Signature type:', signature.signatureImage ? 'IMAGE' : signature.signatureText ? 'TEXT' : 'NAME')
  console.log('📍 Signature position:', `${signature.xPercent.toFixed(1)}%, ${signature.yPercent.toFixed(1)}%`)
  console.log('📋 Optional fields:', optionalFields.length)

  // Load PDF
  const pdfBytes = fs.readFileSync(originalPath)
  const pdfDoc = await PDFDocument.load(pdfBytes)
  
  // Get pages
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
  // STEP 2: EMBED OPTIONAL FIELDS (FIXED COORDINATES)
  // ============================================
  if (optionalFields && optionalFields.length > 0) {
    console.log('\n📝 ===== EMBEDDING OPTIONAL FIELDS =====')
    
    optionalFields.forEach((field, index) => {
      if (!field.value) return // Skip empty fields
      
      const fieldPage = pages[field.page - 1] || pages[0]
      const pageSize = fieldPage.getSize()
      
      // 🔥 FIX: Use same coordinate conversion as signature
      const fieldX = (field.x / 100) * pageSize.width
      const fieldY = pageSize.height - ((field.y / 100) * pageSize.height)
      
      console.log(`  ${index + 1}. ${field.label}: "${field.value}"`)
      console.log(`     Position: ${field.x.toFixed(1)}%, ${field.y.toFixed(1)}% → (${fieldX.toFixed(0)}, ${fieldY.toFixed(0)})pt`)
      
      // Calculate text width to center properly
      const fontSize = 12
      const textWidth = field.value.length * fontSize * 0.5 // Approximate
      
      // Draw field value (centered at position)
      fieldPage.drawText(field.value, {
        x: fieldX - (textWidth / 2),
        y: fieldY - 8,
        size: fontSize,
        color: rgb(0, 0, 0.7)
      })
      
      // Draw underline
      fieldPage.drawLine({
        start: { x: fieldX - (textWidth / 2) - 5, y: fieldY - 12 },
        end: { x: fieldX + (textWidth / 2) + 5, y: fieldY - 12 },
        thickness: 0.5,
        color: rgb(0.5, 0.5, 0.5)
      })
    })
    
    console.log(`✅ ${optionalFields.filter(f => f.value).length} optional fields embedded`)
  }

  // ============================================
  // STEP 3: SAVE PDF
  // ============================================
  const signedBytes = await pdfDoc.save()
  const fileName = `signed-${Date.now()}-${path.basename(originalPath)}`
  const outputPath = path.join('uploads', fileName)
  fs.writeFileSync(outputPath, signedBytes)
  
  console.log(`\n💾 Saved: ${fileName} (${(signedBytes.length / 1024).toFixed(1)}KB)`)
  console.log('✅ ===== PDF EMBEDDING COMPLETE =====\n')
  
  return fileName
}

module.exports = { embedSignature }