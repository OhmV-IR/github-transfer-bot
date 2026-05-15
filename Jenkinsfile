pipeline {
    agent none
    
    tools {
        nodejs 'node20'
    }
    
    stages {
        stage("Build"){
            agent { label 'linux' }
            steps {
                checkout scm
                sh "npm i"
                sh "npm run build"
                stash name: 'dist-dir', includes: 'dist/**'
            }
        }

        stage("Build docker image"){
            agent { label 'docker-linux' }
            steps {
                checkout scm
                unstash 'dist-dir'
                sh "docker build -t github-transfer-bot:latest ."
                script {
                    if(env.BRANCH_NAME == 'main'){
                        sh "docker tag github-transfer-bot:latest registry.bgfamily.ca/github-transfer-bot:latest"
                        sh "docker push registry.bgfamily.ca/github-transfer-bot:latest"
                        sh "docker tag github-transfer-bot:latest ohmivr/github-transfer-bot:latest"
                        sh "docker push ohmivr/github-transfer-bot:latest"
                    }
                }
            }
        }
    }
    
    post {
        success {
            echo "ran successfully"
        }
        failure {
            echo "pipeline fail"
        }
    }
}
