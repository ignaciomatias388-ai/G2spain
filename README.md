# G2Spain Auto — Web oficial

Sitio web de importación de vehículos desde Alemania a España.  
Desplegado en **Vercel** con actualizaciones automáticas desde **GitHub**.

---

## Estructura del proyecto

```
Gspain/
├── index.html        ← HTML principal (estructura y contenido)
├── css/
│   └── styles.css    ← Todo el CSS (colores, tipografía, layout)
├── js/
│   └── main.js       ← Todo el JavaScript (calculadora, catálogo, animaciones)
├── vercel.json       ← Configuración de Vercel (cabeceras de seguridad)
├── .gitignore        ← Archivos ignorados por Git
└── README.md         ← Este archivo
```

> Las imágenes están alojadas en Cloudinary, ibb.co y Wikimedia (sin archivos locales).

---

## Cómo editar la web

| Qué quieres cambiar | Archivo a editar |
|---|---|
| Textos, secciones, HTML | `index.html` |
| Colores, tipografía, layout | `css/styles.css` |
| Calculadora, catálogo, animaciones | `js/main.js` |
| Cabeceras de seguridad (Vercel) | `vercel.json` |

---

## Cómo guardar cambios en GitHub

Cada vez que edites la web, ejecuta estos 3 comandos en la terminal:

```bash
# 1. Ir a la carpeta del proyecto
cd ~/Desktop/Gspain

# 2. Preparar los cambios
git add .

# 3. Guardar con descripción del cambio
git commit -m "Descripción de lo que cambiaste"

# 4. Subir a GitHub
git push
```

---

## Cómo funciona el despliegue automático

```
Tú editas un archivo
        ↓
git add . && git commit -m "..." && git push
        ↓
GitHub recibe los cambios
        ↓
Vercel detecta el push automáticamente
        ↓
La web se actualiza en ~30 segundos
```

No es necesario hacer nada más en Vercel — el despliegue es completamente automático.

---

## Primer uso — configurar Git (solo la primera vez)

Si aún no tienes el repositorio conectado a GitHub:

```bash
cd ~/Desktop/Gspain

# Inicializar Git
git init
git add .
git commit -m "Primera versión"

# Conectar con GitHub (reemplaza la URL con la tuya)
git remote add origin https://github.com/TU_USUARIO/g2spain.git
git branch -M main
git push -u origin main
```

Luego en Vercel: **Add New Project → Import Git Repository → seleccionar g2spain**.  
Vercel detecta automáticamente que es un proyecto estático — sin configuración adicional.

---

## Datos de contacto del proyecto

- **WhatsApp:** +49 177 180 0435  
- **Instagram:** [@ger2spainauto](https://www.instagram.com/ger2spainauto)  
- **Calendly:** ignaciomatias388/30min
