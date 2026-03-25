# SIDERMI - Automatizacion con Ansible

Este directorio contiene los playbooks de Ansible para automatizar el despliegue
de SIDERMI en nuevos servidores.

## Requisitos Previos

### En tu maquina local:
```bash
# Instalar Ansible
pip install ansible

# O en Ubuntu/Debian
sudo apt install ansible
```

### En el servidor destino:
- Ubuntu Server 22.04 o 24.04
- Acceso SSH con usuario que tenga sudo
- Minimo 4GB RAM, 2 CPU, 50GB disco

## Estructura de Archivos

```
deploy/ansible/
├── inventory.yml          # Inventario de servidores
├── playbook.yml           # Playbook principal
├── group_vars/
│   └── all.yml           # Variables globales
└── roles/
    ├── common/           # Herramientas basicas + firewall
    ├── nodejs/           # Node.js + PM2
    ├── mongodb/          # MongoDB
    ├── sidermi/          # Aplicacion SIDERMI
    └── nginx/            # Nginx reverse proxy
```

## Uso Rapido

### 1. Preparar el servidor

Asegurate de tener acceso SSH al servidor:
```bash
ssh usuario@IP_DEL_SERVIDOR
```

### 2. Configurar el inventario

Edita `inventory.yml` y agrega tu servidor:
```yaml
sidermi_servers:
  hosts:
    mi_sede:
      ansible_host: 10.90.X.X      # IP del servidor
      ansible_user: usuario         # Usuario SSH
      server_name: "SIDERMI Mi Sede"
```

### 3. Ejecutar el despliegue

```bash
cd deploy/ansible

# Desplegar en todos los servidores
ansible-playbook -i inventory.yml playbook.yml

# Desplegar solo en un servidor especifico
ansible-playbook -i inventory.yml playbook.yml --limit mi_sede

# Modo verbose para ver el progreso
ansible-playbook -i inventory.yml playbook.yml -v
```

### 4. Verificar el despliegue

Accede a `http://IP_DEL_SERVIDOR` en tu navegador.

Credenciales por defecto:
- **Admin:** admin / utn2026
- **Registro:** registro / registro2026

## Agregar Nueva Sede

1. Edita `inventory.yml`:
```yaml
sede_nueva:
  ansible_host: 10.91.30.50
  ansible_user: sidermi
  server_name: "SIDERMI Sede Nueva"
```

2. Ejecuta el playbook:
```bash
ansible-playbook -i inventory.yml playbook.yml --limit sede_nueva
```

## Variables Personalizables

Puedes crear archivos en `host_vars/` para variables especificas por servidor:

```yaml
# host_vars/sede_nueva.yml
jwt_secret: "mi_clave_secreta_unica"
document_encryption_key: "mi_clave_cifrado_unica"
smtp_host: "smtp.misede.com"
```

## Seguridad

### Claves de Seguridad
Por defecto, el playbook genera claves aleatorias. Para usar claves personalizadas:

```bash
# Generar claves seguras
openssl rand -hex 32  # Para JWT_SECRET
openssl rand -hex 32  # Para DOCUMENT_ENCRYPTION_KEY
```

### Firewall
El firewall UFW se configura automaticamente para permitir solo acceso desde la red local (10.90.0.0/16).

Para cambiar esto, edita `group_vars/all.yml`:
```yaml
allowed_network: "10.91.0.0/16"  # Tu red
```

## Comandos Utiles en el Servidor

```bash
# Ver estado de servicios
pm2 list
sudo systemctl status nginx mongod

# Ver logs
pm2 logs sidermi-backend
sudo tail -f /var/log/nginx/error.log

# Reiniciar servicios
pm2 restart sidermi-backend
sudo systemctl restart nginx

# Actualizar aplicacion
cd ~/sidermi
git pull
cd server && npm install && npm run build
cd ../client && npm install && npm run build
pm2 restart sidermi-backend
```

## Troubleshooting

### Error de conexion SSH
```bash
# Verificar conectividad
ping IP_SERVIDOR
ssh -v usuario@IP_SERVIDOR
```

### Error de permisos
```bash
# En el servidor, asegurar permisos
chmod 755 /home/sidermi
chmod -R 755 /home/sidermi/sidermi/client/dist
```

### Backend no responde
```bash
# Ver logs
pm2 logs sidermi-backend --lines 50

# Reiniciar
pm2 restart sidermi-backend
```

## Soporte

Para problemas o preguntas, contactar al equipo de TI de la UTN.
