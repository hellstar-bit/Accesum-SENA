// ⭐ GENERADOR DE CARNETS PROFESIONAL Y MINIMALISTA - CORREGIDO
// Archivo: frontend/src/utils/carnetGenerator.ts

export const generateModernCarnet = (profile: any) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Error al generar el carnet');
    return;
  }

  // ⭐ CONFIGURACIÓN PROFESIONAL DEL CARNET (Proporción tarjeta estándar)
  canvas.width = 400;
  canvas.height = 750; // ⭐ AUMENTADO PARA MEJOR ESPACIADO

  // ✨ FONDO MINIMALISTA CON GRADIENTE SUTIL
  const backgroundGradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  backgroundGradient.addColorStop(0, '#ffffff');
  backgroundGradient.addColorStop(0.05, '#f8fafc');
  backgroundGradient.addColorStop(1, '#f1f5f9');
  
  ctx.fillStyle = backgroundGradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ✨ BORDE EXTERIOR PROFESIONAL
  ctx.strokeStyle = '#e2e8f0';
  ctx.lineWidth = 2;
  ctx.strokeRect(1, 1, canvas.width - 2, canvas.height - 2);

  // ⭐ HEADER PRINCIPAL CON LOGO SENA (Mejorado)
  const headerHeight = 80;
  
  // Fondo del header con gradiente del SENA
  const headerGradient = ctx.createLinearGradient(0, 0, 0, headerHeight);
  headerGradient.addColorStop(0, '#39A900');
  headerGradient.addColorStop(1, '#2d7a00');
  
  ctx.fillStyle = headerGradient;
  ctx.fillRect(0, 0, canvas.width, headerHeight);

  // Logo del SENA (Diseño profesional)
  const logoX = 20;
  const logoY = 15;
  const logoSize = 50;

  // Círculo principal del logo
  ctx.fillStyle = '#ffffff';
  ctx.beginPath();
  ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, 2 * Math.PI);
  ctx.fill();

  // Texto SENA dentro del logo
  ctx.fillStyle = '#39A900';
  ctx.font = 'bold 12px Arial, sans-serif';
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillText('SENA', logoX + logoSize/2, logoY + logoSize/2);

  // Títulos del header
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 16px Arial, sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'top';
  ctx.fillText('CARNET INSTITUCIONAL', logoX + logoSize + 15, logoY + 8);

  ctx.font = '11px Arial, sans-serif';
  ctx.fillText('Servicio Nacional de Aprendizaje', logoX + logoSize + 15, logoY + 28);
  ctx.fillText('Control de Acceso • ACCESUM', logoX + logoSize + 15, logoY + 42);

  // ⭐ FUNCIÓN PARA OBTENER COLORES POR ROL (Paleta profesional)
  const getRoleColor = (role: string) => {
    const colors: Record<string, { bg: string; text: string; accent: string }> = {
      'Aprendiz': { bg: '#ecfdf5', text: '#065f46', accent: '#10b981' },
      'Instructor': { bg: '#eff6ff', text: '#1e40af', accent: '#3b82f6' },
      'Administrador': { bg: '#faf5ff', text: '#6b21a8', accent: '#9333ea' },
      'Funcionario': { bg: '#eef2ff', text: '#3730a3', accent: '#6366f1' },
      'Contratista': { bg: '#fff7ed', text: '#c2410c', accent: '#f97316' },
      'Visitante': { bg: '#f8fafc', text: '#475569', accent: '#64748b' },
      'Escaner': { bg: '#fefce8', text: '#a16207', accent: '#eab308' }
    };
    return colors[role] || colors['Visitante'];
  };

  // ⭐ SECCIÓN DE FOTO PROFESIONAL
  const photoX = 140;
  const photoY = headerHeight + 30;
  const photoSize = 120;

  // Función para continuar después de cargar imágenes
  const continuarGenerandoCarnet = () => {
    if (!ctx) return;

    // ⭐ INFORMACIÓN PERSONAL - DISEÑO MINIMALISTA
    const infoStartY = photoY + photoSize + 30;
    
    // ROL con badge profesional
    const userRole = profile.role?.name || profile.type?.name || 'Usuario';
    const roleColor = getRoleColor(userRole);
    
    // Badge del rol (centrado y profesional)
    const badgeWidth = 140;
    const badgeHeight = 24;
    const badgeX = (canvas.width - badgeWidth) / 2;
    const badgeY = infoStartY;
    
    // Fondo del badge
    ctx.fillStyle = roleColor.bg;
    ctx.fillRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Borde del badge
    ctx.strokeStyle = roleColor.accent;
    ctx.lineWidth = 1;
    ctx.strokeRect(badgeX, badgeY, badgeWidth, badgeHeight);
    
    // Texto del rol
    ctx.fillStyle = roleColor.text;
    ctx.font = 'bold 11px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(userRole.toUpperCase(), badgeX + badgeWidth/2, badgeY + badgeHeight/2);

    // NOMBRE COMPLETO (Centrado y profesional)
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 18px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    const fullName = `${profile.firstName} ${profile.lastName}`;
    
    // Ajustar texto si es muy largo
    let fontSize = 18;
    ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    while (ctx.measureText(fullName).width > canvas.width - 40 && fontSize > 12) {
      fontSize--;
      ctx.font = `bold ${fontSize}px Arial, sans-serif`;
    }
    
    ctx.fillText(fullName, canvas.width / 2, badgeY + 40);

    // DOCUMENTO (Centrado)
    ctx.fillStyle = '#64748b';
    ctx.font = '13px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.fillText(`${profile.documentType}: ${profile.documentNumber}`, canvas.width / 2, badgeY + 70);

    // ⭐ INFORMACIÓN PERSONAL ADICIONAL
    const personalInfoY = badgeY + 100;
    
    // Línea separadora sutil
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, personalInfoY);
    ctx.lineTo(canvas.width - 30, personalInfoY);
    ctx.stroke();

    // ⭐ INFORMACIÓN PERSONAL CON TIPO DE SANGRE
    ctx.fillStyle = '#374151';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
    
    let currentY = personalInfoY + 20;
    
    // Tipo de sangre (si está disponible)
    if (profile.bloodType) {
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('TIPO DE SANGRE:', 30, currentY);
      
      // Destacar el tipo de sangre
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(160, currentY - 2, 40, 18);
      ctx.strokeStyle = '#dc2626';
      ctx.lineWidth = 2;
      ctx.strokeRect(160, currentY - 2, 40, 18);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(profile.bloodType, 180, currentY + 2);
      
      currentY += 35; // ⭐ INCREMENTAR POSICIÓN Y CON MEJOR ESPACIADO
    }

    // ⭐ INFORMACIÓN INSTITUCIONAL CORREGIDA
    // Línea separadora para información institucional
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, currentY);
    ctx.lineTo(canvas.width - 30, currentY);
    ctx.stroke();

    currentY += 20;

    // CENTRO DE FORMACIÓN (Corregido)
    const centerName = profile.center?.name || profile.center || 'Centro de Formación';
    
    ctx.fillStyle = '#059669';
    ctx.font = 'bold 12px Arial, sans-serif';
    ctx.textAlign = 'left';
    ctx.fillText('CENTRO:', 30, currentY);
    
    ctx.fillStyle = '#374151';
    ctx.font = '11px Arial, sans-serif';
    ctx.textAlign = 'left';
    
    // Manejo profesional de texto largo para centro
    const maxWidth = canvas.width - 60;
    const centerWords = centerName.split(' ');
    let centerLine = '';
    let centerLineY = currentY + 20;
    
    for (let i = 0; i < centerWords.length; i++) {
      const testLine = centerLine + centerWords[i] + ' ';
      const metrics = ctx.measureText(testLine);
      const testWidth = metrics.width;
      
      if (testWidth > maxWidth && i > 0) {
        ctx.fillText(centerLine.trim(), 30, centerLineY);
        centerLine = centerWords[i] + ' ';
        centerLineY += 16;
      } else {
        centerLine = testLine;
      }
    }
    ctx.fillText(centerLine.trim(), 30, centerLineY);
    currentY = centerLineY + 30; // ⭐ MEJOR ESPACIADO DESPUÉS DEL CENTRO

    // INFORMACIÓN DE FICHA (Solo para aprendices)
    if (profile.ficha && userRole === 'Aprendiz') {
      // Ficha
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('FICHA:', 30, currentY);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText(profile.ficha.code, 80, currentY);

      currentY += 25;

      // Programa (con manejo de texto largo) - ⭐ TOTALMENTE CORREGIDO
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('PROGRAMA:', 30, currentY);
      
      ctx.fillStyle = '#374151';
      ctx.font = '11px Arial, sans-serif';
      ctx.textAlign = 'left';
      
      // ⭐ MANEJO CORREGIDO DEL TEXTO DEL PROGRAMA
      const programName = profile.ficha.name || 'Programa no especificado';
      const programWords = programName.split(' ');
      let programLine = '';
      let programLineY = currentY + 20;
      const programStartX = 30;
      const programMaxWidth = canvas.width - 60;
      let maxProgramLineY = programLineY; // ⭐ RASTREAR LA LÍNEA MÁS BAJA
      
      for (let i = 0; i < programWords.length; i++) {
        const testProgramLine = programLine + programWords[i] + ' ';
        ctx.font = '11px Arial, sans-serif';
        const programMetrics = ctx.measureText(testProgramLine);
        const testProgramWidth = programMetrics.width;
        
        if (testProgramWidth > programMaxWidth && i > 0) {
          ctx.fillText(programLine.trim(), programStartX, programLineY);
          programLine = programWords[i] + ' ';
          programLineY += 16;
          maxProgramLineY = programLineY; // ⭐ ACTUALIZAR LA POSICIÓN MÁS BAJA
        } else {
          programLine = testProgramLine;
        }
      }
      
      // Dibujar la última línea y actualizar posición
      if (programLine.trim()) {
        ctx.fillText(programLine.trim(), programStartX, programLineY);
        maxProgramLineY = programLineY;
      }
      
      // ⭐ ACTUALIZAR currentY CORRECTAMENTE BASADO EN LA ÚLTIMA LÍNEA DIBUJADA
      currentY = maxProgramLineY + 40; // ESPACIADO GENEROSO DESPUÉS DEL PROGRAMA
    }

    // ⭐ ASEGURAR ESPACIO MÍNIMO ANTES DEL QR
    const minSpaceBeforeQR = 40;
    const qrSectionHeight = 180;
    const calculatedQrY = currentY + minSpaceBeforeQR;
    const maxAllowedQrY = canvas.height - qrSectionHeight;
    
    // ⭐ USAR LA POSICIÓN CALCULADA O AJUSTAR SI ES NECESARIO
    const qrSectionY = Math.min(calculatedQrY, maxAllowedQrY);
    
    // ⭐ CÓDIGO QR - SECCIÓN PROFESIONAL CON POSICIONAMIENTO DINÁMICO
    // Línea separadora antes del QR
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, qrSectionY - 10);
    ctx.lineTo(canvas.width - 30, qrSectionY - 10);
    ctx.stroke();
    
    if (profile.qrCode) {
      // Título del QR
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 11px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'top';
      ctx.fillText('CÓDIGO DE ACCESO', canvas.width / 2, qrSectionY + 5);

      const qrImg = new Image();
      qrImg.onload = () => {
        if (!ctx) return;
        
        // QR centrado con marco profesional
        const qrSize = 110;
        const qrX = (canvas.width - qrSize) / 2;
        const qrY_pos = qrSectionY + 25;
        
        // Marco del QR con sombra sutil
        ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
        ctx.shadowBlur = 5;
        ctx.shadowOffsetY = 2;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 5, qrY_pos - 5, qrSize + 10, qrSize + 10);
        
        // Borde del marco
        ctx.shadowBlur = 0;
        ctx.shadowOffsetY = 0;
        ctx.strokeStyle = '#d1d5db';
        ctx.lineWidth = 1;
        ctx.strokeRect(qrX - 5, qrY_pos - 5, qrSize + 10, qrSize + 10);
        
        // Dibujar QR
        ctx.drawImage(qrImg, qrX, qrY_pos, qrSize, qrSize);
        
        finalizarCarnet();
      };
      qrImg.src = profile.qrCode;
    } else {
      // Sin QR - Diseño profesional
      const noQrY = qrSectionY + 20;
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(30, noQrY, canvas.width - 60, 60);
      
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, noQrY, canvas.width - 60, 60);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CÓDIGO QR NO DISPONIBLE', canvas.width / 2, noQrY + 30);
      
      finalizarCarnet();
    }
  };

  // ⭐ FINALIZAR CARNET
  const finalizarCarnet = () => {
    if (!ctx) return;

    // Footer minimalista
    const footerY = canvas.height - 25;
    
    // Línea decorativa sutil
    ctx.strokeStyle = '#cbd5e1';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(20, footerY - 10);
    ctx.lineTo(canvas.width - 20, footerY - 10);
    ctx.stroke();

    // Texto del footer
    ctx.fillStyle = '#64748b';
    ctx.font = '9px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'top';
    ctx.fillText('ACCESUM v2.0 • Sistema de Control de Acceso', canvas.width / 2, footerY - 5);
    
    ctx.font = '8px Arial, sans-serif';
    ctx.fillStyle = '#94a3b8';
    ctx.fillText(`Generado: ${new Date().toLocaleDateString('es-CO')}`, canvas.width / 2, footerY + 8);

    // Descargar el carnet
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carnet_${profile.documentNumber}_profesional.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png', 1.0);
  };

  // ⭐ CARGAR FOTO DE PERFIL CON MARCO PROFESIONAL
  if (profile.profileImage) {
    const img = new Image();
    img.onload = () => {
      if (!ctx) return;
      
      // Marco con sombra profesional
      ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
      ctx.shadowBlur = 8;
      ctx.shadowOffsetY = 4;
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
      
      // Resetear sombra
      ctx.shadowBlur = 0;
      ctx.shadowOffsetY = 0;
      
      // Recortar imagen como círculo
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
      ctx.clip();
      
      // Dibujar imagen centrada y escalada
      ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
      ctx.restore();
      
      // Borde circular profesional
      ctx.strokeStyle = '#d1d5db';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
      ctx.stroke();
      
      continuarGenerandoCarnet();
    };
    img.crossOrigin = 'anonymous';
    img.src = profile.profileImage;
  } else {
    // Avatar placeholder profesional
    // Marco con sombra
    ctx.shadowColor = 'rgba(0, 0, 0, 0.15)';
    ctx.shadowBlur = 8;
    ctx.shadowOffsetY = 4;
    ctx.fillStyle = '#ffffff';
    ctx.fillRect(photoX - 8, photoY - 8, photoSize + 16, photoSize + 16);
    
    // Resetear sombra
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;
    
    // Fondo del avatar
    ctx.fillStyle = '#f1f5f9';
    ctx.beginPath();
    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Iniciales profesionales
    ctx.fillStyle = '#64748b';
    ctx.font = 'bold 32px Arial, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    const initials = profile.firstName.charAt(0) + profile.lastName.charAt(0);
    ctx.fillText(initials.toUpperCase(), photoX + photoSize/2, photoY + photoSize/2);
    
    // Borde circular
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
    ctx.stroke();
    
    continuarGenerandoCarnet();
  }
};

// ⭐ FUNCIONES EXPORTADAS CORREGIDAS
export const downloadModernCarnet = (profile: any) => {
  console.log('🎨 Generando carnet para:', profile);
  
  generateModernCarnet({
    firstName: profile.firstName,
    lastName: profile.lastName,
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    bloodType: profile.bloodType,
    profileImage: profile.profileImage,
    qrCode: profile.qrCode,
    role: { name: profile.type?.name || 'Usuario' },
    type: profile.type,
    center: profile.center,
    regional: profile.regional,
    ficha: profile.ficha
  });
};

export const downloadUserCarnet = (user: any) => {
  console.log('🎨 Generando carnet para usuario:', user);
  
  generateModernCarnet({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    documentType: user.profile.documentType,
    documentNumber: user.profile.documentNumber,
    bloodType: user.profile.bloodType,
    profileImage: user.profile.profileImage,
    qrCode: user.profile.qrCode,
    role: user.role,
    type: user.profile.type,
    center: user.profile.center,
    regional: user.profile.regional,
    ficha: user.profile.ficha
  });
};

export const downloadLearnerCarnet = (profile: any) => {
  console.log('🎨 Generando carnet para aprendiz:', profile);
  
  generateModernCarnet({
    firstName: profile.firstName,
    lastName: profile.lastName,
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    bloodType: profile.bloodType,
    profileImage: profile.profileImage,
    qrCode: profile.qrCode,
    role: { name: 'Aprendiz' },
    type: profile.type,
    center: profile.center,
    regional: profile.regional,
    ficha: profile.ficha
  });
};
