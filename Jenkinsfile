pipeline {
    agent any

    // tools {
    //     nodejs 'Node21'
    // }

    environment {
        VERCEL_TOKEN      = credentials('vercel-token')
        GEMINI_API_KEY    = credentials('gemini-api-key')
        VERCEL_ORG_ID     = 'team_mzzxQ7xulqoiSC6i6y97uTZq'
        VERCEL_PROJECT_ID = 'prj_Rrxn0Gdn5qCQeu9UNzfBnHQJhjf2'
    }

    options {
        timestamps()
        buildDiscarder(logRotator(numToKeepStr: '10'))
    }

    stages {

        stage('Checkout') {
            steps {
                git branch: 'main',
                    url: 'https://github.com/Heshan01/GemStone.git',
                    credentialsId: 'github-creds'
            }
        }

        stage('Install & Lint') {
            steps {
                bat 'npm ci'
                bat 'npm run lint'
            }
        }

        stage('Docker Build Test (Local Validation Only)') {
            steps {
                bat 'docker compose build'
                bat 'docker compose up -d'
                bat 'timeout /t 8'
                bat 'curl -f http://localhost:8080'
                bat 'docker compose down'
            }
        }

        stage('Install Vercel CLI') {
            steps {
                bat 'npm install --global vercel@latest'
            }
        }

        stage('Deploy to Vercel (Production)') {
            steps {
                bat 'vercel pull --yes --environment=production --token=%VERCEL_TOKEN%'
                bat 'vercel build --prod --token=%VERCEL_TOKEN%'
                bat 'vercel deploy --prebuilt --prod --token=%VERCEL_TOKEN%'
            }
        }
    }

    post {
        success {
            echo '✅ GemWeb build validated locally + deployed to Vercel production!'
        }
        failure {
            echo '❌ Pipeline failed. Check console output.'
        }
        always {
            bat 'docker system prune -f'
        }
    }
}