// ⭐ UTILIDAD CENTRAL PARA GENERAR CARNETS MODERNOS
// Archivo: frontend/src/utils/carnetGenerator.ts

export const generateModernCarnet = (profile: any) => {
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');
  if (!ctx) {
    alert('Error al generar el carnet');
    return;
  }

  // ⭐ CONFIGURACIÓN MODERNA DEL CARNET
  canvas.width = 400;
  canvas.height = 640;

  // ✨ FONDO CON GRADIENTE MODERNO
  const gradient = ctx.createLinearGradient(0, 0, 0, canvas.height);
  gradient.addColorStop(0, '#1e40af'); // Azul oscuro
  gradient.addColorStop(0.3, '#3b82f6'); // Azul medio
  gradient.addColorStop(0.7, '#60a5fa'); // Azul claro
  gradient.addColorStop(1, '#93c5fd'); // Azul muy claro

  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // ✨ OVERLAY PATTERN SUTIL
  ctx.globalAlpha = 0.1;
  for (let i = 0; i < canvas.width; i += 20) {
    for (let j = 0; j < canvas.height; j += 20) {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(i, j, 2, 2);
    }
  }
  ctx.globalAlpha = 1;

  // ⭐ HEADER PRINCIPAL CON LOGO SENA
  ctx.fillStyle = '#ffffff';
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 10;
  ctx.shadowOffsetY = 5;
  ctx.fillRect(20, 20, canvas.width - 40, 100);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // Logo del SENA (versión mejorada)
  const logoX = 40;
  const logoY = 40;
  const logoSize = 60;

  // Círculo principal del logo
  ctx.fillStyle = '#39A900';
  ctx.beginPath();
  ctx.arc(logoX + logoSize/2, logoY + logoSize/2, logoSize/2, 0, 2 * Math.PI);
  ctx.fill();

  // Texto SENA dentro del logo
  ctx.fillStyle = '#ffffff';
  ctx.font = 'bold 14px Arial';
  ctx.textAlign = 'center';
  ctx.fillText('SENA', logoX + logoSize/2, logoY + logoSize/2 + 5);

  // Título "CARNET INSTITUCIONAL"
  ctx.fillStyle = '#1e40af';
  ctx.font = 'bold 18px Arial';
  ctx.textAlign = 'left';
  ctx.fillText('CARNET INSTITUCIONAL', logoX + logoSize + 20, logoY + 20);

  // Subtítulo
  ctx.fillStyle = '#6b7280';
  ctx.font = '12px Arial';
  ctx.fillText('Servicio Nacional de Aprendizaje', logoX + logoSize + 20, logoY + 40);
  ctx.fillText('Sistema de Control de Acceso', logoX + logoSize + 20, logoY + 55);

  // ⭐ SECCIÓN DE FOTO
  const photoX = 50;
  const photoY = 150;
  const photoSize = 120;

  // Marco de la foto con sombra
  ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
  ctx.shadowBlur = 15;
  ctx.shadowOffsetY = 8;
  ctx.fillStyle = '#ffffff';
  ctx.fillRect(photoX - 10, photoY - 10, photoSize + 20, photoSize + 20);
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // ⭐ FUNCIÓN PARA OBTENER COLORES POR ROL
  const getRoleColor = (role: string) => {
    const colors: Record<
      'Aprendiz' | 'Instructor' | 'Administrador' | 'Funcionario' | 'Contratista' | 'Visitante' | 'Escaner',
      { bg: string; text: string }
    > = {
      'Aprendiz': { bg: '#dcfce7', text: '#166534' },
      'Instructor': { bg: '#dbeafe', text: '#1d4ed8' },
      'Administrador': { bg: '#f3e8ff', text: '#7c2d12' },
      'Funcionario': { bg: '#e0e7ff', text: '#3730a3' },
      'Contratista': { bg: '#fed7aa', text: '#c2410c' },
      'Visitante': { bg: '#f1f5f9', text: '#475569' },
      'Escaner': { bg: '#fef3c7', text: '#92400e' }
    };
    if (role in colors) {
      return colors[role as keyof typeof colors];
    }
    return colors['Visitante'];
  };

  // Función para continuar después de cargar imágenes
  const continuarGenerandoCarnet = () => {
    if (!ctx) return;

    // ⭐ INFORMACIÓN PERSONAL - DISEÑO MODERNO
    const infoStartY = photoY + photoSize + 40;
    
    // Fondo blanco para la información
    ctx.fillStyle = '#ffffff';
    ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
    ctx.shadowBlur = 10;
    ctx.shadowOffsetY = 5;
    ctx.fillRect(20, infoStartY - 15, canvas.width - 40, 180);
    ctx.shadowBlur = 0;
    ctx.shadowOffsetY = 0;

    // ROL con badge moderno
    const roleY = infoStartY + 10;
    const userRole = profile.role?.name || profile.type?.name || 'Usuario';
    const roleColor = getRoleColor(userRole);
    
    // Badge del rol
    ctx.fillStyle = roleColor.bg;
    ctx.fillRect(40, roleY - 15, 120, 25);
    
    ctx.fillStyle = roleColor.text;
    ctx.font = 'bold 12px Arial';
    ctx.textAlign = 'center';
    ctx.fillText(userRole.toUpperCase(), 100, roleY);

    // NOMBRE COMPLETO
    ctx.fillStyle = '#1f2937';
    ctx.font = 'bold 20px Arial';
    ctx.textAlign = 'center';
    const fullName = `${profile.firstName} ${profile.lastName}`;
    
    // Ajustar texto si es muy largo
    if (fullName.length > 25) {
      ctx.font = 'bold 16px Arial';
    }
    ctx.fillText(fullName, canvas.width / 2, roleY + 40);

    // DOCUMENTO
    ctx.fillStyle = '#4b5563';
    ctx.font = '14px Arial';
    ctx.fillText(`${profile.documentType}: ${profile.documentNumber}`, canvas.width / 2, roleY + 65);

    // INFORMACIÓN DE FICHA (Solo para aprendices)
    if (profile.ficha && userRole === 'Aprendiz') {
      // Ficha
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('FICHA:', 40, roleY + 95);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '14px Arial';
      ctx.fillText(profile.ficha.code, 90, roleY + 95);

      // Programa
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial';
      ctx.fillText('PROGRAMA:', 40, roleY + 115);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '12px Arial';
      
      // Ajustar texto del programa si es muy largo
      let programName = profile.ficha.name;
      if (programName.length > 35) {
        const words = programName.split(' ');
        let line1 = '';
        let line2 = '';
        
        for (let i = 0; i < words.length; i++) {
          if ((line1 + words[i]).length < 35) {
            line1 += (line1 ? ' ' : '') + words[i];
          } else {
            line2 += (line2 ? ' ' : '') + words[i];
          }
        }
        
        ctx.fillText(line1, 40, roleY + 135);
        if (line2) {
          ctx.fillText(line2, 40, roleY + 150);
        }
      } else {
        ctx.fillText(programName, 40, roleY + 135);
      }
    } else {
      // Para otros roles, mostrar centro de formación
      ctx.fillStyle = '#059669';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'left';
      ctx.fillText('CENTRO:', 40, roleY + 95);
      
      ctx.fillStyle = '#1f2937';
      ctx.font = '11px Arial';
      
      const centerName = profile.center?.name || 'Centro de Formación';
      if (centerName.length > 35) {
        const words = centerName.split(' ');
        let line1 = '';
        let line2 = '';
        
        for (let i = 0; i < words.length; i++) {
          if ((line1 + words[i]).length < 35) {
            line1 += (line1 ? ' ' : '') + words[i];
          } else {
            line2 += (line2 ? ' ' : '') + words[i];
          }
        }
        
        ctx.fillText(line1, 40, roleY + 115);
        if (line2) {
          ctx.fillText(line2, 40, roleY + 130);
        }
      } else {
        ctx.fillText(centerName, 40, roleY + 115);
      }
    }

    // ⭐ CÓDIGO QR - SECCIÓN MODERNA
    const qrY = infoStartY + 200;
    
    if (profile.qrCode) {
      // Fondo para el QR
      ctx.fillStyle = '#f9fafb';
      ctx.fillRect(20, qrY - 10, canvas.width - 40, 140);
      
      // Título del QR
      ctx.fillStyle = '#374151';
      ctx.font = 'bold 12px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('CÓDIGO DE ACCESO', canvas.width / 2, qrY + 10);

      const qrImg = new Image();
      qrImg.onload = () => {
        if (!ctx) return;
        
        // QR centrado con marco
        const qrSize = 100;
        const qrX = (canvas.width - qrSize) / 2;
        
        // Marco del QR
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(qrX - 5, qrY + 15, qrSize + 10, qrSize + 10);
        
        ctx.drawImage(qrImg, qrX, qrY + 20, qrSize, qrSize);
        
        finalizarCarnet();
      };
      qrImg.src = profile.qrCode;
    } else {
      // Sin QR
      ctx.fillStyle = '#fee2e2';
      ctx.fillRect(20, qrY, canvas.width - 40, 80);
      
      ctx.fillStyle = '#dc2626';
      ctx.font = 'bold 14px Arial';
      ctx.textAlign = 'center';
      ctx.fillText('⚠️ CÓDIGO QR NO DISPONIBLE', canvas.width / 2, qrY + 45);
      
      finalizarCarnet();
    }
  };

  // ⭐ FINALIZAR Y DESCARGAR
  const finalizarCarnet = () => {
    if (!ctx) return;

    // Footer moderno
    const footerY = canvas.height - 40;
    
    // Línea decorativa
    const footerGradient = ctx.createLinearGradient(0, footerY - 20, canvas.width, footerY - 20);
    footerGradient.addColorStop(0, 'rgba(59, 130, 246, 0.5)');
    footerGradient.addColorStop(0.5, 'rgba(59, 130, 246, 1)');
    footerGradient.addColorStop(1, 'rgba(59, 130, 246, 0.5)');
    
    ctx.fillStyle = footerGradient;
    ctx.fillRect(0, footerY - 20, canvas.width, 3);

    // Texto del footer
    ctx.fillStyle = '#ffffff';
    ctx.font = 'bold 10px Arial';
    ctx.textAlign = 'center';
    ctx.fillText('ACCESUM v2.0 • Sistema de Control de Acceso', canvas.width / 2, footerY);
    
    ctx.font = '8px Arial';
    ctx.fillText(`Generado: ${new Date().toLocaleDateString('es-CO')}`, canvas.width / 2, footerY + 15);

    // Descargar el carnet
    canvas.toBlob((blob) => {
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `carnet_${profile.documentNumber}_moderno.png`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
      }
    }, 'image/png', 0.95);
  };

  // ⭐ CARGAR FOTO DE PERFIL
  if (profile.profileImage) {
    const img = new Image();
    img.onload = () => {
      if (!ctx) return;
      
      // Recortar imagen como círculo
      ctx.save();
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
      ctx.clip();
      
      // Dibujar imagen
      ctx.drawImage(img, photoX, photoY, photoSize, photoSize);
      ctx.restore();
      
      // Borde circular
      ctx.strokeStyle = '#e5e7eb';
      ctx.lineWidth = 3;
      ctx.beginPath();
      ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
      ctx.stroke();
      
      continuarGenerandoCarnet();
    };
    img.crossOrigin = 'anonymous';
    img.src = profile.profileImage;
  } else {
    // Avatar placeholder moderno
    ctx.fillStyle = '#f3f4f6';
    ctx.beginPath();
    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
    ctx.fill();
    
    // Iniciales
    ctx.fillStyle = '#6b7280';
    ctx.font = 'bold 36px Arial';
    ctx.textAlign = 'center';
    const initials = profile.firstName.charAt(0) + profile.lastName.charAt(0);
    ctx.fillText(initials, photoX + photoSize/2, photoY + photoSize/2 + 12);
    
    // Borde
    ctx.strokeStyle = '#d1d5db';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(photoX + photoSize/2, photoY + photoSize/2, photoSize/2, 0, 2 * Math.PI);
    ctx.stroke();
    
    continuarGenerandoCarnet();
  }
};

// ⭐ FUNCIÓN ACTUALIZADA PARA PROFILEVIEW.TSX
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

// ⭐ FUNCIÓN ACTUALIZADA PARA USERVIEW.TSX
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

// ⭐ FUNCIÓN ACTUALIZADA PARA LEARNERPROFILE.TSX
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

// ⭐ ACTUALIZACIÓN PARA PROFILEVIEW.TSX
// Reemplazar la función downloadCarnet existente:

/*
const downloadCarnet = () => {
  downloadModernCarnet(profile);
};
*/

// ⭐ ACTUALIZACIÓN PARA USERVIEW.TSX  
// Reemplazar la función downloadCarnet existente:

/*
const downloadCarnet = () => {
  downloadUserCarnet(user);
};
*/

// ⭐ ACTUALIZACIÓN PARA LEARNERPROFILE.TSX
// Reemplazar la función downloadCarnet existente:

/*
const downloadCarnet = () => {
  downloadLearnerCarnet(profile);
};
*/