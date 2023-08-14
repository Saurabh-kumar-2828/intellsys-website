pipeline {
    agent any
    environment {
        REPOSITORY_NAME='intellsys-website'
        DockerUser="growthjockey"
        AWS_ACCOUNT_ID="048578456468"
        AWS_DEFAULT_REGION="ap-south-1"
        REPOSITORY_URI = "048578456468.dkr.ecr.us-east-1.amazonaws.com/env.BRANCH_NAME"
    }

    stages {
        stage('Logging into AWS ECR') {
            steps {
                script {
                    sh "sudo aws ecr get-login-password --region ap-south-1 | docker login --username AWS --password-stdin 048578456468.dkr.ecr.ap-south-1.amazonaws.com"
                }
            }
        }
    

        stage('Cloning Git website') {
            steps {
                git branch: env.BRANCH_NAME, credentialsId: '33c357dc-5f11-4930-9063-07bc866f7cff', url: 'https://github.com/GrowthJockey/intellsys-website.git'
            }
        }
    
        stage('Building image') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        withCredentials([usernamePassword(credentialsId: '9831574e-4c5c-4476-b75b-0924dfb662dd', passwordVariable: 'DockerCredentials', usernameVariable: 'DockerUser')]) { 
                            sh "docker login -u growthjockey -p ${DockerCredentials}"
                            sh "docker build --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-stage -t intellsys-stage-final:latest ."
                            } 
                    }
                    else if (env.BRANCH_NAME == 'prod') {
                        withCredentials([usernamePassword(credentialsId: '9831574e-4c5c-4476-b75b-0924dfb662dd', passwordVariable: 'DockerCredentials', usernameVariable: 'DockerUser')]) {
                            sh "docker login -u growthjockey -p ${DockerCredentials}"
                            sh "docker build --build-arg BASE_IMAGE=048578456468.dkr.ecr.ap-south-1.amazonaws.com/base-images:intellsys-prod-final -t intellsys-prod:latest ."
                            } 
                        }
                    }
                }
            }
        
        stage('Pushing to ECR') {
            steps{
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        sh "docker tag intellsys-stage:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                        sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:${env.BUILD_ID}"
                    } 

                    else if (env.BRANCH_NAME == 'prod') {
                        sh "docker tag intellsys-prod:latest 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                        sh "docker push 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:${env.BUILD_ID}"
                    }
                }
            }
        }
        
       stage('Docker') {
            steps {
                script {
                    if (env.BRANCH_NAME == 'staging') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                            def commandOutput = sh(script: "ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker ps -a | grep intellsys-fallback | wc -l'", returnStdout: true).trim()
                            def count = commandOutput.toInteger()
                            if (count == 1) {
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                            }  
                            else {
                                    echo "no container"
                                    }
                                }
                            }
                    else if (env.BRANCH_NAME == 'prod') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea']) {
                            def commandOutput = sh(script: "ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker ps -a | grep intellsys-fallback | wc -l'", returnStdout: true).trim()
                            def count = commandOutput.toInteger()
                            if (count == 1) {
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo su'"""
                                sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                            }  
                            else {
                                echo 'No containers found.'
                                }
                            }
                        }    
                    }
                }
            }
        
        stage('Deploy on k8') {
            steps {
              script{
                 if (env.BRANCH_NAME == 'staging') {
                    sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3001:3000 --name intellsys-fallback  048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3001)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3000~http://localhost:3001~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-container'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name intellsys-container 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-stage:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3000)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3001~http://localhost:3000~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-13-126-188-129.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                        } 
                    }
                else if (env.BRANCH_NAME == 'prod') {
                        sshagent(['f74f1a2f-5c3d-49e4-a0e5-646f8d9e87ea'])  {
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker pull 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3001:3000 --name intellsys-fallback 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3001)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3000~http://localhost:3001~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-container'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker run -d -p 3000:3000 --name intellsys-container 048578456468.dkr.ecr.ap-south-1.amazonaws.com/intellsys-prod:$BUILD_ID'"""
                        sh '''
                        ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com \
                        \'while [[ "$(curl -vL -s -o /dev/null -w "%{http_code}" localhost:3000)" -ne 200 ]]; do sleep 1; done\'
                        '''
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo sed -i s~http://localhost:3001~http://localhost:3000~g /etc/nginx/sites-enabled/default'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo nginx -s reload'"""
                        sh """ssh -o StrictHostKeyChecking=no ubuntu@ec2-3-6-162-95.ap-south-1.compute.amazonaws.com 'sudo docker rm -f intellsys-fallback'"""
                        }
                    }
                }
            }
        }
    }
}
  
