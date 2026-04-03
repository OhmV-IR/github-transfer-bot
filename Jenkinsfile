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
                bat "powershell Compress-Archive -Path dist, node_modules -Destination build.zip -Force"
            }
        }
        
        stage("stash"){
            steps {
                stash name: 'pkg', includes: 'build.zip'
            }
        }

        stage("deploy"){
            agent { label "pideploytarget" }
            when {
                branch 'main'
            }
            steps {
                withCredentials([
                    file(credentialsId: 'ENV_FILE', variable: 'ENV_FILE')
                ]) {
                    sh """
                        rm -f /opt/github-transfer-bot/.env
                        cp ${ENV_FILE} /opt/github-transfer-bot/.env
                    """
                }
                unstash "pkg"
                sh "sudo unzip build.zip -d /opt/github-issue-mover/"
                sh "sudo systemctl reload-or-restart issuemover"
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
