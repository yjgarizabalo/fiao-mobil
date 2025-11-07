export const AuthMessages = {
  validation: {
    emptyFields: {
      title: '¡Ups! Faltan algunos datos',
      message: 'Para continuar, necesitamos que completes tu correo electrónico y contraseña. ¡Es súper rápido!'
    },
    invalidEmail: {
      title: 'Correo no válido',
      message: 'El formato del correo electrónico no es correcto. Por favor verifica que esté bien escrito.'
    }
  },
  login: {
    invalidCredentials: {
      title: 'Credenciales incorrectas',
      message: 'El correo o contraseña que ingresaste no coinciden con nuestros registros. ¿Quizás olvidaste tu contraseña?'
    },
    networkError: {
      title: 'Problema de conexión',
      message: 'No pudimos conectarnos al servidor. Verifica tu conexión a internet e intenta nuevamente.'
    },
    serverError: {
      title: 'Error del servidor',
      message: 'Estamos experimentando problemas técnicos. Por favor intenta nuevamente en unos minutos.'
    },
    unknownError: {
      title: 'Algo salió mal',
      message: 'Ocurrió un error inesperado. Si el problema persiste, contáctanos para ayudarte.'
    }
  }
};