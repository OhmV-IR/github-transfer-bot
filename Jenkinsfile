pipeline {
    agent none
    
    stages {
        stage("Build"){
            agent { label 'linux' }
            tools {
                nodejs 'node20'
            }
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
			withCredentials([usernamePassword(
				credentialsId: 'docker_server_priv_registry',
				usernameVariable: 'DOCKER_PRIV_USER',
				passwordVariable: 'DOCKER_PRIV_PASS'
			)]) {
				sh '''
					echo "$DOCKER_PRIV_PASS" | docker login localhost:5000 -u "$DOCKER_PRIV_USER" --password-stdin
				'''
                        	sh "docker tag github-transfer-bot:latest localhost:5000/github-transfer-bot:latest"
                        	sh "docker push localhost:5000/github-transfer-bot:latest"
				sh "docker logout localhost:5000"
			}
			withCredentials([usernamePassword(
				credentialsId: 'docker_public_registry',
				usernameVariable: 'DOCKER_PUBLIC_USER',
				passwordVariable: 'DOCKER_PUBLIC_PASS'
			)]){
				sh '''
					echo "$DOCKER_PUBLIC_PASS" | docker login -u "$DOCKER_PUBLIC_USER" --password-stdin
				'''
                        	sh "docker tag github-transfer-bot:latest ohmivr/github-transfer-bot:latest"
                        	sh "docker push ohmivr/github-transfer-bot:latest"
				sh "docker logout"
			}
                    }
                }
            }
        }
    }
}
