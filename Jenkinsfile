pipeline {
    agent any

    environment {
        PATH = "/usr/local/bin:/opt/homebrew/bin:/Applications/Docker.app/Contents/Resources/bin:${env.PATH}"

        JWT_SECRET = credentials('jwt-secret')
    }

    stages {
        stage('Checkout') {
            steps {
                checkout scm
            }
        }

        stage('Check Docker') {
            steps {
                sh '''
                    docker --version
                    docker compose version
                '''
            }
        }

        stage('Create Environment') {
            steps {
                sh '''
                    cat > .env.jenkins <<EOF
JWT_SECRET=${JWT_SECRET}
EOF
                '''
            }
        }

        stage('Stop Old Containers') {
            steps {
                sh '''
                    docker compose down --remove-orphans || true
                '''
            }
        }

        stage('Build Images') {
            steps {
                sh '''
                    docker compose build --no-cache
                '''
            }
        }

        stage('Deploy Containers') {
            steps {
                sh '''
                    docker compose --env-file .env.jenkins up -d
                '''
            }
        }

        stage('Check Containers') {
            steps {
                sh '''
                    docker compose ps
                '''
            }
        }

        stage('Health Check Backend') {
            steps {
                sh '''
                    echo "Waiting for backend..."

                    for i in $(seq 1 15); do
                        if curl -f http://localhost:5001/health; then
                            echo "Backend is healthy"
                            exit 0
                        fi

                        echo "Backend not ready. Attempt $i/15"
                        sleep 5
                    done

                    echo "Backend health check failed"
                    docker compose logs backend
                    exit 1
                '''
            }
        }

        stage('Health Check Frontend') {
            steps {
                sh '''
                    curl -f http://localhost:5173
                '''
            }
        }
    }

    post {
        success {
            echo 'Deployment berhasil'
        }

        failure {
            echo 'Deployment gagal'

            sh '''
                docker compose ps || true
                docker compose logs --tail=100 || true
            '''
        }

        always {
            sh '''
                rm -f .env.jenkins
                docker image prune -f
            '''
        }
    }
}