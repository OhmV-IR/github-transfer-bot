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

        stage("lint"){
            steps {
                bat "npx eslint ."
            }
        }
        
        stage("stash"){
            steps {
                stash name: 'build-output', includes: 'dist/**'
            }
        }

        stage("deploy"){
            agent { label "pideploytarget" }
            steps {
                withCredentials([
                    string(credentialsId: 'DISCORD_TOKEN', variable: 'DISCORD_TOKEN'),
                    string(credentialsId: 'GITHUB_TOKEN', variable: 'GITHUB_TOKEN'),
                    string(credentialsId: 'CLIENT_ID', variable: 'CLIENT_ID')
                ]) {
                    sh """
                        [ -f /opt/github-transfer-bot/.env ] && rm /opt/github-transfer-bot/.env
                        {
                            echo "GITHUB_TOKEN=$GITHUB_TOKEN"
                            echo "DISCORD_TOKEN=$DISCORD_TOKEN"
                            echo "CLIENT_ID=$CLIENT_ID"
                        } >> .env
                    """
                }
                unstash "build-output"
                sh "cp -r dist /opt/github-issue-mover/"
                sh "sudo systemctl reload-or-restart issuemover"
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
