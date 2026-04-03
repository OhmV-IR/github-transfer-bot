pipeline {
    agent { label 'windows' }
    
    tools {
        nodejs 'node20'
    }
    
    stages {
        stage("Checkout") {
            steps {
                checkout scm
            }
        }
        
        stage("deps"){
            steps {
                bat "npm ci"
            }
        }

        stage("build"){
            steps {
                bat "npm run build"
                bat "tar -a -c -f build.tar.gz dist node_modules"
            }
        }

        stage("deploy"){
            agent { label "pideploytarget" }
            when {
                branch 'main'
            }
            steps {
                checkout scm
                withCredentials([
                    file(credentialsId: 'ENV_FILE', variable: 'ENV_FILE')
                ]) {
                    sh """
                        rm -f /opt/github-transfer-bot/.env
                        cp ${ENV_FILE} .env
                    """
                }
                sh "npm ci"
                sh "npm run build"
                sh "sudo systemctl stop --quiet issuemover"
                sh "sudo cp -r . /opt/github-transfer-bot/"
                sh "sudo systemctl start issuemover"
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
