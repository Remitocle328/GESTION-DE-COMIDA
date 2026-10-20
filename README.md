# Hospedaje Los Peces: Gestor de Horarios y Comidas

¡Bienvenido! Esta es la aplicación profesional **Gestor de Horarios, Comidas y Pensiones**, diseñada especialmente para el Hospedaje Los Peces. Administra de forma inteligente los horarios escolares, los turnos de autobuses, las cancelaciones de clases, el control de pensiones, las prioridades de alimentación y el control diario de desayunos, almuerzos y cenas de los estudiantes.

La aplicación está diseñada para funcionar de forma **híbrida y universal**:
1. **Como Aplicación Web (PWA / SPA):** Compatible al 100% con todos los navegadores móviles y de escritorio. Soporta modo offline, almacenamiento en memoria del dispositivo (`localStorage`) y notificaciones.
2. **Como Aplicación Móvil (Android):** Configuraciones listas para compilar con **Capacitor**, soportando canales de alarmas críticas y notificaciones en segundo plano de alta prioridad.

---

## Características Principales

- **Planificador Diario e Inteligente:** Organiza de forma automática las rutinas basándose en si es la fase de mañana, tarde o noche sin necesidad de configurar nada manualmente.
- **Control de Comidas en Tiempo Real:** Realiza el seguimiento de desayunos, almuerzos y cenas. Filtra por estudiantes prioritarios, pendientes o normales.
- **Gestión de Pensiones y Pagos:** Registro de personas, control de cuotas mensuales, estado de pago (al día, pendiente), fechas de corte y recordatorios por WhatsApp.
- **Registro y Edición Completa:** Agrega nuevas personas, edita datos de contacto, asigna horarios y materias semanales en cualquier momento.
- **Cálculo Automático de Autobuses:** Calcula la hora óptima para que cada estudiante tome el bus del hospedaje para llegar a tiempo a sus clases.
- **Notificaciones Híbridas (Web + Android):** En dispositivos móviles utiliza canales prioritarios de Capacitor; en la web utiliza notificaciones nativas de HTML5 y sonidos interactivos.
- **Integración con WhatsApp:** Genera automáticamente reportes inteligentes diarios de comidas y autobuses, y permite contactar a cada persona con un solo botón.
- **Persistencia en la Memoria del Dispositivo:** Guarda todos los datos en el teléfono con exportación e importación de copias de seguridad en formato JSON.

---

## Instalación y Desarrollo Local

Sigue estos sencillos pasos para descargar y ejecutar el proyecto en tu computadora:

### Requisitos Previos
- Tener instalado [Node.js](https://nodejs.org/) (versión 18 o superior recomendada).

### 1. Clonar e Instalar Dependencias
Una vez que descargues el código o lo clones de GitHub:
```bash
# Instalar los paquetes necesarios
npm install
```

### 2. Ejecutar en Modo de Desarrollo
Inicia el servidor local de prueba:
```bash
npm run dev
```
Abre en tu navegador `http://localhost:3000` para ver la aplicación web ejecutándose en tiempo real.

---

## Compilación para la Web (Producción)

Para compilar la aplicación en un paquete web de alto rendimiento optimizado y estático:

```bash
npm run build
```

Esto generará una carpeta llamada `dist/` con todos los archivos estáticos HTML, CSS y JS optimizados listos para ser subidos a cualquier servidor de alojamiento web gratuito.

### Opciones Populares de Despliegue Web Gratuito:
* **GitHub Pages:** Sube tu código a GitHub y activa la pestaña "Pages" en la configuración de tu repositorio apuntando a la carpeta de tu build.
* **Vercel / Netlify / Cloudflare Pages:** Simplemente arrastra la carpeta `dist/` o conecta directamente tu repositorio de GitHub para despliegues automáticos con cada actualización de tu código.

---

## Compilación para Android (Capacitor)

Si deseas empaquetar la aplicación en una app nativa `.apk` para dispositivos Android:

```bash
# Sincroniza la build web con el entorno nativo de Android
npm run cap:sync

# Abre el proyecto en Android Studio para probar en emulador o dispositivo real
npm run cap:open
```

---

## Instrucciones para subirlo a tu cuenta de GitHub

Sigue estos comandos paso a paso para publicar este proyecto en tu propio repositorio de GitHub:

1. Ingresa a [github.com](https://github.com) y crea un nuevo repositorio vacío. Ponle el nombre que quieras (por ejemplo, `gestor-comidas-horarios`).
2. Abre la terminal en la carpeta raíz de este proyecto y ejecuta los siguientes comandos:

```bash
# 1. Inicializar el repositorio local Git
git init

# 2. Agregar todos los archivos del proyecto al historial
git add .

# 3. Guardar tus cambios con un mensaje descriptivo
git commit -m "Initial commit: Gestor de Horarios y Comidas listo para la Web"

# 4. Cambiar el nombre de tu rama principal a 'main'
git branch -M main

# 5. Conectar tu repositorio local con tu nuevo repositorio en GitHub (Reemplaza la URL)
git remote add origin https://github.com/TU_USUARIO/TU_REPOSITORIO.git

# 6. Subir tus archivos a GitHub
git push -u origin main
```

¡Listo! Tu aplicación estará guardada y segura en tu cuenta de GitHub, permitiéndote compartirla o desplegarla fácilmente.

---

*Desarrollado para el Hospedaje Los Peces.*
