pipeline {
    agent any

    environment {
        VERCEL_TOKEN     = credentials('vercel-token')
        GEMINI_API_KEY   = credentials('gemini-api-key')
        VERCEL_ORG_ID    = 'team_mzzxQ7xulqoiSC6i6y97uTZq'
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
                sh 'npm ci'
                sh 'npm run lint'
            }
        }

        stage('Docker Build Test (Local Validation Only)') {
            steps {
                sh 'docker compose build'
                sh 'docker compose up -d'
                sh 'sleep 5 && curl -f http://localhost:8080 || (docker compose logs && exit 1)'
                sh 'docker compose down'
            }
        }

        stage('Install Vercel CLI') {
            steps {
                sh 'npm install --global vercel@latest'
            }
        }

        stage('Deploy to Vercel (Production)') {
            steps {
                sh '''
                    vercel pull --yes --environment=production --token=$VERCEL_TOKEN
                    vercel build --prod --token=$VERCEL_TOKEN
                    vercel deploy --prebuilt --prod --token=$VERCEL_TOKEN
                '''
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
            sh 'docker system prune -f || true'
        }
    }
}