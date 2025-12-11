# 📧 Configuración de Correo en Render

## Problema Resuelto
El sistema de correo no enviaba correos de verificación ni a estudiantes porque las credenciales estaban hardcodeadas y no configuradas como variables de entorno en Render.

## ✅ Solución Implementada

### 1. Configurar Variables de Entorno en Render

Ve a tu servicio en Render y configura las siguientes **Environment Variables**:

#### Variables REQUERIDAS:

| Variable | Valor | Descripción |
|----------|-------|-------------|
| `DB_PASSWORD` | `tu_password_mysql` | Contraseña de tu base de datos MySQL |
| `MAIL_USERNAME` | `tu_correo@gmail.com` | Tu correo de Gmail |
| `MAIL_PASSWORD` | `xxxx xxxx xxxx xxxx` | **Contraseña de aplicación de Gmail** |

#### Variables OPCIONALES (ya tienen valores por defecto):

| Variable | Valor por defecto | Descripción |
|----------|-------------------|-------------|
| `MAIL_HOST` | `smtp.gmail.com` | Servidor SMTP |
| `MAIL_PORT` | `587` | Puerto SMTP |
| `MAIL_TIMEOUT` | `10000` | Timeout en milisegundos |
| `MAIL_LOG_LEVEL` | `INFO` | Nivel de logging (DEBUG, INFO) |

### 2. Generar Contraseña de Aplicación de Gmail

**MUY IMPORTANTE**: No uses tu contraseña normal de Gmail. Debes generar una **contraseña de aplicación**:

1. Ve a [Google Account Security](https://myaccount.google.com/security)
2. Activa la **verificación en 2 pasos** (si no la tienes activada)
3. Ve a **Contraseñas de aplicaciones**: https://myaccount.google.com/apppasswords
4. Selecciona:
   - App: **Correo**
   - Dispositivo: **Otro (nombre personalizado)** → escribe "Render"
5. Haz clic en **Generar**
6. Copia la contraseña de 16 caracteres que aparece (formato: `xxxx xxxx xxxx xxxx`)
7. Usa esta contraseña en la variable `MAIL_PASSWORD` en Render

### 3. Configurar en Render Dashboard

#### Paso a paso:

1. Ve a tu servicio en Render: https://dashboard.render.com/
2. Selecciona tu servicio
3. Ve a la pestaña **Environment**
4. Haz clic en **Add Environment Variable**
5. Agrega cada variable:
   ```
   MAIL_USERNAME = tu_correo@gmail.com
   MAIL_PASSWORD = xxxx xxxx xxxx xxxx
   DB_PASSWORD = tu_password_mysql
   ```
6. Haz clic en **Save Changes**
7. Render automáticamente re-desplegará tu aplicación

### 4. Verificar que Funciona

Después del despliegue:

1. Ve a los **Logs** de tu servicio en Render
2. Verifica que no haya errores de autenticación de correo
3. Intenta registrar un estudiante
4. Verifica que el correo llegue correctamente

### 5. Troubleshooting

#### ❌ Error: "Authentication failed"
- Verifica que estés usando una **contraseña de aplicación**, no tu contraseña normal
- Verifica que la verificación en 2 pasos esté activada en Gmail

#### ❌ Error: "Username and Password not accepted"
- Revisa que el correo sea correcto
- Regenera la contraseña de aplicación

#### ❌ Los correos no llegan
- Verifica los logs de Render
- Activa DEBUG temporalmente: `MAIL_LOG_LEVEL=DEBUG`
- Revisa la carpeta de spam del destinatario

#### ❌ Timeout errors
- Aumenta el timeout: `MAIL_TIMEOUT=20000`

## 📋 Checklist de Configuración

- [ ] Verificación en 2 pasos activada en Gmail
- [ ] Contraseña de aplicación generada
- [ ] Variables de entorno configuradas en Render
- [ ] Servicio re-desplegado
- [ ] Logs verificados (sin errores)
- [ ] Correo de prueba enviado exitosamente

## 🔒 Seguridad

- ✅ Las credenciales ahora están en variables de entorno (no en el código)
- ✅ Usa contraseñas de aplicación específicas (más seguro)
- ✅ Las credenciales no se exponen en el repositorio
- ✅ Puedes revocar la contraseña de aplicación en cualquier momento sin cambiar tu contraseña de Gmail

## 📞 Soporte

Si sigues teniendo problemas:
1. Verifica los logs en Render
2. Activa `MAIL_LOG_LEVEL=DEBUG` para más detalles
3. Verifica que Gmail no esté bloqueando el acceso
