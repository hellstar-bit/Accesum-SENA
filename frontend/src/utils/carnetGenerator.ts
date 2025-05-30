// ⭐ GENERADOR DE CARNETS PROFESIONAL Y MINIMALISTA
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
  canvas.height = 630;

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

    // ⭐ INFORMACIÓN INSTITUCIONAL
    const institutionalY = badgeY + 100;
    
    // Línea separadora sutil
    ctx.strokeStyle = '#e2e8f0';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(30, institutionalY);
    ctx.lineTo(canvas.width - 30, institutionalY);
    ctx.stroke();

    // INFORMACIÓN DE FICHA (Solo para aprendices)
    if (profile.ficha && userRole === 'Aprendiz') {
      // Ficha
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.textBaseline = 'top';
      ctx.fillText('FICHA:', 30, institutionalY + 20);
      
      ctx.fillStyle = '#374151';
      ctx.font = '12px Arial, sans-serif';
      ctx.fillText(profile.ficha.code, 80, institutionalY + 20);

      // Programa (con manejo de texto largo)
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.fillText('PROGRAMA:', 30, institutionalY + 40);
      
      ctx.fillStyle = '#374151';
      ctx.font = '11px Arial, sans-serif';
      
      // Manejo profesional de texto largo
      let programName = profile.ficha.name;
      const maxWidth = canvas.width - 60;
      const words = programName.split(' ');
      let line = '';
      let y = institutionalY + 60;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line.trim(), 30, y);
          line = words[i] + ' ';
          y += 16;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 30, y);
    } else {
      // Para otros roles, mostrar centro de formación
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'left';
      ctx.fillText('CENTRO:', 30, institutionalY + 20);
      
      ctx.fillStyle = '#374151';
      ctx.font = '11px Arial, sans-serif';
      
      const centerName = profile.center?.name || 'Centro de Formación';
      const maxWidth = canvas.width - 60;
      const words = centerName.split(' ');
      let line = '';
      let y = institutionalY + 40;
      
      for (let i = 0; i < words.length; i++) {
        const testLine = line + words[i] + ' ';
        const metrics = ctx.measureText(testLine);
        const testWidth = metrics.width;
        
        if (testWidth > maxWidth && i > 0) {
          ctx.fillText(line.trim(), 30, y);
          line = words[i] + ' ';
          y += 16;
        } else {
          line = testLine;
        }
      }
      ctx.fillText(line.trim(), 30, y);
    }

    // ⭐ CÓDIGO QR - SECCIÓN PROFESIONAL
    const qrSectionY = canvas.height - 180;
    
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
      ctx.fillStyle = '#fef2f2';
      ctx.fillRect(30, qrSectionY + 20, canvas.width - 60, 60);
      
      ctx.strokeStyle = '#fecaca';
      ctx.lineWidth = 1;
      ctx.strokeRect(30, qrSectionY + 20, canvas.width - 60, 60);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 12px Arial, sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('CÓDIGO QR NO DISPONIBLE', canvas.width / 2, qrSectionY + 50);
      
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
    }, 'image/png', 1.0); // Máxima calidad
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

// ⭐ FUNCIONES EXPORTADAS (Sin cambios en la interfaz)
export const downloadModernCarnet = (profile: any) => {
  generateModernCarnet({
    firstName: profile.firstName,
    lastName: profile.lastName,
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    profileImage: profile.profileImage,
    qrCode: profile.qrCode,
    role: { name: profile.type?.name || 'Usuario' },
    type: profile.type,
    center: profile.center,
    ficha: profile.ficha
  });
};

export const downloadUserCarnet = (user: any) => {
  generateModernCarnet({
    firstName: user.profile.firstName,
    lastName: user.profile.lastName,
    documentType: user.profile.documentType,
    documentNumber: user.profile.documentNumber,
    profileImage: user.profile.profileImage,
    qrCode: user.profile.qrCode,
    role: user.role,
    type: user.profile.type,
    center: user.profile.center,
    ficha: user.profile.ficha
  });
};

export const downloadLearnerCarnet = (profile: any) => {
  generateModernCarnet({
    firstName: profile.firstName,
    lastName: profile.lastName,
    documentType: profile.documentType,
    documentNumber: profile.documentNumber,
    profileImage: profile.profileImage,
    qrCode: profile.qrCode,
    role: { name: 'Aprendiz' },
    type: profile.type,
    center: profile.center,
    ficha: profile.ficha
  });
};