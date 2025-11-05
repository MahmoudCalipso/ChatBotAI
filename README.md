Chatbot d'Analyse de Facture (Angular)

Ce projet est une application web Angular simulant un chatbot capable d'analyser des données de facture à partir de texte et de générer un aperçu PDF de la facture.

🚀 Démarrage Rapide avec Docker Compose

Pour exécuter cette application de manière isolée sans avoir à installer Node.js ou Angular CLI localement, utilisez Docker et Docker Compose.

Prérequis

Assurez-vous d'avoir installé sur votre machine :

Docker (inclut le Docker Engine et Docker CLI).

Docker Compose (souvent inclus avec les versions modernes de Docker Desktop).

⚙️ Configuration du Projet

Cloner le dépôt :

gh repo clone MahmoudCalipso/ChatBotAIit
cd ChatBotAIit


Fichiers Docker : Assurez-vous que les fichiers suivants existent à la racine de votre projet :

Dockerfile (Contient les étapes de build pour l'application Angular).

docker-compose.yml (Définit le service et le port d'exposition).

🏃 Exécuter l'Application

Utilisez la commande suivante pour construire l'image Docker de l'application Angular et démarrer le conteneur.

# L'option --build est nécessaire lors de la première exécution
# ou après des modifications du code source Angular.
docker-compose up --build


Commandes Utiles

Démarrer en arrière-plan :

docker-compose up -d


Arrêter l'application :

docker-compose down


🌐 Accéder à l'Application

L'application sera disponible dans votre navigateur à l'adresse suivante :

http://localhost:4200


Si ce port est déjà utilisé, Docker le mappera à un autre port. Vérifiez les logs de docker-compose up pour l'URL exacte.

🛠️ Développement Local (Sans Docker)

Si vous souhaitez développer l'application localement, suivez ces étapes :

Installez Node.js (version 18+ recommandée) et npm.

Installez les dépendances :

npm install


Lancez le serveur de développement :

ng serve


L'application se lancera également sur http://localhost:4200/.
