pipeline {
    agent { label 'windows' }
    
    tools {
        nodejs 'nodie20'
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
