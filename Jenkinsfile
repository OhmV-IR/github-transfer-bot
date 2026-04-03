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
            }
        }
        
        stage("stash"){
            steps {
                stash name: 'build-output', includes: 'dist/**'
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
                unstash "build-output"
                sh "sudo cp -r dist /opt/github-issue-mover/"
                sh "sudo cp -r node_modules /opt/github-issue-mover/"
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
