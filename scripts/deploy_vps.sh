#!/bin/bash
# ==============================================================================
# Script d'installation et de déploiement automatique d'Atlas Carbone
# Cible : Serveur Ubuntu 22.04 / 24.04 LTS pour mesure-emissions.com
# ==============================================================================

set -e

DOMAIN="mesure-emissions.com"
APP_DIR="/var/www/atlas-carbone"

echo "=========================================================="
echo "🚀 Déploiement d'Atlas Carbone sur $DOMAIN"
echo "=========================================================="

# 1. Mise à jour des paquets système
echo "📦 Mise à jour du système..."
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl wget git nginx certbot python3-certbot-nginx ufw

# 2. Installation de Node.js 22 LTS
if ! command -v node &> /dev/null || [[ $(node -v | cut -d'.' -f1 | sed 's/v//') -lt 20 ]]; then
    echo "📦 Installation de Node.js 22 LTS..."
    curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
    sudo apt install -y nodejs
fi

echo "✅ Node.js version : $(node -v), npm version : $(npm -v)"

# 3. Préparation du répertoire applicatif
sudo mkdir -p $APP_DIR
sudo chown -R $USER:$USER $APP_DIR

echo "📂 Copie des fichiers applicatifs dans $APP_DIR..."
# Copie locale ou synchronisation rsync
if [ -d "./server" ]; then
    cp -r ./* $APP_DIR/
fi

# 4. Installation des dépendances et compilation
echo "🔨 Installation des dépendances du serveur..."
cd $APP_DIR/server
npm install --omit=dev

echo "🔨 Installation et compilation du frontend client..."
cd $APP_DIR/client
npm install
npm run build

# 5. Configuration des droits et du stockage persistant
sudo chown -R www-data:www-data $APP_DIR/server/data $APP_DIR/server/uploads
sudo chmod -R 775 $APP_DIR/server/data $APP_DIR/server/uploads

# 6. Installation du service systemd
echo "⚙️ Configuration du service systemd..."
sudo cp $APP_DIR/atlas-carbone.service /etc/systemd/system/atlas-carbone.service
sudo systemctl daemon-reload
sudo systemctl enable atlas-carbone
sudo systemctl restart atlas-carbone

# 7. Configuration de Nginx
echo "🌐 Configuration du serveur web Nginx..."
sudo cp $APP_DIR/nginx.conf /etc/nginx/sites-available/mesure-emissions.conf
sudo ln -sf /etc/nginx/sites-available/mesure-emissions.conf /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default

# Tester la configuration Nginx
sudo nginx -t && sudo systemctl reload nginx

# 8. Génération du certificat SSL Let's Encrypt
echo "🔒 Obtention du certificat SSL HTTPS pour $DOMAIN..."
sudo certbot --nginx -d $DOMAIN -d www.$DOMAIN --non-interactive --agree-tos -m abdelaziz.motiaa@gmail.com --redirect || {
    echo "⚠️ Attention : Le domaine $DOMAIN ne pointe peut-être pas encore sur cette adresse IP."
    echo "Veuillez mettre à jour les enregistrements DNS sur Spaceship d'abord."
}

# 9. Configuration du pare-feu UFW
sudo ufw allow 'Nginx Full'
sudo ufw allow OpenSSH
sudo ufw --force enable

echo "=========================================================="
echo "🎉 Déploiement terminé avec succès !"
echo "👉 Site disponible sur : https://$DOMAIN"
echo "=========================================================="
