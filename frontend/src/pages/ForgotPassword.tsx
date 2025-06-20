// frontend/src/pages/ForgotPassword.tsx
import { useState } from 'react';
import { Link } from 'react-router-dom';
import { passwordResetService } from '../services/passwordResetService';
import Swal from 'sweetalert2';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Validar email
    const emailValidation = passwordResetService.validateEmail(email);
    if (!emailValidation.isValid) {
      setErrors(emailValidation.errors);
      return;
    }

    setLoading(true);
    setErrors([]);

    try {
      const result = await passwordResetService.forgotPassword({ email });
      
      // Mostrar éxito
      await Swal.fire({
        title: '📧 Email Enviado',
        html: `
          <div class="text-left">
            <p class="mb-3">${result.message}</p>
            <div class="bg-blue-50 p-3 rounded-lg text-sm">
              <p class="font-medium text-blue-800 mb-2">📋 Instrucciones:</p>
              <ul class="text-blue-700 space-y-1">
                <li>• Revisa tu bandeja de entrada y spam</li>
                <li>• El enlace expira en 1 hora</li>
                <li>• Si no recibes el email, intenta nuevamente</li>
              </ul>
            </div>
            ${result.resetToken ? `
              <div class="bg-yellow-50 p-3 rounded-lg text-sm mt-3">
                <p class="font-medium text-yellow-800 mb-1">🧪 Modo Desarrollo:</p>
                <p class="text-yellow-700">Token: <code class="bg-yellow-200 px-1 rounded">${result.resetToken}</code></p>
              </div>
            ` : ''}
          </div>
        `,
        icon: 'success',
        confirmButtonColor: '#39A900',
        confirmButtonText: 'Entendido'
      });

      setSubmitted(true);

    } catch (error: any) {
      console.error('Error en forgot password:', error);
      
      await Swal.fire({
        title: '❌ Error',
        text: error.message,
        icon: 'error',
        confirmButtonColor: '#dc2626'
      });
    } finally {
      setLoading(false);
    }
  };

  if (submitted) {
    return (
      <div className="min-h-screen bg-green-600 flex items-center justify-center p-4">
        <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full text-center">
          <div className="mb-6">
            <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-gray-800 mb-2">Email Enviado</h1>
            <p className="text-gray-600">
              Hemos enviado las instrucciones de recuperación a <strong>{email}</strong>
            </p>
          </div>

          <div className="space-y-4">
            <div className="bg-blue-50 p-4 rounded-lg text-left">
              <h3 className="font-medium text-blue-800 mb-2">📋 Próximos pasos:</h3>
              <ol className="text-sm text-blue-700 space-y-1">
                <li>1. Revisa tu bandeja de entrada</li>
                <li>2. Busca también en spam/correo no deseado</li>
                <li>3. Haz clic en el enlace del email</li>
                <li>4. Crea tu nueva contraseña</li>
              </ol>
            </div>

            <div className="flex flex-col space-y-3">
              <button
                onClick={() => {
                  setSubmitted(false);
                  setEmail('');
                }}
                className="text-green-600 hover:text-green-700 text-sm font-medium"
              >
                Probar con otro email
              </button>
              
              <Link
                to="/login"
                className="inline-flex items-center justify-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
              >
                Volver al Login
              </Link>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-green-600 flex items-center justify-center p-4">
      <div className="bg-white p-8 rounded-lg shadow-xl max-w-md w-full">
        <div className="text-center mb-8">
          <div className="mx-auto w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 7a2 2 0 012 2m4 0a6 6 0 01-6 6c-3 0-6-1-6-4a6 6 0 016-6c2 0 4 1 4 4z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10a4 4 0 01-8 0 4 4 0 018 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-gray-800">¿Olvidaste tu contraseña?</h1>
          <p className="text-gray-600 mt-2">
            No te preocupes, te enviaremos instrucciones para recuperarla
          </p>
        </div>

        {/* Mostrar errores */}
        {errors.length > 0 && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
            <ul className="text-red-700 text-sm">
              {errors.map((error, index) => (
                <li key={index}>• {error}</li>
              ))}
            </ul>
          </div>
        )}

        <form onSubmit={handleSubmit}>
          <div className="mb-6">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Correo electrónico
            </label>
            <input
              type="email"
              id="email"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-transparent"
              placeholder="tu-email@ejemplo.com"
              value={email}
              onChange={(e) => {
                setEmail(e.target.value);
                setErrors([]);
              }}
              disabled={loading}
              required
            />
            <p className="text-sm text-gray-500 mt-2">
              Ingresa el email asociado a tu cuenta SENA
            </p>
          </div>

          <button
            type="submit"
            className="w-full bg-green-600 text-white py-2 px-4 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors flex justify-center items-center"
            disabled={loading}
          >
            {loading ? (
              <>
                <svg className="animate-spin h-5 w-5 mr-2 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Enviando...</span>
              </>
            ) : (
              'Enviar instrucciones'
            )}
          </button>

          <div className="mt-6 text-center space-y-3">
            <Link
              to="/login"
              className="block text-green-600 hover:text-green-700 text-sm font-medium hover:underline"
            >
              ← Volver al login
            </Link>
            
            <div className="text-xs text-gray-500">
              <p>¿No tienes cuenta? Contacta al administrador del sistema</p>
            </div>
          </div>
        </form>

        {/* Información adicional */}
        <div className="mt-8 bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-sm font-medium text-blue-800 mb-2">💡 Información importante:</h3>
          <ul className="text-xs text-blue-700 space-y-1">
            <li>• El enlace de recuperación expira en 1 hora</li>
            <li>• Solo puedes usar el enlace una vez</li>
            <li>• Si no recibes el email, verifica tu carpeta de spam</li>
            <li>• Para problemas técnicos, contacta al soporte</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;